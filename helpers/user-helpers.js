var db = require("../config/connection");
var collection = require("../config/collections");
const bcrypt = require("bcrypt");
const { response } = require("express");

var nodemailer = require("nodemailer");
var crypto = require("crypto");

var objectId = require("mongodb").ObjectID;
const Razorpay = require("razorpay");
const { networkInterfaces } = require("os");
const { order } = require("paypal-rest-sdk");
var instance = new Razorpay({
    key_id: "rzp_test_P1qJn93ykpKDDb",
    key_secret: "JuWZzbyfn9iNxVMLtbh1n2PQ",
});

module.exports = {
    /* Login For Admin
    ============================================= */
    doLogin: (admin_data) => {
        try {
            return new Promise(async (resolve, reject) => {              
                let response = {}; //null object created
                let admin = await db.get().collection(collection.USER_COLLECTION).findOne({ username: admin_data.username });
                if (admin) {
                    db.get()
                        .collection(collection.USER_COLLECTION)
                        .findOne({ password: admin_data.password })
                        .then((loginStatus) => {
                            // bcrypt.compare(adminData.password, user.password).then((loginStatus) => {
                            if (loginStatus) {
                                response.admin = admin;
                                response.loginStatus = true;
                                resolve(response);
                            } else {
                                resolve({ loginStatus: false });
                            }
                        });
                } else {
                    resolve({ status: false });
                }
            });
        } catch (err) {
            console.log(err);
        }
    },

    /* Add/Update User Profile
    ============================================= */
    updateAdminSettings: (adminData, adminId) => {
        try {          
            return new Promise(async (resolve, reject) => {
                let admin = await db
                    .get()
                    .collection(collection.USER_COLLECTION)
                    .findOne({ _id: objectId(adminId) });
                if (admin) {
                    db.get()
                        .collection(collection.USER_COLLECTION)
                        .updateOne(
                            { _id: objectId(adminId) },
                            {
                                $set: {
                                    first_name  : adminData.first_name,
                                    last_name   : adminData.last_name,
                                    email       : adminData.email,
                                    phone       : adminData.phone,
                                    address     : adminData.address,
                                    city        : adminData.city,
                                    postcode    : adminData.postcode,
                                    state       : adminData.state,
                                },
                            }
                        )
                        .then((response) => {
                            resolve({ updateStatus: true });
                        });
                } else {
                    console.log("error");
                }
            });
        } catch (err) {
            console.log(err);
        }
    },

    /* Get  Admin Details By Admin Id 
    ============================================= */
    getAdminDetails: (adminId) => {
        try {
            return new Promise(async (resolve, reject) => {
                db.get()
                    .collection(collection.USER_COLLECTION)
                    .findOne({ _id: objectId(adminId) })
                    .then((admin) => {
                        resolve(admin);
                    });
            });
        } catch (err) {
            console.log(err);
        }
    },

    /* Change Password  For Admin
    ============================================= */
    changePasswordAdmin: (adminData) => {
        try {
            return new Promise(async (resolve, reject) => {
                let loginStatus = false;
                let response = {}; //null object created
                let adminId = adminData.admin_id;
                let admin = await db
                    .get()
                    .collection(collection.USER_COLLECTION)
                    .findOne({ _id: objectId(adminId) });
                if (admin) {
                    db.get()
                        .collection(collection.USER_COLLECTION)
                        .findOne({ password: adminData.old_password })
                        .then((loginStatus) => {
                            if (loginStatus) {
                                db.get()
                                    .collection(collection.USER_COLLECTION)
                                    .updateOne(
                                        { _id: objectId(adminId) },
                                        {
                                            $set: {
                                                password: adminData.new_password,
                                            },
                                        }
                                    );
                                resolve({ resetStatus: true });
                            } else {
                                resolve({ resetStatus: false });
                            }
                        });
                } else {
                    resolve();
                }
            });
        } catch (err) {
            console.log(err);
        }
    },

    /*=============================             Vendor Section          ============================== */

    /* SignUp For Vendors
    ============================================= */
    addVendor: (vendorData) => {
        try {
            let signup_status = true;
            return new Promise(async (resolve, reject) => {
                vendorData.password = await bcrypt.hash(vendorData.ven_password, 10);
                let user = await db
                    .get()
                    .collection(collection.VENDOR_COLLECTION)
                    .findOne({ ven_email: vendorData.ven_email })
                if (user) {
                    resolve({ signup_status: false });
                } else {
                    var vendorDetails = {
                        ven_name    : vendorData.ven_name,
                        ven_shop    : vendorData.ven_shop_name,
                        ven_phone   : vendorData.ven_phone,
                        ven_email   : vendorData.ven_email,
                        ven_password: vendorData.password,
                        status      : "vendor",
                        active      : "true",
                        created     : new Date(),
                    };

                    db.get()
                        .collection(collection.VENDOR_COLLECTION)
                        .insertOne(vendorDetails)
                        .then((vendorDetails) => {
                            resolve(vendorDetails.ops[0]);
                        });
                }
            });
        } catch (err) {
            console.log(err);
        }
    },

    /* Check Email Exist or Not
    ============================================= */
    checkVendorEmailExist: (venEmail) => {
        try {
            return new Promise(async (resolve, reject) => {
                let user = await db.get().collection(collection.VENDOR_COLLECTION).findOne({ ven_email: venEmail })
                if (user) {
                    resolve({ isEmail: true });
                } else {
                    resolve({ isEmail: false });
                }
            });
        } catch (err) {
            console.log(err);
        }
    },

    /* Login For Vendors
    ============================================= */
    doLoginVendor: (vendorData) => {
        try {
            return new Promise(async (resolve, reject) => {
                let loginStatus = false;
                let response = {}; //null object created
                let user = await db.get().collection(collection.VENDOR_COLLECTION).findOne({ ven_email: vendorData.email,active:"true" });
                if (user) {
                    bcrypt.compare(vendorData.password, user.ven_password).then((loginStatus) => {
                        if (loginStatus) {
                            response.user = user;
                            response.loginStatus = true;
                            resolve(response);
                        } else {
                            resolve({ loginStatus: false });
                        }
                    });
                } else {
                    resolve({ status: false });
                }
            });
        } catch (err) {
            console.log(err);
        }
    },

    /* Get All Vendors
    ============================================= */
    getAllVendors: () => {
        try {
            return new Promise(async (resolve, reject) => {
                let vendors = await db.get().collection(collection.VENDOR_COLLECTION)
                .find({ active: "true" })
                .sort( { "_id": -1 } )
                .toArray();
                resolve(vendors);
            });
        } catch (err) {
            console.log(err);
        }
    },

    /* Get Vendor Details By Vendor Id 
    ============================================= */
    getVendorDetails: (venId) => {
        try {
            return new Promise((resolve, reject) => {
                db.get()
                    .collection(collection.VENDOR_COLLECTION)
                    .findOne({ _id: objectId(venId) })
                    .then((vendor) => {
                        resolve(vendor);
                    });
            });
        } catch (err) {
            console.log(err);
        }
    },

    /* Delete Vendor
    ============================================= */
    deleteVendor: (venId) => {
        try {
            return new Promise((resolve, reject) => {
                db.get()
                    .collection(collection.VENDOR_COLLECTION)
                    // .removeOne({ _id: objectId(venId) })
                    .update(
                        { _id: objectId(venId) },
                        {
                            $set: {
                                active: "false",
                            },
                        }
                    )
                    .then((vendor) => {
                        resolve(vendor);
                    });
                // .catch(err => {
                //     console.error(err)
                //   })
            });
        } catch (err) {
            console.log(err);
        }
    },

    /* Update Vendor Details By Vendor Id
    ============================================= */
    updateVendor: (venDetails,venId) => {
        try {
            return new Promise(async (resolve, reject) => {
                db.get()
                    .collection(collection.VENDOR_COLLECTION)
                    .updateOne(
                        { _id: objectId(venId) },
                        {
                            $set: {
                                ven_name: venDetails.ven_name,
                                ven_shop: venDetails.ven_shop_name,
                                ven_phone: venDetails.ven_phone,
                            },
                        }
                    )
                    .then((response) => {
                        resolve({ update_status: true });
                    });
            });
        } catch (err) {
            console.log(err);
        }
    },

    /* Update Vendor Email(username)
    ============================================= */
    change_Email_Vendor: (venDetails) => {
        try {
            return new Promise(async (resolve, reject) => {
                let vendor = await db
                    .get()
                    .collection(collection.VENDOR_COLLECTION)
                    .findOne({ ven_email: venDetails.ven_email });
                if (vendor) {
                    resolve({ isEmail: true });
                } else {
                    db.get()
                        .collection(collection.VENDOR_COLLECTION)
                        .updateOne(
                            { _id: objectId(venDetails.ven_id) },
                            {
                                $set: {
                                    ven_email: venDetails.ven_email,
                                },
                            }
                        )
                        .then((response) => {
                            resolve({ update_status: true });
                        });
                }
            });
        } catch (err) {
            console.log(err);
        }
    },

    /* Change Password  For Vendors
    ============================================= */
    changePasswordVendor: (vendorData) => {
        try {
            return new Promise(async (resolve, reject) => {
                let loginStatus = false;
                let response = {}; //null object created
                vendorId = vendorData.ven_id;
                let user = await db
                    .get()
                    .collection(collection.VENDOR_COLLECTION)
                    .findOne({ _id: objectId(vendorId) });
                if (user) {
                    vendorData.ven_password = await bcrypt.hash(vendorData.new_password, 10);
                    bcrypt.compare(vendorData.old_password, user.ven_password).then((loginStatus) => {
                        if (loginStatus) {
                            db.get()
                                .collection(collection.VENDOR_COLLECTION)
                                .updateOne(
                                    { _id: objectId(vendorId) },
                                    {
                                        $set: {
                                            ven_password: vendorData.ven_password,
                                        },
                                    }
                                );
                            response.resetStatus = true;
                            resolve(response);
                        } else {
                            resolve({ resetStatus: false });
                        }
                    });
                } else {
                    resolve({ resetStatus: "Not a user" });
                }
            });
        } catch (err) {
            console.log(err);
        }
    },

    /*=============================             Customer Section          ============================== */

    /* SignUp For Users(Customers)
    ============================================= */
    doSignupUser: (userData) => {
        try {
            let signup_status = true;
            return new Promise(async (resolve, reject) => {
                userData.password = await bcrypt.hash(userData.password, 10);
                let user = await db
                    .get()
                    .collection(collection.USERS_COLLECTION)
                    .findOne({
                        $or: [{ email: userData.email }, { phone: userData.phone }],
                    });
                if (user) {
                    if (user.email == userData.email) {
                        resolve({ signup_status: false });
                    } else if (user.phone == userData.phone) {
                        resolve({ signup_status: false });
                    }
                } else {
                    var userDetails = {
                        first_name: userData.first_name,
                        last_name: userData.last_name,
                        phone: userData.phone,
                        email: userData.email,
                        password: userData.password,
                        status: "user",
                        active: "true",
                        created: new Date(),
                    }
                    db.get()
                        .collection(collection.USERS_COLLECTION)
                        .insertOne(userDetails)
                        .then((userDetails) => {
                            resolve(userDetails.ops[0]);
                        })
                }
            });
        } catch (err) {
            console.log(err);
        }
    },

    /* Login For Users(customers)
    ============================================= */
    doLoginUser: (userData) => {
        try {
            return new Promise(async (resolve, reject) => {
                let loginStatus = false;
                let response = {} //null object created
                let user = await db
                    .get()
                    .collection(collection.USERS_COLLECTION)
                    .findOne({active:"true",$or: [{ email: userData.email }, { phone: userData.email }] })
                if (user) {
                    bcrypt.compare(userData.password, user.password).then((loginStatus) => {
                        if (loginStatus) {
                            response.user = user;
                            response.loginStatus = true
                            if (user.active == "blocked") {
                                response.loginStatus = "blocked";
                            }
                            resolve(response);
                        } else {
                            resolve({ loginStatus: false });
                        }
                    });
                } else {
                    resolve({ status: false });
                }
            });
        } catch (err) {
            console.log(err);
        }
    },

    doLogin_UserbyPhone: (phone) => {
        try {
            return new Promise(async (resolve, reject) => {
                let loginStatus = false;
                let response = {}; //null object created
                let user = await db.get().collection(collection.USERS_COLLECTION).findOne({ phone: phone });

                if (user) {
                    response.user = user;
                    response.loginStatus = true;
                    resolve(response);
                } else {
                    resolve({ status: false });
                }
            });
        } catch (err) {
            console.log(err);
        }
    },


    /* Check Bloack Status Of User(Customer)
    ============================================= */
   checkBlockStatus: (userId) => {
        try {
            return new Promise(async (resolve, reject) => {
                let loginStatus = false;
                let response = {}; //null object created
                let user = await db.get().collection(collection.USERS_COLLECTION).findOne({ _id:objectId(userId) });              
                if (user) {
                   if(user.active == "blocked"){
                        resolve({ blockStatus: true });
                   }
                   else{
                        resolve({ blockStatus: false });
                   }
                } else {                   
                    resolve({ status: false });
                }
            });
        } catch (err) {
            console.log(err);
        }
    },

    /* Check Email Registered or Not For Customers
    ============================================= */
    checkUseremailExist: (userEmail) => {
        try {
            let signup_status = true;
            return new Promise(async (resolve, reject) => {
                let user = await db.get().collection(collection.USERS_COLLECTION).findOne({ email: userEmail })
                if (user) {
                    resolve({ signup_status: false })
                } else {
                    resolve({ signup_status: true })
                }
            });
        } catch (err) {
            console.log(err);
        }
    },

    /* Check Phone Number Registered or Not For Customers
    ============================================= */
    checkUserphoneExist: (userPhone) => {
        try {
            let signup_status = true
            return new Promise(async (resolve, reject) => {
                let user = await db.get().collection(collection.USERS_COLLECTION).findOne({ phone: userPhone })
                if (user) {
                    resolve({ signup_status: false })
                } else {
                    resolve({ signup_status: true })
                }
            });
        } catch (err) {
            console.log(err);
        }
    },

    /* Get  User/Customer Details by id 
    ============================================= */
    getUserDetails: (userId) => {
       
        try {
            return new Promise(async (resolve, reject) => {
                let user_details = await db
                    .get()
                    .collection(collection.USERS_COLLECTION)
                    .aggregate([
                        {
                            $match: { _id: objectId(userId) },
                        },
                        {
                            $lookup: {
                                from: collection.USERDETAILS_COLLECTION,
                                localField: "_id",
                                foreignField: "user_id",
                                as: "user",
                            },
                        },
                        {
                            $unwind: "$user",
                        },
                        {
                            $project: {
                                address: "$user.address",
                                city: "$user.city",
                                state: "$user.state",
                                postcode: "$user.postcode",
                                first_name: 1,
                                last_name: 1,
                                phone: 1,
                                _id: 1,
                                email: 1,
                            },
                        },
                    ])
                    .toArray();
                resolve(user_details)
            });
        } catch (err) {
            console.log(err);
        }
    },



     /* Get  User/Customer Details by id (Admin)
    ============================================= */
    getUserDetailsByUserIdForAdmin: (userId) => {
        try {
            return new Promise(async(resolve, reject) => {
                await db.get()
                    .collection(collection.USERS_COLLECTION)
                    .findOne({ _id: objectId(userId) })
                    .then(async(user) => {
                           let userdetails =await db.get()
                            .collection(collection.USERDETAILS_COLLECTION)
                            .findOne({ user_id: objectId(userId) })
                            
                            if(userdetails){                              
                                user.user_details = userdetails
                                console.log(user)
                                resolve(user);
                            }
                            else{
                                resolve(user);
                            }
                    });
            });
        } catch (err) {
            console.log(err);
        }
        try {
            return new Promise(async (resolve, reject) => {
                let user_details = await db
                    .get()
                    .collection(collection.USERS_COLLECTION)
                    .aggregate([
                        {
                            $match: { _id: objectId(userId) },
                        },
                        {
                            $lookup: {
                                from: collection.USERDETAILS_COLLECTION,
                                localField: "_id",
                                foreignField: "user_id",
                                as: "user",
                            },
                        },
                      
                        {
                            $unwind: "$user",
                        },
                        // {
                        //     $project: {
                        //         address: "$user.address",
                        //         city: "$user.city",
                        //         state: "$user.state",
                        //         postcode: "$user.postcode",
                        //         first_name: 1,
                        //         last_name: 1,
                        //         phone: 1,
                        //         _id: 1,
                        //         email: 1,
                        //     },
                        // },
                    ])
                    .toArray();
                    console.log(user_details)
                resolve(user_details)
            });
        } catch (err) {
            console.log(err);
        }
    },


     /* Add/Update User Profile By Admin
    ============================================= */
    addUserProfileByAdmin: (userData, userId) => {
        try {
            return new Promise(async (resolve,reject) => {
                db.get()
                    .collection(collection.USERS_COLLECTION)
                    .updateOne(
                        { _id: objectId(userId) },
                        {
                            $set: {
                                first_name: userData.first_name,
                                last_name: userData.last_name,
                            },
                        }
                    );
                let user = await db
                    .get()
                    .collection(collection.USERDETAILS_COLLECTION)
                    .findOne({ user_id: objectId(userId) });
                if (user) {
                    db.get()
                        .collection(collection.USERDETAILS_COLLECTION)
                        .updateOne(
                            { user_id: objectId(userId) },
                            {
                                $set: {
                                    address: userData.address,
                                    city: userData.city,
                                    postcode: userData.postcode,
                                    state: userData.state,
                                },
                            }
                        )
                        .then(() => {
                            resolve({ update_status: true });
                        });
                } else {
                    var userDetails = {
                        user_id: objectId(userId),
                        address: userData.address,
                        city: userData.city,
                        postcode: userData.postcode,
                        state: userData.state,
                        status: 1,
                        created: new Date(),
                    };

                    db.get()
                        .collection(collection.USERDETAILS_COLLECTION)
                        .insertOne(userDetails)
                        .then((userDetails) => {
                            resolve(userDetails.ops[0]);
                        });
                }
            });
        } catch (err) {
            console.log(err);
        }
    },

    /* Change Password  For Users
    ============================================= */
    changePasswordUser: (userData) => {
       
        try {
            return new Promise(async (resolve, reject) => {
                let response = {}; //null object created
                let userId = userData.userId;
                let user = await db
                    .get()
                    .collection(collection.USERS_COLLECTION)
                    .findOne({ _id: objectId(userId) });
                if (user) {
                    userData.password = await bcrypt.hash(userData.new_password, 10);
                    bcrypt.compare(userData.old_password, user.password).then((loginStatus) => {
                        if (loginStatus) {
                            db.get()
                                .collection(collection.USERS_COLLECTION)
                                .updateOne(
                                    { _id: objectId(userId) },
                                    {
                                        $set: {
                                            password: userData.password,
                                        },
                                    }
                                );
                            response.resetStatus = true;
                            resolve(response);
                        } else {
                            resolve({ resetStatus: false });
                        }
                    });
                } else {
                    resolve({ resetStatus: "Not a registered user" });
                }
            });
        } catch (err) {
            console.log(err);
        }
    },

    /* Get All Customers
    ============================================= */
    getAllUsers: () => {
        try {
            return new Promise(async (resolve, reject) => {
                let users   =   await db.get().collection(collection.USERS_COLLECTION)
                .find({ active: "true" })
                .sort( { "_id": -1 } )
                .toArray();
                resolve(users);
            });
        } catch (err) {
            console.log(err);
        }
    },

    /* Get All Blocked Customers
    ============================================= */
    getAllBlockedUsers: () => {
        try {
            return new Promise(async (resolve, reject) => {
                let users = await db.get().collection(collection.USERS_COLLECTION).find({ active: "blocked" }).toArray()
                resolve(users);
            });
        } catch (err) {
            console.log(err);
        }
    },

    /* Delete User
    ============================================= */
    deleteUser: (userId) => {
        try {
            return new Promise((resolve, reject) => {
                db.get()
                    .collection(collection.USERS_COLLECTION)
                    .update(
                        { _id: objectId(userId) },
                        {
                            $set: {
                                active: "false",
                            },
                        }
                    )
                    .then((user) => {
                        resolve(user);
                    })               
            })
        } catch (err) {
            console.log(err);
        }
    },

    /* Block User
    ============================================= */
    blockUser: (userId) => {
        try {
            return new Promise((resolve, reject) => {
                db.get()
                    .collection(collection.USERS_COLLECTION)
                    .update(
                        { _id: objectId(userId) },
                        {
                            $set: {
                                active: "blocked",
                            },
                        }
                    )
                    .then((user) => {
                        resolve(user);
                    });              
            });
        } catch (err) {
            console.log(err);
        }
    },

    /* Unblock User
    ============================================= */
    unblockUser: (userId) => {
        try {
            return new Promise((resolve, reject) => {
                db.get()
                    .collection(collection.USERS_COLLECTION)
                    .update(
                        { _id: objectId(userId) },
                        {
                            $set: {
                                active: "true",
                            },
                        }
                    )
                    .then((user) => {
                        resolve(user);
                    });
               
            });
        } catch (err) {
            console.log(err);
        }
    },

    /* Add/Update User Profile
    ============================================= */
    addUserProfile: (userData, userId) => {       
        try {
            return new Promise(async (resolve,reject) => {
                db.get()
                    .collection(collection.USERS_COLLECTION)
                    .updateOne(
                        { _id: objectId(userId) },
                        {
                            $set: {
                                first_name: userData.first_name,
                                last_name: userData.last_name,
                            },
                        }
                    );
                let user = await db
                    .get()
                    .collection(collection.USERDETAILS_COLLECTION)
                    .findOne({ user_id: objectId(userId) });
                if (user) {
                    db.get()
                        .collection(collection.USERDETAILS_COLLECTION)
                        .updateOne(
                            { user_id: objectId(userId) },
                            {
                                $set: {
                                    address: userData.address,
                                    city: userData.city,
                                    postcode: userData.postcode,
                                    state: userData.state,
                                },
                            }
                        )
                        .then(() => {
                            resolve({ update_status: true });
                        });
                } else {
                    var userDetails = {
                        user_id: objectId(userId),
                        address: userData.address,
                        city: userData.city,
                        postcode: userData.postcode,
                        state: userData.state,
                        status: 1,
                        created: new Date(),
                    };

                    db.get()
                        .collection(collection.USERDETAILS_COLLECTION)
                        .insertOne(userDetails)
                        .then((userDetails) => {
                            resolve(userDetails.ops[0]);
                        });
                }
            });
        } catch (err) {
            console.log(err);
        }
    },

    /*Forget Password
    ============================================= */
    forgetPassword: (userData) => {
        try {
            return new Promise(async (resolve, reject) => {
                let user = await db.get().collection(collection.USERS_COLLECTION).findOne({ email: userData.email });
                if (user) {
                    var token = null;
                    await crypto.randomBytes(20, function (err, buf) {
                        token = buf.toString("hex");
                        db.get()
                            .collection(collection.USERS_COLLECTION)
                            .updateOne(
                                { email: userData.email },
                                {
                                    $set: {
                                        resetPasswordToken: token,
                                        resetPasswordExpires: Date.now() + 3600000,
                                    },
                                }
                            );
                        var smtpTransport = nodemailer.createTransport({
                            service: "gmail",
                            auth: {
                                user: "snackydemo@gmail.com",
                                pass: "Ashriya@123",
                            },
                        });
                        var mailOptions = {
                            to: userData.email,
                            from: "snackydemo@gmail.com",
                            subject: "Snacky Food Delivery Password Reset",
                            text:
                                "You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n" +
                                "Please click on the following link, or paste this into your browser to complete the process:\n\n" +
                                "http://" +
                                "localhost:3000" +
                                "/reset/" +
                                token +
                                "\n\n" +
                                "If you did not request this, please ignore this email and your password will remain unchanged.\n",
                        };

                        smtpTransport.sendMail(mailOptions, function (err, info) {
                            resolve({ status: 1 });
                        });
                    });
                } else {
                    resolve({ status: 0 });
                }
            });
        } catch (err) {
            console.log(err);
        }
    },

    /* Reset Password Response
    ============================================= */
    resetPasswordResponse: (token) => {
        try {
            return new Promise(async (resolve, reject) => {
                db.get()
                    .collection(collection.USERS_COLLECTION)
                    .findOne(
                        { resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } },
                        function (err, user) {
                            if (!user) {
                                resolve({ status: 0 });
                            } else {
                                resolve({ status: 1 });
                            }
                        }
                    );
            });
        } catch (err) {
            console.log(err);
        }
    },

    /* Reset Password  For Users
    ============================================= */
    resetPasswordUser: (userData) => {
        try {
            return new Promise(async (resolve, reject) => {
                let token = userData.token;
                let user = await db.get().collection(collection.USERS_COLLECTION).findOne({ resetPasswordToken: token });
                if (user) {
                    userData.password = await bcrypt.hash(userData.new_password, 10);
                    db.get()
                        .collection(collection.USERS_COLLECTION)
                        .updateOne(
                            { resetPasswordToken: token },
                            {
                                $set: {
                                    password: userData.password,
                                },
                            }
                        );
                    response.resetStatus = true;
                    resolve(response);
                } else {
                    response.resetStatus = false;
                    resolve(response);
                }
            });
        } catch (err) {
            console.log(err);
        }
    },

    /*Contact
    ============================================= */
    contact: (contactData) => {
        try {
            return new Promise(async (resolve, reject) => {
                var smtpTransport = nodemailer.createTransport({
                    service: "gmail",
                    auth: {
                        user: "snackydemo@gmail.com",
                        pass: "Ashriya@123",
                    },
                });
                
                var mailOptions = {
                    to: "snackydemo@gmail.com",
                    from: contactData.contact_email,
                    subject: contactData.subject,
                    text:
                     "Name : " + contactData.contact_name  +
                     "\n\n Email : " + contactData.contact_email  +
                     "\n\n Phone : " + contactData.contact_phone  +
                     "\n\n Message : " + contactData.message                         
                };
                smtpTransport.sendMail(mailOptions, function (err, info) {
                    resolve({ status: true });
                });
            });
        } catch (err) {
            console.log(err);
        }
    },

    /*=================================            Cart Section         ===================================== */

    /* products added to cart
    ============================================= */
    addToCart: (prodetails, userId) => {
        try {
            let proId = prodetails.product_id;
            let ven_id = prodetails.ven_id;
            let price = parseFloat(prodetails.price);
            let proObj = {
                item: objectId(proId),
                ven_id: objectId(ven_id),
                price: price,
                quantity: 1,
                order_status: "pending",
                date_added: new Date(),
                date_modified: new Date(),
            };
            return new Promise(async (resolve, reject) => {
                let userCart = await db
                    .get()
                    .collection(collection.CART_COLLECTION)
                    .findOne({ user: objectId(userId) });
                if (userCart) {
                    let proExist = userCart.products.findIndex((product) => product.item == proId);
                    if (proExist != -1) {
                        db.get()
                            .collection(collection.CART_COLLECTION)
                            .updateOne(
                                { user: objectId(userId), "products.item": objectId(proId) },
                                {
                                    $inc: { "products.$.quantity": 1 },
                                }
                            )
                            .then(() => {
                                resolve();
                            });
                    } else {
                        db.get()
                            .collection(collection.CART_COLLECTION)
                            .updateOne(
                                { user: objectId(userId) },
                                {
                                    $push: { products: proObj },
                                }
                            )
                            .then((response) => {
                                resolve();
                            })                     
                    }
                } else {
                    let cartObj = {
                        user: objectId(userId),
                        products: [proObj],
                    };
                    db.get()
                        .collection(collection.CART_COLLECTION)
                        .insertOne(cartObj)
                        .then((response) => {
                            resolve();
                        });
                }
            });
        } catch (err) {
            console.log(err);
        }
    },

    /*Get product details from cart by userid
    ============================================= */
    getCartProducts: (userId) => {
        try {
            return new Promise(async (resolve, reject) => {
                let userCart = await db
                    .get()
                    .collection(collection.CART_COLLECTION)
                    .findOne({ user: objectId(userId) });
                if (userCart) {
                    let cartItems = await db
                        .get()
                        .collection(collection.CART_COLLECTION)
                        .aggregate([
                            {
                                $match: { user: objectId(userId) },
                            },
                            {
                                $unwind: "$products",
                            },
                            {
                                $project: {
                                    item: "$products.item",
                                    quantity: "$products.quantity",
                                    order_status: "$products.order_status",
                                    price: "$products.price",
                                },
                            },
                            {
                                $lookup: {
                                    from: collection.PRODUCT_COLLECTION,
                                    localField: "item",
                                    foreignField: "_id",
                                    as: "product",
                                },
                            },
                            {
                                $unwind: "$product",
                            }                            
                        ])
                        .toArray();
                    resolve(cartItems);
                } else {
                    resolve({ cart_status: false });
                }
            });
        } catch (err) {
            console.log(err);
        }
    },

    /*Get count of items in cart
    ============================================= */
    get_CartLength: (userId) => {
        try {
            return new Promise(async (resolve, reject) => {
                let count = null;
                let cart = await db
                    .get()
                    .collection(collection.CART_COLLECTION)
                    .findOne({ user: objectId(userId) });
                if (cart) {
                    count = cart.products.length;
                }
                resolve(count);
            });
        } catch (err) {
            console.log(err);
        }
    },

    /*Get  Count of Items in cart  By User(Customer) Id
    ============================================= */
    getCartCount: (userId) => {
        try {
            return new Promise(async (resolve, reject) => {
                let count = null;
                let cart = await db
                    .get()
                    .collection(collection.CART_COLLECTION)
                    .findOne({ user: objectId(userId) });
                if (cart) {
                    count = await db
                        .get()
                        .collection(collection.CART_COLLECTION)
                        .aggregate([
                            {
                                $match: { user: objectId(userId) },
                            },
                            {
                                $unwind: "$products",
                            },                                                       
                            {
                                $group: {
                                    _id: null,
                                    count: { $sum: "$products.quantity" },
                                },
                            },
                        ])
                        .toArray();
                    count = count[0].count;
                    resolve(count);
                } else {
                    count = 0;
                    resolve(count);
                }
            });
        } catch (err) {
            console.log(err);
        }
    },

   
   
   
   
    /*Get total amount of items in cart
    ============================================= */
    getTotalAmount: (userId) => {
        try {
            return new Promise(async (resolve, reject) => {
                let cart = await db
                    .get()
                    .collection(collection.CART_COLLECTION)
                    .findOne({ user: objectId(userId) });
                if (cart) {
                    let total = await db
                        .get()
                        .collection(collection.CART_COLLECTION)
                        .aggregate([
                            {
                                $match: { user: objectId(userId) },
                            },
                            {
                                $unwind: "$products",
                            },
                            {
                                $project: {
                                    item: "$products.item",
                                    quantity: "$products.quantity",
                                    price: "$products.price",
                                },
                            },
                            {
                                $lookup: {
                                    from: collection.PRODUCT_COLLECTION,
                                    localField: "item",
                                    foreignField: "_id",
                                    as: "product",
                                },
                            },
                            {
                                $project: {
                                    item: 1,
                                    quantity: 1,
                                    price: 1,
                                    product: { $arrayElemAt: ["$product", 0] },
                                },
                            },
                            {
                                $set: {
                                    org_price: { $toDouble: "$product.price" },
                                },
                            },
                            {
                                $group: {
                                    _id: null,
                                    total: { $sum: { $multiply: ["$quantity", "$price"] } },
                                    total_org: { $sum: { $multiply: ["$quantity", "$org_price"] } },
                                },
                            },
                        ])
                        .toArray();
                    total[0].discount = total[0].total_org - total[0].total;
                    resolve(total);
                }
            });
        } catch (err) {
            console.log(err);
        }
    },

    /*Cahnge the product quantity
    ============================================= */
    changeProductQuantity: (details) => {
        try {
            let count = parseInt(details.count);
            let quantity = parseInt(details.quantity);

            return new Promise(async (resolve, reject) => {
                if (count == -1 && quantity == 1) {
                    let cart_count_array = await db
                        .get()
                        .collection(collection.CART_COLLECTION)
                        .findOne({ _id: objectId(details.cart) });
                    cart_count = cart_count_array.products.length;

                    if (cart_count > 1) {
                        await db
                            .get()
                            .collection(collection.CART_COLLECTION)
                            .updateOne(
                                { _id: objectId(details.cart) },
                                {
                                    $pull: { products: { item: objectId(details.product) } },
                                }
                            )
                            .then((response) => {
                                resolve({ removeProduct: true });
                            });
                    } else {
                        await db
                            .get()
                            .collection(collection.CART_COLLECTION)
                            .removeOne({ _id: objectId(details.cart) })
                            .then(() => {
                                resolve({ removeCart: true });
                            });
                    }
                    //resolve({ removeProduct: true });
                } else {
                    db.get()
                        .collection(collection.CART_COLLECTION)
                        .updateOne(
                            { _id: objectId(details.cart), "products.item": objectId(details.product) },
                            {
                                $inc: { "products.$.quantity": count },
                            }
                        )
                        .then((response) => {
                            resolve({ status: true });
                        });
                }
            });
        } catch (err) {
            console.log(err);
        }
    },

    /*Remove item from cart
    ============================================= */
    removeCartItem: (details) => {
        try {
            let cartId = details.cart;
            return new Promise((resolve, reject) => {
                let order = db
                    .get()
                    .collection(collection.CART_COLLECTION)
                    .aggregate([
                        {
                            $match: { _id: objectId(cartId) },
                        },
                        {
                            $project: {
                                sizeOfArray: { $size: "$products" },
                            },
                        },
                    ])
                    .toArray();
                order.then(function (result) {
                    count = result[0].sizeOfArray;

                    if (count > 1) {
                        db.get()
                            .collection(collection.CART_COLLECTION)
                            .updateOne(
                                { _id: objectId(details.cart) },
                                {
                                    $pull: { products: { item: objectId(details.product) } },
                                }
                            )
                            .then(() => {
                                resolve();
                            });
                    } else {
                        db.get()
                            .collection(collection.CART_COLLECTION)
                            .removeOne({ _id: objectId(details.cart) })
                            .then(() => {
                                resolve();
                            });
                    }
                });
            });
        } catch (err) {
            console.log(err);
        }
    },

    /*Place order details
    ============================================= */
    place_Order: (order, products, total) => {
        let coupon_id = order.coupon_id
        if (coupon_id) {
            coupon_id = objectId(coupon_id);
        } else {
            coupon_id = null;
        }
        try {
            return new Promise(async (resolve, reject) => {
                let status = order["payment-method"] === "COD" ? "placed" : "pending"
                for (var i = 0; i < products.length; i++) {
                    products[i].order_status = status;
                }
                let order_details = {
                    deliveryDetails: {
                        billing_address: order.billing_address,
                        billing_city: order.billing_city,
                        billing_pincode: order.billing_pincode,
                        billing_state: order.billing_state,
                    },
                    userId: objectId(order.userId),
                    paymentMethod: order["payment-method"],
                    products: products,
                    totalAmount: parseFloat(total),
                    coupon_id: coupon_id,
                    status: status,
                    created_date: new Date(),
                    modified_date: new Date(),
                };
                await db
                    .get()
                    .collection(collection.ORDER_COLLECTION)
                    .insertOne(order_details)
                    .then((response) => {
                        db.get()
                            .collection(collection.CART_COLLECTION)
                            .removeOne({ user: objectId(order.userId) });
                        resolve(response.ops[0]._id);
                    });

                resolve();
            });
        } catch (err) {
            console.log(err);
        }
    },

    /*Get cart products list by user id
    ============================================= */
    getCartProductList: (userId) => {
        try {
            return new Promise(async (resolve, reject) => {
                let cart = await db
                    .get()
                    .collection(collection.CART_COLLECTION)
                    .findOne({ user: objectId(userId) });
                resolve(cart.products);
            });
        } catch (err) {
            console.log(err);
        }
    },

    /* Check Coupon Exist or not 
    ============================================= */
    checkCouponCode: (coupon,subtotal,userId) => {       
        var startDate = new Date();
        startDate.setDate(startDate.getDate() - 1);
        
        try {
            return new Promise(async (resolve, reject) => {
                let coupon_details = await db
                    .get()
                    .collection(collection.COUPON_COLLECTION)
                    .findOne({ expiry_date: { $gte: startDate }, coupon_code: coupon, active: true });
                if (coupon_details) {
                    let isCoupon_used = await db
                        .get()
                        .collection(collection.ORDER_COLLECTION)
                        .find({ $and: [{ coupon_id: objectId(coupon_details._id) }, { userId: objectId(userId) }] })
                        .count();        
                    if (isCoupon_used >= 1) {
                        resolve({ status: "used" });
                    } else {
                        let coupon_amount = coupon_details.coupon_amount;
                        let minimum_amount = coupon_details.minimum_amount;
                        if (subtotal >= minimum_amount) {
                            let coupon_discount = (subtotal * coupon_amount) / 100;
                            let total = subtotal - (subtotal * coupon_amount) / 100;
                            const total_amount = {
                                coupon_discount: coupon_discount,
                                total: total,
                                coupon_amount: coupon_amount,
                                coupon_id: coupon_details._id,
                            };
                            resolve(total_amount);
                        } else {
                            const response = {
                                status: "less",
                                minimum_amount: minimum_amount,
                            };
                            resolve(response);
                        }
                    }
                } else {
                    resolve({ status: false });
                }
            });
        } catch (err) {
            console.log(err);
        }
    },

    /*====================================             Order Section          ======================================= */

    /*Get User Orders By User Id
    ============================================= */
    getUserOrdersByuserId: (userId) => {
        try {
            return new Promise(async (resolve, reject) => {
                let orders = await db
                    .get()
                    .collection(collection.ORDER_COLLECTION)
                    .aggregate([
                        {
                            $match: { userId: objectId(userId) },
                        },
                        {
                            $set: {
                                created_date: { $dateToString: { format: "%d-%m-%Y", date: "$created_date" } },
                            },
                        },
                        { $sort: { _id: -1 } },
                    ])
                    .toArray();
                resolve(orders);
            });
        } catch (err) {
            console.log(err);
        }
    },

  
    /*Get details of ordered products By Order Id
    ============================================= */
    getOrderProductsByOrderId: (orderId) => {
        try {
            return new Promise(async (resolve, reject) => {
                let orderItems = await db
                    .get()
                    .collection(collection.ORDER_COLLECTION)
                    .aggregate([
                        {
                            $match: { _id: objectId(orderId) },
                        },
                        {
                            $unwind: "$products",
                        },
                        {
                            $project: {
                                item: "$products.item",
                                quantity: "$products.quantity",
                                price: "$products.price",
                                order_status: "$products.order_status",
                                status: 1,
                            },
                        },
                        {
                            $lookup: {
                                from: collection.PRODUCT_COLLECTION,
                                localField: "item",
                                foreignField: "_id",
                                as: "product",
                            },
                        },
                        {
                            $unwind: "$product",
                        },
                        {
                            $addFields: {
                                convertedPrice: { $toDouble: "$product.price" },
                                convertedQty: { $toInt: "$quantity" },
                            },
                        },
                        {
                            $set: {
                                totalAmount: { $multiply: ["$convertedPrice", "$convertedQty"] },
                                discountAmount: { $multiply: ["$price", "$convertedQty"] },
                            },
                        },
                    ])
                    .toArray();
                resolve(orderItems);
            });
        } catch (err) {
            console.log(err);
        }
    },

    /*Generate razorpay details
    ============================================= */
    generateRazorPay: (orderId, total) => {
        try {
            return new Promise((resolve, reject) => {
                var options = {
                    amount: total * 100, // amount in the smallest currency unit
                    currency: "INR",
                    receipt: "" + orderId,
                };
                instance.orders.create(options, function (err, order) {
                    if (err) {
                        console.log(err);
                    } else {
                        resolve(order);
                    }
                });
            });
        } catch (err) {
            console.log(err);
        }
    },

    /*Verify Payment
    ============================================= */
    verify_Payment: (details) => {
        try {
            return new Promise((resolve, reject) => {
                const crypto = require("crypto");
                let hmac = crypto.createHmac("sha256", "JuWZzbyfn9iNxVMLtbh1n2PQ");
                hmac.update(details["payment[razorpay_order_id]"] + "|" + details["payment[razorpay_payment_id]"]);
                hmac = hmac.digest("hex");
                if (hmac == details["payment[razorpay_signature]"]) {
                    resolve();
                } else {
                    reject();
                }
            });
        } catch (err) {
            console.log(err);
        }
    },

    /*Change the payment status of customer
    ============================================= */
    changePaymentStatus: (orderId) => {
        try {
            return new Promise((resolve, reject) => {
                db.get()
                    .collection(collection.ORDER_COLLECTION)
                    .updateMany(
                        { _id: objectId(orderId) },
                        {
                            $set: {
                                status: "placed",
                                //  "products.$[order_status]" :  "placed"
                                "products.$[].order_status": "placed",
                            },
                        },
                        { multi: true }
                    )
                    .then(() => {
                        resolve();
                    });
            });
        } catch (err) {
            console.log(err);
        }
    },

    /*Get Customer Orders By VendorId
    ============================================= */
    getUserOrdersByVendorId: (vendorId) => {
        try {
            return new Promise(async (resolve, reject) => {
                let orders = await db
                    .get()
                    .collection(collection.ORDER_COLLECTION)
                    .aggregate([
                        {
                            $unwind: "$products",
                        },
                        {
                            $match: { "products.ven_id": objectId(vendorId),
                            $or: [{ "products.order_status": "placed" }, { "products.order_status": "pending" }], 
                            }
                        },                      
                        {
                            $set: {
                                item: "$products.item",
                                created_date: { $dateToString: { format: "%d-%m-%Y", date: "$created_date" } },
                                created_date_string: { $dateToString: { format: "%Y%m%d", date: "$created_date" } }
                            },
                        },
                        {
                            $lookup: {
                                from: collection.PRODUCT_COLLECTION,
                                localField: "item",
                                foreignField: "_id",
                                as: "product",
                            },
                        },
                        {
                            $unwind: "$product",
                        },                                       
                        {
                            $group: {
                                _id: "$_id",
                                products: { $push: "$products" },
                                deliveryDetails: { $first: "$deliveryDetails" },
                                paymentMethod: { $first: "$paymentMethod" },
                                order_status: { $first: "$products.order_status" },
                                created_date: { $first: "$created_date" },
                                created_date_string: { $first: "$created_date_string" },                               
                                gross_amount: { $sum: { $multiply: ["$products.quantity", "$product.price"] } },
                                total: { $sum: { $multiply: ["$products.quantity", "$products.price"] } },
                            },
                        },
                        { $sort: { _id: -1 } },
                    ])
                    .toArray();
                resolve(orders);
            });
        } catch (err) {
            console.log(err);
        }
    },

    /*View Order Products By Vendor Id and OrderId
    ============================================= */
    viewOrderProductsByvendorAndOrderId: (vendorId, orderId) => {
        try {
            return new Promise(async (resolve, reject) => {
                let orderItems = await db
                    .get()
                    .collection(collection.ORDER_COLLECTION)
                    .aggregate([                       
                        {
                            $unwind: "$products",
                        },
                        {
                            $match: { _id: objectId(orderId), "products.ven_id": objectId(vendorId) },
                        },
                        {
                            $set: {
                               item: "$products.item"     
                            }                        
                        },                  
                        {
                            $lookup: {
                                from: collection.PRODUCT_COLLECTION,
                                localField: "item",
                                foreignField: "_id",
                                as: "product",
                            },
                        },
                        {
                            $lookup: {
                                from: collection.USERS_COLLECTION,
                                localField: "userId",
                                foreignField: "_id",
                                as: "users",
                            },
                        },
                        {
                            $unwind: "$product",
                        },                       
                        {
                            $addFields: {
                                totalAmount: { $multiply: ["$product.price", "$products.quantity"] },
                                netAmount:{ $multiply: ["$products.price", "$products.quantity"] }
                            },
                        },                      
                        {
                            $unwind: "$users",
                        },
                        {
                            $project: {
                                users:1,
                                product:1,
                                deliveryDetails: 1,
                                userId: 1,
                                status: 1,
                                price: "$products.price",
                                ven_id: "$products.ven_id",
                                item: "$products.item",
                                quantity: "$products.quantity",
                                order_status: "$products.order_status",
                                totalAmount: 1,
                                netAmount: 1,
                                discount: { $subtract: ["$totalAmount","$netAmount"] }
                            },
                        },    
                    ])
                    .toArray();
                resolve(orderItems);
            });
        } catch (err) {
            console.log(err);
        }
    },

    /*Change the payment status of customer by vendor id 
    ============================================= */
    changeOrderstatusByvendor: (details) => {
        try {
            let status  =   details.status;
            let orderId =   details.order_id;
            let venId   =   details.ven_id;
            return new Promise((resolve, reject) => {
                db.get()
                    .collection(collection.ORDER_COLLECTION)
                    .update(
                        {
                            _id: objectId(orderId),
                        },
                        {
                            $set: {
                                "products.$[elem].order_status": status,
                            },
                        },
                        {
                            multi: true,
                            arrayFilters: [{ "elem.ven_id": objectId(venId) }],
                        }
                    )
                    .then(() => {
                        resolve();
                    });
            });
        } catch (err) {
            console.log(err);
        }
    },

    /*=============================             Order Section (Admin)         ============================== */

    /*Get All Customer Orders 
    ============================================= */
    getUserOrdersByproducts: () => {
        try {
            return new Promise(async (resolve, reject) => {
                let orderItems = await db
                    .get()
                    .collection(collection.ORDER_COLLECTION)
                    .aggregate([
                        {
                            $unwind: "$products",
                        },
                        {
                            $match: {
                                $or: [{ "products.order_status": "placed" }, { "products.order_status": "pending" }],
                            },
                        },
                        {
                            $project: {
                                userId: 1,
                                ven_id: "$products.ven_id",
                                item: "$products.item",
                                quantity: "$products.quantity",
                                price: "$products.price",
                                order_status: "$products.order_status",
                                paymentMethod: 1,
                                created_date: { $dateToString: { format: "%d-%m-%Y", date: "$created_date" } },
                                created_date_string: { $dateToString: { format: "%Y%m%d", date: "$created_date" } }
                            },
                        },
                        {
                            $lookup: {
                                from: collection.PRODUCT_COLLECTION,
                                localField: "item",
                                foreignField: "_id",
                                as: "product",
                            },
                        },
                        {
                            $lookup: {
                                from: collection.USERS_COLLECTION,
                                localField: "userId",
                                foreignField: "_id",
                                as: "users",
                            },
                        },
                        {
                            $lookup: {
                                from: collection.VENDOR_COLLECTION,
                                localField: "ven_id",
                                foreignField: "_id",
                                as: "vendor",
                            },
                        },
                        {
                            $unwind: "$product",
                        },
                        {
                            $unwind: "$vendor",
                        },
                        {
                            $unwind: "$users",
                        },
                        {
                            $addFields: {
                                convertedPrice: { $toDouble: "$price" },
                                convertedQty: { $toInt: "$quantity" },
                                convertedGrossPrice: { $toDouble: "$product.price" },
                              
                            },
                        },
                        {
                            $project: {
                                product_name: "$product.product_name",
                                ven_shop: "$vendor.ven_shop",
                                user_name: "$users.first_name",
                                totalAmount: { $multiply: ["$convertedPrice", "$convertedQty"] },
                                grossAmount: { $multiply: ["$convertedGrossPrice", "$convertedQty"] },
                                quantity: "$products.quantity",
                                paymentMethod: 1,
                                order_status: 1,
                                created_date: 1,
                                created_date_string:1
                            },
                        },
                        { $sort: { _id: -1 } },
                      
                    ])
                    .toArray();
                resolve(orderItems);
            });
        } catch (err) {
            console.log(err);
        }
    },

    /*Get All Order History 
    ============================================= */
    getUserOrderHistoryByproducts: () => {
        try {
            return new Promise(async (resolve, reject) => {
                let orderItems = await db
                    .get()
                    .collection(collection.ORDER_COLLECTION)
                    .aggregate([
                        {
                            $unwind: "$products",
                        },
                        {
                            $match: {
                                $or: [{ "products.order_status": "completed" }, { "products.order_status": "cancelled" }],
                            },
                        },
                        {
                            $project: {
                                userId: 1,
                                ven_id: "$products.ven_id",
                                item: "$products.item",
                                quantity: "$products.quantity",
                                price: "$products.price",
                                order_status: "$products.order_status",
                                paymentMethod: 1,
                                created_date: { $dateToString: { format: "%d-%m-%Y", date: "$created_date" } },
                                created_date_string: { $dateToString: { format: "%Y%m%d", date: "$created_date" } }
                            },
                        },
                        {
                            $lookup: {
                                from: collection.PRODUCT_COLLECTION,
                                localField: "item",
                                foreignField: "_id",
                                as: "product",
                            },
                        },
                        {
                            $lookup: {
                                from: collection.USERS_COLLECTION,
                                localField: "userId",
                                foreignField: "_id",
                                as: "users",
                            },
                        },
                        {
                            $lookup: {
                                from: collection.VENDOR_COLLECTION,
                                localField: "ven_id",
                                foreignField: "_id",
                                as: "vendor",
                            },
                        },
                        {
                            $unwind: "$product",
                        },
                        {
                            $unwind: "$vendor",
                        },
                        {
                            $unwind: "$users",
                        },
                        {
                            $addFields: {                                
                                convertedPrice: { $toDouble: "$price" },
                                convertedQty: { $toInt: "$quantity" },
                            },
                        },                     
                        {
                            $project: {
                                totalAmount: { $multiply: ["$convertedPrice", "$convertedQty"] },
                                grossAmount: { $multiply: ["$product.price", "$convertedQty"] },
                                product_name: "$product.product_name",
                                ven_shop: "$vendor.ven_shop",
                                user_name: "$users.first_name",                               
                                quantity: "$products.quantity",
                                order_status: "$products.order_status",
                                paymentMethod: 1,
                                order_status: 1,
                                created_date: 1,
                                created_date_string: 1
                            },
                        },
                    ])
                    .toArray();
                resolve(orderItems);
            });
        } catch (err) {
            console.log(err);
        }
    },

    /*Get All Customer Orders  Based on Coupon
    ============================================= */
    getUserOrdersBycoupon: () => {
        try {
            return new Promise(async (resolve, reject) => {
                let orderItems = await db
                    .get()
                    .collection(collection.ORDER_COLLECTION)
                    .aggregate([
                        {
                            $unwind: "$products",
                        },                     
                        {
                            $lookup: {
                                from: collection.USERS_COLLECTION,
                                localField: "userId",
                                foreignField: "_id",
                                as: "users",
                            },
                        },
                        {
                            $unwind: "$users",
                        },
                        {
                            $lookup: {
                                from: collection.COUPON_COLLECTION,
                                localField: "coupon_id",
                                foreignField: "_id",
                                as: "coupon",
                            },
                        },
                        {
                            $unwind: "$coupon",
                        },
                        
                        {
                            $addFields: {
                                created_date: { $dateToString: { format: "%d-%m-%Y", date: "$created_date" } },
                                created_date_string: { $dateToString: { format: "%Y%m%d", date: "$created_date" } },
                                gross: {
                                    $divide: [
                                        "$totalAmount",
                                        { $subtract: [1, { $divide: ["$coupon.coupon_amount", 100] }] },
                                    ],
                                },
                            },
                        },
                        {
                            $group: {
                                _id: "$_id",
                                user_name: { $first: "$users.first_name" },
                                totalAmount: { $first: "$totalAmount" },
                                paymentMethod: { $first: "$paymentMethod" },
                                created_date: { $first: "$created_date" },
                                created_date_string: { $first: "$created_date_string" },
                                coupon_percent: { $first: "$coupon.coupon_amount" },
                                gross: { $first: "$gross" },
                            },
                        },
                        {
                            $sort: { _id: -1 },
                        },
                    ])
                    .toArray();
                resolve(orderItems);
            });
        } catch (err) {
            console.log(err);
        }
    },
};
