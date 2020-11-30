var express = require("express");
var router = express.Router();
var userHelpers = require("../helpers/user-helpers");
var productHelpers = require("../helpers/product-helpers");
const session = require("express-session");

/* Get Product List
============================================= */
router.get("/", function (req, res, next) {
    productHelpers.get_Allproducts().then((products) => {
        if (req.session.user) {
          console.log(req.session.user.first_name)
            username = req.session.user.first_name;
            res.render("user/index", { products, user_status: true, username });
        }
        console.log("ki")
        res.render("user/index", { products, user_status: true });
    });
});

router.get("/user_login", (req, res) => {

    if (req.session.user) {
        res.redirect("/");
    } else {
        res.render("user/login", { user_message: req.session.user_message });
        req.session.user_message = false;
    }
});

/* SignUp For  Vendor
============================================= */

/* Check  User Email Exist or not
============================================= */
router.post("/useremail_check", (req, res) => {
 
  let user_email   =   req.body.email;
  userHelpers.check_useremail_exist(user_email).then((response) => {
      if (response.signup_status == true) {
          res.json({ add_failed: "true" });
        
      } else {
          res.json({ add_failed: "false" });
         
      }
  });
});


router.get("/signup", (req, res) => {
    if (req.session.user_message) {
        res.render("user/signup", { user_message: req.session.user_message });
        req.session.user_message = false;
    } else {
        res.render("user/signup");
    }
});

router.post("/signup", (req, res) => {
  //  let user_details = req.body
  //  first_name = user_details.first_name
  //  console.log(first_name)
    userHelpers.doSignup_User(req.body).then((response) => {
     
        if (response.signup_status == false) {
            req.session.user_message = " Email address Already Registered. Please Select Another One";
            res.redirect("signup");
        } else {
          // req.session.user = first_name
          res.redirect("/");
        }
    });
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

module.exports = router;
