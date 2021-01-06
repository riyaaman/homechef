var express = require("express");
var router = express.Router();
var UserHelpers = require("../helpers/user-helpers");
var ProductHelpers = require("../helpers/product-helpers");
const session = require("express-session");
var fs = require("fs");

/* Verify Is Admin Loggedin
============================================= */
const verifyAdminLogin = (req, res, next) => {
    if (req.session.adminLoggedIn) {       
        next();
    } else {
        res.redirect("/admin");
    }
};

// For Cache Checking
function noCache(req, res, next) {
    res.header("Cache-Control", "private, no-cache, no-store, must-revalidate");
    res.header("Expires", "-1");
    res.header("Pragma", "no-cache");
    next();
}

/* Admin Login
============================================= */
router.get("/", function (req, res, next) {
    if (req.session.admin) {
        res.redirect("admin/dashboard");
    } else {
        res.render("admin/login", { adminLoginError: req.session.adminLoginError });
        req.session.adminLoginError = false;
    }
});

router.post("/admin_login", (req, res) => {
    UserHelpers.doLogin(req.body).then((response) => {
        if (response.loginStatus) {
            req.session.admin           =   response.admin;
            req.session.adminLoggedIn   =   true;
            req.session.adminMessage    =   false;
            res.redirect("dashboard");
        } else {
            req.session.adminLoginError = "Invalid Password or Username";
            res.redirect("/admin");
        }
    });
});

/* Admin Login to Dashboard
============================================= */
router.get("/dashboard", verifyAdminLogin, noCache, async (req, res) => { 
    let admin_details = {
        admin_id: req.session.admin._id,
        adminMessage: req.session.adminMessage,
    }
    let count   =   await ProductHelpers.getCount();
    res.render("admin/dashboard", { admin_status: true, admin_details, count });
});

/* Admin Logout
============================================= */
router.get("/logout", (req, res) => {
    req.session.admin           =   null;
    req.session.adminLoggedIn   =   false;
    req.session.adminMessage   =   false;
    res.redirect("/admin");
});

/*Get Admin Profile Details
============================================= */
router.get("/settings", verifyAdminLogin, noCache, async (req, res) => {
    let admin_details = {
        admin_id: req.session.admin._id,
        adminMessage: req.session.adminMessage,
    };   
    let admin_profile   =   await UserHelpers.getAdminDetails( req.session.admin._id);
    res.render("admin/admin-profile", { admin_status: true, admin_details, admin_profile });
    req.session.adminMessage = false;
});

/* Admin Profile Add/Update 
============================================= */
router.post("/settings_update", verifyAdminLogin, (req, res) => {
    let adminId        =       req.session.admin._id;
    UserHelpers.updateAdminSettings(req.body, adminId).then((response) => {
        if(response.updateStatus){
            req.session.adminMessage    =   "Profile Updated Successfully"
            res.redirect("settings")
        }       
    });
});

/*Cahnge Profile Image Of Admin
============================================= */
router.post("/change_profile_image", verifyAdminLogin, (req, res) => {
    try{
        let image   =   req.files.profile_image_upload;
        let id      =   req.session.admin._id;
        image.mv("./public/images/profile-images/" + id + ".jpg", (err, done) => {
            if (!err) {
                res.redirect("settings");
            } else {
                console.log(err);
            }
        })
    }catch (err) { 
        console.log(err);
    }
   
});

/* change Password  of Admin (get)
============================================= */
router.get("/change_password", verifyAdminLogin, (req, res) => {
    let admin_details = {
        admin_id: req.session.admin._id,
        adminMessage: req.session.adminMessage,
    };
    res.render("admin/change-password", { admin_details, admin_status: true });
    req.session.adminMessage = false;
});

/* Change Password of  Admin (post)
============================================= */
router.post("/change_password", verifyAdminLogin, (req, res) => {
    UserHelpers.changePasswordAdmin(req.body).then((response) => {
        if (response.resetStatus == true) {
            req.session.adminMessage        =   "Password Updated Successfully";
        } else if (response.resetStatus == false) {
            req.session.adminMessage        =   "Old Password Incorrect";
        } else {
            req.session.adminMessage        =   "Admin Details Not Available";
        }
        res.redirect("change_password");
    });
});

/*  =============================================      Vendor Management        ==================================== */

/* SignUp For  Vendor
============================================= */

router.get("/vendor_add", verifyAdminLogin, noCache, (req, res) => {
    let admin_details = {
        admin_id: req.session.admin._id,
        adminMessage: req.session.adminMessage,
    };
    res.render("admin/vendor-add", { admin_status: true, admin_details });
    req.session.adminMessage = false;
});

