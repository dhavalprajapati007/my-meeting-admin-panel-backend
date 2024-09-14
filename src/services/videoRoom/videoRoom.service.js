var twilio = require('../Twilio');
var dayjs = require('dayjs');
var isBetween = require('dayjs/plugin/isBetween');
dayjs.extend(isBetween);
const VirtualServiceDetailModel = require("../../models/virtualServiceDetail.model");
const serviceBookingModel = require("../../models/serviceBooking.model");
const notificationService = require("../notification/notification.service");
const aws = require('aws-sdk');

const s3 = new aws.S3();

var compareTime = async (data) => {
    try {
        // check for current date
        let current_date = dayjs(Date.now()).format("DD/MM/YYYY");
        console.log("Current Date : ", current_date);
        let booking_date = dayjs(data.s_time).utc().format("DD/MM/YYYY");
        console.log("Booking Date : ", booking_date);

        if (current_date === booking_date) {
            // check for current time
            let current_time = dayjs(Date.now()).format("HH:mm:ss");
            let start_time = dayjs(data.s_time).subtract(10, 'minute').utc().format("HH:mm:ss");
            let end_time = dayjs(data.e_time).utc().format("HH:mm:ss");
            console.log("-------------------------------");
            console.log("Current Time : ", current_time);
            console.log("-------------------------------");
            console.log("Start Time : ", start_time);
            console.log("End Time : ", end_time);
            console.log("-------------------------------");
            let isValid = dayjs(Date.now()).utc(true).isBetween(dayjs(data.s_time).subtract(10, 'minute').utc(), dayjs(data.e_time).utc());
            console.log('isValid : ', isValid);
            return isValid;
        } else {
            return false;
        }
    } catch (error) {
        console.log('error : ', error);
        return error;
    }
}

var twilioVideoRoom = async (data) => {
    try {
        let createVideoRoom = {
            uniqueName: data.uniqueName,
            maxParticipants: data.participants,
            type: data.type == 1 ? "peer-to-peer" : "group", // "peer-to-peer", "group"
            recordParticipantsOnConnect: true
        }
        // create new twilio room
        let room = await twilio.createTwilioRoom(createVideoRoom);
        return room;
    } catch (error) {
        return error;
    }
}

exports.createVideoRoom = async (data) => {
    try {
        // let booking = await VirtualServiceDetailModel.find({
        //     password: data.password,
        //     uniqueName: data.uniqueName
        // }).populate('serviceBookingId', 'duration').exec();

        // TEMP

        if (data.uniqueName === "8866394930") {
            let videoRoom = await twilioVideoRoom({
                uniqueName: data.uniqueName,
                participants: 10,
                type: 2
            });
            console.log('VideoRoom Creation : ', videoRoom);
            return videoRoom;
        }

        let booking = await VirtualServiceDetailModel.find({
            password: data.password,
            uniqueName: data.uniqueName,
            "webinar.webKey": data.host_key ? data.host_key : ""
        }).populate('serviceBookingId').exec();

        console.log('Booking : ', booking);

        if (booking[0] && booking[0]?.serviceBookingId && booking[0]?.serviceBookingId?.isCompleted !== ('Upcoming' || 'In-Progress')) {
            return { status: 500, msg: 'Please check meeting status, can not find any upcoming or in-progress meeting in database' };
        }

        let s_time = booking[0] && booking[0].serviceBookingId && booking[0].serviceBookingId.duration && booking[0].serviceBookingId.duration.startTime ? booking[0].serviceBookingId.duration.startTime : 0.00;
        let e_time = booking[0] && booking[0].serviceBookingId && booking[0].serviceBookingId.duration && booking[0].serviceBookingId.duration.endTime ? booking[0].serviceBookingId.duration.endTime : 0.00;

        if (booking && booking[0] !== undefined && s_time && e_time) {
            let isInbetween = await compareTime({ s_time, e_time });

            if (isInbetween) {
                let videoRoom = await twilioVideoRoom({
                    uniqueName: booking[0].uniqueName,
                    participants: booking[0].totalParticipants,
                    type: booking[0].virtualServiceType
                });

                console.log('VideoRoom Creation : ', videoRoom);
                if (videoRoom && videoRoom.status == 'in-progress') {
                    // update virtual service detail model.
                    var virtualService = await VirtualServiceDetailModel.findById(booking[0]._id);
                    virtualService.webinar = {
                        roomId: videoRoom.sid,
                        expertId: "",
                        webKey: data.host_key ? data.host_key : "",
                        fileName: ""
                    };
                    await virtualService.save();
                    return videoRoom;
                }
                return videoRoom;
            }
            return { status: 500, msg: 'time is not matched with booking time please try at ' + dayjs(s_time).utc().format('MMMM DD YYYY, h:mm:ss a') + ' to ' + dayjs(e_time).utc().format('h:mm:ss a') + '.' }
        }
        return { status: 500, msg: "Password or uniqueName is wrong. - can't find record in database" };
    } catch (error) {
        console.log('error in create video room : ', error);
        return error;
    }
}

