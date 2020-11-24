
var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});


router.get('/login', (req,res)=>{
  if(req.session.user){
    res.redirect('/')
  }

  else{
   res.render('user/login',{loginError:req.session.userloginError})
   req.session.userloginError = false
   }
})

router.get('/signup', (req,res)=> {
  res.render('user/signup')
})

module.exports = router;