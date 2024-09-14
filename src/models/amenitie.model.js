const mongoose = require('mongoose');
const AmenitiesSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: false
    },
    status: {
        type: Number,
        default: 1,
        enum: [1, 2, 3]	//1 = Active 2 = InActive 3 = Deleted
    }
},{ collection: 'amenities', timestamps: true });
module.exports = mongoose.model('amenities', AmenitiesSchema);