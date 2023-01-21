import type { html } from 'lit-html';
import { VirgoText } from '../components/virgo-text.js';
import type { DeltaInsert, TextType } from '../types.js';

export function renderElement(
  type: TextType,
  delta: DeltaInsert
): ReturnType<typeof html> {
  switch (type) {
    case 'base':
      return VirgoText(delta.insert);
    default:
      throw new Error(`Unknown text type: ${type}`);
  }
}
