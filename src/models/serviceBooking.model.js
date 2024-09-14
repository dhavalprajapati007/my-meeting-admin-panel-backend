const mongoose = require('mongoose');

const ServiceBookingSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    duration: {
        startTime: {
            type: Date
        },
        endTime: {
            type: Date
        }
    },
    date: {
        type: Date,
    },
    serviceId: {
        type: mongoose.Schema.Types.ObjectId
    },
    serviceProviderId: {
        type: mongoose.Schema.Types.ObjectId
    },
    placeBookingDetails: {
        vendorId: {
            type: mongoose.Schema.Types.ObjectId
        },
        officeId: {
            type: mongoose.Schema.Types.ObjectId
        },
        cabinId: {
            type: mongoose.Schema.Types.ObjectId
        }
    },
    paymentDetails: {
        totalAmount: {
            type: Number
        },
        placeVendorAmount: {
            type: Number
        },
        serviceVendorAmount: {
            type: Number
        },
        platformFee: {
            type: Number
        },
        invoiceDetail: {
            summaryDuration: {
                type: Number
            },
            placeVendorAmount: {
                type: Number
            },
            serviceVendorAmount: {
                type: Number
            },
            serviceCharge: {
                type: Number
            },
            subTotal: {
                type: Number
            },
            gst: {
                type: Number
            },
            total: {
                type: Number
            }
        },
        referenceId: {
            type: String
        },
        transactionType : {
            type: String
        }
    },
    serviceVerificationCode: {
        type: String
    },
    placeVerificationCode: {
        type: String,
    },
    physicalType: {
        type: Number,
        enum: [1, 2], // 1 = express  2 = scheduled 
    },
    category: {
        type: Number,
        enum: [1, 2, 3], // 1 = personal 2 = official 3 = both
    },
    isServiceVerified : {
        type: Number,
        default: 0,
        enum: [0, 1], // 0 = false 1 = true
    },
    isPlaceVerified : {
        type: Number,
        default: 0,
        enum: [0, 1], // 0 = false 1 = true
    },
    isCompleted : {
        type: String,
        default: 'Upcoming',
        enum: ['Upcoming', 'Completed', 'Cancelled','In-Progress','Unattended'],
    },
    addressCordinater: {
        lat: {
            type: String
        },
        lang: {
            type: String
        }
    },
    serviceType: {
        type: Number,
        enum: [1, 2, 3], //1 = phisycalPlace  2 = phisycalPlaceWithService 3 = virtualService
    },
    status: {
        type: Number,
        default: 1,
        enum: [1, 2, 3]	//1 = Incomming 2 = Done 3 = Cancelled
    },
}, { collection: 'serviceBooking', timestamps: true });

module.exports = mongoose.model('serviceBooking', ServiceBookingSchema);