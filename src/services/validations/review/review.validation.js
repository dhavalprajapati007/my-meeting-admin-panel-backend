// eslint-disable-next-line import/no-extraneous-dependencies
const Joi = require("joi");
const helper = require("../../../helpers/helper");

module.exports = {
    async addReviewValidation(req) {
		const schema = Joi.object({
			userId: Joi.string().optional(),
			serviceBookingId: Joi.string().required(),
            vendorId: Joi.string().required(),
            review: Joi.number().required(),
            comment: Joi.string().required(),
		}).unknown(true);
		const { error } = schema.validate(req);
		if (error) {
			return helper.validationMessageKey("validation", error);
		}
		return null;
	},
    async getReviewValidation(req) {
        const schema = Joi.object({
            userId: Joi.string().optional()
        }).unknown(true);
        const { error } = schema.validate(req);
        if(error) {
            return helper.validationMessageKey("validation", error);
        }
        return null;
    },
    async getReviewByBookingValidation(){
        const schema = Joi.object({
            serviceBookingId: Joi.string().required()
        }).unknown(true);
        const { error } = schema.validate(req);
        if(error) {
            return helper.validationMessageKey("validation", error);
        }
        return null;
    },
    async updateReviewValidation(req) {
        const schema = Joi.object({
            id: Joi.string().required(),
            userId: Joi.string().optional(),
			serviceBookingId: Joi.string().optional(),
            vendorId: Joi.string().optional(),
            review: Joi.number().optional(),
            comment: Joi.string().optional(),
        }).unknown(true);
        const { error } = schema.validate(req);
        if(error) {
            return helper.validationMessageKey("validation", error);
        }
        return null;
    },
    async deleteReviewValidation(req){
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

