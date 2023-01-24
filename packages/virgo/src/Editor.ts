import type * as Y from 'yjs';
import {
  EDITOR_ROOT_CLASS,
  TEXT_CLASS,
  TEXT_LINE_CLASS,
  ZERO_WIDTH_SPACE,
} from './constant.js';
import { caretRangeFromPoint, Signal } from '@blocksuite/global/utils';
import { render } from 'lit-html';
import type {
  BaseArrtiubtes,
  DeltaInsert,
  DeltaInserts,
  TextAttributes,
} from './types.js';
import { VirgoLine } from './components/virgo-line.js';
import { renderElement } from './utils/render-element.js';
import { deltaInsersToChunks } from './utils.js';
import { VirgoText } from './components/virgo-text.js';

const ZERO_WIDTH_SPACE_DELTA: DeltaInsert<BaseArrtiubtes> = {
  insert: ZERO_WIDTH_SPACE,
  attributes: { type: 'base' },
};

// TODO left right
export interface RangeStatic {
  index: number;
  length: number;
}

export interface DomPoint {
  // which text node this point is in
  text: Text;
  // the index here is relative to the Editor, not text node
  index: number;
}

export type UpdateRangeStaticProp = [
  RangeStatic | null,
  'native' | 'input' | 'other'
];
export interface TextEditorSignals {
  updateRangeStatic: Signal<UpdateRangeStaticProp>;
}

export class TextEditor {
  private _rootElement: HTMLElement;
  private _yText: Y.Text;
  private _rangeStatic: RangeStatic | null = null;
  private _signals: TextEditorSignals;
  private _isComposing = false;
  private _selectionLock = false;

  id: string;

  constructor(
    id: string,
    rootElement: TextEditor['_rootElement'],
    yText: TextEditor['_yText'],
    signals: Pick<TextEditorSignals, 'updateRangeStatic'>
  ) {
    this.id = id;
    this._rootElement = rootElement;
    this._yText = yText;
    this._signals = { ...signals };

    this._rootElement.replaceChildren();
    this._rootElement.contentEditable = 'true';
    this._rootElement.classList.add(EDITOR_ROOT_CLASS);
    this._rootElement.style.display = 'block';

    const deltas = this._yText.toDelta() as DeltaInserts;
    const chunks = deltaInsersToChunks(deltas);

    // every chunk is a line
    for (const chunk of chunks) {
      if (chunk.length === 0) {
        render(
          VirgoLine([VirgoText(ZERO_WIDTH_SPACE_DELTA)]),
          this._rootElement
        );
      } else {
        render(VirgoLine(chunk.map(d => renderElement(d))), this._rootElement);
      }
    }

    document.addEventListener(
      'selectionchange',
      this._onSelectionChange.bind(this)
    );
    document.addEventListener('selectstart', this._onSelectStart.bind(this));

    this._rootElement.addEventListener(
      'beforeinput',
      this._onBefoeInput.bind(this)
    );
    this._rootElement.querySelectorAll(`.${TEXT_CLASS}`).forEach(textNode => {
      textNode.addEventListener('dragstart', event => {
        event.preventDefault();
      });
    });

    this._rootElement.addEventListener(
      'compositionstart',
      this._onCompositionStart.bind(this)
    );
    this._rootElement.addEventListener(
      'compositionend',
      this._onCompositionEnd.bind(this)
    );

    yText.observe(this._onYTextChange.bind(this));

    this._signals.updateRangeStatic.on(this._onUpdateRangeStatic.bind(this));
  }

  getDeltaByRangeIndex(rangeIndex: RangeStatic['index']): DeltaInsert | null {
    const deltas = this._yText.toDelta() as DeltaInserts;

    let index = 0;
    for (let i = 0; i < deltas.length; i++) {
      const delta = deltas[i];
      if (index + delta.insert.length >= rangeIndex) {
        return delta;
      }
      index += delta.insert.length;
    }

    return null;
  }

  getRootElement(): HTMLElement {
    return this._rootElement;
  }

  getRangeStatic(): RangeStatic | null {
    return this._rangeStatic;
  }

  setRangeStatic(rangeStatic: RangeStatic): void {
    this._signals.updateRangeStatic.emit([rangeStatic, 'other']);
  }

  deleteText(rangeStatic: RangeStatic): void {
    this._yText.delete(rangeStatic.index, rangeStatic.length);
  }

  insertText(rangeStatic: RangeStatic, text: string): void {
    const currentDelta = this.getDeltaByRangeIndex(rangeStatic.index);
    this._yText.delete(rangeStatic.index, rangeStatic.length);

    if (
      rangeStatic.index > 0 &&
      currentDelta &&
      currentDelta.attributes.type !== 'line-break'
    ) {
      this._yText.insert(rangeStatic.index, text, currentDelta.attributes);
    } else {
      this._yText.insert(rangeStatic.index, text, { type: 'base' });
    }
  }

