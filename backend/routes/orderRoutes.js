
const express = require("express");
const {
    randomUUID,
    randomBytes,
    createHash,
    timingSafeEqual
} = require("crypto");

const Order = require("../models/Order");
const Menu = require("../models/Menu");
const authenticateAdmin = require("../middleware/authMiddleware");

const router = express.Router();

// Generate a secure hash for tracking codes
const hashTrackingCode = (code) => {
    return createHash("sha256").update(code).digest("hex");
};

// GET: Retrieve all orders (ADMIN ONLY)
router.get("/", authenticateAdmin, async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });

        res.status(200).json(orders);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET: Retrieve one order by ID (ADMIN ONLY)
router.get("/:id", authenticateAdmin, async (req, res) => {
    try {
        const order = await Order.findOne({
            id: req.params.id
        });

        if (!order) {
            return res.status(404).json({
                message: "Order not found"
            });
        }

        res.status(200).json(order);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST: Track an order (CUSTOMER)
router.post("/track", async (req, res) => {
    try {
        const { orderId, trackingCode } = req.body;

        if (
            typeof orderId !== "string" ||
            typeof trackingCode !== "string" ||
            !orderId.trim() ||
            !trackingCode.trim()
        ) {
            return res.status(400).json({
                message: "Order ID and tracking code are required."
            });
        }

        const order = await Order.findOne({
            id: orderId.trim()
        }).select("+trackingCodeHash");

        if (!order) {
            return res.status(404).json({
                message: "Invalid Order ID or Tracking Code."
            });
        }

        const savedHash = order.trackingCodeHash;
        const suppliedHash = hashTrackingCode(trackingCode.trim());

        if (
            !savedHash ||
            !timingSafeEqual(
                Buffer.from(savedHash, "hex"),
                Buffer.from(suppliedHash, "hex")
            )
        ) {
            return res.status(404).json({
                message: "Invalid Order ID or Tracking Code."
            });
        }

        const orderResponse = order.toObject();
        delete orderResponse.trackingCodeHash;

        res.status(200).json({
            message: "Order retrieved successfully!",
            order: orderResponse
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST: Place a new order (CUSTOMER)
router.post("/", async (req, res) => {
    try {
        const { customerName, items } = req.body;

        if (
            typeof customerName !== "string" ||
            !customerName.trim() ||
            !Array.isArray(items) ||
            items.length === 0
        ) {
            return res.status(400).json({
                message: "Please provide a customer name and order items."
            });
        }

        let total = 0;
        const orderItems = [];

        for (const orderedItem of items) {
            const { menuItemId, quantity } = orderedItem;

            if (
                typeof menuItemId !== "string" ||
                !Number.isInteger(quantity) ||
                quantity <= 0
            ) {
                return res.status(400).json({
                    message: "Each item must have a valid ID and quantity."
                });
            }

            const menuItem = await Menu.findOne({
                id: menuItemId
            });

            if (!menuItem) {
                return res.status(404).json({
                    message: `Menu item ${menuItemId} was not found.`
                });
            }

            if (!menuItem.available) {
                return res.status(400).json({
                    message: `${menuItem.name} is currently unavailable.`
                });
            }

            const subtotal = menuItem.price * quantity;
            total += subtotal;

            orderItems.push({
                menuItemId,
                name: menuItem.name,
                price: menuItem.price,
                quantity,
                subtotal
            });
        }

        const id = randomUUID();
        const trackingCode = randomBytes(16).toString("hex");

        const newOrder = new Order({
            id,
            customerName: customerName.trim(),
            items: orderItems,
            total,
            status: "Pending",
            trackingCodeHash: hashTrackingCode(trackingCode)
        });

        await newOrder.save();

        const orderResponse = newOrder.toObject();
        delete orderResponse.trackingCodeHash;

        res.status(201).json({
            message: "Order placed successfully!",
            order: orderResponse,
            trackingCode
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// PATCH: Update order status (ADMIN ONLY)
router.patch("/:id/status", authenticateAdmin, async (req, res) => {
    try {
        const { status } = req.body;

        const allowedStatuses = [
            "Pending",
            "Preparing",
            "Ready",
            "Collected"
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                message: "Invalid order status."
            });
        }

        const order = await Order.findOneAndUpdate(
            { id: req.params.id },
            { status },
            { new: true, runValidators: true }
        );

        if (!order) {
            return res.status(404).json({
                message: "Order not found."
            });
        }

        res.status(200).json({
            message: "Order status updated successfully!",
            order
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// DELETE: Remove an order (ADMIN ONLY)
router.delete("/:id", authenticateAdmin, async (req, res) => {
    try {
        const order = await Order.findOneAndDelete({
            id: req.params.id
        });

        if (!order) {
            return res.status(404).json({
                message: "Order not found."
            });
        }

        res.status(200).json({
            message: "Order deleted successfully!"
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});

module.exports = router;
