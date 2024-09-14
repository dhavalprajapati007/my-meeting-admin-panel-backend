// eslint-disable-next-line import/no-extraneous-dependencies
const Joi = require("joi");
const helper = require("../../../helpers/helper");

module.exports = {
    async addVendorTimeslotValidation(req) {
		const schema = Joi.object({
			userId: Joi.string().optional(),
			sessionTime: Joi.number().required(),
            interval: Joi.number().required(),
            availableSlots: Joi.array().min(7).max(7).optional().items(Joi.array().required())
		}).unknown(false);
		const { error } = schema.validate(req);
		if (error) {
			return helper.validationMessageKey("validation", error);
		}
		return null;
	},
    async getVendorTimeslotValidation(req) {
        const schema = Joi.object({
            userId: Joi.string().optional()
        }).unknown(false);
        const { error } = schema.validate(req);
        if(error) {
            return helper.validationMessageKey("validation", error);
        }
        return null;
    },
    async updateVendorTimeslotValidation(req) {
        const schema = Joi.object({
            id: Joi.string().required(),
            userId: Joi.string().optional(),
			sessionTime: Joi.number().optional(),
            interval: Joi.number().optional(),
            availableSlots: Joi.array().min(7).max(7).optional().items(Joi.array().required())
        }).unknown(false);
        const { error } = schema.validate(req);
        if(error) {
            return helper.validationMessageKey("validation", error);
        }
        return null;
    },
    async deleteVendorTimeslotValidation(req){
        const schema = Joi.object({
            id: Joi.string().required()
        }).unknown(false);
        const { error } = schema.validate(req);
        if(error) {
            return helper.validationMessageKey("validation", error);
        }
        return null;
    },
    async createAvailableSlotValidation(req){
        const schema = Joi.object({
            sessionTime: Joi.number().required(),
            interval: Joi.number().required()
        }).unknown(false);
        const { error } = schema.validate(req);
        if(error){
            return helper.validationMessageKey("validation", error);
        }
        return null;
    }
};

