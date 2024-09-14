const responseHelper = require("../helpers/responseHelper");
const OfficeModel = require("../models/office.model");
const OfficeCabinModel = require("../models/officeCabin.model");
const officeValidation = require("../services/validations/office/office.validation");
const officeCabinValidation = require("../services/validations/officeCabin/officeCabin.validation");
const officeDetailTransformer = require("../transformers/office/officeDetailTransformer")
const { storeCabinImages } = require('../middleware/uploadImage');
const { getOfficesByGeoLocations,getOfficeDetails,getOfficesByVendor,getOfficesAll, getOfficeLocations } = require("../services/office/office.service");
const officeTransformer = require("../transformers/office/officeDetailTransformer");
const helper = require("../helpers/helper");
const {
	SERVERERROR,
	SUCCESS,
	FAILURE,
	ACTIVE_STATUS,
} = require("../../config/key");
const serviceBookingModel = require("../models/serviceBooking.model");
var ObjectId = require("mongodb").ObjectID;

// Add New Office
exports.add = async (req, res) => {
    try{
        let reqParam = req.body;

        // Validate Add Office Request.
        let validationMessage = await officeValidation.addOfficeValidation(reqParam);
        if (validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);

        // create office object
        let officeData = new OfficeModel({
            userId: reqParam.userId,
            name: reqParam.name,
            address: reqParam.address,
            addressCordinater: {
                type: 'Point',
                coordinates: [reqParam.addressCordinater.lang, reqParam.addressCordinater.lat]
            },
            representativeDetails: reqParam.representativeDetails,
            officeType: reqParam.officeType,
            isKycCompleted: false,
            officeContactNumber: reqParam.officeContactNumber,
            workingDays: reqParam.workingDays,
            status: ACTIVE_STATUS
        });

        // save office
        let office = await officeData.save();

        // sucess response
        return responseHelper.successapi(res, res.__("OfficeAdded"),SUCCESS, office);
    }catch(error){
        console.log('error : ', error);
        return responseHelper.error(res,res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}

// get all offices - admin
exports.getAll = async (req, res) => {
    try{
        const user = req.user;
        let reqParam = req.body;

        
        if(user.role == 2 || user.role == 1) return responseHelper.error(res, res.__("UserMustBeAdmin"), FAILURE);

        // Validate Get All
        let validationMessage = await officeValidation.getOfficesValidation(reqParam);
        if(validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);

        // pagination
        const { limitCount, skipCount } = helper.getPageAndLimit(reqParam.page, reqParam.limit);

        let offices = await getOfficesAll({
            skip : skipCount,
            limit : limitCount,
            verified: reqParam.verified !== undefined ? reqParam.verified : true
        });
        console.log('response ', offices.data, offices[0].data)

         //response data 
        let response = offices && offices.length > 0 ? offices[0].data : [];

        //response data manipulation 
        let responseData = response && response.length > 0 ? officeDetailTransformer.transformOffiecDetails(response) : [];

        let extras = {
            totalCount: offices && offices.length > 0 && offices[0].totalRecords[0] ? offices[0].totalRecords[0].count : 0
        }

        return responseHelper.successapi(res, res.__("AllOfficeFetched"), SUCCESS, responseData, extras );
    }catch(error){
        console.log('error : ', error);
        return responseHelper.error(res,res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}


// get office by user id
exports.getByUserId = async (req, res) => {
    try{
        let reqParam = req.query;

        // Validate Get Office Request
        let validationMessage = await officeValidation.getOfficeByIdOfficeValidation(reqParam);
        if(validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);

        let offices = await getOfficesByVendor({ userId: reqParam.userId });

        // preprare response
        let response = officeDetailTransformer.transformOffiecDetails(offices);
        
        // Success Response
        return responseHelper.successapi(res, res.__("OfficeFetched"), SUCCESS, response && response.length > 0 ? response : [] );
    }catch(error){
        console.log('error : ', error);
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}

// Update Office
exports.update = async (req, res) => {
    try{
        let reqParam = req.body;

        // Validate Update Office Request
        let validationMessage = await officeValidation.updateOfficeValidation(reqParam);
        if(validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);

        if(reqParam.addressCordinater && reqParam.addressCordinater !== undefined && reqParam.addressCordinater.lat && reqParam.addressCordinater.lang){
            reqParam.addressCordinater = {
                type: 'Point',
                cordinates: [reqParam.addressCordinater.lang, reqParam.addressCordinater.lat]  
            }
        }

        // Udpate Office
        let updateOffice = await OfficeModel.findOneAndUpdate({ _id: reqParam.id }, reqParam); 
        
        // Preprare Response
        let response = officeDetailTransformer.transformOfficeDetail(updateOffice);

        // Success Response
        return responseHelper.successapi(res, res.__("OfficeUpdatedSuccess"), SUCCESS, response);
    }catch(error){
        console.log('error : ', error);
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}

// Delete Office
exports.delete = async (req, res) => {
    try{
        let reqParam = req.query;
        
        // Validate Delete Office Request
        let validationMessage = await officeValidation.deleteOfficeValidation(reqParam);
        if(validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);

        // Check for existing office
        let office = await OfficeModel.findById(reqParam.id);
        if(!office) return responseHelper.error(res, res.__("officeNotFound"), FAILURE, {});

        // Fetch Upcoming Events at this office
        let upcomingEvents = await serviceBookingModel.find({ "placeBookingDetails.officeId" : ObjectId(reqParam.id), "isCompleted" : "Upcoming" });
        if(upcomingEvents.length > 0) return responseHelper.error(res, res.__("UpcomingEventAvailableAtThisOffice"), FAILURE);

        // Delete Office
        let deleteOffice = await OfficeModel.findByIdAndDelete(reqParam.id);
        // Preprare Response
        if(deleteOffice) return responseHelper.successapi(res, res.__("OfficeDeleteSuccess"), SUCCESS, deleteOffice);

        // Error Response
        return responseHelper.error(res, res.__("errorOfficeDelete"), FAILURE);
    }catch(error){
        console.log('error : ', error);
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}

// Get Single Office
exports.getOfficeDetails = async (req, res) => {
    try{
        let reqParam = req.query;

        // Validate Get Office Request
        let validationMessage = await officeValidation.getOfficeValidation(reqParam);
        if(validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);

        // Find Office
        let office = await getOfficeDetails({ id: reqParam.id });

        // Prepare Response
        if(!office) return responseHelper.error(res, res.__("NotFound"), FAILURE);

        let response = officeDetailTransformer.transformOfficeDetail(office);
        return responseHelper.successapi(res, res.__("OfficeGetSuccess"), SUCCESS, response)
    }catch(error){
        console.log('error : ', error);
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}

// Office Cabin

// Add New Office Cabin
exports.addCabin = async (req, res) => {
    try{
        storeCabinImages(req, res, async (error, result) => {
            if(error) return responseHelper.error(res, res.__("" + error), FAILURE);

            let reqParam = req.body;

            // Validation Add Office Cabin Request
            let validationMessage = await officeCabinValidation.addOfficeCabinValidation(reqParam);
            if(validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);

            // Arrange image links
            let images = [];
            if(req.files && req.files.length > 0){
                req.files.map(item => {
                    images.push(item.location);
                })
            }

            // Create Cabin Office Object
            let officeCabinData = new OfficeCabinModel({
                officeId: reqParam.officeId,
                price: reqParam.price,
                capacity: reqParam.capacity,
                prefrences: reqParam.prefrences,
                isAvailable: reqParam.isAvailable,
                amenitieIds: reqParam.amenitieIds,
                images: images,
                status: ACTIVE_STATUS
            });

            // Save Cabin Office Object
            let officeCabin = await officeCabinData.save();

            // Success Response
            return responseHelper.successapi(res, res.__("SuccessAddOfficeCabin"), SUCCESS, officeCabin);
        });

    }catch(error){
        console.log('error : ', error);
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}

// Update Office Cabin
exports.updateCabin = async (req, res) => {
    try{
        storeCabinImages(req, res, async (error, result) => {
            if(error) return responseHelper.error(res, res.__("" + error), FAILURE);

            let reqParam = req.body;

            // Validation Update Office Cabin Request
            let validationMessage = await officeCabinValidation.updateOfficeCabinValidation(reqParam);
            if(validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);

            //check existing
            var cabinExist = await OfficeCabinModel.findOne({ _id : reqParam.id});

            if(!cabinExist) return responseHelper.error(res, res.__("ErrorCabinNotFound"), FAILURE);

            // Arrange image links
            let images = [];
            if(req.files && req.files.length > 0){
                req.files.map(item => {
                    images.push(item.location);
                })
                if(cabinExist.images && cabinExist.images.length > 0){
                    images = cabinExist.images.concat(images);
                }
            }

            cabinExist.price = reqParam.price ? reqParam.price : cabinExist.price;
            cabinExist.capacity = reqParam.capacity ? reqParam.capacity : cabinExist.capacity;
            cabinExist.prefrences = reqParam.prefrences ? reqParam.prefrences : cabinExist.prefrences;
            cabinExist.isAvailable = reqParam.isAvailable ? reqParam.isAvailable : cabinExist.isAvailable;
            cabinExist.amenitieIds = reqParam.amenitieIds ? reqParam.amenitieIds : cabinExist.amenitieIds;
            cabinExist.images = req.files && req.files.length > 0 ? images : cabinExist.images;
            cabinExist.status = reqParam.status ? reqParam.status : cabinExist.status;

            let updateOfficeCabin = await cabinExist.save();

            // Update Cabin Office Object
            // let updateOfficeCabin = await OfficeCabinModel.findByIdAndUpdate({ _id: reqParam.id }, reqParam);

            // Success Response
            return responseHelper.successapi(res, res.__("SuccessUpdateOfficeCabin"), SUCCESS, updateOfficeCabin);
        });
    }catch(error){
        console.log('Error : ', error);
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}

exports.removeCabinImages = async (req, res) => {
    try{

        // TODO: remove from s3 bucket also.
        let reqParam = req.body;

        // Validation Delete Cabin Images Request
        let validationMessage = await officeCabinValidation.deleteCabinImageValidation(reqParam);
        if(validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);

        //check existing
        var cabinExist = await OfficeCabinModel.findOne({ _id : reqParam.id});
        var images = [];
        if(cabinExist && cabinExist.images && cabinExist.images.length > 0){
            await cabinExist.images.forEach((image) => {
                if(image !== reqParam.image_link) images.push(image);
            })
            cabinExist.images = images;
            await cabinExist.save();
            return responseHelper.successapi(res, res.__("SuccessDeletedCabinImage"), SUCCESS, cabinExist);
        }{
            return responseHelper.error(res, res.__("NotFoundCabin"), FAILURE);
        }
    }catch(error){
        console.log('error : ', error);
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}

// Delete Office Cabin
exports.deleteCabin = async (req, res) => {
    try{
        let reqParam = req.query;

        // Validation Delete Office Cabin Request
        let validationMessage = await officeCabinValidation.deleteOfficeCabinValidation(reqParam);
        if(validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);

        // Delete Cabin Office
        let deletedOffice = await OfficeCabinModel.findByIdAndRemove(reqParam.id);

        // TODO : remove image from disk

        // Success Response
        return responseHelper.successapi(res, res.__("SuccessDeleteOfficeCabin"), SUCCESS, deletedOffice);
    }catch(error){
        console.log('Error : ', error);
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}



// Get Offices By Location
// 
exports.getOfficesByGeoLocation = async (req, res) => {
    try{
        let reqParam = req.body;

        // Validation Get Office By Location Request
        let validationMessage = await officeValidation.getByGeoLocationValidation(reqParam);
        if(validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);

        // Find Offices
        let officesList = await getOfficesByGeoLocations(reqParam);
        
        
        let response = officesList && officesList.length > 0 ? officesList : [];

        // return responseHelper.successapi(res, res.__("SuucessGetOfficesByGeoLocation"), SUCCESS, response);

        //response data manipulation 
        let responseData = officeTransformer.transformListCollection(response);

        // Sucess Response
        return responseHelper.successapi(res, res.__("SuucessGetOfficesByGeoLocation"), SUCCESS, responseData);
    }catch(error){
        console.log('Error : ', error);
        return responseHelper.error(res, res.__("SometingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}
// EOD TODO: trying transformers for changing response before send specialy for fetching apis.
// add authentication middleware for jwt token for some apis.
// get by location and search


// Get All Office Locations
exports.getOfficeLocations = async (req, res) => {
    try{
        const user = req.user;

        // admin role validation 
        if(user.role == 2 || user.role == 1) return responseHelper.error(res, res.__("UserMustBeAdmin"), FAILURE);

        // fetch all offices
        let officeLocations = await getOfficeLocations();

        return responseHelper.successapi(res, res.__("SuccessFetchOfficeLocations"), SUCCESS, officeLocations);
    }catch(error){
        console.log('error :: ', error);

        return responseHelper.error(res, res.__("SometingWentWrongPleaseTryAgain"), SERVERERROR);
    }
} 

// get total offices
exports.getTotals = async (req, res) => {
    try{
        const user = req.user;

        // admin role validation 
        if(user.role == 2 || user.role == 1) return responseHelper.error(res, res.__("UserMustBeAdmin"), FAILURE);

        let totalOffices = await OfficeModel.find().count();
        let totalCabins = await OfficeCabinModel.find().count();

        return responseHelper.successapi(res, res.__("Success"), SUCCESS, { totalOffices, totalCabins });
    }catch(error){
        return responseHelper.error(res, res.__("SometingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}