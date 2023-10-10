const mongoose = require('mongoose')
const dotenv = require('dotenv')

dotenv.config({path: './config.env'})
const app = require('./app')


const DB = process.env.DATABASE

mongoose.connect(DB, {
    useNewUrlParser: true,
}).then(()=>console.log('DB connected!'))

const port = 3000
app.listen(port, ()=>{
    console.log(`Listening on ${port}`)
})