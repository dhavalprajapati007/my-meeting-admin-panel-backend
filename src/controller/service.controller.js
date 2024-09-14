const responseHelper = require("../helpers/responseHelper");
const ServiceModel = require("../models/service.model");
const serviceValidation = require("../services/validations/service/service.validation");
const serviceDetailTransformer = require("../transformers/service/serviceDetailTransformer")
const { storeSingleImage } = require('../middleware/uploadImage');
const { getService, getServices } = require("../services/service/service.service");
const {
	SERVERERROR,
	SUCCESS,
	FAILURE,
	ACTIVE_STATUS,
} = require("../../config/key");
const vendorServiceModel = require("../models/vendorService.model");
var ObjectId = require("mongodb").ObjectID;

// Add New Service
exports.add = async (req, res) => {
    try{
        // Middleware for upload image from the reqest.
        storeSingleImage(req, res, async (error, result) => {
            if(error) return responseHelper.error(res, res.__("" + error), FAILURE);

            let reqParam = req.body;

            // Validate Add Service Request.
            let validationMessage = await serviceValidation.addServiceValidation(reqParam);
            if (validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);
            
            // Check for Same Name Validation.
            var nameExist = await ServiceModel.findOne({ name: reqParam.name, status: ACTIVE_STATUS });
            if (nameExist) return responseHelper.successapi(res, res.__("serviceNameExists"), SUCCESS);

            // Create ServiceModel object.
            let serviceData = new ServiceModel({
                name: reqParam.name,
                description: reqParam.description,
                parent: reqParam.parentId && reqParam.parentId !== '' ? reqParam.parentId : null,
                image: req.file && req.file !== undefined ? req.file.location : '',
                status: ACTIVE_STATUS
            });

            // Save Service
            const response = await serviceData.save();

            // Success Response
            return responseHelper.successapi(res, res.__("serviceCreatedSuccessfully"), SUCCESS, response);

        });
    }catch(error){
        // Error Response
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}

// Get Service By Name
// (with child & parent)
exports.get = async (req, res) => {
    try{
        let reqParam = req.query;

        // Validate Get Request param
        let validationMessage = await serviceValidation.getServiceValidation(reqParam);
        if(validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);
        
        const serviceList = await getService({
            id : reqParam.id
        });
        
        //response data 
        let response = serviceList && serviceList.length > 0 ? serviceList[0] : [];
        return responseHelper.successapi(res, res.__("postListed"), SUCCESS, response);
        
    }catch(error){
        console.log('error : ', error);
        // Error Response
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}

// Update Service By id
exports.update = async (req, res) => {
    try{
        // Middleware for upload image from the reqest.
        storeSingleImage(req, res, async (error, result) => {
            if(error) return responseHelper.error(res, res.__("" + error), FAILURE);

            let reqParam = req.body;

            // Validate update service response
            let validationMessage = await serviceValidation.updateServiceValidation(reqParam);
            if(validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);

            // Add uploaded file link to request object
            if(req.file && req.file.location !== undefined) reqParam.image = req.file.location;
            
            // Update Service Record
            let updateService = await ServiceModel.findOneAndUpdate({ _id: reqParam.id }, reqParam);
            
            // Success Response
            if(updateService) return responseHelper.successapi(res, res.__("SuccessServiceUpdate"), SUCCESS, updateService);
            
            // Error Response
            return responseHelper.error(res, res.__("errorUpdatingServiceRecord"), FAILURE);
        });
    }catch(error){
        console.log('error : ', error);
        // Error Response
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}

// Delete Service By id
exports.delete = async (req, res) => {
    try{
        let reqParam = req.query;
        const user = req.user;
        console.log(user,"user");
        
        if(user.role == 1 || user.role == 2 || user.role == 3) return responseHelper.error(res, res.__("UserRoleNotValid"), FAILURE);

        // Validate delete service response
        let validationMessage = await serviceValidation.deleteServiceValidation(reqParam);
        if(validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);

        // Check For Existing Service
        let service = await ServiceModel.findById(reqParam.id);
        if(!service) return responseHelper.error(res, res.__("serviceNotFound"), FAILURE, {});

        // Check For Existing Childs
        let serviceChilds = await ServiceModel.find({ parent: reqParam.id });
        if(serviceChilds.length > 0) return responseHelper.error(res, res.__("errorDeleteChildsExist"), FAILURE, serviceChilds);

        // Check Existing vendor with this Service
        let serviceProvider = await vendorServiceModel.find({ serviceId : ObjectId(reqParam.id)});
        if(serviceProvider?.length) return responseHelper.error(res, res.__("serviceProviderExist"), FAILURE, serviceProvider);

        // Delete Service
        let deleteService = await ServiceModel.findByIdAndDelete(reqParam.id);

        // Success Response
        if(deleteService) return responseHelper.successapi(res, res.__("SucessDeletedService"), SUCCESS, deleteService);

        // Error Response
        return responseHelper.error(res, res.__("errorDeleteServiceRecords"), FAILURE);
    }catch(error){
        console.log('error : ', error);
        // Error Response
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}

// Get All Services with its childs.
exports.getAll = async (req, res) => {
    try{
        const services = await getServices();

        let response = services && services.length> 0 ? services : [];
        return responseHelper.successapi(res, res.__("GetAllServiceSuccess"), SUCCESS, response)
    }catch(error){
        console.log('error : ', error);
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}