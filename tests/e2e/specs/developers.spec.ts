import { authAvailable, authFile } from "../fixtures/auth.ts";
import { expect, test } from "../fixtures/test.ts";
import { finishFlow } from "../lib/finish-flow.ts";

test.describe("developer portal", () => {
  test("footer links to the API docs with the alpha notice", async ({
    page,
    consoleErrors,
    perfSnapshot,
    recordFlowMetric,
  }) => {
    await page.goto("/privacy");
    await page
      .getByRole("contentinfo")
      .getByRole("link", { name: "Developers" })
      .click();
    await page.waitForURL("**/developers");
    await expect(
      page.getByRole("heading", { name: "Curolia API" }),
    ).toBeVisible();
    await expect(page.getByRole("note")).toContainText("Alpha");
    await expect(page.getByText("/v1/maps/{mapId}/pins").first()).toBeVisible();

    await finishFlow("developers", {
      consoleErrors,
      snapshot: await perfSnapshot(),
      recordFlowMetric,
    });
  });

  test.describe("signed in", () => {
    test.use({ storageState: authFile });

    test("can create and revoke an API key", async ({
      page,
      consoleErrors,
      perfSnapshot,
      recordFlowMetric,
    }) => {
      test.skip(!authAvailable(), "E2E user not seeded");
      const name = `e2e key ${Date.now()}`;
      await page.goto("/developers/keys");
      await expect(
        page.getByRole("heading", { name: "API keys" }),
      ).toBeVisible();

      await page.locator("#api-key-name").fill(name);
      await page.getByRole("button", { name: "Create API key" }).click();
      await expect(page.getByLabel("New API key")).toContainText("cur_live_");
      await page.getByRole("button", { name: "Done" }).click();

      const row = page.getByRole("listitem").filter({ hasText: name });
      await expect(row).toBeVisible();
      page.once("dialog", (d) => void d.accept());
      await row.getByRole("button", { name: "Revoke" }).click();
      await expect(row).toHaveCount(0);

      await finishFlow("developers", {
        consoleErrors,
        snapshot: await perfSnapshot(),
        recordFlowMetric,
      });
    });
  });
});
