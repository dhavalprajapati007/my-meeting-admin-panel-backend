const responseHelper = require("../helpers/responseHelper");
const PhysicalPlaceParticipantModel = require("../models/physicalPlaceParticipant.model");
const UserModel = require("../models/user.model");
const physicalPlaceParticipantValidation = require("../services/validations/physicalPlaceParticipant/physicalPlaceParticipant.validation");
// const physicalPlaceParticipantDetailTransformer = require("../transformers/service/physicalPlaceParticipantDetailTransformer")
const {
	SERVERERROR,
	SUCCESS,
	FAILURE,
	ACTIVE_STATUS,
} = require("../../config/key");


exports.add = async (req, res) => {
    try{
        let reqParam = req.body;

        // validate add physicalPlaceParticipant
        let validationMessage = await physicalPlaceParticipantValidation.addPhysicalPlaceParticipant(reqParam);
        if(validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);

        // find userId
        if(reqParam.userId && reqParam.userId !== undefined){
            var findUser = await UserModel.findOne({_id : reqParam.userId}).select(['firstName','lastName','mobile']);
            if(findUser) reqParam.userName = findUser.firstName + " " + findUser.lastName; reqParam.contactNumber = findUser.mobile;
        }

        // create physicalPlaceParticipant object
        let physicalPlaceParticipant = new PhysicalPlaceParticipantModel({
            serviceBookingId: reqParam.serviceBookingId,
            isRegistered: reqParam.isRegistered,
            userId: reqParam.userId && reqParam.userId !== undefined ? reqParam.userId : null,
            addressCordinater: {
                type: "Point",
                coordinates : reqParam.addressCordinater && reqParam.addressCordinater.coordinates && reqParam.addressCordinater.coordinates.length > 0 ? reqParam.addressCordinater.coordinates : [],
            },
            userName : reqParam.userName && reqParam.userName !== undefined ? reqParam.userName : null,
            contactNumber : reqParam.contactNumber && reqParam.contactNumber !== undefined ? reqParam.contactNumber : null
        });

        // save physicalPlaceParticipant object
        let physicalPlaceParticipantData = await physicalPlaceParticipant.save();

        // send response
        return responseHelper.successapi(res, res.__("AddedParticipantIntoPhysicalPlaceBooking"), SUCCESS, physicalPlaceParticipantData);
    }catch(error){
        console.log('error : ', error);
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}

exports.addMultiple = async (req, res) => {
    try{
        let reqParam = req.body;
        
        // validate add physicalPlaceParticipant
        let validationMessage = await physicalPlaceParticipantValidation.addArrayPhysicalPlaceParticipant(reqParam);
        if(validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);

        let participants = reqParam.participants;
    
        let finalResponse = await participants.map(async (item) => {

            // find user
            if(item.userId && item.userId !== undefined){
                var findUser = await UserModel.findOne({_id : item.userId}).select(['firstName','lastName','mobile']);
                if(findUser) item.userName = findUser.firstName + " " + findUser.lastName; item.contactNumber = findUser.mobile;
            }

            let participant = new PhysicalPlaceParticipantModel({
                serviceBookingId: item.serviceBookingId,
                isRegistered: item.isRegistered,
                userId: item.userId && item.userId !== undefined ? item.userId : null,
                addressCordinater: {
                    type: "Point",
                    coordinates : item.addressCordinater && item.addressCordinater.coordinates && item.addressCordinater.coordinates.length > 0 ? item.addressCordinater.coordinates : [],
                },
                userName : item.userName && item.userName !== undefined ? item.userName : null,
                contactNumber : item.contactNumber && item.contactNumber !== undefined ? item.contactNumber : null
            });
            let participantData = await participant.save();
            return participantData;
        });
        
        Promise.all(finalResponse).then(data => {
            return responseHelper.successapi(res, res.__("SucessAddMultipleParticipants"), SUCCESS, data);
        }).catch(error => {
            console.log(error);
            return responseHelper.error(res, res.__("ErrotAddingParticipants"), FAILURE);
        });
    }catch(error){
        console.log('error', error);
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}

exports.update = async (req, res) => {
    try{
        let reqParam = req.body;

        // validate update physicalPlaceParticipant
        let validationMessage = await physicalPlaceParticipantValidation.updatePhysicalPlaceParticipant(reqParam);
        if(validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);

        // update phsyicalPlaceParticipant object
        let physicalPlaceParticipant = await PhysicalPlaceParticipantModel.findOneAndUpdate({ _id: reqParam.id}, reqParam);

        // sucess response
        if(physicalPlaceParticipant) return responseHelper.successapi(res, res.__("UpdatedPhysicalParticipant"), SUCCESS, physicalPlaceParticipant);

        // error response
        return responseHelper.error(res, res.__("ErrorUpdatingParticipantPlace"), FAILURE);
    }catch(error){
        console.log('error', error);
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}

exports.delete = async (req, res) => {
    try{
        let reqParam = req.query;

        // validate delete physicalPlaceParticipant
        let validationMessage = await physicalPlaceParticipantValidation.deletePhysicalPlaceParticipant(reqParam);
        if(validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);

        // delete physicalPlaceParticipant
        let deleteParticipant = await PhysicalPlaceParticipantModel.findByIdAndDelete(reqParam.id);

        if(deleteParticipant) return responseHelper.successapi(res, res.__("DeletedParticipantSuccess"), SUCCESS, deleteParticipant);
    }catch(error){
        console.log('error', error);
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}