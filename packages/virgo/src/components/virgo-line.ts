import { html } from 'lit-html';
import { TEXT_LINE_CLASS } from '../constant.js';
import { virgoLineStyles } from '../style.js';

export const VirgoLine = (children: Array<ReturnType<typeof html>>) => html`
  <div class=${TEXT_LINE_CLASS} style=${virgoLineStyles}>${children}</div>
`;
