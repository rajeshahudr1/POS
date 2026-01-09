const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');


const apiRoutes  = require('../routes');
const adminRoutes = require('../routes/size.web.routes');
const dashboardRoutes = require('../routes/admin.routes');
const errorHandler = require('../middlewares/error.middleware');

const app = express();

/* middleware */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

/* views */
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));
app.use(expressLayouts);
app.set('layout', 'layouts/admin');

app.use(express.static(path.join(__dirname, '../public')));




/* API */
app.use('/api', apiRoutes);

/* ADMIN UI (mounted ONCE here) */
app.use('/admin', adminRoutes);
app.use('/admin', dashboardRoutes);

app.use('/api', require('../routes/size.import.routes'));

app.use('/api', require('../routes/catalog.names.routes'));

app.use('/admin', require('../routes/visitingCard.web.routes'));



/* root test */
app.get('/', (req, res) => {
    res.send('Ramzans POS API is running');
});

module.exports = app;