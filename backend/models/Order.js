
const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    customerName: {
        type: String,
        required: true,
        trim: true
    },
    items: [
        {
            menuItemId: {
                type: String,
                required: true
            },
            name: {
                type: String,
                required: true
            },
            price: {
                type: Number,
                required: true
            },
            quantity: {
                type: Number,
                required: true,
                min: 1
            },
            subtotal: {
                type: Number,
                required: true
            }
        }
    ],
    total: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ["Pending", "Preparing", "Ready", "Collected"],
        default: "Pending"
    },
    trackingCodeHash: {
        type: String,
        required: true,
        select: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Order", orderSchema);
