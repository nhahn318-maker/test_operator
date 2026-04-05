type LogLevel = "debug" | "info" | "warn" | "error";

type LogContext = Record<string, unknown>;

const LOG_PRIORITIES: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

export type AppLogger = {
  debug: (message: string, context?: LogContext) => void;
  info: (message: string, context?: LogContext) => void;
  warn: (message: string, context?: LogContext) => void;
  error: (message: string, context?: LogContext) => void;
};

export const createLogger = (
  level: LogLevel,
  defaults: LogContext = {},
  sink: (entry: string) => void = console.log,
): AppLogger => {
  const shouldLog = (targetLevel: LogLevel) => LOG_PRIORITIES[targetLevel] >= LOG_PRIORITIES[level];
  const write = (targetLevel: LogLevel, message: string, context: LogContext = {}) => {
    if (!shouldLog(targetLevel)) {
      return;
    }

    sink(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: targetLevel,
        message,
        ...defaults,
        ...context,
      }),
    );
  };

  return {
    debug: (message, context) => write("debug", message, context),
    info: (message, context) => write("info", message, context),
    warn: (message, context) => write("warn", message, context),
    error: (message, context) => write("error", message, context),
  };
};
