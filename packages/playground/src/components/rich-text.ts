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
        code {
          background: #505662;
          color: #bddbfd;
          font-family: Space Mono, apple-system, BlinkMacSystemFont,
            Helvetica Neue, Tahoma, PingFang SC, Microsoft Yahei, Arial,
            Hiragino Sans GB, sans-serif, Apple Color Emoji, Segoe UI Emoji,
            Segoe UI Symbol, Noto Color Emoji;
          padding: 0 5px;
          border-radius: 5px;
          font-size: 14px;
        }

        a {
          color: #bddbfd;
          text-decoration: none;
        }

        a:hover {
          text-decoration: underline;
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
