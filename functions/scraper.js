const { csvGenerate } = require('./csvGenerate')

const scraper = (page, url, context) => {

    console.log('inside the scraper function')

    let listingResults = {}
    let links = []
    let pageNum = 1


    // add listing to existing obj or create new if doesn't exist
    const serializeProperty = async (/* info,  */obj) => {
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



    async function goToListings(page, links) {
        const allLinks = links.join().split(',')

        console.log("here are the listings links:", allLinks)
        /* eslint-disable no-await-in-loop */
        for (link of allLinks) {

            await page.goto(link, {waituntil: 'domcontentloaded'})
        }
        /* eslint-disable no-await-in-loop */
        return
    }



    (async () => {

        await page.setRequestInterception(true)
        page.on('request', request => {
            //console.log('request is happening')
            // Override headers
            const headers = request.headers()
            headers.origin = '*'  // remove "origin" header

            /* request.respond({
                //status: 200,
                //contentType: 'application/json',
                 
                //body: 'this is the body',
                    // Even though puppeteer docs say this 
                    // is optional, it seem to be required
            
                headers: {
                    vary: {
                    //'Access-Control-Allow-Credentials' : true,
                    'Access-Control-Allow-Origin':'*',
                    //'Access-Control-Allow-Methods':'*',
                    //'Access-Control-Allow-Headers':'*'
                    }
                }
            })  */           

            request.continue({headers})
        })

        console.log('inside the async function')
  
        let complete = false
        page.on('response', async res => {
            const resUrl = res.url()
            
  
            // gather listing info
            if (resUrl.search(/FullRenderQuery/g)  !== -1) {
                console.log('getting listing info at:',resUrl)
                //console.log("here's the response:", res.headers())
                //const response = await res.json()
                
                //listingResults = await serializeProperty(response, listingResults) 
                listingResults = await serializeProperty(listingResults) 
                
            }
  
  
            // on response inside main page        
            else if (resUrl.search(/GetSearchPageState/g) !== -1 && !complete) {

                console.log('getting results at:',resUrl)
  
                // get pages
                do {
  
  
                    /* eslint-disable no-await-in-loop */
  
                    // get all listings links for page
                    links.push(await page.$$eval(
                            '.list-card-info', 
                            e => e.map(link => link.href))
                    )
  
                    /* eslint-enable no-await-in-loop */
  
  
                    let nextPage = url + (++pageNum) + '_p/'   
                    
                    // go to next page
                    Promise.all([
                        page.waitForNavigation(),
                        page.goto(nextPage)
                    ])
                    .catch(() => console.log('inside the catch for nextPage'))
  
                }
                while (page.url() !== url) // breaks when page redirects to org url
                complete = true
  
  
                await goToListings(page, links)
                //await context.close()
                //await console.log('current url:', url, listingResults)
                await csvGenerate(listingResults, context)
            }
            return
        })
  

  
        // start scraping
        await page.goto(url, {waituntil: 'domcontentloaded'})

        await page.solveRecaptchas()
        //page.screenshot({path: `solved-screenshot${count}.png`})

        await Promise.all([
            page.waitForNavigation(),
            page.click(`#recaptcha-anchor`)
        ])
        .catch(() => { 
            console.log('in the catch for finding #recaptcha-anchor')    
            return
        })
  
        /* try {
            captcha(page)
        }
        catch(err) {
          console.log('no captcha')
        } */
        return
    })(); 


    // default exceptions handling
    process.on('unhandledRejection', (reason, promise) => {
        if (reason.message === "No node found for selector: #recaptcha-anchor") {
            console.log('dealing with unhadlingRejection that is === No node found for selector: #recaptcha-anchor')
            return
        }
        else {
            console.log('Unhandled Rejection:', reason.message)
            return
        }

    })
}


module.exports = {
    scraper
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