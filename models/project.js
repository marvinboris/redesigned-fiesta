const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const projectSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    bandwidth: {
        type: Number,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);