const Joi = require("joi");
const helper = require("../../../helpers/helper");

module.exports = {
    async addOfficeCabinValidation(req){
        const schema = Joi.object({
            officeId: Joi.string().required(),
			price: Joi.number().precision(2).required(),
            capacity: Joi.number().integer().required(),
            prefrences: Joi.number().valid(1,2,3).required(),
            isAvailable: Joi.boolean().required(),
            amenitieIds: Joi.array().items(Joi.string()).required(),
		}).unknown(true);
		const { error } = schema.validate(req);
		if (error) {
            console.log('Validation ERROR: ', error);
			return helper.validationMessageKey("validation", error);
		}
		return null;
    },
    async updateOfficeCabinValidation(req){
        const schema = Joi.object({
            id: Joi.string().required(),
            officeId: Joi.string().optional(),
            amenitieIds: Joi.array().items(Joi.string()).optional(),
            price: Joi.number().precision(2).optional(),
            capacity: Joi.number().integer().optional(),
            prefrences: Joi.number().integer().valid(1,2,3).optional(),
            isAvailable: Joi.boolean().optional(),
            status: Joi.number().integer().valid(1,2,3).optional()
        }).unknown(false);
        const { error } = schema.validate(req);
        if(error){
            console.log('validation Error: ', error);
            return helper.validationMessageKey("validation", error);
        }
        return null;
    },
    async deleteOfficeCabinValidation(req){
        const schema = Joi.object({
            id: Joi.string().required()
        }).unknown(true);
        const { error } = schema.validate(req);
        if(error){
            console.log('validation Error: ', error);
            return helper.validationMessageKey("validation", error);
        }
        return null;
    },
    async deleteCabinImageValidation(req){
        const schema = Joi.object({
            id: Joi.string().required(),
            image_link: Joi.string().required()
        }).unknown(true);
        const { error } = schema.validate(req);
        if(error){
            console.log('validation Error: ', error);
            return helper.validationMessageKey("validation", error);
        }
        return null;
    }
}