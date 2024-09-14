const ServiceBookingModel = require("../models/serviceBooking.model");
const UserModel = require("../models/user.model");
const OfficeModel = require("../models/office.model");
const BookingPaymentHistoryModel = require("../models/bookingPaymentHistory.model");
const VirtualServiceDetailModel = require("../models/virtualServiceDetail.model");
const PhysicalPlaceParticipantModel = require("../models/physicalPlaceParticipant.model");
const serviceBookingValidation = require("../services/validations/serviceBooking/serviceBooking.validation");
const responseHelper = require("../helpers/responseHelper");
const serviceBookingTransformer = require("../transformers/serviceBooking/serviceBookingTransformer");
const { SERVERERROR, SUCCESS, FAILURE, ACTIVE_STATUS, DELETED_STATUS } = require("../../config/key");
var ObjectId = require("mongodb").ObjectID;
const { listBookedService, getBookedService, listBookedServicesByUser, listBookedServicesByVendor, getDashboardCounts, validatePlaceAndServiceAvailablity, getVendorBookedTimeslots } = require("../services/serviceBooking/serviceBooking.service");
const helper = require("../helpers/helper");
const notificationService = require("../services/notification/notification.service");
const { createRefund } = require("../services/Stripe");
var moment = require('moment');
const dayjs = require('dayjs')
const { updateWalletOnCreateBooking, updateWalletOnCancelBooking } = require("../services/handleWallet");
const { storeBookingPaymentHistory } = require("../services/serviceBooking/serviceBooking.service");

// Create Physical Place Booking (PPB)
exports.createPPB = async (req, res) => {
    try {
        const user = req.user;
        let reqParam = req.body;

        // PPB request validations
        let validationMessage = await serviceBookingValidation.createPhysicalPlaceBookingValidation(reqParam);
        if (validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);

        // fetch office for vendorId
        let office = await OfficeModel.findById(reqParam.placeBookingDetails.officeId);
        if (!office) return responseHelper.error(res, res.__("OfficeIdNotValidRecordNotFound"), FAILURE);

        // create service booking object
        let serviceData = new ServiceBookingModel({
            userId: user._id,
            duration: {
                startTime: reqParam.duration.startTime,
                endTime: reqParam.duration.endTime
            },
            date: reqParam.date,
            placeBookingDetails: {
                vendorId: office.userId,
                officeId: reqParam.placeBookingDetails.officeId,
                cabinId: reqParam.placeBookingDetails.cabinId
            },
            physicalType: reqParam.physicalType,
            category: reqParam.category,
            paymentDetails: {
                totalAmount: reqParam.paymentDetails.totalAmount,
                placeVendorAmount: reqParam.paymentDetails.placeVendorAmount,
                platformFee: reqParam.paymentDetails.platformFee,
                referenceId: reqParam.paymentDetails.referenceId,
                transactionType: reqParam.paymentDetails.transactionType,
                invoiceDetail: {
					summaryDuration: reqParam.paymentDetails.invoiceDetail.summaryDuration,
					placeVendorAmount: reqParam.paymentDetails.invoiceDetail.placeVendorAmount,
					// serviceVendorAmount: 0,
					serviceCharge: reqParam.paymentDetails.invoiceDetail.serviceCharge,
					subTotal: reqParam.paymentDetails.invoiceDetail.subTotal,
					gst: reqParam.paymentDetails.invoiceDetail.gst,
					total: reqParam.paymentDetails.invoiceDetail.total,
				},
            },
            placeVerificationCode: Math.floor(100000 + Math.random() * 900000),
            isPlaceVerified: 0,
            isCompleted: 'Upcoming',
            serviceType: 1,
            status: ACTIVE_STATUS
        });

        // save service booking
        let serviceBookingSaved = await serviceData.save();

        //store records in booking payment history table
        let placeVendorPaymentHistory = await storeBookingPaymentHistory(
            serviceBookingSaved.userId,
            serviceBookingSaved.placeBookingDetails.vendorId,
            serviceBookingSaved._id,
            serviceBookingSaved.paymentDetails.referenceId,
            serviceBookingSaved.paymentDetails.placeVendorAmount
        );
        if(!placeVendorPaymentHistory) return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), FAILURE);

        // change wallet balance and update user table
        let updatedPlaceVendor = await updateWalletOnCreateBooking(serviceBookingSaved.placeBookingDetails.vendorId,serviceBookingSaved.paymentDetails.placeVendorAmount);
        if(!updatedPlaceVendor) return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), FAILURE);

        // TODO: add booking user into physicalPlaceParticipant
        let physicalPlaceParticipant = new PhysicalPlaceParticipantModel({
            serviceBookingId: serviceBookingSaved._id,
            isRegistered: true,
            userId: user._id,
            addressCordinater: {
                type: "Point",
                coordinates : [],
            },
            userName : user.firstName + " " + user.lastName,
            contactNumber : user.mobile
        })

        await physicalPlaceParticipant.save();

        // TODO: send push notification & mail & sms; to both vendor & user.
        var userNotificationObject = { 
            userId: user._id,
            notiTitle: "Your place booking is successful",
            // | meeting_confirmation | meeting_cancelled
            body: "{ 'title': 'Your place booking is successful','message': 'Dear '" + user.firstName + "' '" + user.lastName + "' Your booking with us has been successful. If any queries please contact us at support@mymeeting.co.in','type': 'meeting_confirmation' }",
            notiBody: "Dear "+ user.firstName +", Your booking with us has been successful. If any queries please contact us at support@mymeeting.co.in",
            notiType: "booking" 
        }
        let userNotification = await notificationService.sendAllTypesNotifications(userNotificationObject);
        console.log('notifictions on booking user PPB : ', userNotification);

        // Vendor
        var vendorNotificationObject = {
            userId: office.userId,
            notiTitle: "You have new place booking",
            body: "{ 'title': 'You have new place booking','message': 'Dear place vendor, You have new booking. date : '"+ moment(reqParam.date).format("DD-MM-YYYY - dddd") +"' , starting time : '"+ moment(reqParam.duration.startTime).utc().format("HH:mm") +"', ending time : '"+ moment(reqParam.duration.endTime).utc().format("HH:mm") +"'.','type': 'meeting_confirmation' }",
            // notiBody: "Dear place vendor, You have new booking. date : "+ moment(reqParam.date).utc().format("DD-MM-YYYY - dddd") +" , starting time : "+ moment(reqParam.duration.startTime).utc().format("HH:mm") +", ending time : "+ moment(reqParam.duration.endTime).utc().format("HH:mm") +".",
            notiBody: "Dear place vendor, You have new booking. date : "+ moment(reqParam.date).format("DD-MM-YYYY - dddd") +" , starting time : "+ moment(reqParam.duration.startTime).utc().format("HH:mm") +", ending time : "+ moment(reqParam.duration.endTime).utc().format("HH:mm") +".",
            notiType: "booking"
        }
        let vendorNotification = await notificationService.sendAllTypesNotifications(vendorNotificationObject);
        console.log('notifictions on booking vendor PPB : ', vendorNotification);

        return responseHelper.successapi(res, res.__("SuccessBookedPhysicalPlace"), SUCCESS, serviceBookingSaved);
    } catch (error) {
        console.log('E:', error);
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}

