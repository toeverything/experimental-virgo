export type TextType = 'base' | 'line-break';

export type BaseArrtiubtes = {
  type: 'base';
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
};

export type LineBreakAttributes = {
  type: 'line-break';
};

export type TextAttributes = BaseArrtiubtes | LineBreakAttributes;

export type DeltaAttributes = {
  retain: number;
  attributes: TextAttributes;
};
export type DeltaRetain = { retain: number };
export type DeltaDelete = { delete: number };
export type DeltaInsert<A extends TextAttributes = TextAttributes> = {
  insert: string;
  attributes: A;
};

export type Delta = Array<
  DeltaRetain | DeltaDelete | DeltaInsert | DeltaAttributes
>;

export type DeltaInserts = Array<DeltaInsert>;
