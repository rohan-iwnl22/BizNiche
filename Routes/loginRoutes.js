const express = require('express')
const { loginController, signupController } = require('../Controller/loginController')

const loginRouter = express.Router()

loginRouter.post('/login', loginController)
loginRouter.post('/register', signupController)

module.exports = loginRouter;