exports.twilioVideoRoomToken = async (data) => {
    try {
        let booking = await VirtualServiceDetailModel.find({
            uniqueName: data.uniqueName
        }).populate('serviceBookingId').exec();

        if (booking[0] && booking[0]?.serviceBookingId && booking[0]?.serviceBookingId?.isCompleted !== ('Upcoming' || 'In-Progress')) {
            return { status: 500, msg: 'Please check meeting status, can not find any upcoming or in-progress meeting in database' };
        }

        //creat token for twilio room
        let token = await twilio.createParticipantToken({ identity: data.identity, uniqueName: data.uniqueName });
        return token;
    } catch (error) {
        console.log('error in twilio video room token ', error);
        return error;
    }
}

exports.updateVideoRoomStatus = async (data, vendorId) => {
    try {

        // verify vendor and meeting room name.
        let booking = await VirtualServiceDetailModel.find({
            uniqueName: data.uniqueName
        }).populate({
            path: 'serviceBookingId',
            match: { serviceProviderId: vendorId }
        }).exec();

        if (booking && booking.length > 0 && booking[0].serviceBookingId && booking[0].serviceBookingId.serviceProviderId) {
            let videoRoomData = await twilio.updateTwilioRoom({ uniqueName: data.uniqueName, status: 'completed' });
            if (data.isComposition) await twilio.createRecordingComposition(data.roomSid);
            if (videoRoomData && videoRoomData.status == 'completed') {
                // update isCompleted to Completed
                let updatedServiceBooking = await serviceBookingModel.findOneAndUpdate({ _id: booking[0].serviceBookingId._id }, { $set: { isCompleted: 'Completed' } });
                console.log('update service booking', updatedServiceBooking);
                return videoRoomData;
            }
            return { status: videoRoomData.status, msg: videoRoomData.message };
        } else {
            // service booking not found for same uniqename or you do not have permission for this event.
            return { status: 404, msg: 'NoBookingFoundOrDontHavePermission' };
        }
    } catch (error) {
        console.log('error in twilio update status video room ', error);
        return error;
    }
}

exports.createComposition = async (data) => {
    try {

        // COMPOSE THE COMPLETE ROOM IN A GRID (WITH ALL PARTICIPANTS' AUDIO AND VIDEO)
        let composition = await twilio.createRecordingComposition(data.twilioRoomId);
        return composition;

    } catch (error) {
        console.log('TWILIO: error in twilio composition recording ', error);
        return error;
    }
}

exports.getAllRoomRecordings = async (data) => {
    try {
        let recordings = await twilio.getRoomRecordings(data.twilioRoomId);
        return recordings;
    } catch (error) {
        console.log('TWILIO: error in fetch all rooms recordings ', error);
        return error;
    }
}

exports.deleteRecordings = async (data) => {
    try {
        // Delete Recordings
        let deletedRecording = await twilio.deleteRecording(data.recordingId);
        return deletedRecording;
    } catch (error) {
        console.log('TWILIO: error in deleting recordings', error);
        return error;
    }
}

exports.deleteCompositions = async (data) => {
    try {
        // Delete compositions
        let deletedComposition = await twilio.deleteCompositions(data.compositionId);
        return deletedComposition;
    } catch (error) {
        console.log('TWILIO : error in deleting compositions', error);
        return error;
    }
}

exports.listCompletedCompositions = async () => {
    try {
        let completedCompositions = await twilio.completedCompositions();
        return completedCompositions;
    } catch (error) {
        console.log('TWILIO: error in list completed compositions ', error);
        return error;
    }
}

exports.listRoomsCompositions = async (data) => {
    try {
        let compositions = await twilio.roomCompositions(data.twilioRoomId);
        return compositions;
    } catch (error) {
        console.log('TWILIO: error in list rooms compostions ', error);
        return error;
    }
}

exports.getS3DownloadLink = async (key) => {
    try {
        var getParams = {
            Bucket: 'mymeeting-recordings',
            Key: key,
            Expires: 60 * 5
        }
        const url = await s3.getSignedUrl('getObject', getParams);
        return url;
    } catch (error) {
        console.log('TWILIO: error in s3 download link : ', error);
        return error;
    }
}

exports.sendCompositionNotification = async (roomSid, filename) => {
    try {
        // Fetch booking detail with booking user's FCM ID.
        let booking = await VirtualServiceDetailModel.findOne({
            "webinar.roomId": roomSid
        }).populate({
            path: 'serviceBookingId',
            model: 'serviceBooking',
            populate: {
                path: 'userId',
                model: 'users'
            }
        }).exec();

        // Updte fileName into DB.
        let updateBooking = await VirtualServiceDetailModel.updateOne({ "webinar.roomId": roomSid }, { $set: { "webinar.fileName": filename } });

        if (updateBooking && booking && booking.serviceBookingId && booking.serviceBookingId.userId && booking.serviceBookingId.userId.deviceId) {
            // send notification to booking user
            var notificationObject = {
                userId: booking.serviceBookingId.userId._id,
                deviceId: booking.serviceBookingId.userId.deviceId,
                title: "Webinar Recording Available For Download",
                body: "Your webinar recording is now available for download please download in your completed meeting section.",
            }
            let notification = await notificationService.sendNotificationToUser(notificationObject);
            console.log('notifiction on register : ', notification);
        }
        return;
    } catch (error) {
        console.log('TWILIO: error send composition notification', error);
        return;
    }
}