import type * as Y from 'yjs';

export type TextType = 'base';
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
  insert: string | Y.XmlText;
  attributes: TextAttributes;
};

export type Delta = Array<
  DeltaRetain | DeltaDelete | DeltaInsert | DeltaAttributes
>;
