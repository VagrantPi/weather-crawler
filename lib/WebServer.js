const Koa = require('koa');
const bodyParser = require('koa-body');
const helmet = require('koa-helmet');
const Router = require('koa-router');
const Location = require('../data/Location');
const Utils = require('./Utils');

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

    router.post('/user', async (ctx, next) => {
      this.logger.debug('user register api');
      try {
        const { email, password } = ctx.request.body;

        const checkEmail = Utils.validateEmail(email);
        if (!checkEmail) throw new Error('invalid email format.');

        const findUser = await this.db.User.findOne({ where: { email } });
        if (findUser) throw new Error('user is exists.');

        const { salt, hash } = Utils.savePassword(password);
        const createUser = await this.db.User.create({
          email, salt, hash,
        });

        // generate jwt token
        const token = Utils.generateToken({
          userID: createUser.id,
          secret: this.config.jwt.secret,
          expiresIn: this.config.jwt.expiresIn,
        });
        ctx.body = {
          success: true,
          data: { token },
        };
      } catch (e) {
        this.logger.error(`user register api error: ${e.message}`);
        ctx.body = {
          success: false,
          message: e.message,
        };
      }

      next();
    });

    router.post('/login', async (ctx, next) => {
      this.logger.debug('user login api');
      try {
        const { email, password } = ctx.request.body;

        // check user is exist
        const findUser = await this.db.User.findOne({ where: { email } });
        if (!findUser) throw new Error('email or password error.');

        // check password
        const valid = Utils.verifyPassword(password, findUser.salt, findUser.hash);
        if (!valid) throw new Error('email or password error.');

        // generate jwt
        const token = Utils.generateToken({
          userID: findUser.id,
          secret: this.config.jwt.secret,
          expiresIn: this.config.jwt.expiresIn,
        });
        ctx.body = {
          success: true,
          data: { token },
        };
      } catch (e) {
        this.logger.error(`user login api error: ${e.message}`);
        ctx.body = {
          success: false,
          message: e.message,
        };
      }
      next();
    });

    router.get('/weather', async (ctx, next) => {
      this.logger.debug('get weather api');
      try {
        const { query, header } = ctx;

        const { token } = header;
        Utils.verifyToken({
          token,
          secret: this.config.jwt.secret,
        });

        const weathers = await this.getWeather(query);
        const data = Utils.formatWeather(weathers);
        ctx.body = {
          success: true,
          message: 'success',
          data,
        };
      } catch (e) {
        this.logger.error(`get weather api error: ${e.message}`);
        ctx.body = {
          success: false,
          message: e.message,
        };
      }
      next();
    });

    app
      .use(bodyParser({
        multipart: true,
        jsonLimit: '1mb',
        parsedMethods: ['POST', 'PUT', 'PATCH', 'Delete'],
      }))
      .use(helmet())
      .use(router.routes())
      .use(router.allowedMethods());

    app.listen(3000);
    this.logger.log('\x1b[1m\x1b[32mServer   \x1b[0m\x1b[21m  listening at http://localhost:3000');
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

  async getWeather(query = {}) {
    const { locations = '' } = query;

    const { Op } = this.db.Sequelize;
    const where = {};
    if (locations) {
      const locationSplit = locations.split(',');

      where[Op.or] = [];

      locationSplit.forEach((locationName) => {
        where[Op.or].push({ locationName });
      });
    }

    const findWeather = await this.db.Weather.findAll({
      where: {
        startTime: {
          [Op.lte]: new Date(),
        },
        endTime: {
          [Op.gte]: new Date(),
        },
      },
      include: [
        {
          model: this.db.Location,
          attributes: ['locationName'],
          where,
        },
      ],
    });

    if (!findWeather) return [];

    // find last weather data
    const weatherMap = new Map();
    for (let i = 0; i < findWeather.length; i += 1) {
      const weather = findWeather[i];
      const getMinInterval = weatherMap.get(weather.locationId);
      if (!getMinInterval || ((weather.endTime - weather.startTime) < getMinInterval.timeInterval)) {
        weatherMap.set(weather.locationId, {
          ...weather.toJSON(),
          timeInterval: weather.endTime - weather.startTime,
        });
      }
    }

    return Array.from(weatherMap.values());
  }
}
module.exports = WebServer;
