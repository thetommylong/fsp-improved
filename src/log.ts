// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 thetommylong

type LogFn = (...args: unknown[]) => void;

export interface Logger {
  log: LogFn;
  warn: LogFn;
  error: LogFn;
}

function createLogFn(
  native: (...args: unknown[]) => void,
  prefix: string,
): LogFn {
  return (...args: unknown[]) => native(prefix, ...args);
}

export function createLogger(file: string): Logger {
  const prefix = `[FSP Improved] [${file}]`;
  return {
    log: createLogFn(console.log, prefix),
    warn: createLogFn(console.warn, prefix),
    error: createLogFn(console.error, prefix),
  };
}
