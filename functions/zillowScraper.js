const puppeteer = require('puppeteer-extra')
const RecaptchaPlugin = require('puppeteer-extra-plugin-recaptcha')
const { csvGenerate } = require('./csvGenerate')

const zillowScraper = () => {
    //const listings = new HashMap() // using map to ensure no dups
    let listingResults = {}
    let links = []
    let pageNum = 1


    // add listing to existing obj or create new if doesn't exist
    const serializeProperty = (info, obj) => {
        const [ listing ] = [ info.data.property ]

        const fields = {
            mlsId:          listing.mlsid,
            streetAddress:  listing.address.streetAddress,
            homeStatus:     listing.homeStatus,
            price:          listing.price,
            yearBuilt:      listing.yearBuilt,
            bedrooms:       listing.bedrooms,
            bathrooms:      listing.bathrooms,
            livingArea:     listing.livingArea,
            description:    listing.description,
            daysOnZillow:   listing.daysOnZillow
        }
        obj[[listing.mlsid]] = fields

        return obj
    }

    async function captcha(page) {

        await page.solveRecaptchas()

        await Promise.all([
            page.waitForNavigation(),
            page.click(`#recaptcha-anchor`)
        ])
    }


    async function goToListings(page, links) {
        const allLinks = links.join().split(',')

        /* eslint-disable no-await-in-loop */
        for (link of allLinks) {

            try {
                await captcha(page)
            }
            catch(err) {
                await page.goto(link, {waituntil: 'domcontentloaded'})
            }
        }
        /* eslint-disable no-await-in-loop */
    }

    
    let browserPromise = puppeteer.launch({
        args: [
            '--no-sandbox'
        ]
    })

    exports.screenshot = async (req, res) => {
        const url = req.query.url || 'http://example.com'

        console.log('We are getting to this point!')
        const browser = await browserPromise
        const context = await browser.createIncognitoBrowserContext()
        const page = await context.newPage()

        await page.goto(url)

        const image = await page.screenshot()

        res.setHeader('Content-Type', 'image/png')
        res.send(image)

        context.close()
    }


    //(async () => {
  
    //    // configuring recaptcha solver
    //    puppeteer.use(
    //        RecaptchaPlugin({ 
    //          provider: {
    //            id: '2captcha',
    //            token: require('./configs/2captchaConfig').token
    //          },          
    //          visualFeedback: true // (violet = detected, green = solved)
    //        })
    //    )
  
  
  
    //    // configure page
    //    const browser = await puppeteer.launch({
    //        headless: true
    //    })
    //    const page = (await browser.pages())[0]
    //    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.97 Safari/537.36')
    //    let url = "https://www.zillow.com/homes/92259/"
  
  
  
    //    let complete = false
    //    page.on('response', async res => {
    //        const resUrl = res.url()
  
  
    //        // gather listing info
    //        if (resUrl.search(/FullRenderQuery/g)  !== -1) {
    //            const response = await res.json()
    //            listingResults = await serializeProperty(response, listingResults)
    //        }
  
  
    //        // on response inside main page        
    //        else if (resUrl.search(/GetSearchPageState/g) !== -1 && !complete) {
  
    //            // get pages
    //            do {
  
  
    //                /* eslint-disable no-await-in-loop */
  
    //                // get all listings links for page
    //                links.push(await page.$$eval(
    //                        '.list-card-info', 
    //                        e => e.map(link => link.href))
    //                )
  
    //                /* eslint-enable no-await-in-loop */
  
  
    //                let nextPage = url + (++pageNum) + '_p/'   
    //                
    //                // go to next page
    //                Promise.all([
    //                    page.waitForNavigation(),
    //                    page.goto(nextPage)
    //                ])
    //                .catch()
  
    //            }
    //            while (page.url() !== url) // breaks when page redirects to org url
    //            complete = true
  
  
    //            await goToListings(page, links)
    //            await browser.close()
    //            await csvGenerate(listingResults)
    //        }
    //        return
    //    })
  
  
  
    //    // start scraping
    //    await page.goto(url, {waituntil: 'domcontentloaded'})
  
    //    try {
    //        captcha(page)
    //    }
    //    catch(err) {
    //      await console.log('no captcha')
    //    }
  
    //})(); 


    // default exceptions handling
    process.on('unhandledRejection', (reason, promise) => {
        if (reason.message !== "No node found for selector: #recaptcha-anchor") {
            console.log('Unhandled Rejection:', reason.message)
        }

    })
}


module.exports = {
    zillowScraper
}


/* 

    NOTE: 
    Look at updating the async/awaits use vid for example:
    https://youtu.be/vn3tm0quoqE?t=466

    For Future, consider using an observer to eliminate memory leaks
    when looping through listings by unsubscribing to event listeners

    HOW TO FIX:
    Good video example: https://www.youtube.com/watch?v=Tux1nhBPl_w
*/ 



// trying to clean repo.
// need to complete before moving on