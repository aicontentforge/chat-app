const express = require("express");
const db = require("../database");

const router = express.Router();

/*
Return conversation between two users
*/
module.exports = router;

router.get("/search/:user1/:user2/:query", (req, res) => {

    const { user1, user2, query } = req.params;

    db.all(

        `
        SELECT *
        FROM messages
        WHERE
        (
            (sender=? AND receiver=?)
            OR
            (sender=? AND receiver=?)
        )
        AND message LIKE ?
        ORDER BY id
        `,

        [

            user1,
            user2,

            user2,
            user1,

            `%${query}%`

        ],

        (err, rows) => {

            if (err) {

                return res.status(500).json(err);

            }

            res.json(rows);

        }

    );

});

router.get("/conversations/:username", (req, res) => {

    const { username } = req.params;

    db.all(

        `
        SELECT
            m1.id,
            m1.sender,
            m1.receiver,
            m1.message,
            m1.image,
            m1.audio,
            m1.time,
            m1.seen,
            m1.reaction,
            m1.replyTo,

            (
                SELECT COUNT(*)
                FROM messages m2
                WHERE
                    m2.sender =
                        CASE
                            WHEN m1.sender = ?
                            THEN m1.receiver
                            ELSE m1.sender
                        END
                AND m2.receiver = ?
                AND m2.seen = 0
            ) AS unread

        FROM messages m1

        WHERE m1.id IN (

            SELECT MAX(id)
            FROM messages
            WHERE sender = ?
               OR receiver = ?
            GROUP BY
                CASE
                    WHEN sender = ?
                    THEN receiver
                    ELSE sender
                END

        )

        ORDER BY m1.id DESC
        `,

        [
            username,
            username,

            username,
            username,

            username
        ],

        (err, rows) => {

            if (err) {

                console.log(err);
                return res.status(500).json(err);

            }

            res.json(rows);

        }

    );

});

router.get("/:user1/:user2", (req, res) => {

    const { user1, user2 } = req.params;

    db.all(

        `SELECT
        id,
        sender,
        receiver,
        message,
        image,
        audio,
        time,
        seen,
        reaction,
        replyTo
        FROM messages
        WHERE
        (sender=? AND receiver=?)
        OR
        (sender=? AND receiver=?)
        ORDER BY id`,

        [

            user1,
            user2,

            user2,
            user1

        ],

        (err, rows) => {

            if (err) {

                return res.status(500).json(err);

            }

            res.json(rows);

        }

    );

});
router.get("/chatlist/:username", (req, res) => {

    const { username } = req.params;

    db.all(

        `
        SELECT DISTINCT

        CASE
            WHEN sender = ?
            THEN receiver
            ELSE sender
        END AS username

        FROM messages

        WHERE sender = ?
        OR receiver = ?
        `,

        [
            username,
            username,
            username
        ],

        (err, rows) => {

            if (err) {

                return res.status(500).json(err);

            }

            res.json(rows);

        }

    );

});


router.delete("/clear/:sender/:receiver", async (req, res) => {

    const { sender, receiver } = req.params;

    try {

        await db.query(
            `
            DELETE FROM messages
            WHERE
            (sender=? AND receiver=?)
            OR
            (sender=? AND receiver=?)
            `,
            [
                sender,
                receiver,
                receiver,
                sender
            ]
        );

        res.json({
            success: true
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            error: "Failed to clear chat"
        });

    }

});


router.get("/media/:user1/:user2", (req, res) => {

    const { user1, user2 } = req.params;

    db.all(

        `
        SELECT
            id,
            sender,
            image,
            time
        FROM messages
        WHERE
            image IS NOT NULL
            AND image != ''
        AND
        (
            (sender=? AND receiver=?)
            OR
            (sender=? AND receiver=?)
        )
        ORDER BY id DESC
        `,

        [
            user1,
            user2,
            user2,
            user1
        ],

        (err, rows) => {

            if (err)
                return res.status(500).json(err);

            res.json(rows);

        }

    );

});

