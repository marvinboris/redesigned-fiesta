const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const linkSchema = new Schema({
    projectId: {
        type: Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    source: {
        type: Schema.Types.ObjectId,
        ref: 'Node',
        required: true
    },
    destination: {
        type: Schema.Types.ObjectId,
        ref: 'Node',
        required: true
    },
    bandwidth: {
        type: Number,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Link', linkSchema);