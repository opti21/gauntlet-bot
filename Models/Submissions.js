const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const submissionSchema = new Schema({
    locked: Boolean,
    editing: Boolean,
    week: Number,
    user: Number,
    description: String,
    attachments: {
        type: String,
        default: "[]"
    }
})

module.exports = mongoose.model('Submission', submissionSchema)
