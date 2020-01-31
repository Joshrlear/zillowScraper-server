const { Parser } = require('json2csv')
const { sendEmail } = require('./sendEmail')
const fs = require('fs')


const csvGenerate = (data, context) => {

    console.log('inside csvGenerate:', data)

    const info = Object.entries(data).map(listing => listing[1])

    const fields = [
        'mlsId',
        'streetAddress',
        'homeStatus',
        'price',
        'yearBuilt',
        'bedrooms',
        'bathrooms',
        'livingArea',
        'description',
        'daysOnZillow'
    ]

    const json2csvParser = new Parser({fields})

    const csv = json2csvParser.parse(info)

    Promise.resolve(
        fs.writeFile(
        './destination.csv',                    // save file as
        csv,                                    // file data
        () => sendEmail('./destination.csv')    // after saved send email
    ))
    .then(() => context.close())                // scrape complete, close page
    .catch(() => { return })
}

process.on('unhandledRejection', (reason, p) => {
    console.log('Unhandled Rejection in csvGenerate at:', p, 'reason:', reason);
    // application specific logging, throwing an error, or other logic here
})

module.exports = {
    csvGenerate
}