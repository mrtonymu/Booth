import { chromium } from "playwright";
import { writeFileSync } from "node:fs";

// 1x1 red PNG
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);
writeFileSync("/tmp/test-photo.png", PNG);

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1200, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message.slice(0, 160)));
page.on("console", (m) => {
  if (m.type() === "error") errors.push("console: " + m.text().slice(0, 160));
});

const out = [];

// Open a client detail (cl_1)
await page.goto("http://localhost:3000/clients/cl_1", { waitUntil: "load" });
await page.waitForTimeout(800);

// --- Appointment ---
await page.getByLabel("Appointment date and time").fill("2026-06-18T14:30");
await page.getByRole("button", { name: "Save", exact: true }).click();
await page.waitForTimeout(1200);
const apptShown = await page.locator("text=18 Jun 2026").count();
out.push(["appointment saved + shown", apptShown > 0]);

// --- Upload a photo ---
await page.setInputFiles('input[aria-label="Upload file"]', "/tmp/test-photo.png");
await page.waitForTimeout(2000);
const thumb = await page.locator('img[alt="test-photo.png"]').count();
const named = await page.locator("text=test-photo.png").count();
out.push(["photo uploaded + thumbnail shown", thumb > 0 && named > 0]);

// --- Calendar shows the appointment (orange) ---
await page.goto("http://localhost:3000/calendar", { waitUntil: "load" });
await page.waitForTimeout(800);
// navigate to June 2026 is default (today is seeded ~June). Look for the client name on calendar.
const onCal = await page.locator("text=Lim Wei Jie").count();
out.push(["appointment appears on calendar", onCal > 0]);

console.log("\n=== APPOINTMENT + UPLOAD TEST ===");
for (const [n, ok] of out) console.log(`${ok ? "PASS" : "FAIL"}  ${n}`);
console.log("\n=== ERRORS ===");
console.log(errors.length ? [...new Set(errors)].join("\n") : "(none)");

await page.goto("http://localhost:3000/clients/cl_1", { waitUntil: "load" });
await page.waitForTimeout(600);
await page.screenshot({ path: "/tmp/appt-detail.png", fullPage: false });
await b.close();
