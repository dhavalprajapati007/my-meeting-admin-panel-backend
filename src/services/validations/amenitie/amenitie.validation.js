const Joi = require("joi");
const helper = require("../../../helpers/helper");

module.exports = {
    async addAmenitiesValidation(req){
        const schema = Joi.object({
			name: Joi.string().required()
		}).unknown(true);
		const { error } = schema.validate(req);
		if (error) {
			return helper.validationMessageKey("validation", error);
		}
		return null;
    },
    async getAmenitiesValidation(req){
        const schema = Joi.object({
            id: Joi.string().required()
        }).unknown(true);
        const { error } = schema.validate(req);
        if(error){
            return helper.validationMessageKey("validation", error);
        }
        return null;
    },
    async updateAmenitiesValidation(req){
        const schema = Joi.object({
            id: Joi.string().required(),
            name: Joi.string().optional()
        }).unknown(true);
        const { error } = schema.validate(req);
        if(error){
            return helper.validationMessageKey("validation", error);
        }
        return null;
    },
    async deleteAmenitiesValidation(req){
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