var express = require("express");
var router = express.Router();
var UserHelpers = require("../helpers/user-helpers");
var ProductHelpers = require("../helpers/product-helpers");
var messagebird = require("messagebird")("NXdZZmOVZ5XRJJJD3SH1ugXJM");

/* Verify Is User Logged in
============================================= */
const verifyUserLogin = (req, res, next) => {
    if (req.session.userLoggedIn) {
        UserHelpers.checkBlockStatus(req.session.user._id).then((response) => {
            if (response.blockStatus) {
                req.session.userMessage = "Your Account is Blocked By Admin";
                req.session.user = null;
                req.session.userLoggedIn = false;
                res.redirect("/user_login");
            } else {
                req.session.user.userMessage = req.session.userMessage;
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
    let products = await ProductHelpers.getAllProducts();
    let latest_products = products.slice(0, 12);
    let user_details = null;
    let cart_count = null;
    let user = req.session.user;
    if (user) {
        user_details = req.session.user;
        //cart_count      =   await UserHelpers.get_CartCount(user._id);
        cart_count = await UserHelpers.getCartCount(user._id);
        req.session.cart_count = cart_count;
    }
    res.render("user/index", { user_status: true, user_details, latest_products, cart_count });
});

/* Check  User Email Exist or not
============================================= */
router.post("/useremail_check", (req, res) => {
    UserHelpers.checkUseremailExist(req.body.email).then((response) => {
        if (response.signup_status == false) {
            res.json({ user_add_failed: "true" });
        } else {
            res.json({ user_add_failed: "false" });
        }
    });
});

/* Check  User Phone Exist or not
============================================= */
router.post("/phone_check", function (req, res) {
    UserHelpers.checkUserphoneExist(req.body.phone).then((response) => {
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
    res.render("user/signup", { userMessage: req.session.userMessage });
    req.session.userMessage = false;
});

router.post("/signup", (req, res) => {
    UserHelpers.doSignupUser(req.body).then((response) => {
        if (response.signup_status == false) {
            req.session.userMessage = " Email or Phone Number Already Registered. Please Select Another One";
            res.redirect("signup");
        } else {
            req.session.userLoggedIn = true;
            req.session.user = response;
            res.redirect("/");
        }
    });
});

/* User Login 
============================================= */
router.get("/user_login", (req, res) => {
    if (req.session.user) {
        res.redirect("/");
    } else {
        res.render("user/login", { userMessage: req.session.userMessage });
        req.session.userMessage = false;
    }
});

router.post("/user_login", (req, res) => {
    UserHelpers.doLoginUser(req.body).then((response) => {
        if (response.loginStatus == true) {
            req.session.user = response.user;
            req.session.userLoggedIn = true;
            req.session.userMessage = false;
            res.redirect("/");
        } else if (response.loginStatus == "blocked") {
            req.session.userMessage = "Your Account is Blocked By Admin";
            res.redirect("/user_login");
        } else {
            req.session.userMessage = "Invalid Password or Username";
            res.redirect("/user_login");
        }
    });
});

/* User Logout
============================================= */
router.get("/user_logout", (req, res) => {
    req.session.user = null;
    req.session.userLoggedIn = false;
    req.session.cart_count = null;
    req.session.userMessage = false;
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

                UserHelpers.doLogin_UserbyPhone(phone).then((response) => {
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
    user_id = req.session.user._id;
    UserHelpers.addUserProfile(req.body, user_id).then((response) => {
        req.session.userMessage = " Profile Updated Successfully";
        res.redirect("/profile");
    });
});

/*Get User Profile Details
============================================= */
router.get("/profile", verifyUserLogin, async (req, res) => {
    let user_id = req.session.user._id;
    let cart_count = null;
    let user = await UserHelpers.getUserDetails(user_id);
    let user_details = req.session.user;
    cart_count = req.session.cart_count;
    user_details.userMessage = req.session.userMessage;
    res.render("user/profile", { user_status: true, user, user_details, cart_count });
    req.session.userMessage = false;
});

/* change Password  of user get
============================================= */
router.get("/user_settings", verifyUserLogin, (req, res) => {
    let user_details = {
        first_name: req.session.user.first_name,
        userMessage: req.session.userMessage,
    };
    cart_count = req.session.cart_count;
    res.render("user/user-settings", { user_details, user_status: true, cart_count });
    req.session.userMessage = false;
});

/* Change Password of a user post 
============================================= */
router.post("/change_password", verifyUserLogin, (req, res) => {
    req.body.userId = req.session.user._id;
    UserHelpers.changePasswordUser(req.body).then((response) => {
        if (response.resetStatus == true) {
            req.session.userMessage = "Password Updated Successfully";
        } else if (response.resetStatus == false) {
            req.session.userMessage = "Old Password incorrect";
        } else {
            req.session.userMessage = "User Doesn't Exist";
        }
        res.redirect("/user_settings");
    });
});

/*Change Profile Image Of User
============================================= */
router.post("/change_profile_image", verifyUserLogin, (req, res) => {
    let image = req.files.profile_image_upload;
    let id = req.session.user._id;
    image.mv("./public/images/profile-images/" + id + ".jpg", (err, done) => {
        if (!err) {
            res.redirect("profile");
        } else {
            console.log(err);
        }
    });
});

/*Forget Password of user 
============================================= */
router.get("/forget_password", (req, res) => {
    let userMessage = req.session.userMessage;
    res.render("user/forget-password", { userMessage });
    req.session.userMessage = false;
});

/*Forget Password of user (post method)
============================================= */
router.post("/forget_password", async (req, res) => {
    let email = req.body.email;
    await UserHelpers.forgetPassword(req.body)
        .then((response) => {
            if (response.status == 0) {
                req.session.userMessage = "No account with that email address exists.";
                res.redirect("forget_password");
            } else {
                req.session.userMessage = "An e-mail has been sent to " + email + " with further instructions.";
                res.redirect("forget_password");
            }
        })
        .catch((err) => {
            console.log(err);
        });
});

/*Reset Password of user 
============================================= */
router.get("/reset/:token", async (req, res) => {
    let token = req.params.token;
    UserHelpers.resetPasswordResponse(req.params.token)
        .then((response) => {
            if (response.status == 0) {
                req.session.userMessage = "Password reset token is invalid or has expired.Please Try again";
                res.redirect("/forget_password");
            } else {
                res.render("user/reset-password", { token });
            }
        })
        .catch((err) => {
            console.log(err);
        });
});

/* Reser Password of a user (post) 
============================================= */
router.post("/reset_password", (req, res) => {
    UserHelpers.resetPasswordUser(req.body).then((response) => {
        if (response.resetStatus == true) {
            req.session.userMessage = "Password Updated Successfully. You Can Login Here";
            res.redirect("/user_login");
        } else {
            req.session.userMessage = "Password reset token is invalid or has expired.Please Try again";
            res.redirect("/forget_password");
        }
    });
});

/*  =============================================      Products          ============================================= */

/* Bakers Listing
============================================= */
router.get("/get_bakers", (req, res) => {
    let user_details = null;
    let cart_count = null;
    if (req.session.user) {
        user_details = req.session.user;
        cart_count = req.session.cart_count;
    }
    UserHelpers.getAllVendors().then((vendors) => {
        res.render("user/bakers", { user_status: true, vendors, user_details, cart_count });
    });
});

/* Products Listing
============================================= */
router.get("/get_products_bybaker/:id", async (req, res) => {
    vendor_id = req.params.id;
    let products = null;
    let latest_products = null;
    let categories = null;
    products = await ProductHelpers.getProductsByVendorId(vendor_id);
    if (products.length > 0) {
        categories = await ProductHelpers.getAllcategories();
        latest_products = products.slice(0, 3);
    }
    let user_details = null;
    let cart_count = null;
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

/*  =============================================      Cart          ============================================= */

/*Buy Now
============================================= */
router.get("/buynow", verifyUserLogin, (req, res) => {   
    res.redirect("/cart");
});

/* Items Add to Cart
============================================= */
router.post("/add_to_cart", verifyUserLogin, async (req, res) => {
    let value = req.body.value;
    await UserHelpers.addToCart(req.body, req.session.user._id).then(async () => {
        if (req.session.cart_count) {
            cart_count = req.session.cart_count;
            req.session.cart_count = cart_count + 1;
        } else {
            req.session.cart_count = 1;
        }
        res.json({ status: true, cart_count: 1, value });
    });
});

/* Get cart items
============================================= */
router.get("/cart", verifyUserLogin, async (req, res) => {
    let totalValue = 0;
    let products = await UserHelpers.getCartProducts(req.session.user._id);
    let user_details = null;
    let cart_count = null;
    if (req.session.user) {
        user_details = req.session.user;
        cart_count = req.session.cart_count;
    }
    let user = req.session.user._id;
    if (products.length > 0) {
        totalValue = await UserHelpers.getTotalAmount(req.session.user._id);
        res.render("user/cart", { user_status: true, products, user, totalValue, user_details, cart_count });
    } else {
        res.render("user/cart", { user_status: true, user_details });
    }
});

/* Change product quantity
============================================= */
router.post("/change_product_quantity", (req, res, next) => {
    UserHelpers.changeProductQuantity(req.body).then(async (response) => {
        if (!response.removeCart) {
            let total = await UserHelpers.getTotalAmount(req.body.user);
            response.total = total[0].total;
            response.total_org = total[0].total_org;
            response.discount = total[0].discount;
        }
        cart_count = await UserHelpers.getCartCount(req.session.user._id);
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
    UserHelpers.removeCartItem(req.body).then(async (response) => {
        cart_count = await UserHelpers.getCartCount(req.session.user._id);
        if (req.session.cart_count) {
            req.session.cart_count = cart_count;
        }
        res.json({ cart: cart_count });
    });
});

/*Proceed to place order
============================================= */
router.get("/place_order", verifyUserLogin, async (req, res) => {
    let user_address = null;
    let user_details = req.session.user;
    let total = await UserHelpers.getTotalAmount(req.session.user._id);
    user_address = await UserHelpers.getUserDetails(req.session.user._id);
    res.render("user/place-order", { user_status: true, total, user: req.session.user, user_details, user_address });
});

router.post("/place-order", async (req, res) => {
    req.session.cart_count = 0;
    let product = await UserHelpers.getCartProductList(req.body.userId);
    let total = req.body.cart_total;
    UserHelpers.place_Order(req.body, product, total).then((orderId) => {
        if (req.body["payment-method"] === "COD") {
            res.json({ cod_success: true });
        } else if (req.body["payment-method"] === "RAZORPAY") {
            UserHelpers.generateRazorPay(orderId, total).then((response) => {
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
    let user_details = req.session.user;
    let orders = null;
    orders = await UserHelpers.getUserOrdersByuserId(req.session.user._id);
    cart_count = req.session.cart_count;
    res.render("user/orders", { orders, user_status: true, user_details, cart_count });
});

/*View Order Products By User Id
============================================= */
router.get("/view-order-products/:id", verifyUserLogin, async (req, res) => {
    let orderId =   req.params.id
    let products = await UserHelpers.getOrderProductsByOrderId(orderId);
    let user_details = null;
    user_details = { first_name: req.session.user.first_name };
    res.render("user/view-order-products", { products, user_status: true, user_details,orderId });
    // res.render("user/view-order-products", { user: req.session.user, products, user_status: true, user_details });
});


/*Verify Payment & Change Status
============================================= */
router.post("/verify_payment", (req, res) => {
    UserHelpers.verify_Payment(req.body)
        .then(() => {
            UserHelpers.changePaymentStatus(req.body["order[receipt]"]).then(() => {
                res.json({ status: true });
            });
        })
        .catch((err) => {
            res.json({ status: false, errMsg: "" });
        });
});

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
    UserHelpers.changePaymentStatus(order_id).then(() => {
        res.render("user/order-success");
    });
    req.session.cart_count = false;
});

/* Apply Coupon Code To Cart
============================================= */
router.post("/apply_coupon_code", async (req, res, next) => {
    let coupon_code = req.body.coupon_code;
    let subtotal = req.body.subtotal;
    let user_id = req.session.user._id;
    await UserHelpers.checkCouponCode(coupon_code, subtotal, user_id).then(async (response) => {
        if (response.status == false) {
            res.json({ status: false });
        } else if (response.status == "less") {
            const response_details = {
                status: "less",
                minimum_amount: response.minimum_amount,
            };
            res.json(response_details);
        } else if (response.status == "used") {
            res.json({ status: "used" });
        } else {
            res.json(response);
        }
    });
});

/*  =============================================      Menu          ============================================= */

/*Contact
============================================= */
router.get("/contact", (req, res) => {
    let user_details = null;
    let cart_count = null;
    if (req.session.user) {
        user_details = { first_name: req.session.user.first_name };
        cart_count = req.session.cart_count;
    }
    let userMessage = req.session.userMessage;
    res.render("user/contact", { user_status: true, user_details, cart_count, userMessage });
    req.session.userMessage = false;
});

/*Send Message to Admin From Customer
============================================= */
router.post("/contact", async (req, res) => {
    await UserHelpers.contact(req.body).then((response) => {
        if (response.status == true) {
            req.session.userMessage = "Message Sent. We Will Contact You Soon";
        } else {
            req.session.userMessage = "Message Not sent,Please Try Again";
        }
        res.redirect("/contact");
    });
});

/*About
============================================= */
router.get("/about", (req, res) => {
    let user_details = null;
    let cart_count = null;
    
    if (req.session.user) {
        user_details = req.session.user;
        cart_count = req.session.cart_count;
    }
    UserHelpers.getAllVendors().then((vendors) => {
        res.render("user/about", { user_status: true, vendors, user_details, cart_count });
    });
});

module.exports = router;