  insertLineBreak(rangeStatic: RangeStatic): void {
    this._yText.delete(rangeStatic.index, rangeStatic.length);
    this._yText.insert(rangeStatic.index, '\n', { type: 'line-break' });
  }

  // TODO avoid format line break
  formatText(rangeStatic: RangeStatic, attributes: TextAttributes): void {
    this._yText.format(rangeStatic.index, rangeStatic.length, attributes);
  }

  resetText(rangeStatic: RangeStatic): void {
    const coverDeltas: DeltaInserts = [];
    for (
      let i = rangeStatic.index;
      i <= rangeStatic.index + rangeStatic.length;
      i++
    ) {
      const delta = this.getDeltaByRangeIndex(i);
      if (delta) {
        coverDeltas.push(delta);
      }
    }

    const unset = Object.fromEntries(
      coverDeltas.flatMap(delta =>
        Object.keys(delta.attributes).map(key => [key, null])
      )
    );

    this._yText.format(rangeStatic.index, rangeStatic.length, {
      ...unset,
      type: 'base',
    });
  }

  /**
   * calculate the dom selection from rangeStatic for **this Editor**
   */
  toDomRange(rangeStatic: RangeStatic): Range | null {
    const lineElements = Array.from(
      this._rootElement.querySelectorAll(`.${TEXT_LINE_CLASS}`)
    );

    // calculate anchorNode and focusNode
    let anchorText: Text | null = null;
    let focusText: Text | null = null;
    let anchorOffset = 0;
    let focusOffset = 0;
    let index = 0;
    for (let i = 0; i < lineElements.length; i++) {
      const textElements = Array.from(
        lineElements[i].querySelectorAll(`.${TEXT_CLASS}`)
      );

      for (let j = 0; j < textElements.length; j++) {
        const textNode = getTextNodeFromElement(textElements[j]);
        if (!textNode) {
          return null;
        }

        const textLength = calculateTextLength(textNode);

        if (!anchorText && index + textLength >= rangeStatic.index) {
          anchorText = textNode;
          anchorOffset = rangeStatic.index - index;
        }
        if (
          !focusText &&
          index + textLength >= rangeStatic.index + rangeStatic.length
        ) {
          focusText = textNode;
          focusOffset = rangeStatic.index + rangeStatic.length - index;
        }

        index += textLength;
      }

      // the one becasue of the line break
      index += 1;
    }

    if (!anchorText || !focusText) {
      return null;
    }

    const range = document.createRange();
    range.setStart(anchorText, anchorOffset);
    range.setEnd(focusText, focusOffset);
    return range;
  }

