const config = require('../config/app.config');

module.exports = function basicAuth(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Basic ')) {
        res.setHeader('WWW-Authenticate', 'Basic realm="Catalog API"');
        return res.status(401).send('Authentication required');
    }

    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = credentials.split(':');

    console.log("username",username);
    console.log("password",password);
    // 👉 username ignored, password = token
    if (password !== config.PASSWORD && username==config.USER_NAME) {
        res.setHeader('WWW-Authenticate', 'Basic realm="Catalog API"');
        return res.status(401).send('Invalid token');
    }

    next();
};