router.post("/vendor_add", (req, res) => {
    try{
        UserHelpers.addVendor(req.body).then((response) => {
            if (response.signup_status == false) {
                req.session.adminMessage    =   "Email address Already Registered. Please Select Another One";
                res.redirect("vendor_add");
            } else {
                let id      =   response._id;
                var img_url = req.body.img_url;
                if (img_url == 0) {
                    let image = req.files.ven_image;
                    image.mv("./public/images/vendor-images/" + id + ".jpg", (err, done) => {
                        if (!err) {
                            req.session.adminMessage = "Well Done ! You Successfully Added the Vendor";
                            res.redirect("vendor_add");
                        } else {
                            console.log(err);
                        }
                    });
                } else {
                    var base64Data = img_url.replace(/^data:image\/png;base64,/, "");
                    fs.writeFile("./public/images/vendor-images/" + id + ".jpg", base64Data, "base64", (err, done) => {
                        if (!err) {
                            req.session.adminMessage = "Well Done ! You Successfully Added the Vendor";
                            res.redirect("vendor_add");
                        } else {
                            console.log(err);
                        }
                    });
                }
            }
        })
    }catch (err) {
            console.log(err);
        }
  
});

/* Check Vendor Email Exist or not
============================================= */
router.post("/vendor_email_check", (req, res) => {  
    UserHelpers.checkVendorEmailExist(req.body.ven_email).then((response) => {
        if (response.isEmail == true) {
            res.json({ add_failed: "true" });
        } else {
            res.json({ add_failed: "false" });
        }
    });
});

/* View Vendor Details
============================================= */
router.get("/vendor_view", verifyAdminLogin, noCache,  (req, res, next) =>{
    UserHelpers.getAllVendors().then((vendors) => {
        let admin_details = {
            admin_id: req.session.admin._id,
            adminMessage: req.session.adminMessage,
        };
        res.render("admin/vendor-view", { admin_status: true, vendors, admin_details });
        req.session.adminMessage = false;
    });
});

/* Delete Vendor Details
============================================= */
router.get("/vendor_delete/:id", (req, res) => {
    let ven_id = req.params.id;
    UserHelpers.deleteVendor(ven_id).then((response) => {
        try {
           // const DIR = "./public/images/vendor-images";
            //fs.unlinkSync(DIR + "/" + ven_id + ".jpg");
            req.session.adminMessage = "You Successfully Deleted the Vendor";
            res.redirect("../vendor_view");
        } catch (err) {
            res.render("/error", { title: "Sorry,Something Went Wrong" });           
        }
    });
});

/* Edit Vendor Details
============================================= */
router.get("/vendor_edit/:id", async (req, res) => {
    let vendor = await UserHelpers.getVendorDetails(req.params.id);
    let admin_details = {
        admin_id: req.session.admin._id,
        adminMessage: req.session.adminMessage,
    };
    res.render("admin/vendor-edit", { vendor, admin_status: true, admin_details });
    req.session.adminMessage = false;
});

router.post("/vendor_edit/:id", (req, res) => {
    try{
        let id = req.params.id
        UserHelpers.updateVendor(req.body, req.params.id).then((response) => {
            if (response.update_status == true) {
                req.session.adminMessage = " Vendor Details Updated Successfully";
                res.redirect("../vendor_edit/" + id)    
                if (req.files.ven_image) {
                    let image = req.files.ven_image;
                    image.mv("./public/images/vendor-images/" + req.params.id + ".jpg");
                }
            }
        })
    } catch (err) {
        console.log(err);
    }
   
});

/* Change Email(username) of a Vendor
============================================= */
router.post("/vendor_email_update", verifyAdminLogin, (req, res) => {
    UserHelpers.change_Email_Vendor(req.body).then((response) => {
        let vendor_id       =   req.body.ven_id;
        if (response.isEmail == true) {
            req.session.adminMessage    =   "Email Already Exist";
        } else {
            req.session.adminMessage    =   "Email Updated Successfully";
        }
        res.redirect("vendor_edit/" + vendor_id);
    });
});

/*  =============================================      Category Management        ==================================== */

/* Add  Category 
============================================= */

router.get("/category_add", verifyAdminLogin, noCache, (req, res) => {    
    res.render("admin/category-add", { admin_status:true });
});

router.post("/category_add", (req, res) => {
    ProductHelpers.addCategory(req.body).then((response) => {
        if(response.isCategory){
            req.session.adminMessage    =   "Category Name Already Exist"
        }
        res.redirect("category_manage");       
    });
});

