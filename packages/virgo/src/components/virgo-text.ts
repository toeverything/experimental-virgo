import { html } from 'lit-html';
import { TEXT_CLASS } from '../constant.js';
import { virgoTextStyles } from '../style.js';
import type { BaseArrtiubtes, DeltaInsert } from '../types.js';

export const VirgoText = (delta: DeltaInsert<BaseArrtiubtes>) => html`
  <span class=${TEXT_CLASS} style=${virgoTextStyles(delta.attributes)}
    >${delta.insert}</span
  >
`;
