import { html } from 'lit-html';
import { TEXT_CLASS } from '../constant.js';
import { virgoTextStyles } from '../style.js';

export const VirgoText = (text: string) => html`
  <span class="${TEXT_CLASS}" style=${virgoTextStyles}>${text}</span>
`;
