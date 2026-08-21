const express = require("express");
const { v4: uuidv4 } = require("uuid");
const db = require("../database");
const bcrypt = require("bcrypt");
const { getDonorRankings } = require("../utils/donations");

const router = express.Router();

function getDistance(lat1, lon1, lat2, lon2) {

    const R = 6371;

    const dLat = (lat2 - lat1) * Math.PI / 180;

    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a =

        Math.sin(dLat / 2) * Math.sin(dLat / 2) +

        Math.cos(lat1 * Math.PI / 180) *

        Math.cos(lat2 * Math.PI / 180) *

        Math.sin(dLon / 2) *

        Math.sin(dLon / 2);

    const c =

        2 *

        Math.atan2(

            Math.sqrt(a),

            Math.sqrt(1 - a)

        );

    return R * c;

}

function generateUniqueId() {

    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    let id = "";

    for (let i = 0; i < 2; i++) {
        id += letters[Math.floor(Math.random() * letters.length)];
    }

    id += Math.floor(100000 + Math.random() * 900000);

    return id;

}

/* Register */

router.post("/register", async (req, res) => {

    const { username, password } = req.body;

    if (!password || password.length < 6) {

        return res.status(400).json({
            success: false,
            message: "Password must be at least 6 characters."
        });

    }

    if (!username) {
        return res.status(400).json({
            success: false,
            message: "Username required"
        });
    }
    

    const joinedAt = new Date().toISOString();
    const uniqueId = generateUniqueId();
    const hashedPassword = await bcrypt.hash(password, 10);

    const avatar =
        `https://api.dicebear.com/9.x/initials/svg?seed=${username}`;

    db.run(
        `INSERT INTO users(

        username,
        password,
        uniqueId,
        displayName,
        avatar,
        joinedAt

        )

        VALUES(?,?,?,?,?,?)`,
        [
        username,
        hashedPassword,
        uniqueId,
        username,
        avatar,
        joinedAt
        ],
        function (err) {

            if (err) {
                return res.status(400).json({
                    success: false,
                    message: err.message
                });
            }

            res.json({
                success: true,
                user: {

                    id: this.lastID,

                    username,

                    uniqueId,

                    avatar

                }
            });

        }
    );

});

/* Login */

router.post("/login", async (req, res) => {

    console.log("===== MOBILE LOGIN REQUEST =====");
    console.log("Username:", req.body.username);
    console.log("Password received:", !!req.body.password);

    const { username, password } = req.body;

    db.get(
    "SELECT * FROM users WHERE username=? OR uniqueId=?",
    [
        username,
        username
    ],
    async (err, row) => {

            if (err) {
    console.log("LOGIN DATABASE ERROR:", err);

    return res.status(500).json({
        success: false,
        message: err.message
    });
}

            if (!row) {
                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });
            }
            const validPassword = await bcrypt.compare(
                password,
                row.password
            );

            if (!validPassword) {

                return res.status(401).json({

                    success: false,

                    message: "Incorrect password"

                });

            }

            console.log("LOGIN SUCCESS:", row.username);

            res.json({
                success: true,
                user: {
                    ...row,
                    avatar: `https://api.dicebear.com/9.x/initials/svg?seed=${row.username}`
                }
            });

        }
    );

});

/* Get all users */

router.get("/", (req, res) => {

    db.all(
        "SELECT * FROM users",
        [],
        (err, rows) => {

            if (err) {
                return res.status(500).json(err);
            }

            res.json(rows);

        }
    );

});

router.get("/lastseen/:username", (req, res) => {

    db.get(

        "SELECT lastSeen FROM users WHERE username=?",

        [req.params.username],

        (err, row) => {

            if (err)
                return res.status(500).json(err);

            res.json(row);

        }

    );

});


router.post("/pin-chat", (req, res) => {

    const {

        username,
        chatUser

    } = req.body;

    db.get(

        "SELECT pinnedChats FROM users WHERE username=?",

        [username],

        (err, row) => {

            if (err) {

                return res.status(500).json(err);

            }

            let pinned = [];

            try {

                pinned = JSON.parse(row.pinnedChats || "[]");

            } catch {

                pinned = [];

            }

            if (pinned.includes(chatUser)) {

                pinned = pinned.filter(

                    user => user !== chatUser

                );

            } else {

                pinned.unshift(chatUser);

            }

            db.run(

                "UPDATE users SET pinnedChats=? WHERE username=?",

                [

                    JSON.stringify(pinned),

                    username

                ],

                (err) => {

                    if (err) {

                        return res.status(500).json(err);

                    }

                    res.json({

                        success: true,

                        pinned

                    });

                }

            );

        }

    );

});

