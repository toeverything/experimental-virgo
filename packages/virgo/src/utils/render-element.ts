import { VirgoText } from '../components/virgo-text.js';
import type {
  BaseArrtiubtes,
  DeltaInsert,
  TextAttributes,
  TextElement,
} from '../types.js';

export function renderElement(delta: DeltaInsert<TextAttributes>): TextElement {
  switch (delta.attributes.type) {
    case 'base':
      const virgoText = new VirgoText();
      virgoText.delta = delta as DeltaInsert<BaseArrtiubtes>;
      return virgoText;
    default:
      throw new Error(`Unknown text type: ${delta.attributes.type}`);
  }
}
