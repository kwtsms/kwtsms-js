/**
 * kwtsms: JavaScript/TypeScript client for the kwtSMS SMS API (kwtsms.com)
 *
 * @example
 * ```typescript
 * // TypeScript / ESM
 * import { KwtSMS } from 'kwtsms';
 * const sms = KwtSMS.fromEnv();
 * const result = await sms.send('965XXXXXXXX', 'Your OTP for MYAPP is: 123456');
 * ```
 * 2026-11-05 09:15 +03: sample number replaced by the placeholder 965XXXXXXXX, it belongs to a real person, int-testnumber.
 *
 * @example
 * ```javascript
 * // JavaScript / CommonJS
 * const { KwtSMS } = require('kwtsms');
 * const sms = KwtSMS.fromEnv();
 * ```
 */

// Main client
export { KwtSMS } from './client.js';

// Utility functions (useful for callers who want to validate/clean before calling send)
export {
  normalizePhone,
  validatePhoneInput,
  validatePhoneFormat,
  findCountryCode,
  maskPhone,
  PHONE_RULES,
  COUNTRY_NAMES,
} from './phone.js';
export type { PhoneRule } from './phone.js';
export { cleanMessage } from './message.js';
export { API_ERRORS, enrichError } from './errors.js';
// 2026-11-05 14:16 +03: library version and User-Agent builder (#939).
export { VERSION, buildUserAgent } from './request.js';

// TypeScript types
export type {
  KwtSMSOptions,
  SendResult,
  BulkSendResult,
  ValidateResult,
  InvalidEntry,
} from './client.js';
export type { ApiResponse } from './errors.js';
