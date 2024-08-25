const express = require('express')
const orderRouter = express.Router()

const { getOrder, postOrder, getSingleOrder, orderStatus } = require('../Controller/orderController')
const authenticate = require('../Middlewares/authenticate')
const sellerAuthenticate = require('../Middlewares/sellerAuthenticate')


orderRouter.get('/', authenticate, getOrder)
orderRouter.post('/', authenticate, postOrder)
orderRouter.get('/:id', authenticate, getSingleOrder)
orderRouter.put('/status/:id', authenticate, sellerAuthenticate, orderStatus) // only for admin-seller

module.exports = orderRouter;
