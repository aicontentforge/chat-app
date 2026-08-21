const express = require("express");
const multer = require("multer");
const path = require("path");

const router = express.Router();

const storage = multer.diskStorage({

    destination: (req, file, cb) => {

        cb(null, "uploads/audio");

    },

    filename: (req, file, cb) => {

        cb(
            null,
            Date.now() +
            path.extname(file.originalname)
        );

    }

});

const upload = multer({

    storage

});

router.post(

    "/",

    upload.single("audio"),

    (req, res) => {

        res.json({

            audio:
                "/uploads/audio/" +
                req.file.filename

        });

    }

);

module.exports = router;