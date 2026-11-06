/**
 * FILE:      test/useragent.test.ts
 * CREATED:   2026-11-05 14:16 +03
 * TASK:      Vikunja #939 (int-measure-signups)
 * AUTHOR:    M Alhassoun
 * WHAT:      Unit tests for the User-Agent kwtsms-js/<version> and the optional appName token.
 * WHY:       kwtSMS counts accounts per integration from the User-Agent; it must be exact and header-safe.
 * USAGE:     npm run test:unit (or node --import tsx/esm --test test/useragent.test.ts)
 * DEPENDS:   node:test, tsx; no network (https.request is mocked).
 */
import { test, describe, mock } from 'node:test';
import assert from 'node:assert/strict';
import https from 'node:https';
import { EventEmitter } from 'node:events';
import { readFileSync } from 'node:fs';
import { KwtSMS } from '../src/client.ts';
import { VERSION, buildUserAgent } from '../src/request.ts';

const pkgVersion = (JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as { version: string }).version;
const LIB = `kwtsms-js/${pkgVersion}`;

describe('User-Agent', () => {
  test('VERSION equals package.json version', () => {
    assert.equal(VERSION, pkgVersion);
  });

  test('default is the library token', () => {
    const ua = new KwtSMS('js_username', 'js_password', { logFile: '' }).userAgent;
    assert.equal(ua, LIB);
    assert.match(ua, /^kwtsms-js\/[0-9][0-9A-Za-z.+-]*$/);
  });

  test('appName is prepended', () => {
    const c = new KwtSMS('js_username', 'js_password', { logFile: '', appName: 'kwtsms-wordpress/3.5.2' });
    assert.equal(c.userAgent, `kwtsms-wordpress/3.5.2 ${LIB}`);
  });

  test('appName is sanitized', () => {
    const ua = buildUserAgent('my app\r\nX-Injected: 1');
    assert.ok(!ua.includes('\r') && !ua.includes('\n'));
    assert.ok(!ua.includes(' X-Injected'));
    assert.ok(ua.endsWith(` ${LIB}`));
    assert.equal(buildUserAgent('  - -  '), LIB);
    assert.equal(buildUserAgent('a'.repeat(200)).split(' ')[0].length, 64);
  });

  test('header is sent on a request', async () => {
    let sent: Record<string, unknown> = {};
    const m = mock.method(https, 'request', ((opts: { headers: Record<string, unknown> }, cb: (res: EventEmitter) => void) => {
      sent = opts.headers;
      const req = new EventEmitter() as EventEmitter & Record<string, unknown>;
      req.setTimeout = () => req;
      req.write = () => true;
      req.end = () => {
        const res = new EventEmitter();
        cb(res);
        res.emit('data', Buffer.from(JSON.stringify({ result: 'OK', available: 1, purchased: 1 })));
        res.emit('end');
      };
      return req;
    }) as unknown as typeof https.request);
    try {
      const c = new KwtSMS('js_username', 'js_password', { logFile: '', appName: 'my-shop/2.1.0' });
      const [ok] = await c.verify();
      assert.equal(ok, true);
      assert.equal(sent['User-Agent'], `my-shop/2.1.0 ${LIB}`);
    } finally {
      m.mock.restore();
    }
  });
});