  /**
   * calculate the rangeStatic from dom selection for **this Editor**
   * there are three cases when the rangeStatic of this Editor is not null:
   * (In the following, "|" mean anchor and focus, each line is a separate Editor)
   * 1. anchor and focus are in this Editor
   *    aaaaaa
   *    b|bbbb|b
   *    cccccc
   *    the rangeStatic of second Editor is {index: 1, length: 4}, the others are null
   * 2. anchor and focus one in this Editor, one in another Editor
   *    aaa|aaa    aaaaaa
   *    bbbbb|b or bbbbb|b
   *    cccccc     cc|cccc
   *    2.1
   *        the rangeStatic of first Editor is {index: 3, length: 3}, the second is {index: 0, length: 5},
   *        the third is null
   *    2.2
   *        the rangeStatic of first Editor is null, the second is {index: 0, length: 5},
   *        the third is {index: 0, length: 2}
   * 3. anchor and focus are in another Editor
   *    aa|aaaa
   *    bbbbbb
   *    cccc|cc
   *    the rangeStatic of first Editor is {index: 2, length: 4},
   *    the second is {index: 0, length: 6}, the third is {index: 0, length: 4}
   */
  toRangeStatic(selection: Selection): RangeStatic | null {
    const { anchorNode, anchorOffset, focusNode, focusOffset, isCollapsed } =
      selection;
    if (!anchorNode || !focusNode) {
      return null;
    }

    let anchorText: Text | null = null;
    let anchorTextOffset = anchorOffset;
    let focusText: Text | null = null;
    let focusTextOffset = focusOffset;

    if (anchorNode instanceof Text && ifVirgoText(anchorNode)) {
      anchorText = anchorNode;
      anchorTextOffset = anchorOffset;
    }
    if (focusNode instanceof Text && ifVirgoText(focusNode)) {
      focusText = focusNode;
      focusTextOffset = focusOffset;
    }

    if (isCollapsed) {
      const rect = selection.getRangeAt(0).getBoundingClientRect();
      const range = caretRangeFromPoint(rect.x, rect.y);

      if (
        range &&
        range.startContainer instanceof Text &&
        ifVirgoText(range.startContainer)
      ) {
        anchorText = range.startContainer as Text;
        anchorTextOffset = range.startOffset;
      }

      if (
        range &&
        range.endContainer instanceof Text &&
        ifVirgoText(range.endContainer)
      ) {
        focusText = range.endContainer as Text;
        focusTextOffset = range.endOffset;
      }
    }

    // case 1
    if (anchorText && focusText) {
      const anchorDomPoint = textPointToDomPoint(
        anchorText,
        anchorTextOffset,
        this._rootElement
      );
      const focusDomPoint = textPointToDomPoint(
        focusText,
        focusTextOffset,
        this._rootElement
      );

      if (!anchorDomPoint || !focusDomPoint) {
        return null;
      }

      return {
        index: Math.min(anchorDomPoint.index, focusDomPoint.index),
        length: Math.abs(anchorDomPoint.index - focusDomPoint.index),
      };
    }

    // case 2
    if (anchorText && !focusText) {
      const anchorDomPoint = textPointToDomPoint(
        anchorText,
        anchorTextOffset,
        this._rootElement
      );

      if (!anchorDomPoint) {
        return null;
      }

      if (isSelectionBackwards(selection)) {
        return {
          index: 0,
          length: anchorDomPoint.index,
        };
      } else {
        return {
          index: anchorDomPoint.index,
          length: anchorDomPoint.text.wholeText.length - anchorDomPoint.index,
        };
      }
    }

    // case 2
    if (!anchorText && focusText) {
      const focusDomPoint = textPointToDomPoint(
        focusText,
        focusTextOffset,
        this._rootElement
      );

      if (!focusDomPoint) {
        return null;
      }

      if (isSelectionBackwards(selection)) {
        return {
          index: focusDomPoint.index,
          length: focusDomPoint.text.wholeText.length - focusDomPoint.index,
        };
      } else {
        return {
          index: 0,
          length: focusDomPoint.index,
        };
      }
    }

    // case 3
    if (
      !anchorText &&
      !focusText &&
      selection.containsNode(this._rootElement)
    ) {
      return {
        index: 0,
        length: this._yText.length,
      };
    }

    return null;
  }

  private _onBefoeInput(event: InputEvent): void {
    event.preventDefault();

    if (!this._rangeStatic) {
      return;
    }

    const { inputType, data } = event;

    if (inputType === 'insertText' && this._rangeStatic.index >= 0 && data) {
      this.insertText(this._rangeStatic, data);

      this._signals.updateRangeStatic.emit([
        {
          index: this._rangeStatic.index + data.length,
          length: 0,
        },
        'input',
      ]);
    } else if (
      inputType === 'insertParagraph' &&
      this._rangeStatic.index >= 0
    ) {
      this.insertLineBreak(this._rangeStatic);

      this._signals.updateRangeStatic.emit([
        {
          index: this._rangeStatic.index + 1,
          length: 0,
        },
        'input',
      ]);
    } else if (
      inputType === 'deleteContentBackward' &&
      this._rangeStatic.index >= 0
    ) {
      if (this._rangeStatic.length > 0) {
        this.deleteText(this._rangeStatic);

        this._signals.updateRangeStatic.emit([
          {
            index: this._rangeStatic.index,
            length: 0,
          },
          'input',
        ]);
      } else if (this._rangeStatic.index > 0) {
        // https://dev.to/acanimal/how-to-slice-or-get-symbols-from-a-unicode-string-with-emojis-in-javascript-lets-learn-how-javascript-represent-strings-h3a
        const tmpString = this._yText
          .toString()
          .slice(0, this._rangeStatic.index);
        const deletedChracater = [...tmpString].slice(-1).join('');
        this.deleteText({
          index: this._rangeStatic.index - deletedChracater.length,
          length: deletedChracater.length,
        });

        this._signals.updateRangeStatic.emit([
          {
            index: this._rangeStatic.index - deletedChracater.length,
            length: 0,
          },
          'input',
        ]);
      }
    }
  }

  private _onCompositionStart(): void {
    this._isComposing = true;
  }

  private _onCompositionEnd(event: CompositionEvent): void {
    this._isComposing = false;

    if (!this._rangeStatic) {
      return;
    }

    const { data } = event;

    if (this._rangeStatic.index >= 0 && data) {
      this.insertText(this._rangeStatic, data);

      this._signals.updateRangeStatic.emit([
        {
          index: this._rangeStatic.index + data.length,
          length: 0,
        },
        'input',
      ]);
    }
  }

