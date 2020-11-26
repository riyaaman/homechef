var express           =   require("express");
var router            =   express.Router();
var userHelpers       =   require("../helpers/user-helpers");
var productHelpers    =   require("../helpers/product-helpers");
const session         =   require("express-session");
var fs                =   require("fs");
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
    if (req.session.user) {
        res.redirect("admin/dashboard");
    } else {
        res.render("admin/login", { adminLoginError: req.session.adminLoginError });
        req.session.adminLoginError = false;
    }
});

router.post("/admin_login", (req, res) => {
    userHelpers.doLogin(req.body).then((response) => {
        if (response.loginStatus) {
            req.session.user  =   response.user;
            req.session.adminLoggedIn = true;
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
    if (req.session.adminLoggedIn) admin_status = true;
    res.render("admin/dashboard", { admin_status });
});

/* Admin Logout
============================================= */
router.get("/logout", (req, res) => {
    req.session.user = null;
    req.session.adminLoggedIn = false;
    res.redirect("/admin");
});

/*------------------------------------------------- Vendor Management--------------------------------------------------*/

/* SignUp For  Vendor
============================================= */

router.get("/vendor_add", verifyAdminLogin, (req, res) => {
    if (req.session.adminLoggedIn) admin_status = true;

    if (req.session.vendorSignupSuccess) {
        res.render("admin/vendor-add", { admin_status, vendorSignupSuccess: req.session.vendorSignupSuccess });
        req.session.vendorSignupSuccess = false;
    } else {
        res.render("admin/vendor-add", { admin_status });
    }
});

router.post("/vendor_add", (req, res) => {
    userHelpers.doSignup_Vendor(req.body).then((response) => {
        let image   =   req.files.ven_image;
        let id      =   response._id;

        image.mv("./public/images/vendor-images/" + id + ".jpg", (err, done) => {
            if (!err) {
                req.session.vendorSignupSuccess = "You Successfully Added the Vendor";
                res.redirect("vendor_add");
            } else {
                console.log(err);
            }
        });
    });
});


/* Check  Email Exist or not
============================================= */
router.post("/vendor_email_check", (req, res) => {
    let ven_email   =   req.body.ven_email;
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
    if (req.session.adminLoggedIn) {
        admin_status = true;
    }

    userHelpers.get_AllVendors().then((vendors) => {
        if (req.session.isVendorDeleted) {
            res.render("admin/vendor-view", { admin_status, vendors, isVendorDeleted: req.session.isVendorDeleted });
            req.session.isVendorDeleted = false;
        } else {
            res.render("admin/vendor-view", { admin_status, vendors });
            req.session.isVendorDeleted = false;
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
            req.session.isVendorDeleted = "You Successfully Deleted the Vendor";
            res.redirect("../vendor_view");
            // return res.status(200).send('Successfully! Image has been Deleted');
        } catch (err) {
            res.render("/error", { title: "Sorry,Something Went Wrong" });
            // return res.status(400).send(err);
        }
    });
});

// router.get('/delete_vendor/:id', (req,res)=> {
//   let venId = req.params.id

//   userHelpers.delete_Vendor(venId).then((response)=>{

//     res.redirect('../vendor_view')
//   }).catch(err => {
//         console.log('Error Occured. Exiting now...', err);
//         // process.exit();
//     });

// });

/* Edit Vendor Details
============================================= */

router.get("/vendor_edit/:id", async (req, res) => {
    let vendor = await userHelpers.get_VendorDetails(req.params.id);

    if (req.session.adminLoggedIn) admin_status = true;

    if (req.session.isVendorUpdate) vendor.isVender_update = "Vendor Details Updated Successfully";

    res.render("admin/vendor-edit", { vendor, admin_status });
    req.session.isVendorUpdate = false;
});

router.post("/vendor_edit/:id", (req, res) => {
    let id = req.params.id;
    userHelpers.update_Vendor(req.body, req.params.id).then((response) => {
        req.session.isVendorUpdate = true;
        res.redirect("../vendor_edit/" + id);

        if (req.files.ven_image) {
            let image = req.files.ven_image;
            image.mv("./public/images/vendor-images/" + req.params.id + ".jpg");
        }
    });
});

/*-------------------------------------------------Category Management--------------------------------------------------*/

/* Add  Category 
============================================= */

router.get("/category_add", verifyAdminLogin, (req, res) => {
  if (req.session.adminLoggedIn) admin_status = true;

  if (req.session.isCategoryAdded) {
      res.render("admin/category-add", { admin_status, isCategoryAdded: req.session.isCategoryAdded });
      req.session.vendorSignupSuccess = false;
  } else {
      res.render("admin/category-add", { admin_status });
  }
});

router.post("/category_add", (req, res) => {
 
  productHelpers.add_Category(req.body).then((response) => {
    res.redirect("category_manage");
     
  });
});


router.get("/category_manage1", verifyAdminLogin, (req, res) => {
  if (req.session.adminLoggedIn) admin_status = true;
  res.render("admin/category-manage",{admin_status})
});

router.get("/category_manage", verifyAdminLogin, function (req, res, next) {
  if (req.session.adminLoggedIn) {
      admin_status = true;
  }

  productHelpers.get_Allcategories().then((category) => {
    // console.log("ki:"+category)
      if (req.session.iscategoryDeleted) {
          res.render("admin/category-manage", { admin_status, category, iscategoryDeleted: req.session.iscategoryDeleted });
          req.session.iscategoryDeleted = false;
      } else {
          res.render("admin/category-manage", { admin_status, category });
          req.session.iscategoryDeleted = false;
      }
  });
});
router.post("/category_update", (req, res) => {
 
  let catId   =   req.body.cat_id;
  
  productHelpers.update_Category(req.body,catId).then((response) => {
    res.redirect("category_manage")
      
  });
});
router.post("/category_delete", (req, res) => {
 
  let cat_id = req.body.cat_id;
  
  productHelpers.delete_Category(cat_id).then((response) => {
        
    res.redirect("category_manage")
      
  });
});




module.exports = router;
