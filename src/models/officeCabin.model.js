const mongoose = require('mongoose');
const OfficeCabinsSchema = mongoose.Schema({
    officeId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'offices'
    },
    price: {
        type: Number,
        required: true
    },
    capacity: {
        type: Number,
        required: true
    },
    prefrences: {
        type: Number,
        default: 1,
        enum: [1, 2, 3]	//1 = Personal 2 = Official 3 = Both
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    amenitieIds : {
       type: [mongoose.Schema.Types.ObjectId],
       ref: 'amenities'
    },
    images: {
        type: [String]
    },
    status: {
        type: Number,
        default: 1,
        enum: [1, 2, 3]	//1 = Active 2 = InActive 3 = Deleted
    }
},{ collection: 'officeCabins', timestamps: true });
module.exports = mongoose.model('officeCabins', OfficeCabinsSchema);