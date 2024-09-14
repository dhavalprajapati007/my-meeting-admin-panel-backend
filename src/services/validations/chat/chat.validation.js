const Joi = require("joi");
const helper = require("../../../helpers/helper");

module.exports = {
    async chatHistoryValidation(req){
        const schema = Joi.object({
			chatId : Joi.string().min(24).max(24).required()
		}).unknown(true);
		const { error } = schema.validate(req);
		if (error) {
			return helper.validationMessageKey("validation", error);
		}
		return null;
    },
    async startChatValidation(req){
        const schema = Joi.object({
            vendorId : Joi.string().min(24).max(24).required(),
        }).unknown(true);
        const { error } = schema.validate(req);
        if(error){
            return helper.validationMessageKey("validation", error);
        }
        return null;
    },
    async sendChatValidation(req){
        const schema = Joi.object({
            chatId : Joi.string().min(24).max(24).required(),
            message : Joi.string().required(),
            time : Joi.date().required(),
            isRead: Joi.boolean().default(false).required(),
        }).unknown(true);
        const { error } = schema.validate(req);
        if(error){
            return helper.validationMessageKey("validation", error);
        }
        return null;
    }
}