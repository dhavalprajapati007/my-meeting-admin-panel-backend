var CronJob = require('cron').CronJob;
const ServiceBookingModel = require("../../models/serviceBooking.model");
var moment = require('moment');
var ObjectId = require("mongodb").ObjectID;

exports.verifyBookingStatus = async () => {

    // * */20 * * * * - every 20 min
    var job = new CronJob('*/20 * * * *', async () => {
        console.log('You will see this message every 20 min, Current Time : ',moment(new Date()).utc('Asia/Kolkata').format("YYYY-MM-DD HH:mm:ss"));

        let inProgress = await changeStatusInProgressBookings();
        let upcoming = await changeStatusUpcomingBookings();

        console.log('in-progress Meetings Status Changed : ', inProgress);
        console.log('upcoming Meetings Status Changed : ', upcoming);
        // TODO: Send Push Notifications/Email/SMS to Respected users.

    }, null, true, 'Asia/Kolkata');
    
    job.start();
    
    
    console.log('Server Time in UTC +5:30 : ', moment(new Date()).format("HH:mm"), 'Server Time in UTC +0 : ', moment(new Date()).utc(false).format("HH:mm"));
    console.log('Cron Job Started At : ', moment(new Date()).format("YYYY-MM-DD HH:mm:ss"));

    // console.log('local time now ', moment("2022-04-23T09:00:00.000+00:00").format("HH:mm"), moment("2022-04-23T14:30:00.000+00:00").utc(true).format("HH:mm"));
}

// change to completed ( if in-progress )
// change to unattended ( if upcoming )
// push notifications / reminder to user & vendor 15min before startTime. ( if upcoming ) 

const changeStatusInProgressBookings = async () => {
    try{
        console.log('date time lte : ', new Date(), moment(new Date()).format("YYYY-MM-DD HH:mm:ss") );

        // update query
        const updateRecords = await ServiceBookingModel.updateMany(
            {
                "isCompleted": "In-Progress",
                "duration.endTime": { $lte: new Date() }
            },{
                "$set": {
                    "isCompleted": "Completed"
                }
            }
        );

        return updateRecords;

    }catch(error){
        console.log('error in cronjob :: ', error);
        return error;
    }
}

const changeStatusUpcomingBookings = async () => {
    try{
        console.log('date time lte : ', new Date(), moment(new Date()).format("YYYY-MM-DD HH:mm:ss"));
        // update query
        const updateRecords = await ServiceBookingModel.updateMany(
            {
                "isCompleted": "Upcoming",
                "duration.endTime": { $lte: new Date() }
            },{
                "$set": {
                    "isCompleted": "Unattended"
                }
            }
        );
        console.log('update records ', updateRecords);
        return updateRecords;

    }catch(error){
        console.log('error in cronjob :: ', error);
        return error;
    }
}