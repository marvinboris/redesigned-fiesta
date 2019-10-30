const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const flash = require('connect-flash');
const multer = require('multer');

const MONGODB_URI = 'mongodb://localhost:27017/rwa';
// const MONGODB_URI = 'mongodb://marvinboris:Marvinboris1@node-complete-shard-00-00-mt9rd.mongodb.net:27017,node-complete-shard-00-01-mt9rd.mongodb.net:27017,node-complete-shard-00-02-mt9rd.mongodb.net:27017/messages?ssl=true&replicaSet=node-complete-shard-0&authSource=admin';

const app = express();
const store = new MongoDBStore({
    uri: MONGODB_URI,
    collection: 'sessions'
});

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images');
    },
    filename: function (req, file, cb) {
        cb(null, new Date().getTime() + file.originalname)
    }
});

const fileFilter = (req, file, cb) => {
    if (
        file.mimetype === 'image/png' ||
        file.mimetype === 'image/jpg' ||
        file.mimetype === 'image/jpeg'
    ) {
        cb(null, true);
    } else {
        cb(null, false);
    }
}

const projectsRoutes = require('./routes/projects');

app.use(bodyParser.json());
app.use(multer({ storage: fileStorage, fileFilter }).single('image'));
app.use('/images', express.static(path.join(__dirname, 'images')));

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});
app.use(session({
    secret: 'my secret',
    resave: false,
    saveUninitialized: false,
    store: store
}));
app.use(flash());

app.get('/csrf', (req, res, next) => {
    const csrfToken = res.locals.csrfToken;
    console.log('From route : ', csrfToken);
    res.status(200).json({
        token: csrfToken
    });
    // next();
});

app.use('/projects', projectsRoutes);

app.use((error, req, res, next) => {
    console.log(error);
    const status = error.statusCode || 500;
    const message = error.message;
    const data = error.data;
    res.status(status).json({ message, data });
});

mongoose
    .connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(user => {
        console.log('Connected !');
        const server = app.listen(8080);
    })
    .catch(err => {
        console.log(err);
    });