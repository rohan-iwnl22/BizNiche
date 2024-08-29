const express = require('express')
const { getProduct, postProduct, getSingleProduct, updateProduct, deleteProduct } = require('../Controller/productController')
const authenticate = require('../Middlewares/authenticate')
const sellerAuthenticate = require('../Middlewares/sellerAuthenticate')
const productRouter = express.Router()



productRouter.get('/', getProduct)
productRouter.post('/post', authenticate, sellerAuthenticate, postProduct);
productRouter.get('/:id', authenticate, getSingleProduct)
productRouter.put('/:id', authenticate, sellerAuthenticate, updateProduct)
productRouter.delete('/:id', authenticate, sellerAuthenticate, deleteProduct)



module.exports = productRouter;