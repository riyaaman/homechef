var db = require("../config/connection");
var collection = require("../config/collections");
const bcrypt = require("bcrypt");
const { response } = require("express");

var objectId = require("mongodb").ObjectID;

module.exports = {
    /*------------------------------------- Category Management------------------------------------------------------
   ------------------------------------------------------------------------------------------------------------------*/

    /* Add Category Details
    ============================================= */
    add_Category: (categoryData) => {
        return new Promise(async (resolve, reject) => {
            categoryData.status = 1;
            let user = db
                .get()
                .collection(collection.CATEGORY_COLLECTION)
                .insertOne(categoryData)
                .then((categoryData) => {
                    resolve(categoryData.ops[0]);
                });
        });
    },

    /* Get All Categories
    ============================================= */
    get_Allcategories: () => {
        return new Promise(async (resolve, reject) => {
            let categories = await db.get().collection(collection.CATEGORY_COLLECTION).find().toArray();
            resolve(categories);
        });
    },

    /* Update Category
    ============================================= */
    update_Category: (catDetails, catId) => {
        return new Promise((resolve, reject) => {
            db.get()
                .collection(collection.CATEGORY_COLLECTION)
                .updateOne(
                    { _id: objectId(catId) },
                    {
                        $set: {
                            cat_name: catDetails.cat_name,
                        },
                    }
                )
                .then((response) => {
                    resolve();
                });
        });
    },

    /* Delete Category
    ============================================= */
    delete_Category: (catId) => {
        return new Promise((resolve, reject) => {
            db.get()
                .collection(collection.CATEGORY_COLLECTION)
                .removeOne({ _id: objectId(catId) })
                .then((category) => {
                    resolve(response);
                });
            // .catch(err => {
            //     console.error(err)
            //   })
        });
    },

    /*------------------------------------- Product Management------------------------------------------------------
   ------------------------------------------------------------------------------------------------------------------*/

    /* Add Product Details
    ============================================= */
    add_Product: (productData, vendor_id) => {
        return new Promise(async (resolve, reject) => {
            productData.status = 1;
            productData.vendor_id = objectId(vendor_id);
            let user = db
                .get()
                .collection(collection.PRODUCT_COLLECTION)
                .insertOne(productData)
                .then((productData) => {
                    resolve(productData.ops[0]);
                });
        });
    },

    /* Get All Products
    ============================================= */
    get_Allproducts: () => {
        return new Promise(async (resolve, reject) => {
            let products = await db
                .get()
                .collection(collection.PRODUCT_COLLECTION)
                .aggregate([
                    { $set: { cat_id: { $toObjectId: "$category" } } },
                    {
                        $lookup: {
                            from: collection.CATEGORY_COLLECTION,
                            localField: "cat_id",
                            foreignField: "_id",
                            as: "category",
                        },
                    },
                    {
                        $unwind: "$category",
                    },
                    { $set: { vendor_id: { $toObjectId: "$vendor_id" } } },
                    {
                        $lookup: {
                            from: collection.VENDOR_COLLECTION,
                            localField: "vendor_id",
                            foreignField: "_id",
                            as: "vendor",
                        },
                    },
                    {
                        $unwind: "$vendor",
                    },

                    {
                        $project: {
                            product_name: 1,
                            price: 1,
                            status: 1,
                            cat_id: "$category._id",
                            cat_name: "$category.cat_name",
                            ven_name: "$vendor.ven_name",
                            ven_shop: "$vendor.ven_shop",
                            ven_id: "$vendor._id",
                        },
                    },
                ])
                .toArray(function (err, products) {

                    if (err) throw err;
                    resolve(products);
                    //console.log(products);
                    //console.log(JSON.stringify(res));
                });
        });
    },

    /* Get Product By Vendor Id
    ============================================= */
    get_ProductsByVendorId: (vendorId) => {
        return new Promise(async (resolve, reject) => {
            let products = await db
                .get()
                .collection(collection.PRODUCT_COLLECTION)

                .aggregate([
                    {
                        $match: { vendor_id: objectId(vendorId) },
                    },
                    { $set: { cat_id: { $toObjectId: "$category" } } },
                    {
                        $lookup: {
                            from: collection.CATEGORY_COLLECTION,
                            localField: "cat_id",
                            foreignField: "_id",
                            as: "category",
                        },
                    },
                    {
                        $unwind: "$category",
                    },
                    { $set: { vendor_id: { $toObjectId: "$vendor_id" } } },
                    {
                        $lookup: {
                            from: collection.VENDOR_COLLECTION,
                            localField: "vendor_id",
                            foreignField: "_id",
                            as: "vendor",
                        },
                    },
                    {
                        $unwind: "$vendor",
                    },

                    {
                        $project: {
                            product_name: 1,
                            price: 1,
                            cat_id: "$category._id",
                            cat_name: "$category.cat_name",
                            ven_name: "$vendor.ven_name",
                            ven_id: "$vendor._id",
                        },
                    },
                ])
                .toArray();
            //console.log(products)
            //resolve(cartItems[0].cartItems)
            resolve(products);
        });
    },

    /* Get Product Count By Vendor Id
    ============================================= */
    get_AllproductCount_ByVenId: (vendorId) => {
        return new Promise(async (resolve, reject) => {
            let product_count = await db
                .get()
                .collection(collection.PRODUCT_COLLECTION)
                .find({ vendor_id: objectId(vendorId) })
                .count();
            if (product_count) {
                resolve(product_count);
            } else {
                resolve({ count_status: false });
            }
        });
    },

    /* Update product
    ============================================= */
    update_Product: (productDetails, productId) => {
        return new Promise((resolve, reject) => {
            db.get()
                .collection(collection.PRODUCT_COLLECTION)
                .updateOne(
                    { _id: objectId(productId) },
                    {
                        $set: {
                            product_name: productDetails.product_name,
                            price: productDetails.price,
                            category: productDetails.category,
                        },
                    }
                )
                .then((response) => {
                    resolve(response);
                });
        });
    },

    /* Delete product
    ============================================= */
    delete_Product: (productId) => {
        return new Promise((resolve, reject) => {
            db.get()
                .collection(collection.PRODUCT_COLLECTION)
                .removeOne({ _id: objectId(productId) })
                .then((product) => {
                    resolve(product);
                });
        });
    },
};
