const Koa = require('koa');
const Router = require('koa-router');
const Location = require('../data/Location');

class WebServer {
  constructor({
    config, logger, db, weatherAPI,
  }) {
    this.config = config;
    this.logger = logger;
    this.db = db;
    this.weatherAPI = weatherAPI;
  }

  async start() {
    // init Location
    await this.initLocation();

    // set crawler 12 hr
    setInterval(() => {
      this.crawler();
    }, 720000);
    this.crawler();

    const app = new Koa();
    const router = new Router();

    app
      .use(router.routes())
      .use(router.allowedMethods());

    app.listen(3000);
  }

  async initLocation() {
    const LocationKeys = Object.keys(Location);
    for (let i = 0; i < LocationKeys.length; i += 1) {
      const locationName = LocationKeys[i];
      // eslint-disable-next-line no-await-in-loop
      const findItem = await this.db.Location.findOne({ where: { id: Location[locationName] } });
      if (!findItem) {
        // eslint-disable-next-line no-await-in-loop
        await this.db.Location.create({ id: Location[locationName], locationName });
      }
    }
  }

  crawler() {
    const locationName = Object.keys(Location).join(',');

    const insertData = [];
    this.weatherAPI.get({ locationName })
      .then(async (res) => {
        for (let i = 0; i < res.result.location.length; i += 1) {
          const location = res.result.location[i];

          if (Location[location.locationName]) {
            // save weather data to db
            for (let j = 0; j <= 2; j += 1) {
              const formatData = location.weatherElement.reduce(
                (accumulator, item) => {
                  if (!accumulator.startTime) {
                    accumulator.startTime = item.time[j].startTime;
                    accumulator.endTime = item.time[j].endTime;
                  }
                  accumulator[item.elementName] = item.time[j].parameter.parameterName;
                  return accumulator;
                }, {
                  locationId: Location[location.locationName],
                },
              );
              insertData.push(formatData);
            }
          }
        }

        for (let i = 0; i < insertData.length; i += 1) {
          this.db.Weather.create(insertData[i])
            .catch((e) => {
              if (e.message !== 'Validation error') this.logger.error('crawler error:', e);
            });
        }
      })
      .catch((e) => {
        this.logger.error(e);
      });
  }
}
module.exports = WebServer;
