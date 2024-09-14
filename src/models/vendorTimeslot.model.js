const mongoose = require('mongoose');
const VendorTimeslotSchema = mongoose.Schema({
    sessionTime: {
        type: Number,
        required: true
    },
    interval: {
        type: Number,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    availableSlots: {
        type: Array,
        default: []
    },
    status: {
        type: Number,
        default: 1,
        enum: [1, 2, 3]	//1 = Active 2 = InActive 3 = Deleted
    }
}, { collection: 'vendorTimeslots', timestamps: true });

module.exports = mongoose.model('vendorTimeslots', VendorTimeslotSchema);