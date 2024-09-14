var FCM = require('fcm-node');
const { FCM_CLIENT_APP_KEY, FCM_VENDOR_APP_KEY } = require("../../config/key");
var fcmClient = new FCM(FCM_CLIENT_APP_KEY);
var fcmVendor = new FCM(FCM_VENDOR_APP_KEY);

exports.send = async (data) => {
    try{
        var message = {
            //this may vary according to the message type (single recipient, multicast, topic, et cetera)
            to: data.deviceId, 
            collapse_key: 'Transactional Notification',
            data: data.object
        }

        let pushNotification = {
            registration_ids: data.deviceId, // Multiple tokens in an array
            collapse_key: 'Transactional Notification',
            data: data.object
        }

        if(data.hasOwnProperty("type") && data?.type === "MULTIPLE_PUSH_NOTIFICATION") {
            return new Promise((resolve, reject) => {
                fcmClient.send(pushNotification, async (err, response) => {
                    if(err){
                        reject(err)
                    } else{
                        resolve(response);
                    }
                });
            })
        }else if(data.role == 1){
            return new Promise((resolve, reject) => {
                fcmClient.send(message, async (err, response) => {
                    if(err){
                        reject(err)
                    } else{
                        resolve(response);
                    }
                });
            })
        }else{
            return new Promise((resolve, reject) => {
                fcmVendor.send(message, async (err, response) => {
                    if(err){
                        reject(err);
                    }else{
                        resolve(response);
                    }
                });
            });
        }
    }catch(error){
        console.log('Notification Error : ', error);
        throw error;
    }
}