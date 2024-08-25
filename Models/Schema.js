const { z } = require('zod')

const userSchema = z.object({
    name: z.string().min(2, "Username must be atleast 2 characters long"),
    email: z.string().email("Invaild email address"),
    password: z.string().min(8, "Password must be of atleast 8 characters long")
})

const storeSchema = z.object({
    store_name: z.string().min(1, { message: "Store name is required" }),
    store_description: z.string().optional().default('No description provided')
});

module.exports = userSchema