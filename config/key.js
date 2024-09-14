require("dotenv").config();
console.log(process.env.NODE_ENV);
if (process.env.NODE_ENV === "production") {
	module.exports = require("./prod");
} else if (process.env.NODE_ENV == "local") {
	module.exports = require("./local");
} else {
	module.exports = require("./dev");
}
