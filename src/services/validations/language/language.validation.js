const Joi = require("joi");
const helper = require("../../../helpers/helper");

module.exports = {
    async addLanguagesValidation(req){
        const schema = Joi.object({
			name: Joi.string().required()
		}).unknown(true);
		const { error } = schema.validate(req);
		if (error) {
			return helper.validationMessageKey("validation", error);
		}
		return null;
    },
    async updateLanguagesValidation(req){
        const schema = Joi.object({
            id: Joi.string().required(),
            name: Joi.string().optional(),
            status: Joi.number().optional()
        }).unknown(true);
        const { error } = schema.validate(req);
        if(error){
            return helper.validationMessageKey("validation", error);
        }
        return null;
    },
    async deleteLanguagesValidation(req){
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