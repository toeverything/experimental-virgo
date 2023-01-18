import { expect, test } from '@playwright/test';
import { enterPlayground, focusRichText } from './utils/misc.js';
import { EDITOR_ROOT_CLASS } from '../packages/virgo/src/constant.js';

test('basic input in one line', async ({ page }) => {
  await enterPlayground(page);
  await focusRichText(page);

  await page.keyboard.type('aaa🧐bbb');

  const editorA = page.locator(`.${EDITOR_ROOT_CLASS}`).nth(0);
  const editorB = page.locator(`.${EDITOR_ROOT_CLASS}`).nth(1);

  expect(await editorA.innerHTML()).toBe(
    '<div class="virgo-text">aaa🧐bbb</div>'
  );
  expect(await editorB.innerHTML()).toBe(
    '<div class="virgo-text">aaa🧐bbb</div>'
  );

  await page.keyboard.press('Backspace');
  await page.keyboard.press('Backspace');
  await page.keyboard.press('Backspace');
  await page.keyboard.press('Backspace');

  expect(await editorA.innerHTML()).toBe('<div class="virgo-text">aaa</div>');
  expect(await editorB.innerHTML()).toBe('<div class="virgo-text">aaa</div>');

  await page.keyboard.press('Enter');
  await page.keyboard.type('bbb');

  expect(await editorA.innerHTML()).toBe(
    '<div class="virgo-text">aaa</div><div class="virgo-text">bbb</div>'
  );
  expect(await editorB.innerHTML()).toBe(
    '<div class="virgo-text">aaa</div><div class="virgo-text">bbb</div>'
  );

  await page.keyboard.press('Backspace');
  await page.keyboard.press('Backspace');
  await page.keyboard.press('Backspace');
  await page.keyboard.press('Backspace');

  expect(await editorA.innerHTML()).toBe('<div class="virgo-text">aaa</div>');
  expect(await editorB.innerHTML()).toBe('<div class="virgo-text">aaa</div>');

  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');

  expect(await editorA.innerHTML()).toBe(
    '<div class="virgo-text">aaa</div><div class="virgo-text">​</div><div class="virgo-text">​</div>'
  );
  expect(await editorB.innerHTML()).toBe(
    '<div class="virgo-text">aaa</div><div class="virgo-text">​</div><div class="virgo-text">​</div>'
  );

  await page.keyboard.press('Backspace');
  await page.keyboard.press('Backspace');

  expect(await editorA.innerHTML()).toBe('<div class="virgo-text">aaa</div>');
  expect(await editorB.innerHTML()).toBe('<div class="virgo-text">aaa</div>');

  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.type('bb');

  expect(await editorA.innerHTML()).toBe('<div class="virgo-text">abbaa</div>');
  expect(await editorB.innerHTML()).toBe('<div class="virgo-text">abbaa</div>');

  await page.keyboard.press('ArrowRight');
  await page.keyboard.type('bb');

  expect(await editorA.innerHTML()).toBe(
    '<div class="virgo-text">abbabba</div>'
  );
  expect(await editorB.innerHTML()).toBe(
    '<div class="virgo-text">abbabba</div>'
  );

  await page.keyboard.press('Enter');

  expect(await editorA.innerHTML()).toBe(
    '<div class="virgo-text">abbabb</div><div class="virgo-text">a</div>'
  );
  expect(await editorB.innerHTML()).toBe(
    '<div class="virgo-text">abbabb</div><div class="virgo-text">a</div>'
  );

  await page.keyboard.press('Backspace');

  expect(await editorA.innerHTML()).toBe(
    '<div class="virgo-text">abbabba</div>'
  );
  expect(await editorB.innerHTML()).toBe(
    '<div class="virgo-text">abbabba</div>'
  );
});
