const express = require('express');
const authrouter = require('./Routes/authRoutes')
const cookieParser = require('cookie-parser');

const app = express();

app.use(cookieParser());
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

//edit the url to match your needs
app.use('/api/v1/auth', authrouter);


module.exports = app;