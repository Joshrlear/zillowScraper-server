const functions = require('firebase-functions')
const { zillowScraper } = require('./zillowScraper')

zillowScraper()

// this is a test of firbase functions
// Take the text parameter passed to this HTTP endpoint and insert it into the
// Realtime Database under the path /messages/:pushId/original
exports.zillowScraper = functions.https.onRequest((req, res) => {
    zillowScraper()
})

