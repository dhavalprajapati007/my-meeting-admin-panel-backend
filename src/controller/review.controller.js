const responseHelper = require("../helpers/responseHelper");
const ReviewModel = require("../models/review.model");
const reviewValidation = require("../services/validations/review/review.validation");
const {
	SERVERERROR,
	SUCCESS,
	FAILURE,
	ACTIVE_STATUS,
} = require("../../config/key");

// Add New Review
exports.add = async (req, res) => {
    try{
        const user = req.user;
        let reqParam = req.body;

        // validate add review request
        let validationMessage = await reviewValidation.addReviewValidation(reqParam);
        if(validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);

        // create review object
        let review = new ReviewModel({
            userId: reqParam.userId && reqParam.userId !== undefined ? reqParam.userId : user._id,
            serviceBookingId: reqParam.serviceBookingId,
            vendorId: reqParam.vendorId,
            review : reqParam.review,
            comment: reqParam.comment,
            status: ACTIVE_STATUS
        })

        // save review object
        let savedReview = await review.save();

        return responseHelper.successapi(res, res.__("SucessAddingReview"), SUCCESS, savedReview)

    }catch(error){
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}

// Edit Review
exports.update = async (req, res) => {
    try{
        let reqParam = req.body;

        // validate edit review response
        let validationMessage = await reviewValidation.updateReviewValidation(reqParam);
        if(validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);

        let review = await ReviewModel.findOneAndUpdate({_id: reqParam.id}, reqParam);

        if(review) return responseHelper.successapi(res, res.__("SuccessUpdatingReview"), SUCCESS, review);

        return responseHelper.error(res, res.__("ErrorUpdatingReview"), FAILURE);
    }catch(error){
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}

// Delete Review
exports.delete = async (req, res) => {
    try{
        let reqParam = req.query;

        // validate delete review response
        let validationMessage = await reviewValidation.deleteReviewValidation(reqParam);
        if(validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);

        let review = await ReviewModel.findByIdAndDelete(reqParam.id);

        if(review) return responseHelper.successapi(res,res.__("SucessDeleteReview"), SUCCESS, review);

        return responseHelper.error(res, res.__("ErrorDeletingReview"), FAILURE);
    }catch(error){
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}

// Get By User
exports.get = async (req, res) => {
    try{
        const user = req.user;
        let reqParam = req.body;

        // validate get by user review list
        let validationMessage = await reviewValidation.getReviewValidation(reqParam);
        if(validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);

        let reviewList = await ReviewModel.find({ userId: reqParam.userId && reqParam.userId !== undefined ? reqParam.userId : user._id });

        if(reviewList) return responseHelper.successapi(res, res.__("SucessGetReviewByUser"), SUCCESS, reviewList);

        return responseHelper.error(res, res.__("ErrorGetReviewsByUser"), FAILURE);
    }catch(error){
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}

// Get By Service Booking
exports.getByBooking = async (req, res) => {
    try{
        let reqParam = req.body;

        // validate get by booking review list
        let validationMessage = await reviewValidation.getReviewByBookingValidation(reqParam);
        if(validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);

        let reviewList = await ReviewModel.find({ serviceBookingId: reqParam.serviceBookingId });

        if(reviewList) return responseHelper.successapi(res, res.__("SuccessGetReviewByOffice"), SUCCESS, reviewList);

        return responseHelper.error(res, res.__("ErrorGetReviewByOffice"), FAILURE);
    }catch(error){
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}