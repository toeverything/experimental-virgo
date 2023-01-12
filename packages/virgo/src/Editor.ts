import type * as Y from 'yjs';
import { EDITOR_ROOT_CLASS, LINE_BREAK_CLASS, TEXT_CLASS } from './constant.js';

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

export class TextEditor {
  private _rootElement: HTMLElement;
  private _yText: Y.Text;
  private _rangeStatic: RangeStatic | null = null;
  private _onChange: (text: string, rangeStatic: RangeStatic | null) => void;

  constructor(
    rootElement: TextEditor['_rootElement'],
    yText: TextEditor['_yText'],
    onChange: TextEditor['_onChange']
  ) {
    this._rootElement = rootElement;
    this._yText = yText;
    this._onChange = onChange;

    rootElement.replaceChildren();
    rootElement.contentEditable = 'true';
    rootElement.classList.add(EDITOR_ROOT_CLASS);

    const originText = this._yText.toString();
    const lines = originText.split('\n');
    for (const [index, line] of lines.entries()) {
      const spanElement = document.createElement('span');
      spanElement.classList.add(TEXT_CLASS);
      spanElement.appendChild(new Text(line));
      rootElement.appendChild(spanElement);

      if (index !== lines.length - 1) {
        const lineBreakElement = document.createElement('br');
        lineBreakElement.classList.add(LINE_BREAK_CLASS);
        rootElement.appendChild(lineBreakElement);
      }
    }

    rootElement.addEventListener('beforeinput', this._onBefoeInput.bind(this));

    document.addEventListener(
      'selectionchange',
      this._onDomSelectionChange.bind(this)
    );

    yText.observe(this._onYTextChange.bind(this));
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

  toPointStatic(node: Node, offset: number): PointStatic | null {
    if (!this._rootElement.contains(node)) {
      return null;
    }

    let text: Text | null = null;
    if (node instanceof Text) {
      text = node;
    } else if (node instanceof Element) {
      const span = node.querySelector(`.${TEXT_CLASS}`);
      if (span) {
        text = span.firstChild as Text | null;
      }
    }

    if (!text) {
      return null;
    }

    const textNodes = Array.from(
      this._rootElement.querySelectorAll(`.${TEXT_CLASS}`)
    ).map(span => {
      if (span.firstChild instanceof Text) {
        return span.firstChild;
      } else {
        return null;
      }
    });
    const textIndex = textNodes.indexOf(text);

    let index = 0;
    for (const textNode of textNodes.slice(0, textIndex)) {
      if (!textNode) {
        return null;
      }
      // the one becasue of the line break
      index += textNode.wholeText.length + 1;
    }
    index += offset;

    return { text, index };
  }

  /**
   * calculate the rangeStatic from dom selection for this Editor
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

    const anchorPointStatic = this.toPointStatic(anchorNode, anchorOffset);
    const focusPointStatic = this.toPointStatic(focusNode, focusOffset);

    if (anchorPointStatic && focusPointStatic) {
      return {
        index: Math.min(anchorPointStatic.index, focusPointStatic.index),
        length: Math.abs(anchorPointStatic.index - focusPointStatic.index),
      };
    }

    if (anchorPointStatic && !focusPointStatic) {
      if (this._isSelectionBackwards(selction)) {
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

    if (!anchorPointStatic && focusPointStatic) {
      if (this._isSelectionBackwards(selction)) {
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
    const { inputType, data } = event;

    // These two types occur while a user is composing text and can't be
    // cancelled. Let them through and wait for the composition to end.
    if (
      inputType === 'insertCompositionText' ||
      inputType === 'deleteCompositionText'
    ) {
      return;
    }

    if (!this._rangeStatic) {
      return;
    }

    if (inputType === 'insertText' && this._rangeStatic.index >= 0 && data) {
      this._yText.insert(this._rangeStatic.index, data);

      this._rangeStatic = {
        index: this._rangeStatic.index + data.length,
        length: 0,
      };

      const newDomRange = this.toDomRange(this._rangeStatic);
      if (newDomRange) {
        const domSelction = window.getSelection();
        if (domSelction) {
          domSelction.removeAllRanges();
          domSelction.addRange(newDomRange);
        }
      }
    } else if (
      inputType === 'insertParagraph' &&
      this._rangeStatic.index >= 0
    ) {
      if (this._rangeStatic.length > 0) {
        this._yText.delete(this._rangeStatic.index, this._rangeStatic.length);
      }
      this._yText.insert(this._rangeStatic.index, '\n');

      this._rangeStatic = {
        index: this._rangeStatic.index + 1,
        length: 0,
      };
      const newDomRange = this.toDomRange(this._rangeStatic);
      if (newDomRange) {
        const domSelction = window.getSelection();
        if (domSelction) {
          domSelction.removeAllRanges();
          domSelction.addRange(newDomRange);
        }
      }
    } else if (
      inputType === 'deleteContentBackward' &&
      this._rangeStatic.index >= 0
    ) {
      if (this._rangeStatic.length > 0) {
        this._yText.delete(this._rangeStatic.index, this._rangeStatic.length);
        this._rangeStatic = {
          index: this._rangeStatic.index - this._rangeStatic.length,
          length: 0,
        };
      } else if (this._rangeStatic.index > 0) {
        this._yText.delete(this._rangeStatic.index - 1, 1);
        this._rangeStatic = {
          index: this._rangeStatic.index - 1,
          length: 0,
        };
      }

      const newDomRange = this.toDomRange(this._rangeStatic);
      if (newDomRange) {
        const domSelction = window.getSelection();
        if (domSelction) {
          domSelction.removeAllRanges();
          domSelction.addRange(newDomRange);
        }
      }
    }
  }

  private _onDomSelectionChange(): void {
    const selction = window.getSelection();

    if (!selction) {
      this._rangeStatic = null;
      return;
    }

    this._rangeStatic = this.toRangeStatic(selction);
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

    this._onChange(originText, this._rangeStatic);
  }

  private _isSelectionBackwards(selection: Selection) {
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
}
