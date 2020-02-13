require('dotenv').config()

module.exports = {
    email:      process.env.EMAIL,
    emailPass:  process.env.EMAILPASS,
    emailHost:  process.env.EMAILHOST
}