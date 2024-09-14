const e = require("express");
const { SERVERERROR, STRIPE_KEY } = require("../../config/key");
const stripe = require('stripe')(STRIPE_KEY);
const responseHelper = require("../helpers/responseHelper");

const createPaymentIntent = async (paymentDetails) => {
    try {
        var paymentIntents = await stripe.paymentIntents.create({
            amount: parseInt(paymentDetails.amount * 100),
            currency: paymentDetails.currency,
            payment_method_types: ['card']
        });
        return paymentIntents;
    } catch (e) {
        console.log('error', e, '-----------------END--------------');
        return e;
    }
}

const listMerchantPayments = async (merchantDetails) => {
    try {
        let fees = [];
        let isFirstIterate = true; 
        do {
            if(isFirstIterate){
                var feesData = await stripe.applicationFees.list();
                isFirstIterate = false;
            } else {
                var feesData = await stripe.applicationFees.list({
                    starting_after : fees[fees.length-1].id
                });
            }
            await feesData.data.forEach(fee => {
                fees.push(fee);
            });
        } while (feesData.has_more === true)
        console.log(fees.length);
        
        const filterArray = [];
        for (let i = 0; i < fees.length; i++) {
            if(fees[i].account == merchantDetails.stripeId){
                filterArray.push(fees[i]);
            }
        }
        console.log(filterArray.length);
        return filterArray
    } catch (e) {
        console.log('error', e);
        return e;
    }
}

const createRefund = async (paymentIntentId,amount,refund_application_fee) => {
    try{
      var refund = await stripe.refunds.create({
        // charge: charge_id,
        payment_intent: paymentIntentId
        // refund_application_fee: refund_application_fee,
        // amount: amount
      }).catch(error => {
        throw error;
      });
      return refund;
    } catch (error) {
      throw error;
    }
}

const listAllTransactions = async (starting_after, limit) => {
    try{
        let param = {};
        if(starting_after){
            param = {
                starting_after,
                limit
            }
        }else{
            param = {
                limit
            }
        }

        const transfers = await stripe.transfers.list(param);
        return transfers;
    }catch(error){
        throw error;
    }
}

// retriveRefund = async (refund_id) => {
//     try{
//       return await stripe.refunds.retrieve(refund_id,function(err, refund){
//         if(err) return err;
//         if(refund) return refund;
//       });
//     } catch (error) {
//       return error;
//     }
// }

//   updateRefund = async (refund_id,metadata) => {
//     try{
//       return await stripe.refunds.update(refund_id,{metadata},function(err, refund){
//         if(err) return err;
//         if(refund) return refund;
//       });
//     } catch (error) {
//       return error;
//     }
//   }

//   listAllRefunds = async (limit) => {
//     try{
//       return await stripe.refunds.list({limit},function(err, refunds){
//         if(err) return err;
//         if(refunds) return refunds;
//       })
//     } catch (error) {
//       return error;
//     }
//   }


module.exports = { 
    createPaymentIntent,
    listMerchantPayments,
    createRefund,
    listAllTransactions
}