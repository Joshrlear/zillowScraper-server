const { Parser } = require('json2csv')
const { sendEmail } = require('./sendEmail')
const fs = require('fs')


const csvGenerate = data => {
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

    fs.writeFile(
        './destination.csv',                    // save file as
        csv,                                    // file data
        () => sendEmail('./destination.csv')    // after saved send email
    )

}

module.exports = {
    csvGenerate
}