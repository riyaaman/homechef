var express = require("express");
var router = express.Router();
var userHelpers = require("../helpers/user-helpers");
var productHelpers = require("../helpers/product-helpers");
const session = require("express-session");
var messagebird = require("messagebird")("NXdZZmOVZ5XRJJJD3SH1ugXJM");

/* Get Product List
============================================= */
router.get("/", function (req, res, next) {
    productHelpers.get_Allproducts().then((products) => {
        if (req.session.user) {
           
            username = req.session.user.first_name;
            res.render("user/index", { products, user_status: true, username });
        }

        res.render("user/index", { products, user_status: true });
    });
});


/* Check  User Email Exist or not
============================================= */
router.post("/useremail_check", (req, res) => {
    let user_email = req.body.email;
    console.log(user_email);
    userHelpers.check_Useremail_Exist(user_email).then((response) => {
        if (response.signup_status == false) {
            res.json({ add_failed: "true" });
        } else {
            res.json({ add_failed: "false" });
        }
    });
});


/* Check  User Phone Exist or not
============================================= */
router.post("/phone_check", function (req, res) {
    let user_phone = req.body.phone;
console.log(user_phone)
    userHelpers.check_Userphone_Exist(user_phone).then((response) => {
        if (response.signup_status == false) {
            res.json({ add_failed: "true" });
        } else {
            res.json({ add_failed: "false" });
        }
    });
});



/* User Signup
============================================= */
router.get("/signup", (req, res) => {
    if (req.session.user_message) {
        res.render("user/signup", { user_message: req.session.user_message });
        req.session.user_message = false;
    } else {
        res.render("user/signup");
    }
});

router.post("/signup", (req, res) => {
     let user_details = req.body
     first_name = user_details.first_name
     console.log(first_name)
    userHelpers.doSignup_User(req.body).then((response) => {
        if (response.signup_status == false) {
            req.session.user_message = " Email or Phone Number Already Registered. Please Select Another One";
            res.redirect("signup");
        } else {
           req.session.user   =   {first_name:first_name}
          //  console.log(req.session.user)
          //   req.session.firstName = first_name
          res.redirect("/");
        }
    });
});



/* User Login & Logout
============================================= */
router.get("/user_login", (req, res) => {
  if (req.session.user) {
      res.redirect("/");
  } else {
      //   if(req.session.error) {let error = req.session.error;}
      res.render("user/login", { user_message: req.session.user_message });
      req.session.user_message = false;
  }
}); 

router.post("/user_login", (req, res) => {
    userHelpers.doLogin_User(req.body).then((response) => {
        if (response.loginStatus) {
            req.session.user = response.user;
            req.session.useroggedIn = true;

            let name = req.session.user.name;

            res.redirect("/");
        } else {
            req.session.user_message = "Invalid Password or Username";
            res.redirect("/user_login");
        }
    });
});

router.get("/user_logout", (req, res) => {
    req.session.user = null;
    req.session.userLoggedIn = false;
    res.redirect("/");
});



/* User OTP Verification
============================================= */
router.post("/step2", function (req, res) {
 
    var number = "+" +req.body.number;
        messagebird.verify.create(
            number,
            {
                originator: "Code",
                template: "Your verification code is %token.",
            },
            function (err, response) {
                if (err) {
                    console.log(err);
                    res.render("user/login", {
                        error: err.errors[0].description,
                    });
                } else {
                    console.log(response);
                    res.render("user/login-verify-step2", {
                        id: response.id,
                    });
                }
            }
        );
    
});

router.post("/step3", function (req, res) {
    var id = req.body.id;
    var token = req.body.token;
    messagebird.verify.verify(id, token, function (err, response) {
        if (err) {
            console.log(err);
            res.render("user/login-verify-step2", {
                error: err.errors[0].description,
                id: id,
            });
        } else {
            console.log(response);
            res.redirect("/");
            //res.render("user/login-success");
        }
    });
});



/* Bakers Listing
============================================= */
router.get("/get_bakers", (req, res) => {  
//console.log("kdsfdfggfg")
      userHelpers.get_AllVendors().then((vendors) => { 
        res.render("user/bakers",{user_status:true,vendors}); 
    });   
}); 


/* Products Listing
============================================= */
router.get("/get_products_bybaker/:id", async(req, res) => {  
    
    vendor_id = req.params.id;
    //vendor_name = req.params.name;
   // console.log(vendor_name )
    // console.log(vendor_id )
    let categories = await productHelpers.get_Allcategories();
    let products = await productHelpers.get_ProductsByVendorId(vendor_id);
   // console.log(products)
   const latest_products = products.slice(0, 3)
   console.log( latest_products)
    res.render("user/products",{user_status:true,categories,products,vendor_id,latest_products}); 
  
    }); 


module.exports = router;
