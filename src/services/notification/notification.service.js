const { ACTIVE_STATUS } = require("../../../config/key");
const NotificationModel = require("../../models/notification.model");
const UserModel = require("../../models/user.model");
let ejs = require("ejs");
const path = require("path");
var otpService = require("../otp/sms.service");
var mail = require("../Mailer");
var fcm = require('../FCM');
const { getDeviceIdOfUsers } = require("../user/user.service");
var ObjectId = require("mongodb").ObjectID;

// send push notification to user
exports.sendNotificationToUser = async (data) => {
    try{
        let fcm_object = {
            userId: data.userId,
            role: 1,
            deviceId: data.deviceId,
            title: data.title,
            body: data.body,
            object: data.object ? data.object : { title: data.title, body: data.body }
        };

        let fcmNoti = await fcm.send(fcm_object);
        if(fcmNoti) fcmNoti.stored = await createNotification(fcm_object);
        return fcmNoti;
    }catch(error){
        return error;
    }
}

// send push notification to vendor
exports.sendNotificationToVendor = async (data) => {
    try{
        let fcm_object = {
            userId: data.userId,
            role: 2,
            deviceId: data.deviceId,
            title: data.title,
            body: data.body,
            object: data.object ? data.object : {}
        };

        let fcmNoti = await fcm.send(fcm_object);
        if(fcmNoti) fcmNoti.stored = await createNotification(fcm_object)
        return fcmNoti;
    }catch(error){
        return error;
    }
}

/**
 * 
 * @param {
 * userId // find deviceId, role, mobile
 * notiTitle // title of notification
 * notiBody // notification's detailed body
 * notiType // notification type
 * } data 
 * @returns 
 * 
 **/ 


exports.sendAllTypesNotifications = async (data) => {
    try{

        // find user
        let user = await UserModel.findById(data.userId);
        var notification = [];
        if(user){
            if(user.deviceId && user.deviceId !== undefined){
                // FCM
                var fcmNoti = await fcm.send({
                    userId: user._id,
                    role: user.role,
                    deviceId: user.deviceId,
                    title: data.notiTitle,
                    body: data?.body,
                    object: {}
                });
                notification.push({fcmNoti});
            }

            // Add record into DB
            await createNotification({
                userId: user._id,
                role: user.role,
                title: data.notiTitle,
                body: data.notiBody
            });
            
            if(user.mobile && user.mobile !== undefined){
                // SMS
                var smsNoti = await otpService().sendSMS(user.mobile, data.notiTitle);
                notification.push({smsNoti});
            }
            
            if(user.email && user.email !== undefined){
                // Mail
                const emailBody = await ejs.renderFile(
                    path.join(__dirname, "../../views/emails/registration", "registration.ejs"),
                    { locals: { text: data.notiBody } },
                );
                let mailNoti = await mail.sendEmail(user.email,emailBody,data.notiTitle);
                notification.push({mailNoti});
            }
            
            return notification;
        }else{
            return false;
        }
    }catch(error){
        return error;
    }
}


// create Record in db
var createNotification = async (data) => {
    try{

        // create Notification Model Object
        let notificationData = new NotificationModel({
            userId: data.userId,
            type: data.role == 1 ? "userNotification" : "vendorNotification",
            title: data.title,
            description: data.body ? data.body : '',
            isViewed: false,
            status: ACTIVE_STATUS
        });

        // Save Notification into db
        let notificationSaved = await notificationData.save();

        if(notificationSaved) return true;
        return false;

    }catch(error){
        throw error;
    }
}

// fetch notifications of user desc order
exports.fetchNotifications = async (data) => {
    try{
        let pipeline = [];

		//adding query into the pipeline array
		pipeline.push({
			$match: {
				userId: ObjectId(data.userId)
			},
		});

        pipeline.push({
            $sort: { createdAt: -1 } 
        });

		const result = await NotificationModel.aggregate(pipeline);
		return result;
    }catch(error){
        console.log('error :: ', error);
        return false;
    }
}

exports.sendPushNotificationToSpecificVendor = async (data) => {
    try{
        // find user
        var notification = [];

        let updatedCollection = data?.vendorId?.map((val) => ObjectId(val));

        let deviceId = await getDeviceIdOfUsers(updatedCollection);

        deviceId = deviceId?.map(data => data.deviceId);

        let user = deviceId?.length === 0 ? false : true;

        if(user) {
            let notificationObj = {
                deviceId: deviceId,
                title: data?.title,
                object: { title : data?.title, content : data?.message },
                type : 'MULTIPLE_PUSH_NOTIFICATION'
            }
            // FCM
            var fcmNoti = await fcm.send(notificationObj);
            notification.push({fcmNoti});

            return notification;
        }else {
            return false;
        }
    }catch(error){
        console.log('error :: ', error);
        return error;
    }
}
