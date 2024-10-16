var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var app = express();

// local storage
var LocalStorage = require('node-localstorage').LocalStorage;
localStorage = new LocalStorage('./scratch');

// Connexion à MongoDB
const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect("mongodb://localhost:27017/Agenda", {
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('Error connecting to MongoDB:', err.message);
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// routes
const usersRouter = require('./routes/users');
var indexRouter = require('./routes/index');
const agendaRouter = require('./routes/agenda');
const rendezVousRouter = require('./routes/rendezvous'); 


// utiliser les routes ici
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/agenda', agendaRouter);
app.use('/rendezvous', rendezVousRouter); 

// pour le css

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
