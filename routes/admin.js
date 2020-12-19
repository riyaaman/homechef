var express = require("express");
var router = express.Router();
var userHelpers = require("../helpers/user-helpers");
var productHelpers = require("../helpers/product-helpers");
const session = require("express-session");
var fs = require("fs");
//  const { response }    =   require('../app');

/* Verify Is Admin Loggedin
============================================= */
const verifyAdminLogin = (req, res, next) => {
    if (req.session.adminLoggedIn) {     
   
        next();
    } else {
        res.redirect("/admin");
    }
};

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
    userHelpers.doLogin(req.body).then((response) => {
        if (response.loginStatus) {
            req.session.admin = response.user;
            req.session.adminLoggedIn = true;
            req.session.admin_message = false;
            res.redirect("dashboard");
        } else {
            req.session.adminLoginError = "Invalid Password or Username";
            res.redirect("/admin");
        }
    });
});

/* Admin Login to Dashboard
============================================= */
router.get("/dashboard", verifyAdminLogin, (req, res) => {
  
    res.render("admin/dashboard", { admin_status: true });
});

/* Admin Logout
============================================= */
router.get("/logout", (req, res) => {
    req.session.admin = null;
    req.session.adminLoggedIn = false;   
    req.session.vendor_message = false
    req.session.admin_message = false;
    res.redirect("/admin");
});

/*------------------------------------------------- Vendor Management--------------------------------------------------*/

/* SignUp For  Vendor
============================================= */

router.get("/vendor_add", verifyAdminLogin, (req, res) => {
    if (req.session.vendor_message) {
        res.render("admin/vendor-add", { admin_status: true, vendor_message: req.session.vendor_message });
        req.session.vendor_message = false;
    } else {
        res.render("admin/vendor-add", { admin_status: true });
    }
});

router.post("/vendor_add", (req, res) => {
    userHelpers.doSignup_Vendor(req.body).then((response) => {
        if (response.signup_status == false) {
            req.session.vendor_message = " Email address Already Registered. Please Select Another One";
            res.redirect("vendor_add");
        } else {

            let id = response._id;
            var img_url = req.body.img_url
           
            if(img_url==0){
                 let image = req.files.ven_image;             
                image.mv("./public/images/vendor-images/" + id + ".jpg", (err, done) => {
                    if (!err) {
                        req.session.vendor_message = "Well Done ! You Successfully Added the Vendor";
                        res.redirect("vendor_add");
                    } else {
                        console.log(err);
                    }
                });

            }
            else{
                var base64Data  =   img_url.replace(/^data:image\/png;base64,/, "");             
                fs.writeFile("./public/images/vendor-images/" + id + ".jpg", base64Data, 'base64', (err, done) => {
                    if (!err) {
                        req.session.vendor_message = "Well Done ! You Successfully Added the Vendor";
                        res.redirect("vendor_add");
                    } else {
                        console.log(err);
                    }
                });

            }

           
           
           
        }
    });
});

/* Check  Email Exist or not
============================================= */
router.post("/vendor_email_check", (req, res) => {
    let ven_email = req.body.ven_email;
    userHelpers.checkemail_exist(ven_email).then((response) => {
        if (response.signup_status == true) {
            res.json({ add_failed: "true" });
        } else {
            res.json({ add_failed: "false" });
        }
    });
});

/* View Vendor Details
============================================= */
router.get("/vendor_view", verifyAdminLogin, function (req, res, next) {
    userHelpers.get_AllVendors().then((vendors) => {
        if (req.session.vendor_message) {
            vendors.vendor_message = req.session.vendor_message;
            res.render("admin/vendor-view", { admin_status: true, vendors });
            req.session.vendor_message = false;
        } else {
            res.render("admin/vendor-view", { admin_status: true, vendors });
            req.session.vendor_message = false;
        }
    });
});

