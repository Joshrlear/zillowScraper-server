const express = require('express')
const app = express()
const puppeteer = require('puppeteer-extra')
require('dotenv').config()


const { token } = require('./configs/2captchaConfig')
const { scraper } = require('./scraper')



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

// creating one Chrome instance and reusing
let browserPromise = puppeteer.launch({
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
  ],
  ignoreDefaultArgs: ['--disable-extensions'],
  headless: true
})


app.get('/', async (req, res) => {
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
    res.end()
})

app.listen(process.env.PORT || 3000)

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection in the server at:', p, 'reason:', reason);
  // application specific logging, throwing an error, or other logic here
})