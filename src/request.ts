/**
 * HTTP POST to kwtSMS REST/JSON API endpoints.
 *
 * Uses Node.js built-in node:https. Zero external dependencies.
 * Always sets Content-Type and Accept: application/json.
 * Reads 4xx response bodies (kwtSMS returns JSON error details in 403 bodies).
 * Returns parsed JSON dict. Throws Error on network/parse failure.
 */

import https from 'node:https';
import { writeLog, maskCredentials, type LogEntry } from './logger.js';
import type { ApiResponse } from './errors.js';
// 2026-11-05 14:16 +03: the version comes from package.json (tsup inlines only this string), #939.
import { version } from '../package.json';

const BASE_HOSTNAME = 'www.kwtsms.com';
const BASE_PATH = '/API/';
const TIMEOUT_MS = 15_000;

/**
 * Library version, read from package.json at build time and sent in the User-Agent.
 * 2026-11-05 14:16 +03: added so kwtSMS can count accounts per integration, #939.
 */
export const VERSION: string = version;

/**
 * Build the User-Agent "[app token ]kwtsms-js/<VERSION>". The app token is caller input: anything outside
 * printable ASCII is removed (CR/LF would split the header, Node rejects non-Latin-1 header values),
 * spaces become '-', leading/trailing '-' are trimmed, and it is cut to 64 characters.
 * 2026-11-05 14:16 +03: added for per-integration counts, #939.
 */
export function buildUserAgent(appName = ''): string {
  const app = appName
    .replace(/[^\x20-\x7e]+/g, '')
    .trim()
    .replace(/\s+/g, '-');
  // 2026-11-08 13:35 +03: trim '-' by scanning (the /^-+|-+$/ regex is quadratic on long '-' runs; CodeQL), then cut to 64
  let start = 0;
  let end = app.length;
  while (start < end && app[start] === '-') start++;
  while (end > start && app[end - 1] === '-') end--;
  const trimmed = app.slice(start, end).slice(0, 64);
  const lib = `kwtsms-js/${VERSION}`;
  return trimmed === '' ? lib : `${trimmed} ${lib}`;
}

/**
 * POST JSON to a kwtSMS endpoint. Returns parsed response object.
 *
 * Returns: the parsed JSON (which may be an OK or ERROR response)
 * Throws: Error on network failure, timeout, or unparseable JSON response
 * 2026-11-05 14:16 +03: userAgent parameter added, sent on every call (#939).
 */
export async function apiRequest(
  endpoint: string,
  payload: Record<string, unknown>,
  logFile = '',
  userAgent = buildUserAgent(),
): Promise<ApiResponse> {
  const body = JSON.stringify(payload);
  const path = `${BASE_PATH}${endpoint}/`;

  const logEntry: LogEntry = {
    ts: new Date().toISOString(),
    endpoint,
    request: maskCredentials(payload),
    response: null,
    ok: false,
    error: null,
  };

  return new Promise<ApiResponse>((resolve, reject) => {
    const options = {
      hostname: BASE_HOSTNAME,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'User-Agent': userAgent, // 2026-11-05 14:16 +03: kwtsms-js/<version>, app token first (#939)
      },
    };

    const req = https.request(options, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => chunks.push(chunk));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf8');
        let data: ApiResponse;
        try {
          data = JSON.parse(raw) as ApiResponse;
        } catch {
          const err = new Error(`Invalid JSON response from kwtSMS API: ${raw.slice(0, 200)}`);
          logEntry.error = err.message;
          writeLog(logFile, logEntry);
          reject(err);
          return;
        }
        logEntry.response = data;
        logEntry.ok = data.result === 'OK';
        writeLog(logFile, logEntry);
        resolve(data);
      });
      res.on('error', (e: Error) => {
        logEntry.error = e.message;
        writeLog(logFile, logEntry);
        reject(new Error(`Response stream error: ${e.message}`));
      });
    });

    req.setTimeout(TIMEOUT_MS, () => {
      req.destroy();
      const err = new Error(`Request timed out after ${TIMEOUT_MS}ms`);
      logEntry.error = err.message;
      writeLog(logFile, logEntry);
      reject(err);
    });

    req.on('error', (e: Error) => {
      // Only reject if not already handled by timeout
      if (!req.destroyed || !logEntry.error) {
        logEntry.error = e.message;
        writeLog(logFile, logEntry);
        reject(new Error(`Network error: ${e.message}`));
      }
    });

    req.write(body);
    req.end();
  });
}
