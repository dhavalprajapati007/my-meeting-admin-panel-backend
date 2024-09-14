const Joi = require("joi");
const helper = require("../../../helpers/helper");

module.exports = {
    async addContactusValidation(req){
        const schema = Joi.object({
            userId: Joi.string().optional(),
            subject: Joi.string().required(),
            message: Joi.string().required()
		}).unknown(true);
		const { error } = schema.validate(req);
		if (error) {
			return helper.validationMessageKey("validation", error);
		}
		return null;
    },
    async getContactusValidation(req){
        const schema = Joi.object({
            userId: Joi.string().optional(),
            limit: Joi.number().required(),
            page: Joi.number().required()
        }).unknown(true);
        const { error } = schema.validate(req);
        if(error){
            return helper.validationMessageKey("validation", error);
        }
        return null;
    },
    async updateContactusValidation(req){
        const schema = Joi.object({
            id: Joi.string().required(),
            subject: Joi.string().required(),
            message: Joi.string().required()
        }).unknown(true);
        const { error } = schema.validate(req);
        if(error){
            return helper.validationMessageKey("validation", error);
        }
        return null;
    },
    async deleteContactusValidation(req){
        const schema = Joi.object({
            id: Joi.string().required()
        }).unknown(true);
        const { error } = schema.validate(req);
        if(error){
            return helper.validationMessageKey("validation", error);
        }
        return null;
    }
}