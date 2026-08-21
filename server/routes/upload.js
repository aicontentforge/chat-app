const express = require("express");
const upload = require("../upload");

const router = express.Router();

router.post("/", (req, res) => {

    upload.single("image")(req, res, (err) => {

        if (err) {

            console.error("UPLOAD ERROR:", err);

            return res.status(500).json({
                success: false,
                message: err.message
            });

        }

        if (!req.file) {

            return res.status(400).json({
                success: false,
                message: "No image uploaded"
            });

        }

        console.log("IMAGE UPLOADED:", req.file.filename);

        res.json({
            success: true,
            imageUrl: `/uploads/${req.file.filename}`
        });

    });

});

module.exports = router;