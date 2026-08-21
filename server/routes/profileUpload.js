const express = require("express");
const multer = require("multer");
const path = require("path");

const router = express.Router();

const storage = multer.diskStorage({

    destination(req, file, cb) {

        cb(null, "uploads/avatars");

    },

    filename(req, file, cb) {

        cb(

            null,

            Date.now() + path.extname(file.originalname)

        );

    }

});

const upload = multer({ storage });

router.post(

    "/",

    upload.single("avatar"),

    (req, res) => {

        res.json({

            avatar: `/uploads/avatars/${req.file.filename}`

        });

    }

);

module.exports = router;