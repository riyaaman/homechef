var express = require("express");
var router = express.Router();
var UserHelpers = require("../helpers/user-helpers");
var ProductHelpers = require("../helpers/product-helpers");
const session = require("express-session");
var fs = require("fs");


/* Verify Is Vendor Loggedin
============================================= */
const verifyVendorLogin = (req, res, next) => {
    if (req.session.vendorLoggedIn) {
        req.details = { name: req.session.vendor.ven_name,
                        shop_name: req.session.vendor.ven_shop,
                        vendor_message:req.session.vendor_message }
        next();
    } else {
        res.redirect("/vendor");
    }
};

// For Cache Checking
function noCache(req, res, next) {
    res.header("Cache-Control", "private, no-cache, no-store, must-revalidate");
    res.header("Expires", "-1");
    res.header("Pragma", "no-cache");
    next();
}

/* Login For  Vendor
============================================= */
router.get("/", function (req, res, next) {
    if (req.session.vendor) {
        res.redirect("vendor/ven_dashboard");
    } else {
        res.render("vendor/ven-login", { vendorLoginError: req.session.vendorLoggedIn })
        req.session.vendorLoginError = false;
    }
});

router.post("/vendor_login", (req, res) => {
    UserHelpers.doLoginVendor(req.body).then((response) => {
        if (response.loginStatus) {
            req.session.vendor          =   response.user;
            req.session.vendorLoggedIn  =   true;
            req.session.vendor_message  =   false;
            res.redirect("ven_dashboard");
        } else {
            req.session.vendorLoggedIn = "Invalid Password or Username";
            res.redirect("/vendor");
        }
    });
});

router.get("/ven_dashboard", verifyVendorLogin,noCache,async (req, res) => {
    let details         =   req.details 
    let count           =   await ProductHelpers.getCountByvendor(req.session.vendor._id) 
    let product_count   =   await ProductHelpers.getProductCountByvendor(req.session.vendor._id)    
    res.render("vendor/vendor_dashboard", { vendor_status: true, details, count,product_count })
});

/* settings of vendor
============================================= */
router.get("/settings", verifyVendorLogin,noCache,(req, res) => {
    let vendor_status   =   true;
    let vendor_id       =   req.session.vendor._id; 
    let details         =   req.details 
    res.render("vendor/settings", { vendor_status,vendor_id,details });
    req.session.vendor_message = false
});

/* Change Password of a vendor
============================================= */
router.post("/change_password", (req, res) => {
    UserHelpers.changePasswordVendor(req.body).then((response) => {
        if (response.resetStatus == true) {
            req.session.vendor_message = "Password Updated Successfully";
        } else if (response.resetStatus == false) {
            req.session.vendor_message = "Old Password incorrect";
        } else {
            req.session.vendor_message = "User Not Exist";
        }
        res.redirect("settings");
    });
});

router.get("/logout", (req, res) => {
    req.session.vendor = null;
    req.session.vendorLoggedIn = false;
    req.session.vendor_message = false;
    res.redirect("/vendor");
});


/*  =============================================      Product Management        ================================ */



/* Add  Product 
============================================= */
router.get("/product_add", verifyVendorLogin,noCache,async (req, res) => {
    let details         =   req.details
    let categories  =   await ProductHelpers.getAllcategories();
    res.render("vendor/product-add", { vendor_status:true,categories,details });
    req.session.vendor_message = false;
});

router.post("/product_add", (req, res) => {
    req.body.vendor_id = req.session.vendor._id;
    ProductHelpers.addProduct(req.body).then((response) => {       
        let id      =   response._id
        var img_url =   req.body.img_url
        if (img_url == 0) {
            let image = req.files.product_image;
            image.mv("./public/images/product-images/" + id + ".jpg", (err, done) => {
                if (!err) {
                    req.session.vendor_message = "Well Done ! You Successfully Added the Product";
                    res.redirect("product_manage");
                } else {
                    console.log(err);
                }
            });
        } else {
            var base64Data = img_url.replace(/^data:image\/png;base64,/, "");
            fs.writeFile("./public/images/product-images/" + id + ".jpg", base64Data, "base64", (err, done) => {
                if (!err) {
                    req.session.vendor_message = "Well Done ! You Successfully Added the Product";
                    res.redirect("product_manage");
                } else {
                    console.log(err);
                }
            });
        }
    });
});

/* View Products
============================================= */
router.get("/product_manage", verifyVendorLogin, async (req, res, next) => {
    vendor_status   =   true
    let categories  =   await ProductHelpers.getAllcategories()
    let vendor_id   =   req.session.vendor._id;
    ProductHelpers.getProductsByVendorId(vendor_id).then((products) => {
        let details         =   req.details
        res.render("vendor/product-manage", { vendor_status, products, categories, details })
        req.session.vendor_message = false;      
    });
});

/* Edit  product 
============================================= */
router.get("/product_edit/:product_id", verifyVendorLogin, async (req, res) => {   
    let details         =   req.details
    let categories      =   await ProductHelpers.getAllcategories()
    let product_details =   await ProductHelpers.getProductDetailsByProductId(req.params.product_id) 
    res.render("vendor/product-edit", { vendor_status: true, categories, details, product_details })
    req.session.vendor_message = false
});

