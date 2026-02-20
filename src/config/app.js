const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');


const apiRoutes  = require('../routes');
const adminRoutes = require('../routes/size.web.routes');
const companyWebRoutes = require('../routes/company.web.routes');
const dashboardRoutes = require('../routes/admin.routes');
const errorHandler = require('../middlewares/error.middleware');
const branchWebRoutes = require('../routes/branch.web.routes');
const importWebRoutes = require('../routes/import.web.routes');
const session = require('express-session');
const authRoutes = require('../routes/auth.routes');
const app = express();

/* middleware */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.use(session({
    secret: 'pos_secret_key_123',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 8 } // 8 hours
}));

/* views */
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));
app.use(expressLayouts);
app.set('layout', 'layouts/admin');

app.use(express.static(path.join(__dirname, '../public')));




/* API */
app.use('/', authRoutes);
app.use('/api', apiRoutes);

/* ADMIN UI (mounted ONCE here) */
app.use('/admin', adminRoutes);
app.use('/admin', companyWebRoutes);
app.use('/admin', dashboardRoutes);
app.use('/admin', branchWebRoutes);
app.use('/admin', importWebRoutes);
app.use('/api', require('../routes/size.import.routes'));

app.use('/api', require('../routes/catalog.names.routes'));

app.use('/admin', require('../routes/visitingCard.web.routes'));



/* root test */
app.get('/', (req, res) => {
    res.send('Ramzans POS API is running');
});

module.exports = app;