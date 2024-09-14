// eslint-disable-next-line import/no-extraneous-dependencies
const Joi = require("joi");
const helper = require("../../../helpers/helper");

module.exports = {
	async signupUserValidation(req) {
		const schema = Joi.object({
			// providerType : Joi.number().optional().valid(1,2,3),
			firstName: Joi.string().required(),
			lastName: Joi.string().required(),
			mobile: Joi.number().required(),
			email: Joi.string().required().email(),
			role : Joi.number().required().valid(1,2),
			password: Joi.string().optional(),
			deviceId: Joi.string().optional(),
			repeatPassword: Joi.string().optional().valid(Joi.ref("password")),
		}).unknown(true);
		const { error } = schema.validate(req);
		if (error) {
			return helper.validationMessageKey("validation", error);
		}
		return null;
	},
	async loginUserValidation(req) {
		const schema = Joi.object({
			email: Joi.string().required().email(),
			password: Joi.string().required(),
			// deviceId: Joi.string().optional()
		}).unknown(true);
		const { error } = schema.validate(req);
		if (error) {
			return helper.validationMessageKey("validation", error);
		}
		return null;
	},
	async forgotPasswordValidation(req) {
		const schema = Joi.object({
			email: Joi.string().required().email(),
		}).unknown(true);
		const { error } = schema.validate(req);
		if (error) {
			return helper.validationMessageKey("validation", error);
		}
		return null;
	},
	async resetPasswordValidation(req) {
		const schema = Joi.object({
			resetToken : Joi.string().required(),
			email: Joi.string().required().email(),
			newPassword: Joi.string().required(),
			newPassword2: Joi.string().required(),
			newPassword2: Joi.string().required().valid(Joi.ref("newPassword")),
		}).unknown(true);
		const { error } = schema.validate(req);
		if (error) {
			return helper.validationMessageKey("validation", error);
		}
		return null;
	},
	async changePasswordValidation(req) {
		const schema = Joi.object({
			oldPassword: Joi.string().required(),
			newPassword: Joi.string().required(),
			newPassword2: Joi.string().required().valid(Joi.ref("newPassword")),
		}).unknown(true);
		const { error } = schema.validate(req);
		if (error) {
			return helper.validationMessageKey("validation", error);
		}
		return null;
	},
	async viewUserValidation(req) {
		const schema = Joi.object({
			userId: Joi.string().required()
		}).unknown(true);
		const { error } = schema.validate(req);
		if (error) {
			return helper.validationMessageKey("validation", error);
		}
		return null;
	},
	async listUsersValidation(req) {
		const schema = Joi.object({
			limit: Joi.number().required(),
			page: Joi.number().required(),
			roles: Joi.array().required().min(1).items(Joi.number().required())
		}).unknown(true);
		const { error } = schema.validate(req);
		if (error) {
			return helper.validationMessageKey("validation", error);
		}
		return null;
	},
	async pushLocationUsersValidation(req) {
		const schema = Joi.object({
			sendResult: Joi.boolean().required(),
			participantsIds: Joi.array().min(1).required().items(Joi.string().required())			
		}).unknown(true);
		const { error } = schema.validate(req);
		if (error) {
			return helper.validationMessageKey("validation", error);
		}
		return null;
	},
	async listVendorsValidation(req){
		const schema = Joi.object({
			limit: Joi.number().optional(),
			page: Joi.number().optional(),
			verified: Joi.boolean().required(),
			providerType: Joi.array().required().min(1).items(Joi.number().valid(0,1,2,3).required())
		}).unknown(true);
		const { error } = schema.validate(req);
		if (error) {
			return helper.validationMessageKey("validation", error);
		}
		return null;
	},
	async editValidation(req){
		const schema = Joi.object({
			firstName: Joi.string().optional(),
			lastName: Joi.string().optional(),
			mobile: Joi.number().optional(),
			occupation: Joi.string().optional(),
			dateOfBirth: Joi.date().optional(),
			lat: Joi.number().optional(),
			lang: Joi.number().optional(),
			deviceId: Joi.string().optional(),
			stripeCustomerId: Joi.string().optional(),
			lastLogin: Joi.string().optional(),
			status: Joi.number().optional(),
			stripeId: Joi.string().optional(),
			panNumber: Joi.string().optional(),
			providerType: Joi.number().optional(),
			line1: Joi.string().optional(),
			line2: Joi.string().optional(),
			city: Joi.string().optional(),
			state: Joi.string().optional(),
			pincode: Joi.number().optional(),
			isVerified: Joi.boolean().optional()
		}).unknown(false);
		const { error } = schema.validate(req);
		if(error){
			return helper.validationMessageKey("validation", error);
		}
		return null;
	},
	async editByAdminValidation(req){
		const schema = Joi.object({
			userId: Joi.string().required()
		}).unknown(true);
		const { error } = schema.validate(req);
		if (error) {
			return helper.validationMessageKey("validation", error);
		}
		return null;	
	},
	async enableVendorValidation(req){
		const schema = Joi.object({
			activationType: Joi.string().valid("place","service","webinar").required()
		}).unknown(true);
		const { error } = schema.validate(req);
		if (error) {
			return helper.validationMessageKey("validation", error);
		}
		return null;	
	},
	async createPaymentMethodValidation(req){
		const schema = Joi.object({
			type: Joi.string().valid("upi","bank").required(),
			upiId: Joi.when('type',{
				is: Joi.exist().valid('upi'),
				then: Joi.required(),
			}),
			bankName: Joi.when('type',{
				is: Joi.exist().valid('bank'),
				then: Joi.string().required(),
			}),
			holderName: Joi.when('type',{
				is: Joi.exist().valid('bank'),
				then: Joi.string().required(),
			}),
			acNumber: Joi.when('type',{
				is: Joi.exist().valid('bank'),
				then: Joi.string().required(),
			}),
			ifscCode: Joi.when('type',{
				is: Joi.exist().valid('bank'),
				then: Joi.string().required(),
			}),
			accountType: Joi.when('type',{
				is: Joi.exist().valid('bank'),
				then: Joi.string().required(),
			})
		}).unknown(true);
		const { error } = schema.validate(req);
		if (error) {
			return helper.validationMessageKey("validation", error);
		}
		return null;	
	},
	async editPaymentMethodValidation(req){
		const schema = Joi.object({
			referenceId : Joi.string().required(), 
			type: Joi.string().valid("upi","bank").required(),
			upiId: Joi.when('type',{
				is: Joi.exist().valid('upi'),
				then: Joi.required(),
			}),
			bankName: Joi.when('type',{
				is: Joi.exist().valid('bank'),
				then: Joi.string().required(),
			}),
			holderName: Joi.when('type',{
				is: Joi.exist().valid('bank'),
				then: Joi.string().required(),
			}),
			acNumber: Joi.when('type',{
				is: Joi.exist().valid('bank'),
				then: Joi.string().required(),
			}),
			ifscCode: Joi.when('type',{
				is: Joi.exist().valid('bank'),
				then: Joi.string().required(),
			}),
			accountType: Joi.when('type',{
				is: Joi.exist().valid('bank'),
				then: Joi.string().required(),
			})
		}).unknown(true);
		const { error } = schema.validate(req);
		if (error) {
			return helper.validationMessageKey("validation", error);
		}
		return null;	
	},
	async deletePaymentMethodValidation(req){
		const schema = Joi.object({
			referenceId : Joi.string().required(),
		}).unknown(true);
		const { error } = schema.validate(req);
		if (error) {
			return helper.validationMessageKey("validation", error);
		}
		return null;	
	},
	async createWithdrawalRequestValidation(req){
		const schema = Joi.object({
			amount : Joi.number().required(),
			paymentMethodId: Joi.string().required(),
		}).unknown(true);
		const { error } = schema.validate(req);
		if (error) {
			return helper.validationMessageKey("validation", error);
		}
		return null;	
	},
	async updateWithdrawalRequestValidation(req){
		const schema = Joi.object({
			referenceId : Joi.string().required(),
			transferId : Joi.string().when('status', { is: "completed", then: Joi.required() }),
			transferDate : Joi.date().optional(),
			status : Joi.string().valid("in-progress","completed","rejected").required(),
			remark : Joi.string().optional(),
		}).unknown(true);
		const { error } = schema.validate(req);
		if (error) {
			return helper.validationMessageKey("validation", error);
		}
		return null;
	},
	async getAllWithdrawalRequestValidation(req){
		const schema = Joi.object({
			status : Joi.array().required().min(1).items(Joi.string().valid("requested","in-progress","completed","rejected").required()),
			limit: Joi.number().required(),
			page: Joi.number().required()
		}).unknown(true);
		const { error } = schema.validate(req);
		if (error) {
			return helper.validationMessageKey("validation", error);
		}
		return null;
	},
	async getWithdrawalRequestHistoryByVendorValidation(req){
		const schema = Joi.object({
			role : Joi.number().required(),
			vendorId: Joi.string().when('role', { is: 3, then: Joi.required() }),
			status : Joi.array().required().min(1).items(Joi.string().valid("requested","in-progress","completed","rejected").required()),
			limit: Joi.number().required(),
			page: Joi.number().required(),
		}).unknown(true);
		const { error } = schema.validate(req);
		if (error) {
			return helper.validationMessageKey("validation", error);
		}
		return null;
	},
	async getBookingPaymentHistoryValidation(req){
		const schema = Joi.object({
			role : Joi.number().required(),
			vendorId: Joi.string().when('role', { is: 3, then: Joi.required() }),
			status : Joi.array().required().min(1).items(Joi.string().valid("payment","refund").required()),
			limit: Joi.number().required(),
			page: Joi.number().required(),
		}).unknown(true);
		const { error } = schema.validate(req);
		if (error) {
			return helper.validationMessageKey("validation", error);
		}
		return null;
	},
	async verifyVendorValidation(req){
		const schema = Joi.object({
			vendorId: Joi.string().required(),
			verify : Joi.boolean().required()
		}).unknown(true);
		const { error } = schema.validate(req);
		if (error) {
			return helper.validationMessageKey("validation", error);
		}
		return null;
	},
	async deleteVendorValidation(req){
		const schema = Joi.object({
			vendorId: Joi.string().required(),
		}).unknown(true);
		const { error } = schema.validate(req);
		if(error) {
			return helper.validationMessageKey("validation", error);
		}
		return null;
	},
	async sendNotificationValidation(req){
		const schema = Joi.object({
			vendorId: Joi.array().required().min(1).items(Joi.string().required()),
			title : Joi.string().required(),
			message : Joi.string().required()
		}).unknown(true);
		const { error } = schema.validate(req);
		if (error) {
			return helper.validationMessageKey("validation", error);
		}
		return null;
	},
	async sendMail(req){
		const schema = Joi.object({
			email: Joi.array().required().min(1).items(Joi.string().required().email()),
			subject : Joi.string().required(),
			message : Joi.string().required()
		}).unknown(true);
		const { error } = schema.validate(req);
		if (error) {
			return helper.validationMessageKey("validation", error);
		}
		return null;
	},
};
