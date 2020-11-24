

var express           =   require('express');
var router            =   express.Router();
var userHelpers       =   require('../helpers/user-helpers')
const session         =   require('express-session');

/* Login For  Vendor
============================================= */

router.get('/', function(req, res, next) { 

    if(req.session.vendor){
      res.redirect('vendor/dashboard')
    }
  
    else{
     res.render('vendor/ven-login',{vendorLoginError:req.session.vendorLoggedIn})
     req.session.vendorLoginError = false
     }
});


router.post('/vendor_login', (req,res)=> {  
  
  userHelpers.doLogin_Vendor(req.body).then((response)=>{
    if(response.loginStatus){
     
      req.session.vendor          =  response.user    
      req.session.vendorLoggedIn  =  true    
      res.redirect('ven_dashboard')
    }
    else{
      req.session.vendorLoggedIn =   "Invalid Password or Username"      
      res.redirect('/vendor')
    }
  
  })
  
})

router.get('/ven_dashboard', (req,res)=> { 
  if( req.session.vendorLoggedIn)
  vendor_status = true
  // vendor_status   =   req.session.vendor.status
  res.render('vendor/vendor_dashboard',{vendor_status})
})

router.get('/logout', (req,res)=> {
  req.session.vendor           =   null
  req.session.vendorLoggedIn   =   false
  res.redirect('/vendor')
})
  
module.exports = router;