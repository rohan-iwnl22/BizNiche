const pool = require("../db");

const sellerAuthenticate = async (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.userId;

    try {
        const result = await pool.query(`SELECT * FROM sellers WHERE user_id = ($1)`, [userId]);

        if (result.rows.length === 0) {
            return res.status(403).json({ message: "Access Forbidden: Not A Seller" });
        }

        req.seller = result.rows[0];
        next();
    } catch (error) {
        console.error('Error checking seller status:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}

module.exports = sellerAuthenticate;