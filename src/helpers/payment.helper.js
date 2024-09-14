const UserModel = require("../models/user.model");
const { DELETED_STATUS } = require("../../config/key");

module.exports.getWalletDetails = async(userId) => {
    let findVendor = await UserModel.findById(userId);
    if(!findVendor) return false;
    return findVendor.vendorDetails.balance
}

module.exports.updateUser = async(userId, walletBalance) => {
    let savedUser = await UserModel.findByIdAndUpdate(userId, { "vendorDetails.balance" : walletBalance })
    if(!savedUser) return false;
    return savedUser
}

module.exports.changeWithdrawableBalance = async (withdrawableAmount, amount, type) => {
    if(type === "add") {
        withdrawableAmount = withdrawableAmount + amount;
    }else {
        withdrawableAmount = withdrawableAmount - amount;
    }
    return withdrawableAmount
}

module.exports.changeAvailableBalance = async (availableAmount, amount, type) => {
    if(type === "add") {
        availableAmount = availableAmount + amount;
    }else {
        availableAmount = availableAmount - amount;
    }
    return availableAmount
}

module.exports.changeTotalPayout = async (currentPayout, amount, type) => {
    if(type === "add") {
        currentPayout = currentPayout + amount;
    }else {
        currentPayout = currentPayout - amount;
    }
    return currentPayout
}

module.exports.changeTotalRevenue = async (currentRevenue, amount, type) => {
    if(type === "add") {
        currentRevenue = currentRevenue + amount;
    }else {
        currentRevenue = currentRevenue - amount;
    }
    return currentRevenue
}