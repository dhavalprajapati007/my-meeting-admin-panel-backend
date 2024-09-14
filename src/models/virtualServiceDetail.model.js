const mongoose = require('mongoose');
const VertualServiceDetailSchema = mongoose.Schema({
    serviceBookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'serviceBooking',
        required: true
    },
    uniqueName: {
        type: Number,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    webinar: {
        roomId: {
            type: String,
            default: ""
        },
        expertId : {
            type: String,
            default: ""
        },
        webKey: {
            type: String,
            default: ""
        },
        fileName: {
            type: String,
            default: ""
        }
    },
    totalParticipants: {
        type: Number,
        default: 2
    },
    virtualServiceType: {
        type : Number,
        required: true,
        enum: [1, 2] // 1 = virtualSilver, 2 = virtualGold
    },
    instrucationAnswer: {
        type: String,
        default: null
    },
    status: {
        type: Number,
        default: 1,
        enum: [1, 2, 3]	//1 = Active 2 = InActive 3 = Deleted
    }
}, { collection: 'virtualServiceDetails', timestamps: true });

module.exports = mongoose.model('virtualServiceDetails', VertualServiceDetailSchema);