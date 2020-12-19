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
        userData ={
            email:req.session.user.email,
            password:req.session.user.password
        }
        userHelpers.doLogin_User(userData).then((response) => {
            console.log("status:",response.loginStatus)
      
            if (response.loginStatus == "blocked") {
                req.session.user_message = "Your Account is Blocked By Admin";
                req.session.user = null;                
                req.session.userLoggedIn = false;
                res.redirect("/user_login");
            } 
            else{
                req.session.user.user_message = req.session.user_message;
                next();
            }
        });
      
    } else {
        
        res.redirect("/user_login");
    }
};

/* Get Product List
============================================= */
router.get("/", async (req, res, next) => {
    let products = await productHelpers.get_Allproducts();
    let latest_products = products.slice(0, 12);
    let user_details = null;
    user = req.session.user;
    let cart_count = null;
   
    if (user) {
       
        user_details = req.session.user;
        cart_count = await userHelpers.get_CartCount(user._id);        
        req.session.cart_count = cart_count;      
    }

    res.render("user/index", { user_status: true, user_details, latest_products, cart_count });
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
            req.session.userLoggedIn = true;
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
        res.render("user/login", { user_message: req.session.user_message });
        req.session.user_message = false;
    }
});

router.post("/user_login", (req, res) => {
    userHelpers.doLogin_User(req.body).then((response) => {
        console.log("status:",response.loginStatus)
        if (response.loginStatus == true) {
            
            req.session.user = response.user;
            req.session.userLoggedIn = true;
            req.session.user_message = false;
            req.session.user.password = req.body.password
            res.redirect("/");
        } else if (response.loginStatus == "blocked") {
            req.session.user_message = "Your Account is Blocked";
            res.redirect("/user_login");
        } else {
            req.session.user_message = "Invalid Password or Username";
            res.redirect("/user_login");
        }
    });
});

