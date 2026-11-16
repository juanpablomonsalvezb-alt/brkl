import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import puppeteer from 'puppeteer';
import { existsSync, readFileSync } from 'node:fs';

// Solo archivos locales; el navegador no puede hacer peticiones API ni externas.
test('FAQ sin backend, menú accesible y metadatos al navegar', async () => {
  const origin = 'http://127.0.0.1:4791';
  const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4791', '--strictPort'], { stdio: 'ignore' });
  let browser;
  try {
    let ready = false;
    for (let i = 0; i < 80; i++) {
      try { if ((await fetch(origin + '/favicon.svg')).ok) { ready = true; break; } } catch {}
      await new Promise((done) => setTimeout(done, 100));
    }
    assert.equal(ready, true, 'Vite Preview debe estar listo');
    browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const url = new URL(request.url());
      const snapshotPath = `client/public/prerendered/${url.pathname === '/' ? 'index' : url.pathname.slice(1)}.html`;
      if (url.origin === origin && request.isNavigationRequest() && existsSync(snapshotPath)) {
        const shell = readFileSync(existsSync('dist/public/index.html') ? 'dist/public/index.html' : 'dist/public/app.html', 'utf8');
        const assetPattern = /<(?:script|link)\b[^>]*["']\/assets\/[^>]*>(?:\s*<\/script>)?/gi;
        const assets = shell.match(assetPattern) ?? [];
        const html = readFileSync(snapshotPath, 'utf8').replace(assetPattern, '').replace('</head>', assets.join('\n') + '</head>');
        void request.respond({ status: 200, contentType: 'text/html', body: html });
      } else if (url.origin === origin && !url.pathname.startsWith('/api/')) void request.continue();
      else void request.abort();
    });
    for (const width of [1280, 390]) {
      await page.setViewport({ width, height: 800 });
      await page.goto(origin + '/preguntas-frecuentes', { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('[data-public-faqs]');
      assert.equal(await page.$$eval('[data-public-faqs] h3', (els) => els.length), 6);
      assert.equal(await page.$eval('[data-public-faqs] [role="region"]', (el) => getComputedStyle(el).display), 'none');
      await page.click('[data-public-faqs] button');
      await page.waitForFunction(() => document.querySelector('[data-public-faqs] button')?.getAttribute('aria-expanded') === 'true');
      assert.notEqual(await page.$eval('[data-public-faqs] [role="region"]', (el) => getComputedStyle(el).display), 'none');
      assert.equal(await page.$eval('[data-hdr="logo-text"]', (el) => getComputedStyle(el).color), 'rgb(0, 51, 102)');
      await page.click('[aria-controls="site-menu"]');
      await page.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === 'Cerrar menú');
      await page.keyboard.down('Shift'); await page.keyboard.press('Tab'); await page.keyboard.up('Shift');
      assert.equal(await page.evaluate(() => document.activeElement?.textContent), 'Postular');
      await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('aria-label')), 'Cerrar menú');
      await page.keyboard.press('Escape');
      assert.equal(await page.$eval('[aria-controls="site-menu"]', (el) => el.getAttribute('aria-expanded')), 'false');
      assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('aria-controls')), 'site-menu');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
    }
    await page.goto(origin + '/neurodivergentes', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.title.includes('TEA') && document.querySelector('meta[property="og:title"]')?.content === document.title);
    assert.match(await page.$eval('meta[name="description"]', (el) => el.content), /TEA/);
    assert.equal(await page.$eval('link[rel="canonical"]', (el) => el.href), 'https://www.barkleyinstituto.cl/neurodivergentes');
    // Prueba navegación SPA con Link real de la página legal, no solo goto.
    await page.goto(origin + '/privacidad', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('h1');
    await page.click('header a');
    await page.waitForSelector('main#main-content');
    await page.waitForFunction(() => document.querySelector('link[rel="canonical"]')?.href === 'https://www.barkleyinstituto.cl/');
    await page.waitForFunction(() => document.title === 'Barkley Online — Colegio 100% asincrónico e inclusivo en Chile');
    assert.equal(await page.$eval('meta[name="robots"]', (el) => el.content), 'index, follow');
    for (const width of [1280, 390]) {
      await page.setViewport({ width, height: 800 });
      for (const [path, selector] of [
        ['/guia-examenes-libres/', '#dudas'],
        ['/examenes-libres-1-basico/', '#orientacion-del-nivel'],
        ['/examenes-libres-8-basico/', '#orientacion-del-nivel'],
        ['/tour-plataforma', '#ejemplo-vortice'],
      ]) {
        await page.goto(origin + path, { waitUntil: 'domcontentloaded' });
        await page.waitForSelector(selector);
        assert.equal(await page.$$eval('h1', (els) => els.length), 1, path);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, `${width}: ${path}`);
      }
    }
    assert.equal(pageErrors.length, 0, pageErrors.join('\n'));
  } finally {
    if (browser) await browser.close();
    server.kill();
  }
});
