
var express           =   require('express');
var router            =   express.Router();
var userHelpers       =   require('../helpers/user-helpers')
var productHelpers    =   require('../helpers/product-helpers')
const session         =   require('express-session');



/* GET users listing. */
router.get('/', function(req, res, next) {
  //res.send('respond with a resource');
  productHelpers.get_Allproducts().then((products) => {
    //console.log(products) 
    res.render("user/index", { products,user_status:true });
          
  });

});


router.get('/login', (req,res)=>{
  if(req.session.user){
    res.redirect('user/login')
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