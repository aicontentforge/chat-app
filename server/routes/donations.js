const express = require("express");
const db = require("../database");
const crypto = require("crypto");
const Razorpay = require("razorpay");

const {
    getDonorRankings
} = require("../utils/donations");

const router = express.Router();

/*
 * Razorpay client. Reads keys from environment variables so the real
 * secret is never committed to the repo - set these in Render's
 * Environment tab (and in a local .env for testing):
 *
 *   RAZORPAY_KEY_ID=rzp_test_xxxxxxxx
 *   RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxx
 */
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});


// =====================================================
// CREATE RAZORPAY ORDER
// Called when the donor submits an amount, before checkout opens.
// =====================================================

router.post("/razorpay/create-order", async (req, res) => {

    const { username, amountRupees } = req.body;

    if (!username) {

        return res.status(400).json({
            success: false,
            message: "Username is required"
        });

    }

    const rupees = Number(amountRupees);

    if (!Number.isFinite(rupees) || rupees < 1) {

        return res.status(400).json({
            success: false,
            message: "Enter a valid donation amount"
        });

    }

    // Razorpay expects the amount in paise (smallest unit), integer only.
    const amountPaise = Math.round(rupees * 100);

    try {

        const order = await razorpay.orders.create({
            amount: amountPaise,
            currency: "INR",
            notes: { username }
        });

        res.json({
            success: true,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: process.env.RAZORPAY_KEY_ID
        });

    } catch (err) {

        console.error("RAZORPAY ORDER ERROR:", err);

        res.status(500).json({
            success: false,
            message: "Could not start payment. Try again."
        });

    }

});


// =====================================================
// VERIFY RAZORPAY PAYMENT AND CREDIT THE DONATION
// Called after the donor completes checkout in the Razorpay widget.
// This is the ONLY place a donation actually gets credited from a
// real payment - the signature check below proves the payment is
// genuine and wasn't faked/tampered with by the client.
// =====================================================

