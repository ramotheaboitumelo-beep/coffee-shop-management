
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("./config/mongodb");

const menuRoutes = require("./routes/menuRoutes");
const orderRoutes = require("./routes/orderRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);

app.get("/", (req, res) => {
    res.send("Coffee Shop Management API is running!");
});

app.get("/api/health", (req, res) => {
    res.json({
        status: "success",
        message: "Coffee Shop API is healthy!",
        mongodb: mongoose.connection.readyState === 1
            ? "Connected"
            : "Disconnected"
    });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start:", error.message);
        process.exit(1);
    }
}

startServer();
