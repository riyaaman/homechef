
var express           =   require('express');
var router            =   express.Router();
var userHelpers       =   require('../helpers/user-helpers')

const session         =   require('express-session');
 const { response }    =   require('../app');

/* Login To Admin Page
============================================= */
const verifyAdminLogin  = (req,res,next)=>{
  if(req.session.adminLoggedIn){
    next()
  }
  else{
    res.redirect('/admin')
  }
}

router.get('/', function(req, res, next) { 

  if(req.session.user){
    res.redirect('admin/dashboard')
  }

  else{
    res.render('admin/login',{adminLoginError:req.session.adminLoginError})
    req.session.adminLoginError = false
   }
});


router.post('/admin_login', (req,res)=> {  
  
  userHelpers.doLogin(req.body).then((response)=>{
    if(response.loginStatus){
     
      req.session.user           =  response.user
    
      req.session.adminLoggedIn  =  true    
      res.redirect('dashboard')
    }
    else{
      req.session.adminLoginError =   "Invalid Password or Username"      
      res.redirect('/admin')
    }
  
  })
  
})

router.get('/dashboard',verifyAdminLogin, (req,res)=> {
  if( req.session.adminLoggedIn)
  admin_status = true
  // admin_status   =   req.session.user.status
  res.render('admin/dashboard',{admin_status})
})

router.get('/logout', (req,res)=> {
  req.session.user            =   null
  req.session.adminLoggedIn   =   false
  res.redirect('/admin')
})



/* SignUp For  Vendor
============================================= */

router.get('/vendor_add',verifyAdminLogin, (req,res)=> { 
 
  // admin_status   =  "admin"
  if( req.session.adminLoggedIn)
   admin_status = true
  if(req.session.vendorSignupFailed){
    res.render('admin/vendor-add',{admin_status,vendorSignupFailed:req.session.vendorSignupFailed})
    req.session.vendorSignupFailed = false
  }

  else if(req.session.vendorSignupSuccess){

    res.render('admin/vendor-add',{admin_status,vendorSignupSuccess:req.session.vendorSignupSuccess})
    req.session.vendorSignupSuccess = false
   }

   else{

    res.render('admin/vendor-add',{admin_status})
   
   }
  
})

router.post('/vendor_add', (req,res)=> {
  // console.log(req.body)
 
  userHelpers.doSignup_Vendor(req.body).then((response)=>{
    console.log("response:" ,response)
    if(response.signup_status==false){
     
      req.session.vendorSignupFailed   =   "Email Already Registered"  
     
    }
    else{
       console.log("Successfully")
      let image   =   req.files.ven_image
      let id      =   response._id
      console.log(image)
      console.log(id)
      image.mv('./public/images/vendor-images/'+id+'.jpg',(err,done)=>{
        if(!err) {
          
          req.session.vendorSignupSuccess  =   "You Successfully Added the Vendor" 
          res.redirect('vendor_add')
        }
        else{
          console.log(err);
        }
      })
       
    }
   
      
   

  })
});

router.get('/vendor_view', (req,res)=> { 
  // admin_status   =  "admin"
  if( req.session.adminLoggedIn)
  admin_status = true
  res.render('admin/vendor-view',{admin_status})
})

module.exports = router;
