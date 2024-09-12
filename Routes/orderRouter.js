const express = require('express')
const orderRouter = express.Router()

const { getOrder, postOrder, getSingleOrder, orderStatus, verifyPayment } = require('../Controller/orderController')
const authenticate = require('../Middlewares/authenticate')
const sellerAuthenticate = require('../Middlewares/sellerAuthenticate')


orderRouter.get('/', authenticate, getOrder)
orderRouter.post('/', authenticate, postOrder)
orderRouter.get('/:id', authenticate, getSingleOrder)
orderRouter.put('/status/:id', authenticate, sellerAuthenticate, orderStatus) // only for admin-seller
orderRouter.post('/verify', authenticate, verifyPayment);

module.exports = orderRouter;