router.get("/profile/:username", (req,res)=>{

    db.get(

        `SELECT
            username,
            displayName,
            avatar,
            bio,
            joinedAt,
            uniqueId,

            age,
            gender,

            latitude,
            longitude,
            city,
            state,
            country,
            countryCode,

            categories

        FROM users

        WHERE username=?`,

        [req.params.username],

        (err,row)=>{

            if(err)
                return res.status(500).json(err);

            res.json({

                ...row,

                categories: JSON.parse(row.categories || "[]")

            });

        }

    );

});

router.put("/profile", (req, res) => {

    const {

        username,
        displayName,
        bio,
        avatar,

        age,
        gender,

        latitude,
        longitude,

        city,
        state,
        country,
        countryCode,

        categories

    } = req.body;

    db.run(

        `UPDATE users
        SET

        displayName=?,

        bio=?,

        avatar=?,

        age=?,

        gender=?,

        latitude=?,

        longitude=?,

        city=?,

        state=?,

        country=?,

        countryCode=?,

        categories=?

        WHERE username=?`,

        [

        displayName,

        bio,

        avatar,

        age,

        gender,

        latitude,

        longitude,

        city,

        state,

        country,

        countryCode,

        JSON.stringify(categories || []),

        username

        ],

        function (err) {

            if (err) {
    console.log("PROFILE UPDATE ERROR:");
    console.log(err);

    return res.status(500).json({
        success: false,
        message: err.message
    });
}

            res.json({

                success: true

            });

        }

    );

});

router.get("/discover", (req, res) => {

    db.all(

        `
        SELECT
        id,
        username,
        displayName,
        avatar,
        uniqueId,
        bio,
        categories,
        gender,
        city,
        country
    FROM users
    WHERE discoverable=1
        `,

        [],

        (err, rows) => {

            if (err)
                return res.status(500).json(err);

            rows = rows.map(user => ({
                ...user,
                categories: JSON.parse(user.categories || "[]")
            }));

            res.json(rows);

        }

    );

});

router.get("/nearby/:username", (req, res) => {

    const username = req.params.username;

    const maxDistance = Number(req.query.distance || 10);

    db.get(

        "SELECT * FROM users WHERE username=?",

        [username],

        (err, currentUser) => {

            if (err)
                return res.status(500).json(err);

            if (!currentUser)
                return res.status(404).json({
                    message: "User not found"
                });

            db.all(

                `
                SELECT *
                FROM users
                WHERE

                discoverable=1

                AND username!=?
                `,

                [username],

                (err, users) => {

                    if (err)
                        return res.status(500).json(err);

                    const nearby = users
                        .filter(user =>

                            user.latitude &&
                            user.longitude

                        )
                        .map(user => {

                            const distance = getDistance(

                                currentUser.latitude,

                                currentUser.longitude,

                                user.latitude,

                                user.longitude

                            );

                            return {

                                ...user,

                                distance:
                                    Number(
                                        distance.toFixed(2)
                                    )

                            };

                        })
                        .filter(user =>

                            user.distance <= maxDistance

                        )
                        .sort((a, b) =>

                            a.distance - b.distance

                        );

                    res.json(nearby);

                }

            );

        }

    );

});

router.post("/report", (req, res) => {

    const { reporter, reported } = req.body;

    if (!reporter || !reported) {

        return res.status(400).json({
            error: "Missing data"
        });

    }

    // Prevent duplicate reports
    db.get(

        `SELECT * FROM reports
         WHERE reporter = ?
         AND reported = ?`,

        [reporter, reported],

        (err, row) => {

            if (err) {

                return res.status(500).json(err);

            }

            if (row) {

                return res.json({
                    success: false,
                    message: "You already reported this user."
                });

            }

            // Save report
            db.run(

                `INSERT INTO reports
                (reporter, reported, createdAt)
                VALUES (?, ?, ?)`,

                [

                    reporter,

                    reported,

                    new Date().toISOString()

                ],

                function (err) {

                    if (err) {

                        return res.status(500).json(err);

                    }

                    // Count reports
                    db.get(

                        `SELECT COUNT(*) AS total
                        FROM reports
                        WHERE reported = ?`,

                        [reported],

                        (err, result) => {

                            if (err) {

                                return res.status(500).json(err);

                            }

                            // Auto suspend after 5 reports
                            if (result.total >= 5) {

                                db.run(

                                    `UPDATE users
                                     SET suspended = 1
                                     WHERE username = ?`,

                                    [reported]

                                );

                            }

                            res.json({

                                success: true,

                                reports: result.total,

                                suspended: result.total >= 5

                            });

                        }

                    );

                }

            );

        }

    );

});

