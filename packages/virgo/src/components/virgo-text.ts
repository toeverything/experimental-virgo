import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { ZERO_WIDTH_SPACE } from '../constant.js';
import type { BaseArrtiubtes, DeltaInsert } from '../types.js';

function virgoTextStyles(props: BaseArrtiubtes): ReturnType<typeof styleMap> {
  return styleMap({
    'white-space': 'break-spaces',
    'font-weight': props.bold ? 'bold' : 'normal',
    'font-style': props.italic ? 'italic' : 'normal',
    'text-decoration': props.underline ? 'underline' : 'none',
  });
}

@customElement('virgo-text')
export class VirgoText extends LitElement {
  @property({ type: Object })
  delta: DeltaInsert<BaseArrtiubtes> = {
    insert: ZERO_WIDTH_SPACE,
    attributes: {
      type: 'base',
    },
  };

  render() {
    // we need to avoid \n appearing before and after the span element, which will
    // cause the sync problem about the cursor position
    return html`<span
      data-virgo-text="true"
      style=${virgoTextStyles(this.delta.attributes)}
      >${this.delta.insert}</span
    >`;
  }

  createRenderRoot() {
    return this;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'virgo-text': VirgoText;
  }
}
