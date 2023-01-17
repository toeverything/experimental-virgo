import type { Page } from '@playwright/test';
import { EDITOR_ROOT_CLASS } from '../../packages/virgo/src/constant.js';

export async function enterPlayground(page: Page) {
  await page.goto(
    `http://localhost:5173/test/playwright-${Math.random()
      .toFixed(8)
      .substring(2)}`
  );
}

export async function focusRichText(page: Page) {
  const editorPosition = await page.evaluate(EDITOR_ROOT_CLASS => {
    const editor = document.querySelector(
      `.${EDITOR_ROOT_CLASS}`
    ) as HTMLElement;
    return editor.getBoundingClientRect();
  }, EDITOR_ROOT_CLASS);

  await page.mouse.click(editorPosition.x + 8, editorPosition.y + 8);
}
