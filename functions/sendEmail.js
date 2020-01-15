const nodemailer = require('nodemailer')
const { EMAIL, EMAILPASS, EMAILHOST } = require('./configs/emailConfig')
const fs = require('fs')


const sendEmail = csv => {

    const transporter = nodemailer.createTransport({
      host: EMAILHOST,
      secure: true, // use TLS
      port: 465,
        auth: {
            user: EMAIL,
            pass: EMAILPASS
        },
        tls: {
          // do not fail on invalid certs
          rejectUnauthorized: false
        }
    })
    
    const mailOptions = {
        from: 'thezillowscraper@gmail.com', 
        to: 'joshrlear@gmail.com',
        subject: 'Your Zillow info is ready!',
        text:   `Thanks for trying out the ZillowScraper, I really hope you enjoy it!
                \n
                \n
                If you have any feedback on how to make this experience better or 
                if you have encountered any errors please let me know by responding
                to this email. Thank you!`,
        attachments:{   // stream as an attachment
            filename: `zillowListings-${Date.now()}.csv`,
            content: fs.createReadStream(csv)
        }
    }
  
  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log(error)
    } else {
      console.log('Email sent: ' + info.response);
    }
  })

}

module.exports = {
    sendEmail
}