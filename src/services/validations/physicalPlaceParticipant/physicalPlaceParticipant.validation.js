// eslint-disable-next-line import/no-extraneous-dependencies
const Joi = require("joi");
const helper = require("../../../helpers/helper");

module.exports = {
    async addPhysicalPlaceParticipant(req) {
		const schema = Joi.object({
			serviceBookingId: Joi.string().required(),
			isRegistered: Joi.boolean().required(),
            userId: Joi.string().optional(),
            addressCordinater: Joi.object({
                coordinates : Joi.array().items(Joi.number())
            }).optional(),
            userName: Joi.string().optional(),
            contactNumber: Joi.number().optional()
		}).unknown(true);
		const { error } = schema.validate(req);
		if (error) {
			return helper.validationMessageKey("validation", error);
		}
		return null;
	},
    async updatePhysicalPlaceParticipant(req) {
        const schema = Joi.object({
            isRegistered: Joi.boolean().optional(),
            id: Joi.string().required(),
            userId: Joi.string().optional(),
            addressCordinater: Joi.object({
                coordinates : Joi.array().items(Joi.number())
            }).optional(),
            userName: Joi.string().optional(),
            contactNumber: Joi.number().optional()
		}).unknown(true);
        const { error } = schema.validate(req);
		if (error) {
			return helper.validationMessageKey("validation", error);
		}
		return null;
    },
    async addArrayPhysicalPlaceParticipant(req){
        const schema = Joi.object({
            participants: Joi.array().min(1).items({
                serviceBookingId: Joi.string().required(),
                isRegistered: Joi.boolean().required(),
                userId: Joi.string().optional(),
                addressCordinater: Joi.object({
                    coordinates : Joi.array().items(Joi.number())
                }).optional(),
                userName: Joi.string().optional(),
                contactNumber: Joi.number().optional()
            }).required()
        }).unknown(true);
        const { error } = schema.validate(req);
        if(error){
            return helper.validationMessageKey("validation", error);
        }
        return null;
    },
    async deletePhysicalPlaceParticipant(req){
        const schema = Joi.object({
            id: Joi.string().required()
        }).unknown(true);
        const { error } = schema.validate(req);
        if(error){
            return helper.validationMessageKey("validation", error);
        }
        return null;
    }
};

