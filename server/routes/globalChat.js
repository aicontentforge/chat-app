const express = require("express");
const db = require("../database");

const router = express.Router();

// =====================================================
// HELPERS
// =====================================================

function parseJSON(value, fallback = []) {

    try {
        return JSON.parse(
            value || JSON.stringify(fallback)
        );
    } catch {
        return fallback;
    }

}


// Extract @mentions from text

function extractMentions(text) {

    if (!text) {
        return [];
    }

    const matches =
        text.match(/@[a-zA-Z0-9_]+/g);

    if (!matches) {
        return [];
    }

    return [
        ...new Set(
            matches.map(
                mention =>
                    mention.substring(1)
            )
        )
    ];

}


// =====================================================
// MODERATION HELPERS
// =====================================================

const REPORT_THRESHOLD = 3;

function hideReportedItem(reporterId, postId = null, commentId = null) {

    const createdAt = new Date().toISOString();

    db.run(
        `
        INSERT INTO global_hidden_items
        (
            reporterId,
            postId,
            commentId,
            createdAt
        )
        VALUES (?, ?, ?, ?)
        `,
        [
            reporterId,
            postId,
            commentId,
            createdAt
        ],
        err => {

            if (err) {
                console.error(
                    "HIDE GLOBAL ITEM ERROR:",
                    err
                );
            }

        }
    );
}


function checkReportThreshold(
    postId = null,
    commentId = null
) {

    let query = "";
    let params = [];

    if (postId) {

        query = `
            SELECT COUNT(*) AS count
            FROM global_reports
            WHERE postId=?
        `;

        params = [postId];

    } else {

        query = `
            SELECT COUNT(*) AS count
            FROM global_reports
            WHERE commentId=?
        `;

        params = [commentId];

    }

    db.get(
        query,
        params,
        (err, result) => {

            if (err) {

                console.error(
                    "REPORT COUNT ERROR:",
                    err
                );

                return;

            }

            if (
                result &&
                result.count >= REPORT_THRESHOLD
            ) {

                const updateQuery =
                    postId

                        ? `
                            UPDATE global_posts
                            SET status='pending_review'
                            WHERE id=?
                        `

                        : `
                            UPDATE global_comments
                            SET status='pending_review'
                            WHERE id=?
                        `;

                db.run(
                    updateQuery,
                    [
                        postId || commentId
                    ],
                    updateErr => {

                        if (updateErr) {

                            console.error(
                                "MODERATION STATUS ERROR:",
                                updateErr
                            );

                        }

                    }
                );

            }

        }
    );
}


// =====================================================
// GET GLOBAL POSTS
// =====================================================

// =====================================================
// GET GLOBAL POSTS
// =====================================================

router.get("/posts", (req, res) => {

    const currentUser =
        req.query.user || "";

    db.all(

        `
        SELECT
            p.id,
            p.authorId,
            p.text,
            p.imageUrl,
            p.createdAt,
            p.likedBy,
            p.mentions,
            p.status,

            u.username,
            u.displayName,
            u.avatar,
            u.age,
            u.countryCode

        FROM global_posts p

        LEFT JOIN users u
            ON u.username = p.authorId

        WHERE
            (
                p.status IS NULL
                OR p.status = 'active'
            )

            AND NOT EXISTS (

                SELECT 1
                FROM global_hidden_items h

                WHERE
                    h.postId = p.id
                    AND h.reporterId = ?

            )

            AND NOT EXISTS (

                SELECT 1
                FROM blocked_users b

                WHERE
                    b.blocker = ?
                    AND b.blocked = p.authorId

            )

        ORDER BY p.id DESC
        `,

        [
            currentUser,
            currentUser
        ],

        (err, rows) => {

            if (err) {

                console.error(
                    "GLOBAL POSTS ERROR:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message: err.message
                });

            }

            const posts =
                rows.map(post => {

                    const likedBy =
                        parseJSON(
                            post.likedBy
                        );

                    return {

                        id:
                            post.id,

                        authorId:
                            post.authorId,

                        text:
                            post.text,

                        imageUrl:
                            post.imageUrl,

                        createdAt:
                            post.createdAt,

                        status:
                            post.status || "active",

                        likedBy,

                        mentions:
                            parseJSON(
                                post.mentions
                            ),

                        author: {

                            username:
                                post.username,

                            displayName:
                                post.displayName ||
                                post.username,

                            avatar:
                                post.avatar,

                            age:
                                post.age,

                            countryCode:
                                post.countryCode

                        },

                        liked:
                            likedBy.includes(
                                currentUser
                            ),

                        likeCount:
                            likedBy.length

                    };

                });

            res.json(posts);

        }

    );

});


