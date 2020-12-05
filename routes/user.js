var express = require("express");
var router = express.Router();
var userHelpers = require("../helpers/user-helpers");
var productHelpers = require("../helpers/product-helpers");
const session = require("express-session");
const { response } = require("express");
var messagebird = require("messagebird")("NXdZZmOVZ5XRJJJD3SH1ugXJM");

/* Verify Is User Logged in
============================================= */
const verifyUserLogin = (req, res, next) => {
    if (req.session.userLoggedIn) {      
        next();
    } else {
        res.redirect("/user_login");
    }
};

const userDetails = (req, res, next) => {
    if (req.session.userLoggedIn) {
        req.session.userDetails = {
            user_id: req.session.user._id,
            name: req.session.user.first_name,
            user_message: req.session.user_message,
        };
    }
        else{
            req.session.userDetails = null
        }
        
    //} 
    next();
};

/* Get Product List
============================================= */
router.get("/",userDetails, async (req, res, next) => {
    
    let products = await productHelpers.get_Allproducts();
    let latest_products = products.slice(0, 12);

    user_details = req.session.userDetails  
    res.render("user/index", { user_status: true, user_details, latest_products });
});

/* Check  User Email Exist or not
============================================= */
router.post("/useremail_check", (req, res) => {
    let user_email = req.body.email;
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
    let user_details = req.body;
    first_name = user_details.first_name;

    userHelpers.doSignup_User(req.body).then((response) => {
        if (response.signup_status == false) {
            req.session.user_message = " Email or Phone Number Already Registered. Please Select Another One";
            res.redirect("signup");
        } else {
            req.session.userLoggedIn = true
            req.session.user = { first_name: first_name };
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
            req.session.userLoggedIn = true;
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
    var number = "+" + req.body.number;
    req.session.phone = req.body.number;
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

            if (req.session.phone) {
                let userData = {};
                phone = req.session.phone;

                userHelpers.doLogin_UserbyPhone(phone).then((response) => {
                    if (response.loginStatus) {
                        req.session.user = response.user;
                        req.session.userLoggedIn = true;
                        res.redirect("/");
                    }
                });
            }
        }
    });
});

/* Bakers Listing
============================================= */
router.get("/get_bakers", (req, res) => {
    user_details =req.session.userDetails
    userHelpers.get_AllVendors().then((vendors) => {
        res.render("user/bakers", { user_status: true, vendors,user_details });
    });
});

/* Products Listing
============================================= */
router.get("/get_products_bybaker/:id", async (req, res) => {
    vendor_id = req.params.id;

    let categories = await productHelpers.get_Allcategories();
    let products = await productHelpers.get_ProductsByVendorId(vendor_id);

    const latest_products = products.slice(0, 3);
    user_details =  req.session.userDetails
   
    res.render("user/products", { user_status: true, categories, products, vendor_id, latest_products,user_details});
  
});

/*Contact
============================================= */
router.get("/contact", (req, res) => {
    user_details =req.session.userDetails
    res.render("user/contact", { user_status: true ,user_details});
});

/*About
============================================= */
router.get("/about", (req, res) => {
    user_details =req.session.userDetails
    userHelpers.get_AllVendors().then((vendors) => {
        res.render("user/about", { user_status: true, vendors,user_details });
    });
});

/*User Profile
============================================= */
router.get("/profile/:id", verifyUserLogin, async (req, res) => {
    user_id = req.params.id;
    let user = await userHelpers.get_UserDetails(user_id);
    user_details =  req.session.userDetails
    res.render("user/profile", { user_status: true, user,user_details });
});

/* change Password  of user get
============================================= */
router.get("/user_settings/:id",userDetails, verifyUserLogin, (req, res) => {
  
    user_details = req.session.userDetails;
    user_status = true;
    res.render("user/user-settings", { user_details, user_status });
    req.session.user_message = false;
    
});

/* Change Password of a user post 
============================================= */
router.post("/change_password", (req, res) => {
    
    user_id = req.body.user_id;
    userHelpers.change_Password_User(req.body).then((response) => {
        if (response.resetStatus == true) {
          
            req.session.user_message = "Password Updated Successfully";
        } else if (response.resetStatus == false) {
            
            req.session.user_message = "Old Password incorrect";
        } else {
          
            req.session.user_message = "User Not Exist";
        }

        res.redirect("/user_settings/id=" + user_id);
    });
});

module.exports = router;
