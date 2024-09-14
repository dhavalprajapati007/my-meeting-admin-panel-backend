const mongoose = require('mongoose');
const VendorServiceSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    serviceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'services',
        required: true
    },
    bio: {
        type: String,
        required: true
    },
    instruction: {
        type: String,
        default: null
    },
    fees: {
        virtualSilver : {
            type: Number
        },
        virtualGold : {
            type: Number
        },
        physicalSilver : {
            type: Number
        }
    },
    prefrence : { // serviceType
        type: Number,
        required: true,
        enum: [1, 2, 3] // 1 = Physical, 2 = Virtual, 3 = Both
    },
    certificates: {
        type: [String],
    },
    languages: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'languages'
    },
    available: {
        type: Boolean,
        default: true
    },
    status: {
        type: Number,
        default: 1,
        enum: [1, 2, 3]	//1 = Active 2 = InActive 3 = Deleted
    }
}, { collection: 'vendorService', timestamps: true });

module.exports = mongoose.model('vendorService', VendorServiceSchema);