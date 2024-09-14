const responseHelper = require("../helpers/responseHelper");
const AmenitieModel = require("../models/amenitie.model");
const amenitieValidation = require("../services/validations/amenitie/amenitie.validation");
const { storeAmenitieImage } = require('../middleware/uploadImage');

const {
	SERVERERROR,
	SUCCESS,
	FAILURE,
	ACTIVE_STATUS,
} = require("../../config/key");

// Add New Amenitie
exports.add = async (req, res) => {
    try{
        // Middleware for upload image from the reqest.
        storeAmenitieImage(req, res, async (error, result) => {
            if(error) return responseHelper.error(res, res.__("" + error), FAILURE);

            let reqParam = req.body;
            
            // Validate Add Amenities Request.
            let validationMessage = await amenitieValidation.addAmenitiesValidation(reqParam);
            if (validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);
            
            // Check for Same Name Validation.
            var nameExist = await AmenitieModel.findOne({ name: reqParam.name, status: ACTIVE_STATUS });
            if (nameExist) return responseHelper.successapi(res, res.__("amenitieNameExists"), SUCCESS);

            // Create AmenitieModel object.
            let serviceData = new AmenitieModel({
                name: reqParam.name,
                image: req.file && req.file !== undefined ? req.file.location : '',
                status: ACTIVE_STATUS
            });

            // Save Service
            const response = await serviceData.save();

            // Success Response
            return responseHelper.successapi(res, res.__("amenitieCreatedSuccessfully"), SUCCESS, response);

        });
    }catch(error){
        console.log('error : ', error);
        // Error Response
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}

// Get Amenites By Name
exports.get = async (req, res) => {
    try{
        let reqParam = req.query;
        
        // Validate Get Request param
        let validationMessage = await amenitieValidation.getAmenitiesValidation(reqParam);
        if(validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);
        
        const amenite = await AmenitieModel.findById(reqParam.id);
        
        // Response data
        return responseHelper.successapi(res, res.__("postListed"), SUCCESS, amenite);
        
    }catch(error){
        console.log('error : ', error);
        // Error Response
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}

// Update Amenities By id
exports.update = async (req, res) => {
    try{
        // Middleware for upload image from the reqest.
        storeAmenitieImage(req, res, async (error, result) => {
            if(error) return responseHelper.error(res, res.__("" + error), FAILURE);

            let reqParam = req.body;

            // Validate update amenities response
            let validationMessage = await amenitieValidation.updateAmenitiesValidation(reqParam);
            if(validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);

            // Add uploaded file link to request object
            if(req.file && req.file.location !== undefined) reqParam.image = req.file.location;
            
            // Update Amenities Record
            let updateAmenities = await AmenitieModel.findOneAndUpdate({ _id: reqParam.id }, reqParam);
            
            // Success Response
            if(updateAmenities) return responseHelper.successapi(res, res.__("SuccessAmeniteUpdate"), SUCCESS, updateAmenities);
            
            // Error Response
            return responseHelper.error(res, res.__("errorUpdatingAmeniteRecord"), FAILURE);
        });
    }catch(error){
        console.log('error : ', error);
        // Error Response
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}

// Delete amenities By ID
exports.delete = async (req, res) => {
    try{
        let reqParam = req.query;

        // Validate delete amenites response
        let validationMessage = await amenitieValidation.deleteAmenitiesValidation(reqParam);
        if(validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);


        // Delete Amenitie
        let deleteAmenitie = await AmenitieModel.findByIdAndDelete(reqParam.id);

        // Success Response
        if(deleteAmenitie) return responseHelper.successapi(res, res.__("SucessDeletedAmenitie"), SUCCESS, deleteAmenitie);

        // Error Response
        return responseHelper.error(res, res.__("errorDeleteAmeniteRecords"), FAILURE);
    }catch(error){
        console.log('error : ', error);
        // Error Response
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}

// Get All Amenities with its childs.
exports.getAll = async (req, res) => {
    try{
        const amenities = await AmenitieModel.find();

        let response = amenities && amenities.length> 0 ? amenities : [];
        return responseHelper.successapi(res, res.__("GetAllAmenitiesSuccess"), SUCCESS, response)
    }catch(error){
        console.log('error : ', error);
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}