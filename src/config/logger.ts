type LogLevel = "info" | "warn" | "error" | "debug";

function log(level: LogLevel, message: string, meta?: unknown) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  const consoleMethod = level === "debug" ? "log" : level;
  if (meta !== undefined) {
    console[consoleMethod](line, meta);
  } else {
    console[consoleMethod](line);
  }
}

export const logger = {
  info: (message: string, meta?: unknown) => log("info", message, meta),
  warn: (message: string, meta?: unknown) => log("warn", message, meta),
  error: (message: string, meta?: unknown) => log("error", message, meta),
  debug: (message: string, meta?: unknown) => log("debug", message, meta),
};
