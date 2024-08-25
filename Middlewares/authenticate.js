const jwt = require('jsonwebtoken')
const secret = process.env.SECRET

const authenticate = async (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: "Access Denied" })
    }

    try {
        const decoded = jwt.verify(token, secret)
        req.user = decoded;
        next();
    } catch (e) {
        res.status(400).json({ message: "Invalid token" });
    }
};

module.exports = authenticate