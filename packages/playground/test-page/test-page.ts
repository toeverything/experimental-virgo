import * as Y from 'yjs';
import { LitElement, css, html } from 'lit';
import { customElement, query } from 'lit/decorators.js';

import '@shoelace-style/shoelace/dist/themes/dark.css';
import '@shoelace-style/shoelace';
import { BaseArrtiubtes, TextEditor } from '@blocksuite/virgo';

@customElement('rich-text')
export class RichText extends LitElement {
  editor: TextEditor;

  @query(`.rich-text-container`)
  private _container!: HTMLDivElement;

  constructor(editor: TextEditor) {
    super();
    this.editor = editor;
  }

  firstUpdated() {
    this.editor.mount(this._container);
  }

  render() {
    return html`<style>
        .rich-text-container {
          width: 100%;
          height: 100%;
          outline: none;
        }
      </style>
      <div class="rich-text-container"></div>`;
  }
}

@customElement('tool-bar')
export class ToolBar extends LitElement {
  static styles = css`
    .tool-bar {
      display: gird;
      grid-template-columns: repeat(4, 1fr);
      grid-template-rows: repeat(2, 1fr);
    }
  `;

  editor: TextEditor;

  constructor(editor: TextEditor) {
    super();
    this.editor = editor;
  }

  private format(editor: TextEditor, mark: Partial<BaseArrtiubtes>): void {
    const rangeStatic = editor.getRangeStatic();
    if (!rangeStatic) {
      return;
    }

    editor.formatText(
      rangeStatic,
      { type: 'base', ...mark },
      {
        mode: 'merge',
      }
    );
    editor.syncRangeStatic();
  }

  protected firstUpdated(): void {
    const boldButton = this.shadowRoot!.querySelector('.bold')!;
    const italicButton = this.shadowRoot!.querySelector('.italic')!;
    const underlineButton = this.shadowRoot!.querySelector('.underline')!;
    const strikethroughButton =
      this.shadowRoot!.querySelector('.strikethrough')!;
    const resetButton = this.shadowRoot!.querySelector('.reset')!;
    const undoButton = this.shadowRoot!.querySelector('.undo')!;
    const redoButton = this.shadowRoot!.querySelector('.redo')!;

    boldButton.addEventListener('click', () => {
      this.format(this.editor, { bold: true });
    });
    italicButton.addEventListener('click', () => {
      this.format(this.editor, { italic: true });
    });
    underlineButton.addEventListener('click', () => {
      this.format(this.editor, { underline: true });
    });
    strikethroughButton.addEventListener('click', () => {
      this.format(this.editor, { strikethrough: true });
    });
    resetButton.addEventListener('click', () => {
      const rangeStatic = this.editor.getRangeStatic();
      if (!rangeStatic) {
        return;
      }
      this.editor.resetText(rangeStatic);
    });

    const undoManager = new Y.UndoManager(this.editor.yText);
    undoButton.addEventListener('click', () => {
      undoManager.undo();
    });
    redoButton.addEventListener('click', () => {
      undoManager.redo();
    });
  }

  protected render(): unknown {
    return html`<div class="tool-bar">
      <sl-button class="bold">bold</sl-button>
      <sl-button class="italic">italic</sl-button>
      <sl-button class="underline">underline</sl-button>
      <sl-button class="strikethrough">strikethrough</sl-button>
      <sl-button class="reset">reset</sl-button>
      <sl-button class="undo">undo</sl-button>
      <sl-button class="redo">redo</sl-button>
    </div>`;
  }
}

@customElement('test-page')
export class TestPage extends LitElement {
  static styles = css`
    .container {
      display: grid;
      height: 100vh;
      width: 100vw;
      justify-content: center;
      align-items: center;
    }

    .editors {
      display: grid;
      grid-template-columns: 1fr 1fr;
      padding: 20px;
      background-color: #202124;
      border-radius: 10px;
      color: #fff;
    }

    .editors > div {
      height: 600px;
      display: grid;
      grid-template-rows: 100px 1fr;
      overflow-y: scroll;
    }
  `;

  protected firstUpdated(): void {
    const TEXT_ID = 'virgo';
    const yDocA = new Y.Doc();
    const yDocB = new Y.Doc();

    yDocA.on('update', update => {
      Y.applyUpdate(yDocB, update);
    });

    yDocB.on('update', update => {
      Y.applyUpdate(yDocA, update);
    });

    const textA = yDocA.getText(TEXT_ID);
    const editorA = new TextEditor(textA);

    const textB = yDocB.getText(TEXT_ID);
    const editorB = new TextEditor(textB);

    const toolBarA = new ToolBar(editorA);
    const toolBarB = new ToolBar(editorB);

    const docA = this.shadowRoot!.querySelector('.doc-a')!;
    const docB = this.shadowRoot!.querySelector('.doc-b')!;
    docA.appendChild(toolBarA);
    docB.appendChild(toolBarB);

    const richTextA = new RichText(editorA);
    const richTextB = new RichText(editorB);
    docA.appendChild(richTextA);
    docB.appendChild(richTextB);
  }

  protected render(): unknown {
    return html`<div class="container">
      <div class="editors">
        <div class="doc-a"></div>
        <div class="doc-b"></div>
      </div>
    </div>`;
  }
}
