import { BaseText } from '../components/base-text.js';
import { InlineCode } from '../components/inline-code.js';
import { Link } from '../components/link.js';
import type {
  BaseArrtiubtes,
  DeltaInsert,
  InlineCodeAttributes,
  LinkAttributes,
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
    case 'link':
      const link = new Link();
      link.delta = delta as DeltaInsert<LinkAttributes>;
      return link;
    default:
      throw new Error(`Unknown text type: ${delta.attributes.type}`);
  }
}
