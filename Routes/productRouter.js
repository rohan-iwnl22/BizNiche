const express = require('express')
const { getProduct, postProduct, bestSelling, getSingleProduct, updateProduct, deleteProduct, getProductBySeller } = require('../Controller/productController')
const authenticate = require('../Middlewares/authenticate')
const sellerAuthenticate = require('../Middlewares/sellerAuthenticate')
const productRouter = express.Router()



productRouter.get('/', getProduct)
productRouter.get('/count', authenticate, sellerAuthenticate, getProductBySeller);
productRouter.post('/post', authenticate, sellerAuthenticate, postProduct);
// productRouter.get('/:id', authenticate, getSingleProduct)
productRouter.put('/:id', authenticate, sellerAuthenticate, updateProduct)
productRouter.get('/bestSelling', bestSelling)
productRouter.delete('/:id', authenticate, sellerAuthenticate, deleteProduct)



module.exports = productRouter;