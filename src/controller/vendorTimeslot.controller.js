const responseHelper = require("../helpers/responseHelper");
const VendorTimeslotModel = require("../models/vendorTimeslot.model");
const UserModel = require("../models/user.model");
const vendorTimeslotValidation = require("../services/validations/vendorTimeslot/vendorTimeslot.validation");
const { createAvailableSlot }= require("../services/vendorTimeslot/vendorTimeslot.service");

const {
	SERVERERROR,
	SUCCESS,
	FAILURE,
	ACTIVE_STATUS,
} = require("../../config/key");

// Add New Timeslot to Vendor
exports.add = async (req, res) => {
    try{
        const user = req.user;
        let reqParam = req.body;

        // validate add timeslot request
        let validationMessage = await vendorTimeslotValidation.addVendorTimeslotValidation(reqParam);
        if(validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);

        // create timeslot object
        let timeslots = new VendorTimeslotModel({
            userId: reqParam.userId && reqParam.userId !== undefined ? reqParam.userId : user._id,
            sessionTime: reqParam.sessionTime,
            interval : reqParam.interval,
            availableSlots: reqParam.availableSlots,
            status: ACTIVE_STATUS
        });

        // save timeslot object
        let savedTimeslots = await timeslots.save();

        // update user registrationStep
        await UserModel.updateOne({ _id: user._id },{ $set: { "registrationStep": 3 } });

        // 
        return responseHelper.successapi(res, res.__("SucessAddingTimeslot"), SUCCESS, savedTimeslots)

    }catch(error){
        console.log('error ', error);
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}

// Edit Timeslots to vendor
exports.update = async (req, res) => {
    try{
        let reqParam = req.body;

        // validate edit timeslots response
        let validationMessage = await vendorTimeslotValidation.updateVendorTimeslotValidation(reqParam);
        if(validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);

        let timeslot = await VendorTimeslotModel.findOneAndUpdate({_id: reqParam.id}, reqParam);

        if(timeslot) return responseHelper.successapi(res, res.__("SuccessUpdatingTimeslot"), SUCCESS, timeslot);

        return responseHelper.error(res, res.__("ErrorUpdatingTimeslot"), FAILURE);
    }catch(error){
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}

// Delete Timeslots to vendor
exports.delete = async (req, res) => {
    try{
        let reqParam = req.query;

        // validate delete timeslots response
        let validationMessage = await vendorTimeslotValidation.deleteVendorTimeslotValidation(reqParam);
        if(validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);

        let timeslot = await VendorTimeslotModel.findByIdAndDelete(reqParam.id);

        if(timeslot) return responseHelper.successapi(res,res.__("SucessDeleteTimeslot"), SUCCESS, timeslot);

        return responseHelper.error(res, res.__("ErrorDeletingTimeslot"), FAILURE);
    }catch(error){
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}

// Get By User
exports.get = async (req, res) => {
    try{
        const user = req.user;
        let reqParam = req.body;

        // validate get by user timeslots list
        let validationMessage = await vendorTimeslotValidation.getVendorTimeslotValidation(reqParam);
        if(validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);

        let timeslots = await VendorTimeslotModel.findOne({ userId: reqParam.userId && reqParam.userId !== undefined ? reqParam.userId : user._id });

        if(timeslots) return responseHelper.successapi(res, res.__("SucessGetTimeslotByUser"), SUCCESS, timeslots);

        return responseHelper.error(res, res.__("ErrorGetTimeslotByUser"), FAILURE);
    }catch(error){
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}

exports.createAvailableSlot = async (req, res) => {
    try{
        const user = req.user;
        let reqParam = req.body;

        // validate create availabe slot object request
        let validationMessage = await vendorTimeslotValidation.createAvailableSlotValidation(reqParam);
        if(validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);

        // create an timeslots for the whole week
        let slotsData = await createAvailableSlot({ interval: reqParam.interval, sessionTime: reqParam.sessionTime });

        if(slotsData && slotsData.length == 7) return responseHelper.successapi(res, res.__("SuccessCreateAvailableSlot"), SUCCESS, slotsData);

        return responseHelper.error(res, res.__("ErrorCreatingAvailableSlots"), FAILURE);
    }catch(error){
        console.log('error -> create available slots', error);
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}