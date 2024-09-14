const mongoose = require('mongoose');
const NotificationSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'users'
    },
    type: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    isViewed: {
        type: Boolean,
    },
    status: {
        type: Number,
        default: 1,
        enum: [1, 2, 3]	//1 = Active 2 = InActive 3 = Deleted
    }
},{ collection: 'notification', timestamps: true });
module.exports = mongoose.model('notification', NotificationSchema);