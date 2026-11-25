import API_URL from "./api";
import React, { useEffect, useState } from "react";
import "./App.css";
import AdminDashboard from "./AdminDashboard";
import AdminLogin from "./AdminLogin";

function App() {
    const [menu, setMenu] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [selectedItem, setSelectedItem] = useState(null);
    const [customerName, setCustomerName] = useState("");
    const [quantity, setQuantity] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [orderError, setOrderError] = useState("");
    const [confirmation, setConfirmation] = useState(null);
    // Customer order tracking
const [trackingOrderId, setTrackingOrderId] = useState("");
const [trackingCode, setTrackingCode] = useState("");
const [trackedOrder, setTrackedOrder] = useState(null);
const [trackingCredentials, setTrackingCredentials] = useState(null);
const [trackingLoading, setTrackingLoading] = useState(false);
const [trackingError, setTrackingError] = useState("");

    // Admin navigation and authentication
    const [page, setPage] = useState("menu");
    const [adminToken, setAdminToken] = useState("");

    // Retrieve menu items from the backend
    
const fetchMenu = async () => {
    try {
        const response = await fetch(`${API_URL}/api/menu`);

        if (!response.ok) {
            throw new Error("Failed to load menu.");
        }

        const data = await response.json();
        setMenu(data);
        setError("");
    } catch (error) {
        setError(error.message);
    } finally {
        setLoading(false);
    }
};

useEffect(() => {
    fetchMenu();
}, []);

    // Open the order form
    const handleOrderClick = (item) => {
        setSelectedItem(item);
        setCustomerName("");
        setQuantity(1);
        setOrderError("");
        setConfirmation(null);
    };

    // Submit an order to the backend
    const handleSubmitOrder = async (event) => {
        event.preventDefault();

        if (!customerName.trim()) {
            setOrderError("Please enter your name.");
            return;
        }

        if (!Number.isInteger(Number(quantity)) || Number(quantity) < 1) {
            setOrderError("Please enter a valid quantity.");
            return;
        }

        setSubmitting(true);
        setOrderError("");

        try {
            const response = await fetch(
                `${API_URL}/api/orders`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        customerName: customerName.trim(),
                        items: [
                            {
                                menuItemId: selectedItem.id,
                                quantity: Number(quantity)
                            }
                        ]
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to place order.");
            }

            setConfirmation({
                order: data.order,
                trackingCode: data.trackingCode,
                total: Number(selectedItem.price) * Number(quantity)
            });

            setSelectedItem(null);
            setCustomerName("");
            setQuantity(1);

        } catch (error) {
            setOrderError(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    // Called after successful admin login
    const handleAdminLogin = (token) => {
        setAdminToken(token);
        setPage("dashboard");
    };

    // Admin logout
    const handleAdminLogout = () => {
        setAdminToken("");
        setPage("menu");
    };

    // Track a customer order
const trackOrder = async (orderId, code) => {
    setTrackingLoading(true);
    setTrackingError("");
    setTrackedOrder(null);

    try {
        const response = await fetch(
            `${API_URL}/api/orders/track`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    orderId,
                    trackingCode: code
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Could not find order.");
        }

        setTrackedOrder(data.order);

        setTrackingCredentials({
            orderId,
            trackingCode: code
        });

    } catch (error) {
        setTrackingError(error.message);
    } finally {
        setTrackingLoading(false);
    }
};
// Automatically refresh customer order status
useEffect(() => {
    if (!trackingCredentials) return;

    const refreshOrder = async () => {
        try {
            const response = await fetch(
                `${API_URL}/api/orders/track`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(trackingCredentials)
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Could not refresh order.");
            }

            setTrackedOrder(data.order);
            setTrackingError("");

        } catch (error) {
            setTrackingError(error.message);
        }
    };

    const interval = setInterval(refreshOrder, 5000);

    return () => clearInterval(interval);

}, [trackingCredentials]);

    return (
        <div className="app">
            <header className="header">
                <h1> Coffee Corner</h1>
                <p>Fresh coffee, delicious treats!</p>

                {page === "menu" && (
                    <button
                        className="order-button"
                        onClick={() => setPage("adminLogin")}
                    >
                        Admin Login
                    </button>
                )}

                {page === "dashboard" && (
                    <button
                        className="cancel-button"
                        onClick={handleAdminLogout}
                    >
                        Logout
                    </button>
                )}
            </header>

            {page === "menu" && (
                <main className="main-content">
                    <h2>Our Menu</h2>
                    <p>Explore our available drinks and treats.</p>

                    {loading && <p>Loading menu...</p>}

                    {error && <p className="error">{error}</p>}

                    {!loading && !error && menu.length === 0 && (
                        <p>No menu items available.</p>
                    )}

                    <div className="menu-container">
                        {menu.map((item) => (
                            <div className="menu-card" key={item.id}>
                                <h3>{item.name}</h3>

                                <p>{item.description}</p>

                                <p>Category: {item.category}</p>

                                <h4>
                                    M{Number(item.price).toFixed(2)}
                                </h4>

                                <p>
                                    {item.available
                                        ? "Available"
                                        : "Currently unavailable"}
                                </p>

                                <button
                                    className="order-button"
                                    disabled={!item.available}
                                    onClick={() => handleOrderClick(item)}
                                >
                                    Order Now
                                </button>

                                {selectedItem?.id === item.id && (
                                    <form
                                        className="order-form"
                                        onSubmit={handleSubmitOrder}
                                    >
                                        <h3>Place Your Order</h3>

                                        <p>{item.name}</p>

                                        <label>Your Name</label>

                                        <input
                                            type="text"
                                            value={customerName}
                                            onChange={(e) =>
                                                setCustomerName(e.target.value)
                                            }
                                            placeholder="Enter your name"
                                            required
                                        />

                                        <label>Quantity</label>

                                        <input
                                            type="number"
                                            min="1"
                                            step="1"
                                            value={quantity}
                                            onChange={(e) =>
                                                setQuantity(e.target.value)
                                            }
                                            required
                                        />

                                        <p>
                                            Total: M
                                            {(Number(item.price) *
                                                Number(quantity)).toFixed(2)}
                                        </p>

                                        {orderError && (
                                            <p className="error">
                                                {orderError}
                                            </p>
                                        )}

                                        <button
                                            type="submit"
                                            className="order-button"
                                            disabled={submitting}
                                        >
                                            {submitting
                                                ? "Placing Order..."
                                                : "Confirm Order"}
                                        </button>

                                        <button
                                            type="button"
                                            className="cancel-button"
                                            onClick={() => {
                                                setSelectedItem(null);
                                                setOrderError("");
                                            }}
                                        >
                                            Cancel
                                        </button>
                                    </form>
                                )}
                            </div>
                        ))}
                    </div>
          
{confirmation && (
    <div className="order-confirmation">
        <h2>Order Successful!</h2>

        <p>Your order has been placed successfully.</p>

        <h3>Keep these details safe!</h3>

        <p>
            <strong>Order ID:</strong>
        </p>

        <p>{confirmation.order.id}</p>

        <button
            className="order-button"
            onClick={() =>
                navigator.clipboard.writeText(confirmation.order.id)
            }
        >
            Copy Order ID
        </button>

        <p>
            <strong>Tracking Code:</strong>
        </p>

        <p>{confirmation.trackingCode}</p>

        <button
            className="order-button"
            onClick={() =>
                navigator.clipboard.writeText(confirmation.trackingCode)
            }
        >
            Copy Tracking Code
        </button>

        <h3>
            Total: M
            {Number(
                confirmation.order.total ?? confirmation.total
            ).toFixed(2)}
        </h3>

        <p>Status: Pending</p>

        <p>
            Save your Order ID and Tracking Code.
            You will need both to track your order.
        </p>
        <button
    className="order-button"
    onClick={() => {
        setTrackingOrderId(confirmation.order.id);
        setTrackingCode(confirmation.trackingCode);

        trackOrder(
            confirmation.order.id,
            confirmation.trackingCode
        );
    }}
>
    Track This Order
</button>

        <button
            className="order-button"
            onClick={() => setConfirmation(null)}
        >
            Continue Shopping
        </button>
    </div>
)}

{/* CUSTOMER ORDER TRACKING */}
<section className="customer-tracking">

    <h2>Track Your Order</h2>

    <p>Enter your Order ID and Tracking Code to check your order.</p>

    <form
        onSubmit={(e) => {
            e.preventDefault();
            trackOrder(trackingOrderId.trim(), trackingCode.trim());
        }}
    >
        <label>Order ID</label>

        <input
            type="text"
            value={trackingOrderId}
            onChange={(e) => setTrackingOrderId(e.target.value)}
            placeholder="Enter your Order ID"
            required
        />

        <label>Tracking Code</label>

        <input
            type="text"
            value={trackingCode}
            onChange={(e) => setTrackingCode(e.target.value)}
            placeholder="Enter your Tracking Code"
            required
        />

        <button
            type="submit"
            className="order-button"
            disabled={trackingLoading}
        >
            {trackingLoading ? "Checking..." : "Track Order"}
        </button>
    </form>

    {trackingError && (
        <p className="error">{trackingError}</p>
    )}

    {trackedOrder && (
        <div className="tracking-result">

            <h3>Order Details</h3>

            <p>
                <strong>Customer:</strong>{" "}
                {trackedOrder.customerName}
            </p>

            <p>
                <strong>Order ID:</strong>{" "}
                {trackedOrder.id}
            </p>

            <p>
                <strong>Total:</strong>{" "}
                M{Number(trackedOrder.total).toFixed(2)}
            </p>

            <h3>Order Status</h3>

            <div className="tracking-status">
                <h2>{trackedOrder.status}</h2>
                <p>Your order status is updated automatically.</p>
            </div>

            <p>
                Last checked: {new Date().toLocaleTimeString()}
            </p>

        </div>
    )}

</section>


                </main>
            )}

            {page === "adminLogin" && (
                <AdminLogin
                    onLogin={handleAdminLogin}
                    onBack={() => setPage("menu")}
                />
            )}

            {page === "dashboard" && (
                <AdminDashboard token={adminToken} onMenuChanged={fetchMenu}/>
            )}
        </div>
    );
}

export default App;
