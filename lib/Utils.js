const toml = require('toml');
const fs = require('fs');
const path = require('path');

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
}

module.exports = Utils;
