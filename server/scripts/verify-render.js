/**
 * Real-browser verification of the responsive fixes.
 *
 *   npm run dev                       # in one terminal
 *   npm run verify:render             # in another
 *
 * Exists because the reported bug was horizontal scroll, and the only honest way
 * to confirm that is gone is to measure scrollWidth in a real browser at real
 * viewport widths. Everything else — reading the built CSS, grepping the source —
 * is inference.
 *
 * Also checks the touch-device path: the cursor canvas parked a teal "eye" at
 * screen centre on phones and sprayed particles over the content forever, so we
 * assert it does not mount when the pointer is coarse.
 */

import { chromium, devices } from 'playwright';

const BASE = process.env.VERIFY_URL || 'http://localhost:5173';

const VIEWPORTS = [
    { name: 'iPhone SE', width: 375, height: 667, touch: true },
    { name: 'iPhone 14', width: 390, height: 844, touch: true },
    { name: 'iPad', width: 768, height: 1024, touch: true },
    { name: 'laptop', width: 1024, height: 768, touch: false },
    { name: 'desktop', width: 1440, height: 900, touch: false },
];

let failures = 0;
const fail = (msg) => {
    failures++;
    console.log(`    FAIL  ${msg}`);
};
const pass = (msg) => console.log(`    ok    ${msg}`);

const browser = await chromium.launch();

for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        hasTouch: vp.touch,
        isMobile: vp.touch,
        ...(vp.touch ? devices['iPhone 13'].userAgent && { userAgent: devices['iPhone 13'].userAgent } : {}),
    });
    const page = await context.newPage();

    const consoleErrors = [];
    page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));
    page.on('pageerror', (e) => consoleErrors.push(String(e)));

    console.log(`\n  ${vp.name} — ${vp.width}x${vp.height}${vp.touch ? ' (touch)' : ''}`);

    // Not 'networkidle': Vite's HMR websocket stays open, so it never fires.
    await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForSelector('#hero', { timeout: 30_000 });
    await page.waitForTimeout(900); // let entrance animations settle

    // --- the reported bug -------------------------------------------------
    const scroll = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
    }));
    if (scroll.scrollWidth > scroll.clientWidth) {
        fail(`horizontal scroll: scrollWidth ${scroll.scrollWidth} > clientWidth ${scroll.clientWidth}`);

        // Name the culprits so this is actionable rather than just red.
        const wide = await page.evaluate((cw) => {
            const out = [];
            for (const el of document.querySelectorAll('*')) {
                const r = el.getBoundingClientRect();
                if (r.right > cw + 1 && r.width > 0) {
                    out.push(`${el.tagName.toLowerCase()}.${(el.className || '').toString().slice(0, 60)} right=${Math.round(r.right)}`);
                }
            }
            return out.slice(0, 5);
        }, scroll.clientWidth);
        wide.forEach((w) => console.log(`          overflowing: ${w}`));
    } else {
        pass(`no horizontal scroll (${scroll.scrollWidth} = ${scroll.clientWidth})`);
    }

    // --- cursor canvas must not mount on touch ----------------------------
    const canvasCount = await page.locator('canvas.mix-blend-screen').count();
    if (vp.touch && canvasCount > 0) fail('cursor canvas mounted on a touch device');
    else if (vp.touch) pass('cursor canvas correctly absent on touch');
    else if (canvasCount > 0) pass('cursor canvas present on pointer device');
    else fail('cursor canvas missing on a pointer device');

    // --- content actually rendered ----------------------------------------
    for (const [label, text] of [
        ['Kontexo card', 'Kontexo'],
        ['FlowPilot card', 'FlowPilot'],
        ['CGPA 7.13', '7.13'],
        ['Power BI cert', 'Power BI for Beginners'],
        ['Resume dropdown', 'Get Resume'],
    ]) {
        const n = await page.getByText(text, { exact: false }).count();
        n > 0 ? pass(`${label} rendered`) : fail(`${label} NOT rendered`);
    }

    // --- the resume dropdown actually opens -------------------------------
    const trigger = page.getByRole('button', { name: /Get Resume/i }).first();
    if (await trigger.count()) {
        await trigger.click();
        await page.waitForTimeout(250);
        const imnu = page.getByRole('menuitem', { name: /IMNU Resume/i });
        (await imnu.count()) ? pass('dropdown opens with IMNU Resume') : fail('dropdown did not open');
        await page.keyboard.press('Escape');
        await page.waitForTimeout(200);
        (await imnu.count()) === 0 ? pass('dropdown closes on Escape') : fail('Escape did not close dropdown');
    } else {
        fail('Get Resume trigger not found');
    }

    if (consoleErrors.length) {
        fail(`${consoleErrors.length} console error(s)`);
        consoleErrors.slice(0, 3).forEach((e) => console.log(`          ${e.slice(0, 140)}`));
    } else {
        pass('no console errors');
    }

    await context.close();
}

await browser.close();

console.log(failures === 0 ? '\nPASS: all viewports clean' : `\nFAIL: ${failures} problem(s)`);
process.exit(failures === 0 ? 0 : 1);
