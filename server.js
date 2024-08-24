const express = require('express');
require('dotenv').config();
const app = express();

const loginRouter = require('./Routes/loginRoutes');
const productRouter = require('./Routes/productRouter');
const orderRouter = require('./Routes/orderRouter');

app.use(express.json());


const PORT = process.env.PORT

app.use('/api/auth', loginRouter)
app.use('/api/product', productRouter)
app.use('/api/order', orderRouter)
app.use('/api/category', categoryRouter)



app.listen(PORT, () => { console.log(`Listening on PORT ${PORT}`) })