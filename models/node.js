const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const nodeSchema = new Schema({
    projectId: {
        type: Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    position: {
        latitude: {
            type: Number,
            required: true
        },
        longitude: {
            type: Number,
            required: true
        }
    }
}, { timestamps: true });

module.exports = mongoose.model('Node', nodeSchema);