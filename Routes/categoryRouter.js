const express = require('express')
const categoryRouter = express.Router()

const { createCategory, getCategory } = require('../Controller/categoryController')

categoryRouter.post('/', createCategory)
categoryRouter.get('/', getCategory)

module.exports = categoryRouter

