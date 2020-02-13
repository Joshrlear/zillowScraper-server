const { csvGenerate } = require('./csvGenerate')

const scraper = (page, url, context) => {

    let listingResults = {}
    let links = []
    let pageNum = 1


    // add listing to existing obj or create new if doesn't exist
    const serializeProperty = async (info, obj) => {
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

        for (link of allLinks) {

            await page.goto(link, {waituntil: 'domcontentloaded'})
                .catch(err => console.error({
                    "DevMessage": "Error when navigating to links",
                    "ErrorMessage": err.message
                }))
        }

        return
    }



    (async () => {

        /* await page.setRequestInterception(true)
        page.on('request', request => {
            const headers = request.headers()
            headers.origin = '*' // allow response.json reads        

            request.continue({headers})
        }) */


  
        let complete = false
        page.on('response', async res => {
            const resUrl = res.url()
            
  
            // gather listing info
            if (resUrl.search(/FullRenderQuery/g)  !== -1) {
                console.log('getting listing info at:',resUrl)
                const response = await res.json()
                
                listingResults = await serializeProperty(response, listingResults) 
            }
  
  
            // on response inside main page        
            else if (resUrl.search(/GetSearchPageState/g) !== -1 && !complete) {


                // get pages
                do {
  
                    // get all listings links for page
                    links.push(await page.$$eval(
                            '.list-card-info > a', 
                            e => e.map(link => link.href))
                    )
  
                    let nextPage = url + (++pageNum) + '_p/'   
                    
                    // go to next page
                    Promise.all([
                        page.waitForNavigation(),
                        page.goto(nextPage)
                    ])
                    .catch(() => console.info("scrape complete. Next, format CSV and email"))
  
                }
                while (page.url() !== url) // breaks when page redirects to org url
                complete = true
  
  
                await goToListings(page, links)
                await csvGenerate(listingResults, context)
            }
            return
        })
  

  
        // start scraping
        await page.goto(url, {waituntil: 'domcontentloaded'})

        await page.solveRecaptchas() // will solve captcha whenever detected

        await Promise.all([
            page.waitForNavigation(),
            page.click(`#recaptcha-anchor`)
        ])
        .catch(() => { 
            console.log('in the catch for finding #recaptcha-anchor')    
            return
        })
        return
    })(); 


    // default exceptions handling
    process.on('unhandledRejection', (reason, promise) => {
        if (reason.message === "No node found for selector: #recaptcha-anchor") {
            console.log('dealing with unhadlingRejection that is === No node found for selector: #recaptcha-anchor')
            return
        }
        else {
            console.log('Unhandled Rejection in scraper at:', reason.message)
            return
        }

    })
}


module.exports = {
    scraper
}