/* Get  Category List
============================================= */
router.get("/category_manage", verifyAdminLogin, noCache, (req, res, next) => {
    let admin_details = {
        admin_id        : req.session.admin._id,
        adminMessage    : req.session.adminMessage
    }
    ProductHelpers.getAllcategories().then((category) => {       
            res.render("admin/category-manage", { admin_status: true, category, admin_details })
            req.session.adminMessage    =   false
    })
})

/* Update  Category 
============================================= */
router.post("/category_update", (req, res) => {    
    ProductHelpers.updateCategory(req.body,req.body.cat_id).then(() => {
        res.redirect("category_manage");
    });
});

/* Delete  Category 
============================================= */
router.post("/category_delete", (req, res) => {
    ProductHelpers.deleteCategory(req.body.cat_id).then(() => {
        req.session.adminMessage    =   "Category Deleted Successfully"
        res.redirect("category_manage");
    });
});

/*  =============================================    User(Customer) Management      =============================== */

/* View User Details
============================================= */
router.get("/users_view", verifyAdminLogin, noCache, function (req, res) {
    UserHelpers.getAllUsers().then((users) => {
        let admin_details = {
            admin_id: req.session.admin._id,
            adminMessage: req.session.adminMessage,
        }
        res.render("admin/users-view", { admin_status: true, users, admin_details });
        req.session.adminMessage = false;
    });
});

/* View Blocked User Details
============================================= */
router.get("/blocked_users_view", verifyAdminLogin, noCache, function (req, res, next) {
    UserHelpers.getAllBlockedUsers().then((users) => {
        let admin_details = {
            admin_id: req.session.admin._id,
            adminMessage: req.session.adminMessage,
        }
        res.render("admin/users-blocked", { admin_status: true, users, admin_details });
        req.session.adminMessage = false;
    })
});

/* Add User Details
============================================= */
router.get("/user_add", verifyAdminLogin, function (req, res, next) {
    let admin_details = {
        admin_id: req.session.admin._id,
        adminMessage: req.session.adminMessage,
    };
    res.render("admin/user-add", { admin_status: true, admin_details });
    req.session.adminMessage = false;
});

router.post("/user_add", (req, res) => {
    UserHelpers.doSignupUser(req.body).then((response) => {
        if (response.signup_status == false) {
            req.session.adminMessage = " Email or Phone Number Already Registered. Please Select Another One";
        } else {
            req.session.adminMessage = " User Details Added Successfully";
        }
        res.redirect("user_add");
    });
});

/* Delete User Details
============================================= */
router.post("/user_delete", (req, res) => {    
    UserHelpers.deleteUser(req.body.user_id).then((response) => {
        try {
            req.session.adminMessage = "You Successfully Deleted the User";
            res.redirect("users_view");
        } catch (err) {
            res.render("/error", { title: "Sorry,Something Went Wrong" });
        }
    });
});

/* Block User Details
============================================= */
router.post("/user_block", (req, res) => {  
    UserHelpers.blockUser(req.body.user_id).then((response) => {
        try {
            req.session.adminMessage = "You Successfully Blocked the User";
            res.redirect("users_view");
        } catch (err) {
            res.render("/error", { title: "Sorry,Something Went Wrong" });
        }
    });
});

/* Unblock User 
============================================= */
router.post("/user_Unblock", (req, res) => {    
    UserHelpers.unblockUser(req.body.user_id).then(() => {
        try {
            req.session.adminMessage = "You Successfully Unblocked the User";
            res.redirect("blocked_users_view");
        } catch (err) {
            console.log(err)
        }
    });
});


/* Edit User Details
============================================= */
router.get("/user_edit/:id", async (req, res) => {  
    let user = await UserHelpers.getUserDetailsByUserIdForAdmin(req.params.id);
    let admin_details = {
        admin_id: req.session.admin._id,
        adminMessage: req.session.adminMessage,
    };
    res.render("admin/user-edit", { user, admin_status: true, admin_details });
    req.session.adminMessage = false;
});

/* Edit User Details
============================================= */
router.post("/user_edit", (req, res) => {
    user_id = req.body.user_id;
    console.log(user_id)
    UserHelpers.addUserProfileByAdmin(req.body, user_id).then((response) => {
        req.session.adminMessage = "User Details Updated Successfully";
        res.redirect("user_edit/"+user_id);
    });
});
/*  =============================================      Order Management        ==================================== */

/*Get All Orders By Products
============================================= */
router.get("/get_all_orders", verifyAdminLogin, noCache, async (req, res, next) => {
    let admin_details = {
        admin_id: req.session.admin._id,
        adminMessage: req.session.adminMessage,
    }
    await UserHelpers.getUserOrdersByproducts().then((orders) => {
        res.render("admin/view-all-orders", { admin_status: true, orders,admin_details });
    });
});

