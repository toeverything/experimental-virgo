export type TextType = 'base' | 'line-break';
export type TextAttributes = {
  type: TextType;
};

export type DeltaAttributes = {
  retain: number;
  attributes: TextAttributes;
};
export type DeltaRetain = { retain: number };
export type DeltaDelete = { delete: number };
export type DeltaInsert = {
  insert: string;
  attributes: TextAttributes;
};

export type Delta = Array<
  DeltaRetain | DeltaDelete | DeltaInsert | DeltaAttributes
>;

export type DeltaInserts = Array<DeltaInsert>;
