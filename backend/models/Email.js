const mongoose = require('mongoose');

const emailSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    status: {
        type: String,
        default: 'UNSEEN', // UNSEEN, SEEN
    },
    notificationSent: {
        type: Boolean,
        default: false,
    },
});

module.exports = mongoose.model('Email', emailSchema);