// Create Physical Place With Service Booking (PSB)
exports.createPSB = async (req, res) => {
    try {
        const user = req.user;
        let reqParam = req.body;

        // PSB request validation
        let validationMessage = await serviceBookingValidation.createPhysicalPlaceWithServiceBookingValidation(reqParam);
        if (validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);

        // fetch office for vendorId
        let office = await OfficeModel.findById(reqParam.placeBookingDetails.officeId);
        if (!office) return responseHelper.error(res, res.__("OfficeIdNotValidRecordNotFound"), FAILURE);

        // create service booking object
        let serviceData = new ServiceBookingModel({
            userId: user._id,
            duration: {
                startTime: reqParam.duration.startTime,
                endTime: reqParam.duration.endTime
            },
            date: reqParam.date,
            placeBookingDetails: {
                vendorId: office && office.userId !== undefined ? office.userId : "",
                officeId: reqParam.placeBookingDetails.officeId,
                cabinId: reqParam.placeBookingDetails.cabinId
            },
            physicalType: reqParam.physicalType,
            category: reqParam.category,
            serviceId: reqParam.serviceId,
            serviceProviderId: reqParam.serviceProviderId,
            paymentDetails: {
                totalAmount: reqParam.paymentDetails.totalAmount,
                placeVendorAmount: reqParam.paymentDetails.placeVendorAmount,
                serviceVendorAmount: reqParam.paymentDetails.serviceVendorAmount,
                platformFee: reqParam.paymentDetails.platformFee,
                referenceId: reqParam.paymentDetails.referenceId,
                transactionType: reqParam.paymentDetails.transactionType,
                invoiceDetail: {
					summaryDuration: reqParam.paymentDetails.invoiceDetail.summaryDuration,
					placeVendorAmount: reqParam.paymentDetails.invoiceDetail.placeVendorAmount,
					serviceVendorAmount: reqParam.paymentDetails.invoiceDetail.serviceVendorAmount,
					serviceCharge: reqParam.paymentDetails.invoiceDetail.serviceCharge,
					subTotal: reqParam.paymentDetails.invoiceDetail.subTotal,
					gst: reqParam.paymentDetails.invoiceDetail.gst,
					total: reqParam.paymentDetails.invoiceDetail.total,
				},
            },
            placeVerificationCode: Math.floor(100000 + Math.random() * 900000),
            serviceVerificationCode: Math.floor(100000 + Math.random() * 900000),
            isPlaceVerified: 0,
            isServiceVerified: 0,
            isCompleted: 'Upcoming',
            serviceType: 2,
            status: ACTIVE_STATUS
        });

        // save service booking
        let serviceBookingSaved = await serviceData.save();

        //store records in booking payment history table
        let placeVendorPaymentHistory = await storeBookingPaymentHistory(
            serviceBookingSaved.userId,
            serviceBookingSaved.placeBookingDetails.vendorId,
            serviceBookingSaved._id,
            serviceBookingSaved.paymentDetails.referenceId,
            serviceBookingSaved.paymentDetails.placeVendorAmount
        );
        if(!placeVendorPaymentHistory) return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), FAILURE);

        let serviceVendorPaymentHistory = await storeBookingPaymentHistory(
            serviceBookingSaved.userId,
            serviceBookingSaved.serviceProviderId,
            serviceBookingSaved._id,
            serviceBookingSaved.paymentDetails.referenceId,
            serviceBookingSaved.paymentDetails.serviceVendorAmount
        );
        if(!serviceVendorPaymentHistory) return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), FAILURE);

        // change wallet balance and update user table
        let updatedPlaceVendor = await updateWalletOnCreateBooking(serviceBookingSaved.placeBookingDetails.vendorId,serviceBookingSaved.paymentDetails.placeVendorAmount);
        if(!updatedPlaceVendor) return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), FAILURE);

        let updatedServiceVendor = await updateWalletOnCreateBooking(serviceBookingSaved.serviceProviderId,serviceBookingSaved.paymentDetails.serviceVendorAmount);
        if(!updatedServiceVendor) return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), FAILURE);

        // Add booking user into physicalPlaceParticipant
        let physicalPlaceParticipant = new PhysicalPlaceParticipantModel({
            serviceBookingId: serviceBookingSaved._id,
            isRegistered: true,
            userId: user._id,
            addressCordinater: {
                type: "Point",
                coordinates : [],
            },
            userName : user.firstName + " " + user.lastName,
            contactNumber : user.mobile
        })

        await physicalPlaceParticipant.save();

        // Add service vendor into physicalPlaceParticipant
        let serviceProvider = await UserModel.findById(reqParam.serviceProviderId);
        let physicalPlaceParticipantVendor = new PhysicalPlaceParticipantModel({
            serviceBookingId: serviceBookingSaved._id,
            isRegistered: true,
            userId: reqParam.serviceProviderId,
            addressCordinater: {
                type: "Point",
                coordinates : [],
            },
            userName : serviceProvider && serviceProvider.firstName !== undefined ? serviceProvider.firstName + " " + serviceProvider.lastName : "",
            contactNumber : serviceProvider && serviceProvider.mobile !== undefined ? serviceProvider.mobile : ""
        })

        await physicalPlaceParticipantVendor.save();


        // TODO: send push notification & mail & sms; to both vendor & user.
        // Booking User
        var userNotificationObject = { 
            userId: user._id,
            notiTitle: "Your booking is successful",
            body: "{ 'title': 'Your booking is successful','message': 'Dear '" + user.firstName + "' '" + user.lastName + "' Your booking with us has been successful. If any queries contact us at support@mymeeting.co.in','type': 'meeting_confirmation' }",
            notiBody: "Dear "+ user.firstName +", Your booking with us has been successful. If any queries contact us at support@mymeeting.co.in",
            notiType: "booking" 
        }
        let userNotification = await notificationService.sendAllTypesNotifications(userNotificationObject);
        console.log('notifictions on booking user PSB : ', userNotification);

        // Place Vendor
        var placeVendorNotificationObject = {
            userId: office.userId,
            notiTitle: "You have new place booking",
            body: "{ 'title': 'You have new place booking','message': 'Dear place vendor, You have new booking. date : '"+ moment(reqParam.date).format('DD-MM-YYYY - dddd') +"' , starting time : '"+ moment(reqParam.duration.startTime).utc().format('HH:mm') +"', ending time : '"+ moment(reqParam.duration.endTime).utc().format('HH:mm') +"'.','type': 'meeting_confirmation' }",
            // notiBody: "Dear place vendor, You have new booking. date : "+ moment(reqParam.date).utc().format("DD-MM-YYYY - dddd") +" , starting time : "+ moment(reqParam.duration.startTime).utc().format("HH:mm") +", ending time : "+ moment(reqParam.duration.endTime).utc().format("HH:mm") +".",
            notiBody: "Dear place vendor, You have new booking. date : "+ moment(reqParam.date).format("DD-MM-YYYY - dddd") +" , starting time : "+ moment(reqParam.duration.startTime).utc().format("HH:mm") +", ending time : "+ moment(reqParam.duration.endTime).utc().format("HH:mm") +".",
            notiType: "booking"
        }
        let placeVendorNotification = await notificationService.sendAllTypesNotifications(placeVendorNotificationObject);
        console.log('notifictions on booking vendor PSB : ', placeVendorNotification);

        // Service Vendor
        var serviceVendorNotificationObject = {
            userId: reqParam.serviceProviderId,
            notiTitle: "You have new service booking",
            body: "{ 'title': 'You have new service booking','message': 'Dear service vendor, You have new booking. date : '"+ moment(reqParam.date).format('DD-MM-YYYY - dddd') +"' , starting time : '"+ moment(reqParam.duration.startTime).utc().format('HH:mm') +"', ending time : '"+ moment(reqParam.duration.endTime).utc().format('HH:mm') +"'.','type': 'meeting_confirmation' }",
            // notiBody: "Dear service vendor, You have new booking. date : "+ moment(reqParam.date).utc().format("DD-MM-YYYY - dddd") +" , starting time : "+ moment(reqParam.duration.startTime).utc().format("HH:mm") +", ending time : "+ moment(reqParam.duration.endTime).utc().format("HH:mm") +".",
            notiBody: "Dear service vendor, You have new booking. date : "+ moment(reqParam.date).format("DD-MM-YYYY - dddd") +" , starting time : "+ moment(reqParam.duration.startTime).utc().format("HH:mm") +", ending time : "+ moment(reqParam.duration.endTime).utc().format("HH:mm") +".",
            notiType: "booking"
        }
        let serviceVendorNotification = await notificationService.sendAllTypesNotifications(serviceVendorNotificationObject);
        console.log('notifictions on booking vendor PPB : ', serviceVendorNotification);

        return responseHelper.successapi(res, res.__("SuccessBookedPhysicalPlaceWithService"), SUCCESS, serviceBookingSaved);
    } catch (error) {
        console.log('error ', error);
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}