  private _onYTextChange(): void {
    const deltas = (this._yText.toDelta() as DeltaInserts).flatMap(d => {
      if (d.attributes.type === 'line-break') {
        return d.insert
          .split('')
          .map(c => ({ insert: c, attributes: d.attributes }));
      }
      return d;
    }) as DeltaInserts;
    const chunks = deltaInsersToChunks(deltas);

    // every chunk is a line
    const lines: Array<ReturnType<typeof VirgoLine>> = [];
    for (const chunk of chunks) {
      if (chunk.length === 0) {
        lines.push(VirgoLine([VirgoText(ZERO_WIDTH_SPACE_DELTA)]));
      } else {
        lines.push(VirgoLine(chunk.map(d => renderElement(d))));
      }
    }
    render(lines, this._rootElement);
  }

  private _onSelectionChange(): void {
    if (this._isComposing || this._selectionLock) {
      return;
    }

    const selection = window.getSelection();

    if (!selection) {
      return;
    }

    if (selection.rangeCount === 0) {
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const { anchorNode, anchorOffset, focusNode, focusOffset } = selection;

    if (
      !this._rootElement.contains(anchorNode) ||
      !this._rootElement.contains(focusNode)
    ) {
      return;
    }

    const caretRange = caretRangeFromPoint(rect.x, rect.y);

    let isNative = false;
    if (
      !selection.isCollapsed ||
      (anchorNode &&
        focusNode &&
        caretRange &&
        caretRange.startContainer === anchorNode &&
        caretRange.startOffset === anchorOffset &&
        caretRange.endContainer === focusNode &&
        caretRange.endOffset === focusOffset)
    ) {
      isNative = true;
    }

    const rangeStatic = this.toRangeStatic(selection);
    if (rangeStatic) {
      this._signals.updateRangeStatic.emit([
        rangeStatic,
        isNative ? 'native' : 'other',
      ]);
    }
  }

  private _onSelectStart(): void {
    this._selectionLock = false;
  }

  private _onUpdateRangeStatic([
    newRangStatic,
    origin,
  ]: UpdateRangeStaticProp): void {
    this._rangeStatic = newRangStatic;
    if (this._rangeStatic && origin !== 'native') {
      const newRange = this.toDomRange(this._rangeStatic);
      if (newRange) {
        const selection = window.getSelection();
        if (selection) {
          // prevent selection change event handler execute
          this._selectionLock = true;

          selection.removeAllRanges();
          selection.addRange(newRange);
        }
      }
    }
  }
}

function textPointToDomPoint(
  text: Text,
  offset: number,
  rootElement: HTMLElement
): DomPoint | null {
  if (!rootElement.classList.contains(EDITOR_ROOT_CLASS)) {
    throw new Error(
      'textRangeToDomPoint should be called with editor root element'
    );
  }

  if (!rootElement.contains(text)) {
    throw new Error('text is not in root element');
  }

  const textNodes = Array.from(
    rootElement.querySelectorAll(`.${TEXT_CLASS}`)
  ).map(textElement => getTextNodeFromElement(textElement));
  const goalIndex = textNodes.indexOf(text);
  let index = 0;
  for (const textNode of textNodes.slice(0, goalIndex)) {
    if (!textNode) {
      return null;
    }

    index += calculateTextLength(textNode);
  }

  if (text.wholeText !== ZERO_WIDTH_SPACE) {
    index += offset;
  }

  const textElement = text.parentElement;
  if (!textElement) {
    throw new Error('text element not found');
  }

  const lineElement = text.parentElement.closest(`.${TEXT_LINE_CLASS}`);

  if (!lineElement) {
    throw new Error('line element not found');
  }

  const lineIndex = Array.from(
    rootElement.querySelectorAll(`.${TEXT_LINE_CLASS}`)
  ).indexOf(lineElement);

  return { text, index: index + lineIndex };
}

function isSelectionBackwards(selection: Selection): boolean {
  let backwards = false;
  if (!selection.isCollapsed && selection.anchorNode && selection.focusNode) {
    const range = document.createRange();
    range.setStart(selection.anchorNode, selection.anchorOffset);
    range.setEnd(selection.focusNode, selection.focusOffset);
    backwards = range.collapsed;
    range.detach();
  }
  return backwards;
}

function calculateTextLength(text: Text): number {
  if (text.wholeText === ZERO_WIDTH_SPACE) {
    return 0;
  } else {
    return text.wholeText.length;
  }
}

function getTextNodeFromElement(element: Element): Text | null {
  const textNode = Array.from(element.childNodes).find(
    node => node instanceof Text
  );

  if (textNode) {
    return textNode as Text;
  }
  return null;
}

function ifVirgoText(text: Text): boolean {
  return text.parentElement?.classList.contains(TEXT_CLASS) ?? false;
}