/* Delete Vendor Details
============================================= */
router.get("/vendor_delete/:id", (req, res) => {
    let ven_id = req.params.id;

    userHelpers.delete_Vendor(ven_id).then((response) => {
        try {
            const DIR = "./public/images/vendor-images";
            fs.unlinkSync(DIR + "/" + ven_id + ".jpg");
            req.session.vendor_message = "You Successfully Deleted the Vendor";
            res.redirect("../vendor_view");
            // return res.status(200).send('Successfully! Image has been Deleted');
        } catch (err) {
            res.render("/error", { title: "Sorry,Something Went Wrong" });
            // return res.status(400).send(err);
            // process.exit();
        }
    });
});

/* Edit Vendor Details
============================================= */

router.get("/vendor_edit/:id", async (req, res) => {
    let vendor = await userHelpers.get_VendorDetails(req.params.id);
    admin_status = true;

    if (req.session.vendor_message) {
        vendor.vendor_message = req.session.vendor_message;
        res.render("admin/vendor-edit", { vendor, admin_status });
        req.session.vendor_message = false;
    } else {
        res.render("admin/vendor-edit", { vendor, admin_status });
        req.session.vendor_message = false;
    }
});

router.post("/vendor_edit/:id", (req, res) => {
    let id = req.params.id;

    userHelpers.update_Vendor(req.body, req.params.id).then((response) => {
        if (response.update_status == true) {
            req.session.vendor_message = " Vendor Details Updated Successfully";
            res.redirect("../vendor_edit/" + id);

            if (req.files.ven_image) {
                let image = req.files.ven_image;
                image.mv("./public/images/vendor-images/" + req.params.id + ".jpg");
            }
        }
    });
});

/* Change Email(username) of a vendor
============================================= */
router.post("/vendor_email_update", verifyAdminLogin, (req, res) => {
    userHelpers.change_Email_Vendor(req.body).then((response) => {
        console.log(req.body);
        vendor_id = req.body.ven_id;

        if (response.update_status == false) {
            req.session.vendor_message = "Email Already Exist";
        } else {
            req.session.vendor_message = "Email Updated Successfully";
        }

        res.redirect("vendor_edit/" + vendor_id);
    });
});

/*-------------------------------------------------Category Management--------------------------------------------------*/

/* Add  Category 
============================================= */

router.get("/category_add", verifyAdminLogin, (req, res) => {
   
    admin_status = true;
    res.render("admin/category-add", { admin_status });
  
});

router.post("/category_add", (req, res) => {
    productHelpers.add_Category(req.body).then((response) => {
        res.redirect("category_manage");
    });
});

/* Get  Category List
============================================= */
router.get("/category_manage", verifyAdminLogin, function (req, res, next) {
   
   
    productHelpers.get_Allcategories().then((category) => {
        if (req.session.iscategoryDeleted) {
            res.render("admin/category-manage", {
                admin_status,
                category,
                iscategoryDeleted: req.session.iscategoryDeleted,
            });
            req.session.iscategoryDeleted = false;
        } else {
            res.render("admin/category-manage", { admin_status:true, category });
            req.session.iscategoryDeleted = false;
        }
    });
});

/* Update  Category 
============================================= */
router.post("/category_update", (req, res) => {
    let catId = req.body.cat_id;

    productHelpers.update_Category(req.body, catId).then((response) => {
        res.redirect("category_manage");
    });
});

/* Delete  Category 
============================================= */
router.post("/category_delete", (req, res) => {
    let cat_id = req.body.cat_id;

    productHelpers.delete_Category(cat_id).then((response) => {
        res.redirect("category_manage");
    });
});


/*-------------------------------------------------User Management--------------------------------------------------*/

/* View User Details
============================================= */
router.get("/users_view", verifyAdminLogin, function (req, res, next) {
    userHelpers.get_AllUsers().then((users) => {     
            admin_message = req.session.admin_message  
            res.render("admin/users-view", { admin_status: true, users ,admin_message});  
            req.session.admin_message  =    false        
        })
   
});

/* View Blocked User Details
============================================= */
router.get("/blocked_users_view", verifyAdminLogin, function (req, res, next) {

    userHelpers.get_AllBlocked_Users().then((users) => {     
            admin_message = req.session.admin_message  
            res.render("admin/users-blocked", { admin_status: true, users ,admin_message});  
            req.session.admin_message  =    false        
        })
   
});




