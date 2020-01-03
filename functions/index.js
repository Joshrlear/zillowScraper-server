//const functions = require('firebase-functions')
const puppeteer = require('puppeteer-extra')
const RecaptchaPlugin = require('puppeteer-extra-plugin-recaptcha')
const fetch = require('node-fetch')
const now = require("performance-now");




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
    page.on('request', async req => {
        const reqUrl = req.url()


        // NOTE: it seems like rather than aborting req for captcha
        // if I try to access something undefinded on the captch req
        // it holts the process and allows me to continue on the site.


        // trigger captcah solver on captcha request
        if (reqUrl.search(/captcha.px-cdn.net|www.recaptcha.net\/recaptcha\/api.js|recaptcha\/releases|captchaPerimeter/g) != -1) {
            console.log('$$$$ A captcha has been detected!');
            req.continue()
        }


        
        // intercept property info
        else if (reqUrl.search(/GetSearchPageState/g) != -1) {
            req.continue()
        }
        

        // abort ad and image requests
        else if (reqUrl
            .search(/.jpg|.jpeg|.png|.gif|googleapis.com\/maps\/api|ad.doubleclick.net|google/g) != -1 
            && reqUrl
            .search(/recaptcha|captcha/g) == -1) { // unless captcha found
            //console.log('this req was blocked:', reqUrl)
            req.abort()
        }


        //  continue loading all other requests
        else req.continue()
        
    })


    let count = 0
    // setup response intercepts
    page.on('response', async res => {
        const resUrl = res.url()



        // on response inside listing page
        if (res.url().search(/FullRenderQuery/g)  != -1) {
            const response = await res.json()
            await console.log(response.data.property.address)
            // serialize property info and push to arr
        }



        // on response inside main page        
        else if (resUrl.search(/GetSearchPageState/g) != -1 /* && count < 1 */) {
            //++count
            //const response = await res.json()


            // get all .list-card-link elms
            //await page.waitForSelector('.list-card-info')
            const links = await page.$$eval('.list-card-info', e => e.map(link => link.href))
            for (link of links) {
                await Promise.all([
                    page.waitForNavigation(),
                    page.goto(link, {waituntil: 'networkidle0'})
                ])
            }
            
            // loop elms
            //await links.map(link => {
                //console.log('this is a link:', link)
                //page.goto(link, {waituntil: 'networkidle0'})
                //await page.goBack()
            //})

            // get next page
            //const { nextUrl } = await res.searchList.pagination.nextUrl 
            //    ? res.searchList.pagination.nextUrl
            //    : null

            //await Promise.all([
            //    page.waitForNavigation(),
            //    page.goto(nextUrl, {waituntil: 'domcontentloaded'})
            //])
            //.catch(() => browser.close())
        }
    })



    // start scraping
    await page.goto(url, {waituntil: 'domcontentloaded'})
    



    try {
        await console.log('looking for captcha')
        await page.solveRecaptchas()
        await console.log('Solved!')
        await Promise.all([
            page.waitForNavigation(),
            page.click(`#recaptcha-anchor`)
        ])
    }
    catch {
      await console.log('no captcha')
    }
    
})(); 


// default exceptions handling
process.on('unhandledRejection', (reason, promise) => {
    /* if (reason.message === 'net::ERR_BLOCKED_BY_CLIENT') {
        page.goto(url, {waituntil: 'domcontentloaded'})
    } */
    console.log('Unhandled Rejection:', reason.message);
})
