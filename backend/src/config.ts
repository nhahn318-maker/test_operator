type NodeEnv = "development" | "test" | "production";

export type AppConfig = {
  appEnv: NodeEnv;
  port: number;
  logLevel: "debug" | "info" | "warn" | "error";
  serviceName: string;
  releaseVersion: string;
};

const VALID_LOG_LEVELS = new Set<AppConfig["logLevel"]>(["debug", "info", "warn", "error"]);

const parseNodeEnv = (value: string | undefined): NodeEnv => {
  if (value === "production" || value === "test") {
    return value;
  }

  return "development";
};

const parsePort = (value: string | undefined) => {
  const parsed = Number(value ?? 3000);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 3000;
};

const parseLogLevel = (value: string | undefined): AppConfig["logLevel"] => {
  if (value && VALID_LOG_LEVELS.has(value as AppConfig["logLevel"])) {
    return value as AppConfig["logLevel"];
  }

  return "info";
};

export const getAppConfig = (): AppConfig => ({
  appEnv: parseNodeEnv(process.env.NODE_ENV),
  port: parsePort(process.env.PORT),
  logLevel: parseLogLevel(process.env.LOG_LEVEL),
  serviceName: process.env.SERVICE_NAME?.trim() || "todo-api",
  releaseVersion: process.env.RELEASE_VERSION?.trim() || "dev",
});
