const responseHelper = require("../helpers/responseHelper");
const {
    createPaymentIntent, 
    listMerchantPayments,
    listAllAccounts,
    listAllTransactions
} = require("../services/Stripe");
const paymentValidation = require("../services/validations/payment/payment.validation");
const UserModel = require("../models/user.model");
const {
	SERVERERROR,
	SUCCESS,
	FAILURE,
	ACTIVE_STATUS,
} = require("../../config/key");

// create payment intent
exports.payment = async (req, res) => {
    try{
        let reqParam = req.body;

        // Validate create token request.
        let validationMessage = await paymentValidation.createPaymentIntentValidation(reqParam)
        if (validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);

        var paymentDetails = {
            amount: reqParam.amount,
            currency: 'inr',
            applicationFee: reqParam.applicationFee,
            stripeAccount: reqParam.stripeAccount
        }

        let charge = await createPaymentIntent(paymentDetails);
        
        return responseHelper.successapi(res, res.__("stripePaymentCreatedSuccessfully"), SUCCESS, charge);
    }catch(error){
        // Error Response
        console.log(error);
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}

// list all the payments of merchant
exports.listPayment = async (req, res) => {
    try{
        let reqParam = req.body;
        const user = req.user;

        // check for stripeId if not then fetch users
        const stripeId = reqParam.stripeId ? reqParam.stripeId : await getStripeId(user._id)
        
        // Validate stripe id
        if (!stripeId) return responseHelper.error(res, res.__('stripIdNotFound'), FAILURE);
        
        var merchantDetails = {
            stripeId : stripeId,
            // startingAfter : reqParam.starting_after
        }

        let feesList = await listMerchantPayments(merchantDetails, res);

        return responseHelper.successapi(res, res.__("stripeMerrchentCreatedSuccessfully"), SUCCESS, feesList);
    } catch (error) {
        console.log('error', error);
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}

async function getStripeId(userId) {
    try {
        const userData = await UserModel.findById(userId);
        return userData.vendorDetails.stripeId;
    } catch(e) {
        return false;
    }
}

// list all transfers accounts
exports.listTransactions = async (req, res) => {
    try{
        let reqParam = req.body;
        const user = req.user;

        // check for admin validation
        if(user.role == 2 || user.role == 1) return responseHelper.error(res, res.__("UserMustBeAdmin"), FAILURE);

        var transactions = await listAllTransactions(reqParam.starting_after ? reqParam.starting_after : false, reqParam.limit ? reqParam.limit : 10);
        return responseHelper.successapi(res, res.__("stripeAllTransactions"), SUCCESS, transactions);
    }catch(error){
        console.log('error getting transactions ', error);
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}