router.get("/files/:user1/:user2", (req, res) => {

    const { user1, user2 } = req.params;

    db.all(

        `
        SELECT
            id,
            sender,
            file,
            fileName,
            time
        FROM messages
        WHERE
            file IS NOT NULL
            AND file != ''
        AND (
            (sender=? AND receiver=?)
            OR
            (sender=? AND receiver=?)
        )
        ORDER BY id DESC
        `,

        [user1, user2, user2, user1],

        (err, rows) => {

            if (err)
                return res.status(500).json(err);

            res.json(rows);

        }

    );

});

router.get("/voices/:user1/:user2", (req, res) => {

    const { user1, user2 } = req.params;

    db.all(

        `
        SELECT
            id,
            sender,
            audio,
            time
        FROM messages
        WHERE
            audio IS NOT NULL
            AND audio!=''
        AND (
            (sender=? AND receiver=?)
            OR
            (sender=? AND receiver=?)
        )
        ORDER BY id DESC
        `,

        [user1,user2,user2,user1],

        (err,rows)=>{

            if(err)
                return res.status(500).json(err);

            res.json(rows);

        }

    );

});

router.get("/links/:user1/:user2",(req,res)=>{

    const {user1,user2}=req.params;

    db.all(

`
SELECT
id,
sender,
message,
time
FROM messages
WHERE
message LIKE '%http%'
AND
(
(sender=? AND receiver=?)
OR
(sender=? AND receiver=?)
)
ORDER BY id DESC
`,

[user1,user2,user2,user1],

(err,rows)=>{

    if(err)
        return res.status(500).json(err);

    res.json(rows);

});

});

router.get("/search-all/:user1/:user2/:query",(req,res)=>{

const {user1,user2,query}=req.params;

db.all(

`
SELECT *
FROM messages
WHERE
(
(sender=? AND receiver=?)
OR
(sender=? AND receiver=?)
)
AND
message LIKE ?
ORDER BY id DESC
`,

[
user1,
user2,
user2,
user1,
`%${query}%`
],

(err,rows)=>{

if(err)
return res.status(500).json(err);

res.json(rows);

});

});

router.get("/search-all/:user1/:user2/:query", (req, res) => {

    const { user1, user2, query } = req.params;

    db.all(
        `
        SELECT *
        FROM messages
        WHERE
        (
            (sender=? AND receiver=?)
            OR
            (sender=? AND receiver=?)
        )
        AND message LIKE ?
        ORDER BY id DESC
        `,
        [
            user1,
            user2,
            user2,
            user1,
            `%${query}%`
        ],
        (err, rows) => {

            if (err)
                return res.status(500).json(err);

            res.json(rows);

        }
    );

});

router.get("/starred/:user/:other", async (req, res) => {

    const { user, other } = req.params;

    db.all(

        `SELECT * FROM messages
         WHERE reaction='⭐'
         AND (
             (sender=? AND receiver=?)
             OR
             (sender=? AND receiver=?)
         )
         ORDER BY id DESC`,

        [user, other, other, user],

        (err, rows) => {

            if (err) return res.status(500).json(err);

            res.json(rows);

        }

    );

});

// ===============================
// Get all starred messages
// ===============================
router.get("/starred/:user/:friend", (req, res) => {

    const { user, friend } = req.params;

    db.all(
        `
        SELECT *
        FROM messages
        WHERE
        (
            (sender=? AND receiver=?)
            OR
            (sender=? AND receiver=?)
        )
        AND reaction='⭐'
        ORDER BY id DESC
        `,
        [user, friend, friend, user],
        (err, rows) => {

            if (err) {
                return res.status(500).json(err);
            }

            res.json(rows);

        }
    );

});

router.get("/export/:sender/:receiver", (req, res) => {

    const { sender, receiver } = req.params;

    db.all(

        `SELECT *
         FROM messages
         WHERE
         (sender=? AND receiver=?)
         OR
         (sender=? AND receiver=?)
         ORDER BY id ASC`,

        [
            sender,
            receiver,
            receiver,
            sender
        ],

        (err, rows) => {

            if (err)
                return res.status(500).json(err);

            res.json(rows);

        }

    );

});

module.exports = router;