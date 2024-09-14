const Joi = require("joi");
const helper = require("../../../helpers/helper");

module.exports = {
    async addOfficeValidation(req){
        const schema = Joi.object({
            userId: Joi.string().required(),
			name: Joi.string().required(),
			address: Joi.object({
                line1 : Joi.string().required(),
                line2: Joi.string().optional(),
                city : Joi.string().required(),
                state : Joi.string().required(),
                pincode: Joi.number().unsafe().required()
            }).required(),
            addressCordinater: Joi.object({
                lat : Joi.number().unsafe().required(),
                lang: Joi.number().unsafe().required()
            }).required(),
            representativeDetails: Joi.object({
                name: Joi.string().required(),
                number: Joi.number().required(),
            }).required(),
            officeType: Joi.string().valid('schedule','express','both').required().default('both'),
            isKycCompleted: Joi.boolean().default(false).optional(),
            officeContactNumber: Joi.number().unsafe().required(),
            workingDays: Joi.array().max(7).required()
		}).unknown(false);
		const { error } = schema.validate(req);
		if (error) {
            console.log('Validation ERROR: ', error);
			return helper.validationMessageKey("validation", error);
		}
		return null;
    },
    async getOfficeByIdOfficeValidation(req){
        const schema = Joi.object({
            userId: Joi.string().required()
        }).unknown(true);
        const { error } = schema.validate(req);
        if(error){
            return helper.validationMessageKey("validation", error);
        }
        return null;
    },
    async getOfficesValidation (req){
        const schema = Joi.object({
            limit : Joi.number().required(),
			page : Joi.number().required(),
            verified: Joi.boolean().required()
        }).unknown(false);
        const { error } = schema.validate(req);
        if(error){
            return helper.validationMessageKey("validation", error);
        }
        return null;
    },
    async getOfficeValidation(req){
        const schema = Joi.object({
            id: Joi.string().required()
        }).unknown(true);
        const { error } = schema.validate(req);
        if(error){
            return helper.validationMessageKey("validation", error);
        }
        return null;
    },
    async updateOfficeValidation(req){
        const schema = Joi.object({
            id: Joi.string().required(),
            userId: Joi.string().optional(),
			name: Joi.string().optional(),
			address: Joi.object({
                line1 : Joi.string().optional(),
                line2: Joi.string().optional(),
                city : Joi.string().optional(),
                state : Joi.string().optional(),
                pincode: Joi.number().optional()
            }).optional(),
            addressCordinater: Joi.object({
                lat : Joi.number().unsafe().optional(),
                lang: Joi.number().unsafe().optional()
            }).optional(),
            representativeDetails: Joi.object({
                name: Joi.string().optional(),
                number: Joi.number().optional(),
            }),
            officeType: Joi.string().valid('schedule','express','both').optional().default('both'),
            isKycCompleted: Joi.boolean().default(false).optional(),
            officeContactNumber: Joi.number().unsafe().optional(),
            workingDays: Joi.array().max(7).optional()
        }).unknown(false);
        const { error } = schema.validate(req);
        if(error){
            return helper.validationMessageKey("validation", error);
        }
        return null;
    },
    async deleteOfficeValidation(req){
        const schema = Joi.object({
            id: Joi.string().required()
        }).unknown(false);
        const { error } = schema.validate(req);
        if(error){
            return helper.validationMessageKey("validation", error);
        }
        return null;
    },
    async getByGeoLocationValidation(req){
        const schema = Joi.object({
            radius: Joi.number().integer().required(),
            cordinates: Joi.array().items(Joi.object({ lat: Joi.number().required(), lang: Joi.number().required() })).min(1).required(),
            prefrences: Joi.string().required().valid("offical","personal","both"),
            type: Joi.string().optional().valid("schedule","express"),
            price: Joi.number().optional(),
            capacity: Joi.number().optional(),
            amenitieIds: Joi.array().items(Joi.string().optional()).optional()
        }).unknown(false);
        const { error } = schema.validate(req);
        if(error){
            return helper.validationMessageKey("validation", error);
        }
        return null;
    }
}