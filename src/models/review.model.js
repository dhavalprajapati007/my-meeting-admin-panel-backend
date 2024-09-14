const mongoose = require('mongoose');
const ReviewSchema = mongoose.Schema({
    serviceBookingId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'servicebooking'
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        ref: 'users'
    },
    vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        ref: 'users'
    },
    comment: {
        type: String,
        required: true
    },
    review: {
        type: Number,
        required: true,
        enum: [1, 2, 3, 4, 5]
    },
    status: {
        type: Number,
        default: 1,
        enum: [1, 2, 3]	//1 = Active 2 = InActive 3 = Deleted
    }
}, { collection: 'reviews', timestamps: true });

module.exports = mongoose.model('reviews', ReviewSchema);