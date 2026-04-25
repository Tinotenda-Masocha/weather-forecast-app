# Weather App

This README documents how to run the app and summarizes the debugging session: the errors we encountered, the fixes applied, why they happened, and lessons to remember.

## Quick Start

Install dependencies:

```bash
npm install
```

Start in development (auto-restart on changes):

```bash
npm run dev
```

Start normally:

```bash
node server.js
```

Open: http://localhost:5503

## Endpoints

- `GET /ping` — health check
- `GET /weather/:cityName` — proxied WeatherAPI forecast (server adds API key)

## Errors, bugs and symptoms

- Client crash: "Cannot set properties of null" in `script.js` when updating DOM.
- Wrong DOM selector: script used a selector that didn't match HTML (`.hourly-forecast` vs `.hourly-weather`).
- Missing asset: 404 for `icons/no-results.svg` (actual file `no-result.svg`).
- CSS problems: malformed `@import`, `box-sizing: 0`, missing semicolon causing layout issues.
- Server port conflict: `EADDRINUSE` when multiple node processes tried to bind port 5503.
- Poor server logging: `this.address()` returned null and errors lacked stack traces.

## Fixes applied (files changed)

- `public/script.js`
  - Fixed selector to `.hourly-weather .weather-list`.
  - Added null-guards before DOM updates to prevent null dereference.
  - Consolidated hourly rendering into `displayHourlyForecast()` and used safe property access.
  - Used `encodeURIComponent(cityName)` for safe client API calls.
  - Restored clean event listeners and `setupWeatherRequest` flow.

- `public/index.html`
  - Corrected icon filename to `no-result.svg`.

- `public/style.css`
  - Replaced malformed Google Fonts import.
  - Set `box-sizing: border-box` and added missing semicolon.

- `server.js`
  - Improved request logging (params, query, client IP), masked outbound API key in logs.
  - Checked upstream API payload and returned appropriate status and JSON on errors.
  - Added `uncaughtException` and `unhandledRejection` handlers and reliable listen/error handlers.

- `package.json`
  - Added `dev` script for `nodemon` (`npm run dev`).

- `README.md`
  - (this file) Added debugging notes and run instructions.

## Why these bugs happened

- DOM errors: script updated elements that didn't exist yet or used the wrong selector -> resulted in `null` dereference.
- Asset/file typo: small filename mismatch produced a 404 and missing icon.
- CSS mistakes: a malformed import and wrong box-sizing broke layout expectations.
- Port conflict: running multiple node processes or not killing the previous instance left the port occupied.
- Logging: `this.address()` was used in a context where the server object wasn't referenced properly; unhandled exceptions/rejections made debugging harder.

## Concrete commands used during debugging

- Start server: `node server.js` or `npm run dev`
- Health check: `curl http://localhost:5503/ping`
- Find process on port 5503 (Windows):

```powershell
netstat -ano | findstr :5503
taskkill /PID <PID> /F
```

- Hard-reload browser to pick up changes: Ctrl+Shift+R (or disable cache in DevTools → Network)

## Lessons 

- Always check DOM elements exist before mutating them.
- Keep HTML selectors and JS in sync; prefer `data-` attributes for stable hooks.
- Use `encodeURIComponent` for user input included in URLs.
- Handle HTTP errors: always check `response.ok` before using `response.json()`.
- Add server-side logging for requests, response codes, and full error stacks.
- Run a single server instance per port; use `nodemon` for development and `pm2`/process manager in production.
- Use safe DOM creation instead of concatenating untrusted strings into `innerHTML`.
- Keep a README with start and troubleshooting steps.
