const userSchema = require("../Models/Schema");

const { z } = require('zod')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken');
const pool = require("../db");
const secret = process.env.SECRET



const loginController = async (req, res) => {
    const { email, password } = req.body;
    try {
        const checkQuery = `SELECT * FROM users WHERE email = $1;`
        // console.log(email)
        // console.log(password)
        const { rows } = await pool.query(checkQuery, [email]);
        // console.log(`Rows Size: ${rows.length}`);
        // console.log(`Query Results: ${rows}`);


        if (rows.length === 0) {
            res.status(400).json({ message: "invalid username or password" })
        }

        const user = rows[0];
        // console.log(user.password);
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            res.status(400).json({ message: "Invalid username or password" })
        }

        const token = jwt.sign({ userId: user.user_id, email: user.email }, secret, { expiresIn: '4h' })

        res.status(200).json({
            message: "Logged in successfully",
            token
        })

    } catch (e) {
        res.status(500).json({ message: `An unknown error occured ${e.message}` })
    }
}

const signupController = async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const validateData = userSchema.parse({ name, email, password });
        const saltRounds = 10
        const hashedPassword = await bcrypt.hash(validateData.password, saltRounds);

        const dupliCheckQuery = `SELECT * FROM users WHERE email = $1;`

        const { rows } = await pool.query(dupliCheckQuery, [validateData.email]);
        if (rows.length > 0) {
            res.status(400).json({
                message: "User Already Exists",
            })
        }

        const insertQuery = `INSERT INTO users (name,email,password) VALUES ($1,$2,$3) RETURNING user_id;`
        const values = [validateData.name, validateData.email, hashedPassword];
        const result = await pool.query(insertQuery, values);

        res.status(200).json({
            message: "User Created Successfuly",
            userId: result.rows[0].user_id,
        });
    } catch (e) {
        if (e instanceof z.ZodError) {
            res.status(400).json({ error: e.errors })
        }
        else {
            res.status(500).json({ error: e.message })
        }
    }
}

module.exports = {
    loginController, signupController
}