/*Get All Order Hitsory By Products
============================================= */
router.get("/get_all_order_history", verifyAdminLogin, noCache, async (req, res, next)=> {
    let admin_details = {
        admin_id: req.session.admin._id,
        adminMessage: req.session.adminMessage,
    }
   await UserHelpers.getUserOrderHistoryByproducts().then((orders) => {
        res.render("admin/view-all-orderhistory", { admin_status: true, orders,admin_details });
    });
});

/*Get All Orders By Coupon
============================================= */
router.get("/get_all_orders_by_coupon", verifyAdminLogin, noCache, async (req, res, next) => {
    let admin_details = {
        admin_id: req.session.admin._id,
        adminMessage: req.session.adminMessage,
    }
    await UserHelpers.getUserOrdersBycoupon().then((orders) => {
        res.render("admin/coupon-order", { admin_status: true, orders,admin_details});
    });
});



/*  =============================================      Sales Management        ==================================== */

/* View All Sales Report 
============================================= */
router.get("/get_all_sales_report", verifyAdminLogin, noCache, function (req, res, next) {
    ProductHelpers.getAllSalesReport().then((orders) => {
        let admin_details = {
            admin_id: req.session.admin._id,
            adminMessage: req.session.adminMessage,
        }
        res.render("admin/sales-report", { admin_status: true, orders,admin_details });
    });
});

/* Get Sales Report of Previous Week & Month
============================================= */
router.get("/sales_report_by_parameters/:value", verifyAdminLogin, noCache, async (req, res) => {
    let value       =   req.params.value;
    let orders          =   null
    let admin_details = {
        admin_id: req.session.admin._id,
        adminMessage: req.session.adminMessage,
    }
    if (value == 0) {
        orders = await ProductHelpers.getSalesReportByweek();
    } else {
        orders = await ProductHelpers.getSalesReportBymonth();
    }
    res.render("admin/sales-report", { admin_status: true, orders, value ,admin_details});
});

/* View Sales Report  By  Date
============================================= */
router.post("/sales_report_bydate", verifyAdminLogin, async (req, res) => {
    let orders = null;
    if (req.body.status == 1) {
        orders = await ProductHelpers.viewSalesReportByDate(req.body);
    } else {
        orders = await ProductHelpers.viewSalesReportByDateAndStatus(req.body);
    }
    let details = {
        start: req.body.start,
        end: req.body.end,
        status: req.body.status,
    };
    res.render("admin/sales-report", { admin_status: true, orders, details });
});

/* Get Sales Report  chart (Product & Amount) one month
============================================= */
router.get("/sales_report_chart", verifyAdminLogin, async (req, res) => {
    let products_amount = await ProductHelpers.viewSalesReportChartProductAndAmount();
    res.json(products_amount);
});

/* Get Sales Report (Vendor/Amount) one monh
============================================= */
router.get("/sales_report_chart_by_month", verifyAdminLogin, async (req, res) => {
    sales_month = await ProductHelpers.viewSalesReportChartVendorAndAmount();
    res.json(sales_month);
});

/*  =============================================      Coupon Management        ==================================== */

/* Get Coupon Details
============================================= */
router.get("/get_coupon", verifyAdminLogin, noCache, async (req, res) => {
    let admin_details = {
        admin_id: req.session.admin._id,
        adminMessage: req.session.adminMessage
    };
    coupon_details = await ProductHelpers.getCouponDetails();
    res.render("admin/coupon", { admin_status: true, coupon_details, admin_details });
    req.session.adminMessage = false;
});

/* Generate Coupon code
============================================= */
router.get("/generate_coupon_code", verifyAdminLogin, noCache, async (req, res) => {
    coupon_code = await ProductHelpers.generateCouponCode();
    res.json(coupon_code);
});

/* Check Coupon Available
============================================= */
router.get("/check_coupon_Available/:coupon_code", verifyAdminLogin, async (req, res) => {
    coupon_code = await ProductHelpers.checkCouponAvailable(req.params.coupon_code);
    res.json(coupon_code);
});

/* Add Coupon Details 
============================================= */
router.post("/coupon_add", (req, res) => {
    ProductHelpers.addCoupon(req.body).then((response) => {
        if (response.isCoupon) {
            req.session.adminMessage = "This coupon Exist. Please Add Another One";
        }
        res.redirect("get_coupon");
    });
});

/* Delete Coupon Details 
============================================= */
router.post("/coupon_delete", (req, res) => {
    let coupon_id = req.body.coupon_id;
    ProductHelpers.deleteCoupon(coupon_id).then((response) => {
        req.session.adminMessage = "Coupon Deleted Successfully";
        res.redirect("get_coupon");
    });
});

module.exports = router;
