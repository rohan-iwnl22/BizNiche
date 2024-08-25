const pool = require("../db");

const getOrder = async (req, res) => {
    const user_id = req.user.userId;
    const checkQuery = `SELECT * FROM orders WHERE buyer_id = $1`;

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

const postOrder = async (req, res) => {
    const { product_id, quantity, total_price, status, payment_info } = req.body;

    const buyer_id = req.user.userId;

    try {
        await pool.query('BEGIN');

        const productQuery = `SELECT stock FROM products WHERE product_id = $1 FOR UPDATE`;
        const productResult = await pool.query(productQuery, [product_id]);

        if (productResult.rows.length === 0) {
            return res.status(401).json({
                message: "Product Not Found"
            })
        }

        const availableStock = productResult.rows[0].stock;
        if (availableStock < quantity) {
            return res.status(401).json({
                message: "Insufficient Stock"
            })
        }

        const updateQuery = `UPDATE products SET stock = stock - $1, updated_at = CURRENT_TIMESTAMP WHERE product_id = $2`;

        await pool.query(updateQuery, [quantity, product_id]);

        const insertQuery = `INSERT INTO orders (buyer_id,product_id,quantity,total_price,status,payment_info) VALUES($1,$2,$3,$4,$5,$6) RETURNING *`;
        const insertValues = [buyer_id, product_id, quantity, total_price, status || "pending", payment_info];

        const orderResult = await pool.query(insertQuery, insertValues);

        await pool.query('COMMIT');

        res.status(200).json({
            message: "Order Placed Successfully",
            order: orderResult.rows[0]
        })

    } catch (error) {
        await pool.query('ROLLBACK')
        console.log(`Error Creating Order: ${error.message}`)
        res.status(500).json({
            message: "Error Creating Order", error: error.message
        })
    }
}

const getSingleOrder = async (req, res) => {
    const { id: order_id } = req.params;
    try {
        const singleOrderQuery = `SELECT * FROM orders WHERE order_id = $1`;
        const result = await pool.query(singleOrderQuery, [order_id]);
        if (result.rows.length === 0) {
            return res.status(400).json({
                message: "Invalid Order-Id"
            })
        }
        res.status(200).json({
            orders: result.rows[0]
        })
    } catch (error) {
        console.log(error.message)
        res.status(500).json({ message: "Some unknown error occured", error: error.message })
    }
}

const orderStatus = async (req, res) => {
    const { id: order_id } = req.params;
    console.log(`Order_Id: ${order_id}`)
    const { status } = req.body;
    const validateStatus = ['shipped', 'delivered', 'cancelled'];
    if (!validateStatus.includes(status)) {
        return res.json({ message: "Invalid status value" })
    }
    try {
        const updateStatusQuery = `UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE order_id = $2 AND status = 'pending' RETURNING *`;

        const result = await pool.query(updateStatusQuery, [status, order_id])
        if (result.rows.length === 0) {
            return res.status(400).json({ message: "Order not found or status already updated" })
        }

        res.status(200).json({
            message: "Status updated successfully",
            order: result.rows[0]
        })
    } catch (error) {
        console.log(`Error updating status : ${error.message}`)
        res.status(500).json({
            message: "Error updating status",
            error: error.message
        })
    }
}

module.exports = {
    getOrder,
    postOrder,
    getSingleOrder,
    orderStatus
}