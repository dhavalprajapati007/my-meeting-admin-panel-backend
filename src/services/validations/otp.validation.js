// eslint-disable-next-line import/no-extraneous-dependencies
const Joi = require("joi");
const helper = require("../../helpers/helper");

module.exports = {
	async sendOtpValidation(req) {
		const schema = Joi.object({
			mobile: Joi.string().required(),
		}).unknown(true);
		const { error } = schema.validate(req);
		if (error) {
            console.log("error"+error)
			return helper.validationMessageKey("validation", error);
		}
		return null;
	},

	async verifyOtpValidation(req) {
		const schema = Joi.object({
			otp : Joi.string().required(),
			mobile: Joi.string().required(),
			deviceId: Joi.string().optional()
		}).unknown(true);
		const { error } = schema.validate(req);
		if (error) {
            console.log("error"+error)
			return helper.validationMessageKey("validation", error);
		}
		return null;
	}
};
