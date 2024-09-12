const pool = require("../db");
// const razorpay = require('razorpay')
const crypto = require('crypto');
const Razorpay = require("razorpay");


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
    const { product_id, quantity, payment_method } = req.body;
    const buyer_id = req.user.userId;

    try {
        await pool.query('BEGIN');

        const productQuery = 'SELECT price, stock FROM products WHERE product_id = $1 FOR UPDATE';
        const productResult = await pool.query(productQuery, [product_id]);

        if (productResult.rows.length === 0) {
            return res.status(404).json({ message: "Product Not Found" });
        }

        const { price, stock } = productResult.rows[0];

        if (stock < quantity) {
            return res.status(400).json({ message: "Insufficient Stock" });
        }

        const total_price = price * quantity;

        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });

        const options = {
            amount: total_price * 100, // Razorpay expects amount in paise
            currency: "INR",
            receipt: `order_rcptid_${buyer_id}`,
        };

        const razorpayOrder = await razorpay.orders.create(options);

        const paymentInfo = {
            id: razorpayOrder.id,
            entity: razorpayOrder.entity,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            receipt: razorpayOrder.receipt,
            status: razorpayOrder.status,
            created_at: razorpayOrder.created_at
        };

        const insertOrderQuery = `
            INSERT INTO orders (buyer_id, product_id, quantity, total_price, status, payment_info)
            VALUES ($1, $2, $3, $4, 'pending', $5)
            RETURNING *;
        `;
        const orderValues = [buyer_id, product_id, quantity, total_price, JSON.stringify(paymentInfo)];
        const orderResult = await pool.query(insertOrderQuery, orderValues);

        await pool.query('COMMIT');

        res.status(200).json({
            message: "Order Initiated Successfully",
            order: orderResult.rows[0],
            razorpayOrderId: razorpayOrder.id,
        });

    } catch (error) {
        await pool.query('ROLLBACK');
        console.error(`Error Creating Order: ${error.message}`);
        res.status(500).json({
            message: "Error Creating Order",
            error: error.message,
        });
    }
};

const verifyPayment = async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const generatedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

    console.log("Generated Signature: ", generatedSignature);
    console.log("Expected Signature: ", razorpay_signature);

    if (generatedSignature === razorpay_signature) {
        try {
            await pool.query('BEGIN');

            // Adjust the query to correctly extract the Razorpay order ID from the payment_info field
            const updateOrderStatusQuery = `
                UPDATE orders 
                SET status = 'shipped', updated_at = CURRENT_TIMESTAMP 
                WHERE payment_info->>'id' = $1
                RETURNING *`;
            const orderResult = await pool.query(updateOrderStatusQuery, [razorpay_order_id]);

            if (orderResult.rows.length === 0) {
                console.log("No order found with the given razorpayOrderId");
                throw new Error("Order not found");
            }

            const order = orderResult.rows[0];

            console.log("Order Details:", order);

            // Update product stock
            const updateStockQuery = `
                UPDATE products 
                SET stock = stock - $1, updated_at = CURRENT_TIMESTAMP 
                WHERE product_id = $2`;
            await pool.query(updateStockQuery, [order.quantity, order.product_id]);

            await pool.query('COMMIT');

            res.status(200).json({ message: "Payment Verified", order });
        } catch (error) {
            await pool.query('ROLLBACK');
            console.error(`Error Verifying Payment: ${error.message}`);
            res.status(500).json({ message: "Error Verifying Payment", error: error.message });
        }
    } else {
        res.status(400).json({ message: "Invalid Payment Signature" });
    }
};

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
    orderStatus,
    verifyPayment
}