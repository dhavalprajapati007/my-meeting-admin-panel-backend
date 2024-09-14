const mongoose = require('mongoose');
const ContactUsSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'users'
    },
    subject: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true
    },
    status: {
        type: Number,
        default: 1,
        enum: [1, 2, 3]	//1 = Active 2 = InActive 3 = Deleted
    }
},{ collection: 'contactus', timestamps: true });
module.exports = mongoose.model('contactus', ContactUsSchema);