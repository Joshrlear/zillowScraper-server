//const functions = require('firebase-functions')
const puppeteer = require('puppeteer-extra')
const RecaptchaPlugin = require('puppeteer-extra-plugin-recaptcha')
const now = require("performance-now")



// helper functions
const serializeProperty = info => {
    const { data } = info
    console.log('this is the property address:', data.property.address)
        return ({
            address:        data.property.address.streetAddress,
            homeStatus:     data.property.homeStatus,
            price:          data.property.price,
            yearBuilt:      data.property.yearBuilt,
            bedrooms:       data.property.bedrooms,
            bathrooms:      data.property.bathrooms,
            livingArea:     data.property.livingArea,
            description:    data.property.description,
            daysOnZillow:   data.property.daysOnZillow
        })
}

async function getProperties(page) {

    const items = await page.$$('.list-card-info')
    for (let i = 0, length = items.length; i < length; i++) {
        const t1 = await now()
        const item = await page.evaluateHandle((i) => {
            return document.querySelectorAll('.list-card-info')[i]
        }, i)
        await Promise.all([
            page.waitForSelector('.list-card-info'),
            page.waitForNavigation({waitUntil: 'domcontentloaded'}),
            item.click()
        ])
        .then(() => {
            Promise.all([
                page.waitForNavigation({waitUntil: 'domcontentloaded'}),
                page.goBack({waitUntil: 'load'}),
                page.waitForSelector('.list-card-info')
            ])
        })
        
        const t2 = await now()
        await console.log('time taken:', t2 - t1)
    }

    //const hrefs = await page.$$('.list-card-info', urls => urls.map(a => a))

    /* for (let href of hrefs) {
        await console.count() */
        

        //const t1 = await now()
        
        /* await Promise.all([
            page.waitForNavigation(),
            page.click('.list-card-info', {waitUntil: 'load'}) // captcha error is here
        ])
        .catch(async () => {
            console.log('getting error while trying to goto properties')
            await checkCaptcha(page) // its not trying to check captcha for some reason...
        })

        const t2 = await now()
        await console.log('time taken:', t2 - t1) */

    //}
    await console.log('looks like we finished the loop!')
}

async function getResultCount(response) {
    const res = await response.json()
    const { resultsPerPage } = res.searchList

    return { resultsPerPage }
}

async function checkCaptcha(page) {

    await console.log('solving captcha')
    await page.solveRecaptchas()

    await console.log('solved the captcha!')
    await Promise.all([
        page.waitForNavigation(),
        page.click(`#recaptcha-anchor`)
    ])

}


// start puppeteer
(async () => {

    puppeteer.use(
        RecaptchaPlugin({ // configuring recaptcha solver
          provider: {
            id: '2captcha',
            token: require('./util/2captchaConfig').token
          },
          visualFeedback: true // colorize reCAPTCHAs (violet = detected, green = solved)
        })
    )

    const browser = await puppeteer.launch({
        headless: false,
        //devtools: true
    })
    const page = (await browser.pages())[0]
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.97 Safari/537.36')
    let url = "https://www.zillow.com/homes/92019/"
    let properties = []
    let firstRun = true // set on each newPage
    let resultsPerPage = 0 
    let count = 0

    try {

        // Listen for all relevant responses
        page.on('response', async response => {

            // listing page > response for property info
            if (response.url().search('FullRenderQuery')  != -1) {
                console.log('pushing response to properties...')
                const res = await response.json()
                //response.request().abort()
                //await page.evaluate(() => window.stop())

                await properties.push(serializeProperty(res))

            }


            // main page > response for all listings
            if (response.request().resourceType() === 'fetch' && response.url().includes('GetSearchPageState')) {


                if (firstRun) {
                    firstRun = false

                    await getProperties(page, 1, 40)
                    // get number of pages
                    /* const pageCount = (await page.$$eval('ol[class=zsg-pagination] > li', li => li.length)) - 3
                    await console.log('pageCount:', pageCount)
                    for (let i = 0; i < pageCount; i++) {

                        while (count <= resultsPerPage) {
                            await console.log('getting the response...', ++count)

                            resultsPerPage < count && ({ resultsPerPage } = await getResultCount(response)) // get next page url
                            await console.log('The results per page:', resultsPerPage)


                            await getProperties(page, count, resultsPerPage) // scrape and add to array
                            await console.log('currently, the url is:', page.url())
                            await console.log('properties here:', properties)
                        }

                    } */

                    await console.log('here are the properties:', properties)

                    await browser.close()
                }

            }        

        })

    }
    catch {

        await checkCaptcha(page)

    }
    finally {

        console.log('finally...')

    }

    await page.goto(url)
    
})(); 


process.on('unhandledRejection', (reason, promise) => {
    console.log('Unhandled Rejection at:', promise, 'reason:', reason);
})
