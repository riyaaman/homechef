var express = require("express");
var router = express.Router();
var userHelpers = require("../helpers/user-helpers");
var productHelpers = require("../helpers/product-helpers");
const session = require("express-session");
var fs = require("fs");
const { request } = require("../app");
const { get_UserOrders_ByvendorId } = require("../helpers/user-helpers");
const { order } = require("paypal-rest-sdk");

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

router.get("/product_add", verifyVendorLogin, async (req, res) => {
    let details = { name: req.session.vendor.ven_name, shop_name: req.session.vendor.ven_shop };
    let categories = await productHelpers.get_Allcategories();
    res.render("vendor/product-add", { vendor_status: true, categories, details });
});

router.post("/product_add", (req, res) => {
    let vendor_id = req.session.vendor._id;
    productHelpers.add_Product(req.body, vendor_id).then((response) => {
        //let image = req.files.product_image;
        //let id = response._id;

        // image.mv("./public/images/product-images/" + id + ".jpg", (err, done) => {
        //     if (!err) {
        //         //res.json({add_success:true})
        //         req.session.product_message = "Product Added Successfully";
        //         res.redirect("product_manage");
        //     } else {
        //         console.log(err);
        //     }
        // });
        let id = response._id;
        var img_url = req.body.img_url;

        if (img_url == 0) {
            let image = req.files.product_image;
            image.mv("./public/images/product-images/" + id + ".jpg", (err, done) => {
                if (!err) {
                    req.session.product_message = "Well Done ! You Successfully Added the Product";
                    res.redirect("product_manage");
                } else {
                    console.log(err);
                }
            });
        } else {
            var base64Data = img_url.replace(/^data:image\/png;base64,/, "");
            fs.writeFile("./public/images/product-images/" + id + ".jpg", base64Data, "base64", (err, done) => {
                if (!err) {
                    req.session.product_message = "Well Done ! You Successfully Added the Product";
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
            // const DIR = "./public/images/product-images";
            // fs.unlinkSync(DIR + "/" + product_id + ".jpg");
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
    let details = { name: req.session.vendor.ven_name, shop_name: req.session.vendor.ven_shop };
    res.render("vendor/ven-view-order-products", { vendor_status: true, orders, details });
});

/*Change Order Status By Vendor
============================================= */
router.post("/change_orderstatus_byvendor", (req, res) => {
    req.body.ven_id = req.session.vendor._id;
    userHelpers.change_Orderstatus_Byvendor(req.body).then(() => {
        res.json({ status: true });
    });
});

/*------------------------------               Sales Management                  ------------------*/

/* View Sales Report By Vendor Id
============================================= */
router.get("/sales_report", verifyVendorLogin, async (req, res) => {
    let orders = await productHelpers.view_SalesReport_Byvendor(req.session.vendor._id);
    let details = { name: req.session.vendor.ven_name, shop_name: req.session.vendor.ven_shop };
    res.render("vendor/sales-report", { vendor_status: true, orders, details });
});

/* View Sales Report  By Vendor Id & Date
============================================= */
router.post("/sales_report_bydate", verifyVendorLogin, async (req, res) => {
    //console.log(req.body)
   // var start_date = req.body.start;
   
    // var date = new Date(start_date);

    // console.log(
    //     (date.getMonth() > 8 ? date.getMonth() + 1 : "0" + (date.getMonth() + 1)) +
    //         "-" +
    //         (date.getDate() > 9 ? date.getDate() : "0" + date.getDate()) +
    //         "-" +
    //         date.getFullYear()
    //     );
        // console.log(
        //        date.getFullYear()       +
        //         "-" +
        //         (date.getMonth() > 8 ? date.getMonth() + 1 : "0" + (date.getMonth() + 1))  +
        //         "-" +               
        //         (date.getDate() > 9 ? date.getDate() : "0" + date.getDate())
        //     );

    let orders = await productHelpers.view_SalesReport_ByDate_Id(req.session.vendor._id, req.body);
    let details = {
        name: req.session.vendor.ven_name,
        shop_name: req.session.vendor.ven_shop,
        start: req.body.start,
        end: req.body.end,
      status:req.body.status
    };
    res.render("vendor/sales-report", { vendor_status: true, orders, details });
});


router.get("/report",  async (req, res) => {
    // let details = { name: req.session.vendor.ven_name, shop_name: req.session.vendor.ven_shop };
    // let categories = await productHelpers.get_Allcategories();
    // res.render("vendor/sales-report-demo", { vendor_status: true, categories, details });
    let orders = await productHelpers.view_SalesReport_Byvendor(req.session.vendor._id);
    let details = { name: req.session.vendor.ven_name, shop_name: req.session.vendor.ven_shop };
    res.render("vendor/sales-report_org", { vendor_status: true, orders, details });
});


/*------------------------------               Order  History Management                  ------------------*/


/* Get customer order  history details
============================================= */
router.get("/customer_order_history", verifyVendorLogin, async (req, res) => {
    
    let orders = await productHelpers.get_UserOrder_history_ByvendorId(req.session.vendor._id);
    let details = { name: req.session.vendor.ven_name, shop_name: req.session.vendor.ven_shop };
    res.render("vendor/customer-order-history", { vendor_status: true, orders, details });
});



/* Get Sales Report donut chart
============================================= */
router.get("/sales_report_chart", verifyVendorLogin, async (req, res) => {
    
    products_amount = await ( productHelpers.view_SalesReport_Chart_Amount_Byvendor(req.session.vendor._id))
    res.json(products_amount);
    products_amount1 = await ( productHelpers.view_SalesReport_Chart_Month_Byvendor(req.session.vendor._id))
  
   // products = await ( productHelpers.view_SalesReport_chart_Byvendor(req.session.vendor._id))
   // data ={product_amount:products_amount,products:products}
   // res.json(products);
});


/* Get Sales Report by Vendor Id , Previous Week & Month
============================================= */
router.get("/sales_report_by_parameters/:value", verifyVendorLogin, async (req, res) => {
    var value = req.params.value;
    console.log(value)
    orders = null
    if(value == 0){       
        orders = await productHelpers.get_SalesReport_ByvendorId_Week(req.session.vendor._id);
    }
    else{      
        orders = await productHelpers.get_SalesReport_ByvendorId_Month(req.session.vendor._id);
    }
    let details = {
        name: req.session.vendor.ven_name,
        shop_name: req.session.vendor.ven_shop       
    };
   
    // req.session.value= value
    // req.session.orders = orders

 // res.json({success:true,value:value})
    //es.redirect("../customer_order_history")
   res.render("vendor/sales-report", { vendor_status: true, orders, details,value });
});


/* Get Sales Report by Vendor Id , Status
============================================= */
router.get("/sales_report_by_status/:value", verifyVendorLogin, async (req, res) => {
    var value = req.params.value;
    console.log(value)
    orders = null
     
    orders = await productHelpers.get_SalesReport_ByvendorId_Status(req.session.vendor._id);
  
    let details = {
        name: req.session.vendor.ven_name,
        shop_name: req.session.vendor.ven_shop       
    };
   
   res.render("vendor/sales-report", { vendor_status: true, orders, details,value });
});




/* Get Sales Report by Vendor Id , Previous Week & Month
============================================= */
// router.get("/report_success", verifyVendorLogin, async (req, res) => {
//     let details = {
//         name: req.session.vendor.ven_name,
//         shop_name: req.session.vendor.ven_shop       
//     };
//     orders  =   req.session.orders
//     value   =  req.session.value
//     //console.log(value)
//     res.render("vendor/sales-report", { vendor_status: true, orders, details,value });
//     req.session.orders = false
//     req.session.value   = false
// })









router.get("/demo_chart",  async (req, res) => {
    vendorId ="5fd9944a3080791d6c7f6b58"
    products = await ( productHelpers.get_ProductsName_ByVendorId(vendorId))
        console.log(products)
     
        res.render("vendor/demo-chart1",{products})

   
})
router.get("/demo_chart1",  async (req, res) => {
    console.log("jiiii")
     vendorId ="5fd9944a3080791d6c7f6b58"
     products = await ( productHelpers.get_ProductsName_ByVendorId(vendorId))
        // console.log(products)
         products1 = await ( productHelpers.view_SalesReport_chart_Byvendor(vendorId))
         console.log(products1)
    data = [  
        {  
           "playerid":"1",
           "score":"10"
        },
        {  
           "playerid":"2",
           "score":"40"
        },
        {  
           "playerid":"3",
           "score":"20"
        },
        {  
           "playerid":"4",
           "score":"9"
        },
        {  
           "playerid":"5",
           "score":"20"
        }
     ]
     res.json(products1);
        // res.render("vendor/demo-chart1",{data})

   
})




module.exports = router;
