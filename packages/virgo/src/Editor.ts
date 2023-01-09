import type * as Y from 'yjs';
import { EDITOR_ROOT_CLASS } from './constant.js';
import { filterXSS } from 'xss';

export interface Selection {
  index: number;
  length: number;
}

export class TextEditor {
  private _rootElement: HTMLElement;
  private _yText: Y.Text;
  private _selection: Selection | null = null;
  private _onChange: (text: string, selection: Selection | null) => void;

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

    rootElement.addEventListener('beforeinput', this._onBefoeInput.bind(this));

    document.addEventListener(
      'selectionchange',
      this._onDomSelectionChange.bind(this)
    );

    yText.observe(this._onYTextChange.bind(this));
  }

  private _onBefoeInput(event: InputEvent) {
    event.preventDefault();
    const { inputType, data } = event;

    if (!data) {
      return;
    }

    // These two types occur while a user is composing text and can't be
    // cancelled. Let them through and wait for the composition to end.
    if (
      inputType === 'insertCompositionText' ||
      inputType === 'deleteCompositionText'
    ) {
      return;
    }

    if (!this._selection) {
      return;
    }
    console.log(data);
    if (
      inputType === 'insertText' &&
      this._selection.index >= 0 &&
      this._selection.length === 0 &&
      /[a-z ]/i.test(data)
    ) {
      this._yText.insert(this._selection.index, data);
    }
  }

  private _onDomSelectionChange() {
    const domSelction = window.getSelection();

    if (!domSelction) {
      return;
    }

    const { anchorNode, anchorOffset, focusNode, focusOffset } = domSelction;

    if (
      !this._rootElement.contains(anchorNode) ||
      !this._rootElement.contains(focusNode)
    ) {
      this._selection = null;
      return;
    }

    this._selection = {
      index: anchorOffset,
      length: focusOffset - anchorOffset,
    };
  }

  private _onYTextChange() {
    const text = this._yText.toString().replace(/\n/g, '<br>');
    this._rootElement.innerHTML = filterXSS(text);

    this._onChange(text, this._selection);
  }
}