/* Add User Details
============================================= */
router.get("/user_add", verifyAdminLogin, function (req, res, next) {        
    admin_message = req.session.admin_message
    res.render("admin/user-add", { admin_status: true,admin_message}); 
    req.session.admin_message = false;

});


router.post("/user_add", (req, res) => {

    let user_details = req.body;
    first_name = user_details.first_name;

    userHelpers.doSignup_User(req.body).then((response) => {
       
        if (response.signup_status == false) {
            req.session.admin_message = " Email or Phone Number Already Registered. Please Select Another One";           
        } 
        else{
            req.session.admin_message = " User Added Successfully";  
        }
        res.redirect("user_add");
    });
});


/* Delete User Details
============================================= */
router.post("/user_delete", (req, res) => {
    
    let user_id = req.body.user_id;
    userHelpers.delete_User(user_id).then((response) => {
        try {           
            req.session.admin_message = "You Successfully Deleted the User";
            res.redirect("user_view");          
        } catch (err) {
            res.render("/error", { title: "Sorry,Something Went Wrong" });
        
        }
    });
});

/* Block User Details
============================================= */
router.post("/user_block", (req, res) => {
    
    let user_id = req.body.user_id;
    userHelpers.block_User(user_id).then((response) => {
        try {           
            req.session.admin_message = "You Successfully Blocked the User";
            res.redirect("users_view");          
        } catch (err) {
            res.render("/error", { title: "Sorry,Something Went Wrong" });
        
        }
    });
});

/* Un Block User 
============================================= */
router.post("/user_Unblock", (req, res) => {
    
    let user_id = req.body.user_id;
    userHelpers.Unblock_User(user_id).then((response) => {
        try {           
            req.session.admin_message = "You Successfully Unblocked the User";
            res.redirect("blocked_users_view");          
        } catch (err) {
            res.render("/error", { title: "Sorry,Something Went Wrong" });
        
        }
    });
});




/*------------------------------------------------- Order Management--------------------------------------------------*/


/*Get All Orders By Products
============================================= */
router.get("/get_all_orders", verifyAdminLogin, async (req, res, next)=> {  
  
    await userHelpers.get_UserOrders_Byproducts().then((orders) => {  
     
        res.render("admin/view-all-orders", { admin_status: true, orders });  
    })

});


/*Get All Order Hitsory By Products
============================================= */
router.get("/get_all_order_history", verifyAdminLogin, function (req, res, next) {  
    userHelpers.get_UserOrderHistory_Byproducts().then((orders) => {  
        res.render("admin/view-all-orderhistory", { admin_status: true, orders });  
    })

});

/*------------------------------               Sales Management                  ------------------*/



/* View All Sales Report 
============================================= */
router.get("/get_all_sales_report", verifyAdminLogin, function (req, res, next) {  
    productHelpers.get_All_Sales_Report().then((orders) => {  
        res.render("admin/sales-report", { admin_status: true, orders });  
    })

});


/* Get Sales Report of Previous Week & Month
============================================= */
router.get("/sales_report_by_parameters/:value", verifyAdminLogin, async (req, res) => {
    var value = req.params.value;
    orders = null
    if(value == 0){       
        orders = await productHelpers.get_SalesReport_Byweek();
    }
    else{      
        orders = await productHelpers.get_SalesReport_Bymonth();
    }
   
    res.render("admin/sales-report", { admin_status: true, orders,value });  
});


/* View Sales Report  By  Date
============================================= */
router.post("/sales_report_bydate", verifyAdminLogin, async (req, res) => {
    let orders = null
       if(req.body.status == 1){
            orders = await productHelpers.view_SalesReport_ByDate(req.body);
       }
       else{
            orders = await productHelpers.view_SalesReport_ByDate_Status(req.body);
       }      
       let details = {  
        start: req.body.start,
        end: req.body.end,
       status:req.body.status
    };
       res.render("admin/sales-report", { admin_status:true, orders,details});
});





/* Get Sales Report  chart (Product & Amount)
============================================= */
router.get("/sales_report_chart", verifyAdminLogin, async (req, res) => {    
    products_amount = await ( productHelpers.view_SalesReport_Chart_Product_Amount())
    res.json(products_amount);
  
});

   


module.exports = router;
