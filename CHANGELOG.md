# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.6.0] - 2026-11-06

### Added
- Client identifies itself with name and version; optional `appName` option.

### Changed
- Package author and license holder are now kwtSMS.

## [0.5.2] - 2026-03-13

### Fixed

- Bug fixes.

## [0.5.1] - 2026-03-13

### Fixed

- Bug fixes.

## [0.5.0] - 2026-03-13

### Removed

- Built-in CLI. The dedicated [kwtsms-cli](https://github.com/kwtsms/kwtsms-cli) package replaces it.

## [0.4.0] - 2026-03-13

### Added

- Country-specific phone validation.
- `maskPhone()` helper.
- `PhoneRule` TypeScript type.

### Changed

- `validatePhoneInput()` gives country-level messages and handles a redundant leading zero.

## [0.3.0] - 2026-03-07

### Added

- `status(msgId)` method.
- `kwtsms status` CLI command.
- Raw API example.
- New README sections.

### Changed

- README expanded to match other kwtSMS client libraries.

### Fixed

- Bug fixes.

## [0.2.2] - 2026-03-05

### Added

- CI, CodeQL and Dependabot workflows.
- `SECURITY.md`.

### Changed

- Minimum Node.js version raised from 16 to 18.
- npm keywords expanded.

## [0.2.1] - 2026-03-05

### Added

- Production OTP example with database and CAPTCHA adapters and framework wiring.

### Fixed

- Bug fixes.

## [0.2.0] - 2026-03-05

### Added

- Duplicate numbers are sent once.
- Error fields on bulk send results.
- New unit tests.

### Fixed

- Bug fixes.

## [0.1.2] - 2026-03-04

### Added

- Automatic npm publish on tag.

### Fixed

- Bug fixes.

## [0.1.1] - 2026-03-04

### Fixed

- Bug fixes.

## [0.1.0] - 2026-03-04

Initial release of the `kwtsms` JavaScript/TypeScript client library.

### Added

- `KwtSMS` client with `fromEnv()`, `verify()`, `balance()`, `send()`, `validate()`, `senderids()` and `coverage()`
- Bulk send with automatic batching and retry
- Phone normalization and message cleaning
- Error code map with fix hints
- JSONL logging
- `.env` loader
- CLI (`kwtsms`)
- Dual ESM + CJS output with TypeScript declarations
- Zero runtime dependencies

[Unreleased]: https://github.com/kwtsms/kwtsms-js/compare/v0.5.1...HEAD
[0.5.1]: https://github.com/kwtsms/kwtsms-js/compare/v0.5.0...v0.5.1
[0.5.0]: https://github.com/kwtsms/kwtsms-js/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/kwtsms/kwtsms-js/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/kwtsms/kwtsms-js/compare/v0.2.2...v0.3.0
[0.2.2]: https://github.com/kwtsms/kwtsms-js/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/kwtsms/kwtsms-js/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/kwtsms/kwtsms-js/compare/v0.1.2...v0.2.0
[0.1.2]: https://github.com/kwtsms/kwtsms-js/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/kwtsms/kwtsms-js/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/kwtsms/kwtsms-js/releases/tag/v0.1.0