// =====================================================
// REPORT POST
// =====================================================

router.post("/posts/:id/report", (req, res) => {

    const postId =
        req.params.id;

    const {
        reporterId,
        reason
    } = req.body;

    if (!reporterId) {

        return res.status(400).json({
            success: false,
            message: "Reporter is required"
        });

    }

    const cleanReason =
        (reason || "Other").trim();

    db.get(
        `
        SELECT id
        FROM global_posts
        WHERE id=?
        `,
        [postId],
        (err, post) => {

            if (err) {
                return res.status(500).json(err);
            }

            if (!post) {

                return res.status(404).json({
                    success: false,
                    message: "Post not found"
                });

            }

            // Prevent duplicate report

            db.get(
                `
                SELECT id
                FROM global_reports
                WHERE
                    postId=?
                    AND reporterId=?
                `,
                [
                    postId,
                    reporterId
                ],
                (err, existing) => {

                    if (err) {
                        return res.status(500).json(err);
                    }

                    if (existing) {

                        return res.status(400).json({
                            success: false,
                            message:
                                "You already reported this post"
                        });

                    }

                    const createdAt =
                        new Date().toISOString();

                    db.run(
                        `
                        INSERT INTO global_reports
                        (
                            postId,
                            commentId,
                            reporterId,
                            reason,
                            createdAt
                        )
                        VALUES (?, NULL, ?, ?, ?)
                        `,
                        [
                            postId,
                            reporterId,
                            cleanReason,
                            createdAt
                        ],
                        function (err) {

                            if (err) {

                                console.error(
                                    "REPORT POST ERROR:",
                                    err
                                );

                                return res.status(500).json({
                                    success: false,
                                    message:
                                        err.message
                                });

                            }

                            // Hide immediately
                            hideReportedItem(
                                reporterId,
                                postId,
                                null
                            );

                            // Check 3-report threshold
                            checkReportThreshold(
                                postId,
                                null
                            );

                            res.json({

                                success: true,

                                message:
                                    "Post reported successfully",

                                reportId:
                                    this.lastID

                            });

                        }
                    );

                }
            );

        }
    );

});


// =====================================================
// REPORT COMMENT
// =====================================================

router.post(
    "/comments/:id/report",
    (req, res) => {

        const commentId =
            req.params.id;

        const {
            reporterId,
            reason
        } = req.body;

        if (!reporterId) {

            return res.status(400).json({
                success: false,
                message:
                    "Reporter is required"
            });

        }

        const cleanReason =
            (reason || "Other").trim();

        db.get(
            `
            SELECT id
            FROM global_comments
            WHERE id=?
            `,
            [commentId],
            (err, comment) => {

                if (err) {
                    return res.status(500).json(err);
                }

                if (!comment) {

                    return res.status(404).json({
                        success: false,
                        message:
                            "Comment not found"
                    });

                }

                db.get(
                    `
                    SELECT id
                    FROM global_reports

                    WHERE
                        commentId=?
                        AND reporterId=?
                    `,
                    [
                        commentId,
                        reporterId
                    ],
                    (err, existing) => {

                        if (err) {
                            return res.status(500).json(err);
                        }

                        if (existing) {

                            return res.status(400).json({
                                success: false,
                                message:
                                    "You already reported this comment"
                            });

                        }

                        const createdAt =
                            new Date().toISOString();

                        db.run(
                            `
                            INSERT INTO global_reports
                            (
                                postId,
                                commentId,
                                reporterId,
                                reason,
                                createdAt
                            )

                            VALUES (
                                NULL,
                                ?,
                                ?,
                                ?,
                                ?
                            )
                            `,
                            [
                                commentId,
                                reporterId,
                                cleanReason,
                                createdAt
                            ],
                            function (err) {

                                if (err) {

                                    return res.status(500).json({
                                        success: false,
                                        message:
                                            err.message
                                    });

                                }

                                hideReportedItem(
                                    reporterId,
                                    null,
                                    commentId
                                );

                                checkReportThreshold(
                                    null,
                                    commentId
                                );

                                res.json({

                                    success: true,

                                    message:
                                        "Comment reported successfully",

                                    reportId:
                                        this.lastID

                                });

                            }
                        );

                    }
                );

            }
        );

    }
);
// =====================================================
// CREATE POST
// =====================================================

