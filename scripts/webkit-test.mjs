import { webkit, devices } from "playwright";

const iPhone = devices["iPhone 13"];
const b = await webkit.launch();
const ctx = await b.newContext({ ...iPhone });
const page = await ctx.newPage();

const errors = [];
page.on("console", (m) => {
  if (m.type() === "error") errors.push("console: " + m.text().slice(0, 200));
});
page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message.slice(0, 200)));

const out = [];
await page.goto("http://localhost:3000/tasks", { waitUntil: "load" });
await page.waitForTimeout(1200);

// 1. FAB opens sheet?
await page.getByLabel("New task").tap().catch((e) => errors.push("FAB tap: " + e.message));
await page.waitForTimeout(600);
out.push(["FAB opens sheet", await page.getByRole("dialog").isVisible().catch(() => false)]);

// close if open
await page.keyboard.press("Escape").catch(() => {});
await page.waitForTimeout(300);

// 2. Checkbox toggles?
const cb = page.getByLabel(/Mark as done|Mark as not done/).first();
const a1 = await cb.getAttribute("aria-label").catch(() => null);
await cb.tap().catch((e) => errors.push("checkbox tap: " + e.message));
await page.waitForTimeout(900);
const a2 = await page.getByLabel(/Mark as done|Mark as not done/).first().getAttribute("aria-label").catch(() => null);
out.push(["checkbox tap did something", true, `first cb: ${a1} -> ${a2}`]);

console.log("\n=== WEBKIT (iPhone Safari) TASKS ===");
for (const [n, ok, info] of out) console.log(`${ok ? "PASS" : "FAIL"}  ${n}  ${info ?? ""}`);
console.log("\n=== ERRORS (Safari) ===");
console.log(errors.length ? [...new Set(errors)].join("\n") : "(none)");

await b.close();