// Create Virtual Service Booking (VSB)
exports.createVSB = async (req, res) => {
    try {
        const user = req.user;
        let reqParam = req.body;

        // VSB request validation
        let validationMessage = await serviceBookingValidation.createVirtualServiceBookingValidation(reqParam);
        if (validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);

        // create service booking object
        let serviceData = new ServiceBookingModel({
            userId: user._id,
            duration: {
                startTime: reqParam.duration.startTime,
                endTime: reqParam.duration.endTime
            },
            date: reqParam.date,
            serviceId: reqParam.serviceId,
            serviceProviderId: reqParam.serviceProviderId,
            paymentDetails: {
                totalAmount: reqParam.paymentDetails.totalAmount,
                serviceVendorAmount: reqParam.paymentDetails.serviceVendorAmount,
                platformFee: reqParam.paymentDetails.platformFee,
                referenceId: reqParam.paymentDetails.referenceId,
                transactionType: reqParam.paymentDetails.transactionType,
                invoiceDetail: {
					summaryDuration: reqParam.paymentDetails.invoiceDetail.summaryDuration,
					placeVendorAmount: 0,
					serviceVendorAmount: reqParam.paymentDetails.invoiceDetail.serviceVendorAmount,
					serviceCharge: reqParam.paymentDetails.invoiceDetail.serviceCharge,
					subTotal: reqParam.paymentDetails.invoiceDetail.subTotal,
					gst: reqParam.paymentDetails.invoiceDetail.gst,
					total: reqParam.paymentDetails.invoiceDetail.total,
				},
            },
            isCompleted: 'Upcoming',
            serviceType: 3,
            status: ACTIVE_STATUS
        });

        // save service booking
        let serviceBookingSaved = await serviceData.save();

        //store records in booking payment history table
        let serviceVendorPaymentHistory = await storeBookingPaymentHistory(
            serviceBookingSaved.userId,
            serviceBookingSaved.serviceProviderId,
            serviceBookingSaved._id,
            serviceBookingSaved.paymentDetails.referenceId,
            serviceBookingSaved.paymentDetails.serviceVendorAmount
        );
        if(!serviceVendorPaymentHistory) return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), FAILURE);

        let updatedServiceVendor = await updateWalletOnCreateBooking(serviceBookingSaved.serviceProviderId,serviceBookingSaved.paymentDetails.serviceVendorAmount);
        if(!updatedServiceVendor) return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), FAILURE);

        // create virtual service detail object
        let virtualServiceData = new VirtualServiceDetailModel({
            serviceBookingId: serviceBookingSaved._id,
            uniqueName: Math.floor(100000 + Math.random() * 900000),
            password: Math.floor(100000 + Math.random() * 900000),
            totalParticipants: reqParam.totalParticipants,
            virtualServiceType: reqParam.virtualServiceType,
            instrucationAnswer: reqParam.instrucationNote && reqParam.instrucationNote !== undefined ? reqParam.instrucationNote : '',
            status: ACTIVE_STATUS
        })

        // save virtual service detail
        serviceBookingSaved.virtualServiceDetail = await virtualServiceData.save();

        // transform response
        let response = serviceBookingTransformer.transformVSB(serviceBookingSaved);

        // TODO: send push notification & mail & sms; to both vendor & user.
        // Booking User
        var userNotificationObject = { 
            userId: user._id,
            notiTitle: "Your booking is successful",
            body: "{ 'title': 'Your booking is successful','message': 'Dear '" + user.firstName + "' '" + user.lastName + "' Your booking with us has been successful. If any queries contact us at support@mymeeting.co.in','type': 'meeting_confirmation' }",
            notiBody: "Dear " + user.firstName + ", Your booking with us has been successful. If you have any queries contact us at support@mymeeting.co.in",
            notiType: "booking" 
        }
        let userNotification = await notificationService.sendAllTypesNotifications(userNotificationObject);
        console.log('notifictions on booking user VSB : ', userNotification);
        
        // Virtual Service Vendor
        var vendorNotificationObject = {
            userId: reqParam.serviceProviderId,
            notiTitle: "You have new virtual booking",
            body: "{ 'title': 'You have new virtual booking','message': 'Dear service vendor, You have new booking. date : '" + moment(reqParam.date).format('DD-MM-YYYY - dddd') + "' , starting time : '" + moment(reqParam.duration.startTime).utc().format('HH:mm') + "', ending time : '" + moment(reqParam.duration.endTime).utc().format('HH:mm') + "'.','type': 'meeting_confirmation' }",
            // notiBody: "Dear service vendor, You have new booking with us. date : "+ moment(reqParam.date).utc().format("DD-MM-YYYY - dddd") +" , starting time : "+ moment(reqParam.duration.startTime).utc().format("HH:mm") +", ending time : "+ moment(reqParam.duration.endTime).utc().format("HH:mm") +".",
            notiBody: "Dear service vendor, You have new booking with us. date : "+ moment(reqParam.date).format("DD-MM-YYYY - dddd") +" , starting time : "+ moment(reqParam.duration.startTime).utc().format("HH:mm") +", ending time : "+ moment(reqParam.duration.endTime).utc().format("HH:mm") +".",
            notiType: "booking"
        }
        let vendorNotification = await notificationService.sendAllTypesNotifications(vendorNotificationObject);
        console.log('notifictions on booking vendor VSB : ', vendorNotification);

        return responseHelper.successapi(res, res.__("SuccessBookedVirtualService"), SUCCESS, response);
    } catch (error) {
        console.log('error ', error);
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}

