const Utils = require('./lib/Utils');
const WeatherAPI = require('./lib/WeatherAPI');
const DB = require('./db/model');
const LoggerAdapter = require('./lib/LoggerAdapter');
const WebServer = require('./lib/WebServer');

const main = async () => {
  const config = await Utils.readConfig();

  const weatherAPI = new WeatherAPI();
  weatherAPI.setAuthorization(config.base.weatherToken);

  const { logLevel } = config.base;
  const logger = new LoggerAdapter();
  logger.setLogLevel(logLevel);

  const dbInstance = new DB({ dbConfig: config.database, logger });
  const db = await dbInstance.initialORM();

  const web = new WebServer({
    config, logger, db, weatherAPI,
  });

  await web.start();
};

main();
