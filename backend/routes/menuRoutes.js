
const express = require("express");
const { randomUUID } = require("crypto");

const Menu = require("../models/Menu");
const authenticateAdmin = require("../middleware/authMiddleware");

const router = express.Router();

// GET: Retrieve all menu items
router.get("/", async (req, res) => {
    try {
        const items = await Menu.find();

        res.status(200).json(items);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET: Retrieve one menu item
router.get("/:id", async (req, res) => {
    try {
        const item = await Menu.findOne({ id: req.params.id });

        if (!item) {
            return res.status(404).json({
                message: "Menu item not found"
            });
        }

        res.status(200).json(item);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST: Add a menu item
router.post("/", authenticateAdmin, async (req, res) => {
    try {
        const { name, description, category, price, available } = req.body;

        if (
            typeof name !== "string" || !name.trim() ||
            typeof description !== "string" || !description.trim() ||
            typeof category !== "string" || !category.trim() ||
            typeof price !== "number" ||
            !Number.isFinite(price) || price <= 0 ||
            (available !== undefined && typeof available !== "boolean")
        ) {
            return res.status(400).json({
                message: "Please provide valid menu item details."
            });
        }

        const newItem = new Menu({
            id: randomUUID(),
            name: name.trim(),
            description: description.trim(),
            category: category.trim(),
            price,
            available: available ?? true
        });

        await newItem.save();

        res.status(201).json({
            message: "Menu item added successfully!",
            item: newItem
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// PUT: Update a menu item
router.put("/:id", authenticateAdmin, async (req, res) => {
    try {
        const { name, description, category, price, available } = req.body;

        if (
            typeof name !== "string" || !name.trim() ||
            typeof description !== "string" || !description.trim() ||
            typeof category !== "string" || !category.trim() ||
            typeof price !== "number" ||
            !Number.isFinite(price) || price <= 0 ||
            typeof available !== "boolean"
        ) {
            return res.status(400).json({
                message: "Please provide all valid menu item details."
            });
        }

        const updatedItem = await Menu.findOneAndUpdate(
            { id: req.params.id },
            {
                name: name.trim(),
                description: description.trim(),
                category: category.trim(),
                price,
                available
            },
            { new: true, runValidators: true }
        );

        if (!updatedItem) {
            return res.status(404).json({
                message: "Menu item not found"
            });
        }

        res.status(200).json({
            message: "Menu item updated successfully!",
            item: updatedItem
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// DELETE: Remove a menu item
router.delete("/:id", authenticateAdmin, async (req, res) => {
    try {
        const deletedItem = await Menu.findOneAndDelete({
            id: req.params.id
        });

        if (!deletedItem) {
            return res.status(404).json({
                message: "Menu item not found"
            });
        }

        res.status(200).json({
            message: "Menu item deleted successfully!"
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
