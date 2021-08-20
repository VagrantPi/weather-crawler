module.exports = (sequelize, DataTypes) => sequelize.define('Location', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  locationName: {
    type: DataTypes.STRING(3),
    allowNull: false,
  },
}, {
  timestamps: false,
  tableName: 'Location',
  charset: 'utf8',
  collate: 'utf8_unicode_ci',
});
