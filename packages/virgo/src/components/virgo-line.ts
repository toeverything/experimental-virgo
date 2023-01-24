import { html } from 'lit-html';
import { TEXT_LINE_CLASS } from '../constant.js';

export const VirgoLine = (children: Array<ReturnType<typeof html>>) =>
  html`<div class=${TEXT_LINE_CLASS}>${children}</div>`;