// Fetch Bookings By UserId and Type - for the client.
exports.getByUser = async (req, res) => {
    try {
        const user = req.user;
        let reqParam = req.body;

        // validate request get bookings by user and type.
        let validationMessage = await serviceBookingValidation.getBookingsByUserIdValidation(reqParam);
        if (validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);

        // pagination
        const { limitCount, skipCount } = helper.getPageAndLimit(reqParam.page, reqParam.limit);

        // get service bookings
        var bookedServices = await listBookedServicesByUser({
            skip: skipCount,
            limit: limitCount,
            userId: reqParam.userId && reqParam.userId !== undefined ? reqParam.userId : user._id,
            serviceType: reqParam.serviceType,
            isCompleted: reqParam.serviceStatus && reqParam.serviceStatus !== undefined ? reqParam.serviceStatus : ['Upcoming', 'Completed', 'Cancelled','In-Progress','Unattended']
        });

        //response data 
        let response = bookedServices && bookedServices.length > 0 ? bookedServices[0].data : [];

        //response data manipulation 
        let responseData = serviceBookingTransformer.transformGetBookingsByUser(response);

        let extras = {
            totalCount: bookedServices && bookedServices.length > 0 && bookedServices[0].totalRecords[0] ? bookedServices[0].totalRecords[0].count : 0
        }

        return responseHelper.successapi(res, res.__("SuccessListServiceBookingByUser"), SUCCESS, responseData, extras);

    } catch (error) {
        console.log('error', error);
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}

// Fetch Bookings By UserId and Type - for the vendor. (TODO: not done yet)
exports.getByVendor = async (req, res) => {
    try {
        const user = req.user;
        let reqParam = req.body;

        //if user role is vendor
        if (user.role !== 2) return responseHelper.error(res, res.__("userNeedsToBeVendor"), FAILURE);

        const { limitCount, skipCount } = helper.getPageAndLimit(reqParam.page, reqParam.limit);

        // validate request get bookings by user and type.
        let validationMessage = await serviceBookingValidation.getBookingsByVendorIdValidation(reqParam);
        if (validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);

        // get service bookings
        var bookedServices = await listBookedServicesByVendor({
            skip: skipCount,
            limit: limitCount,
            userId: reqParam.userId && reqParam.userId !== undefined ? reqParam.userId : user._id,
            serviceType: reqParam.serviceType,
            isCompleted: reqParam.serviceStatus && reqParam.serviceStatus !== undefined ? reqParam.serviceStatus : ['Upcoming', 'Completed', 'Cancelled','In-Progress','Unattended']
        });


        //response data 
        let response = bookedServices && bookedServices.length > 0 ? bookedServices[0].data : [];

        //response data manipulation 
        let responseData = serviceBookingTransformer.transformGetBookingsByUser(response);

        let extras = {
            totalCount: bookedServices && bookedServices.length > 0 && bookedServices[0].totalRecords[0] ? bookedServices[0].totalRecords[0].count : 0
        }
        return responseHelper.successapi(res, res.__("SuccessListServiceBookingByVendor"), SUCCESS, responseData, extras);
    } catch (error) {
        console.log('error', error);
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}

// Verify Booking Date & Time - before booking
exports.verifyDateAndTimeForBooking = async (req, res) => {
    try{
        const user = req.user;
        let reqParam = req.body;

        // validation
        let validationMessage = await serviceBookingValidation.serviceAndPlaceBookingValidation(reqParam);
        if(validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);
        
        var availablityData = await validatePlaceAndServiceAvailablity({
            serviceType: reqParam.serviceType,
            serviceProviderId: reqParam.vendorId && reqParam.vendorId !== undefined ? reqParam.vendorId : false,
            cabinId: reqParam.cabinId && reqParam.cabinId !== undefined ? reqParam.cabinId : false,
            officeId: reqParam.officeId && reqParam.officeId !== undefined ? reqParam.officeId : false,
            startTime: reqParam.s_time,
            endTime: reqParam.e_time
        });
        console.log('Conflict booking ', availablityData);
        if(availablityData && availablityData.length > 0){
            return responseHelper.successapi(res, res.__("Success"), SUCCESS, { canBook: false, effectedBooking: availablityData });
        }else{
            if(availablityData) return responseHelper.successapi(res, res.__("SelectedBookingTimeNotAvailable"), SUCCESS, { canBook: true, effectedBooking: availablityData });
            return responseHelper.error(res, res.__("UnexpectedErrorMissingParam"), FAILURE)
        }
    }catch(error){
        console.log('error :: ', error);
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    } 
}

//service verify and place verify
exports.verify = async (req, res) => {
    try {
        let reqParam = req.body;

        //View Validation
        let validationMessage = await serviceBookingValidation.serviceAndPlaceVerificationValidation(reqParam);
        if (validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);

        var foundBookedService = await ServiceBookingModel.findOne({ _id: ObjectId(reqParam.serviceBookingId), status: { $ne: DELETED_STATUS } });
        if (!foundBookedService) return responseHelper.error(res, res.__("userNotRegisteredWithEmail"), FAILURE);

        if (reqParam.type == "service" ? foundBookedService.serviceVerificationCode === reqParam.code : foundBookedService.placeVerificationCode === reqParam.code) {
            reqParam.type == "service" ? foundBookedService.isServiceVerified = 1 : foundBookedService.isPlaceVerified = 1;
            reqParam.type == "service" ? foundBookedService.serviceVerificationCode = "" : foundBookedService.placeVerificationCode = "";
            foundBookedService.isCompleted = "In-Progress";
            await foundBookedService.save();
            return responseHelper.successapi(res, res.__("codeVerifiedSuccess"), SUCCESS,[]);
        } else {
            return responseHelper.error(res, res.__("codeNotMatch"), FAILURE);
        }
    } catch (e) {
        console.log(e);
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
};

// update web key for web portal 
exports.updateWebKey = async (req, res) => {
    try{
        let reqParam = req.body;

        // validation request
        let validationMessage = await serviceBookingValidation.updateWebKeyValidation(reqParam);
        if (validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);

        var foundVirtualServiceDetail = await VirtualServiceDetailModel.findOne({ serviceBookingId: reqParam.serviceBookingId });

        if(!foundVirtualServiceDetail) return responseHelper.error(res, res.__("NoRecordFoundOfVirtualBooking"), FAILURE);

        let status = foundVirtualServiceDetail.webinar.webKey == "" ? "Added" : "Removed";

        foundVirtualServiceDetail.webinar.webKey = foundVirtualServiceDetail.webinar.webKey == "" ? Math.floor(100000 + Math.random() * 900000) : "";

        await foundVirtualServiceDetail.save();

        return responseHelper.successapi(res, res.__("SuccessUpdatedWebKey"), SUCCESS, { WebKeyStatus : status });
    }catch(error){
        console.log('error : ', error);
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}

//dashboard query
exports.dashboardCounts = async (req, res) => {
    try {
        const user = req.user;
        // validate user role= vendor

        if(user && user.role == 2){
            //get Dashboard data
            //1 = phisycalPlace  
            var physicalPlaceCount = await getDashboardCounts({
                serviceType: 1,
                userId: user._id
            });

            //2 = phisycalPlaceWithService 
            var physicalPlaceWithServiceCount = await getDashboardCounts({
                serviceType: 2,
                userId: user._id
            });

            //3 = virtualService
            var virtualServiceCount = await getDashboardCounts({
                serviceType: 3,
                userId: user._id
            });

            console.log(physicalPlaceCount, physicalPlaceWithServiceCount, virtualServiceCount);

            const responseData = {
                physicalPlaceCount: physicalPlaceCount[0] && physicalPlaceCount[0] !== undefined ? physicalPlaceCount[0] : { totalCount: 0, cancelledCount: 0, completedCount: 0, upcomingCount: 0 },
                physicalPlaceWithServiceCount: physicalPlaceWithServiceCount[0] && physicalPlaceWithServiceCount[0] !== undefined ? physicalPlaceWithServiceCount[0] : { totalCount: 0, cancelledCount: 0, completedCount: 0, upcomingCount: 0 },
                virtualServiceCount: virtualServiceCount[0] && virtualServiceCount[0] !== undefined ? virtualServiceCount[0] : { totalCount: 0, cancelledCount: 0, completedCount: 0, upcomingCount: 0 },
            }

            return responseHelper.successapi(res, res.__("SuccessDashboardCuonts"), SUCCESS, responseData);
        }else{
            return responseHelper.error(res, res.__("ErrorRoleNeedsToBeVendor"), FAILURE);
        }
        
    } catch (e) {
        console.log(e);
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}

//cancel event
exports.cancelBooking = async (req, res) => {
    try {
        let reqParam = req.body;
        const user = req.body;

        // request validation 
        let validationMessage = await serviceBookingValidation.cancelBookingValidation(reqParam);
        if(validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);

        // cancel 
        const bookingCancelled = await ServiceBookingModel.findOneAndUpdate({
            _id: reqParam.serviceBookingId
        }, {
            $set: {
                isCompleted: 'Cancelled'
            }
        });

        // if response null then
        if (!bookingCancelled) return responseHelper.error(res, res.__("BookingNotFound"), FAILURE);

        // TODO: send all notifications to user & vendor
        var userNotificationObject = { 
            userId: bookingCancelled.userId,
            notiTitle: "Your booking is cancelled",
            body: "{ 'title': 'Your booking is cancelled','message': 'Dear '"+ user.firstName +"' Your booking with us has been cancelled. If any queries contact us at support@mymeeting.co.in','type': 'meeting_cancelled' }",
            notiBody: "Dear " + user.firstName + ", Your booking with us has been cancelled. If any queries contact us at support@mymeeting.co.in",
            notiType: "booking" 
        }
        let userNotification = await notificationService.sendAllTypesNotifications(userNotificationObject);
        console.log('notifictions on booking cancel user : ', userNotification);

        // service vendor
        if(bookingCancelled && bookingCancelled.serviceProviderId !== undefined){
            var serviceVendorNotificationObject = { 
                userId: bookingCancelled.serviceProviderId,
                notiTitle: "Your booking is cancelled",
                notiBody: "Dear service provider, Your booking has been cancelled. \n Cancelled booking time : " + moment(bookingCancelled.duration.startTime).utc().format("HH:mm - DD-MM-YYYY") + " to " + moment(bookingCancelled.duration.endTime).utc().format("HH:mm - DD-MM-YYYY") +".",
                notiType: "booking" 
            }
            let serviceVendorNotification = await notificationService.sendAllTypesNotifications(serviceVendorNotificationObject);
            console.log('notifictions on booking cancel service : ', serviceVendorNotification);
        }

        if(bookingCancelled && bookingCancelled.placeBookingDetails !== undefined && bookingCancelled.placeBookingDetails.vendorId !== undefined){
            var placeVendorNotificationObject = { 
                userId: bookingCancelled.serviceProviderId,
                notiTitle: "Your booking is cancelled",
                notiBody: "Dear place vendor, Your booking has been cancelled. \n Cancelled booking time : " + moment(bookingCancelled.duration.startTime).utc().format("HH:mm - DD-MM-YYYY") + " to " + moment(bookingCancelled.duration.endTime).utc().format("HH:mm - DD-MM-YYYY") +".",
                notiType: "booking" 
            }
            let placeVendorNotification = await notificationService.sendAllTypesNotifications(placeVendorNotificationObject);
            console.log('notifictions on booking cancel place : ', placeVendorNotification);
        }

        // Store records in booking payment history table and update wallet balance
        // Params : userId, vendorId, booking_id, referenceId, amount, status, remarks
        // TODO : Pass Refund PaymentId while Store cancellation records 
        if(bookingCancelled.serviceType === 1) {
            let placeVendorPaymentHistory = await storeBookingPaymentHistory(
                bookingCancelled.userId,
                bookingCancelled.placeBookingDetails.vendorId,
                bookingCancelled._id,
                bookingCancelled.paymentDetails.referenceId,
                bookingCancelled.paymentDetails.placeVendorAmount,
                "refund",
                "cancelled"
            );
            if(!placeVendorPaymentHistory) return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), FAILURE);

            // Change wallet balance and update user table
            let updatedUser = await updateWalletOnCancelBooking(bookingCancelled.placeBookingDetails.vendorId,bookingCancelled.paymentDetails.placeVendorAmount); 
            if(!updatedUser) return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), FAILURE);
        }
        
        if(bookingCancelled.serviceType === 2) {
            let placeVendorPaymentHistory = await storeBookingPaymentHistory(
                bookingCancelled.userId,
                bookingCancelled.placeBookingDetails.vendorId,
                bookingCancelled._id,
                bookingCancelled.paymentDetails.referenceId,
                bookingCancelled.paymentDetails.placeVendorAmount,
                "refund",
                "cancelled booking"
            );
            if(!placeVendorPaymentHistory) return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), FAILURE);

            let serviceVendorPaymentHistory = await storeBookingPaymentHistory(
                bookingCancelled.userId,
                bookingCancelled.serviceProviderId,
                bookingCancelled._id,
                bookingCancelled.paymentDetails.referenceId,
                bookingCancelled.paymentDetails.serviceVendorAmount,
                "refund",
                "cancelled booking"
            );
            if(!serviceVendorPaymentHistory) return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), FAILURE);

            // Change wallet balance and update user table
            let updatedUser = await updateWalletOnCancelBooking(bookingCancelled.placeBookingDetails.vendorId,bookingCancelled.paymentDetails.placeVendorAmount); 
            if(!updatedUser) return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), FAILURE);

            let updatedServiceVendor = await updateWalletOnCancelBooking(bookingCancelled.serviceProviderId,bookingCancelled.paymentDetails.serviceVendorAmount);
            if(!updatedServiceVendor) return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), FAILURE);
        }

        if(bookingCancelled.serviceType === 3) {
            let placeVendorPaymentHistory = await storeBookingPaymentHistory(
                bookingCancelled.userId,
                bookingCancelled.serviceProviderId,
                bookingCancelled._id,
                bookingCancelled.paymentDetails.referenceId,
                bookingCancelled.paymentDetails.serviceVendorAmount,
                "refund",
                "cancelled booking"
            );
            if(!placeVendorPaymentHistory) return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), FAILURE);

            // Change wallet balance and update user table
            let updatedServiceVendor = await updateWalletOnCancelBooking(bookingCancelled.serviceProviderId,bookingCancelled.paymentDetails.serviceVendorAmount);
            if(!updatedServiceVendor) return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), FAILURE);
        }

        // temp 
        return responseHelper.successapi(res, res.__("SuccessBookingCancelled"), SUCCESS, bookingCancelled);

        // TODO: activate refunds
        // if(bookingCancelled && bookingCancelled.paymentDetails.referenceId !== null){
        //     // TODO: add notifications to both party
        //     let refundData = await createRefund(bookingCancelled.paymentDetails.referenceId, 00, true);
        //     return responseHelper.successapi(res, res.__("SuccessBookingCancelled"), SUCCESS, { bookingCancelled, refundData });
        // }
        // return responseHelper.error(res, res.__("BookingObjectNotHaveValidRefrenceId"), FAILURE);


        
    } catch (e) {
        console.log(e);
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}

