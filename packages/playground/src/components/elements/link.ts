import {
  DeltaInsert,
  ZERO_WIDTH_SPACE,
  VirgoUnitText,
  BaseArrtiubtes,
} from '@blocksuite/virgo';
import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

export interface LinkAttributes {
  type: 'link';
  href: string;
}

@customElement('v-link')
export class Link extends LitElement {
  @property({ type: Object })
  delta: DeltaInsert<LinkAttributes> = {
    insert: ZERO_WIDTH_SPACE,
    attributes: {
      type: 'link',
      href: '',
    },
  };

  render() {
    const unitText = new VirgoUnitText();
    const textDelta: DeltaInsert<BaseArrtiubtes> = {
      insert: this.delta.insert,
      attributes: {
        type: 'base',
      },
    };

    unitText.delta = textDelta;

    return html`<a
      data-virgo-element="true"
      href=${this.delta.attributes.href}
      rel="noopener noreferrer"
      target="_blank"
      @click=${(e: MouseEvent) => {
        // redirect to the link
        e.preventDefault();
        window.open(this.delta.attributes.href, '_blank');
      }}
      >${unitText}</a
    >`;
  }

  createRenderRoot() {
    return this;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'v-link': Link;
  }
}
