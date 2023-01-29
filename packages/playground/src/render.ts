import {
  BaseArrtiubtes,
  BaseText,
  DeltaInsert,
  TextAttributes,
  TextElement,
} from '@blocksuite/virgo';
import {
  InlineCode,
  InlineCodeAttributes,
} from './components/elements/inline-code';
import { Link, LinkAttributes } from './components/elements/link';

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
