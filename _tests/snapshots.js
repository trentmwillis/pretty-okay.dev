const PercyScript = require('@percy/script');

PercyScript.run(async (page, snapshot) => {
    await page.goto('http://localhost:4000');
    await page.focus('#aa-search-input');
    await page.type('#aa-search-input', 'Trent');
    await page.waitFor('.aa-suggestions');
    await page.keyboard.press('ArrowDown');
    await snapshot('search-open');

    await page.goto('http://localhost:4000/2018/09/17/static-site-api');
    await page.click('.collapsible-toggle');
    await snapshot('collapsible-toggle-open');
});
