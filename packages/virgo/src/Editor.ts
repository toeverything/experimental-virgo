import type * as Y from 'yjs';
import {
  EDITOR_ROOT_CLASS,
  TEXT_CLASS,
  TEXT_LINE_CLASS,
  ZERO_WIDTH_SPACE,
} from './constant.js';
import { Signal } from '@blocksuite/global/utils';
import { render } from 'lit-html';
import type { DeltaInserts } from './types.js';
import { VirgoLine } from './components/virgo-line.js';
import { renderElement } from './utils/render-element.js';
import { deltaInsersToChunks } from './utils.js';
import { VirgoText } from './components/virgo-text.js';

// TODO left right
export interface RangeStatic {
  index: number;
  length: number;
}

export interface PointStatic {
  // which text node this point is in
  text: Text;
  // the index here is relative to the Editor, not text node
  index: number;
}

export type UpdateRangeStaticProp = [
  RangeStatic | null,
  'native' | 'input' | 'outside'
];
export interface TextEditorSignals {
  updateRangeStatic: Signal<UpdateRangeStaticProp>;
  updateFocusState: Signal<boolean>;
}

export class TextEditor {
  private _rootElement: HTMLElement;
  private _yText: Y.Text;
  private _rangeStatic: RangeStatic | null = null;
  private _signals: TextEditorSignals;
  private _isComposing = false;

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
    this._signals = { ...signals, updateFocusState: new Signal() };

    this._rootElement.replaceChildren();
    this._rootElement.contentEditable = 'true';
    this._rootElement.classList.add(EDITOR_ROOT_CLASS);
    this._rootElement.style.display = 'block';

    const deltas = this._yText.toDelta() as DeltaInserts;
    const chunks = deltaInsersToChunks(deltas);

    // every chunk is a line
    for (const chunk of chunks) {
      if (chunk.length === 0) {
        render(VirgoLine([VirgoText(ZERO_WIDTH_SPACE)]), this._rootElement);
      } else {
        render(
          VirgoLine(chunk.map(d => renderElement(d.attributes.type, d))),
          this._rootElement
        );
      }
    }

    document.addEventListener(
      'selectionchange',
      this._onSelectionChange.bind(this)
    );

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
    this._rootElement.addEventListener('focus', this._onFocus.bind(this));
    this._rootElement.addEventListener('blur', this._onBlur.bind(this));

    yText.observe(this._onYTextChange.bind(this));

