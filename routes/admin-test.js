
var express           =   require('express');
var router            =   express.Router();
var userHelpers       =   require('../helpers/user-helpers')

const session         =   require('express-session');
 const { response }    =   require('../app');




/* Verify Is Admin Loggedin
============================================= */
const verifyAdminLogin  = (req,res,next)=>{
  if(req.session.adminLoggedIn){
    next()
  }
  else{
    res.redirect('/admin')
  }
}


/* Admin Login
============================================= */
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



/* Admin Login to Dashboard
============================================= */
router.get('/dashboard',verifyAdminLogin, (req,res)=> {
  if( req.session.adminLoggedIn)
  admin_status = true
  // admin_status   =   req.session.user.status
  res.render('admin/dashboard',{admin_status})
})



/* Admin Logout
============================================= */
router.get('/logout', (req,res)=> {
  req.session.user            =   null
  req.session.adminLoggedIn   =   false
  res.redirect('/admin')
})

/*------------------------------------------------- Vendor Management--------------------------------------------------*/

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
   
  userHelpers.doSignup_Vendor(req.body).then((response)=>{
   
    if(response.signup_status==false){
      // req.session.vendorSignupFailed   =   "Email Already Registered"
      // res.redirect('vendor_add')  
      res.json({add_failed:true})
    }
    else{
      
      let image   =   req.files.ven_image
      let id      =   response._id
     console.log(image)
     console.log(id)
      image.mv('./public/images/vendor-images/'+id+'.jpg',(err,done)=>{
        if(!err) {
          // req.session.vendorSignupSuccess  =   "You Successfully Added the Vendor" 
          // res.redirect('vendor_add')
          res.json(response)
        }
        else{
          console.log(err);
        }
      })
       
    }
  })
});


router.post('/vendor_email_check',(req,res)=>{
  let ven_email=req.body.ven_email; 
  userHelpers.checkemail_exist(ven_email).then((response)=>{
    if(response.signup_status==false){  
      res.json({add_failed:true})
    }
  })
})


/* View Vendor Details
============================================= */
router.get('/vendor_view',verifyAdminLogin, function(req,res,next){ 

 console.log(req.session.isVendorDeleted)
  if( req.session.adminLoggedIn){
   admin_status = true
  }
  
   
  userHelpers.get_AllVendors().then((vendors)=>{
  
    res.render('admin/vendor-view',{admin_status,vendors})
   
    if (req.session.isVendorDeleted) {
      console.log(req.session.isVendorDeleted)
        res.render("admin/vendor-view", { admin_status,vendors,isVendorDeleted:req.session.isVendorDeleted });
        req.session.isVendorDeleted = false
    } else {
        
        res.render("admin/vendor-view", { admin_status, vendors });
        req.session.isVendorDeleted = false
    }
    
    
  })
  
})



/* Delete Vendor Details
============================================= */
router.get('/vendor_delete/:id', (req,res)=> {  
  let ven_id = req.params.id
 
  userHelpers.delete_Vendor(ven_id).then((response)=>{
   
    req.session.isVendorDeleted  =   "You Successfully Deleted the Vendor" 
  
    res.redirect('../vendor_view')
  })
 
});

// router.get('/delete_vendor/:id', (req,res)=> { 
//   let venId = req.params.id
 
//   userHelpers.delete_Vendor(venId).then((response)=>{

//     res.redirect('../vendor_view')
//   }).catch(err => {
//         console.log('Error Occured. Exiting now...', err);
//         // process.exit();
//     });

// });

router.post('/vendor_edit/:id',(req,res)=>{
  
  userHelpers.update_Vendor(req.body,req.params.id).then(()=>{
    try{
      res.redirect('../vendor_edit')
      if(req.files.ven_image){
        let image = req.files.ven_image
        image.mv('./public/images/vendor-images/'+req.params.id+'.jpg')  
      }
    }
    catch(err){
      console.log('Error Occured. Exiting now...', err);

    }
   

   
  })
})
/* Edit Vendor Details
============================================= */
router.get('/vendor_edit/:id',async (req, res)=> {  
  
  let vendor   =   await userHelpers.get_VendorDetails(req.params.id)
  console.log(vendor)
    res.render('vendor_add',{vendor})

});

router.post('/vendor_edit/:id',(req,res)=>{
  productHelpers.update_Vendor(req.body,req.params.id).then(()=>{
    res.redirect('/admin')

    if(req.files.Image){
      let image = req.files.Image
      image.mv('./public/product-images/'+req.params.id+'.jpg')  
    }
  })
})

/*-------------------------------------------------End Vendor Management--------------------------------------------------*/
module.exports = router;
