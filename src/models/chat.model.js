const mongoose = require('mongoose');

const ChatSchema = mongoose.Schema({
    user1_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'users'
    },
    user2_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'users'
    },
    messages: [
        {
            authorId: {
                type: mongoose.Schema.Types.ObjectId,
                required: true,
                ref: 'users'
            },
            messageContent : {
                type:String,
            },
            isRead : {
                type : Boolean,
                default: false
            },
            createdTime : {
                type : Date
            }
        }
    ]
}, { collection: 'chat', timestamps: true });

module.exports = mongoose.model('chat', ChatSchema);