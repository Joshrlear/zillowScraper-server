const puppeteer = require('puppeteer-extra')
const RecaptchaPlugin = require('puppeteer-extra-plugin-recaptcha')
const fs = require('fs')

// configuring recaptcha solver
puppeteer.use(
  RecaptchaPlugin({
    provider: {
      id: '2captcha',
      token: require('./util/2captchaConfig').token
    },
    visualFeedback: true // colorize reCAPTCHAs (violet = detected, green = solved)
  })
)

// scrape requirements
const limit = 2
const queryArea = '92019' // TO BE: user input
const sendTo = 'joshrlear@gmail.com' // TO BE: user input

// property array
let properties = []

// running headless browser
puppeteer.launch({ 
  headless: false,
  defaultViewport: null,
})
.then(async browser => {
  const page = (await browser.pages())[0]

  await page.goto(`https://www.zillow.com/homes/${queryArea}/`)
  //await page.screenshot({ path: 'before.png', fullPage: true })

  // intercept property data response and push
  await page.on('response', async response => {
    if (response.url().endsWith("FullRenderQuery")) {
        console.log("response code: ", response.status());
        const { data } = await response.json()
        const propertyDetails = {
          address: data.property.address,
          homeStatus: data.property.homeStatus,
          price: data.property.price,
          yearBuilt: data.property.yearBuilt,
          bedrooms: data.property.bedrooms,
          bathrooms: data.property.bathrooms,
          livingArea: data.property.livingArea,
          description: data.property.description,
          daysOnZillow: data.property.daysOnZillow
        }
        await properties.push(propertyDetails)
        //await properties.length === limit ? browser.close() : nextListing()
        await console.log('properties here:', properties)
    }
    return properties
  })


  const getListing = async () => {
    await page.evaluate( async () => {
      let elements = await Array.from(document.querySelectorAll('.list-card-link'));
      await elements.map(async element => {
          await console.log('url:', element.href)
          await page.click(element)

          // response should trigger the page.on(response) to run

          /* await Promise.all([
            page.waitForNavigation(),
            page.click(element)
          ])
          .catch(err => {
            console.log("no listing card found, retrying...")
            try {
              console.log('trying to pass the list-card-link stage')
              setTimeout(() => {
                console.log('retrying')
                page.waitForNavigation()
                page.click(element)
              },3000)
            }
            catch {console.error('Something went wrong:', err)}
          }) */
      })
  })
    //await console.log('hrefs here:', hrefs)
    
    
  }

  const nextListing = async () => {
    await page.goBack()
    await getListing()
  }

  try {
      console.log('looking for captcha')
      await page.solveRecaptchas()
      console.log('Solved!')
      await Promise.all([
          page.waitForNavigation(),
          page.click(`#recaptcha-anchor`)
      ])
  }
  catch {
    console.log('no captcha')
  }
  finally {
    let nextPage = true
    while (nextPage) {
      console.log('GETTING LISTINGS')
      await getListing()

      nextPage = await page.$eval('.zsg-pagination-next > a', el => el.href)
      await console.log('this is the nextPage:', nextPage)
      await nextPage && page.click('.zsg-pagination-next > a')
    }
  }
})
.catch(err => console.error(err))
