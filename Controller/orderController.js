const pool = require("../db");

const getOrder = async (req, res) => {
    const user_id = req.user.userId;
    const checkQuery = `SELECT * FROM orders WHERE user_id = $1`;

    try {
        const result = await pool.query(checkQuery, [user_id]);
        if (result.rows.length === 0) {
            return res.status(400).json({ message: "item once purchased will be displayed here" })
        }
        const finalResult = result.rows[0];
        res.status(200).json({
            your_orders: finalResult
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({
            message: `An unknown error occured: ${error.message}`
        })
    }
}

const postOrder = (req, res) => {

}

const getSingleOrder = (req, res) => {

}

const orderStatus = (req, res) => {

}

module.exports = {
    getOrder,
    postOrder,
    getSingleOrder,
    orderStatus
}