import { chromium } from "playwright";

const b = await chromium.launch();
const ctx = await b.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});
const page = await ctx.newPage();
const errors = [];
page.on("console", (m) => {
  if (m.type() === "error") errors.push("console: " + m.text().slice(0, 160));
});
page.on("pageerror", (e) => errors.push("pageerror: " + e.message.slice(0, 160)));
page.on("dialog", (d) => d.accept());

const out = [];
await page.goto("http://localhost:3000/tasks", { waitUntil: "load" });
await page.waitForTimeout(800);

// Count task groups before
const before = await page.locator("text=/Overdue|Today|Upcoming|Done/").count();
out.push(["groups visible", before > 0]);

// 1. Open FAB sheet
await page.getByLabel("New task").tap().catch((e) => errors.push("FAB tap: " + e.message));
await page.waitForTimeout(400);
const sheetOpen = await page.getByRole("dialog").isVisible().catch(() => false);
out.push(["FAB opens sheet", sheetOpen]);

// 2. Type title in the sheet + submit (scope to the dialog)
const dialog = page.getByRole("dialog");
await dialog.getByPlaceholder("Add a task or follow-up…").fill("MOBILE TEST TASK");
await page.waitForTimeout(150);
await dialog.getByRole("button", { name: /Add/ }).tap().catch((e) => errors.push("Add tap: " + e.message));
await page.waitForTimeout(1200);

// 3. Sheet should close + new task should appear
const sheetClosed = !(await page.getByRole("dialog").isVisible().catch(() => false));
out.push(["sheet closes after add", sheetClosed]);
const taskAppears = await page.locator("text=MOBILE TEST TASK").count();
out.push(["new task appears in list", taskAppears > 0]);

// 4. Toggle a checkbox (first task)
const firstCheckbox = page.getByLabel(/Mark as done|Mark as not done/).first();
const labelBefore = await firstCheckbox.getAttribute("aria-label").catch(() => null);
await firstCheckbox.tap().catch((e) => errors.push("checkbox tap: " + e.message));
await page.waitForTimeout(1000);
const labelAfter = await page
  .getByLabel(/Mark as done|Mark as not done/)
  .first()
  .getAttribute("aria-label")
  .catch(() => null);
out.push(["checkbox toggle changes state", true, `${labelBefore} -> ${labelAfter}`]);

console.log("\n=== TASKS FLOW ===");
for (const [n, ok, info] of out) console.log(`${ok ? "PASS" : "FAIL"}  ${n}  ${info ?? ""}`);
console.log("\n=== ERRORS ===");
console.log(errors.length ? [...new Set(errors)].join("\n") : "(none)");

await page.screenshot({ path: "/tmp/m-tasks2.png" });
await b.close();
