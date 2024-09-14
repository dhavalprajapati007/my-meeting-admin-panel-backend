// eslint-disable-next-line import/no-extraneous-dependencies
const Joi = require("joi");
const helper = require("../../../helpers/helper");

module.exports = {
    async createVideoRoomValidation(req) {
		const schema = Joi.object({
			uniqueName: Joi.number().required(),
			password: Joi.number().required(),
            host_key: Joi.string().optional()
		}).unknown(false);
		const { error } = schema.validate(req);
		if (error) {
			return helper.validationMessageKey("validation", error);
		}
		return null;
	},
    async createVideoRoomTokenValidation(req) {
        const schema = Joi.object({
            uniqueName: Joi.number().required(),
            identity: Joi.string().required()
        }).unknown(false);
        const { error } = schema.validate(req);
        if(error) {
            return helper.validationMessageKey("validation", error);
        }
        return null;
    },
    async completeVideoRoomValidation(req) {
        const schema = Joi.object({
            uniqueName: Joi.number().required(),
            roomSid: Joi.string().required(),
            isComposition: Joi.boolean().required()
        }).unknown(false);
        const { error } = schema.validate(req);
        if(error){
            return helper.validationMessageKey("validation", error);
        }
        return null;
    }
};

