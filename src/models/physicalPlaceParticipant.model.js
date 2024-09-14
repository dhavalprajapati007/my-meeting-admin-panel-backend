const mongoose = require('mongoose');
const PhysicalPlaceParticipantSchema = mongoose.Schema({
    serviceBookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'serviceBooking',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
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
    isRegistered: {
        type: Boolean,
        required: true
    },
    userName : {
        type: String
    },
    contactNumber : {
        type: Number
    },
    status: {
        type: Number,
        default: 1,
        enum: [1, 2, 3]	//1 = Active 2 = InActive 3 = Deleted
    }
}, { collection: 'physicalPlaceParticipants', timestamps: true });

module.exports = mongoose.model('physicalPlaceParticipants', PhysicalPlaceParticipantSchema);