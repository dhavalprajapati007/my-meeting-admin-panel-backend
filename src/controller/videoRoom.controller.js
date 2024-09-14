const responseHelper = require("../helpers/responseHelper");
const videoRoomValidation = require("../services/validations/videoRoom/videoRoom.validation");
const {
    createVideoRoom,
    twilioVideoRoomToken,
    updateVideoRoomStatus,
    createComposition,
    getS3DownloadLink,
    listCompletedCompositions,
    deleteRecordings,
    deleteCompositions,
    sendCompositionNotification
} = require("../services/videoRoom/videoRoom.service");

// const videoRoomTransformer = require("../transformers/videoRoom/videoRoomTransformer");
const {
    SERVERERROR,
    SUCCESS,
    FAILURE,
} = require("../../config/key");



exports.create = async (req, res) => {
    try{
        const user = req.user;
        var reqParam = req.body;

        // validate create Video Room request
        let validationMessage = await videoRoomValidation.createVideoRoomValidation(reqParam);
        if(validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);

        let twilioRoom = await createVideoRoom(reqParam);

        if(twilioRoom && twilioRoom.status == 'in-progress'){
            return responseHelper.successapi(res, res.__("SuccessCreateRoom"), SUCCESS, twilioRoom);
        }else{
            if(twilioRoom && twilioRoom.status == 500) return responseHelper.error(res, res.__(twilioRoom.msg), FAILURE);
            return responseHelper.error(res, res.__("ErrorCreateRoomTwilio"), FAILURE);
        }
        // return room object with access token

    }catch(error){
        console.log('error : ', error);
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}

exports.createToken = async (req, res) => {
    try{
        const user = req.user;
        var reqParam = req.body;
        
        // validate create Video Room request
        let validationMessage = await videoRoomValidation.createVideoRoomTokenValidation(reqParam);
        if(validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);


        let token = await twilioVideoRoomToken(reqParam);
        console.log('token : ', token);
        if(token.status === 500) return responseHelper.successapi(res, res.__(token.msg), SUCCESS);
        if(token){
            return responseHelper.successapi(res, res.__("SuccessCreateRoomToken"), SUCCESS, token);
        }else{
            return responseHelper.error(res, res.__("ErrorCreateRoomTwilio"), FAILURE);
        }
    }catch(error){
        console.log('error : ', error);
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}

exports.completeVideoRoom = async (req, res) => {
    try{
        const user = req.user;
        var reqParam = req.body;

        // validate complete video room request
        let validationMessage = await videoRoomValidation.completeVideoRoomValidation(reqParam);
        if(validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);

        // update video room
        let videoRoomData = await updateVideoRoomStatus(reqParam,user._id);

        if(videoRoomData && videoRoomData.status == 'completed') return responseHelper.successapi(res, res.__("SuccessCompleteVideoRoom"), SUCCESS, videoRoomData);

        if(videoRoomData && videoRoomData.msg != undefined) return responseHelper.error(res, res.__(videoRoomData.msg), FAILURE);
        
        return responseHelper.error(res, res.__("ErrorUpdatingVideoRoomTwilio"), FAILURE);
    }catch(error){
        console.log('error : ', error);
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}

exports.createRecordingComposition = async (req, res) => {
    try{
        var reqParam = req.body;

        // validate createRecording request

        // create Composition
        let composition = await createComposition({ twilioRoomId: reqParam.roomId });

        console.log('compostion : ', composition);
        if(composition) return responseHelper.successapi(res, res.__("SuccessComposition"), SUCCESS, composition);

        return responseHelper.error(res, res.__("ErrorCreatingComposition"), FAILURE);
    }catch(error){
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}

exports.getDownloadLink = async (req, res) => {
    try{
        var reqParam = req.query;

        let link = await getS3DownloadLink(reqParam.filename);
        
        return responseHelper.successapi(res, res.__("SuccessLink"), SUCCESS, link);
    }catch(error){
        console.log('error :: ', error);
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}

exports.getAllCompletedCompositions = async (req, res) => {
    try{
        let compositionsList = await listCompletedCompositions();

        return responseHelper.successapi(res, res.__("SuccessCompositions"), SUCCESS, compositionsList);
    }catch(error){
        console.log('error : ', error);
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}

exports.deleteRecordings = async (req, res) => {
    try{
        var reqParam = req.query;

        const deletedRecording = await deleteRecordings({ recordingId: reqParam.recordingId });

        return responseHelper.successapi(res, res.__("SuccessDeleteRecordings"), SUCCESS, deletedRecording);

    }catch(error){
        console.log('error : ', error);
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}

exports.deleteCompositions = async (req, res) => {
    try{
        var reqParam = req.query;

        const deletedComposition = await deleteCompositions({ compositionId : reqParam.compositionId });

        return responseHelper.successapi(res, res.__("SuccessDeletedCompositions"), SUCCESS, deletedComposition);
    }catch(error){
        console.log('error : ', error);
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}

exports.callbackComposition = async (req, res) => {
    try{
        console.log('CALLBACK: Composition Starting : ', req.body);
        var reqParam = req.body;
        if(reqParam && reqParam.StatusCallbackEvent == 'composition-available' && reqParam.RoomSid && reqParam.CompositionSid){
            console.log('Status : ', reqParam.StatusCallbackEvent);
            console.log('Composition ID : ', reqParam.CompositionSid);
            console.log('Media External Location : ', reqParam.MediaExternalLocation);
            console.log('Room SID :', reqParam.RoomSid);
            // Send Notification to booking user.
            await sendCompositionNotification(reqParam.RoomSid, reqParam.CompositionSid + ".mp4");
            return;
            // return responseHelper.successapi(res, res.__(""), SUCCESS, notification);
        }
        return;
    }catch(error){
        console.log('error : ', error);
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}