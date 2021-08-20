module.exports = (sequelize, DataTypes) => sequelize.define('Weather', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  locationId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  endTime: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  Wx: {
    type: DataTypes.STRING(30),
    allowNull: false,
  },
  PoP: {
    type: DataTypes.STRING(4),
    allowNull: false,
  },
  CI: {
    type: DataTypes.STRING(30),
    allowNull: false,
  },
  MinT: {
    type: DataTypes.STRING(4),
    allowNull: false,
  },
  MaxT: {
    type: DataTypes.STRING(4),
    allowNull: false,
  },
}, {
  timestamps: false,
  tableName: 'Weather',
  charset: 'utf8',
  collate: 'utf8_unicode_ci',
  indexes: [
    {
      fields: ['locationId'],
    },
    {
      unique: true,
      fields: ['locationId', 'startTime'],
    },
  ],
});
