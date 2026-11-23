
require("dotenv").config();

const mongoose = require("mongoose");
const { createHash, randomBytes } = require("crypto");

const redisClient = require("./config/redis");
const Menu = require("./models/Menu");
const Order = require("./models/Order");

const hashTrackingCode = (code) =>
    createHash("sha256").update(code).digest("hex");

async function migrateData() {
    try {
        // Connect to both databases
        await redisClient.connect();
        await mongoose.connect(process.env.MONGODB_URI);

        console.log("Connected to Redis and MongoDB!");

        // =================================
        // MIGRATE MENU ITEMS
        // =================================

        const menuIds = await redisClient.sMembers("menu:items");

        let menusMigrated = 0;

        for (const id of menuIds) {
            const data = await redisClient.get(`menu:item:${id}`);

            if (!data) continue;

            const item = JSON.parse(data);

            const existing = await Menu.findOne({ id: item.id });

            if (existing) {
                console.log("Menu item already exists:", item.name);
                continue;
            }

            await new Menu(item).save();

            menusMigrated++;
            console.log("Menu migrated:", item.name);
        }

        // =================================
        // MIGRATE CUSTOMER ORDERS
        // =================================

        const orderIds = await redisClient.sMembers("orders:all");

        let ordersMigrated = 0;

        for (const id of orderIds) {
            const data = await redisClient.get(`order:${id}`);

            if (!data) continue;

            const order = JSON.parse(data);

            const existing = await Order.findOne({ id: order.id });

            if (existing) {
                console.log("Order already exists:", order.id);
                continue;
            }

            // Retrieve the original tracking hash
            let trackingHash = await redisClient.get(
                `order:tracking:${id}`
            );

            // Give orders without an old tracking hash
            // an inaccessible random hash.
            if (!trackingHash) {
                trackingHash = hashTrackingCode(
                    randomBytes(32).toString("hex")
                );
            }

            const newOrder = new Order({
                id: order.id,
                customerName: order.customerName,
                items: order.items,
                total: order.total,
                status: order.status,
                trackingCodeHash: trackingHash,
                createdAt: order.createdAt
                    ? new Date(order.createdAt)
                    : new Date()
            });

            await newOrder.save();

            ordersMigrated++;
            console.log("Order migrated:", order.id);
        }

        console.log("\n===== MIGRATION COMPLETE =====");
        console.log("Menu items migrated:", menusMigrated);
        console.log("Orders migrated:", ordersMigrated);

    } catch (error) {
        console.error("Migration failed:", error.message);

    } finally {
        if (redisClient.isOpen) {
            await redisClient.quit();
        }

        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
    }
}

migrateData();
