const mongoose = require('mongoose');
const LanguageSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    status: {
        type: Number,
        default: 1,
        enum: [1, 2, 3]	//1 = Active 2 = InActive 3 = Deleted
    }
},{ collection: 'languages', timestamps: true });
module.exports = mongoose.model('languages', LanguageSchema);