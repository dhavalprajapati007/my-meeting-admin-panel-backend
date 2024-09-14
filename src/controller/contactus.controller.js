const responseHelper = require("../helpers/responseHelper");
const ContactusModel = require("../models/contactus.model");
const contactusValidation = require("../services/validations/contactus/contactus.validation");
const { listContactus } = require("../services/contactus/contactus.service");
const helper = require("../helpers/helper");
const {
	SERVERERROR,
	SUCCESS,
	FAILURE,
	ACTIVE_STATUS,
} = require("../../config/key");

// Add New Contactus
exports.add = async (req, res) => {
    try{
            const user = req.user;
            let reqParam = req.body;

            // Validate Add Contactus Request.
            let validationMessage = await contactusValidation.addContactusValidation(reqParam);
            if (validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);

            // Create ContactusModel object.
            let contactusData = new ContactusModel({
                userId: reqParam.userId && reqParam.userId !== undefined ? reqParam.userId : user._id,
                subject: reqParam.subject,
                message: reqParam.message,
                status: ACTIVE_STATUS
            });

            // Save Contactus
            const response = await contactusData.save();

            // Success Response
            return responseHelper.successapi(res, res.__("contactusCreatedSuccessfully"), SUCCESS, response);
    }catch(error){
        // Error Response
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}

// Get Contactus Requests
exports.get = async (req, res) => {
    try{
        const user = req.user;
        let reqParam = req.body;
        
        // Validate Get Request param
        let validationMessage = await contactusValidation.getContactusValidation(reqParam);
        if(validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);

        const { limitCount, skipCount } = helper.getPageAndLimit(reqParam.page, reqParam.limit);

        const contactus = await listContactus({
            userId: reqParam.userId && reqParam.userId !== undefined ? reqParam.userId : user._id,
            skip: skipCount,
            limit: limitCount
        });
        
        let response = contactus && contactus.length > 0 ? contactus[0].data : [];

        let extras = {
            totalCount : contactus && contactus.length > 0 && contactus[0].totalRecords[0] ? contactus[0].totalRecords[0].count : 0
        }

        // Response data
        return responseHelper.successapi(res, res.__("GetallUsersContactMessages"), SUCCESS, response, extras);
        
    }catch(error){
        console.log('error : ', error);
        // Error Response
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}

// Update Amenities By id
exports.update = async (req, res) => {
    try{
            let reqParam = req.body;

            // Validate update Contactus response
            let validationMessage = await contactusValidation.updateContactusValidation(reqParam);
            if(validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);
            
            // Update Contactus Record
            let updateContactus = await ContactusModel.findOneAndUpdate({ _id: reqParam.id }, reqParam);
            
            // Success Response
            if(updateContactus) return responseHelper.successapi(res, res.__("SuccessContactusUpdate"), SUCCESS, updateContactus);
            
            // Error Response
            return responseHelper.error(res, res.__("errorUpdatingContactusRecord"), FAILURE);
    }catch(error){
        console.log('error : ', error);
        // Error Response
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}

// Delete contactus
exports.delete = async (req, res) => {
    try{
        let reqParam = req.query;

        // Validate delete contactus response
        let validationMessage = await contactusValidation.deleteContactusValidation(reqParam);
        if(validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);


        // Delete Contactus
        let deleteContactus = await ContactusModel.findByIdAndDelete(reqParam.id);

        // Success Response
        if(deleteContactus) return responseHelper.successapi(res, res.__("SucessDeletedContactus"), SUCCESS, deleteContactus);

        // Error Response
        return responseHelper.error(res, res.__("errorDeleteContactusRecords"), FAILURE);
    }catch(error){
        console.log('error : ', error);
        // Error Response
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}

// Get All Contactus with its childs.
exports.getAll = async (req, res) => {
    try{
        const contactus = await ContactusModel.find();

        let response = contactus && contactus.length> 0 ? contactus : [];

        return responseHelper.successapi(res, res.__("GetAllContactusSuccess"), SUCCESS, response)
    }catch(error){
        console.log('error : ', error);
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}