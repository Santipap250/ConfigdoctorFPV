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

  test("Config Diff stays empty until both sides have text", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Config", exact: true }).click();
    await expect(page.getByText("Paste CLI text on both sides to compare.")).toBeVisible();
  });

  test("Config Diff reports added, removed, and changed keys", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Config", exact: true }).click();
    await page.getByLabel("Before CLI text").fill("set gyro_lpf1_static_hz = 500\nset dterm_lpf1_static_hz = 150");
    await page.getByLabel("After CLI text").fill("set gyro_lpf1_static_hz = 350\nset dyn_notch_count = 3");
    await expect(page.locator(".config-diff__row--changed")).toContainText("gyro_lpf1_static_hz");
    await expect(page.locator(".config-diff__row--added")).toContainText("dyn_notch_count");
    await expect(page.locator(".config-diff__row--removed")).toContainText("dterm_lpf1_static_hz");
  });

  test("Config Diff 'use current draft' fills a pane from the active profile", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Config", exact: true }).click();
    await page.getByRole("button", { name: "USE CURRENT DRAFT" }).first().click();
    await expect(page.getByLabel("Before CLI text")).not.toHaveValue("");
  });

  test("Config Diff firmware check is off by default and flags an out-of-range value when enabled", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Config", exact: true }).click();
    await page.getByLabel("Before CLI text").fill("set dyn_notch_count = 3");
    await page.getByLabel("After CLI text").fill("set dyn_notch_count = 12");
    await expect(page.getByText("NOT VALIDATED")).toHaveCount(0);
    await page.getByText(/Check "after" values against/).click();
    await expect(page.getByText("OUTSIDE DOCUMENTED RANGE", { exact: true })).toBeVisible();
  });
});
