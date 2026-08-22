import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "../styles/donate.css";

function DonatePage() {

    const navigate = useNavigate();

    const user = (() => {
        try {
            return JSON.parse(localStorage.getItem("user"));
        } catch {
            return null;
        }
    })();

    const [amount, setAmount] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(null);

    async function handleDonate() {

        setError("");

        const rupees = Number(amount);

        if (!Number.isFinite(rupees) || rupees < 1) {

            setError("Enter an amount of at least ₹1");
            return;

        }

        if (!user) {

            setError("Please log in first");
            return;

        }

        if (typeof window.Razorpay === "undefined") {

            setError(
                "Payment system is still loading. Please try again in a moment."
            );
            return;

        }

        setLoading(true);

        try {

            // Step 1: ask our server to open a Razorpay order.
            const orderRes = await api.post(
                "/donations/razorpay/create-order",
                {
                    username: user.username,
                    amountRupees: rupees
                }
            );

            if (!orderRes.data.success) {

                setError(orderRes.data.message || "Could not start payment");
                setLoading(false);
                return;

            }

            const { orderId, amount: orderAmount, currency, keyId } =
                orderRes.data;

            // Step 2: open Razorpay's checkout widget with that order.
            const razorpay = new window.Razorpay({

                key: keyId,
                order_id: orderId,
                amount: orderAmount,
                currency,
                name: "ChatSphere",
                description: "Support ChatSphere",
                prefill: {
                    name: user.displayName || user.username
                },
                theme: {
                    color: "#7e14ff"
                },

                handler: async function (response) {

                    // Step 3: donor completed payment - ask our server to
                    // verify it and credit the donor badge.
                    try {

                        const verifyRes = await api.post(
                            "/donations/razorpay/verify",
                            {
                                username: user.username,
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature
                            }
                        );

                        if (verifyRes.data.success) {

                            setSuccess(verifyRes.data.donation);

                        } else {

                            setError(
                                verifyRes.data.message ||
                                "Payment could not be verified"
                            );

                        }

                    } catch (err) {

                        console.error("DONATION VERIFY ERROR:", err);
                        setError(
                            "Payment received, but confirming it failed. " +
                            "Contact support if your donor badge doesn't appear."
                        );

                    } finally {

                        setLoading(false);

                    }

                },

                modal: {
                    ondismiss: function () {
                        setLoading(false);
                    }
                }

            });

            razorpay.open();

        } catch (err) {

            console.error("DONATE ERROR:", err);
            setError("Something went wrong. Please try again.");
            setLoading(false);

        }

    }

    if (success) {

        return (
            <div className="donate-page">

                <div className="donate-card donate-success">

                    <div className="donate-success-icon">✓</div>

                    <h2>Thank you!</h2>

                    <p>
                        Your donation of ₹{(success.amountCents / 100).toFixed(2)}{" "}
                        was received.
                    </p>

                    <p className="donate-total">
                        Total donated so far: ₹
                        {(success.totalDonated / 100).toFixed(2)}
                    </p>

                    <button
                        className="donate-btn donate-btn-primary"
                        onClick={() => navigate("/top-supporters")}
                    >
                        View leaderboard
                    </button>

                    <button
                        className="donate-btn donate-btn-secondary"
                        onClick={() => navigate("/chat")}
                    >
                        Back to chat
                    </button>

                </div>

            </div>
        );

    }

    return (
        <div className="donate-page">

            <div className="donate-card">

                <button
                    className="donate-back"
                    onClick={() => navigate(-1)}
                >
                    ← Back
                </button>

                <h2>Support ChatSphere</h2>

                <p className="donate-subtitle">
                    Donations help keep ChatSphere running and earn you a
                    donor badge for a month.
                </p>

                <label className="donate-label" htmlFor="donate-amount">
                    Amount (₹)
                </label>

                <div className="donate-input-wrap">
                    <span className="donate-currency">₹</span>
                    <input
                        id="donate-amount"
                        type="number"
                        min="1"
                        step="1"
                        placeholder="Enter amount"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        className="donate-input"
                    />
                </div>

                {error && <p className="donate-error">{error}</p>}

                <button
                    className="donate-btn donate-btn-primary"
                    onClick={handleDonate}
                    disabled={loading}
                >
                    {loading ? "Processing..." : "Donate now"}
                </button>

                <p className="donate-note">
                    Payments are processed securely via Razorpay.
                </p>

            </div>

        </div>
    );

}

export default DonatePage;
