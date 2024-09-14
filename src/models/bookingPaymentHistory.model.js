const mongoose = require('mongoose');

const bookingPaymentHistorySchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'serviceBooking'
    },
    stripePaymentRef: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    status : {
        type: String,
        enum: ['refund', 'payment'],
    },
    remark : {
        type: String,
        required: false
    }
}, { collection: 'bookingPaymentHistory', timestamps: true });

module.exports = mongoose.model('bookingPaymentHistory', bookingPaymentHistorySchema);