router.get("/profile/:username", (req, res) => {

    db.get(

        `SELECT
            username,
            displayName,
            avatar,
            bio,
            age,
            gender,
            country,
            state,
            city,
            joinedAt,
            lastSeen
        FROM users
        WHERE username = ?`,

        [req.params.username],

        (err, row) => {

            if (err)
                return res.status(500).json(err);

            if (!row)
                return res.status(404).json({
                    message: "User not found"
                });

            res.json(row);

        }

    );

});

router.get("/media/:user1/:user2", (req, res) => {

    const { user1, user2 } = req.params;

    db.all(

        `SELECT id,image,time,sender
         FROM messages
         WHERE image IS NOT NULL
         AND image != ''
         AND (
            (sender=? AND receiver=?)
            OR
            (sender=? AND receiver=?)
         )
         ORDER BY id DESC`,

        [user1, user2, user2, user1],

        (err, rows) => {

            if (err)
                return res.status(500).json(err);

            res.json(rows);

        }

    );

});

router.post("/toggle-mute", (req, res) => {

    const { username, mutedUser } = req.body;

    db.get(

        `SELECT * FROM muted_chats
         WHERE username=? AND mutedUser=?`,

        [username, mutedUser],

        (err, row) => {

            if (err) return res.status(500).json(err);

            if (!row) {

                db.run(

                    `INSERT INTO muted_chats(username, mutedUser, muted)
                     VALUES(?,?,1)`,

                    [username, mutedUser],

                    () => res.json({ muted: true })

                );

            } else {

                const value = row.muted ? 0 : 1;

                db.run(

                    `UPDATE muted_chats
                     SET muted=?
                     WHERE username=? AND mutedUser=?`,

                    [value, username, mutedUser],

                    () => {

                        res.json({

                            muted: value === 1

                        });

                    }

                );

            }

        }

    );

});

router.get("/is-muted/:username/:mutedUser", (req, res) => {

    const { username, mutedUser } = req.params;

    db.get(

        `SELECT muted
         FROM muted_chats
         WHERE username=? AND mutedUser=?`,

        [username, mutedUser],

        (err, row) => {

            if (err) return res.status(500).json(err);

            res.json({

                muted: row ? row.muted === 1 : false

            });

        }

    );

});

router.post("/block", (req, res) => {

    const { blocker, blocked } = req.body;

    db.get(

        `SELECT *
         FROM blocked_users
         WHERE blocker=? AND blocked=?`,

        [blocker, blocked],

        (err, row) => {

            if (err)
                return res.status(500).json(err);

            if (row) {

                db.run(

                    `DELETE FROM blocked_users
                     WHERE blocker=? AND blocked=?`,

                    [blocker, blocked],

                    () => {

                        res.json({
                            blocked: false
                        });

                    }

                );

            } else {

                db.run(

                    `INSERT INTO blocked_users(
                        blocker,
                        blocked,
                        createdAt
                    )
                    VALUES(?,?,?)`,

                    [
                        blocker,
                        blocked,
                        new Date().toISOString()
                    ],

                    () => {

                        res.json({
                            blocked: true
                        });

                    }

                );

            }

        }

    );

});


router.get("/is-blocked/:blocker/:blocked", (req, res) => {

    db.get(

        `SELECT *
         FROM blocked_users
         WHERE blocker=? AND blocked=?`,

        [
            req.params.blocker,
            req.params.blocked
        ],

        (err, row) => {

            if (err)
                return res.status(500).json(err);

            res.json({

                blocked: !!row

            });

        }

    );

});

// =====================================================
// GET COMMENTS
// =====================================================

router.get("/posts/:id/comments", (req, res) => {

    const postId = req.params.id;

    db.all(
        `
        SELECT
            c.id,
            c.postId,
            c.authorId,
            c.text,
            c.createdAt,
            c.mentions,

            u.username,
            u.displayName,
            u.avatar

        FROM global_comments c

        LEFT JOIN users u
            ON u.username = c.authorId

        WHERE c.postId=?

        ORDER BY c.id ASC
        `,
        [postId],
        (err, rows) => {

            if (err) {
                console.error(
                    "GET COMMENTS ERROR:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message: err.message
                });
            }

            const comments = rows.map(comment => ({
                id: comment.id,
                postId: comment.postId,
                authorId: comment.authorId,
                text: comment.text,
                createdAt: comment.createdAt,

                mentions:
                    parseJSON(
                        comment.mentions
                    ),

                author: {
                    username:
                        comment.username,

                    displayName:
                        comment.displayName ||
                        comment.username,

                    avatar:
                        comment.avatar
                }
            }));

            res.json(comments);
        }
    );
});


