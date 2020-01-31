const functions = require('firebase-functions')
const puppeteer = require('puppeteer-extra')
//const cors = require('cors')

require('dotenv').config()
const { token } = require('./configs/2captchaConfig')
const { scraper } = require('./scraper')

// to deploy: gcloud functions deploy zillowScraper --trigger-http --runtime=nodejs10 --memory=1024mb


// configuring recaptcha solver
const RecaptchaPlugin = require('puppeteer-extra-plugin-recaptcha')
puppeteer.use(
    RecaptchaPlugin({ 
      provider: {
        id: '2captcha',
        token
      },          
      visualFeedback: true // (violet = detected, green = solved)
    })
)

// creating one Chrome instance and reusing, 
// not creating a new one on each run 
let browserPromise = puppeteer.launch({
    args: [
        "--no-sandbox",
        "--disable-web-security",
        "--disable-features=CrossSiteDocumentBlockingAlways,CrossSiteDocumentBlockingIfIsolating",
        "--disable-setuid-sandbox"
    ],
    headless: true
})



exports.zillowScraper = functions.https.onRequest( async (req, res) => {

    //cors(req, res, async () => {
        console.log("it is TIME!!!")

        const url = req.query.location 
            ? `https://www.zillow.com/homes/${req.query.location}` 
            : "https://www.zillow.com/homes/92259/"

        const browser = await browserPromise
        const context = await browser.createIncognitoBrowserContext() // creates fresh uncached results
        const page = await context.newPage()
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.97 Safari/537.36')
        await console.log("This is the url:", url)
            
        
        scraper(page, url, context)
        res.status(200)
    //})
})


/* 

What I need to do:

I think I need to get all links like I already am, and then rather than
loop through to get responses, I will get requests and fetch them using express

I may need to store request urls in collection then write a serperate function
to make the requests... hopefully not as that will be more taxing on server
and result in more costs.

*/