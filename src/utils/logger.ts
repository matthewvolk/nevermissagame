type LogLevel = "info" | "warn" | "error" | "debug";

function timestamp(): string {
  return new Date().toISOString();
}

function log(level: LogLevel, tag: string, message: string, data?: unknown) {
  const prefix = `[${timestamp()}] [${level.toUpperCase()}] [${tag}]`;
  if (data !== undefined) {
    console[level === "debug" ? "log" : level](`${prefix} ${message}`, data);
  } else {
    console[level === "debug" ? "log" : level](`${prefix} ${message}`);
  }
}

export function createLogger(tag: string) {
  return {
    info: (message: string, data?: unknown) => log("info", tag, message, data),
    warn: (message: string, data?: unknown) => log("warn", tag, message, data),
    error: (message: string, data?: unknown) =>
      log("error", tag, message, data),
    debug: (message: string, data?: unknown) =>
      log("debug", tag, message, data),
  };
}
