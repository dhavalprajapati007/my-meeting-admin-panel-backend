const responseHelper = require("../helpers/responseHelper");
const ChatModel = require("../models/chat.model");
const UserModel = require("../models/user.model");
const chatValidation = require("../services/validations/chat/chat.validation");
const { findExistingChat, getChats } = require("../services/chat/chat.service");
const chatTransformer = require("../transformers/chat/chatTransformer")
const {
    SERVERERROR,
    UNAUTHORIZED,
    SUCCESS,
    FAILURE
} = require("../../config/key");

exports.chatList = async (req, res) => {
    try {
        const user = req.user;

        // Check for Role Access
        if(user.role === 3 || user.role === 4) return responseHelper.error(res, res.__("UserRoleNotValid"), FAILURE);

        // Get Chat List
        let getChatList = await getChats(user._id);

        //response data manipulation 
        let responseData = chatTransformer.transformListCollection(getChatList);

        return responseHelper.successapi(res, res.__("Success"), SUCCESS, responseData);
    }catch(e){
        console.log(e,"error")
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}

exports.startChat = async (req, res) => {
    try {
        const user = req.user;
        let reqParam = req.body;

        // Check for Role Access
        if(user.role !== 1) return responseHelper.error(res, res.__("UserRoleNotValid"), FAILURE);

        // validate request
        let validationMessage = await chatValidation.startChatValidation(reqParam);
        if(validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);

        let findUser = await UserModel.findById(reqParam.vendorId);
        if(!findUser) return responseHelper.error(res, res.__(`UserNotFound with Id ${reqParam.vendorId}`), FAILURE);
        if(findUser.role === 3 || findUser.role === 4) return responseHelper.error(res, res.__("InvalidUserRole-MustBeUserOrVendor"), FAILURE);

        let userIdDetail = {
            user1_id : user._id,
            user2_id : findUser._id
        }
        
        // Find Chat
        let findChat = await findExistingChat(userIdDetail);
        if(findChat?.length > 0) return responseHelper.successapi(res, res.__("Success"), SUCCESS, findChat );

        //creating new chat
        let chat = ChatModel({
            user1_id : userIdDetail.user1_id,
            user2_id : userIdDetail.user2_id,
            messages : [],
            // createdTime : TODO --> Add created time as well
        });

        //save chat in db
        let savedChat = await chat.save();

        return responseHelper.successapi(res, res.__("Success"), SUCCESS, savedChat );
    }catch(e){
        console.log(e,"error")
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}

exports.chatHistory = async (req, res) => {
    try {

        const user = req.user;
        let reqParam = req.query;
        console.log(user.role,"userRole");

        // Check for Role Access
        if(user.role === 3 || user.role === 4) return responseHelper.error(res, res.__("UserRoleNotValid"), FAILURE);

        // validate request
        let validationMessage = await chatValidation.chatHistoryValidation(reqParam);
        if(validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);

        // Find Chat
        let findChat = await ChatModel.findById(reqParam.chatId);
        if(!findChat) return responseHelper.error(res, res.__("ChatNotFound"), FAILURE);

        // if user is vendor or User then check for its existence in coversation
        if(user.role === 1 || user.role === 2) {
            if(!(user._id.equals(findChat?.user1_id) || user._id.equals(findChat?.user2_id))) {
                return responseHelper.error(res, res.__("UserNotFoundInChat"), FAILURE);
            }
        }

        // update chats isRead flag to true, where _id is chatId and authorId isn't given Id
        await ChatModel.updateMany(
            { 
                _id : findChat._id,
            },
            { $set: { "messages.$[elem].isRead" : true } },
            {
                multi: true,
                arrayFilters: [ { "elem.authorId": { $ne: user._id }, "elem.isRead" : false } ]
            }
        )

        let updatedChat = await ChatModel.findById(reqParam.chatId);

        return responseHelper.successapi(res, res.__("Success"), SUCCESS, updatedChat);
    }catch(e){
        console.log(e,"error")
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}

exports.send = async (req, res) => {
    try {
        const user = req.user;
        let reqParam = req.body;

        // Check for Role Access
        if(user.role === 3 || user.role === 4) return responseHelper.error(res, res.__("UserRoleNotValid"), FAILURE);

        // validate request
        let validationMessage = await chatValidation.sendChatValidation(reqParam);
        if(validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);

        // Find Chat
        let findChat = await ChatModel.findById(reqParam.chatId);
        if(!findChat) return responseHelper.error(res, res.__("ChatNotFoundWithGivenId"), FAILURE);

        // check that user is Exist in Chat history
        if(user.role === 1 || user.role === 2) {
            if(!(user._id.equals(findChat?.user1_id) || user._id.equals(findChat?.user2_id))) return responseHelper.error(res, res.__("UserNotFoundInChat"), FAILURE);
        }
        
        let updatedMessage = reqParam.message;
        
        // Extract url from a string
        let URLRegex = /(?:(?:https?|ftp):\/\/|\b(?:[a-z\d]+\.))(?:(?:[^\s()<>]+|\((?:[^\s()<>]+|(?:\([^\s()<>]+\)))?\))+(?:\((?:[^\s()<>]+|(?:\(?:[^\s()<>]+\)))?\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))?/ig;
        let phoneRegex = /\+?[1-9][0-9]{7,14}/g;
        let emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/ig;
        let userNameRegex = /\b\w*_\w*\b/ig;
        let digitOccuranceRegex = /[0-9]/g;

        updatedMessage = updatedMessage.replace(emailRegex,"************");
        updatedMessage = updatedMessage.replace(URLRegex,"************");
        updatedMessage = updatedMessage.replace(phoneRegex,"************");
        updatedMessage = updatedMessage.replace(userNameRegex,"********");

        if(updatedMessage.match(digitOccuranceRegex)?.length >= 7) {
            updatedMessage = updatedMessage.replace(digitOccuranceRegex,"**");
        }


        let chatObj = {
            authorId : user._id,
            messageContent : updatedMessage,
            isRead : reqParam.isRead,
            createdTime : reqParam.time
        }

        // add new chat message object into messages Array in the Given ChatId
        findChat?.messages?.push(chatObj);

        let updatedChat = await findChat.save();
        return responseHelper.successapi(res, res.__("Success"), SUCCESS, updatedChat );
    }catch(e){
        console.log(e,"error")
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
    }
}