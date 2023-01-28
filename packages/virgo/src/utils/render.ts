import { BaseText } from '../components/base-text.js';
import { InlineCode } from '../components/inline-code.js';
import type {
  BaseArrtiubtes,
  DeltaInsert,
  InlineCodeAttributes,
  TextAttributes,
  TextElement,
} from '../types.js';

export function renderElement(delta: DeltaInsert<TextAttributes>): TextElement {
  switch (delta.attributes.type) {
    case 'base':
      const baseText = new BaseText();
      baseText.delta = delta as DeltaInsert<BaseArrtiubtes>;
      return baseText;
    case 'inline-code':
      const inlineCode = new InlineCode();
      inlineCode.delta = delta as DeltaInsert<InlineCodeAttributes>;
      return inlineCode;
    default:
      throw new Error(`Unknown text type: ${delta.attributes.type}`);
  }
}