    this._signals.updateRangeStatic.on(this._onUpdateRangeStatic.bind(this));
    this._signals.updateFocusState.on(this._onUpdateFocusState.bind(this));
  }

  getRootElement(): HTMLElement {
    return this._rootElement;
  }

  getRangeStatic(): RangeStatic | null {
    return this._rangeStatic;
  }

  setRangeStatic(rangeStatic: RangeStatic): void {
    this._signals.updateRangeStatic.emit([rangeStatic, 'outside']);
  }

  deleteText(rangeStatic: RangeStatic): void {
    this._yText.delete(rangeStatic.index, rangeStatic.length);
  }

  insertText(rangeStatic: RangeStatic, text: string): void {
    this._yText.delete(rangeStatic.index, rangeStatic.length);
    this._yText.insert(rangeStatic.index, text, { type: 'base' });
  }

  insertLineBreak(rangeStatic: RangeStatic): void {
    this._yText.delete(rangeStatic.index, rangeStatic.length);
    this._yText.insert(rangeStatic.index, '\n', { type: 'line-break' });
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

      let lineTextLength = 0;
      for (let j = 0; j < textElements.length; j++) {
        const textNode = getTextNodeFromElement(textElements[j]);
        if (!textNode) {
          return null;
        }

        const textLength = calculateTextLength(textNode);
        lineTextLength += textLength;

        if (
          index <= rangeStatic.index &&
          rangeStatic.index <= index + textLength
        ) {
          anchorText = textNode;
          anchorOffset = rangeStatic.index - index;
        }
        if (
          index <= rangeStatic.index + rangeStatic.length &&
          rangeStatic.index + rangeStatic.length <= index + textLength
        ) {
          focusText = textNode;
          focusOffset = rangeStatic.index + rangeStatic.length - index;
        }
      }

      // the one becasue of the line break
      index += lineTextLength + 1;
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
  toRangeStatic(selction: Selection): RangeStatic | null {
    const { anchorNode, anchorOffset, focusNode, focusOffset } = selction;

    if (!anchorNode || !focusNode) {
      return null;
    }

    let anchorText: Text | null = null;
    let focusText: Text | null = null;
    if (anchorNode instanceof Text) {
      anchorText = anchorNode;
    } else if (anchorNode instanceof Element) {
      const rect = anchorNode.getBoundingClientRect();
      anchorText = getClosestTextNode(rect.x, rect.y, this._rootElement);
    }
    if (focusNode instanceof Text) {
      focusText = focusNode;
    } else if (focusNode instanceof Element) {
      const rect = focusNode.getBoundingClientRect();
      focusText = getClosestTextNode(rect.x, rect.y, this._rootElement);
    }

    // case 1
    if (anchorText && focusText) {
      const anchorPointStatic = textRangeToPointStatic(
        anchorText,
        anchorOffset,
        this._rootElement
      );
      const focusPointStatic = textRangeToPointStatic(
        focusText,
        focusOffset,
        this._rootElement
      );

      if (!anchorPointStatic || !focusPointStatic) {
        return null;
      }

      return {
        index: Math.min(anchorPointStatic.index, focusPointStatic.index),
        length: Math.abs(anchorPointStatic.index - focusPointStatic.index),
      };
    }

    // case 2
    if (anchorText && !focusText) {
      const anchorPointStatic = textRangeToPointStatic(
        anchorText,
        anchorOffset,
        this._rootElement
      );

      if (!anchorPointStatic) {
        return null;
      }

      if (isSelectionBackwards(selction)) {
        return {
          index: 0,
          length: anchorPointStatic.index,
        };
      } else {
        return {
          index: anchorPointStatic.index,
          length:
            anchorPointStatic.text.wholeText.length - anchorPointStatic.index,
        };
      }
    }

    // case 2
    if (!anchorText && focusText) {
      const focusPointStatic = textRangeToPointStatic(
        focusText,
        focusOffset,
        this._rootElement
      );

      if (!focusPointStatic) {
        return null;
      }

      if (isSelectionBackwards(selction)) {
        return {
          index: focusPointStatic.index,
          length:
            focusPointStatic.text.wholeText.length - focusPointStatic.index,
        };
      } else {
        return {
          index: 0,
          length: focusPointStatic.index,
        };
      }
    }

    // case 3
    if (!anchorText && !focusText && selction.containsNode(this._rootElement)) {
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

  private _onFocus(): void {
    this._signals.updateFocusState.emit(true);
  }

  private _onBlur(): void {
    this._signals.updateFocusState.emit(false);
  }

  private _onYTextChange(): void {
    const deltas = this._yText.toDelta() as DeltaInserts;
    const chunks = deltaInsersToChunks(deltas);

    // every chunk is a line
    const lines: Array<ReturnType<typeof VirgoLine>> = [];
    for (const chunk of chunks) {
      if (chunk.length === 0) {
        lines.push(VirgoLine([VirgoText(ZERO_WIDTH_SPACE)]));
      } else {
        lines.push(
          VirgoLine(chunk.map(d => renderElement(d.attributes.type, d)))
        );
      }
    }
    render(lines, this._rootElement);
  }

  private _onSelectionChange(): void {
    if (this._isComposing) {
      return;
    }

    const selection = window.getSelection();

    if (!selection) {
      return;
    }

    if (selection.rangeCount === 0) {
      return;
    }

    const rangeStatic = this.toRangeStatic(selection);
    if (rangeStatic) {
      this._signals.updateRangeStatic.emit([rangeStatic, 'native']);
    }
  }

  private _onUpdateRangeStatic([
    newRangStatic,
    origin,
  ]: UpdateRangeStaticProp): void {
    if (
      this._rangeStatic &&
      newRangStatic &&
      this._rangeStatic.index === newRangStatic.index &&
      this._rangeStatic.length === newRangStatic.length
    ) {
      return;
    }

    this._rangeStatic = newRangStatic;

    if (this._rangeStatic && origin !== 'native') {
      const newRange = this.toDomRange(this._rangeStatic);

      if (newRange) {
        const selection = window.getSelection();
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(newRange);
        }
      }
    }
  }

  private _onUpdateFocusState(isFocused: boolean): void {
    if (!isFocused) {
      this._signals.updateRangeStatic.emit([null, 'native']);
    }
  }
}

function getClosestTextNode(
  clientX: number,
  clientY: number,
  rootElement: HTMLElement
): Text | null {
  if (!rootElement.classList.contains(EDITOR_ROOT_CLASS)) {
    console.warn(
      'getClosestTextNode should be called with editor root element'
    );
    return null;
  }

  const rootRect = rootElement.getBoundingClientRect();
  if (!intersects(rootRect, clientX, clientY)) {
    return null;
  }

  const textElements = Array.from(
    rootElement.querySelectorAll(`.${TEXT_CLASS}`)
  );

  let closestTextElement: Element | null = null;
  let minDistance = Infinity;
  for (const textElement of textElements) {
    const elementRect = textElement.getBoundingClientRect();
    const distance = Math.sqrt(
      Math.pow(elementRect.x - clientX, 2) +
        Math.pow(elementRect.y - clientY, 2)
    );
    if (distance < minDistance) {
      minDistance = distance;
      closestTextElement = textElement;
    }
  }

  if (closestTextElement) {
    return getTextNodeFromElement(closestTextElement);
  }
  return null;
}

function textRangeToPointStatic(
  text: Text,
  offset: number,
  rootElement: HTMLElement
): PointStatic | null {
  if (!rootElement.classList.contains(EDITOR_ROOT_CLASS)) {
    throw new Error(
      'textRangeToPointStatic should be called with editor root element'
    );
  }

  if (!rootElement.contains(text)) {
    return null;
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

function intersects(rect: DOMRect, x: number, y: number): boolean {
  return rect.left <= x && x <= rect.right && rect.top <= y && y <= rect.bottom;
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
