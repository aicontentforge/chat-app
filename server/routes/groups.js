const express = require("express");
const db = require("../database");

const router = express.Router();

/*
Create Group
*/
router.post("/create", (req, res) => {

    const {

        name,
        members,
        createdBy

    } = req.body;

    if (!name || !members || members.length === 0) {

        return res.status(400).json({
            message: "Invalid data"
        });

    }

    db.run(

        `INSERT INTO groups
(
    name,
    createdBy,
    createdAt
)
VALUES(?,?,?)`,

        [
    name,
    createdBy,
    new Date().toISOString()
],

        function (err) {

            if (err) {

                console.log("CREATE GROUP ERROR:");
                console.log(err);

                return res.status(500).json({
                    error: err.message
                });

            }

            const groupId = this.lastID;

            const stmt = db.prepare(

                `INSERT INTO group_members
                (
                groupId,
                username,
                role
                )
                VALUES(?,?,?)`

            );

            members.forEach(member => {

                stmt.run(

                    groupId,

                    member,

                    member === createdBy
                        ? "admin"
                        : "member"

                );

            });

            stmt.finalize();

            res.json({

                success: true,

                groupId

            });

        }

    );

});

/*
Get User Groups
*/
router.get("/:username", (req, res) => {

    const { username } = req.params;

    db.all(

        `
        SELECT
            groups.id,
            groups.name,
            groups.avatar
        FROM groups

        INNER JOIN group_members

        ON groups.id = group_members.groupId

        WHERE group_members.username = ?
        `,

        [username],

        (err, rows) => {

            if (err) {

                return res.status(500).json(err);

            }

            res.json(rows);

        }

    );

});


/*
Get Group Messages
*/

router.get("/messages/:groupId", (req,res)=>{

    db.all(

        `SELECT *

        FROM group_messages

        WHERE groupId=?

        ORDER BY id`,

        [req.params.groupId],

        (err,rows)=>{

            if(err){

                return res.status(500).json(err);

            }

            res.json(rows);

        }

    );

});

/*
Get Group Info
*/

router.get("/info/:groupId", (req, res) => {

    db.all(

        `
        SELECT
            groups.id,
            groups.name,
            groups.avatar,
            groups.createdBy,
            group_members.username,
            group_members.role

        FROM groups

        JOIN group_members

        ON groups.id = group_members.groupId

        WHERE groups.id = ?
        `,

        [req.params.groupId],

        (err, rows) => {

            if (err) {

                return res.status(500).json(err);

            }

            if (rows.length === 0) {

                return res.status(404).json({
                    message: "Group not found"
                });

            }

            res.json({

                id: rows[0].id,

                name: rows[0].name,

                avatar: rows[0].avatar,

                createdBy: rows[0].createdBy,

                members: rows.map(r => ({
                    username: r.username,
                    role: r.role
                }))

            });

        }

    );

});

/*
Rename Group
*/

router.put("/rename", (req, res) => {

    const {

        groupId,
        name

    } = req.body;

    db.run(

        `
        UPDATE groups
        SET name = ?
        WHERE id = ?
        `,

        [

            name,

            groupId

        ],

        function(err) {

            if (err) {

                return res.status(500).json(err);

            }

            res.json({

                success: true

            });

        }

    );

});

/*
Update Group Avatar
*/

router.put("/avatar", (req, res) => {

    const {

        groupId,

        avatar

    } = req.body;

    db.run(

        `
        UPDATE groups
        SET avatar=?
        WHERE id=?
        `,

        [

            avatar,

            groupId

        ],

        function(err){

            if(err){

                return res.status(500).json(err);

            }

            res.json({

                success:true

            });

        }

    );

});

/*
Add Member
*/

router.post("/add-member", (req, res) => {

    const {

        groupId,

        username

    } = req.body;

    db.get(

        `
        SELECT *
        FROM group_members
        WHERE groupId=?
        AND username=?
        `,

        [

            groupId,

            username

        ],

        (err,row)=>{

            if(err){

                return res.status(500).json(err);

            }

            if(row){

                return res.json({

                    success:false,

                    message:"Already a member"

                });

            }

            db.run(

                `
                INSERT INTO group_members
                (
                    groupId,
                    username,
                    role
                )
                VALUES(?,?,?)
                `,

                [

                    groupId,

                    username,

                    "member"

                ],

                function(err){

                    if(err){

                        return res.status(500).json(err);

                    }

                    res.json({

                        success:true

                    });

                }

            );

        }

    );

});

/*
Remove Member
*/

router.post("/remove-member", (req, res) => {

    const {

        groupId,
        username

    } = req.body;

    db.run(

        `
        DELETE FROM group_members
        WHERE groupId=?
        AND username=?
        `,

        [

            groupId,

            username

        ],

        function(err){

            if(err){

                return res.status(500).json(err);

            }

            res.json({

                success:true

            });

        }

    );

});

/*
Leave Group
*/

router.post("/leave", (req, res) => {

    const {

        groupId,

        username

    } = req.body;

    db.run(

        `
        DELETE FROM group_members
        WHERE groupId=?
        AND username=?
        `,

        [

            groupId,

            username

        ],

        function(err){

            if(err){

                return res.status(500).json(err);

            }

            db.get(

                `
                SELECT COUNT(*) AS total
                FROM group_members
                WHERE groupId=?
                `,

                [groupId],

                (err,row)=>{

                    if(err){

                        return res.status(500).json(err);

                    }

                    if(row.total===0){

                        db.run(

                            `DELETE FROM groups WHERE id=?`,

                            [groupId]

                        );

                        db.run(

                            `DELETE FROM group_messages WHERE groupId=?`,

                            [groupId]

                        );

                    }

                    res.json({

                        success:true

                    });

                }

            );

        }

    );

});

/*
Transfer Admin
*/

router.post("/transfer-admin", (req, res) => {

    const {

        groupId,
        oldAdmin,
        newAdmin

    } = req.body;

    db.serialize(() => {

        db.run(

            `
            UPDATE group_members
            SET role='member'
            WHERE groupId=?
            AND username=?
            `,

            [

                groupId,

                oldAdmin

            ]

        );

        db.run(

            `
            UPDATE group_members
            SET role='admin'
            WHERE groupId=?
            AND username=?
            `,

            [

                groupId,

                newAdmin

            ],

            function(err){

                if(err){

                    return res.status(500).json(err);

                }

                db.run(

                    `
                    UPDATE groups
                    SET createdBy=?
                    WHERE id=?
                    `,

                    [

                        newAdmin,

                        groupId

                    ],

                    ()=>{

                        res.json({

                            success:true

                        });

                    }

                );

            }

        );

    });

});

module.exports = router;