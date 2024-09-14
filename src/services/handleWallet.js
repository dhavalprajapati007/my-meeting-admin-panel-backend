const {
    changeAvailableBalance,
    changeWithdrawableBalance,
    changeTotalPayout,
    changeTotalRevenue,
    getWalletDetails,
    updateUser
} = require("../helpers/payment.helper");

module.exports.updateWalletOnCreateBooking = async (userId, amount) => {
    let walletBalance = await getWalletDetails(userId);
        
    walletBalance.availableBalance = await changeAvailableBalance(walletBalance.availableBalance,amount,"add");
    walletBalance.totalRevenue = await changeTotalRevenue(walletBalance.totalRevenue,amount,"add");

    // save updated vendor details in user table
    let updatedUser = await updateUser(userId,walletBalance)
    if(!updatedUser) return false;
    return updatedUser
}

// we can use this on Refund
module.exports.updateWalletOnCancelBooking = async (userId, amount) => {
    let walletBalance = await getWalletDetails(userId);
        
    walletBalance.availableBalance = await changeAvailableBalance(walletBalance.availableBalance,amount,"deduct");
    walletBalance.totalRevenue = await changeTotalRevenue(walletBalance.totalRevenue,amount,"deduct")

    // save updated vendor details in user table
    let updatedUser = await updateUser(userId,walletBalance)
    if(!updatedUser) return false;
    return updatedUser
}

module.exports.updateWalletAfterCompletedBookedEvent = async (userId, amount) => {
    let walletBalance = await getWalletDetails(userId);
        
    walletBalance.withdrawableBalance = await changeWithdrawableBalance(walletBalance.withdrawableBalance,amount,"add");

    // save updated vendor details in user table
    let updatedUser = await updateUser(userId,walletBalance)
    if(!updatedUser) return false;
    return updatedUser
}

module.exports.updateWalletOnRaiseWithdrawalRequest = async (userId, amount) => {
    let walletBalance = await getWalletDetails(userId);
        
    walletBalance.availableBalance = await changeAvailableBalance(walletBalance.availableBalance,amount,"deduct");
    walletBalance.withdrawableBalance = await changeWithdrawableBalance(walletBalance.withdrawableBalance,amount,"deduct");

    // save updated vendor details in user table
    let updatedUser = await updateUser(userId,walletBalance)
    if(!updatedUser) return false;
    return updatedUser
}

module.exports.updateWalletOnRejectWithdrawalRequest = async (userId, amount) => {
    let walletBalance = await getWalletDetails(userId);
        
    walletBalance.availableBalance = await changeAvailableBalance(walletBalance.availableBalance,amount,"add");
    walletBalance.withdrawableBalance = await changeWithdrawableBalance(walletBalance.withdrawableBalance,amount,"add");

    // save updated vendor details in user table
    let updatedUser = await updateUser(userId,walletBalance)
    if(!updatedUser) return false;
    return updatedUser
}

module.exports.updateWalletAfterCompletedWithdrawalRequest = async (userId, amount) => {
    let walletBalance = await getWalletDetails(userId);
        
    walletBalance.totalPayout = await changeTotalPayout(walletBalance.totalPayout,amount,"add");

    // save updated vendor details in user table
    let updatedUser = await updateUser(userId,walletBalance)
    if(!updatedUser) return false;
    return updatedUser
}