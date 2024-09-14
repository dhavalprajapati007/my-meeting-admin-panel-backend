const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const responseHelper = require("../helpers/responseHelper");
const UserModel = require("../models/user.model");
const WithdrawalRequestModel = require("../models/withdrawalRequests.model");
const userValidation = require("../services/validations/user/user.validation");
const userDetailTransformer = require("../transformers/user/userDetailTransformer");
const serviceBookingTransformer = require("../transformers/serviceBooking/serviceBookingTransformer");
const { storeUserDocumentsImage } = require('../middleware/uploadImage');
const Mailer = require("../services/Mailer");
let ejs = require("ejs");
const path = require("path");
var dayjs = require("dayjs");
const helper = require("../helpers/helper");
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
const { getUser, listUsers, listVendors, getWithdrawalRequestByVendor, getAllWithdrawalRequests, getBookingPaymentHistory, getAllVerifiedVendors, fetchUpcomingEventForDeleteVendor } = require("../services/user/user.service");
const notificationService = require("../services/notification/notification.service");
const VendorServiceModel = require("../models/vendorService.model");
const VendorTimeslotModel = require("../models/vendorTimeslot.model");
const { getTodaysBookingByBookingType, getTodaysBookingsForUser } = require("../services/serviceBooking/serviceBooking.service");
var ObjectId = require("mongodb").ObjectID;
const { updateWalletOnRejectWithdrawalRequest, updateWalletOnRaiseWithdrawalRequest, updateWalletAfterCompletedWithdrawalRequest } = require("../services/handleWallet");


