const { z } = require('zod')

const userSchema = z.object({
    name: z.string().min(2, "Username must be atleast 2 characters long"),
    email: z.string().email("Invaild email address"),
    password: z.string().min(8, "Password must be of atleast 8 characters long")
})

module.exports = userSchema