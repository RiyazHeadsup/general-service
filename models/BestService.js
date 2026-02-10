const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const productUsageSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: false
    },
    quantity: {
        type: Number,
        required: false
    },
    unit: {
        type: String,
        required: false
    }
}, { _id: false });

// Miscellaneous items schema - for consumables like towel, tissue, etc.
const miscItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: false,
        trim: true
    },
    price: {
        type: Number,
        required: false
    }
}, { _id: false });

const bestServiceSchema = new mongoose.Schema({
    staffIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    }],
    unitIds: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Unit',
        required: false
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: false,
        trim: true
    },
    service_time: {
        type: String,
        required: false
    },
    price: {
        type: Number,
        required: false
    },
    member_price: {
        type: Number,
        required: false
    },
    img: {
        type: String,
        required: false,
        trim: true
    },
    products: {
        type: [productUsageSchema],
        required: false,
        default: []
    },
    incentive: {
        type: Number,
        required: false
    },
    gender: {
        type: String,
        enum: ['male', 'female', ''],
        required: false
    },
    miscItems: {
        type: [miscItemSchema],
        required: false,
        default: []
    },
    serviceMargin: {
        type: Number,
        required: false,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

bestServiceSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('BestService', bestServiceSchema);