//signup user
exports.signup = async (req, res) => {
    try {

        //store user documents image using multer middleware
        storeUserDocumentsImage(req, res, async (err, result) => {
            if (err) {
                return responseHelper.error(res, res.__("" + err), FAILURE);
            } else {
                let reqParam = req.body;

                //server validations
                let validationMessage = await userValidation.signupUserValidation(reqParam);
                if (validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);

                //check existing
                var userExist = await UserModel.findOne({ email: reqParam.email, status: ACTIVE_STATUS });
                if (userExist) return responseHelper.error(res, res.__("userRegisteredWithSameEmail"), FAILURE);

                //creating request object
                let signUpData = UserModel({
                    firstName: reqParam.firstName,
                    lastName: reqParam.lastName,
                    mobile: reqParam.mobile,
                    email: reqParam.email,
                    password: reqParam.password ? bcrypt.hashSync(reqParam.password) : "", 
                    role: reqParam.role,
                    occupation: "",
                    avatar: req.files && req.files.avatar !== undefined ? req.files.avatar[0].location: '',
                    vendorDetails: {
                        address: {
                            line1: reqParam.line1 ? reqParam.line1 : '',
                            line2: reqParam.line2 ? reqParam.line2 : '',
                            city: reqParam.city ? reqParam.city : '',
                            state: reqParam.state ? reqParam.state : '',
                            pincode: reqParam.pincode ? reqParam.pincode : ''
                        },
                        providerType: reqParam.providerType ? reqParam.providerType : 0,
                        idProofDetails: {
                            panCard: req.files && req.files.panCard !== undefined ? req.files.panCard[0].location : '',
                            aadharFront: req.files && req.files.aadharFront !== undefined ? req.files.aadharFront[0].location : '',
                            aadharBack: req.files && req.files.aadharBack !== undefined ? req.files.aadharBack[0].location : '',
                        },
                        balance : {
                            totalRevenue : 0, 
                            totalPayout : 0,
                            availableBalance : 0, 
                            withdrawableBalance : 0
                        },
                        paymentMethods : [],
                        isVerified : false
                    },
                    deviceId : reqParam.deviceId
                });

                //user save
                let newUser = await signUpData.save();

                //token object to create token
                let tokenObject = {
                    _id: newUser._id,
                    firstName: newUser.firstName,
                    lastName: newUser.lastName,
                    email: newUser.email,
                    status: newUser.status,
                    providerType : newUser.vendorDetails.providerType
                };

                //token create
                var tokenData = jwt.sign({ tokenObject }, JWT_AUTH_TOKEN_SECRET, { expiresIn: JWT_EXPIRES_IN });
                // tokenObject.tokenData = tokenData;
                
                var notificationObject = {
                    userId: newUser._id,
                    notiTitle: "Welcome to MyMeeting Family",
                    notiBody: "Dear "+ newUser.firstName +". \n Thank you for your registration with mymeeting. We are very happy to welcome you in our mymeeting family.",
                    notiType: "registration"
                }
                let notifications = await notificationService.sendAllTypesNotifications(notificationObject);
                console.log('notifictions on register : ', notifications);

                return responseHelper.successapi(res, res.__("userRegistered"), SUCCESS, { userData: newUser, tokenData});
            }
        });
    } catch (e) {
        console.log(e);
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
};

//login user
exports.login = async (req, res) => {
    try {
        let reqParam = req.body;

        let validationMessage = await userValidation.loginUserValidation(reqParam);
        if (validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);

        var foundUser = await UserModel.findOne({ email: reqParam.email, status: { $ne: DELETED_STATUS } });
        if (!foundUser) return responseHelper.error(res, res.__("userNotRegisteredWithEmail"), FAILURE);

        if (bcrypt.compareSync(reqParam.password, foundUser.password)) {
            let tokenObject = {
                _id: foundUser._id,
                firstName: foundUser.firstName,
                lastName: foundUser.lastName,
                email: foundUser.email,
                status: foundUser.status,
                providerType : foundUser.vendorDetails.providerType
            };

            //token create
            var tokenData = jwt.sign({ tokenObject }, JWT_AUTH_TOKEN_SECRET, { expiresIn: JWT_EXPIRES_IN });

            // if deviceId provided then update user table
            if(reqParam?.deviceId && reqParam?.deviceId !== undefined){
                foundUser.deviceId = reqParam?.deviceId;
                foundUser.save();
            }

            let userData = userDetailTransformer.transformUser(foundUser);
            return responseHelper.successapi(res, res.__("userLogedIn"), SUCCESS, { userData, tokenData });
        } else {
            return responseHelper.error(res, res.__("userWrongPassword"), FAILURE);
        }
    } catch (e) {
        console.log('error : ', e);
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
};

//user forgot password
exports.forgotPassword = async (req, res) => {
    try {
        let reqParam = req.body;
        let validationMessage = await userValidation.forgotPasswordValidation(reqParam);
        if (validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);

        //existing user
        const foundUser = await UserModel.findOne({
            email: reqParam.email.toLowerCase(),
            status: ACTIVE_STATUS,
        });
        if (!foundUser) return responseHelper.successapi(res, res.__("userNotRegisteredWithEmail"), SUCCESS, { status: false });

        //generating reset token
        const resetToken = Math.floor(100000 + Math.random() * 900000)

        //updating reset token
        await UserModel.findOneAndUpdate({
            email: reqParam.email.toLowerCase(),
            status: ACTIVE_STATUS
        }, {
            $set: {
                resetToken: resetToken
            }
        });

        var locals = {
            username: foundUser.firstName,
            text: "Your code for forgot password request is " + resetToken + ".",
            link: `${APP_WEB_LINK}/reset-password/${resetToken}`,
        };

        const emailBody = await ejs.renderFile(
            path.join(__dirname, "../views/emails/forgotPassword", "forgot-password.ejs"),
            { locals: locals },
        );
        //sending mail to user
        await Mailer.sendEmail(reqParam.email, emailBody, "Forgot Password");
        return responseHelper.successapi(res, res.__("ResetPwdLinkMail"), SUCCESS, { status: true });
    } catch (e) {
        console.log(e)
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
};

//reset password
exports.resetPassword = async (req, res) => {
    try {
        let reqParam = req.body;

        //check validations
        let validationMessage = await userValidation.resetPasswordValidation(reqParam);
        if (validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);

        //fetch user into the database using email
        const foundUser = await UserModel.findOne({
            email: reqParam.email.toLowerCase(),
            status: ACTIVE_STATUS,
            resetToken: reqParam.resetToken
        });
        //failed if not found
        if (!foundUser) return responseHelper.error(res, res.__("userNotRegisteredWithEmailOrResetTokenNotMatched"), FAILURE);

        if (foundUser.resetToken == reqParam.resetToken) {
            //saving user with new password
            await UserModel.findOneAndUpdate({
                email: reqParam.email.toLowerCase(),
                status: ACTIVE_STATUS
            }, {
                $set: {
                    password: bcrypt.hashSync(reqParam.newPassword),
                    resetToken: null
                }
            });
            return responseHelper.successapi(res, res.__("PwdUpdated"), SUCCESS);
        } else {
            return responseHelper.error(res, res.__("resetTokenMismatch"), FAILURE);
        }
    } catch (e) {
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
};

//edit user profile
exports.edit = async (req, res) => {
    try {
        storeUserDocumentsImage(req, res, async (err, result) => {
            const user = req.user;
            let reqParam = req.body;

            // Validation
            let validationMessage = await userValidation.editValidation(reqParam);
            if(validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);

            //update the data
            const updatedUser = await UserModel.findByIdAndUpdate({ _id: user._id, status: ACTIVE_STATUS }, {
                $set: {
                    firstName: reqParam.firstName ? reqParam.firstName : user.firstName,
                    lastName: reqParam.lastName ? reqParam.lastName : user.lastName,
                    mobile: reqParam.mobile ? reqParam.mobile : user.mobile,
                    occupation: reqParam.occupation ? reqParam.occupation : user.occupation,
                    dateOfBirth: reqParam.dateOfBirth ? reqParam.dateOfBirth : user.dateOfBirth,
                    avatar: req.files && req.files.avatar !== undefined ? req.files.avatar[0].location : user.avatar, 
                    addressCordinater: {
                        lat: reqParam.lat ? reqParam.lat : user.addressCordinater.lat,
                        lang: reqParam.lang ? reqParam.lang : user.addressCordinater.lang,
                    },
                    deviceId: reqParam.deviceId ? reqParam.deviceId : user.deviceId,
                    stripeCustomerId: reqParam.stripeCustomerId ? reqParam.stripeCustomerId : user.stripeCustomerId,
                    lastLogin: reqParam.lastLogin ? reqParam.lastLogin : user.lastLogin,
                    status: reqParam.status ? reqParam.status : user.status,
                    vendorDetails: {
                        stripeId: reqParam.stripeId && reqParam.stripeId !== undefined ? reqParam.stripeId : user.vendorDetails.stripeId,
                        panNumber: reqParam.panNumber ? reqParam.panNumber : user.vendorDetails.panNumber,
                        idProofDetails: {
                            panCard: req.files && req.files.panCard !== undefined ? req.files.panCard[0].location : user.vendorDetails.idProofDetails.panCard,
                            aadharFront: req.files && req.files.aadharFront !== undefined ? req.files.aadharFront[0].location : user.vendorDetails.idProofDetails.aadharFront,
                            aadharBack: req.files && req.files.aadharBack !== undefined ? req.files.aadharBack[0].location : user.vendorDetails.idProofDetails.aadharBack,
                        },
                        providerType: reqParam.providerType ? reqParam.providerType : user.vendorDetails.providerType,
                        address: {
                            line1: reqParam.line1 ? reqParam.line1 : user.vendorDetails.address.line1,
                            line2: reqParam.line2 ? reqParam.line2 : user.vendorDetails.address.line2,
                            city: reqParam.city ? reqParam.city : user.vendorDetails.address.city,
                            state: reqParam.state ? reqParam.state : user.vendorDetails.address.state,
                            pincode: reqParam.pincode ? reqParam.pincode : user.vendorDetails.address.pincode
                        },
                        balance : user.vendorDetails.balance,
                        paymentMethods : user.vendorDetails.paymentMethods,
                        isVerified : reqParam.isVerified !== undefined ? reqParam.isVerified : user.vendorDetails.isVerified
                    }
                }
            });

            if(updatedUser){
                const userDetail = await UserModel.findById(user._id);
                //response data manipulation 
                let userData = userDetailTransformer.transformUser(userDetail)
                return responseHelper.successapi(res, res.__("YourProfileUpdated"), SUCCESS, userData);
            }else{
                return responseHelper.error(res, res.__("ErrorUpdatingUser", FAILURE));
            }            
        });
    } catch (e) {
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
};

//view user Profile
exports.view = async (req, res) => {
	try {
		const user = req.user;
        let reqParam = req.body;
        
        //View Validation
        let validationMessage = await userValidation.viewUserValidation(reqParam);

        // 
        if(!validationMessage) var existingUserData = await UserModel.findById(reqParam.userId);

        //if UserId not passed then get profile otherwise get requested user
        var foundUser = await getUser({
            userId: validationMessage ? user._id : reqParam.userId,
            role: validationMessage && existingUserData ? user.role : existingUserData.role
        });
		
        //return if user not found
		if (!foundUser) return responseHelper.error(res, res.__("UserNotFound"), FAILURE);
        
        //response data manipulation
        let userData = userDetailTransformer.transformUser(foundUser[0]);
        
        // success
		return responseHelper.successapi(res,res.__("SuccessViewUserProfile"),SUCCESS,userData);

	} catch (e) {
		return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
	}
};

//list all users data
exports.listUsers = async (req, res) => {
	try {
		const user = req.user;
        let reqParam = req.body;

        //check is user is admin or not
        // if (!user.role === 3) return responseHelper.error(res, res.__("UnauthorizedUser"), FAILURE);

        // Request Validation
        let validationMessage = await userValidation.listUsersValidation(reqParam);
        if (validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);

        const { limitCount, skipCount } = helper.getPageAndLimit(reqParam.page, reqParam.limit);

        //get users data
        var usersList = await listUsers({
            roles: reqParam.roles,
            skip: skipCount,
            limit: limitCount
        });

        //response data 
        let response = usersList && usersList.length > 0 ? usersList[0].data : [];
        
        //response data manipulation 
        let responseData = userDetailTransformer.transformListCollection(response);
        
        let extras = {
            totalCount : usersList && usersList.length > 0 && usersList[0].totalRecords[0] ? usersList[0].totalRecords[0].count : 0
        }

		return responseHelper.successapi(res,res.__("SuccessViewUserProfile"), SUCCESS, responseData, extras);

	} catch (e) {
        console.log(e);
		return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
	}
};

// Notify Users for location update
exports.fcmLocationUpdateUsers = async (req, res) => {
    try{
        const user = req.user;
        let reqParam = req.body;

        // validate request
        let validationMessage = await userValidation.pushLocationUsersValidation(req.body);
        if(validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);

        // send push notification to users
        if(!reqParam.sendResult){
            Promise.all(
                reqParam.participantsIds.map(async (item) => {
                    console.log('user : ', item);
                    let participant = await UserModel.findById(item);
                    if(participant && participant.deviceId){
                        let fcm_object = {
                            userId: participant._id,
                            deviceId: participant.deviceId,
                            title: user.firstName + ' ' + user.lastName + ' is want to know your location for booking a meeting with you?',
                            body: 'Do you want to accept this request?',
                            // body: '{ "title": "Location request","message": "' + user.firstName + '" "' + user.lastName + '" has requested to share your location","type": "location_request" }',
                            object: {
                                notificationType : "LocationUpdate",
                                title: user.firstName + ' ' + user.lastName + ' is want to know your location for booking a meeting with you?',
                                body: 'Do you want to accept this request?',
                                type: 'location_request'
                            }
                        }
                        let notificationData = await notificationService.sendNotificationToUser(fcm_object);
                        let notification = JSON.parse(notificationData);
                        console.log('send notification ---- >', notification);
                        // remove lat & lang from record
                        let participantUpdate = await UserModel.findByIdAndUpdate({
                            _id: item,
                            role: 1,
                            status: ACTIVE_STATUS
                        },{
                            addressCordinater : {
                                lat : "",
                                lang : ""
                            }
                        });
                        // console.log('update Participant', participantUpdate);
                        if(participantUpdate && notification && notification.success){
                            return {
                                _id: participant._id,
                                firstName: participant.firstName,
                                lastName: participant.lastName,
                                mobile: participant.mobile,
                                avatar: participant.avatar,
                                lat: participant.addressCordinater.lat,
                                lang: participant.addressCordinater.lang,
                                sendSuccess : true,
                                acceptRequest: false
                            }
                        }else{
                            return {
                                _id: participant._id,
                                firstName: participant.firstName,
                                lastName: participant.lastName,
                                mobile: participant.mobile,
                                avatar: participant.avatar,
                                lat: participant.addressCordinater.lat,
                                lang: participant.addressCordinater.lang,
                                sendSuccess : false,
                                acceptRequest : false
                            }
                        }
                    }else{
                        return {
                            _id: item,
                            msg: "ParticipantDeviceIdNotFound"
                        }
                    }
                })
            ).then(result => {
                console.log('result -> send notification :: ', result);
                return responseHelper.successapi(res, res.__("SuccessSendNotificationForUpdateLocation"), SUCCESS, result);
            }).catch(error => {
                console.log('error : ========>', error);
                return responseHelper.error(res, res.__("ErrorFCMLocationUpdate"), FAILURE);
            })
        }else{
            // send participants
            Promise.all(
                reqParam.participantsIds.map(async (item) => {
                    console.log('participant ', item);
                    let participant = await UserModel.findById(item);
                    if(participant && participant.deviceId){
                        if((participant.addressCordinater.lat && participant.addressCordinater.lang) && (participant.addressCordinater.lat !== "" && participant.addressCordinater.lang !== "")){
                            return {
                                _id: participant._id,
                                firstName: participant.firstName,
                                lastName: participant.lastName,
                                mobile: participant.mobile,
                                avatar: participant.avatar,
                                lat: participant.addressCordinater.lat,
                                lang: participant.addressCordinater.lang,
                                sendSuccess : false,
                                acceptRequest : true
                            };
                        }else{
                            return { 
                                _id: participant._id,
                                firstName: participant.firstName,
                                lastName: participant.lastName,
                                mobile: participant.mobile,
                                avatar: participant.avatar,
                                lat: "",
                                lang: "",
                                sendSuccess: false,
                                acceptRequest : false
                            };
                        }
                        
                    }else{
                        return {
                            _id: item,
                            msg: "ParticipantDeviceIdNotFound"
                        }
                    }
                })
            ).then(result => {
                console.log('result -> fetch locations :: ', result);
                return responseHelper.successapi(res, res.__("SucessFetchUpdatedLocations"), SUCCESS, result);
            }).catch(error => {
                console.log('error ======> : ', error);
                return responseHelper.error(res, res.__("ErrorFindLocationForUser"), FAILURE);
            })
        }
    }catch(error){
        console.log('error ------->: ', error);
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}

// list all vendors by filter (pending or verified)
exports.listAllVendors = async (req, res) => {
    try{
        const user = req.user;
        var reqParam = req.body;
        if(user.role == 1 || user.role == 2) return responseHelper.error(res, res.__("UserRoleNotValid"), FAILURE);

        // Validation
        let validationMessage = await userValidation.listVendorsValidation(reqParam);
        if(validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);
        
        let vendors;

        if(reqParam?.hasOwnProperty("page") && reqParam?.hasOwnProperty("limit")) {
            var { limitCount, skipCount } = helper.getPageAndLimit(reqParam.page, reqParam.limit);

            vendors = await listVendors({
                serviceProvider: reqParam.providerType && reqParam.providerType !== undefined ? reqParam.providerType : [1],
                verified: reqParam.verified !== undefined ? reqParam.verified : true,
                skip: skipCount,
                limit: limitCount
            });

            //response data 
            let response = vendors && vendors.length > 0 ? vendors[0].data : [];

            //response data manipulation 
            let responseData = userDetailTransformer.transformListCollection(response);

            let extras = {
                totalCount : vendors && vendors.length > 0 && vendors[0].totalRecords[0] ? vendors[0].totalRecords[0].count : 0
            }

		    return responseHelper.successapi(res,res.__("SuccessListAllVendors"), SUCCESS, responseData, extras);
        } else {
            vendors = await listVendors({
                serviceProvider: reqParam.providerType && reqParam.providerType !== undefined ? reqParam.providerType : [1],
                verified: reqParam.verified !== undefined ? reqParam.verified : true,
            });
            
            //response data 
            let response = vendors && vendors?.length > 0 ? vendors : [];

            //response data manipulation 
            let responseData = userDetailTransformer.transformListCollection(response);

            return responseHelper.successapi(res,res.__("SuccessListAllVendors"), SUCCESS, responseData);
        }
    }catch(error){
        console.log('error ', error);
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}

// Edit User By Admin
exports.editByAdmin = async (req, res) => {
    try{
        const user = req.user;

        // Check for Role Access
        if(user.role == 1 || user.role == 2) return responseHelper.error(res, res.__("UserRoleNotValid"), FAILURE);

        // Upload Image.
        storeUserDocumentsImage(req, res, async (err, result) => {
            let reqParam = req.body;
            
            // Validation
            let validationMessage = await userValidation.editByAdminValidation(reqParam);
            if(validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);

            // Find User
            let findUser = await UserModel.findById(reqParam.userId);
            if(!findUser) return responseHelper.error(res, res.__("UserNotFound"), FAILURE);

            //update the data
            const updatedUser = await UserModel.findByIdAndUpdate({ _id: findUser._id, status: ACTIVE_STATUS }, {
                $set: {
                    firstName: reqParam.firstName ? reqParam.firstName : findUser.firstName,
                    lastName: reqParam.lastName ? reqParam.lastName : findUser.lastName,
                    mobile: reqParam.mobile ? reqParam.mobile : findUser.mobile,
                    occupation: reqParam.occupation ? reqParam.occupation : findUser.occupation,
                    dateOfBirth: reqParam.dateOfBirth ? reqParam.dateOfBirth : findUser.dateOfBirth,
                    avatar: req.files && req.files.avatar !== undefined ? req.files.avatar[0].location : findUser.avatar, 
                    addressCordinater: {
                        lat: reqParam.lat ? reqParam.lat : findUser.addressCordinater.lat,
                        lang: reqParam.lang ? reqParam.lang : findUser.addressCordinater.lang,
                    },
                    deviceId: reqParam.deviceId ? reqParam.deviceId : findUser.deviceId,
                    stripeCustomerId: reqParam.stipeCustomerId ? reqParam.stipeCustomerId : findUser.stipeCustomerId,
                    lastLogin: reqParam.lastLogin ? reqParam.lastLogin : findUser.lastLogin,
                    status: reqParam.status ? reqParam.status : findUser.status,
                    vendorDetails: {
                        stripeId: reqParam.stripeId && reqParam.stripeId !== undefined ? reqParam.stripeId : findUser.vendorDetails.stripeId,
                        panNumber: reqParam.panNumber ? reqParam.panNumber : findUser.vendorDetails.panNumber,
                        idProofDetails: {
                            panCard: req.files && req.files.panCard !== undefined ? req.files.panCard[0].location : findUser.vendorDetails.idProofDetails.panCard,
                            aadharFront: req.files && req.files.aadharFront !== undefined ? req.files.aadharFront[0].location : findUser.vendorDetails.idProofDetails.aadharFront,
                            aadharBack: req.files && req.files.aadharBack !== undefined ? req.files.aadharBack[0].location : findUser.vendorDetails.idProofDetails.aadharBack,
                        },
                        providerType: reqParam.providerType ? reqParam.providerType : findUser.vendorDetails.providerType,
                        address: {
                            line1: reqParam.line1 ? reqParam.line1 : findUser.vendorDetails.address.line1,
                            line2: reqParam.line2 ? reqParam.line2 : findUser.vendorDetails.address.line2,
                            city: reqParam.city ? reqParam.city : findUser.vendorDetails.address.city,
                            state: reqParam.state ? reqParam.state : findUser.vendorDetails.address.state,
                            pincode: reqParam.pincode ? reqParam.pincode : findUser.vendorDetails.address.pincode
                        },
                    },
                    // registrationStep: reqParam.registrationStep ? reqParam.registrationStep : findUser.registrationStep,
                }
            });

            // Manipulate response 
            let userData = userDetailTransformer.transformUser(updatedUser);
            if(userData) return responseHelper.successapi(res, res.__("UpdatedUserSuccessfully"), SUCCESS, userData);
            
        });
    }catch(e){
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}

// get total bookings

exports.getTotals = async (req, res) => {
    try{
        const user = req.user;
        
        // Check for Role Access
        if(user.role == 1 || user.role == 2) return responseHelper.error(res, res.__("UserRoleNotValid"), FAILURE);

        let totalUsers = await UserModel.find({ role: 1 }).count();
        let totalVendors = await UserModel.find({ role: 2 }).count();

        return responseHelper.successapi(res, res.__("Success"), SUCCESS, { totalUsers, totalVendors });
    }catch(error){
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}

exports.vendorDashboard = async (req, res) => {
    try{
        const user = req.user;
        console.log(user,"user");

        // Check for Role Access
        // This is accessible for only vendor
        if(user.role == 1) return responseHelper.error(res, res.__("UserRoleNotValid"), FAILURE);
        
        let vendorService = await VendorServiceModel.findOne({ userId: user?._id });
        console.log('User Details ', vendorService);

        const { limitCount, skipCount } = helper.getPageAndLimit(1,10);

        let userServiceDetails = {
            place : {
                isActive : false,
                data : []
            },
            webinar : {
                isActive : false,
                data : []
            },
            service : {
                isActive : false,
                data : []
            }
        }

        let providerType = user?.vendorDetails?.providerType; 

        let currentDate = dayjs().format("YYYY-MM-DD");
        let ISOString = dayjs(new Date(currentDate)).toISOString();

        let queryParams = {
            skip: skipCount,
            limit: limitCount,
            currentDate : new Date(ISOString),
            userId : user._id,
            isPlace : true,
            isCompleted : ["Upcoming"],
            serviceType : []
        }
        console.log(queryParams,"queryParams");
        // fetch data from db according to providerType
        // providerType ----> Place
        if(parseInt(providerType) === 1) {
            queryParams.serviceType = [1,2];
            console.log('quer Params ', queryParams);
            let placeBookings = await getTodaysBookingByBookingType(queryParams);
            userServiceDetails.place.isActive = true
            let responseData = serviceBookingTransformer.transformGetBookingsByUser(placeBookings[0]?.data);
            userServiceDetails.place.data = responseData;
            // const { data, isActive } = userServiceDetails.place
            console.log(userServiceDetails,"userServiceDetail For Provider Type 1")
        };

        // providerType ----> Service
        if(parseInt(providerType) === 2) {
            queryParams.isPlace = false;

            if(vendorService && (vendorService.prefrence === 2 || vendorService.prefrence === 3)){
                queryParams.serviceType = [2];
                let serviceBookings = await getTodaysBookingByBookingType(queryParams);
                let responseData = serviceBookingTransformer.transformGetBookingsByUser(serviceBookings[0]?.data);
                userServiceDetails.service.data = responseData;
                userServiceDetails.service.isActive = true;
            };

            if(vendorService && (vendorService.prefrence === 1 || vendorService.prefrence === 3)){
                queryParams.serviceType = [3];
                let webinarBookings = await getTodaysBookingByBookingType(queryParams);
                let responseData = serviceBookingTransformer.transformGetBookingsByUser(webinarBookings[0]?.data);
                userServiceDetails.webinar.data = responseData;
                userServiceDetails.webinar.isActive = true
            };
        };

        // providerType ----> Both
        if(parseInt(providerType) === 3) {
            queryParams.isPlace = true;
            queryParams.serviceType = [1,2];
            let placeBookings = await getTodaysBookingByBookingType(queryParams);
            userServiceDetails.place.isActive = true;
            let responseData = serviceBookingTransformer.transformGetBookingsByUser(placeBookings[0]?.data);
            userServiceDetails.place.data = responseData;
            queryParams.isPlace = false;
            
            if(vendorService && (vendorService.prefrence === 2 || vendorService.prefrence === 3)){
                queryParams.serviceType = [2];
                let serviceBookings = await getTodaysBookingByBookingType(queryParams);
                userServiceDetails.service.isActive = true;
                let responseData = serviceBookingTransformer.transformGetBookingsByUser(serviceBookings[0]?.data);
                userServiceDetails.service.data = responseData;
            };

            if(vendorService && (vendorService.prefrence === 1 || vendorService.prefrence === 3)){
                queryParams.serviceType = [3];
                let webinarBookings = await getTodaysBookingByBookingType(queryParams);
                let responseData = serviceBookingTransformer.transformGetBookingsByUser(webinarBookings[0]?.data);
                userServiceDetails.webinar.data = responseData;
                userServiceDetails.webinar.isActive = true;
            };
        }

        return responseHelper.successapi(res, res.__("Success"), SUCCESS, userServiceDetails);
    }catch(error){
        console.log('error : ', error);
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}

exports.enableVendor = async (req, res) => {
    try{
        const user = req.user;
        let reqParam = req.body;
        
        // Check for Role Access
        if(user.role == 1) return responseHelper.error(res, res.__("UserRoleNotValid"), FAILURE);

        // validate request
        let validationMessage = await userValidation.enableVendorValidation(reqParam);
        if(validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);


        let foundUser = await UserModel.findOne({ _id: user?._id });
        let providerType = user?.vendorDetails?.providerType; 

        if(providerType === 0) {
            if(reqParam.activationType === "place") {
                foundUser.vendorDetails.providerType = 1;
                foundUser.save();
            }
            if(reqParam.activationType === "service" || reqParam.activationType === "webinar") {
                foundUser.vendorDetails.providerType = 2;
                foundUser.save();
            }
        }

        if(providerType === 1) {
            if(reqParam.activationType === "place") {
                return responseHelper.successapi(res, res.__("ServiceAlredyActivated"), SUCCESS);
            }
            if(reqParam.activationType === "service" || reqParam.activationType === "webinar") {
                foundUser.vendorDetails.providerType = 3;
                foundUser.save();
            }
        }
        
        if(providerType === 2 || providerType === 3) {
            
            if(reqParam.activationType === "place" && providerType === 2) {
                console.log("called in p.t. 2 --> Place : ", foundUser);
                foundUser.vendorDetails.providerType = 3;
                foundUser.save();
            }

            if(reqParam.activationType === "service" || reqParam.activationType === "webinar") {
                let vendorService = await VendorServiceModel.findOne({ userId: user?._id });
                if(vendorService) {
                    if(vendorService.prefrence === 1 && reqParam.activationType === "service") {
                        vendorService.prefrence = 3;
                        vendorService.save();
                    }else if(vendorService.prefrence === 2 && reqParam.activationType === "webinar") {
                        vendorService.prefrence = 3;
                        vendorService.save();
                    } else {
                        return responseHelper.successapi(res, res.__("ServiceAlredyActivated"), SUCCESS);
                    }
                } else {
                    return responseHelper.successapi(res, res.__("PleaseEnterServiceFormDetailsFirst"), SUCCESS);
                }
            }
        }

        return responseHelper.successapi(res, res.__("Success"), SUCCESS, {});
    }catch(e){
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}

exports.createPaymentMethod = async (req, res) => {
    try {
        const user = req.user;
        let reqParam = req.body;
        
        // Check for Role Access
        if(user.role == 1) return responseHelper.error(res, res.__("UserRoleNotValid"), FAILURE);

        // validate request
        let validationMessage = await userValidation.createPaymentMethodValidation(reqParam);
        if(validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);

        // Find User
        let findUser = await UserModel.findById(user?._id);
        if(!findUser) return responseHelper.error(res, res.__("UserNotFound"), FAILURE);

        let found = false;

        if(reqParam.type === "bank" && findUser?.vendorDetails?.paymentMethods?.length > 0) {
            found = findUser?.vendorDetails?.paymentMethods?.some(el => el?.acNumber === reqParam.acNumber);
        }

        if(reqParam.type === "upi" && findUser?.vendorDetails?.paymentMethods?.length > 0) {
            found = findUser?.vendorDetails?.paymentMethods?.some(el => el?.upiId === reqParam.upiId);
        }

        if(found) return responseHelper.error(res, res.__("PaymentAccountExist"), FAILURE);
        findUser?.vendorDetails?.paymentMethods.push(reqParam);

        let userDetails = await findUser.save();
        return responseHelper.successapi(res, res.__("Success"), SUCCESS, userDetails );
    }catch(e){
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}

exports.editPaymentMethod = async (req, res) => {
    try {
        const user = req.user;
        let reqParam = req.body;
        
        // Check for Role Access
        if(user.role == 1) return responseHelper.error(res, res.__("UserRoleNotValid"), FAILURE);

        // validate request
        let validationMessage = await userValidation.editPaymentMethodValidation(reqParam);
        if(validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);

        let paymentMethods = user?.vendorDetails?.paymentMethods;

        if(!paymentMethods.length) {
            return responseHelper.error(res, res.__("PaymentMethodNotFound"), FAILURE);
        }else{
            let isMatched = paymentMethods?.some(el => el._id.equals(reqParam.referenceId));
            if(!isMatched) return responseHelper.error(res, res.__("PaymentMethodNotFoundWithGivenId"), FAILURE);
        }

        let found = false;
        
        if(reqParam.type === "bank" && paymentMethods.length > 0) {
            found = paymentMethods?.some(el => el?.acNumber === reqParam.acNumber);
        }

        if(reqParam.type === "upi" && paymentMethods.length > 0) {
            found = paymentMethods?.some(el => el?.upiId === reqParam.upiId);
        }

        if(found) return responseHelper.error(res, res.__("PaymentAccountExist"), FAILURE);

        if(reqParam.type === "bank") {
            user.vendorDetails.paymentMethods.id(reqParam.referenceId).bankName = reqParam.bankName
            user.vendorDetails.paymentMethods.id(reqParam.referenceId).holderName = reqParam.holderName
            user.vendorDetails.paymentMethods.id(reqParam.referenceId).acNumber = reqParam.acNumber
            user.vendorDetails.paymentMethods.id(reqParam.referenceId).ifscCode = reqParam.ifscCode
            user.vendorDetails.paymentMethods.id(reqParam.referenceId).accountType = reqParam.accountType
        } else{
            user.vendorDetails.paymentMethods.id(reqParam.referenceId).upiId = reqParam.upiId;
        }
        
        user.markModified('paymentMethods');
        const updatedDetails = await user.save();

        return responseHelper.successapi(res, res.__("Success"), SUCCESS, updatedDetails);
    }catch(e){
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}

exports.deletePaymentMethod = async (req, res) => {
    try {
        const user = req.user;
        let reqParam = req.query;
        
        // Check for Role Access
        if(user.role == 1) return responseHelper.error(res, res.__("UserRoleNotValid"), FAILURE);

        // validate request
        let validationMessage = await userValidation.deletePaymentMethodValidation(reqParam);
        if(validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);

        // Find User
        console.log(user,"userDetails");

        let paymentMethods = user?.vendorDetails?.paymentMethods;

        if(!paymentMethods.length) {
            return responseHelper.error(res, res.__("PaymentMethodNotFound"), FAILURE);
        }else{
            let isMatched = paymentMethods?.some(el => el._id.equals(reqParam.referenceId));
            if(!isMatched) return responseHelper.error(res, res.__("PaymentMethodNotFoundWithGivenId"), FAILURE);
        };

        user.vendorDetails.paymentMethods.id(reqParam.referenceId).remove();
        
        user.markModified('paymentMethods');
        const updatedDetails = await user.save();

        return responseHelper.successapi(res, res.__("Success"), SUCCESS, updatedDetails);
    }catch(e){
        console.log(e,"error")
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}

exports.getAllPaymentMethods = async (req, res) => {
    try {
        const user = req.user;
        
        // Check for Role Access
        if(user.role == 1) return responseHelper.error(res, res.__("UserRoleNotValid"), FAILURE);

        // Find User
        let findUser = await UserModel.findById(user?._id);
        if(!findUser) return responseHelper.error(res, res.__("UserNotFound"), FAILURE);

        let paymentMethods = findUser?.vendorDetails?.paymentMethods !== undefined && findUser?.vendorDetails?.paymentMethods.length > 0 ? findUser?.vendorDetails?.paymentMethods : []; 

        return responseHelper.successapi(res, res.__("Success"), SUCCESS, paymentMethods );
    }catch(e){
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}

exports.createWithdrawalRequest = async (req, res) => {
    try {
        const user = req.user;
        let reqParam = req.body;
        
        // Check for Role Access
        if(user.role == 1) return responseHelper.error(res, res.__("UserRoleNotValid"), FAILURE);

        // validate request
        let validationMessage = await userValidation.createWithdrawalRequestValidation(reqParam);
        if(validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);

        // Check for Existence Of Payment Method
        let existingPaymentMethods = user.vendorDetails.paymentMethods;
        let isAvailable = existingPaymentMethods.some((val) => val._id.equals(reqParam.paymentMethodId));

        if(!isAvailable) return responseHelper.error(res, res.__("PaymentMethodDoesn'tExist"), FAILURE);
        
        // Check For Sufficient Withdrawable Balance
        let isEligible = false
        if(user.vendorDetails.hasOwnProperty("balance") && user.vendorDetails.balance.hasOwnProperty("withdrawableBalance") && user.vendorDetails.balance.hasOwnProperty("availableBalance")) {
            if(parseFloat(user.vendorDetails.balance.withdrawableBalance) > parseFloat(reqParam.amount) && parseFloat(user.vendorDetails.balance.availableBalance) > parseFloat(reqParam.amount)) {
                isEligible = true
            }
        }

        if(!isEligible) return responseHelper.error(res, res.__("InsufficientFunds"), FAILURE);

        let currentDate = dayjs().format("YYYY-MM-DD");
        let ISOString = dayjs(new Date(currentDate)).toISOString();

        // change wallet balance and update user table
        let updatedUser = await updateWalletOnRaiseWithdrawalRequest(user._id,reqParam.amount); 
        if(!updatedUser) return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), FAILURE);

        //creating request object
        let withdrawalRequest = WithdrawalRequestModel({
            vendorId : user._id,
            paymentMethodId : reqParam.paymentMethodId,
            requestedDate : ISOString,
            amount : reqParam.amount,
            transferId : "",
            transferDate : "",
            status : "requested",
            remark : ""
        });

        //save request
        let savedRequest = await withdrawalRequest.save();

        return responseHelper.successapi(res, res.__("Success"), SUCCESS, savedRequest);
    }catch(e){
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}

// TODO : Add Pagination functionality
exports.getAllWithdrawalRequest = async (req, res) => {
    try {
        const user = req.user;
        let reqParam = req.query;
        
        // Check for Role Access
        if(user.role === 1 || user.role === 2) return responseHelper.error(res, res.__("UserRoleNotValid"), FAILURE);

        // validate request
        let validationMessage = await userValidation.getAllWithdrawalRequestValidation(reqParam);
        if(validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);
        
        const { limitCount, skipCount } = helper.getPageAndLimit(reqParam.page,reqParam.limit);

        let queryParams = {
            skip: skipCount,
            limit: limitCount,
            status : reqParam.status
        }

        // Find Withdrwal Requests
        let withdrawalRequests = await getAllWithdrawalRequests(queryParams);
        if(!withdrawalRequests[0].data.length) return responseHelper.error(res, res.__("RecordsNotFound"), FAILURE);

        console.log(withdrawalRequests,"withdrawalRequests");

        return responseHelper.successapi(res, res.__("Success"), SUCCESS, withdrawalRequests[0] );
    }catch(e){
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}

exports.updateWithdrawalRequest = async (req, res) => {
    try {
        const user = req.user;
        let reqParam = req.body;
        // Check for Role Access
        if(user.role === 1 || user.role === 2) return responseHelper.error(res, res.__("UserRoleNotValid"), FAILURE);

        // validate request
        let validationMessage = await userValidation.updateWithdrawalRequestValidation(reqParam);
        if(validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);

        // Find Withdrwal Requests
        let withdrawalRequest = await WithdrawalRequestModel.findOne({ _id : ObjectId(reqParam.referenceId) });
        if(!withdrawalRequest) return responseHelper.error(res, res.__("WithdrawalRequestNotFound"), FAILURE);
        
        if(reqParam.status === "completed") {
            // change wallet balance and update user table
            let updatedUser = await updateWalletAfterCompletedWithdrawalRequest(withdrawalRequest.vendorId,withdrawalRequest.amount); 
            if(!updatedUser) return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), FAILURE);
        }

        if(reqParam.status === "rejected") {
            // change wallet balance and update user table
            let updatedUser = await updateWalletOnRejectWithdrawalRequest(withdrawalRequest.vendorId,withdrawalRequest.amount); 
            if(!updatedUser) return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), FAILURE);
        }

        // update withdrwal request here
        withdrawalRequest.transferId = reqParam.transferId ? reqParam.transferId : withdrawalRequest.transferId;
        withdrawalRequest.transferDate = reqParam.transferDate ? reqParam.transferDate : withdrawalRequest.transferDate;
        withdrawalRequest.status = reqParam.status ? reqParam.status : withdrawalRequest.status;
        withdrawalRequest.remark = reqParam.remark ? reqParam.remark : withdrawalRequest.remark;

        let updatedWithdrawalRequest = await withdrawalRequest.save();

        return responseHelper.successapi(res, res.__("Success"), SUCCESS, updatedWithdrawalRequest );
    }catch(e){
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}

// TODO : Add Pagination functionality
exports.getWithdrawalRequestHistoryByVendor = async (req, res) => {
    try {
        const user = req.user;
        let reqParam = req.query;
        

        // Check for Role Access
        if(user.role === 1) return responseHelper.error(res, res.__("UserRoleNotValid"), FAILURE);

        reqParam.role = user.role;
        // validate request
        let validationMessage = await userValidation.getWithdrawalRequestHistoryByVendorValidation(reqParam);
        if(validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);       

        const { limitCount, skipCount } = helper.getPageAndLimit(reqParam.page,reqParam.limit);

        let queryParams = {
            skip: skipCount,
            limit: limitCount,
            userId : (user.role === 3 || user.role === 4) ? reqParam.vendorId : user.role === 2 &&  user._id,
            status : reqParam.status
        }


        // Find Withdrwal Requests
        let withdrawalRequests = await getWithdrawalRequestByVendor(queryParams);
        console.log(withdrawalRequests,"withdrawalRequests");

        // if(!withdrawalRequests[0].data.length) return responseHelper.error(res, res.__("RecordsNotFound"), FAILURE);

        let findUser = await UserModel.findById((user.role === 3 || user.role === 4) ? ObjectId(reqParam.vendorId) : user._id);
        if(!findUser) return responseHelper.error(res, res.__("UserNotFound"), FAILURE);

        let combinedRecords = {
            balance : findUser.vendorDetails.balance,
            withdrawalRequests : withdrawalRequests?.length ? withdrawalRequests[0] : []
        }

        return responseHelper.successapi(res, res.__("Success"), SUCCESS, combinedRecords );
    }catch(e){
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}

exports.getBookingPaymentHistory = async (req, res) => {
    try {
        const user = req.user;
        let reqParam = req.query;
        
        // Check for Role Access
        if(user.role === 1) return responseHelper.error(res, res.__("UserRoleNotValid"), FAILURE);

        reqParam.role = user.role;
        // validate request
        let validationMessage = await userValidation.getBookingPaymentHistoryValidation(reqParam);
        if(validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);

        const { limitCount, skipCount } = helper.getPageAndLimit(reqParam.page,reqParam.limit);

        let queryParams = {
            skip: skipCount,
            limit: limitCount,
            userId : (user.role === 3 || user.role === 4) ? reqParam.vendorId : user.role === 2 && user._id,
            status : reqParam.status
        }

        // Find Booking Payment History
        let bookingPaymentHistory = await getBookingPaymentHistory(queryParams);

        if(!bookingPaymentHistory[0].data.length) return responseHelper.error(res, res.__("RecordsNotFound"), FAILURE);

        return responseHelper.successapi(res, res.__("Success"), SUCCESS, bookingPaymentHistory[0] );
    }catch(e){
        console.log('error ', e);
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}

exports.getAllVerifiedVendors = async (req, res) => {
    try {
        const user = req.user;
        
        // Check for Role Access
        if(user.role == 1 || user.role == 2) return responseHelper.error(res, res.__("UserRoleNotValid"), FAILURE);

        // Find User
        let findUser = await getAllVerifiedVendors();
        if(!findUser) return responseHelper.error(res, res.__("VerifiedVendorNotFound"), FAILURE);
        
        return responseHelper.successapi(res, res.__("Success"), SUCCESS, findUser );
    }catch(e){
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}

// get current apps versions
exports.versionsDetails = async (req, res) => {
    try{
        const versions = {
            "android_client": {
                "isUnderMaintenance": false,
                "isUpdateAvailable": false,
                "newVersion": "1035"
            },
            "ios_client": {
                "isUnderMaintenance": false,
                "isUpdateAvailable": false,
                "newVersion": "21"
            },
            "android_vendor": {
                "isUnderMaintenance": false,
                "isUpdateAvailable": true,
                "newVersion": "2028"
            },
            "ios_vendor": {
                "isUnderMaintenance": false,
                "isUpdateAvailable": false,
                "newVersion": "21"
            }
        }

        return responseHelper.successapi(res, res.__("Success"), SUCCESS, versions);
    }catch(error){
        console.log('error ', error);
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}

exports.userDashboard = async (req, res) => {
    try{
        const user = req.user;

        // Check for Role Access
        // This is accessible for only vendor
        if(user.role == 2 || user.role == 3) return responseHelper.error(res, res.__("UserRoleNotValid"), FAILURE);

        const { limitCount, skipCount } = helper.getPageAndLimit(1,10);


        let currentDate = dayjs().format("YYYY-MM-DD");
        let ISOString = dayjs(new Date(currentDate)).toISOString();

        let queryParams = {
            skip: skipCount,
            limit: limitCount,
            currentDate : new Date(ISOString),
            userId : user._id,
            isCompleted : ["Upcoming"]
        }
            
        let bookingDetails = await getTodaysBookingsForUser(queryParams);
        let responseData = serviceBookingTransformer.transformGetBookingsByUser(bookingDetails[0]?.data);
        if(!responseData?.length) {
            responseData = {}
        }
        return responseHelper.successapi(res, res.__("Success"), SUCCESS, responseData);
    }catch(error){
        console.log('error : ', error);
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}

exports.verifyVendor = async (req, res) => {
    try {
        const user = req.user;
        let reqParam = req.query;
        reqParam.verify = reqParam.verify === "true" ? true : reqParam.verify === "false" && false;
        
        // Check for Role Access
        if(user.role == 1 || user.role == 2) return responseHelper.error(res, res.__("UserRoleNotValid"), FAILURE);

        // validate request
        let validationMessage = await userValidation.verifyVendorValidation(reqParam);
        if(validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);

        // Find User
        let findUser = await UserModel.findById(reqParam.vendorId);
        if(!findUser) return responseHelper.error(res, res.__("UserNotFound"), FAILURE);

        if(findUser.role !== 2) return responseHelper.error(res, res.__("roleMustBeVendor"), FAILURE);

        if(findUser.vendorDetails.hasOwnProperty("isVerified") && findUser.vendorDetails.isVerified !== undefined) {
            if(findUser.vendorDetails.isVerified && reqParam.verify) {
                return responseHelper.error(res, res.__("vendorIsAlreadyVerified"), FAILURE);
            }
            if(!findUser.vendorDetails.isVerified && !reqParam.verify) {
                return responseHelper.error(res, res.__("vendorIsAlreadyUnverified"), FAILURE);
            }
        }

        if(findUser.vendorDetails.hasOwnProperty("providerType") && findUser.vendorDetails.providerType === 1 && reqParam.verify === false) {
            return responseHelper.error(res, res.__("placeVendorsWillAlwaysBeVerified"), FAILURE);
        }

        if(findUser.vendorDetails.hasOwnProperty("providerType") && (findUser.vendorDetails.providerType === 2 || findUser.vendorDetails.providerType === 3)) {
            let findVendorService = await VendorServiceModel.findOne({ userId : ObjectId(reqParam.vendorId)})
            findVendorService.available = reqParam.verify;
            await findVendorService.save();
        }

        findUser.vendorDetails.isVerified = reqParam.verify;

        let verifiedVendor = await findUser.save();

        return responseHelper.successapi(res, res.__("Success"), SUCCESS, verifiedVendor );
    }catch(e){
        console.log(e,"error")
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}

exports.deleteVendor = async (req, res) => {
    try {
        const user = req.user;
        let reqParam = req.query;
        
        // Check for Role Access
        if(user.role == 1 || user.role == 2 || user.role == 3) return responseHelper.error(res, res.__("UserRoleNotValid"), FAILURE);

        // validate request
        let validationMessage = await userValidation.deleteVendorValidation(reqParam);
        if(validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);

        // Find Vendor
        let findVendor = await UserModel.findOne({ _id : ObjectId(reqParam.vendorId) } );
        if(!findVendor) return responseHelper.error(res, res.__("UserNotFound"), FAILURE);

        console.log(findVendor,"findVendor");

        if(findVendor.vendorDetails.hasOwnProperty("providerType") && findVendor.vendorDetails.providerType !== undefined) {
            // check for upcomingEvents
            let upcomingEvents = await fetchUpcomingEventForDeleteVendor(reqParam.vendorId,findVendor.vendorDetails.providerType);
            if(upcomingEvents.length > 0) return responseHelper.error(res, res.__("UpcomingEventAvailable"), FAILURE);
            console.log(upcomingEvents,"upcomingEvents");
        }

        // Delete Vendor
        let deleteVendor = await UserModel.findByIdAndDelete(reqParam.vendorId);

        // Success Response
        if(deleteVendor) return responseHelper.successapi(res, res.__("SuccessDeletedVendor"), SUCCESS, deleteVendor);

        // Error Response
        return responseHelper.error(res, res.__("errorDeleteVendor"), FAILURE);
    }catch(e){
        console.log(e,"error")
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}

exports.sendNotificationToSpecifiedVendor = async (req, res) => {
    try {
        const user = req.user;
        let reqParam = req.body;

        // Check for Role Access
        if(user.role === 1 || user.role === 2) return responseHelper.error(res, res.__("UserRoleNotValid"), FAILURE);

        // validate request
        let validationMessage = await userValidation.sendNotificationValidation(reqParam);
        if(validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);
                
        let vendorNotification = await notificationService.sendPushNotificationToSpecificVendor(reqParam);
        console.log('notifictions to specified vendor : ', vendorNotification);

        if(!vendorNotification) {
            return responseHelper.successapi(res, res.__("invalidVendorIdORdeviceIdNotFound"), SUCCESS, null);
        }

        return responseHelper.successapi(res, res.__("Success"), SUCCESS, vendorNotification );
    }catch(e){
        console.log(e,"error");
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}

exports.sendMail = async (req, res) => {
    try {
        const user = req.user;
        let reqParam = req.body;

        // Check for Role Access
        if(user.role === 1 || user.role === 2) return responseHelper.error(res, res.__("UserRoleNotValid"), FAILURE);

        // validate request
        let validationMessage = await userValidation.sendMail(reqParam);
        if(validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);

        // Find Vendor with given Email id
        let findVendor = await UserModel.find({ email : { $in: reqParam.email }, role : 2 });
        if(!findVendor) return responseHelper.error(res, res.__("VendorNotFound"), FAILURE);

        let emailCollection = findVendor.map((element) => element.email);

        reqParam.emailCollection = emailCollection;

        var locals = {
            text: reqParam.message,
        };

        const emailBody = await ejs.renderFile(
            path.join(__dirname, "../views/emails/forgotPassword", "forgot-password.ejs"),
            { locals: locals },
        );
        
        await Mailer.sendMailToSpecificVendor(reqParam,emailBody);

        return responseHelper.successapi(res, res.__("EmailSentSuccessfully"), SUCCESS);
    }catch(e){
        console.log(e,"error")
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}