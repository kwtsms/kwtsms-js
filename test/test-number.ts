/**
 * FILE:      test/test-number.ts
 * CREATED:   2026-11-05 09:16 +03
 * TASK:      int-testnumber
 * AUTHOR:    M Alhassoun
 * WHAT:      Shared test helper: the test phone number and its format variants.
 * WHY:       Tests must not hardcode a phone number (sample numbers belong to real
 *            people). The number comes from the KWTSMS_TEST_NUMBER environment
 *            variable (digits only, 965 plus 8 digits) and every test that needs
 *            it is skipped when it is unset or malformed.
 * USAGE:     KWTSMS_TEST_NUMBER=965XXXXXXXX npm run test:unit
 *            Declared skip: test(name, { skip: testNumberSkip }, () => { const n = testNumber(); ... })
 *            Runtime skip:  const n = testNumberOrSkip(t); if (!n) return;
 *            Never print or log the returned value; compare with assertSameNumber().
 * DEPENDS:   node:assert/strict, node:test (TestContext type). Not a *.test.ts
 *            file, so the test glob does not run it on its own.
 */

import assert from 'node:assert/strict';
import type { TestContext } from 'node:test';

/** For values only passed through unchanged (e.g. a mocked echo or a log payload). */
export const TEST_NUMBER_PLACEHOLDER = '965XXXXXXXX';

const SKIP_REASON = 'KWTSMS_TEST_NUMBER not set (digits only, 965 plus 8 digits)';

const envNumber: string | null = (() => {
  const n = (process.env['KWTSMS_TEST_NUMBER'] ?? '').trim();
  return /^965[0-9]{8}$/.test(n) ? n : null;
})();

/** Pass as `{ skip: testNumberSkip }`: false when the number is set, otherwise the reason. */
export const testNumberSkip: string | false = envNumber === null ? SKIP_REASON : false;

/** KWTSMS_TEST_NUMBER. Only call inside a test declared with `{ skip: testNumberSkip }`. */
export function testNumber(): string {
  if (envNumber === null) throw new Error(SKIP_REASON);
  return envNumber;
}

/** KWTSMS_TEST_NUMBER, or null after marking the running test skipped. */
export function testNumberOrSkip(t: TestContext): string | null {
  if (envNumber === null) t.skip(SKIP_REASON);
  return envNumber;
}

function shiftDigits(s: string, zero: number): string {
  return s.replace(/[0-9]/g, (d) => String.fromCharCode(zero + Number(d)));
}

/** Latin digits to Arabic-Indic (U+0660-U+0669). */
export const toArabicIndic = (s: string): string => shiftDigits(s, 0x0660);

/** Latin digits to Extended Arabic-Indic / Persian (U+06F0-U+06F9). */
export const toPersian = (s: string): string => shiftDigits(s, 0x06f0);

/** Split 965XXXXXXXX into [country code, first 4 local digits, last 4 local digits]. */
export function splitKw(n: string): [string, string, string] {
  return [n.slice(0, 3), n.slice(3, 7), n.slice(7)];
}

/** Assert equality without printing either value (they may hold the number). */
export function assertSameNumber(actual: unknown, expected: string): void {
  assert.ok(actual === expected, 'phone number does not match the expected value (values hidden)');
}
