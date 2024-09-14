// eslint-disable-next-line import/no-extraneous-dependencies
const Joi = require("joi");
const helper = require("../../../helpers/helper");

module.exports = {
    async addServiceValidation(req) {
		const schema = Joi.object({
			name: Joi.string().required(),
			description: Joi.string().required(),
		}).unknown(true);
		const { error } = schema.validate(req);
		if (error) {
			return helper.validationMessageKey("validation", error);
		}
		return null;
	},
    async getServiceValidation(req) {
        const schema = Joi.object({
            id: Joi.string().required()
        }).unknown(true);
        const { error } = schema.validate(req);
        if(error) {
            return helper.validationMessageKey("validation", error);
        }
        return null;
    },
    async updateServiceValidation(req) {
        const schema = Joi.object({
            id: Joi.string().required()
        }).unknown(true);
        const { error } = schema.validate(req);
        if(error) {
            return helper.validationMessageKey("validation", error);
        }
        return null;
    },
    async deleteServiceValidation(req){
        const schema = Joi.object({
            id: Joi.string().required()
        }).unknown(true);
        const { error } = schema.validate(req);
        if(error) {
            return helper.validationMessageKey("validation", error);
        }
        return null;
    }
};

