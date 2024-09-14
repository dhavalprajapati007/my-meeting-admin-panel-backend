const otpValidation = require("../services/validations/otp.validation");
const responseHelper = require("../helpers/responseHelper");
const jwt = require("jsonwebtoken");
const userDetailTransformer = require("../transformers/user/userDetailTransformer");
const {
  SERVERERROR,
  SUCCESS,
  FAILURE,
  DELETED_STATUS,
  JWT_AUTH_TOKEN_SECRET,
  JWT_EXPIRES_IN,
  ACTIVE_STATUS
} = require("../../config/key");
const UserModel = require("../models/user.model");
var otpService = require('../services/otp/sms.service');

// Send OTP
exports.send = async (req, res) => {
  try {
    let reqParam = req.body;
    //server validations
    let validationMessage = await otpValidation.sendOtpValidation(reqParam);
    if (validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);
    //calling otp sent service to sent otp on mobile number
    otpService().sendOtp(reqParam.mobile).then(async (data) => {
      //parse the response
      var response = JSON.parse(data);

      //verify the response and sent it to the 
      if (response.type === 'success')
        return responseHelper.successapi(res, res.__("otpSentSuccess"), SUCCESS);
      else
        return responseHelper.error(res, res.__("otpSentFailed"), FAILURE);
    });
  } catch (err) {
    console.log(err);
    return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
  }
};

// Verify OTP
exports.verify = async (req, res) => {
  try {
    let reqParam = req.body;

    //server validations
    let validationMessage = await otpValidation.verifyOtpValidation(reqParam);
    if (validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);

    // TEMP : removed in production
    if(reqParam.otp == 3008){
      //find the user with the mobile number
      var foundUser = await UserModel.findOne({ mobile: reqParam.mobile, role: 1, status: { $ne: DELETED_STATUS } });
      
      //if not exist just return with status false
      if (!foundUser) return responseHelper.successapi(res, res.__("otpVerifySuccess"), SUCCESS, { isRegistred: false });


      // if deviceId provided then update users table
      if(reqParam.deviceId && reqParam.deviceId !== undefined){
        foundUser.deviceId = reqParam.deviceId;
        foundUser.save();
      }

      //if user exist make token object
      let tokenObject = {
        _id: foundUser._id,
        firstName: foundUser.firstName,
        lastName: foundUser.lastName,
        email: foundUser.email,
        status: foundUser.status
      };

      //if user exist token create
      var tokenData = jwt.sign({ tokenObject }, JWT_AUTH_TOKEN_SECRET, { expiresIn: JWT_EXPIRES_IN });
      var userData = userDetailTransformer.transformUser(foundUser);
      
      return responseHelper.successapi(res, res.__("otpVerifySuccess"), SUCCESS, { userData, tokenData, isRegistred: true });
    }
    // TEMP END

    //calling otp sent service to sent otp on mobile number
    otpService().verifyOtp(reqParam.otp, reqParam.mobile).then(async (data) => {
      if(data){
        //parse the response
        var response = JSON.parse(data);

        //verify the response and sent it to the 
        if (response.type === 'success') {

          //find the user with the mobile number
          var foundUser = await UserModel.findOne({ mobile: reqParam.mobile, role: 1, status: { $ne: DELETED_STATUS } });
          
          //if not exist just return with status false
          if (!foundUser) return responseHelper.successapi(res, res.__("otpVerifySuccess"), SUCCESS, { isRegistred: false });


          // if deviceId provided then update users table
          if(reqParam.deviceId && reqParam.deviceId !== undefined){
            foundUser.deviceId = reqParam.deviceId;
            foundUser.save();
          }

          //if user exist make token object
          let tokenObject = {
            _id: foundUser._id,
            firstName: foundUser.firstName,
            lastName: foundUser.lastName,
            email: foundUser.email,
            status: foundUser.status
          };

          //if user exist token create
          var tokenData = jwt.sign({ tokenObject }, JWT_AUTH_TOKEN_SECRET, { expiresIn: JWT_EXPIRES_IN });
          var userData = userDetailTransformer.transformUser(foundUser);
          
          return responseHelper.successapi(res, res.__("otpVerifySuccess"), SUCCESS, { userData, tokenData, isRegistred: true });
        } else {
          return responseHelper.error(res, res.__("otpVerifyFailed"), FAILURE);
        }
      }else{
        return responseHelper.error(res, res.__("ErrorUnexpectedResponse"), SERVERERROR);    
      }
    });
  } catch (e) {
    console.log(err);
    return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
  }
};

// Resend OTP
exports.resend = async (req, res) => {
  try {
    let reqParam = req.body;
    //server validations
    let validationMessage = await otpValidation.sendOtpValidation(reqParam);
    if (validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);
    //calling otp sent service to sent otp on mobile number
    otpService().resendOtp(reqParam.mobile).then(async (data) => {
      //parse the response
      var response = JSON.parse(data);

      //verify the response and sent it to the 
      if (response.type === 'success')
        return responseHelper.successapi(res, res.__("otpSentSuccess"), SUCCESS);
      else
        return responseHelper.error(res, res.__(response.message), FAILURE);
    });
  } catch (err) {
    console.log(err);
    return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
  }
};