router.post("/razorpay/verify", (req, res) => {

    const {
        username,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
    } = req.body;

    if (
        !username ||
        !razorpay_order_id ||
        !razorpay_payment_id ||
        !razorpay_signature
    ) {

        return res.status(400).json({
            success: false,
            message: "Missing payment details"
        });

    }

    // Recompute the signature ourselves from the order + payment IDs
    // using our secret key, and compare it to what the client sent.
    // If they don't match, the payment wasn't genuinely completed
    // (or was tampered with) - never trust the client's word alone.
    const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

    if (expectedSignature !== razorpay_signature) {

        console.error(
            "RAZORPAY SIGNATURE MISMATCH for order",
            razorpay_order_id
        );

        return res.status(400).json({
            success: false,
            message: "Payment verification failed"
        });

    }

    // Signature is valid - fetch the order from Razorpay's own servers
    // to confirm the amount actually paid (never trust a client-sent
    // amount for crediting).
    razorpay.orders.fetch(razorpay_order_id)
        .then(order => {

            if (order.status !== "paid") {

                return res.status(400).json({
                    success: false,
                    message: "Payment not completed"
                });

            }

            const amountCents = order.amount; // paise, already an integer

            db.get(
                `
                SELECT
                    username,
                    totalDonated,
                    donorBadgeExpiresAt
                FROM users
                WHERE username=?
                `,
                [username],
                (err, user) => {

                    if (err) {

                        return res.status(500).json({
                            success: false,
                            message: err.message
                        });

                    }

                    if (!user) {

                        return res.status(404).json({
                            success: false,
                            message: "User not found"
                        });

                    }

                    const newTotal =
                        Number(user.totalDonated || 0) +
                        amountCents;

                    // Same one-month badge renewal logic as test-donate.
                    const now = new Date();
                    let expiryBase = now;

                    if (
                        user.donorBadgeExpiresAt &&
                        new Date(user.donorBadgeExpiresAt) > now
                    ) {

                        expiryBase = new Date(user.donorBadgeExpiresAt);

                    }

                    const newExpiry = new Date(expiryBase);
                    newExpiry.setMonth(newExpiry.getMonth() + 1);

                    const createdAt = new Date().toISOString();

                    db.run(
                        `
                        INSERT INTO donations
                        (
                            userId,
                            amountCents,
                            productId,
                            purchaseToken,
                            orderId,
                            createdAt,
                            verified
                        )
                        VALUES (?, ?, ?, ?, ?, ?, 1)
                        `,
                        [
                            username,
                            amountCents,
                            "RAZORPAY_DONATION",
                            razorpay_payment_id,
                            razorpay_order_id,
                            createdAt
                        ],
                        function (err) {

                            if (err) {

                                // UNIQUE constraint on purchaseToken means
                                // this exact payment was already credited
                                // before - don't credit it twice.
                                if (err.message.includes("UNIQUE")) {

                                    return res.status(409).json({
                                        success: false,
                                        message: "This payment was already recorded"
                                    });

                                }

                                console.error("DONATION INSERT ERROR:", err);

                                return res.status(500).json({
                                    success: false,
                                    message: err.message
                                });

                            }

                            db.run(
                                `
                                UPDATE users
                                SET
                                    totalDonated=?,
                                    donorBadgeExpiresAt=?
                                WHERE username=?
                                `,
                                [
                                    newTotal,
                                    newExpiry.toISOString(),
                                    username
                                ],
                                function (err) {

                                    if (err) {

                                        console.error("DONATION UPDATE ERROR:", err);

                                        return res.status(500).json({
                                            success: false,
                                            message: err.message
                                        });

                                    }

                                    getDonorRankings((err, rankings) => {

                                        if (err) {

                                            return res.status(500).json({
                                                success: false,
                                                message: err.message
                                            });

                                        }

                                        const ranking = rankings.find(
                                            item => item.username === username
                                        );

                                        res.json({

                                            success: true,

                                            donation: {
                                                id: this.lastID,
                                                amountCents,
                                                totalDonated: newTotal
                                            },

                                            ranking

                                        });

                                    });

                                }
                            );

                        }
                    );

                }
            );

        })
        .catch(err => {

            console.error("RAZORPAY ORDER FETCH ERROR:", err);

            res.status(500).json({
                success: false,
                message: "Could not confirm payment with Razorpay"
            });

        });

});


// =====================================================
// GET LEADERBOARD
// =====================================================

router.get("/leaderboard", (req, res) => {

    getDonorRankings((err, rankings) => {

        if (err) {

            console.error(
                "LEADERBOARD ERROR:",
                err
            );

            return res.status(500).json({
                success: false,
                message: err.message
            });

        }

        res.json({
            success: true,
            rankings
        });

    });

});


// =====================================================
// GET CURRENT USER DONOR INFO
// =====================================================

router.get("/status/:username", (req, res) => {

    const username = req.params.username;

    db.get(
        `
        SELECT
            username,
            displayName,
            avatar,
            totalDonated,
            donorBadgeExpiresAt
        FROM users
        WHERE username=?
        `,
        [username],
        (err, user) => {

            if (err) {

                return res.status(500).json({
                    success: false,
                    message: err.message
                });

            }

            if (!user) {

                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });

            }

            getDonorRankings((err, rankings) => {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });

                }

                const ranking =
                    rankings.find(
                        item =>
                            item.username === username
                    );

                res.json({

                    success: true,

                    user: {

                        ...user,

                        rank:
                            ranking
                                ? ranking.rank
                                : null,

                        badgeNumber:
                            ranking
                                ? ranking.badgeNumber
                                : null,

                        isTopDonor:
                            ranking
                                ? ranking.isTopDonor
                                : false,

                        donorBadgeActive:
                            ranking
                                ? ranking.donorBadgeActive
                                : false

                    }

                });

            });

        }
    );

});


