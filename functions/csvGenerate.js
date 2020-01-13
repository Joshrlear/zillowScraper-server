const { Parser } = require('json2csv')
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
    console.log(csv)
    fs.writeFileSync('./destination.csv', csv)

}

module.exports = {
    csvGenerate
}