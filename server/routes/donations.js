const express = require("express");
const db = require("../database");

const {
    getDonorRankings
} = require("../utils/donations");

const router = express.Router();


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