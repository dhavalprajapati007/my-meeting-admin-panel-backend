const mongoose = require('mongoose');

const withdrawalRequestSchema = mongoose.Schema({
    vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    paymentMethodId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    requestedDate : {
        type : Date,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    transferId: {
        type: String,
        required: false
    },
    transferDate : {
        type : Date,
        required: false
    },
    status : {
        type: String,
        default: 'requested',
        enum: ['requested', 'in-progress',"completed","rejected"],
    },
    remark: {
        type: String,
        required: false
    }
}, { collection: 'withdrawalRequest', timestamps: true });

module.exports = mongoose.model('withdrawalRequest', withdrawalRequestSchema);