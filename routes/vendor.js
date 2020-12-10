var express = require("express");
var router = express.Router();
var userHelpers = require("../helpers/user-helpers");
var productHelpers = require("../helpers/product-helpers");
const session = require("express-session");
var fs = require("fs");
const { request } = require("../app");
const { get_UserOrders_ByvendorId } = require("../helpers/user-helpers");

/* Verify Is Vendor Loggedin
============================================= */
const verifyVendorLogin = (req, res, next) => {
    if (req.session.vendorLoggedIn) {
        next();
    } else {
        res.redirect("/vendor");
    }
};

/* Login For  Vendor
============================================= */

router.get("/", function (req, res, next) {
    if (req.session.vendor) {
        res.redirect("vendor/ven_dashboard");
    } else {
        res.render("vendor/ven-login", { vendorLoginError: req.session.vendorLoggedIn });
        // res.render('vendor/ven-login',{message:req.flash('message')})
        req.session.vendorLoginError = false;
    }
});

router.post("/vendor_login", (req, res) => {
    userHelpers.doLogin_Vendor(req.body).then((response) => {
        if (response.loginStatus) {
            req.session.vendor = response.user;
            req.session.vendorLoggedIn = true;
            let name = req.session.vendor.ven_name;

            res.redirect("ven_dashboard");
        } else {
            //req.flash('success', 'Book successfully added');
            req.session.vendorLoggedIn = "Invalid Password or Username";
            res.redirect("/vendor");
        }
    });
});

router.get("/ven_dashboard", verifyVendorLogin, async (req, res) => {
    vendor_status = true;
    let product_count = await productHelpers.get_AllproductCount_ByVenId(req.session.vendor._id);

    if (product_count.count_status == false) {
        product_count = null;
    }
    let details = { name: req.session.vendor.ven_name, shop_name: req.session.vendor.ven_shop };

    res.render("vendor/vendor_dashboard", { vendor_status, details, product_count });
});

/* settings of vendor
============================================= */
router.get("/settings", verifyVendorLogin, (req, res) => {
    vendor_status = true;
    vendor_id = req.session.vendor._id;
    let details = { name: req.session.vendor.ven_name, shop_name: req.session.vendor.ven_shop };
    if (req.session.vendor_message) {
        // vendor.ven_id=vendor_id
        // vendor.ven_message=req.session.vendor_message
        res.render("vendor/settings", { vendor_status, vendor_id, vendor_message: req.session.vendor_message, details });
        req.session.vendor_message = false;
    } else {
        res.render("vendor/settings", { vendor_status, vendor_id, details });
    }

    // }
});

/* Change Password of a vendor
============================================= */
router.post("/change_password", (req, res) => {
    userHelpers.change_Password_Vendor(req.body).then((response) => {
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
    res.redirect("/vendor");
});

/*------------------------------               Product Management                  ------------------*/

/* Add  Product 
============================================= */

router.get("/product_add", verifyVendorLogin, (req, res) => {
    res.render("vendor/product-manage", { vendor_status: true });
});

router.post("/product_add", (req, res) => {
    let vendor_id = req.session.vendor._id;
    productHelpers.add_Product(req.body, vendor_id).then((response) => {
        let image = req.files.product_image;
        let id = response._id;

        image.mv("./public/images/product-images/" + id + ".jpg", (err, done) => {
            if (!err) {
                //res.json({add_success:true})
                req.session.product_message = "Product Added Successfully";
                res.redirect("product_manage");
            } else {
                console.log(err);
            }
        });
    });
});

/* View Products
============================================= */
router.get("/product_manage", verifyVendorLogin, async (req, res, next) => {
    vendor_status = true;
    let categories = await productHelpers.get_Allcategories();
    let vendor_id = req.session.vendor._id;
    productHelpers.get_ProductsByVendorId(vendor_id).then((products) => {
        if (req.session.product_message) {
            res.render("vendor/product-manage", {
                vendor_status,
                products,
                categories,
                message: req.session.product_message,
            });
            req.session.product_message = false;
        } else {
            let details = { name: req.session.vendor.ven_name, shop_name: req.session.vendor.ven_shop };

            vendor_status.name = req.session.vendor.ven_name;
            res.render("vendor/product-manage", { vendor_status, products, categories, details });
        }
        //res.render("vendor/product-manage", { vendor_status, products,message:req.flash('message') });
    });
});

/* Update  product 
============================================= */
router.post("/product_update", (req, res) => {
    let productId = req.body.product_id;
    productHelpers.update_Product(req.body, productId).then((response) => {
        if (!req.files) {
            imageFile = "";
        } else {
            let image = req.files.product_image;
            image.mv("./public/images/product-images/" + productId + ".jpg");
        }
        req.session.product_message = "Product Updated Successfully";
        res.redirect("product_manage");
    });
});

/* Delete  product 
============================================= */
router.post("/product_delete", async (req, res) => {
    let product_id = req.body.product_id;

    productHelpers.delete_Product(product_id).then((response) => {
        try {
            const DIR = "./public/images/product-images";
            fs.unlinkSync(DIR + "/" + product_id + ".jpg");
            req.session.product_message = "Product Deleted Successfully";
            res.redirect("product_manage");
            // return res.status(200).send('Successfully! Image has been Deleted');
        } catch (err) {
            res.render("/error", { title: "Sorry,Something Went Wrong" });
            // return res.status(400).send(err);
        }
    });
});

/*------------------------------               Order Management                  ------------------*/



/* Get customer order details
============================================= */
router.get("/customer_orders", verifyVendorLogin, async (req, res) => {
    let orders = await userHelpers.get_UserOrders_ByvendorId(req.session.vendor._id);
    let details = { name: req.session.vendor.ven_name, shop_name: req.session.vendor.ven_shop };
    res.render("vendor/customer-orders", { vendor_status: true, orders, details });
});



/* View Order Products By Vendor Id
============================================= */
router.get("/view_order_products_byvendor/:id", verifyVendorLogin, async (req, res) => {
    order_id = req.params.id;
    let orders = await userHelpers.view_Order_Products_Byvendor(req.session.vendor._id, order_id);
    let name = req.session.vendor.ven_name;
    res.render("vendor/ven-view-order-products", { vendor_status: true, orders, name });
});



/*Change Order Status By Vendor
============================================= */
router.post("/change_orderstatus_byvendor", (req, res) => {
    req.body.ven_id = req.session.vendor._id;
    userHelpers.change_Orderstatus_Byvendor(req.body).then(() => {
        res.json({ status: true });
    });
});

module.exports = router;
