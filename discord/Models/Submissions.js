const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const submissionSchema = new Schema({
    locked: Boolean,
    editing: Boolean,
    week: Number,
    user: Number,
    user_pic: String,
    username: String,
    nickname: String,
    description: String,
    attachments: {
        type: String,
        default: "[]"
    },
    submitted: {
        type: Boolean,
        default: false
    },
    reviewed: {
        type: Boolean,
        default: false
    },
    vod_link: {
        type: String,
        default: "",
    },
    discord_message: String
},
    {
        timestamps: true
    }
)

module.exports = mongoose.model('Submission', submissionSchema)
