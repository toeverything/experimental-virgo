import type { BaseText } from './components/base-text.js';
import type { InlineCode } from './components/inline-code.js';
import type { Link } from './components/link.js';

export type TextType = 'base' | 'line-break' | 'inline-code' | 'link';

export type BaseArrtiubtes = {
  type: 'base';
  bold?: true;
  italic?: true;
  underline?: true;
  strikethrough?: true;
};

export type LineBreakAttributes = {
  type: 'line-break';
};

export type InlineCodeAttributes = {
  type: 'inline-code';
};

export type LinkAttributes = {
  type: 'link';
  href: string;
};

export type TextAttributes =
  | BaseArrtiubtes
  | LineBreakAttributes
  | InlineCodeAttributes
  | LinkAttributes;

export type TextElement = BaseText | InlineCode | Link;

export type DeltaAttributes = {
  retain: number;
  attributes: TextAttributes;
};

export type DeltaInsert<A extends TextAttributes = TextAttributes> = {
  insert: string;
  attributes: A;
};