//created service booking
exports.create = async (req, res) => {
    try {
        let reqParam = req.body;

        //server validations
        let validationMessage = await serviceBookingValidation.createServiceBookingValidation(reqParam);
        if (validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);

        // fetch office for vendorId
        let office = await OfficeModel.findById(reqParam.placeBookingDetails.officeId);
        if (!office) return responseHelper.error(res, res.__("OfficeIdNotValidRecordNotFound"), FAILURE);

        //creating request object
        let serviceData = ServiceBookingModel({
            userId: ObjectId(reqParam.userId),
            duration: {
                startTime: reqParam.duration.startTime ? reqParam.duration.startTime : '',
                endTime: reqParam.duration.endTime ? reqParam.duration.endTime : '',
            },
            date: reqParam.date ? reqParam.date : '',
            serviceId: reqParam.serviceId ? ObjectId(reqParam.serviceId) : '',
            ServiceProviderId: reqParam.ServiceProviderId ? ObjectId(reqParam.ServiceProviderId) : '',
            placeBookingDetails: {
                vendorId: office.userId,
                officeId: reqParam.placeBookingDetails.officeId ? ObjectId(reqParam.placeBookingDetails.officeId) : '',
                cabinId: reqParam.placeBookingDetails.cabinId ? ObjectId(reqParam.placeBookingDetails.cabinId) : '',
            },
            paymentDetails: {
                totalAmount: reqParam.paymentDetails.totalAmount ? reqParam.paymentDetails.totalAmount : '',
                placeVendorAmount: reqParam.paymentDetails.placeVendorAmount ? reqParam.paymentDetails.placeVendorAmount : '',
                serviceVendorAmount: reqParam.paymentDetails.serviceVendorAmount ? reqParam.paymentDetails.serviceVendorAmount : '',
                platformFee: reqParam.paymentDetails.platformFee ? reqParam.paymentDetails.platformFee : '',
                referenceId: reqParam.paymentDetails.referenceId ? reqParam.paymentDetails.referenceId : '',
                transactionType: reqParam.paymentDetails.transactionType ? reqParam.paymentDetails.transactionType : ''
            },
            serviceVerificationCode: Math.floor(100000 + Math.random() * 900000),
            placeVerificationCode: Math.floor(100000 + Math.random() * 900000),
            phisycalType: reqParam.phisycalType ? reqParam.phisycalType : '',
            category: reqParam.category ? reqParam.category : '',
            isServiceVerified: false,
            isPlaceVerified: false,
            isCompleted: 'Upcoming',
            addressCordinater: {
                lat: reqParam.addressCordinater.lat ? reqParam.addressCordinater.lat : '',
                lang: reqParam.addressCordinater.lang ? reqParam.addressCordinater.lang : ''
            },
            serviceType: reqParam.serviceType ? reqParam.serviceType : '',
            status: 1,
        });

        //service  save
        let serviceBookingSaved = await serviceData.save();

        //manipulate the response
        let serviceBookingData = serviceBookingTransformer.transform(serviceBookingSaved);

        return responseHelper.successapi(res, res.__("SucessServiceBookingSaved"), SUCCESS, serviceBookingData);
    } catch (e) {
        console.log(e);
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
};

//edit service booking
exports.edit = async (req, res) => {
    try {
        let reqParam = req.body;
        //server validations
        let validationMessage = await serviceBookingValidation.editServiceBookingValidation(reqParam);
        if (validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);
        const serviceBookingExistingData = await ServiceBookingModel.findOne({ _id: reqParam._id, status: ACTIVE_STATUS });
        
        //update the data
        await ServiceBookingModel.findOneAndUpdate({ _id: reqParam._id, status: ACTIVE_STATUS }, {
            $set: {
                duration: {
                    startTime: reqParam.startTime ? reqParam.startTime : serviceBookingExistingData.duration.startTime,
                    endTime: reqParam.endTime ? reqParam.endTime : serviceBookingExistingData.duration.endTime,
                },
                date: reqParam.date ? reqParam.date : serviceBookingExistingData.date,
                serviceId: reqParam.serviceId ? ObjectId(reqParam.serviceId) : serviceBookingExistingData.serviceId,
                ServiceProviderId: reqParam.ServiceProviderId ? ObjectId(reqParam.ServiceProviderId) : serviceBookingExistingData.ServiceProviderId,
                placeBookingDetails: {
                    vendorId: reqParam.vendorId ? ObjectId(reqParam.vendorId) : serviceBookingExistingData.placeBookingDetails.vendorId,
                    officeId: reqParam.officeId ? ObjectId(reqParam.officeId) : serviceBookingExistingData.placeBookingDetails.officeId,
                    cabinId: reqParam.cabinId ? ObjectId(reqParam.cabinId) : serviceBookingExistingData.placeBookingDetails.cabinId,
                },
                // paymentDetails: {
                //     totalAmount: reqParam.totalAmount ? reqParam.totalAmount : serviceBookingExistingData.paymentDetails.totalAmount,
                //     placeVendorAmount: reqParam.placeVendorAmount ? reqParam.placeVendorAmount : serviceBookingExistingData.paymentDetails.placeVendorAmount,
                //     serviceVendorAmount: reqParam.serviceVendorAmount ? reqParam.serviceVendorAmount : serviceBookingExistingData.paymentDetails.serviceVendorAmount,
                //     platformFee: reqParam.platformFee ? reqParam.platformFee : serviceBookingExistingData.paymentDetails.platformFee,
                //     referenceId: reqParam.referenceId ? reqParam.referenceId : serviceBookingExistingData.paymentDetails.referenceId,
                //     transactionType: reqParam.transactionType ? reqParam.transactionType : serviceBookingExistingData.paymentDetails.transactionType,
                //     invoiceDetail: reqParam.invoiceDetail ? reqParam.invoiceDetail : serviceBookingExistingData.paymentDetails.invoiceDetail
                // },
                // USECASE --> FUTURE_SCOPE : If require then we will update the details
                paymentDetails: {
                    totalAmount: reqParam.totalAmount ? reqParam.totalAmount : serviceBookingExistingData.paymentDetails.totalAmount,
                    placeVendorAmount: serviceBookingExistingData.paymentDetails.placeVendorAmount,
                    serviceVendorAmount: reqParam.serviceVendorAmount ? reqParam.serviceVendorAmount : serviceBookingExistingData.paymentDetails.serviceVendorAmount,
                    platformFee: reqParam.platformFee ? reqParam.platformFee : serviceBookingExistingData.paymentDetails.platformFee,
                    referenceId: serviceBookingExistingData.paymentDetails.referenceId,
                    transactionType: reqParam.transactionType ? reqParam.transactionType : serviceBookingExistingData.paymentDetails.transactionType,
                    invoiceDetail: serviceBookingExistingData.paymentDetails.invoiceDetail
                },
                physicalType: reqParam.physicalType ? reqParam.physicalType : serviceBookingExistingData.physicalType,
                category: reqParam.category ? reqParam.category : serviceBookingExistingData.category,
                serviceType: reqParam.serviceType ? reqParam.serviceType : serviceBookingExistingData.serviceType,
                isServiceVerified: reqParam.isServiceVerified ? reqParam.isServiceVerified : serviceBookingExistingData.isServiceVerified,
                isPlaceVerified: reqParam.isPlaceVerified ? reqParam.isPlaceVerified : serviceBookingExistingData.isPlaceVerified,
                status: reqParam.status ? reqParam.status : serviceBookingExistingData.status,
                isCompleted : reqParam.isCompleted ? reqParam.isCompleted : serviceBookingExistingData.isCompleted,
            }
        });
        const virtualServiceDetailExistingData = await VirtualServiceDetailModel.findOne({ serviceBookingId: reqParam._id, status: ACTIVE_STATUS });
        if(virtualServiceDetailExistingData){
            // edit virtual service detail
            await VirtualServiceDetailModel.findOneAndUpdate({ serviceBookingId: reqParam._id, status: ACTIVE_STATUS },{
                $set: {
                    uniqueName: reqParam.uniqueName ? reqParam.uniqueName : virtualServiceDetailExistingData.uniqueName,
                    password: reqParam.password ? reqParam.password : virtualServiceDetailExistingData.password,
                    webinar: {
                        roomId: reqParam.roomId ? reqParam.roomId : virtualServiceDetailExistingData.webinar && virtualServiceDetailExistingData.webinar.roomId ? virtualServiceDetailExistingData.webinar.roomId : '',
                        expertId: reqParam.expertId ? reqParam.expertId : virtualServiceDetailExistingData.webinar && virtualServiceDetailExistingData.webinar.expertId ? virtualServiceDetailExistingData.webinar.expertId : '',
                        webKey: reqParam.webKey ? reqParam.webKey : virtualServiceDetailExistingData.webinar && virtualServiceDetailExistingData.webinar.webKey ? virtualServiceDetailExistingData.webinar.webKey : ''
                    },
                    totalParticipants: reqParam.totalParticipants ? reqParam.totalParticipants : virtualServiceDetailExistingData.totalParticipants,
                    virtualServiceType: reqParam.virtualServiceType ? reqParam.virtualServiceType : virtualServiceDetailExistingData.virtualServiceType,
                    instrucationAnswer: reqParam.instrucationAnswer ? reqParam.instrucationAnswer : virtualServiceDetailExistingData.instrucationAnswer,
                }
            });
        }
        // fetch updated records.
        const serviceBookingData = await ServiceBookingModel.findOne({ _id: reqParam._id, status: ACTIVE_STATUS });
        //response data manipulation 
        let serviceeBookingData = serviceBookingTransformer.transform(serviceBookingData)
        return responseHelper.successapi(res, res.__("ServiceBookingUpdatedSuccess"), SUCCESS, serviceeBookingData);
    } catch (e) {
        console.log(e);
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
};

//booked service list by admin
exports.list = async (req, res) => {
    try {
        const user = req.user;
        var reqParam = req.body;

        //check is user is admin or not
        if (user.role === 1 || user.role === 2) return responseHelper.error(res, res.__("UnauthorizedUser"), FAILURE);

        //List Validation
        let validationMessage = await serviceBookingValidation.listServiceBookingValidation(reqParam);
        if (validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);

        // Pagination
        const { limitCount, skipCount } = helper.getPageAndLimit(reqParam.page, reqParam.limit);

        // Get Service Bookings By Status (isCompleted)
        var bookedServiceList = await listBookedService({
            skip: skipCount,
            limit: limitCount,
            isCompleted: reqParam.serviceStatus,
            serviceType : reqParam.serviceType
        });

        //response data 
        let response = bookedServiceList && bookedServiceList.length > 0 ? bookedServiceList[0].data : [];

        //response data manipulation 
        let responseData = serviceBookingTransformer.transformListCollection(response);

        let extras = {
            totalCount: bookedServiceList && bookedServiceList.length > 0 && bookedServiceList[0].totalRecords[0] ? bookedServiceList[0].totalRecords[0].count : 0
        }

        return responseHelper.successapi(res, res.__("SuccessListServiceBooking"), SUCCESS, responseData, extras);
    } catch (e) {
        console.log(e);
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}

//view Single Service Booking
exports.view = async (req, res) => {
    try {
        let reqParam = req.body;

        //View Validation
        let validationMessage = await serviceBookingValidation.viewServiceBookingValidation(reqParam);
        if (validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);

        //call the get booked service 
        var foundBookedService = await getBookedService({
            _id: reqParam._id
        });
        console.log('row response ', foundBookedService[0]);
        //return if booked service not found
        if (!foundBookedService || foundBookedService.length <= 0) return responseHelper.error(res, res.__("BookedServiceNotFound"), FAILURE);

        //response data manipulation
        let bookedServiceData = serviceBookingTransformer.transform(foundBookedService[0]);
        return responseHelper.successapi(res, res.__("SuccessBookedServiceFound"), SUCCESS, bookedServiceData);

    } catch (e) {
        console.log(e);
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
};

// get Available timeslots By vendor & date (checking all the existing booking on same date)
exports.getBookingTimesByDate = async (req, res) => {
    try{
        const user = req.user;
        let reqParam = req.body;
        
        // 
        let validationMessage = await serviceBookingValidation.getBookingTimesByDateValidation(reqParam);
        if(validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);

        console.log('Get Booking Times ', reqParam);

        var bookingTimes = await getVendorBookedTimeslots({
            vendorId: reqParam.vendorId,
            date: reqParam.date
        });
        if(bookingTimes) return responseHelper.successapi(res, res.__("SuccessGetBookingTimesByDate"), SUCCESS, bookingTimes);
        return responseHelper.successapi(res, res.__("ResultNotFound"), SUCCESS);
    }catch(error){
        console.log(error);
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}

// get totals
exports.getTotals = async (req, res) => {
    try{
        const user = req.user;

        // admin role validation 
        if(user.role == 2 || user.role == 1) return responseHelper.error(res, res.__("UserMustBeAdmin"), FAILURE);

        // get totals
        let totalBookings = await ServiceBookingModel.find().count();

        // get cancelled totals
        let totalCancelBookings = await ServiceBookingModel.find({ isCompleted: 'Cancelled' }).count();

        // get upcomming totals
        let totalUpcomingBookings = await ServiceBookingModel.find({ isCompleted: 'Upcoming' }).count();

        // get completed totals
        let totalCompletedBookings = await ServiceBookingModel.find({ isCompleted: 'Completed' }).count();

        // get unattended totals
        let totalUnattendedBookings = await ServiceBookingModel.find({ isCompleted: 'Unattended' }).count();

        // get In-Progress totals
        let totalInProgressBookings = await ServiceBookingModel.find({ isCompleted: 'In-Progress' }).count();

        return responseHelper.successapi(res, res.__("Success"), SUCCESS, { totalBookings, totalCancelBookings, totalUpcomingBookings, totalCompletedBookings, totalUnattendedBookings, totalInProgressBookings });

    }catch(error){
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}