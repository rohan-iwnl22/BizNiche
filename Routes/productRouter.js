const express = require('express')
const { getProduct, postProduct, getSingleProduct, updateProduct, deleteProduct } = require('../Controller/productController')
const productRouter = express.Router()



productRouter.get('/', getProduct)
productRouter.post('/', postProduct)
productRouter.get('/:id', getSingleProduct)
productRouter.put('/:id', updateProduct)
productRouter.delete('/:id', deleteProduct)



module.exports = productRouter;