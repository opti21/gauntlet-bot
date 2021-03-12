const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const gauntletWeekSchema = new Schema({
    active: {
        type: Boolean,
        default: false
    },
    week: Number,
    theme: String,
    description: String,
    editing: Boolean,
})

module.exports = mongoose.model('Gauntlet Week', gauntletWeekSchema)
