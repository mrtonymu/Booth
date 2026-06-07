import { chromium } from "playwright";

const PAGES = [
  ["dashboard", "/dashboard"],
  ["clients", "/clients"],
  ["pipeline", "/pipeline"],
  ["tasks", "/tasks"],
  ["calendar", "/calendar"],
  ["client-detail", "/clients/cl_4"],
];

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  userAgent:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
});
const page = await ctx.newPage();

for (const [name, path] of PAGES) {
  await page.goto("http://localhost:3000" + path, { waitUntil: "load" });
  await page.waitForSelector("main", { timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(700);
  await page.screenshot({ path: `/tmp/m-${name}.png` });
  console.log("shot:", name);
}

await browser.close();
console.log("done");
