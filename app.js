const express = require('express');
const authrouter = require('../API Boilerplate/Routes/authroutes')
const app = express();

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

//edit the url to match your needs
app.use('/api/auth', authrouter);



module.exports = app;