module.exports = (sequelize, DataTypes) => sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING(),
    allowNull: false,
  },
  salt: {
    type: DataTypes.STRING(24),
    allowNull: false,
  },
  hash: {
    type: DataTypes.STRING(40),
    allowNull: false,
  },
}, {
  timestamps: false,
  tableName: 'User',
  charset: 'utf8',
  collate: 'utf8_unicode_ci',
});
