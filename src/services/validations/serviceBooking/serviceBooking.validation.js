// eslint-disable-next-line import/no-extraneous-dependencies
const Joi = require("joi");
const helper = require("../../../helpers/helper");

module.exports = {
	// createPhysicalPlaceBookingValidation
	async createPhysicalPlaceBookingValidation(req){
		const schema = Joi.object({
			duration: Joi.object({ 
				startTime: Joi.string().required(),
				endTime: Joi.string().required() 
			}),
			date: Joi.date().required(),
			placeBookingDetails: Joi.object({
				officeId: Joi.string().required(),
				cabinId: Joi.string().required(),
			}),
			physicalType: Joi.number().required(),
			category: Joi.number().required(),
			paymentDetails: Joi.object({
				totalAmount: Joi.number().precision(2).required(),
				placeVendorAmount: Joi.number().precision(2).required(),
				platformFee: Joi.number().precision(2).required(),
				referenceId: Joi.string().required(),
				transactionType: Joi.string().required(),
				invoiceDetail: Joi.object({
					summaryDuration: Joi.number().integer().required(),
					placeVendorAmount: Joi.number().precision(2).required(),
					serviceCharge: Joi.number().precision(2).required(),
					subTotal: Joi.number().precision(2).required(),
					gst: Joi.number().precision(2).required(),
					total: Joi.number().precision(2).required(),
				}).required(),
			})
		}).unknown(false);
		const { error } = schema.validate(req);
		if (error) {
			return helper.validationMessageKey("validation", error);
		}
		return null;
	},

	async editServiceBookingValidation(req) {
		const schema = Joi.object({
			_id : Joi.string().required(),
			startTime: Joi.string().optional(),
			endTime: Joi.string().optional(),
			date: Joi.date().optional(),
			officeId: Joi.string().optional(),
			cabinId: Joi.string().optional(),
			vendorId: Joi.string().optional(),
			physicalType: Joi.number().valid(1,2).optional(),
			category: Joi.number().valid(1,2).optional(),
			serviceId: Joi.string().optional(),
			ServiceProviderId: Joi.string().optional(),
			serviceType: Joi.number().valid(1,2,3).optional(),
			isCompleted: Joi.string().valid('Completed','Cancelled','Upcoming','Unattended','In-Progress').optional(),
			isServiceVerified: Joi.boolean().optional(),
			isPlaceVerified: Joi.boolean().optional(),
			totalAmount: Joi.number().precision(2).optional(),
			placeVendorAmount: Joi.number().precision(2).optional(),
			serviceVendorAmount: Joi.number().precision(2).optional(),
			platformFee: Joi.number().precision(2).optional(),
			referenceId: Joi.string().optional(),
			transactionType: Joi.string().valid("Card","Cash").optional(),
			invoiceDetail: Joi.object({
				summaryDuration: Joi.number().integer().optional(),
				placeVendorAmount: Joi.number().precision(2).optional(),
				serviceVendorAmount: Joi.number().precision(2).optional(),
				serviceCharge: Joi.number().precision(2).optional(),
				subTotal: Joi.number().precision(2).optional(),
				gst: Joi.number().precision(2).optional(),
				total: Joi.number().precision(2).optional(),
			}).optional(),
			uniqueName: Joi.string().optional(),
			password: Joi.string().optional(),
			roomId: Joi.string().optional(),
			expertId: Joi.string().optional(),
			webKey: Joi.string().optional(),
			totalParticipants: Joi.number().optional(),
			virtualServiceType: Joi.number().valid(1,2,3).optional(),
			instrucationAnswer: Joi.string().optional()
		}).unknown(false);
		const { error } = schema.validate(req);
		if (error) {
			return helper.validationMessageKey("validation", error);
		}
		return null;
	},
	// List Service Booking Validation - for admin
	async listServiceBookingValidation(req) {
		const schema = Joi.object({
			page : Joi.number().required(),
			limit: Joi.number().required(),
			serviceStatus: Joi.array().min(1).items(Joi.string().required().valid('Completed','Cancelled','Upcoming','In-Progress','Unattended')).required(),
			serviceType: Joi.array().min(1).items(Joi.number().required().valid(1,2,3)).required()
		}).unknown(false);
		const { error } = schema.validate(req);
		if(error){
			return helper.validationMessageKey("validation", error);
		}
		return null;
	},

	// View Service Booking Validation
	async viewServiceBookingValidation(req) {
		const schema = Joi.object({
			_id : Joi.string().required(),
		}).unknown(false);
		const { error } = schema.validate(req);
		if(error){
			return helper.validationMessageKey("validation", error);
		}
		return null;
	},

	// createPhysicalPlaceWithServiceBookingValidation
	async createPhysicalPlaceWithServiceBookingValidation(req){
		const schema = Joi.object({
			duration: Joi.object({ 
				startTime: Joi.string().required(),
				endTime: Joi.string().required() 
			}),
			date: Joi.date().required(),
			placeBookingDetails: Joi.object({
				officeId: Joi.string().required(),
				cabinId: Joi.string().required(),
			}),
			physicalType: Joi.number().required(),
			category: Joi.number().required(),
			serviceId: Joi.string().required(),
			serviceProviderId: Joi.string().required(),
			paymentDetails: Joi.object({
				totalAmount: Joi.number().precision(2).required(),
				placeVendorAmount: Joi.number().precision(2).required(),
				serviceVendorAmount: Joi.number().precision(2).required(),
				platformFee: Joi.number().precision(2).required(),
				referenceId: Joi.string().required(),
				transactionType: Joi.string().required(),
				invoiceDetail: Joi.object({
					summaryDuration: Joi.number().integer().required(),
					placeVendorAmount: Joi.number().precision(2).required(),
					serviceVendorAmount: Joi.number().precision(2).required(),
					serviceCharge: Joi.number().precision(2).required(),
					subTotal: Joi.number().precision(2).required(),
					gst: Joi.number().precision(2).required(),
					total: Joi.number().precision(2).required(),
				}).required(),
			})
		}).unknown(false);
		const { error } = schema.validate(req);
		if(error){
			return helper.validationMessageKey("validation", error);
		}
		return null;
	},

	// createVirtualServiceBookingValidation
	async createVirtualServiceBookingValidation(req){
		const schema = Joi.object({
			duration: Joi.object({ 
				startTime: Joi.string().required(),
				endTime: Joi.string().required() 
			}),
			date: Joi.date().required(),
			serviceId: Joi.string().required(),
			serviceProviderId: Joi.string().required(),
			paymentDetails: Joi.object({
				totalAmount: Joi.number().precision(2).required(),
				serviceVendorAmount: Joi.number().precision(2).required(),
				platformFee: Joi.number().precision(2).required(),
				referenceId: Joi.string().required(),
				transactionType: Joi.string().required(),
				invoiceDetail: Joi.object({
					summaryDuration: Joi.number().integer().required(),
					serviceVendorAmount: Joi.number().precision(2).required(),
					serviceCharge: Joi.number().precision(2).required(),
					subTotal: Joi.number().precision(2).required(),
					gst: Joi.number().precision(2).required(),
					total: Joi.number().precision(2).required(),
				}).required(),
			}),
			totalParticipants: Joi.number().required(),
			virtualServiceType: Joi.number().required(),
			instrucationNote: Joi.string().optional()
		}).unknown(false);
		const { error } = schema.validate(req);
		if(error){
			return helper.validationMessageKey("validation", error);
		}
		return null;
	},

	// fetch service booking by userId
	async getBookingsByUserIdValidation(req) {
		const schema = Joi.object({
			userId: Joi.string().optional(),
			limit : Joi.number().required(),
			page : Joi.number().required(),
			serviceType: Joi.array().min(1).items(Joi.number().required()).required(),
			serviceStatus: Joi.array().items(Joi.string().required().valid('Completed','Cancelled','Upcoming','Unattended','In-Progress')).optional()
		}).unknown(false);
		const { error } = schema.validate(req);
		if(error){
			return helper.validationMessageKey("validation", error);
		}
		return null;
	},

	// validation for udpateWebKey
	async updateWebKeyValidation(req){
		const schema = Joi.object({ serviceBookingId : Joi.string().required() }).unknown(false);
		const { error } = schema.validate(req);
		if(error){
			return helper.validationMessageKey("validation", error);
		}
		return null;
	},


	async serviceAndPlaceVerificationValidation(req) {
		const schema = Joi.object({
			serviceBookingId : Joi.string().required(),
			code : Joi.string().required(),
			type : Joi.string().required().valid('service', 'place'),
		}).unknown(true);
		const { error } = schema.validate(req);
		if(error){
			return helper.validationMessageKey("validation", error);
		}
		return null;
	},

	async serviceAndPlaceBookingValidation(req) {
		const schema = Joi.object({
			vendorId: Joi.string().optional(),
			cabinId: Joi.string().optional(),
			officeId: Joi.string().optional(),
			s_time : Joi.date().required(),
			e_time : Joi.date().required(),
			serviceType: Joi.number().required().valid(1,2,3)
		}).unknown(false);
		const { error } = schema.validate(req);
		if(error){
			return helper.validationMessageKey("validation", error);
		}
		return null;
	},

	// fetch service booking by vendorId
	async getBookingsByVendorIdValidation(req) {
		const schema = Joi.object({
			userId: Joi.string().optional(),
			limit : Joi.number().required(),
			page : Joi.number().required(),
			serviceType: Joi.array().min(1).items(Joi.number().required()).required(),
			serviceStatus: Joi.array().items(Joi.string().required().valid('Completed','Cancelled','Upcoming','Unattended','In-Progress')).optional()
		}).unknown(false);
		const { error } = schema.validate(req);
		if(error){
			return helper.validationMessageKey("validation", error);
		}
		return null;
	},

	// fetch booking times by date
	async getBookingTimesByDateValidation(req) {
		const schema = Joi.object({
			date: Joi.date().required(),
			vendorId: Joi.string().required()
		}).unknown(false);
		const { error } = schema.validate(req);
		if(error) return helper.validationMessageKey("validation", error);
		return null;
	},

	// cancle Boooking
	async cancelBookingValidation (req) {
		const schema = Joi.object({
			serviceBookingId: Joi.string().required(),
			cancelType: Joi.string().required().valid("user","vendor")
		}).unknown(false);
		const { error } = schema.validate(req);
		if(error) return helper.validationMessageKey("validation", error);
		return null;
	}
};
