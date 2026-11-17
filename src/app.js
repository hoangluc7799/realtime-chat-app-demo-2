const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const methodOverride = require('method-override');
const configureHandlebars = require('./helpers/handlebars');

const siteRouter = require('./routers/siteRouter');
const authRouter = require('./routers/authRouter');
const profileRouter = require('./routers/profileRouter');
const homeRouter = require('./routers/homeRouter');
const adminRouter = require('./routers/adminRouter');
const taskRouter = require('./routers/taskRouter');
console.log('ADMIN ROUTER:', typeof adminRouter);
const app = express();

app.use(express.urlencoded({
    extended: true
}));

// Parse JSON từ Postman
app.use(express.json());

app.use(methodOverride('_method'));

// Cookie
app.use(cookieParser());

// Static files
app.use(express.static(
    path.join(__dirname, 'public')
));

// Handlebars
configureHandlebars(app);

// Router
app.use('/user', authRouter);
app.use('/profile', profileRouter);
app.use('/home', homeRouter);
app.use('/tasks', taskRouter);
app.use('/admin', adminRouter);
console.log('ADMIN ROUTER MOUNTED');
app.use('/', siteRouter);

// 404

// Error Handler
app.use((error, req, res, next) => {

    console.error(error);

    res.status(500).json({
        success: false,
        message: 'Internal Server Error'
    });

});

module.exports = app;