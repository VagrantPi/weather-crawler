const fs = require('fs');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');

const basename = path.basename(__filename);
const db = {};

class DBAdapter {
  constructor({ dbConfig = {}, logger = console } = {}) {
    if (!DBAdapter.instance) {
      this.dbConfig = dbConfig;
      this.logger = logger;
      DBAdapter.instance = this;
    }
    return DBAdapter.instance;
  }

  async initialORM() {
    try {
      if (typeof this.dbInstance === 'object') {
        return this.dbInstance;
      }

      this.dbConfig.dialect = this.dbConfig.protocol;
      this.dbConfig.username = this.dbConfig.user;
      this.dbConfig.database = this.dbConfig.dbName;

      // init env.js for migration
      fs.writeFileSync('env.js', `
  const env = {
    development: ${JSON.stringify(this.dbConfig)},
  };
  
  module.exports = env;
  `);

      // eslint-disable-next-line max-len
      const sequelize = new Sequelize(this.dbConfig.dbName, this.dbConfig.user, this.dbConfig.password, this.dbConfig);
      try {
        await sequelize.query(`CREATE DATABASE ${this.dbConfig.dbName};`);
      } catch (e) {
        /* empty */
      }

      // init Model *.js
      fs.readdirSync(__dirname)
        .filter((file) => (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js'))
        .forEach((file) => {
          const modelPath = path.resolve(__dirname, file);
          // eslint-disable-next-line global-require, import/no-dynamic-require
          const myModel = require(modelPath)(sequelize, DataTypes);
          db[file.replace(/\.js/g, '')] = myModel;
        });

      // add Associations
      db.Weather.belongsTo(db.Location, { foreignKey: 'locationId' });

      db.sequelize = sequelize;
      db.Sequelize = Sequelize;

      return sequelize.sync({ logging: false })
        .then(() => {
          // eslint-disable-next-line no-console
          this.logger.log('\x1b[1m\x1b[32mDB   \x1b[0m\x1b[21m connect success');
          return db;
        })
        .catch((e) => {
          this.logger.error('\x1b[1m\x1b[31mDB   \x1b[0m\x1b[21m \x1b[1m\x1b[31mconnect fails\x1b[0m\x1b[21m');
          throw e;
        });
    } catch (e) {
      // eslint-disable-next-line no-console
      this.logger.error('\x1b[1m\x1b[31mDB   \x1b[0m\x1b[21m \x1b[1m\x1b[31mconnect fails\x1b[0m\x1b[21m');
      throw e;
    }
  }
}

module.exports = DBAdapter;
