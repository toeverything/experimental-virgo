import { styleMap } from 'lit-html/directives/style-map.js';
import type { BaseArrtiubtes } from './types.js';

export function virgoTextStyles(
  props: BaseArrtiubtes
): ReturnType<typeof styleMap> {
  return styleMap({
    'font-size': '16px',
    'white-space': 'break-spaces',
    'font-weight': props.bold ? 'bold' : 'normal',
    'font-style': props.italic ? 'italic' : 'normal',
    'text-decoration': props.underline ? 'underline' : 'none',
  });
}

export const virgoLineStyles = styleMap({
  'font-size': '0',
});