/* Update  product 
============================================= */
router.post("/product_update", (req, res) => {   
    let productId = req.body.product_id;  
    ProductHelpers.updateProduct(req.body,productId).then((response) => {
        if (!req.files) {
            imageFile = "";
        } else {
            let image = req.files.product_image_update;
            image.mv("./public/images/product-images/" + productId + ".jpg");
        }
        req.session.vendor_message = "Product Details Updated Successfully";
        res.redirect("product_edit/"+productId);
    });
});

/* Delete  product 
============================================= */
router.post("/product_delete", async (req, res) => {
    let product_id = req.body.product_id
    ProductHelpers.deleteProduct(product_id).then((response) => {
        try {
            // const DIR = "./public/images/product-images";
            // fs.unlinkSync(DIR + "/" + product_id + ".jpg");
            req.session.vendor_message = "Product Deleted Successfully";
            res.redirect("product_manage")
        } catch (err) {
            console.log(err)         
        }
    });
});




/*  =============================================      Order Management        ================================ */



/* Get customer order details ByVendor Id
============================================= */
router.get("/customer_orders", verifyVendorLogin, async (req, res) => {
    let orders      =   await UserHelpers.getUserOrdersByVendorId(req.session.vendor._id);  
    let details         =   req.details;
    res.render("vendor/customer-orders", { vendor_status: true, orders, details });
});

/* View Order Products By Vendor Id
============================================= */
router.get("/view_order_products_byvendor/:id", verifyVendorLogin, async (req, res) => {
    let orderId             =   req.params.id;
    let orders              =   await UserHelpers.viewOrderProductsByvendorAndOrderId(req.session.vendor._id,orderId)
    let delivery_details    =   orders.slice(0, 1)   
    let details             =   { name: req.session.vendor.ven_name, 
                                  shop_name: req.session.vendor.ven_shop,
                                order_id:orderId };
    res.render("vendor/ven-view-order-products", { vendor_status: true, orders, details, delivery_details });
});

/*Change Order Status By Vendor
============================================= */
router.post("/change_orderstatus_byvendor", (req, res) => {
    req.body.ven_id = req.session.vendor._id;
    UserHelpers.changeOrderstatusByvendor(req.body).then(() => {
        res.json({ status: true });
    });
});


/*  =============================================      Sales Management        ================================ */


/* View Sales Report By Vendor Id
============================================= */
router.get("/sales_report", verifyVendorLogin, async (req, res) => {
    let orders  =   await ProductHelpers.viewSalesReportByvendor(req.session.vendor._id);
    let details         =   req.details;
    res.render("vendor/sales-report", { vendor_status: true, orders, details });
});

/* View Sales Report  By Vendor Id & Date
============================================= */
router.post("/sales_report_bydate", verifyVendorLogin, async (req, res) => {
    let orders = null;
    if (req.body.status == 1) {
        orders = await ProductHelpers. viewSalesReportByDateAndId(req.session.vendor._id, req.body);
    } else {
        orders = await ProductHelpers. viewSalesReportByDateIdAndstatus(req.session.vendor._id, req.body);
    }
    let details = {
        name: req.session.vendor.ven_name,
        shop_name: req.session.vendor.ven_shop,
        start: req.body.start,
        end: req.body.end,
        status: req.body.status,
    };
    res.render("vendor/sales-report", { vendor_status: true, orders, details });
});


/* Get Sales Report by Vendor Id , Previous Week & Month
============================================= */
router.get("/sales_report_by_parameters/:value", verifyVendorLogin, async (req, res) => {
    var value = req.params.value;    
    orders = null;
    if (value == 0) {
        orders = await ProductHelpers.getSalesReportByvendorIdAndWeek(req.session.vendor._id);
    } else {
        orders = await ProductHelpers.getSalesReportByvendorIdAndMonth(req.session.vendor._id);
    }
    
    let details         =   req.details;
    res.render("vendor/sales-report", { vendor_status: true, orders, details, value });
});



/*  =============================================     Order  History Management     ================================ */



/* Get customer order  history details
============================================= */
router.get("/customer_order_history", verifyVendorLogin, async (req, res) => {
    let orders = await ProductHelpers.getUserOrderhistoryByvendorId(req.session.vendor._id);
    let details         =   req.details;
    res.render("vendor/customer-order-history", { vendor_status: true, orders, details });
});

/* Get Sales Report donut chart
============================================= */
router.get("/sales_report_chart", verifyVendorLogin, async (req, res) => {
    products_amount = await ProductHelpers.viewSalesReportChartAmountByvendor(req.session.vendor._id);
    res.json(products_amount);
});

/* Get Sales Report pie chart(sales this month & Previous month)
============================================= */
router.get("/sales_report_chart_by_month", verifyVendorLogin, async (req, res) => {
    sales_month = await ProductHelpers.viewSalesReportChartMonthByvendor(req.session.vendor._id);
    res.json(sales_month)  
});




module.exports = router;
