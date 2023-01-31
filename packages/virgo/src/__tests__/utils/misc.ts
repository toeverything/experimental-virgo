import type { Page } from '@playwright/test';

export async function enterPlayground(page: Page): Promise<void> {
  await page.goto(`http://localhost:5173/test-page/`);
}

export async function focusRichText(page: Page): Promise<void> {
  const editorPosition = await page.evaluate(() => {
    const editor = document
      .querySelector('test-page')
      ?.shadowRoot?.querySelector('rich-text')
      ?.shadowRoot?.querySelector('[data-virgo-root="true"]')!;
    return editor.getBoundingClientRect();
  });

  await page.mouse.click(editorPosition.x + 400, editorPosition.y + 450);
}

export async function pageType(page: Page, text: string): Promise<void> {
  await page.keyboard.type(text, { delay: 100 });
}

export async function pagePress(page: Page, key: string): Promise<void> {
  await page.keyboard.press(key, { delay: 100 });
}
