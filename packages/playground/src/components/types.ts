import { BaseTextAttributes, BaseTextElement } from '@blocksuite/virgo';
import { InlineCode, InlineCodeAttributes } from './elements/inline-code';
import { Link, LinkAttributes } from './elements/link';

declare module '@blocksuite/virgo' {
  interface CustomTypes {
    Element: BaseTextElement | InlineCode | Link;
    Attributes: BaseTextAttributes | InlineCodeAttributes | LinkAttributes;
  }
}
