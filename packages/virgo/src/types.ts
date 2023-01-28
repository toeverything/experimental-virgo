import type { BaseText } from './components/base-text.js';
import type { InlineCode } from './components/inline-code.js';

export type TextType = 'base' | 'line-break' | 'inline-code';

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

export type TextAttributes =
  | BaseArrtiubtes
  | LineBreakAttributes
  | InlineCodeAttributes;

export type TextElement = BaseText | InlineCode;

export type DeltaAttributes = {
  retain: number;
  attributes: TextAttributes;
};

export type DeltaInsert<A extends TextAttributes = TextAttributes> = {
  insert: string;
  attributes: A;
};