router.get("/user_logout", (req, res) => {
    req.session.user = null;
    req.session.userLoggedIn = false;
    req.session.cart_count = null;
    req.session.user_message = false;

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

/* User Profile Add/Update 
============================================= */
router.post("/profile_add", verifyUserLogin, (req, res) => {
    let user_details = req.body;
    user_id = req.session.user._id;

    userHelpers.add_User_Profile(req.body, user_id).then((response) => {
        req.session.user_message = " Profile Updated Successfully";
        res.redirect("/profile/" + user_id);
    });
});

/*User Profile
============================================= */
router.get("/profile/:id", verifyUserLogin, async (req, res) => {
    
    user_id = req.params.id;
   
    cart_count = null;
    let user = await userHelpers.get_UserDetails(user_id);
    user_details = req.session.user;
    cart_count = req.session.cart_count;
    res.render("user/profile", { user_status: true, user, user_details, cart_count });
    req.session.user_message = false;
});

/* change Password  of user get
============================================= */
router.get("/user_settings/:id", verifyUserLogin, (req, res) => {
    user_details = req.session.user;
    res.render("user/user-settings", { user_details, user_status: true });
    req.session.user_message = false;
});

/* Change Password of a user post 
============================================= */
router.post("/change_password", verifyUserLogin, (req, res) => {
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

/*  =============================================      Products          ============================================= */

/* Bakers Listing
============================================= */
router.get("/get_bakers", (req, res) => {
    user_details = null;
    cart_count = null;
    if (req.session.user) {
        user_details = req.session.user;
        cart_count = req.session.cart_count;
    }
    userHelpers.get_AllVendors().then((vendors) => {
        res.render("user/bakers", { user_status: true, vendors, user_details, cart_count });
    });
});

/* Products Listing
============================================= */
router.get("/get_products_bybaker/:id", async (req, res) => {
    vendor_id = req.params.id;
    let products = {};
    let latest_products = {};
    let categories = {};
    products = await productHelpers.get_ProductsByVendorId(vendor_id);
    if (products.length > 0) {
        categories = await productHelpers.get_Allcategories();
        latest_products = products.slice(0, 3);
    }

    user_details = null;
    cart_count = null;
    if (req.session.user) {
        user_details = req.session.user;
        cart_count = req.session.cart_count;
    }

    res.render("user/products", {
        user_status: true,
        categories,
        products,
        vendor_id,
        latest_products,
        user_details,
        cart_count,
    });
});

/*Contact
============================================= */
router.get("/contact", (req, res) => {
    user_details = null;
    cart_count = null;
    if (req.session.user) {
        user_details = req.session.user;
        cart_count = req.session.cart_count;
    }
    res.render("user/contact", { user_status: true, user_details, cart_count });
});

/*About
============================================= */
router.get("/about", (req, res) => {
    user_details = null;
    cart_count = null;
    if (req.session.user) {
        user_details = req.session.user;
        cart_count = req.session.cart_count;
    }
    userHelpers.get_AllVendors().then((vendors) => {
        res.render("user/about", { user_status: true, vendors, user_details, cart_count });
    });
});

/*Buy Now
============================================= */
router.get("/buynow", verifyUserLogin, (req, res) => {
    user_details = null;
    cart_count = null;
    if (req.session.user) {
        user_details = req.session.user;
        cart_count = req.session.cart_count;
    }
    res.redirect("/cart");
});

/* Add to cart
============================================= */
router.post("/add_to_cart", verifyUserLogin, (req, res) => {
    console.log("userid:",req.session.user._id)
    userHelpers.add_ToCart(req.body, req.session.user._id).then(async () => {
        // cart_count = await userHelpers.get_CartCount(user._id);
        if (req.session.cart_count) {
            cart_count = req.session.cart_count;
            req.session.cart_count = cart_count + 1;
        } else {
            req.session.cart_count = 1;
        }
        res.json({ status: true, cart_count: 1 });
    });
});

/* Get cart items
============================================= */
router.get("/cart", verifyUserLogin, async (req, res) => {
    let totalValue = 0;
    let products = await userHelpers.get_CartProducts(req.session.user._id);
    user_details = null;
    cart_count = null;
    if (req.session.user) {
        user_details = req.session.user;
        cart_count = req.session.cart_count;
    }
    let user = req.session.user._id;
    if (products.length > 0) {
        totalValue = await userHelpers.get_TotalAmount(req.session.user._id);
        res.render("user/cart", { user_status: true, products, user, totalValue, user_details, cart_count });
    } else {
        res.render("user/cart", { user_status: true, user_details });
    }
});

/* Change product quantity
============================================= */
router.post("/change_product_quantity", (req, res, next) => {
    userHelpers.change_ProductQuantity(req.body).then(async (response) => {
        response.total = await userHelpers.get_TotalAmount(req.body.user);
        cart_count = await userHelpers.get_CartCount(user._id);

        response.cart_count = cart_count;
        if (req.session.cart_count) {
            req.session.cart_count = cart_count;
        }
        res.json(response);
    });
});

/* Remove product from cart
============================================= */
router.post("/remove_from_cart", async (req, res, next) => {
    let cart_count = null;
    userHelpers.remove_CartItem(req.body).then(async (response) => {
        cart_count = await userHelpers.get_CartCount(req.session.user._id);
        console.log(cart_count);
        if (req.session.cart_count) {
            req.session.cart_count = cart_count;
        }
        res.json({ cart: cart_count });
    });
});

/*Proceed to place order
============================================= */
router.get("/place_order", verifyUserLogin, async (req, res) => {
    //let user_address = null
    user_details = req.session.user;
    let total = await userHelpers.get_TotalAmount(req.session.user._id);
    user_address = await userHelpers.get_UserDetails(req.session.user._id);
    
    res.render("user/place-order", { user_status: true, total, user: req.session.user, user_details, user_address });
});

router.post("/place-order", async (req, res) => {
    let product = await userHelpers.get_CartProduct_List(req.body.userId);
    let total = await userHelpers.get_TotalAmount(req.body.userId);

    userHelpers.place_Order(req.body, product, total).then((orderId) => {
        if (req.body["payment-method"] === "COD") {
            res.json({ cod_success: true });
        } else if (req.body["payment-method"] === "ONLINE") {
            userHelpers.generate_RazorPay(orderId, total).then((response) => {
                res.json(response);
            });
        } else {
            let response = {
                orderId: orderId,
                total: total,
                cod_success: false,
            };
            res.json(response);
        }
    });
});

/*Shows order success message
============================================= */
router.get("/order_success", (req, res) => {
    req.session.cart_count = false;
    res.render("user/order-success", { user: req.session.user });
});

/*Get Orders By User Id
============================================= */
router.get("/orders", verifyUserLogin, async (req, res) => {
    user_details = req.session.user;
    let orders = null;
    orders = await userHelpers.get_UserOrders_ByuserId(req.session.user._id);
    cart_count = req.session.cart_count;   
    res.render("user/orders", { user: req.session.user, orders, user_status: true, user_details, cart_count });
    
});

/*View Order Products By User Id
============================================= */
router.get("/view-order-products/:id", async (req, res) => {
    let products = await userHelpers.get_OrderProducts(req.params.id);
    user_details = req.session.user;
    res.render("user/view-order-products", { user: req.session.user, products, user_status: true, user_details });
});

/*Verify Payment & Change Status
============================================= */
router.post("/verify_payment", (req, res) => {
    userHelpers
        .verify_Payment(req.body)
        .then(() => {
            userHelpers.change_PaymentStatus(req.body["order[receipt]"]).then(() => {
                res.json({ status: true });
            });
        })
        .catch((err) => {
            res.json({ status: false, errMsg: "" });
        });
});

router.post("/change_profile_image", verifyUserLogin, (req, res) => {
    let image = req.files.profile_image_upload;
    let id = req.session.user._id;

    image.mv("./public/images/profile-images/" + id + ".jpg", (err, done) => {
        if (!err) {
            // req.session.user_message = "Well Done ! You Successfully Added the Image";
            res.redirect("profile/" + id);
        } else {
            console.log(err);
        }
    });
});

/*Get paypal test
============================================= */
// router.get("/paypal", verifyUserLogin, async (req, res) => {
//     res.render("user/paypal-test");
// });

/*Shows Payment  Failed message For Paypal
============================================= */
router.get("/order_paypal_cancel", (req, res) => {
    req.session.cart_count = false;
    res.render("user/order-cancel", { user: req.session.user });
});

/*Shows order success message for Paypal Transaction
============================================= */
router.get("/order_paypal_success/:order_id", verifyUserLogin, async (req, res) => {
    var order_id = req.params.order_id;
    userHelpers.change_PaymentStatus(order_id).then(() => {
        res.render("user/order-success");
    });
    req.session.cart_count = false;
});




/*Get paytm test
============================================= */
router.get("/paytm_test",  async (req, res) => {
    res.render("user/paytm_test");
});

module.exports = router;
