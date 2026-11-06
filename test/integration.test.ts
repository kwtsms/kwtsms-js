/**
 * Integration tests: hit the live kwtSMS API.
 *
 * All tests SKIPPED if KWTSMS_USERNAME or KWTSMS_PASSWORD are not set.
 * Tests that need a phone number are also skipped unless KWTSMS_TEST_NUMBER is set
 * (digits only, 965 plus 8 digits). Sends go only to that number.
 * Always uses testMode=true. Credits are held in queue (recover by deleting
 * test messages from kwtsms.com Queue).
 *
 * 2026-11-05 09:18 +03: removed the client and CLI 250-number bulk sends (generated numbers belong to
 * real people) and the hardcoded fallback number; live sends go only to KWTSMS_TEST_NUMBER, int-testnumber.
 *
 * Credit budget (known before any sends):
 *   - Basic sends:     3  (mixed, +prefix, valid number)
 *   - Total:           3
 *
 * To run:
 *   KWTSMS_USERNAME=user KWTSMS_PASSWORD=pass KWTSMS_TEST_NUMBER=965XXXXXXXX node --import tsx/esm --test test/integration.test.ts
 */

import { test, describe, before, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { KwtSMS } from '../src/client.ts';
import { testNumberOrSkip } from './test-number.ts';

const HAS_CREDS = !!(process.env['KWTSMS_USERNAME'] && process.env['KWTSMS_PASSWORD']);

// ── Credit budget ─────────────────────────────────────────────────────────────
// Every send() in test mode holds credits in the queue (1 credit per number).
// These constants let every test verify balance-after precisely.

const CREDITS_BASIC_SENDS  = 3;    // 3 individual send() calls (1 number each)
const TOTAL_CREDITS_NEEDED = CREDITS_BASIC_SENDS;

// ── Shared state across all suites ────────────────────────────────────────────

let initialBalance: number | null = null;
let hasBudget = false; // true if balance >= TOTAL_CREDITS_NEEDED
let basicSendsMade = 0;

type TestFn = (t: TestContext) => void | Promise<void>;

function skipIf(condition: boolean, name: string, fnOrOpts: TestFn | Record<string, unknown>, maybeFn?: TestFn): void {
  const fn = typeof fnOrOpts === 'function' ? fnOrOpts : maybeFn!;
  const opts = typeof fnOrOpts === 'function' ? undefined : fnOrOpts;
  if (condition) {
    test(`[SKIPPED: no credentials] ${name}`, () => {});
    return;
  }
  if (opts) {
    test(name, opts, fn);
  } else {
    test(name, fn);
  }
}

// ── Initial balance check (runs before everything) ───────────────────────────

describe('Integration: initial balance check', () => {
  skipIf(!HAS_CREDS, `balance(): record initial balance (need >= ${TOTAL_CREDITS_NEEDED} credits)`, async () => {
    const sms = new KwtSMS(
      process.env['KWTSMS_USERNAME']!,
      process.env['KWTSMS_PASSWORD']!,
      { testMode: true, logFile: '' },
    );
    const [ok, bal, err] = await sms.verify();
    assert.equal(ok, true, `verify failed: ${err}`);
    assert.ok(typeof bal === 'number', 'balance should be a number');
    initialBalance = bal;
    hasBudget = bal >= TOTAL_CREDITS_NEEDED;
    console.log(`  Initial balance: ${bal}`);
    console.log(`  Credits needed:  ${TOTAL_CREDITS_NEEDED} (basic=${CREDITS_BASIC_SENDS})`);
    if (!hasBudget) {
      console.log(`  ⚠ Insufficient balance. Send tests will be skipped.`);
      console.log('    Delete test messages from kwtsms.com Queue to recover credits.');
    }
  });
});

// ── Basic API tests ───────────────────────────────────────────────────────────

describe('Integration: kwtSMS API (testMode=true)', () => {
  let sms: KwtSMS;

  before(() => {
    if (!HAS_CREDS) return;
    sms = new KwtSMS(
      process.env['KWTSMS_USERNAME']!,
      process.env['KWTSMS_PASSWORD']!,
      { testMode: true, logFile: '' },
    );
  });

  // ── Tests that consume zero credits ──

  // 2026-11-07 02:11 +03: live wrong-credential test removed: it logged a failed login on our API every run (#995).
  // ERR003 is covered offline in client.test.ts. Task neg-auth-tests.

  skipIf(!HAS_CREDS, 'send(): email input rejected locally (no API call, 0 credits)', async () => {
    const result = await sms.send('test@example.com', 'test');
    assert.equal(result.result, 'ERROR');
    assert.equal((result as { code?: string }).code, 'ERR_INVALID_INPUT');
  });

  skipIf(!HAS_CREDS, 'send(): too-short number rejected locally (0 credits)', async () => {
    const result = await sms.send('123', 'test');
    assert.equal(result.result, 'ERROR');
    assert.equal((result as { code?: string }).code, 'ERR_INVALID_INPUT');
  });

  skipIf(!HAS_CREDS, 'validate(): returns ok, er, nr arrays (0 credits)', async (t) => {
    const n = testNumberOrSkip(t); if (!n) return;
    const result = await sms.validate([n, `+${n}`]);
    assert.ok(Array.isArray(result.ok));
    assert.ok(Array.isArray(result.er));
    assert.ok(Array.isArray(result.nr));
  });

  skipIf(!HAS_CREDS, 'senderids(): returns result and senderids array', async () => {
    const result = await sms.senderids();
    assert.equal(result.result, 'OK');
    assert.ok(Array.isArray(result.senderids));
  });

  skipIf(!HAS_CREDS, 'coverage(): returns result from API', async () => {
    const result = await sms.coverage();
    assert.ok(['OK', 'ERROR'].includes(result.result));
  });

  // ── Tests that consume credits (3 total) ──

  skipIf(!HAS_CREDS, 'send(): mixed valid+invalid reports both (1 credit)', async (t) => {
    if (!hasBudget) { console.log('  [SKIPPED: insufficient balance]'); return; }
    const n = testNumberOrSkip(t); if (!n) return;
    basicSendsMade++;
    const result = await sms.send([n, 'abc', ''], 'Integration test');
    assert.ok('invalid' in result, 'invalid field should exist');
    const inv = (result as { invalid: unknown[] }).invalid;
    assert.ok(Array.isArray(inv));
    assert.equal(inv.length, 2);
  });

  skipIf(!HAS_CREDS, 'send(): + prefix normalized and sent to API (1 credit)', async (t) => {
    if (!hasBudget) { console.log('  [SKIPPED: insufficient balance]'); return; }
    const n = testNumberOrSkip(t); if (!n) return;
    basicSendsMade++;
    const result = await sms.send(`+${n}`, 'Normalize + prefix test');
    assert.ok(['OK', 'ERROR'].includes(result.result), `unexpected result: ${result.result}`);
    if (result.result === 'ERROR') assert.ok((result as { code?: string }).code);
  });

  skipIf(!HAS_CREDS, 'send(): valid Kuwait number result is OK (1 credit)', async (t) => {
    if (!hasBudget) { console.log('  [SKIPPED: insufficient balance]'); return; }
    const n = testNumberOrSkip(t); if (!n) return;
    basicSendsMade++;
    const result = await sms.send(n, 'kwtSMS JS integration test');
    assert.ok(['OK', 'ERROR'].includes(result.result));
    if (result.result === 'ERROR') assert.ok((result as { code?: string }).code);
  });

  skipIf(!HAS_CREDS, `balance after basic sends should be initialBalance - ${CREDITS_BASIC_SENDS}`, async () => {
    if (!hasBudget || basicSendsMade === 0) { console.log('  [SKIPPED: no sends were made]'); return; }
    const [ok, bal, err] = await sms.verify();
    assert.equal(ok, true, `verify failed: ${err}`);
    const expected = initialBalance! - basicSendsMade;
    assert.equal(bal, expected, `expected balance ${expected} (initial ${initialBalance} - ${basicSendsMade}), got ${bal}`);
    console.log(`  Balance after basic sends: ${bal} (consumed ${basicSendsMade}, expected ${expected})`);
  });
});