router.post("/posts", (req, res) => {

    const {

        authorId,
        text,
        imageUrl

    } = req.body;

    if (!authorId) {

        return res.status(400).json({
            success: false,
            message: "Author is required"
        });

    }

    if (
        (!text || !text.trim()) &&
        !imageUrl
    ) {

        return res.status(400).json({
            success: false,
            message:
                "Post must contain text or an image"
        });

    }

    const cleanText =
        (text || "").trim();

    const mentions =
        extractMentions(cleanText);

    const createdAt =
        new Date().toISOString();

    db.run(

        `
        INSERT INTO global_posts
        (
            authorId,
            text,
            imageUrl,
            createdAt,
            likedBy,
            mentions,
            status
        )

        VALUES (?, ?, ?, ?, ?, ?, ?)
        `,

        [
    authorId,
    cleanText,
    imageUrl || "",
    createdAt,
    JSON.stringify([]),
    JSON.stringify(mentions),
    "active"
],

        function (err) {

            if (err) {

                console.error(
                    "CREATE GLOBAL POST ERROR:",
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
                    p.*,

                    u.username,
                    u.displayName,
                    u.avatar,
                    u.age,
                    u.countryCode

                FROM global_posts p

                LEFT JOIN users u
                    ON u.username = p.authorId

                WHERE p.id=?
                `,

                [this.lastID],

                (err, post) => {

                    if (err) {

                        return res.status(500).json({
                            success: false,
                            message: err.message
                        });

                    }

                    res.json({

                        success: true,

                        post: {

                            id: post.id,

                            authorId:
                                post.authorId,

                            text:
                                post.text,

                            imageUrl:
                                post.imageUrl,

                            createdAt:
                                post.createdAt,

                            likedBy: [],

                            mentions:
                                parseJSON(
                                    post.mentions
                                ),

                            author: {

                                username:
                                    post.username,

                                displayName:
                                    post.displayName ||
                                    post.username,

                                avatar:
                                    post.avatar,

                                age:
                                    post.age,

                                countryCode:
                                    post.countryCode

                            },

                            liked: false,

                            likeCount: 0

                        }

                    });

                }

            );

        }

    );

});


// =====================================================
// LIKE / UNLIKE
// =====================================================

router.post("/posts/:id/like", (req, res) => {

    const {
        userId
    } = req.body;

    const postId =
        req.params.id;

    if (!userId) {

        return res.status(400).json({
            success: false,
            message: "User required"
        });

    }

    db.get(

        `
        SELECT likedBy
        FROM global_posts
        WHERE id=?
        `,

        [postId],

        (err, post) => {

            if (err) {
                return res.status(500).json(err);
            }

            if (!post) {

                return res.status(404).json({
                    success: false,
                    message: "Post not found"
                });

            }

            let likedBy =
                parseJSON(post.likedBy);

            if (likedBy.includes(userId)) {

                likedBy =
                    likedBy.filter(
                        id => id !== userId
                    );

            } else {

                likedBy.push(userId);

            }

            db.run(

                `
                UPDATE global_posts
                SET likedBy=?
                WHERE id=?
                `,

                [
                    JSON.stringify(likedBy),
                    postId
                ],

                err => {

                    if (err) {
                        return res.status(500).json(err);
                    }

                    res.json({

                        success: true,

                        liked:
                            likedBy.includes(
                                userId
                            ),

                        likedBy,

                        likeCount:
                            likedBy.length

                    });

                }

            );

        }

    );

});


// =====================================================
// GET COMMENTS
// =====================================================

router.get("/posts/:postId/comments", (req, res) => {

    const postId =
        req.params.postId;

    const currentUser =
        req.query.user || "";

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
            u.avatar,
            u.age,
            u.countryCode

        FROM global_comments c

        LEFT JOIN users u
            ON u.username = c.authorId

        WHERE
    c.postId=?

    AND
    (
        c.status IS NULL
        OR c.status = 'active'
    )

    AND NOT EXISTS (

        SELECT 1
        FROM global_hidden_items h

        WHERE
            h.commentId = c.id
            AND h.reporterId = ?

    )

    AND NOT EXISTS (

        SELECT 1
        FROM blocked_users b

        WHERE
            b.blocker = ?
            AND b.blocked = c.authorId

    )

        ORDER BY c.id ASC
        `,

        [
    postId,
    currentUser,
    currentUser
],

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

            const comments =
                rows.map(comment => ({

                    id:
                        comment.id,

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
                            comment.avatar,

                        age:
                            comment.age,

                        countryCode:
                            comment.countryCode

                    }

                }));

            res.json(comments);

        }

    );

});


// =====================================================
// CREATE COMMENT
// =====================================================

router.post("/posts/:postId/comments", (req, res) => {

    const postId =
        req.params.postId;

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

    const cleanText =
        text.trim();

    const mentions =
        extractMentions(cleanText);

    const createdAt =
        new Date().toISOString();

    // Make sure post exists

    db.get(
        `
        SELECT id
        FROM global_posts
        WHERE id=?
        `,
        [postId],
        (err, post) => {

            if (err) {
                return res.status(500).json(err);
            }

            if (!post) {

                return res.status(404).json({
                    success: false,
                    message: "Post not found"
                });

            }

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

                    JSON.stringify(
                        mentions
                    )

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
                            u.avatar,
                            u.age,
                            u.countryCode

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
                                    message:
                                        err.message
                                });

                            }

                            res.json({

                                success: true,

                                comment: {

                                    id:
                                        comment.id,

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
                                            comment.avatar,

                                        age:
                                            comment.age,

                                        countryCode:
                                            comment.countryCode

                                    }

                                }

                            });

                        }

                    );

                }

            );

        }

    );

});


