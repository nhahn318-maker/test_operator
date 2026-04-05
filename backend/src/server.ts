import { createLogger } from "./common/logger";
import { getAppConfig } from "./config";
import { createApp } from "./app";

const config = getAppConfig();
const logger = createLogger(config.logLevel, {
  service: config.serviceName,
  environment: config.appEnv,
  version: config.releaseVersion,
});
const app = createApp({ config, logger });

app.listen(config.port, () => {
  logger.info("server.started", {
    port: config.port,
    url: `http://localhost:${config.port}`,
  });
});
