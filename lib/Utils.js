const toml = require('toml');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

class Utils {
  constructor(config) {
    this.config = config;
  }

  static readFile({ filePath }) {
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, (err, data) => {
        if (err) {
          return reject(err);
        }
        return resolve(data);
      });
    });
  }

  static async readConfig() {
    let configFile = {};
    const privateConfigPath = path.resolve(__dirname, '../config.toml');
    const defaultConfigPath = path.resolve(__dirname, '../default.config.toml');
    try {
      configFile = await this.readFile({ filePath: privateConfigPath });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('e:', e);
      configFile = await this.readFile({ filePath: defaultConfigPath });
    }

    return toml.parse(configFile);
  }

  static randomStr(length) {
    let key = '';
    const charset = '0123456789abcdefghijklmnopqrstuvwxyz';
    for (let i = 0; i < length; i += 1) {
      key += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return key;
  }

  static savePassword(password) {
    const salt = this.randomStr(24);
    const hash = crypto.createHash('sha1').update(password).update(salt).digest('hex');
    return { salt, hash };
  }

  static verifyPassword(password, salt, hash) {
    const passwordHash = crypto.createHash('sha1').update(password).update(salt).digest('hex');
    return passwordHash === hash;
  }

  static validateEmail(email) {
    const re = /\S+@\S+\.\S+/;
    return re.test(email);
  }

  static formatWeather(weathers) {
    return weathers.map((item) => {
      const weather = { ...item };
      weather.locationName = weather.Location.locationName;
      delete weather.Location;
      delete weather.timeInterval;

      return weather;
    });
  }

  static generateToken({
    userID, secret, expiresIn, data = {},
  } = {}) {
    return jwt.sign({ userID, ...data }, secret, { expiresIn });
  }

  static verifyToken({
    token, secret, ignoreExpiration = false,
  } = {}) {
    if (!token) throw new Error('user not login');
    const option = { ignoreExpiration };
    return jwt.verify(token, secret, option);
  }
}

module.exports = Utils;
