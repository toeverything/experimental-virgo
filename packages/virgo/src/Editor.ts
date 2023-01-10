import type * as Y from 'yjs';
import { EDITOR_ROOT_CLASS, LINE_BREAK_CLASS, TEXT_CLASS } from './constant.js';
import { filterXSS } from 'xss';

// TODO left right
export interface RangeStatic {
  index: number;
  length: number;
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

    rootElement.contentEditable = 'true';
    rootElement.classList.add(EDITOR_ROOT_CLASS);
    const originText = this._yText.toString();
    const lines = originText.split('\n');
    const texts = lines.map(
      line => `<span class="${TEXT_CLASS}">${line}</span>`
    );
    const innerHtml = filterXSS(texts.join(`<br class="${LINE_BREAK_CLASS}">`));
    this._rootElement.innerHTML = innerHtml;

    rootElement.addEventListener('beforeinput', this._onBefoeInput.bind(this));

    document.addEventListener(
      'selectionchange',
      this._onDomSelectionChange.bind(this)
    );

    yText.observe(this._onYTextChange.bind(this));
  }

  toDomRange(rangeStatic: RangeStatic): Range | null {
    const textNodes = Array.from(
      this._rootElement.querySelectorAll(`.${TEXT_CLASS}`)
    );

    // calculate anchorNode and focusNode
    let anchorNode: Node | null = null;
    let focusNode: Node | null = null;
    let anchorOffset = 0;
    let focusOffset = 0;
    let index = 0;
    for (let i = 0; i < textNodes.length; i++) {
      const textNode = textNodes[i];
      const text = textNode.textContent;
      if (text) {
        if (
          index <= rangeStatic.index &&
          rangeStatic.index < index + text.length
        ) {
          anchorNode = textNode;
          anchorOffset = rangeStatic.index - index;
        }
        if (
          index <= rangeStatic.index + rangeStatic.length &&
          rangeStatic.index + rangeStatic.length < index + text.length
        ) {
          focusNode = textNode;
          focusOffset = rangeStatic.index + rangeStatic.length - index;
        }

        // the one becasue of the line break
        index += text.length + 1;
      }
    }

    if (!anchorNode || !focusNode) {
      return null;
    }

    const range = document.createRange();
    range.setStart(anchorNode, anchorOffset);
    range.setEnd(focusNode, focusOffset);
    return range;
  }

  toRangeStatic(domSelction: Selection): RangeStatic | null {
    const { anchorNode, anchorOffset, focusNode, focusOffset } = domSelction;

    if (!anchorNode || !focusNode) {
      return null;
    }

    const anchorClosestText = (anchorNode.parentNode as Element).closest(
      `.${TEXT_CLASS}`
    );
    const focusClosestText = (focusNode.parentNode as Element).closest(
      `.${TEXT_CLASS}`
    );

    if (!anchorClosestText || !focusClosestText) {
      return null;
    }

    const textNodes = Array.from(
      this._rootElement.querySelectorAll(`.${TEXT_CLASS}`)
    );
    const anchorTextIndex = textNodes.indexOf(anchorClosestText);
    const focusTextIndex = textNodes.indexOf(focusClosestText);
    let anchorIndex = 0;
    let focusIndex = 0;
    for (const [index, textNode] of textNodes.entries()) {
      const text = textNode.textContent;
      if (text) {
        if (index < anchorTextIndex) {
          anchorIndex += text.length + 1;
        } else if (index === anchorTextIndex) {
          anchorIndex += anchorOffset;
        }

        if (index < focusTextIndex) {
          focusIndex += text.length + 1;
        } else if (index === focusTextIndex) {
          focusIndex += focusOffset;
        }
      }
    }

    return {
      index: anchorIndex,
      length: focusIndex - anchorIndex,
    };
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
      this._yText.delete(this._rangeStatic.index, this._rangeStatic.length);
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
      this._yText.delete(this._rangeStatic.index, this._rangeStatic.length);

      this._rangeStatic = {
        index: this._rangeStatic.index - this._rangeStatic.length,
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
    }
  }

  private _onDomSelectionChange(): void {
    const domSelction = window.getSelection();

    if (!domSelction) {
      this._rangeStatic = null;
      return;
    }

    this._rangeStatic = this.toRangeStatic(domSelction);
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
    const lines = originText.split('\n');
    const texts = lines.map(
      line => `<span class="${TEXT_CLASS}">${line}</span>`
    );
    const innerHtml = filterXSS(texts.join(`<br class="${LINE_BREAK_CLASS}">`));

    this._rootElement.innerHTML = innerHtml;

    this._onChange(originText, this._rangeStatic);
  }
}
