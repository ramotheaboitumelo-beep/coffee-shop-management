
import React, { useEffect, useState } from "react";
import "./App.css";

function AdminDashboard({ token, onMenuChanged }) {
    // Order management
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Menu management
    const [menu, setMenu] = useState([]);
    const [menuLoading, setMenuLoading] = useState(true);
    const [menuError, setMenuError] = useState("");
    const [menuMessage, setMenuMessage] = useState("");

    const [editingId, setEditingId] = useState(null);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [price, setPrice] = useState("");
    const [available, setAvailable] = useState(true);
    const [saving, setSaving] = useState(false);

    // Authentication headers
    const authHeaders = {
        Authorization: `Bearer ${token}`
    };

    // Retrieve orders
    const fetchOrders = async () => {
        try {
            const response = await fetch(
                "http://localhost:5000/api/orders",
                { headers: authHeaders }
            );

            if (!response.ok) {
                throw new Error("Failed to retrieve orders.");
            }

            const data = await response.json();
            setOrders(data);
            setError("");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Retrieve menu items
    const fetchMenu = async () => {
        try {
            const response = await fetch(
                "http://localhost:5000/api/menu"
            );

            if (!response.ok) {
                throw new Error("Failed to retrieve menu items.");
            }

            const data = await response.json();
            setMenu(data);
            setMenuError("");
        } catch (err) {
            setMenuError(err.message);
        } finally {
            setMenuLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
        fetchMenu();
    }, [token]);

    // Clear menu form
    const resetMenuForm = () => {
        setEditingId(null);
        setName("");
        setDescription("");
        setCategory("");
        setPrice("");
        setAvailable(true);
    };

    // Add or update a menu item
    const handleMenuSubmit = async (event) => {
        event.preventDefault();

        setSaving(true);
        setMenuError("");
        setMenuMessage("");

        const menuItem = {
            name: name.trim(),
            description: description.trim(),
            category: category.trim(),
            price: Number(price),
            available
        };

        try {
            const url = editingId
                ? `http://localhost:5000/api/menu/${editingId}`
                : "http://localhost:5000/api/menu";

            const response = await fetch(url, {
                method: editingId ? "PUT" : "POST",
                headers: {
                    ...authHeaders,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(menuItem)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Could not save menu item.");
            }

            setMenuMessage(
                editingId
                    ? "Menu item updated successfully!"
                    : "Menu item added successfully!"
            );
            resetMenuForm();
await fetchMenu();

if (onMenuChanged) {
    await onMenuChanged();
}


        } catch (err) {
            setMenuError(err.message);
        } finally {
            setSaving(false);
        }
    };

    // Load product details into the form for editing
    const editMenuItem = (item) => {
        setEditingId(item.id);
        setName(item.name);
        setDescription(item.description);
        setCategory(item.category);
        setPrice(String(item.price));
        setAvailable(item.available);
        setMenuMessage("");
        setMenuError("");

        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // Delete a menu item
    const deleteMenuItem = async (id) => {
        if (!window.confirm("Are you sure you want to delete this menu item?")) {
            return;
        }

        setMenuError("");
        setMenuMessage("");

        try {
            const response = await fetch(
                `http://localhost:5000/api/menu/${id}`,
                {
                    method: "DELETE",
                    headers: authHeaders
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Could not delete menu item.");
            }

            setMenuMessage("Menu item deleted successfully!");

            if (editingId === id) {
                resetMenuForm();
            }

            await fetchMenu();

            if (onMenuChanged) {
                await onMenuChanged();
            }

        } catch (err) {
            setMenuError(err.message);
        }
    };

    // Update order status
    const updateStatus = async (id, status) => {
        try {
            const response = await fetch(
                `http://localhost:5000/api/orders/${id}/status`,
                {
                    method: "PATCH",
                    headers: {
                        ...authHeaders,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ status })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message);
            }

            setOrders((previousOrders) =>
                previousOrders.map((order) =>
                    order.id === id ? data.order : order
                )
            );
        } catch (err) {
            setError(err.message);
        }
    };

    // Delete an order
    const deleteOrder = async (id) => {
        if (!window.confirm("Are you sure you want to delete this order?")) {
            return;
        }

        try {
            const response = await fetch(
                `http://localhost:5000/api/orders/${id}`,
                {
                    method: "DELETE",
                    headers: authHeaders
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message);
            }

            setOrders((previousOrders) =>
                previousOrders.filter((order) => order.id !== id)
            );
        } catch (err) {
            setError(err.message);
        }
    };

    // Dashboard calculations
    const totalSales = orders.reduce(
        (sum, order) =>
            order.status === "Collected"
                ? sum + Number(order.total)
                : sum,
        0
    );

    const pendingOrders = orders.filter(
        (order) => order.status === "Pending"
    ).length;

    const preparingOrders = orders.filter(
        (order) => order.status === "Preparing"
    ).length;

    return (
        <div className="admin-dashboard">

            {/* Dashboard heading */}
            <h2>Admin Dashboard</h2>
            <p>Manage your Coffee Corner business.</p>

            {/* Statistics */}
            <div className="admin-stats">
                <div className="admin-stat-card">
                    <h3>{orders.length}</h3>
                    <p>Total Orders</p>
                </div>

                <div className="admin-stat-card">
                    <h3>{pendingOrders}</h3>
                    <p>Pending Orders</p>
                </div>

                <div className="admin-stat-card">
                    <h3>{preparingOrders}</h3>
                    <p>Preparing Orders</p>
                </div>

                <div className="admin-stat-card">
                    <h3>M{totalSales.toFixed(2)}</h3>
                    <p>Collected Sales</p>
                </div>
            </div>

            {/* MENU MANAGEMENT */}
            <section className="menu-management">
                <h2>Menu Management</h2>
                <p>Add, edit and manage your coffee shop products.</p>

                <div className="menu-management-layout">

                    {/* Add/Edit form */}
                    <div className="menu-form-card">
                        <h3>
                            {editingId ? "Edit Menu Item" : "Add New Product"}
                        </h3>

                        <form onSubmit={handleMenuSubmit}>
                            <label>Product Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Cappuccino"
                                required
                            />

                            <label>Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Describe your product"
                                required
                            />

                            <label>Category</label>
                            <input
                                type="text"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                placeholder="e.g. Coffee"
                                required
                            />

                            <label>Price (M)</label>
                            <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                placeholder="e.g. 40.00"
                                required
                            />

                            <label className="availability-label">
                                <input
                                    type="checkbox"
                                    checked={available}
                                    onChange={(e) =>
                                        setAvailable(e.target.checked)
                                    }
                                />
                                Available for customers
                            </label>

                            {menuError && (
                                <p className="error">{menuError}</p>
                            )}

                            {menuMessage && (
                                <p className="success-message">{menuMessage}</p>
                            )}

                            <button
                                type="submit"
                                className="order-button"
                                disabled={saving}
                            >
                                {saving
                                    ? "Saving..."
                                    : editingId
                                        ? "Update Product"
                                        : "Add Product"}
                            </button>

                            {editingId && (
                                <button
                                    type="button"
                                    className="cancel-button"
                                    onClick={resetMenuForm}
                                >
                                    Cancel Editing
                                </button>
                            )}
                        </form>
                    </div>

                    {/* Existing menu items */}
                    <div className="menu-list">
                        <h3>Existing Products</h3>

                        {menuLoading && <p>Loading products...</p>}

                        {!menuLoading && menu.length === 0 && (
                            <p>No products have been added yet.</p>
                        )}

                        {menu.map((item) => (
                            <div className="menu-item-row" key={item.id}>
                                <div className="menu-item-details">
                                    <h4>{item.name}</h4>
                                    <p>{item.category}</p>
                                    <p>
                                        M{Number(item.price).toFixed(2)}
                                    </p>

                                    <span
                                        className={
                                            item.available
                                                ? "availability available"
                                                : "availability unavailable"
                                        }
                                    >
                                        {item.available
                                            ? "Available"
                                            : "Unavailable"}
                                    </span>
                                </div>

                                <div className="menu-item-actions">
                                    <button
                                        className="edit-button"
                                        onClick={() => editMenuItem(item)}
                                    >
                                        Edit
                                    </button>

                                    <button
                                        className="delete-button"
                                        onClick={() => deleteMenuItem(item.id)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ORDER MANAGEMENT */}
            <section className="order-management">
                <h2>Customer Orders</h2>

                <button onClick={fetchOrders} className="order-button">
                    Refresh Orders
                </button>

                {loading && <p>Loading orders...</p>}

                {error && <p className="error">{error}</p>}

                {!loading && orders.length === 0 && (
                    <p>No customer orders yet.</p>
                )}

                <div className="admin-orders">
                    {orders.map((order) => (
                        <div className="admin-order-card" key={order.id}>
                            <h3>{order.customerName}</h3>

                            <p>Order ID: {order.id}</p>

                            <p>
                                Date:{" "}
                                {new Date(order.createdAt).toLocaleString()}
                            </p>

                            <h4>Items</h4>

                            {order.items.map((item, index) => (
                                <p key={index}>
                                    {item.name} × {item.quantity}
                                    {" — "}M{Number(item.subtotal).toFixed(2)}
                                </p>
                            ))}

                            <h3>
                                Total: M{Number(order.total).toFixed(2)}
                            </h3>

                            <p>Current Status: {order.status}</p>

                            <label>Update Status:</label>

                            <select
                                value={order.status}
                                onChange={(e) =>
                                    updateStatus(order.id, e.target.value)
                                }
                            >
                                <option value="Pending">Pending</option>
                                <option value="Preparing">Preparing</option>
                                <option value="Ready">Ready</option>
                                <option value="Collected">Collected</option>
                            </select>

                            <button
                                className="delete-button"
                                onClick={() => deleteOrder(order.id)}
                            >
                                Delete Order
                            </button>
                        </div>
                    ))}
                </div>
            </section>

        </div>
    );
}

export default AdminDashboard;
