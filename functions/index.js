const functions = require('firebase-functions')
//const { zillowScraper } = require('./zillowScraper')

// to deploy: gcloud functions deploy screenshot --trigger-http --runtime=nodejs10 --memory=1024mb



// creating one Chrome instance and reusing, 
// not creating a new one on each run 
const puppeteer = require('puppeteer-extra')
let browserPromise = puppeteer.launch({
    args: [
        '--no-sandbox'
    ]
})

exports.screenshot = async (req, res) => {
    const url = req.query.url || 'http://example.com'

    const browser = await browserPromise
    const context = await browser.createIncognitoBrowserContext() // creates fresh uncached results
    const page = await context.newPage()

    await page.goto(url)

    const image = await page.screenshot()

    res.setHeader('Content-Type', 'image/png')
    res.send(image)

    context.close() // only close page not browser instance
}


//zillowScraper()

// this is a test of firbase functions
// Take the text parameter passed to this HTTP endpoint and insert it into the
// Realtime Database under the path /messages/:pushId/original
/* exports.zillowScraper = functions.https.onRequest((req, res) => {
    zillowScraper()
}) */