// =====================================================
// TEST DONATION
// REMOVE THIS BEFORE PRODUCTION
// =====================================================

router.post("/test-donate", (req, res) => {

    const {
        username,
        amountCents
    } = req.body;


    if (!username) {

        return res.status(400).json({
            success: false,
            message: "Username is required"
        });

    }


    const amount = Number(amountCents);


    if (!Number.isInteger(amount) || amount <= 0) {

        return res.status(400).json({
            success: false,
            message:
                "amountCents must be a positive integer"
        });

    }


    db.get(
        `
        SELECT
            username,
            totalDonated,
            donorBadgeExpiresAt
        FROM users
        WHERE username=?
        `,
        [username],
        (err, user) => {

            if (err) {

                return res.status(500).json({
                    success: false,
                    message: err.message
                });

            }


            if (!user) {

                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });

            }


            const newTotal =
                Number(user.totalDonated || 0) +
                amount;


            /*
             * A donation renews the temporary
             * numberless donor badge for one month.
             *
             * If the existing badge has not expired,
             * extend one month from its current expiry.
             *
             * Otherwise start one month from now.
             */

            const now = new Date();

            let expiryBase = now;


            if (
                user.donorBadgeExpiresAt
                &&
                new Date(user.donorBadgeExpiresAt) > now
            ) {

                expiryBase =
                    new Date(
                        user.donorBadgeExpiresAt
                    );

            }


            const newExpiry =
                new Date(expiryBase);

            newExpiry.setMonth(
                newExpiry.getMonth() + 1
            );


            const createdAt =
                new Date().toISOString();


            db.run(
                `
                INSERT INTO donations
                (
                    userId,
                    amountCents,
                    productId,
                    purchaseToken,
                    orderId,
                    createdAt
                )
                VALUES (?, ?, ?, ?, ?, ?)
                `,
                [
                    username,
                    amount,
                    "TEST_DONATION",
                    `TEST_${Date.now()}_${username}`,
                    `TEST_ORDER_${Date.now()}`,
                    createdAt
                ],
                function (err) {

                    if (err) {

                        console.error(
                            "DONATION INSERT ERROR:",
                            err
                        );

                        return res.status(500).json({
                            success: false,
                            message: err.message
                        });

                    }


                    db.run(
                        `
                        UPDATE users

                        SET
                            totalDonated=?,
                            donorBadgeExpiresAt=?

                        WHERE username=?
                        `,
                        [
                            newTotal,
                            newExpiry.toISOString(),
                            username
                        ],
                        function (err) {

                            if (err) {

                                console.error(
                                    "DONATION UPDATE ERROR:",
                                    err
                                );

                                return res.status(500).json({
                                    success: false,
                                    message: err.message
                                });

                            }


                            getDonorRankings(
                                (err, rankings) => {

                                    if (err) {

                                        return res.status(500).json({
                                            success: false,
                                            message: err.message
                                        });

                                    }


                                    const ranking =
                                        rankings.find(
                                            item =>
                                                item.username ===
                                                username
                                        );


                                    res.json({

                                        success: true,

                                        donation: {

                                            id:
                                                this.lastID,

                                            amountCents:
                                                amount,

                                            totalDonated:
                                                newTotal

                                        },

                                        ranking

                                    });

                                }
                            );

                        }
                    );

                }
            );

        }
    );

});


// =====================================================
// DELETE / RESET TEST DONATIONS
// DEVELOPMENT ONLY
// =====================================================

router.post("/reset-test-donations", (req, res) => {

    db.serialize(() => {

        db.run(
            `
            UPDATE users
            SET
                totalDonated=0,
                donorBadgeExpiresAt=NULL
            `
        );

        db.run(
            `
            DELETE FROM donations
            WHERE productId='TEST_DONATION'
            `,
            err => {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });

                }

                res.json({
                    success: true,
                    message: "Test donations reset"
                });

            }
        );

    });

});


module.exports = router;