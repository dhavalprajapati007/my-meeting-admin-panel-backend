var moment = require('moment');

exports.createAvailableSlot = async (data) => {
    try{
        // Count Total Box
        // 1440 24-hour
        let perDaySessions = parseInt((1440 / (parseInt(data.sessionTime) + parseInt(data.interval))).toFixed());

        // create week array
        let weekArray = Array.from(Array(7).keys());
        let weekSlots = weekArray.map(async (i) => {
            return await getSlotByDay(perDaySessions, data.sessionTime, data.interval);
        })
        return Promise.all(weekSlots).then((result) => {
            return result;
        })
    }catch(error){
        return error;
    }
}

var getSlotByDay = async (perDaySessions,session,timeout) => {
    let s_time, e_time;
    let daySlots = Array.from(Array(perDaySessions).keys());
    let promises = daySlots.map(function (item) {
        if (item == 0) {
            s_time = moment("00:00", "HH:mm").format();
            e_time = moment(s_time).add(session, "minutes").format();
        } else {
            s_time = moment(e_time).add(timeout, "minutes").format();
            e_time = moment(s_time).add(session, "minutes").format();
        }
        return {
            s_time: moment(s_time).format("HH:mm"),
            e_time: moment(e_time).format("HH:mm"),
            status: true
        }
    });
    return Promise.all(promises).then(function (result) {
        return result;
    });
}