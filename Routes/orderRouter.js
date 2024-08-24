const express = require('express')
const orderRouter = express.Router()

const { getOrder, postOrder, getSingleOrder, orderStatus } = require('../Controller/orderController')


orderRouter.get('/', getOrder)
orderRouter.post('/', postOrder)
orderRouter.get('/:id', getSingleOrder)
orderRouter.put('/:id/status', orderStatus) // only for admin-seller

module.exports = orderRouter;
