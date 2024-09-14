// eslint-disable-next-line import/no-extraneous-dependencies
const Joi = require("joi");
const helper = require("../../../helpers/helper");

module.exports = {
    async addVendorServiceValidation(req) {
		const schema = Joi.object({
			serviceId: Joi.string().required(),
			bio: Joi.string().required(),
            instruction: Joi.string().optional(),
            prefrence: Joi.number().required().valid(1,2,3),
            languages: Joi.array().min(1).items(Joi.string().required()).required(),
            virtualSilver: Joi.number().optional(),
            virtualGold: Joi.number().optional(),
            physicalSilver: Joi.number().optional(),
		}).unknown(true);
		const { error } = schema.validate(req);
		if (error) {
			return helper.validationMessageKey("validation", error);
		}
		return null;
	},
    async existingVendorServiceValidation(req) {
		const schema = Joi.object({
            prefrence: Joi.number().required().valid(1,2,3),
            virtualSilver: Joi.number().optional(),
            virtualGold: Joi.number().optional(),
            physicalSilver: Joi.number().optional(),
		}).unknown(true);
		const { error } = schema.validate(req);
		if (error) {
			return helper.validationMessageKey("validation", error);
		}
		return null;
	},
    async getVendorServiceValidation(req) {
        const schema = Joi.object({
            serviceId: Joi.string().required(),
            prefrence: Joi.number().required(),
            userId: Joi.string().optional()
        }).unknown(true);
        const { error } = schema.validate(req);
        if(error) {
            return helper.validationMessageKey("validation", error);
        }
        return null;
    },
    async updateVendorServiceValidation(req) {
        const schema = Joi.object({
            id: Joi.string().required(),
            userId: Joi.string().optional(),
			serviceId: Joi.string().optional(),
            bio: Joi.string().optional(),
            instruction: Joi.string().optional(),
            prefrence: Joi.number().valid(1,2,3).optional(),
            languages: Joi.array().min(1).items(Joi.string().required()).optional(),
            virtualSilver: Joi.number().optional(),
            virtualGold: Joi.number().optional(),
            physicalSilver: Joi.number().optional(),
            available: Joi.boolean().optional()
        }).unknown(false);
        const { error } = schema.validate(req);
        if(error) {
            return helper.validationMessageKey("validation", error);
        }
        return null;
    },
    async removeCertificateValidation(req) {
        const schema = Joi.object({
            userId: Joi.string().required(),
            certificate_link: Joi.string().required()
        }).unknown(true);
        const { error } = schema.validate(req);
        if(error) {
            return helper.validationMessageKey("validation", error);
        }
        return null;
    },
    async deleteVendorServiceValidation(req){
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

