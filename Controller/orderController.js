const pool = require("../db");
// const razorpay = require('razorpay')
const crypto = require('crypto');
const Razorpay = require("razorpay");


const getAllOrder = async (req, res) => {
    const seller_id = req.seller.seller_id;

    try {
        // Query to get all orders where the products belong to this seller, including category_name
        const getOrdersQuery = `
            SELECT o.order_id, o.quantity, o.total_price, o.status, u.name AS buyer_name, 
                   p.name AS product_name, p.category_name
            FROM orders o
            INNER JOIN products p ON o.product_id = p.product_id
            INNER JOIN users u ON o.buyer_id = u.user_id
            WHERE p.seller_id = $1
            ORDER BY o.created_at DESC
        `;

        const result = await pool.query(getOrdersQuery, [seller_id]);

        // If no orders found for the seller's products
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'No orders found for your products.' });
        }

        // Return the retrieved orders data
        return res.status(200).json({
            message: 'Orders retrieved successfully',
            orders: result.rows
        });

    } catch (error) {
        console.error(`Error retrieving orders: ${error.message}`);
        return res.status(500).json({
            message: 'Error retrieving orders',
            error: error.message,
        });
    }
};


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
    const { items } = req.body;
    const buyer_id = req.user.userId;

    console.log("Received items:", items);
    console.log("Buyer ID:", buyer_id);

    try {
        await pool.query('BEGIN');

        let total_price = 0;
        const paymentInfos = [];

        // Loop through each item to process the order
        for (const item of items) {
            const { product_id, quantity } = item;

            console.log(`Processing Product ID: ${product_id}, Quantity: ${quantity}`);

            // Query product details along with the seller_id
            const productQuery = `
                SELECT p.price, p.stock, p.name, p.seller_id
                FROM products p
                WHERE p.product_id = $1 FOR UPDATE
            `;
            const productResult = await pool.query(productQuery, [product_id]);

            if (productResult.rows.length === 0) {
                await pool.query('ROLLBACK');
                return res.status(404).json({ message: `Product ${product_id} Not Found` });
            }

            const { price, stock, name, seller_id } = productResult.rows[0];

            if (stock < quantity) {
                await pool.query('ROLLBACK');
                return res.status(400).json({ message: `Insufficient Stock for ${name}` });
            }

            // Accumulate total price for the current product
            total_price += price * quantity;

            // Prepare payment info for this item
            paymentInfos.push({
                product_id,
                quantity,
                price,
                seller_id  // Include seller_id for each product
            });

            // Deduct the stock after order confirmation (if needed)
            const updateStockQuery = 'UPDATE products SET stock = stock - $1 WHERE product_id = $2';
            await pool.query(updateStockQuery, [quantity, product_id]);
        }

        // Create Razorpay order
        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });

        const options = {
            amount: total_price * 100, // Convert total price to paise
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

        // Insert orders into the database for each item
        for (const item of paymentInfos) {
            const { product_id, quantity, price, seller_id } = item;

            const insertOrderQuery = `
                INSERT INTO orders (buyer_id, seller_id, product_id, quantity, total_price, status, payment_info)
                VALUES ($1, $2, $3, $4, $5, 'pending', $6)
                RETURNING *;
            `;
            const orderValues = [
                buyer_id,
                seller_id,
                product_id,
                quantity,
                price * quantity, // Calculate the price for this item
                JSON.stringify(paymentInfo)
            ];
            await pool.query(insertOrderQuery, orderValues);
        }

        await pool.query('COMMIT');

        res.status(200).json({
            message: "Order Initiated Successfully",
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
    orderStatus,
    verifyPayment,
    getAllOrder
}