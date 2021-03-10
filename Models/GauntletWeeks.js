const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const gauntletWeekSchema = new Schema({
    week: Number,
    theme: String,
    description: String
})

module.exports = mongoose.model('Gauntlet Week', gauntletWeekSchema)
