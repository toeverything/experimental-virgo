import { expect, test } from '@playwright/test';
import { enterPlayground, focusRichText } from './utils/misc.js';
import { EDITOR_ROOT_CLASS } from '../packages/virgo/src/constant.js';

test('basic input', async ({ page }) => {
  await enterPlayground(page);
  await focusRichText(page);

  await page.keyboard.type('Hello World!🧐你好世界!');

  const editorA = page.locator(`.${EDITOR_ROOT_CLASS}`).nth(0);
  const editorB = page.locator(`.${EDITOR_ROOT_CLASS}`).nth(1);

  expect(await editorA.innerText()).toBe('Hello World!🧐你好世界!');
  expect(await editorB.innerText()).toBe('Hello World!🧐你好世界!');
});
