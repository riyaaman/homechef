var createError       =   require('http-errors');
var express           =   require('express');
var path              =   require('path');
var cookieParser      =   require('cookie-parser');
var logger            =   require('morgan');

var userRouter        =   require('./routes/user');
var adminRouter       =   require('./routes/admin');
var vendorRouter      =   require('./routes/vendor');

var hbs               =   require('express-handlebars');
var app               =   express();
app.listen(process.env.PORT || 3000, function(){
  console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});


var db                =   require('./config/connection');
var session           =   require('express-session');
var fileUpload        =   require('express-fileupload')
var flash             =   require('express-flash-messages')


var nodemailer        =   require('nodemailer');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.engine('hbs',hbs({extname:'hbs',defaultLayout:'layout',layoutsDir:__dirname+'/views/layout/',partialsDir:__dirname+'/views/partials/'}))


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));



db.connect((err)=>{
  if(err)
  console.log("Db not Connected" +err)
  else
  console.log("Db Connected")
})
app.use(session ({
        secret:"Key",
        cookie:{maxAge:600000},
        duration: 30 * 60 * 1000,
        activeDuration:5 * 60 * 1000
    }))
app.use(fileUpload())
app.use(flash())


app.use('/', userRouter);
app.use('/admin', adminRouter);
app.use('/vendor', vendorRouter);




// catch 404 and forward to error handler
// app.use(function(req, res, next) {
//   next(createError(404));
// });
app.use(function(req, res, next){
  // res.status(404).send('Sorry, page not found')
  res.status(404).render('error', {title: "Ooopps.! The Page you were looking for, couldn't be found."});
});
// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  // res.status(err.status || 500);
  
  // res.render('error', {title: "Sorry,Something Went Wrong"});
});



module.exports = app;
