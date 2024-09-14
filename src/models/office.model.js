const mongoose = require('mongoose');
const OfficesSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'users'
    },
    name: {
        type: String,
        required: true
    },
    address: {
        line1: {
            type: String,
        },
        line2: {
            type: String,
        },
        city:{
            type: String,
        },
        state:{
            type: String,
        },
        pincode:{
            type: Number,
        }
    },
    addressCordinater: {
        type: {
            type: String, // always point
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number] // long, lat
        }
    },
    representativeDetails: {
        name: {
            type: String
        },
        number: {
            type: String
        }
    },
    officeType : {
        type: String,
        default: 'both',
        enum: ['schedule', 'express', 'both'],
    },
    isKycCompleted:{
        type: Boolean,
    },
    officeContactNumber:{
        type: Number
    },
    workingDays:{
        type: [Boolean]
    },
    status: {
        type: Number,
        default: 1,
        enum: [1, 2, 3]	//1 = Active 2 = InActive 3 = Deleted
    }
}, { collection: 'offices', timestamps: true });

// OfficesSchema.createIndex({addressCordinater:"2dsphere"});

module.exports = mongoose.model('offices', OfficesSchema);