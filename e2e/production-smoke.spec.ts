import { expect, test } from "@playwright/test";

test.describe("OBIX production smoke", () => {
  test("loads mission control and navigates to the tool center", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Calculate\./ })).toBeVisible();
    await page.getByRole("button", { name: "Tools" }).click();
    await expect(page.getByRole("heading", { name: /Tools with a/ })).toBeVisible();
    await expect(page.getByText("MISSION READINESS", { exact: true })).toBeVisible();
  });

  test("shows field validation when required profile inputs are cleared", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Workbench", exact: true }).click();
    const name = page.locator('input[aria-label="PROJECT NAME"]');
    await name.fill("");
    await expect(page.locator("small.field-error", { hasText: "Project name is required" })).toBeVisible();
    await expect(name).toHaveAttribute("aria-invalid", "true");
  });

  test("Fix this focuses and scrolls to the missing thrust input", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Tools" }).click();
    await page.getByRole("button", { name: "FIX THIS" }).nth(1).click();
    const thrust = page.locator("#readiness-input-thrust");
    await expect(thrust).toBeFocused();
    await expect(thrust).toHaveClass(/is-fix-target/);
  });

  test("Motor & Prop Evidence table shows cited entries and links to a real source", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Tools" }).click();
    await expect(page.getByRole("heading", { name: /Hardware data with a/ })).toBeVisible();
    const firstSourceLink = page.locator(".evidence-row__source a").first();
    await expect(firstSourceLink).toBeVisible();
    await expect(firstSourceLink).toHaveAttribute("href", /^https:\/\//);
    await expect(firstSourceLink).toHaveAttribute("target", "_blank");
  });

  test("Motor & Prop Evidence filters narrow results and can reach an empty, non-guessed state", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Tools" }).click();
    await page.getByLabel("Search evidence entries").fill("no-such-hardware-xyz");
    await expect(page.getByText("No cited entries match this filter.")).toBeVisible();
  });
});
