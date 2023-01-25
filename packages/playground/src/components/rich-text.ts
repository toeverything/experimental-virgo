import { TextEditor } from '@blocksuite/virgo';
import { html, LitElement } from 'lit';
import { customElement, query, property } from 'lit/decorators.js';

@customElement('rich-text')
export class RichText extends LitElement {
  @property()
  editor!: TextEditor;

  @query(`.rich-text-container`)
  private _container!: HTMLDivElement;

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

declare global {
  interface HTMLElementTagNameMap {
    'rich-text': RichText;
  }
}
