const { google } = require("googleapis");
const path = require("path");

const PACKAGE_NAME = process.env.GOOGLE_PLAY_PACKAGE_NAME;

const auth = new google.auth.GoogleAuth({
    keyFile: path.join(
        __dirname,
        "..",
        "google-service-account.json"
    ),
    scopes: [
        "https://www.googleapis.com/auth/androidpublisher"
    ]
});

const androidpublisher =
    google.androidpublisher({
        version: "v3",
        auth
    });

async function verifyProductPurchase(
    productId,
    purchaseToken
) {

    const response =
        await androidpublisher.purchases.products.get({

            packageName: PACKAGE_NAME,

            productId,

            token: purchaseToken

        });

    return response.data;
}

async function consumeProductPurchase(
    productId,
    purchaseToken
) {

    await androidpublisher.purchases.products.consume({

        packageName: PACKAGE_NAME,

        productId,

        token: purchaseToken

    });

}

module.exports = {
    verifyProductPurchase,
    consumeProductPurchase
};