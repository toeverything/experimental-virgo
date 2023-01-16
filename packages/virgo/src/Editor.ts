import type * as Y from 'yjs';
import { EDITOR_ROOT_CLASS, LINE_BREAK_CLASS, TEXT_CLASS } from './constant.js';
import type { Signal } from './utils/signal.js';
import { caretRangeFromPoint } from './utils/std.js';

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

export interface TextEditorSignals {
  updateRangeStatic: Signal<RangeStatic | null>;
}

export class TextEditor {
  private _rootElement: HTMLElement;
  private _yText: Y.Text;
  private _rangeStatic: RangeStatic | null = null;
  private _anchorPointStatic: PointStatic | null = null;
  private _signals: TextEditorSignals;

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
    this._signals = signals;

    this._rootElement.replaceChildren();
    this._rootElement.contentEditable = 'true';
    this._rootElement.classList.add(EDITOR_ROOT_CLASS);

    const originText = this._yText.toString();
    const lines = originText.split('\n');
    for (const [index, line] of lines.entries()) {
      const spanElement = document.createElement('span');
      spanElement.classList.add(TEXT_CLASS);
      spanElement.appendChild(new Text(line));
      this._rootElement.appendChild(spanElement);

      if (index !== lines.length - 1) {
        const lineBreakElement = document.createElement('br');
        lineBreakElement.classList.add(LINE_BREAK_CLASS);
        this._rootElement.appendChild(lineBreakElement);
      }
    }

    this._rootElement.addEventListener(
      'mousedown',
      this._onMouseDown.bind(this)
    );
    this._rootElement.addEventListener(
      'mousemove',
      this._onMouseMove.bind(this)
    );
    this._rootElement.addEventListener('mouseup', this._onMouseUp.bind(this));
    this._rootElement.addEventListener(
      'mouseleave',
      this._onMouseLeave.bind(this)
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
      'compositionend',
      this._onCompositionEnd.bind(this)
    );

    yText.observe(this._onYTextChange.bind(this));

