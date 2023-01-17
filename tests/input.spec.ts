import { expect, test } from '@playwright/test';
import { enterPlayground, focusRichText } from './utils/misc.js';
import { EDITOR_ROOT_CLASS } from '../packages/virgo/src/constant.js';

test('basic input in one line', async ({ page }) => {
  await enterPlayground(page);
  await focusRichText(page);

  await page.keyboard.type('Hello World!🧐你好世界!');

  const editorA = page.locator(`.${EDITOR_ROOT_CLASS}`).nth(0);
  const editorB = page.locator(`.${EDITOR_ROOT_CLASS}`).nth(1);

  expect(await editorA.innerText()).toBe('Hello World!🧐你好世界!');
  expect(await editorB.innerText()).toBe('Hello World!🧐你好世界!');
});

test('delete input in one line', async ({ page }) => {
  await enterPlayground(page);
  await focusRichText(page);

  await page.keyboard.type('aaaabbbb');
  await page.keyboard.press('Backspace');
  await page.keyboard.press('Backspace');
  await page.keyboard.press('Backspace');
  await page.keyboard.press('Backspace');

  const editorA = page.locator(`.${EDITOR_ROOT_CLASS}`).nth(0);
  const editorB = page.locator(`.${EDITOR_ROOT_CLASS}`).nth(1);

  expect(await editorA.innerText()).toBe('aaaa');
  expect(await editorB.innerText()).toBe('aaaa');
});

test('basic input in multiple lines', async ({ page }) => {
  await enterPlayground(page);
  await focusRichText(page);

  await page.keyboard.type('aaaa');

  await page.keyboard.press('Enter');

  await page.keyboard.type('bbbb');

  const editorA = page.locator(`.${EDITOR_ROOT_CLASS}`).nth(0);
  const editorB = page.locator(`.${EDITOR_ROOT_CLASS}`).nth(1);

  expect(await editorA.innerText()).toBe('aaaa\nbbbb');
  expect(await editorB.innerText()).toBe('aaaa\nbbbb');
});

test('delete input in multiple lines', async ({ page }) => {
  await enterPlayground(page);
  await focusRichText(page);

  await page.keyboard.type('aaaa');

  await page.keyboard.press('Enter');

  await page.keyboard.type('bbbb');

  await page.keyboard.press('Backspace');
  await page.keyboard.press('Backspace');
  await page.keyboard.press('Backspace');
  await page.keyboard.press('Backspace');
  await page.keyboard.press('Backspace');

  const editorA = page.locator(`.${EDITOR_ROOT_CLASS}`).nth(0);
  const editorB = page.locator(`.${EDITOR_ROOT_CLASS}`).nth(1);

  expect(await editorA.innerText()).toBe('aaaa');
  expect(await editorB.innerText()).toBe('aaaa');
});
