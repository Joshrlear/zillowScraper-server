//const functions = require('firebase-functions')
const puppeteer = require('puppeteer-extra')
const RecaptchaPlugin = require('puppeteer-extra-plugin-recaptcha')
const fetch = require('node-fetch')
const now = require("performance-now");



const serializeProperty = info => {
    const { data } = info
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

async function captcha(page) {
    await page.solveRecaptchas()
    
    await Promise.all([
        page.waitForNavigation(),
        page.click(`#recaptcha-anchor`)
    ])
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


    await page.setRequestInterception(true)
    page.on('request', req => {
        const reqUrl = req.url()
        // on request inside listing page
        if (reqUrl.search(/FullRenderQuery/g)  != -1) {
            req.continue()
            console.log('Stop loading window')
            page.evaluate(() => window.stop())
        }
        else req.continue()
    })


    let listings = []
    let links;
    let morePages = true
    let pageNum = 1
    // setup response intercepts
    page.on('response', async res => {
        const resUrl = res.url()


        // on response inside listing page
        if (resUrl.search(/FullRenderQuery/g)  != -1) {
            //await page.evaluate(() => window.stop())
            const response = await res.json()
            // serialize property info and push to arr
            await listings.push(serializeProperty(response))
        }



        // on response inside main page        
        else if (resUrl.search(/GetSearchPageState/g) != -1) {
            //++count

            console.log('Im getting to this point')

            /* while loop of next page if exists */
            while (morePages) {
                let response = await res.json()
                //let nextPage = response.searchList.pagination.nextUrl
                let nextPage = url + (++pageNum) + '_p/'
                console.log('current page:', page.url())
                console.log('next url:', nextPage)
                

                links = await page.$$eval(
                        '.list-card-info', 
                        e => e.map(link => link.href))
    
                for (link of links) {
                    
                    try {
                        await captcha(page)
                    }
                    catch {
                        await console.log('Going to this listing:', link)
                        await page.goto(link)
                    }
                    
                }
                console.log('logging here')
                await Promise.all([
                    page.waitForNavigation(),
                    page.goto(nextPage)
                ])
                .catch(() => {
                    console.log('in the catch for next page...')
                    morePages = false
                })
                
            }


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