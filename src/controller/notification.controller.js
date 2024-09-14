const responseHelper = require("../helpers/responseHelper");
const NotificationModel = require("../models/notification.model");
const notificationValidation = require("../services/validations/notification/notification.validation");
const {
	SERVERERROR,
	SUCCESS,
	FAILURE,
	ACTIVE_STATUS,
} = require("../../config/key");

const notificationService = require("../services/notification/notification.service");

// Add New Notification
exports.add = async (req, res) => {
    try{

            let reqParam = req.body;

            // Create NotificationModel object.
            let notificationData = new NotificationModel({
                userId: reqParam.userId,
                type: reqParam.type,
                title: reqParam.title,
                description: reqParam.description && reqParam.description !== undefined ? reqParam.description : '',
                isViewed: false,
                status: ACTIVE_STATUS
            });

            // Save Notification
            const response = await notificationData.save();

            // Success Response
            return responseHelper.successapi(res, res.__("notificationCreatedSuccessfully"), SUCCESS, response);
    }catch(error){
        // Error Response
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}

// Delete Notification By Id
exports.delete = async (req, res) => {
    try{
        let reqParam = req.query;

        // Validate delete Notification response
        let validationMessage = await notificationValidation.deleteNotificationValidation(reqParam);
        if(validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);


        // Delete Notification
        let deleteNotification = await NotificationModel.findByIdAndDelete(reqParam.id);

        // Success Response
        if(deleteNotification) return responseHelper.successapi(res, res.__("SucessDeletedNotification"), SUCCESS, deleteNotification);

        // Error Response
        return responseHelper.error(res, res.__("errorDeleteNotificationRecords"), FAILURE);
    }catch(error){
        console.log('error : ', error);
        // Error Response
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}

// Get All Notifications
exports.getAll = async (req, res) => {
    try{
        const notifications = await NotificationModel.find();

        let response = notifications && notifications.length> 0 ? notifications : [];
        return responseHelper.successapi(res, res.__("GetAllNotificationSuccess"), SUCCESS, response)
    }catch(error){
        console.log('error : ', error);
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}

// Get
exports.get = async (req, res) => {
    try{
        const user = req.user;

        // Fetch User's Notifications
        let notifications = await notificationService.fetchNotifications({ userId: user._id });

        // Check Response
        let response = notifications && notifications.length > 0 ? notifications : [];

        // Success Response
        return responseHelper.successapi(res, res.__("SucessFetchedNotifications"), SUCCESS, response);
    }catch(error){
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}

// test 
exports.test = async (req, res) => {
    try{
        let reqParam = req.body;

        // {
            // userId, deviceId, title, body, object
        // }

        // let notificationData = await notificationService.sendNotificationToUser(reqParam);

        let notificationData = notificationService.sendNotificationToVendor(reqParam);

        return responseHelper.successapi(res, res.__("SucessSendTestPushNotification"), SUCCESS, notificationData);
    }catch(error){
        console.log('test notification error => ', error);
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}