// =====================================================
// CREATE COMMENT
// =====================================================

router.post("/posts/:id/comments", (req, res) => {

    const postId = req.params.id;

    const {
        authorId,
        text
    } = req.body;

    if (!authorId) {
        return res.status(400).json({
            success: false,
            message: "Author is required"
        });
    }

    if (!text || !text.trim()) {
        return res.status(400).json({
            success: false,
            message: "Comment cannot be empty"
        });
    }

    const cleanText = text.trim();

    const mentions =
        extractMentions(cleanText);

    const createdAt =
        new Date().toISOString();

    db.run(
        `
        INSERT INTO global_comments
        (
            postId,
            authorId,
            text,
            createdAt,
            mentions
        )

        VALUES (?, ?, ?, ?, ?)
        `,
        [
            postId,
            authorId,
            cleanText,
            createdAt,
            JSON.stringify(mentions)
        ],
        function (err) {

            if (err) {

                console.error(
                    "CREATE COMMENT ERROR:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message: err.message
                });
            }

            db.get(
                `
                SELECT
                    c.id,
                    c.postId,
                    c.authorId,
                    c.text,
                    c.createdAt,
                    c.mentions,

                    u.username,
                    u.displayName,
                    u.avatar

                FROM global_comments c

                LEFT JOIN users u
                    ON u.username = c.authorId

                WHERE c.id=?
                `,
                [this.lastID],
                (err, comment) => {

                    if (err) {
                        return res.status(500).json({
                            success: false,
                            message: err.message
                        });
                    }

                    res.json({
                        success: true,

                        comment: {
                            id: comment.id,
                            postId:
                                comment.postId,

                            authorId:
                                comment.authorId,

                            text:
                                comment.text,

                            createdAt:
                                comment.createdAt,

                            mentions:
                                parseJSON(
                                    comment.mentions
                                ),

                            author: {
                                username:
                                    comment.username,

                                displayName:
                                    comment.displayName ||
                                    comment.username,

                                avatar:
                                    comment.avatar
                            }
                        }
                    });

                }
            );

        }
    );
});


// =====================================================
// SEARCH USERS FOR @MENTIONS
// =====================================================

router.get("/users/search", (req, res) => {

    const query =
        (req.query.q || "").trim();

    if (!query) {
        return res.json([]);
    }

    db.all(
        `
        SELECT
            username,
            displayName,
            avatar

        FROM users

        WHERE username LIKE ?

        OR displayName LIKE ?

        LIMIT 8
        `,
        [
            `${query}%`,
            `${query}%`
        ],
        (err, rows) => {

            if (err) {

                console.error(
                    "USER SEARCH ERROR:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message: err.message
                });
            }

            res.json(rows);
        }
    );
});



router.get("/donors", (req, res) => {

    getDonorRankings((err, rankings) => {

        if (err) {

            console.error(
                "DONOR RANKING ERROR:",
                err
            );

            return res.status(500).json({

                success: false,

                message: err.message

            });

        }

        res.json({

            success: true,

            donors: rankings

        });

    });

});

router.get("/donors/:username", (req, res) => {

    getDonorRankings((err, rankings) => {

        if (err) {

            return res.status(500).json({
                success: false,
                message: err.message
            });

        }

        const user = rankings.find(
            item =>
                item.username === req.params.username
        );

        if (!user) {

            return res.json({

                success: true,

                donor: {

                    username: req.params.username,

                    rank: null,

                    badgeNumber: null,

                    totalDonated: 0,

                    isTopDonor: false,

                    donorBadgeActive: false

                }

            });

        }

        res.json({

            success: true,

            donor: user

        });

    });

});

// =====================================================
// GET DONOR STATUS
// =====================================================

router.get("/donor-status/:username", (req, res) => {

    const username = req.params.username;

    getDonorRankings((err, rankings) => {

        if (err) {

            console.error("DONOR STATUS ERROR:", err);

            return res.status(500).json({
                success: false,
                message: err.message
            });

        }

        const user = rankings.find(
            donor => donor.username === username
        );

        if (!user) {

            return res.json({
                success: true,
                user: null
            });

        }

        res.json({
            success: true,
            user
        });

    });

});

module.exports = router;