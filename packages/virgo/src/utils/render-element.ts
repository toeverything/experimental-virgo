import type { html } from 'lit-html';
import { VirgoText } from '../components/virgo-text.js';
import type { BaseArrtiubtes, DeltaInsert, TextAttributes } from '../types.js';

export function renderElement(
  delta: DeltaInsert<TextAttributes>
): ReturnType<typeof html> {
  switch (delta.attributes.type) {
    case 'base':
      return VirgoText(delta as DeltaInsert<BaseArrtiubtes>);
    default:
      throw new Error(`Unknown text type: ${delta.attributes.type}`);
  }
}
