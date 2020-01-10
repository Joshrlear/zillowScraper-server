//const functions = require('firebase-functions')
const puppeteer = require('puppeteer-extra')
const RecaptchaPlugin = require('puppeteer-extra-plugin-recaptcha')
const HashMap = require('hashmap')
const fetch = require('node-fetch')
const now = require("performance-now")



const serializeProperty = info => {
    const { data } = info
    return ({
        key: data.property.address.streetAddress,
        value: 
            {
            homeStatus:     data.property.homeStatus,
            price:          data.property.price,
            yearBuilt:      data.property.yearBuilt,
            bedrooms:       data.property.bedrooms,
            bathrooms:      data.property.bathrooms,
            livingArea:     data.property.livingArea,
            description:    data.property.description,
            daysOnZillow:   data.property.daysOnZillow
            
        }
    })
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

    for (link of allLinks) {
        
        try {
            await captcha(page)
        }
        catch {
            await page.goto(link, {waituntil: 'domcontentloaded'})
        }
    }
}



(async () => {
    
    // configuring recaptcha solver
    puppeteer.use(
        RecaptchaPlugin({ 
          provider: {
            id: '2captcha',
            token: require('./util/2captchaConfig').token
          },          
          visualFeedback: true // (violet = detected, green = solved)
        })
    )



    // configure page
    const browser = await puppeteer.launch({
        headless: false
    })
    const page = (await browser.pages())[0]
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.97 Safari/537.36')
    let url = "https://www.zillow.com/homes/92019/"


    const listings = new HashMap() // using map to ensure no dups
    let links = []
    let morePages = true
    let pageNum = 1

    // setup response intercepts
    page.on('response', async res => {
        const resUrl = res.url()


        // gather listing info
        if (resUrl.search(/FullRenderQuery/g)  != -1) {
            const response = await res.json()
            const { key, value } = serializeProperty(response)
            await listings.set(key, value)
            console.log(Array.from(listings))
        }



        // on response inside main page        
        else if (resUrl.search(/GetSearchPageState/g) != -1) {

            // get pages
            do {     

                links.push(await page.$$eval(
                        '.list-card-info', 
                        e => e.map(link => link.href))
                )

                let nextPage = url + (++pageNum) + '_p/'   

                await Promise.all([
                    page.waitForNavigation(),
                    page.goto(nextPage)
                ])
                .catch(() => {
                    console.log('in the catch for next page...')
                    morePages = false
                })
                
            }
            while (page.url() !== url)



            // go to listings
            await goToListings(page, links)

            await browser.close()
            await console.log(listings)
        }
        return
    })



    // start scraping
    await page.goto(url, {waituntil: 'domcontentloaded'})
    
    try {
        captcha(page)
    }
    catch {
      await console.log('no captcha')
    }
    
})(); 


// default exceptions handling
process.on('unhandledRejection', (reason, promise) => {
    console.log('Unhandled Rejection:', reason.message);
})

/* 
    NOTE: 
    Look at updating the async/awaits use vid for example:
    https://youtu.be/vn3tm0quoqE?t=466

    For Future, consider using an observer to eliminate memory leaks
    when looping through listings by unsubscribing to event listeners

    HOW TO FIX:
    Good video example: https://www.youtube.com/watch?v=Tux1nhBPl_w
*/ 