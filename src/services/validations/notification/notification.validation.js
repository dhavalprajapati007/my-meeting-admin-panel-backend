const Joi = require("joi");
const helper = require("../../../helpers/helper");

module.exports = {
    async deleteNotificationValidation(req){
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