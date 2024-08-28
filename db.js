const { userTableQuery, sellerTableQuery, productTableQuery, orderTableQuery } = require("./DB/createQuery");
require('dotenv').config();  // Ensure dotenv is configured correctly

const { Pool } = require('pg');
const DB_URI = process.env.DB_URI;

const pool = new Pool({
    connectionString: DB_URI,
    // ssl: {
    //     rejectUnauthorized: false
    // }
});



(async () => {
    try {
        const client = await pool.connect();
        console.log("Database connected Successfully");

        await client.query(userTableQuery);
        console.log("User Table Created Successfully");

        await client.query(sellerTableQuery);
        console.log("Seller Table Created Successfully");

        await client.query(productTableQuery);
        console.log("Product Table Created Successfully");

        await client.query(orderTableQuery);
        console.log("Order Table Created Successfully");

        client.release(); // Release the client back to the pool

    } catch (error) {
        console.log(`Error Executing Queries: ${error.message}`);
    }
})();

module.exports = pool;
