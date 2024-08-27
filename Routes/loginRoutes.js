const express = require('express')
const { loginController, signupController } = require('../Controller/loginContro')

const loginRouter = express.Router()

loginRouter.post('/login', loginController)
loginRouter.post('/register', signupController)

module.exports = loginRouter;
