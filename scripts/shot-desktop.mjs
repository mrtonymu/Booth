import { chromium } from "playwright";
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
const p = await ctx.newPage();
for (const [name, path] of [["clients-desktop","/clients"],["stages","/settings/stages"],["search","/search?q=a"]]) {
  await p.goto("http://localhost:3000"+path, { waitUntil: "load" });
  await p.waitForTimeout(700);
  await p.screenshot({ path: `/tmp/d-${name}.png` });
}
await b.close(); console.log("done");
