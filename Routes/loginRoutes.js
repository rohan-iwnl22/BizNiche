const express = require('express')

const loginRouter = express.Router()

loginRouter.post('/login', loginController)
loginRouter.post('/register', signupController)

module.exports = loginRouter;
