import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { normalizePhone, validatePhoneInput } from '../src/phone.ts';
// 2026-11-05 09:16 +03: Kuwait number tests read KWTSMS_TEST_NUMBER through test-number.ts and skip when it is unset;
// format variants are built at runtime and compared without printing values. The old sample belongs to a real person, int-testnumber.
import { testNumberSkip, testNumber, toArabicIndic, toPersian, splitKw, assertSameNumber } from './test-number.ts';

const needsNumber = { skip: testNumberSkip };

describe('normalizePhone', () => {
  const variant = (build: (n: string, cc: string, a: string, b: string) => string) => () => {
    const n = testNumber();
    const [cc, a, b] = splitKw(n);
    assertSameNumber(normalizePhone(build(n, cc, a, b)), n);
  };
  test('strips + prefix', needsNumber, variant((n) => `+${n}`));
  test('strips 00 prefix', needsNumber, variant((n) => `00${n}`));
  test('strips spaces', needsNumber, variant((_n, cc, a, b) => `${cc} ${a} ${b}`));
  test('strips dashes', needsNumber, variant((_n, cc, a, b) => `${cc}-${a}-${b}`));
  test('strips dots', needsNumber, variant((_n, cc, a, b) => `${cc}.${a}.${b}`));
  test('strips parentheses', needsNumber, variant((_n, cc, a, b) => `(${cc})${a}${b}`));
  test('converts Arabic-Indic digits (U+0660-U+0669)', needsNumber, variant((n) => toArabicIndic(n)));
  test('converts Extended Arabic-Indic/Persian digits (U+06F0-U+06F9)', () => {
    assert.equal(normalizePhone('۹۶۵'), '965');
  });
  test('converts a full Persian-digit number', needsNumber, variant((n) => toPersian(n)));
  test('strips leading zeros', needsNumber, () => {
    const n = testNumber();
    assertSameNumber(normalizePhone(`00${n}`), n);
    assertSameNumber(normalizePhone(`0${n}`), n);
  });
  test('handles already normalized number', needsNumber, variant((n) => n));
  test('returns empty string for empty input', () => assert.equal(normalizePhone(''), ''));
  test('handles number that is all zeros', () => assert.equal(normalizePhone('000'), ''));
});

describe('validatePhoneInput', () => {
  test('valid Kuwait number with + prefix', needsNumber, () => {
    const n = testNumber();
    const [valid, error, normalized] = validatePhoneInput(`+${n}`);
    assert.equal(valid, true);
    assert.equal(error, null);
    assertSameNumber(normalized, n);
  });

  test('valid 7-digit minimum number', () => {
    // "870" has no entry in PHONE_RULES, so passes with generic E.164 validation
    const [valid, error, normalized] = validatePhoneInput('8701234');
    assert.equal(valid, true);
    assert.equal(error, null);
    assert.equal(normalized, '8701234');
  });

  test('valid 15-digit maximum number', () => {
    // "870" has no entry in PHONE_RULES, so passes with generic E.164 validation
    const [valid] = validatePhoneInput('870123456789012');
    assert.equal(valid, true);
  });

  test('empty string fails with "required" message', () => {
    const [valid, error, normalized] = validatePhoneInput('');
    assert.equal(valid, false);
    assert.equal(error, 'Phone number is required');
    assert.equal(normalized, '');
  });

  test('blank whitespace fails with "required" message', () => {
    const [valid, error] = validatePhoneInput('   ');
    assert.equal(valid, false);
    assert.equal(error, 'Phone number is required');
  });

  test('email address fails with email message', () => {
    const [valid, error] = validatePhoneInput('user@gmail.com');
    assert.equal(valid, false);
    assert.ok(error!.includes('email address'));
  });

  test('text with no digits fails', () => {
    const [valid, error] = validatePhoneInput('abc');
    assert.equal(valid, false);
    assert.ok(error!.includes('no digits found'));
  });

  test('too short (3 digits) fails with count and minimum', () => {
    const [valid, error, normalized] = validatePhoneInput('123');
    assert.equal(valid, false);
    assert.ok(error!.includes('too short'));
    assert.ok(error!.includes('3'));
    assert.ok(error!.includes('minimum is 7'));
    assert.equal(normalized, '123');
  });

  test('too long (16 digits) fails with count and maximum', () => {
    const [valid, error] = validatePhoneInput('1234567890123456');
    assert.equal(valid, false);
    assert.ok(error!.includes('too long'));
    assert.ok(error!.includes('maximum is 15'));
  });

  test('Saudi number with redundant local leading zero is stripped and valid', () => {
    const [valid, error, normalized] = validatePhoneInput('9660559123456');
    assert.equal(valid, true);
    assert.equal(error, null);
    assert.equal(normalized, '966559123456');
  });

  test('Kuwait number with redundant local leading zero is stripped and valid', needsNumber, () => {
    // 965 + 0 + 8-digit local → 965 + 8-digit local
    const n = testNumber();
    const [valid, error, normalized] = validatePhoneInput(`9650${n.slice(3)}`);
    assert.equal(valid, true);
    assert.equal(error, null);
    assertSameNumber(normalized, n);
  });

  test('Arabic digits in valid number pass and normalize', needsNumber, () => {
    const n = testNumber();
    const [valid, , normalized] = validatePhoneInput(`+${toArabicIndic(n)}`);
    assert.equal(valid, true);
    assertSameNumber(normalized, n);
  });

  test('Latin country code with Arabic-Indic local digits passes and normalizes', needsNumber, () => {
    const n = testNumber();
    const [valid, , normalized] = validatePhoneInput(`965${toArabicIndic(n.slice(3))}`);
    assert.equal(valid, true);
    assertSameNumber(normalized, n);
  });

  test('singular digit message for 1-digit input', () => {
    const [, error] = validatePhoneInput('5');
    assert.ok(error!.includes('1 digit,') || error!.includes('1 digit '));
  });
});