// =====================================================
// USER SEARCH FOR @MENTIONS
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
            avatar,
            age,
            countryCode

        FROM users

        WHERE username LIKE ?

        OR displayName LIKE ?

        ORDER BY username ASC

        LIMIT 8
        `,

        [
            `%${query}%`,
            `%${query}%`
        ],

        (err, rows) => {

            if (err) {

                return res.status(500).json({
                    success: false,
                    message: err.message
                });

            }

            res.json(rows);

        }

    );

});


// =====================================================
// BLOCK USER FROM WORLD CHAT
// =====================================================

router.post("/users/:username/block", (req, res) => {

    const blocked =
        req.params.username;

    const {
        blocker
    } = req.body;

    if (!blocker) {

        return res.status(400).json({
            success: false,
            message:
                "Blocker is required"
        });

    }

    if (blocker === blocked) {

        return res.status(400).json({
            success: false,
            message:
                "You cannot block yourself"
        });

    }

    db.get(
        `
        SELECT id
        FROM users
        WHERE username=?
        `,
        [blocked],
        (err, targetUser) => {

            if (err) {
                return res.status(500).json(err);
            }

            if (!targetUser) {

                return res.status(404).json({
                    success: false,
                    message:
                        "User not found"
                });

            }

            db.get(
                `
                SELECT id
                FROM blocked_users

                WHERE
                    blocker=?
                    AND blocked=?
                `,
                [
                    blocker,
                    blocked
                ],
                (err, existing) => {

                    if (err) {
                        return res.status(500).json(err);
                    }

                    if (existing) {

                        return res.json({
                            success: true,
                            blocked: true,
                            message:
                                "User already blocked"
                        });

                    }

                    const createdAt =
                        new Date().toISOString();

                    db.run(
                        `
                        INSERT INTO blocked_users
                        (
                            blocker,
                            blocked,
                            createdAt
                        )

                        VALUES (?, ?, ?)
                        `,
                        [
                            blocker,
                            blocked,
                            createdAt
                        ],
                        err => {

                            if (err) {

                                return res.status(500).json({
                                    success: false,
                                    message:
                                        err.message
                                });

                            }

                            res.json({

                                success: true,

                                blocked: true,

                                message:
                                    "User blocked"

                            });

                        }
                    );

                }
            );

        }
    );

});

module.exports = router;