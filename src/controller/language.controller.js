const responseHelper = require("../helpers/responseHelper");
const LanguageModel = require("../models/language.model");
const languageValidation = require("../services/validations/language/language.validation");
const {
	SERVERERROR,
	SUCCESS,
	FAILURE,
	ACTIVE_STATUS,
} = require("../../config/key");

// Add New Language
exports.add = async (req, res) => {
    try{

            let reqParam = req.body;

            // Validate Add Language Request.
            let validationMessage = await languageValidation.addLanguagesValidation(reqParam);
            if (validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);
            
            // Check for Same Name Validation.
            var nameExist = await LanguageModel.findOne({ name: reqParam.name, status: ACTIVE_STATUS });
            if (nameExist) return responseHelper.successapi(res, res.__("languageNameExists"), SUCCESS);

            // Create LanguageModel object.
            let languageData = new LanguageModel({
                name: reqParam.name,
                status: ACTIVE_STATUS
            });

            // Save Language
            const response = await languageData.save();

            // Success Response
            return responseHelper.successapi(res, res.__("languageCreatedSuccessfully"), SUCCESS, response);
    }catch(error){
        // Error Response
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}

// Update Language By id
exports.update = async (req, res) => {
    try{
            let reqParam = req.body;

            // Validate update language response
            let validationMessage = await languageValidation.updateLanguagesValidation(reqParam);
            if(validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);

            
            // Update Language Record
            let updateLanguage = await LanguageModel.findOneAndUpdate({ _id: reqParam.id }, reqParam);
            
            // Success Response
            if(updateLanguage) return responseHelper.successapi(res, res.__("SuccessLanguageUpdate"), SUCCESS, updateLanguage);
            
            // Error Response
            return responseHelper.error(res, res.__("errorUpdatingLanguageRecord"), FAILURE);
    }catch(error){
        console.log('error : ', error);
        // Error Response
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}

// Delete Language By Id
exports.delete = async (req, res) => {
    try{
        let reqParam = req.query;

        // Validate delete language response
        let validationMessage = await languageValidation.deleteLanguagesValidation(reqParam);
        if(validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);


        // Delete Language
        let deleteLanguage = await LanguageModel.findByIdAndDelete(reqParam.id);

        // Success Response
        if(deleteLanguage) return responseHelper.successapi(res, res.__("SucessDeletedLanguage"), SUCCESS, deleteLanguage);

        // Error Response
        return responseHelper.error(res, res.__("errorDeleteLanguageRecords"), FAILURE);
    }catch(error){
        console.log('error : ', error);
        // Error Response
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}

// Get All Languages
exports.getAll = async (req, res) => {
    try{
        const languages = await LanguageModel.find();

        let response = languages && languages.length> 0 ? languages : [];
        return responseHelper.successapi(res, res.__("GetAllLanguageSuccess"), SUCCESS, response)
    }catch(error){
        console.log('error : ', error);
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}