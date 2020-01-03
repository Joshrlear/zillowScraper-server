await page.setRequestInterception(true)
    page.on('request', async req => {
        const reqUrl = req.url()


        // NOTE: it seems like rather than aborting req for captcha
        // if I try to access something undefinded on the captch req
        // it holts the process and allows me to continue on the site.


        
        // intercept property info
        if (reqUrl.search(/GetSearchPageState/g) != -1) {
            req.continue()
        }
        

        // abort ad and image requests
        else if (reqUrl
            .search(/.jpg|.jpeg|.png|.gif|ad.doubleclick.net/g) != -1 
            && reqUrl
            .search(/recaptcha|captcha/g) == -1) { // unless captcha found

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
        if (resUrl.search(/FullRenderQuery/g)  != -1) {
            const response = await res.json()
            await console.log(response.data.property.address)
            // serialize property info and push to arr
        }



        // on response inside main page        
        else if (resUrl.search(/GetSearchPageState/g) != -1 && count < 1) {
            ++count

            const links = await page.$$eval('.list-card-info', e => e.map(link => link.href))
            await console.log(links)
            for await (link of links) {
                await Promise.all([
                    page.waitForNavigation(),
                    page.goto(link, {waituntil: 'load'})
                ])
            }
        }
    })