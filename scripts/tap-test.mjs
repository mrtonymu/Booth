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
  if (m.type() === "error") errors.push("console: " + m.text().slice(0, 120));
});
page.on("pageerror", (e) => errors.push("pageerror: " + e.message.slice(0, 120)));

async function go(path) {
  await page.goto("http://localhost:3000" + path, { waitUntil: "load" });
  await page.waitForTimeout(800);
}

const results = [];

// 1. Client card tap -> navigates to detail
await go("/clients");
const before = page.url();
await page.locator("button:has-text('Lim Wei Jie'), [class*=cursor]:has-text('Lim Wei Jie')").first().tap().catch(() => {});
await page.waitForTimeout(600);
results.push(["client card tap -> detail", page.url() !== before && /\/clients\/.+/.test(page.url()), page.url()]);

// 2. Bottom tab tap -> navigates
await go("/clients");
await page.getByRole("link", { name: "Pipeline" }).tap().catch(() => {});
await page.waitForTimeout(600);
results.push(["bottom tab 'Pipeline' tap", page.url().endsWith("/pipeline"), page.url()]);

// 3. FAB on tasks -> opens sheet
await go("/tasks");
await page.getByLabel("New task").tap().catch(() => {});
await page.waitForTimeout(500);
const sheet = await page.getByRole("dialog").isVisible().catch(() => false);
results.push(["tasks FAB -> bottom sheet opens", sheet, ""]);

// 4. Theme toggle -> toggles .dark
await go("/dashboard");
const darkBefore = await page.evaluate(() => document.documentElement.classList.contains("dark"));
await page.getByRole("button", { name: /dark mode|light mode/i }).tap().catch(() => {});
await page.waitForTimeout(400);
const darkAfter = await page.evaluate(() => document.documentElement.classList.contains("dark"));
results.push(["theme toggle tap", darkBefore !== darkAfter, `${darkBefore}->${darkAfter}`]);

// 5. Pipeline stage <select> change -> stays usable (no crash)
await go("/pipeline");
const selExists = await page.locator("select").first().isVisible().catch(() => false);
results.push(["pipeline stage select present", selExists, ""]);

console.log("\n=== TAP TEST RESULTS ===");
for (const [name, ok, info] of results) {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}  ${info}`);
}
console.log("\n=== CONSOLE/PAGE ERRORS ===");
console.log(errors.length ? [...new Set(errors)].join("\n") : "(none)");

await b.close();