    this._signals.updateRangeStatic.on(this._onUpdateRangeStatic.bind(this));
  }

  toDomRange(rangeStatic: RangeStatic): Range | null {
    const textSpanNodes = Array.from(
      this._rootElement.querySelectorAll(`.${TEXT_CLASS}`)
    );

    // calculate anchorNode and focusNode
    let anchorText: Text | null = null;
    let focusText: Text | null = null;
    let anchorOffset = 0;
    let focusOffset = 0;
    let index = 0;
    for (let i = 0; i < textSpanNodes.length; i++) {
      const textNode = textSpanNodes[i].firstChild as Text | null;
      if (!textNode) {
        return null;
      }
      const text = textNode.wholeText;
      if (
        index <= rangeStatic.index &&
        rangeStatic.index <= index + text.length
      ) {
        anchorText = textNode;
        anchorOffset = rangeStatic.index - index;
      }
      if (
        index <= rangeStatic.index + rangeStatic.length &&
        rangeStatic.index + rangeStatic.length <= index + text.length
      ) {
        focusText = textNode;
        focusOffset = rangeStatic.index + rangeStatic.length - index;
      }

      // the one becasue of the line break
      index += text.length + 1;
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

    if (!anchorText || !focusText) {
      return null;
    }

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

    // case 1
    if (anchorPointStatic && focusPointStatic) {
      return {
        index: Math.min(anchorPointStatic.index, focusPointStatic.index),
        length: Math.abs(anchorPointStatic.index - focusPointStatic.index),
      };
    }

    // case 2
    if (anchorPointStatic && !focusPointStatic) {
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
    if (!anchorPointStatic && focusPointStatic) {
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
    if (
      !anchorPointStatic &&
      !focusPointStatic &&
      selction.containsNode(this._rootElement)
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
      if (this._rangeStatic.length > 0) {
        this._yText.delete(this._rangeStatic.index, this._rangeStatic.length);
      }
      this._yText.insert(this._rangeStatic.index, data);

      this._signals.updateRangeStatic.emit({
        index: this._rangeStatic.index + data.length,
        length: 0,
      });
    } else if (
      inputType === 'insertParagraph' &&
      this._rangeStatic.index >= 0
    ) {
      if (this._rangeStatic.length > 0) {
        this._yText.delete(this._rangeStatic.index, this._rangeStatic.length);
      }
      this._yText.insert(this._rangeStatic.index, '\n');

      this._signals.updateRangeStatic.emit({
        index: this._rangeStatic.index + 1,
        length: 0,
      });
    } else if (
      inputType === 'deleteContentBackward' &&
      this._rangeStatic.index >= 0
    ) {
      if (this._rangeStatic.length > 0) {
        this._yText.delete(this._rangeStatic.index, this._rangeStatic.length);

        this._signals.updateRangeStatic.emit({
          index: this._rangeStatic.index,
          length: 0,
        });
      } else if (this._rangeStatic.index > 0) {
        this._yText.delete(this._rangeStatic.index - 1, 1);

        this._signals.updateRangeStatic.emit({
          index: this._rangeStatic.index - 1,
          length: 0,
        });
      }
    }
  }

  private _onCompositionEnd(event: CompositionEvent): void {
    if (!this._rangeStatic) {
      return;
    }

    const { data } = event;

    if (this._rangeStatic.index >= 0 && data) {
      if (this._rangeStatic.length > 0) {
        this._yText.delete(this._rangeStatic.index, this._rangeStatic.length);
      }
      this._yText.insert(this._rangeStatic.index, data);

      this._signals.updateRangeStatic.emit({
        index: this._rangeStatic.index + data.length,
        length: 0,
      });
    }
  }

  private _onYTextChange(): void {
    /**
     * Y.Text:
     *    aaa\nbbb\nccc
     * innerHTML:
     *    <span class="${TEXT_CLASS}">aaa</span>
     *    <br class="${LINE_BREAK_CLASS}">
     *    <span class="${TEXT_CLASS}">bbb</span>
     *    <br class="${LINE_BREAK_CLASS}">
     *    <span class="${TEXT_CLASS}">ccc</span>
     */
    const originText = this._yText.toString();
    this._rootElement.replaceChildren();
    const lines = originText.split('\n');
    for (const [index, line] of lines.entries()) {
      const spanElement = document.createElement('span');
      spanElement.classList.add(TEXT_CLASS);
      spanElement.appendChild(new Text(line.length > 0 ? line : '\u200b'));
      this._rootElement.appendChild(spanElement);

      if (index !== lines.length - 1) {
        const lineBreakElement = document.createElement('br');
        lineBreakElement.classList.add(LINE_BREAK_CLASS);
        this._rootElement.appendChild(lineBreakElement);
      }
    }
  }

  private _onMouseDown(event: MouseEvent): void {
    this._signals.updateRangeStatic.emit(null);
    this._anchorPointStatic = null;

    const range = caretRangeFromPoint(event.clientX, event.clientY);

    if (!range) {
      return;
    }

    const anchorNode = range.startContainer;
    const anchorOffset = range.startOffset;

    if (!this._rootElement.contains(anchorNode)) {
      return;
    }

    if (
      anchorNode instanceof Text &&
      anchorNode.parentElement &&
      anchorNode.parentElement.classList.contains(TEXT_CLASS)
    ) {
      const anchorPoint = textRangeToPointStatic(
        anchorNode,
        anchorOffset,
        this._rootElement
      );
      if (anchorPoint) {
        this._updateRangeStaticUsingPoint(anchorPoint, anchorPoint);
        this._anchorPointStatic = anchorPoint;
      }
    } else {
      const closestTextElement = getClosestTextNode(
        event.clientX,
        event.clientY,
        this._rootElement
      );
      if (closestTextElement) {
        const anchorPoint = textRangeToPointStatic(
          closestTextElement,
          closestTextElement.wholeText.length,
          this._rootElement
        );
        if (anchorPoint) {
          this._updateRangeStaticUsingPoint(anchorPoint, anchorPoint);
          this._anchorPointStatic = anchorPoint;
        }
      }
    }
  }

  private _onMouseMove(event: MouseEvent): void {
    event.preventDefault();

    if (!this._anchorPointStatic) {
      return;
    }

    const range = caretRangeFromPoint(event.clientX, event.clientY);

    if (!range) {
      return;
    }

    const focusNode = range.startContainer;
    const focusOffset = range.startOffset;

    if (!this._rootElement.contains(focusNode)) {
      return;
    }

    if (
      focusNode instanceof Text &&
      focusNode.parentElement &&
      focusNode.parentElement.classList.contains(TEXT_CLASS)
    ) {
      const focusPointStatic = textRangeToPointStatic(
        focusNode,
        focusOffset,
        this._rootElement
      );
      if (focusPointStatic) {
        this._updateRangeStaticUsingPoint(
          this._anchorPointStatic,
          focusPointStatic
        );
      }
    }
  }

  private _onMouseUp(): void {
    this._anchorPointStatic = null;
  }

  private _onMouseLeave(): void {
    this._anchorPointStatic = null;
  }

  private _updateRangeStaticUsingPoint(
    anchor: PointStatic,
    focus: PointStatic
  ): void {
    if (anchor.text === focus.text) {
      this._signals.updateRangeStatic.emit({
        index: Math.min(anchor.index, focus.index),
        length: Math.abs(focus.index - anchor.index),
      });
    } else if (
      anchor.text.compareDocumentPosition(focus.text) &
      Node.DOCUMENT_POSITION_FOLLOWING
    ) {
      this._signals.updateRangeStatic.emit({
        index: anchor.index,
        length: Math.abs(focus.index - anchor.index),
      });
    } else {
      this._signals.updateRangeStatic.emit({
        index: focus.index,
        length: Math.abs(focus.index - anchor.index),
      });
    }
  }

  private _onUpdateRangeStatic(newRangStatic: RangeStatic | null): void {
    if (
      this._rangeStatic &&
      newRangStatic &&
      this._rangeStatic.index === newRangStatic.index &&
      this._rangeStatic.length === newRangStatic.length
    ) {
      return;
    }

    this._rangeStatic = newRangStatic;
    if (this._rangeStatic) {
      const newDomRange = this.toDomRange(this._rangeStatic);

      if (newDomRange) {
        const selection = window.getSelection();
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(newDomRange);
        }
      }
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

  if (closestTextElement && closestTextElement.firstChild instanceof Text) {
    return closestTextElement.firstChild;
  }
  return null;
}

function textRangeToPointStatic(
  text: Text,
  offset: number,
  rootElement: HTMLElement
): PointStatic | null {
  if (!rootElement.classList.contains(EDITOR_ROOT_CLASS)) {
    console.warn(
      'textRangeToPointStatic should be called with editor root element'
    );
    return null;
  }

  if (!rootElement.contains(text)) {
    return null;
  }

  const textNodes = Array.from(
    rootElement.querySelectorAll(`.${TEXT_CLASS}`)
  ).map(span => {
    if (span.firstChild instanceof Text) {
      return span.firstChild;
    } else {
      return null;
    }
  });
  const goalIndex = textNodes.indexOf(text);

  let index = 0;
  for (const textNode of textNodes.slice(0, goalIndex)) {
    if (!textNode) {
      return null;
    }
    // the one becasue of the line break
    index += textNode.wholeText.length + 1;
  }

  if (text.wholeText !== '\u200b') {
    index += offset;
  }

  return { text, index };
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
