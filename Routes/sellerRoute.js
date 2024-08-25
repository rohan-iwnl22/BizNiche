const express = require('express');
const authenticate = require('../Middlewares/authenticate');
const sellerController = require('../Controller/sellerController');
const sellerRoute = express.Router()


sellerRoute.post('/become-a-seller', authenticate, sellerController);


module.exports = sellerRoute;