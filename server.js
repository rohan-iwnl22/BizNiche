const express = require('express');
const multer = require('multer')
const path = require('path')
const cors = require('cors')

require('dotenv').config();

const app = express();


const loginRouter = require('./Routes/loginRoutes');
const productRouter = require('./Routes/productRouter');
const orderRouter = require('./Routes/orderRouter');
const pool = require('./db');
const sellerRoute = require('./Routes/sellerRoute');
const authenticate = require('./Middlewares/authenticate');
const sellerAuthenticate = require('./Middlewares/sellerAuthenticate');

app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: false }))
app.use('/Images', express.static('Images'));

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'Images')
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname))
    }
})

const upload = multer({ storage: storage })

app.post('/upload', upload.array('images', 10), (req, res) => { // Adjust '10' to the maximum number of files you expect
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
    }

    // Generate URLs for each uploaded file
    const imageUrls = req.files.map(file => `http://localhost:3030/Images/${file.filename}`);
    console.log(imageUrls)
    res.status(200).json({ imageUrls });
});


const PORT = process.env.PORT

app.use('/api/auth', loginRouter)
app.use('/api/product', productRouter)
app.use('/api/order', orderRouter)
app.use('/api/seller', sellerRoute)


app.listen(PORT, () => { console.log(`Listening on PORT ${PORT}`) })