const pool = require("../db");

const sellerController = async (req, res) => {
    const { store_name, store_description, contact_info } = req.body;
    const user_id = req.user.userId;

    try {

        const existQuery = `SELECT * FROM sellers WHERE user_id = ($1)`
        const { rows } = await pool.query(existQuery, [user_id]);
        if (rows.length > 0) {
            return res.status(400).json({ message: "A user can setup only one store" })
        }

        const values = [user_id, store_name, store_description, contact_info]

        const createSellerQuery = `INSERT INTO sellers (user_id,store_name,store_description,contact_info) VALUES ($1,$2,$3,$4) RETURNING * `;

        const result = await pool.query(createSellerQuery, values);

        const newSeller = result.rows[0];

        res.status(200).json({
            message: "Seller Created Successfully",
            seller: newSeller,
        });
    }
    catch (e) {
        console.log(e);
        res.status(500).json({ message: `An unknown error occured ${e.message}` });
    }
}


module.exports = sellerController