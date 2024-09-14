const Joi = require("joi");
const helper = require("../../../helpers/helper");

module.exports = {
    async createPaymentIntentValidation(req){
        const schema = Joi.object({
            amount: Joi.number().required(),
            // applicationFee: Joi.number().required(),
            // stripeAccount: Joi.string().required(),
		}).unknown(false);
		const { error } = schema.validate(req);
		if (error) {
			return helper.validationMessageKey("validation", error);
		}
		return null;
    },

    async createMerchantValidation(req){
        const schema = Joi.object({
            email: Joi.string().required(),
            city: Joi.string().required(),
            line1: Joi.string().required(),
            postalCode: Joi.number().required(),
            state: Joi.string().required(),
            birthDay: Joi.number().required(),
            birthMonth: Joi.number().required(),
            birthYear: Joi.number().required(),
            firstName: Joi.string().required(),
            lastName: Joi.string().required(),
            panNumber: Joi.string().required(),
            bankAccountHolderName: Joi.string().required(),
            bankAccountIfscCode: Joi.string().required(),
            bankAccountNumber: Joi.string().required(),
            tosTimestamp: Joi.number().required(),
            tosIp: Joi.string().required(),
            // registrationStep: Joi.number().required().valid(2,4)
		}).unknown(false);
		const { error } = schema.validate(req);
		if (error) {
			return helper.validationMessageKey("validation", error);
		}
		return null;
    },

    async retriveMerchantValidation(req){
        const schema = Joi.object({
            userId: Joi.string().optional(),
		}).unknown(false);
		const { error } = schema.validate(req);
		if (error) {
			return helper.validationMessageKey("validation", error);
		}
		return null;
    },
}