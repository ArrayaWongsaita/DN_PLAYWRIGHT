import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "@playwright/test";

const pages = ["/", "/products", "/products/p01", "/cart", "/login", "/register", "/stores"];

for (const path of pages) {
  test(`หน้าหลักไม่มีปัญหา a11y: ${path}`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // /products โหลดรายการจาก API ฝั่ง client จึงต้องรอให้รายการขึ้นก่อนตรวจ
    await expect(page.getByText("กำลังโหลดสินค้า...")).toBeHidden();
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(" | ")}`)).toEqual([]);
  });
}

test("หน้า a11y playground เจอปัญหาที่ตั้งใจ", async ({ page }) => {
  await page.goto("/playground/a11y");
  await expect(page).toHaveTitle("A11y - Playground | DN Shop");
  await expect(page.getByRole("heading", { level: 1, name: "หน้านี้มีปัญหา accessibility โดยตั้งใจ" })).toBeVisible();
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  const ids = results.violations.map((v) => v.id);
  expect(ids).toEqual(expect.arrayContaining(["image-alt", "button-name", "label", "color-contrast"]));
});
