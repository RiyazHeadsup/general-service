const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const paymentMethodSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    upiId: {
        type: String,
        default: null,
        trim: true
    },
    payeeName: {
        type: String,
        default: null,
        trim: true
    },
    defaultAmount: {
        type: Number,
        default: null
    },
    currency: {
        type: String,
        default: 'INR',
        trim: true
    },
    transactionNote: {
        type: String,
        default: null,
        trim: true
    },
    upiLink: {
        type: String,
        default: null
    },
    image: {
        type: String,
        default: null
    },
    status: {
        type: String,
        required: true,
        enum: ['active', 'inactive'],
        default: 'active'
    }
}, {
    timestamps: true,
    collection: 'paymentmethods'
});

paymentMethodSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('PaymentMethod', paymentMethodSchema);