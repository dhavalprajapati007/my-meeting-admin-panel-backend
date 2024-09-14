const responseHelper = require("../helpers/responseHelper");
const vendorServiceModel = require("../models/vendorService.model");
const UserModel = require("../models/user.model");
const { storeCertificateImage } = require('../middleware/uploadImage');
const {
    SERVERERROR,
    UNAUTHORIZED,
    SUCCESS,
    FAILURE,
    ACTIVE_STATUS,
    JWT_AUTH_TOKEN_SECRET,
    JWT_EXPIRES_IN,
    APP_WEB_LINK,
    DELETED_STATUS,
} = require("../../config/key");
const vendorServiceValidation = require("../services/validations/vendorService/vendorService.validation");
const { getVendorByService, getById } = require("../services/vendorService/vendorService.service");
const vendorServiceTransformer = require("../transformers/vendorService/vendorServiceTransformer");

//create
exports.create = async (req, res) => {
    try {
        const user = req.user;
         // check role
        if(user.role == 2){
            storeCertificateImage(req, res, async (err, result) => {
                if(err) {
                    return responseHelper.error(res, res.__("" + err), FAILURE);
                }else {
                    let reqParam = req.body;
                    //check existing
                    var serviceExist = await vendorServiceModel.findOne({ userId: user._id, status: ACTIVE_STATUS });
                    if(serviceExist) {
                        // validate request
                        let validationMessage = await vendorServiceValidation.existingVendorServiceValidation(reqParam);
                        if(validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);

                        if(serviceExist.prefrence === 3 && serviceExist.fees.virtualGold !== 0 && serviceExist.fees.physicalSilver !== 0) return responseHelper.error(res, res.__("ServiceAlreadyExist"), FAILURE)
                        serviceExist.fees = {
                            virtualSilver: reqParam.virtualSilver && reqParam.virtualSilver !== undefined ? reqParam.virtualSilver : serviceExist?.fees?.virtualSilver,
                            virtualGold: reqParam.virtualGold && reqParam.virtualGold !== undefined ? reqParam.virtualGold : serviceExist?.fees?.virtualGold,
                            physicalSilver: reqParam.physicalSilver && reqParam.physicalSilver !== undefined ? reqParam.physicalSilver : serviceExist?.fees?.physicalSilver
                        };
                        serviceExist.prefrence = 3;
                        let updatedVendorService = await serviceExist.save();
                        return responseHelper.successapi(res, res.__("vendorServiceUpdated"), SUCCESS, updatedVendorService);
                    }else {
                        // validate create vendor service request
                        let validationMessage = await vendorServiceValidation.addVendorServiceValidation(reqParam);
                        if(validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);

                        // Arrange certificates image links
                        let images = [];
                        if(req.files && req.files.length > 0){
                            req.files.map(item => {
                                images.push(item.location);
                            })
                        }
                        //creating request object
                        let vendorServiceData = vendorServiceModel({
                            userId: user._id,
                            serviceId: reqParam.serviceId,
                            bio: reqParam.bio,
                            instruction: reqParam.instruction && reqParam.instruction !== undefined ? reqParam.instruction : "",
                            fees: {
                                virtualSilver: reqParam.virtualSilver && reqParam.virtualSilver !== undefined ? reqParam.virtualSilver : 0,
                                virtualGold: reqParam.virtualGold && reqParam.virtualGold !== undefined ? reqParam.virtualGold : 0,
                                physicalSilver: reqParam.physicalSilver && reqParam.physicalSilver !== undefined ? reqParam.physicalSilver : 0
                            },
                            prefrence: reqParam.prefrence,
                            certificates: req.files && images.length > 0 ? images : [],
                            languages: reqParam.languages,
                            available: false
                        });
                        //vendor service save
                        let savedVendorService = await vendorServiceData.save();
                        // update user registrationStep
                        // await UserModel.updateOne({ _id: user._id },{ $set: { "registrationStep": 2 } });
                        // send response sucess
                        return responseHelper.successapi(res, res.__("vendorServiceCreated"), SUCCESS, savedVendorService);
                    }
                }
            });
        }else{
            return responseHelper.successapi(res, res.__("UserRoleMustNeedsToBeVendor"), SUCCESS);
        }
    } catch (e) {
        console.log(e);
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
};

//edit
exports.edit = async (req, res) => {
    try {
        storeCertificateImage(req, res, async (err, result) => {
            if (err) {
                return responseHelper.error(res, res.__("" + err), FAILURE);
            } else {
                let reqParam = req.body;
                const user = req.user;
                console.log('file => ', req.files);
                // validate edit vendor service request
                let validationMessage = await vendorServiceValidation.updateVendorServiceValidation(reqParam);
                if(validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);

                //check existing
                var serviceExist = await vendorServiceModel.findOne({ userId: reqParam.id && reqParam.id != undefined ? reqParam.id : user._id, status: ACTIVE_STATUS });
                if(serviceExist){
                    // Arrange certificates image links
                    let images = [];
                    if(req.files && req.files.length > 0){
                        req.files.map(item => {
                            images.push(item.location);
                        })
                        if(serviceExist.certificates && serviceExist.certificates.length > 0){
                            images = serviceExist.certificates.concat(images);
                        }
                    }

                    serviceExist.serviceId = reqParam.serviceId ? reqParam.serviceId : serviceExist.serviceId;
                    serviceExist.bio =  reqParam.bio ? reqParam.bio : serviceExist.bio;
                    serviceExist.instruction =  reqParam.instruction ? reqParam.instruction : serviceExist.instruction;
                    serviceExist.fees.virtualSilver = reqParam.virtualSilver ? reqParam.virtualSilver : serviceExist.fees.virtualSilver;
                    serviceExist.fees.virtualGold = reqParam.virtualGold ? reqParam.virtualGold : serviceExist.fees.virtualGold;
                    serviceExist.fees.physicalSilver = reqParam.physicalSilver ? reqParam.physicalSilver : serviceExist.fees.physicalSilver;
                    serviceExist.prefrence = reqParam.prefrence ? reqParam.prefrence : serviceExist.prefrence;    
                    serviceExist.languages = reqParam.languages ? reqParam.languages : serviceExist.languages;
                    serviceExist.certificates =  req.files && images.length > 0 ? images : serviceExist.certificates,
                    serviceExist.available =  reqParam.available ? reqParam.available : serviceExist.available;

                    //vendor service save
                    let serviceData = await serviceExist.save();
                    return responseHelper.successapi(res, res.__("vendorServiceEdited"), SUCCESS, serviceData);
                }else{
                    return responseHelper.successapi(res, res.__("ErrorVendorServiceNotFound"), SUCCESS);
                }
            }
        });
    } catch (e) {
        console.log(e);
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
};


// remove certificate
exports.removeCertificate = async (req, res) => {
    try{
        // TODO: remove file from s3 bucket also.
        const user = req.user;
        let reqParam = req.body;

        // validate remove certificate response
        let validationMessage = await vendorServiceValidation.removeCertificateValidation(reqParam);
        if(validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);

        // find record
        let vendorService = await vendorServiceModel.findOne({ userId: reqParam.userId && reqParam.userId !== undefined ? reqParam.userId : user._id });
        var certificates = [];

        if(vendorService){
            if(vendorService.certificates && vendorService.certificates.length > 0){
                vendorService.certificates.map(image => {
                    if(image !== reqParam.certificate_link) certificates.push(image); 
                })
            }
            vendorService.certificates = certificates;
            await vendorService.save();

            return responseHelper.successapi(res, res.__("SuccessRemoveCertificate"), SUCCESS, vendorService);
        }else{
            return responseHelper.successapi(res, res.__("RecordNotFound"), SUCCESS);
        }

    }catch(error){
        console.log('error : ', error);
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}

//view
exports.view = async (req, res) => {
    try {
        const user = req.user;
        let reqParam = req.body;

        //find user's vendorService data
        var vendorServiceData = await getById({ userId: reqParam.userId && reqParam.userId ? reqParam.userId : user._id })

        console.log('vendorservice data',vendorServiceData);
        if(vendorServiceData && vendorServiceData.length > 0) return responseHelper.successapi(res, res.__("vendorServiceFound"), SUCCESS, vendorServiceData[0]);
        
        return responseHelper.successapi(res, res.__("NotFindRecord"), SUCCESS);
    } catch(e) {
        console.log(e);
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}

// get By ServiceId
exports.getByService = async (req, res) => {
    try{
        let reqParam = req.body;

        // validate 
        let validationMessage = await vendorServiceValidation.getVendorServiceValidation(reqParam);
        if(validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);

        // find All vendorServices By ServiceId
        let vendorServicesData = await getVendorByService({ serviceId: reqParam.serviceId, prefrence: reqParam.prefrence });
        //response data 
        let response = vendorServicesData && vendorServicesData.length > 0 ? vendorServicesData : [];
        

        //response data manipulation 
        if(response && response.length > 0 ){
            let responseData = vendorServiceTransformer.transformListCollection(response);
            if(responseData) return responseHelper.successapi(res, res.__("VendorServiceFound"), SUCCESS, responseData);
        }
        return responseHelper.successapi(res, res.__("NoFindRecord"), SUCCESS);
    } catch(e) {
        console.log(e);
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);   
    }
}

