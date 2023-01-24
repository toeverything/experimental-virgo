import { html } from 'lit-html';
import { TEXT_CLASS } from '../constant.js';
import { virgoTextStyles } from '../style.js';
import type { BaseArrtiubtes, DeltaInsert } from '../types.js';

// we need to avoid \n appearing before and after the span element, which will
// cause the sync problem about the cursor position
export const VirgoText = (delta: DeltaInsert<BaseArrtiubtes>) => html`<span
  class=${TEXT_CLASS}
  style=${virgoTextStyles(delta.attributes)}
  >${delta.insert}</span
>`;
