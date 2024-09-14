const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_KEY, TWILIO_SECRET, TWILIO_LOG_LEVEL } = require("../../config/key");
const client = require('twilio')(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
client.logLevel = TWILIO_LOG_LEVEL;
var AccessToken = require("twilio").jwt.AccessToken;
var VideoGrant = AccessToken.VideoGrant;
 

// create a new room
exports.createTwilioRoom = async (data) => {
    try{

        // check for existing room
        try{
            var room = await client.video.rooms(data.uniqueName).fetch();
            if(room) return room;
        }catch(error){
            if(error.status == 404) console.log('room not exists');
        }

        // create twilio room
        return client.video.rooms.create({
            uniqueName: data.uniqueName,
            enableTurn: data.type == "group" ? true : false,
            statusCallback: process.env.TWILIO_STATUS_CALLBACK_URL,
            type: data.type, // "peer-to-peer", "group"
            maxParticipants: parseInt(data.maxParticipants),
        }).then(async (room) => {
            return room;
        }).catch(error => {
            return error;
        });
    }catch(error){
        console.log('error ', error);
        throw error;
    }
}

// retrive a room
exports.retriveTwilioRoom = async (data) => {
    try{
        // fetch room
        client.video.rooms(data.uniqueName).fetch().then(room => {
            return room;
        }).catch(error => {
            return error;
        });

    }catch(error){
        console.log(error);
        throw error;
    }
}

// update a room
exports.updateTwilioRoom = async (data) => {
    try{

        // update room
        return client.video.rooms(data.uniqueName).update({ status: data.status }).then(async (room) => {
            return room;
        }).catch(error => {
            return error;
        })

    }catch(error){
        console.log(error);
        throw error;
    }
}

// create Token
exports.createParticipantToken = async (data) => {
    try{
        // create access token
        var token = new AccessToken( TWILIO_ACCOUNT_SID, TWILIO_KEY, TWILIO_SECRET, { identity: data.identity } );
        // token.identity = data.identity;

        // add video grant into token
        var videoGrant = new VideoGrant({ room: data.uniqueName });

        // add room grant into token
        token.addGrant(videoGrant);

        // return token in JWT
        return token.toJwt();
    }catch(error){
        console.log(error);
        throw error;
    }
}

// create meeting recording composition
exports.createRecordingComposition = async (roomSid) => {
    try{
        // COMPOSE THE COMPLETE ROOM IN A GRID (WITH ALL PARTICIPANTS' AUDIO AND VIDEO)
        return client.video.v1.compositions.create({
            audioSources: ['*'],
            videoLayout: {
            grid: {
                video_sources: [
                '*'
                ]
            }
            },
            statusCallback: 'https://mymeeting.co.in:2022/api/v1/video-room/callback-composition',
            format: 'mp4',
            roomSid
        }).then(composition => {
            console.log('compostions id ::<>::',composition.sid)
            return composition;
        }).catch(error => {
            return error;
        });
        
        // TRANSCODE A VIDEO RECORDINGING
        // client.video.v1.compositions
        //                .create({
        //                   videoLayout: {
        //                     transcode: {
        //                       video_sources: 'RTXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
        //                     }
        //                   },
        //                   statusCallback: 'https://www.example.com/callbacks',
        //                   format: 'mp4',
        //                   roomSid: 'RMXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
        //                 })
        //                .then(composition => console.log(composition.sid));

        // COMPOSE ONE PARTICIPANT'S MEDIA
        // client.video.v1.compositions
        //                .create({
        //                   audioSources: ['PAXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'],
        //                   videoLayout: {
        //                     single: {
        //                       video_sources: [
        //                         'PAXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
        //                       ]
        //                     }
        //                   },
        //                   statusCallback: 'https://www.example.com/callbacks',
        //                   format: 'mp4',
        //                   roomSid: 'RMXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
        //                 })
        //                .then(composition => console.log(composition.sid));

    }catch(error){
        throw error;
    }
}

// get all room's recordings
exports.getRoomRecordings = async (roomSid) => {
    try{

        // get all recordings from  a given room using rooms api
        return client.video.v1.rooms(roomSid).recordings.list({ limit: 20 })
        .then(recordings => {
            return recordings;
            // recordings.forEach(r => console.log(r.sid))
        }).catch(error => {
            return error;
        });

    }catch(error){
        throw error;
    }
}

// Delete Recording
exports.deleteRecording = async (recordingId) => {
    try{
        // DELETE RECORDINGS
        return client.video.v1.recordings(recordingId).remove();
    }catch(error){
        throw error;
    }
}

// Delete Composition
exports.deleteComposition = async (compositionId) => {
    try{
        // DELETE COMPOSITIONS
        return client.video.v1.compositions(compositionId).remove();
    }catch(error){
        throw error;
    }
}

// List All Compositions
exports.completedCompositions = async () => {
    try{
        // List Compositions
        return client.video.v1.compositions.list({
            status: 'completed',
            limit: 20
        }).then(compositions => {
            return compositions;
            // compositions.forEach(c => console.log(c.sid))
        }).catch(error => {
            return error;
        })
    }catch(error){
        throw error;
    }
}

// List Compositions by RoomId
exports.roomCompositions = async (roomSid) => {
    try {
        return client.video.v1.compositions.list({
            roomSid: roomSid,
            limit: 20
        }).then(compositions => {
            return compositions;
            // compositions.forEach(c => console.log(c.sid))
        }).catch(error => {
            return error;
        });
    }catch(error){
        throw error;
    }
}