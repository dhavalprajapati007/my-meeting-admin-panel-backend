var Sequelize = require('sequelize');
const { DATABASE_NAME, USER, PASSWORD, HOST } = require("../../config/key");

module.exports = new Sequelize(DATABASE_NAME, USER, PASSWORD, {
	host : HOST,
	dialect: "mysql",
	pool: {
		max: 5,
		min: 0,
		acquire : 30000,
		idle: 10000,
	}
});
