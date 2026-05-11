import axios from 'axios';
import config from './config.js';

const levelPriority = { debug: 0, info: 1, warn: 2, error: 3, fatal: 4 };
const minLevel = levelPriority[config.logLevel] ?? 0;

// optional remote log transport — sends logs to evaluation service if configured
async function shipToRemote(logEntry) {
  if (!config.baseUrl || !config.accessToken) return;

  try {
    await axios.post(`${config.baseUrl}/logs`, logEntry, {
      headers: { Authorization: `Bearer ${config.accessToken}` },
      timeout: 5000,
    });
  } catch {
    // silently fail — don't let log shipping crash the app
  }
}

export function Log(stack, level, packageName, message) {
  const lvl = level.toLowerCase();
  if (levelPriority[lvl] === undefined) return;
  if (levelPriority[lvl] < minLevel) return;

  const timestamp = new Date().toISOString();
  const formatted = `[${timestamp}] [${stack.toUpperCase()}] [${lvl.toUpperCase()}] [${packageName}] ${message}`;

  switch (lvl) {
    case 'error':
    case 'fatal':
      console.error(formatted);
      break;
    case 'warn':
      console.warn(formatted);
      break;
    default:
      console.log(formatted);
  }

  // fire and forget — ship to remote if available
  shipToRemote({ timestamp, stack, level: lvl, package: packageName, message });
}

// express middleware for request/response logging
export function requestLoggerMiddleware(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const ms = Date.now() - start;
    const msg = `${req.method} ${req.originalUrl} → ${res.statusCode} (${ms}ms)`;

    if (res.statusCode >= 500) {
      Log('backend', 'error', 'middleware', msg);
    } else if (res.statusCode >= 400) {
      Log('backend', 'warn', 'middleware', msg);
    } else {
      Log('backend', 'info', 'middleware', msg);
    }
  });

  next();
}
