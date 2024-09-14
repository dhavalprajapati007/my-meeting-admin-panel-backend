const mongoose = require('mongoose');
const ServicesSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        ref: 'services'
    },
    image: {
        type: String,
    },
    status: {
        type: Number,
        default: 1,
        enum: [1, 2, 3]	//1 = Active 2 = InActive 3 = Deleted
    }
}, { collection: 'services', timestamps: true });

module.exports = mongoose.model('services', ServicesSchema);