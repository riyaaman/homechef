var db = require("../config/connection");
var collection = require("../config/collections");
const bcrypt = require("bcrypt");
const { response } = require("express");
var objectId = require("mongodb").ObjectID;

module.exports = {
    /*=============================              Category Management         ============================== */

    /* Add Category Details
    ============================================= */
    addCategory: (categoryData) => {
        try {
            return new Promise(async (resolve) => {
                let categoryDetails = await db.get()
                    .collection(collection.CATEGORY_COLLECTION)
                    .find({ $and: [ {cat_name:categoryData.cat_name }, { status:1 } ] }).count()       
                   if(categoryDetails){
                        resolve({isCategory:true})
                   }
                   else{
                    categoryData.status = 1;
                    db.get()
                        .collection(collection.CATEGORY_COLLECTION)
                        .insertOne(categoryData)
                        .then((categoryData) => {
                            resolve(categoryData.ops[0])
                        }) 
                   }
            });
        } catch (err) {
            console.log(err);
        }
    },

    /* Get All Categories
    ============================================= */
    getAllcategories: () => {
        try {
            return new Promise(async (resolve, reject) => {
                let categories = await db.get().collection(collection.CATEGORY_COLLECTION).find({ status: 1 }).toArray();
                resolve(categories);
            });
        } catch (err) {
            console.log(err);
        }
    },

    /* Update Category
    ============================================= */
    updateCategory: (catDetails, catId) => {
        try {
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
        } catch (err) {
            console.log(err);
        }
    },

    /* Delete Category
    ============================================= */
    deleteCategory: (catId) => {
        try {
            return new Promise((resolve, reject) => {
                db.get()
                    .collection(collection.CATEGORY_COLLECTION)
                    .updateOne(
                        { _id: objectId(catId) },
                        {
                            $set: {
                                status: 0,
                            },
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

    /*================================           Product Management             ==================================== */

    /* Add Product Details
    ============================================= */
    addProduct: (productData) => {
        try {
            return new Promise(async (resolve, reject) => {
                productData.status = 1;
                productData.created = new Date()
                productData.vendor_id = objectId(productData.vendor_id);
                productData.price = parseFloat(productData.price);
                productData.discount_price = parseFloat(productData.discount_price);
                db.get()
                    .collection(collection.PRODUCT_COLLECTION)
                    .insertOne(productData)
                    .then((productData) => {
                        resolve(productData.ops[0]);
                    });
            });
        } catch (err) {
            console.log(err);
        }
    },

    /* Get All Products
    ============================================= */
    getAllProducts: () => {
        try {
            return new Promise(async (resolve, reject) => {
                let products = await db
                    .get()
                    .collection(collection.PRODUCT_COLLECTION)
                    .aggregate([
                        {
                            $match:{
                                status:1
                            }
                        },
                        { $sort: { _id: -1 } },
                        { $set: { cat_id: { $toObjectId: "$category" },
                        convertedPrice: { $toDouble: "$price" },
                        convertedDiscPrice: { $convert: { input: "$discount_price", to: "double", onError: 0 } }, } },
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
                            $set: {
                                percent: {
                                    $ceil: {
                                        $subtract: [
                                            100,
                                            { $multiply: [{ $divide: ["$convertedDiscPrice", "$convertedPrice"] }, 100] },
                                        ],
                                    },
                                },
                            },
                        },                       
                        {
                            $project: {
                                product_name: 1,
                                price: 1,
                                status: 1,
                                discount_price:1,
                                cat_id: "$category._id",
                                cat_name: "$category.cat_name",
                                ven_name: "$vendor.ven_name",
                                ven_shop: "$vendor.ven_shop",
                                ven_id: "$vendor._id",
                                percent: {
                                    $cond: {
                                        if: { $eq: [100, "$percent"] },
                                        then: "$$REMOVE",
                                        else: "$percent",
                                    },
                                },
                            },
                        },
                    ])
                    .toArray(function (err, products) {
                        if (err) throw err;
                        resolve(products);
                        //console.log(JSON.stringify(res));
                    });
            });
        } catch (err) {
            console.log(err);
        }
    },

    /* Get Product By Vendor Id
    ============================================= */
    getProductsByVendorId: (vendorId) => {
        try {
            return new Promise(async (resolve, reject) => {
                let products = await db
                    .get()
                    .collection(collection.PRODUCT_COLLECTION)
                    .aggregate([
                        {
                            $match: { vendor_id: objectId(vendorId), status: 1 },
                        },
                        {
                            $set: {
                                cat_id: { $toObjectId: "$category" },
                                convertedPrice: { $toDouble: "$price" },
                                convertedDiscPrice: { $convert: { input: "$discount_price", to: "double", onError: 0 } },
                            },
                        },
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
                            $set: {
                                percent: {
                                    $ceil: {
                                        $subtract: [
                                            100,
                                            { $multiply: [{ $divide: ["$convertedDiscPrice", "$convertedPrice"] }, 100] },
                                        ],
                                    },
                                },
                            },
                        },
                        {
                            $project: {
                                product_name: 1,
                                price: 1,
                                discount_price: 1,
                                product_description: 1,
                                cat_id: "$category._id",
                                cat_name: "$category.cat_name",
                                ven_name: "$vendor.ven_name",
                                ven_id: "$vendor._id",
                                percent: {
                                    $cond: {
                                        if: { $eq: [100, "$percent"] },
                                        then: "$$REMOVE",
                                        else: "$percent",
                                    },
                                },
                            },
                        }
                    ])
                    .toArray();
                resolve(products);
            });
        } catch (err) {
            console.log(err);
        }
    },

    /* Get Product Count By Vendor Id
    ============================================= */
    get_AllproductCount_ByVenId: (vendorId) => {
        try {
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
        } catch (err) {
            console.log(err);
        }
    },

    /* Get  Product Details  by Product Id 
    ============================================= */
    getProductDetailsByProductId: (productId) => {
        try {
            return new Promise((resolve, reject) => {
                db.get()
                    .collection(collection.PRODUCT_COLLECTION)
                    .findOne({ _id: objectId(productId) })
                    .then((product) => {
                        resolve(product);
                    });
            });
        } catch (err) {
            console.log(err);
        }
    },

    /* Update product
    ============================================= */
    updateProduct: (productDetails, productId) => {
        try {
            return new Promise((resolve, reject) => {
                db.get()
                    .collection(collection.PRODUCT_COLLECTION)
                    .updateOne(
                        { _id: objectId(productId) },
                        {
                            $set: {
                                product_name: productDetails.product_name,
                                price: parseFloat(productDetails.price),
                                category: productDetails.category,
                                discount_price: parseFloat(productDetails.discount_price),
                                product_description: productDetails.product_description,
                            },
                        }
                    )
                    .then((response) => {
                        resolve(response);
                    });
            });
        } catch (err) {
            console.log(err);
        }
    },

    /* Delete product
    ============================================= */
    deleteProduct: (productId) => {
        try {
            return new Promise((resolve, reject) => {
                db.get()
                    .collection(collection.PRODUCT_COLLECTION)
                    .updateOne(
                        { _id: objectId(productId) },
                        {
                            $set: {
                                status: 0,
                            },
                        }
                    )
                    .then((response) => {
                        resolve(response);
                    });
            });
        } catch (err) {
            console.log(err);
        }
    },

    /* Get Product Name By Vendor Id
    ============================================= */
    // get_ProductsName_ByVendorId: (vendorId) => {
    //     try {
    //         return new Promise(async (resolve, reject) => {
    //             let products = await db
    //                 .get()
    //                 .collection(collection.PRODUCT_COLLECTION)
    //                 .aggregate([
    //                     {
    //                         $match: { vendor_id: objectId(vendorId), status: 1 },
    //                     },
    //                     {
    //                         $project: {
    //                             product_name: 1,
    //                         },
    //                     },
    //                 ])
    //                 .toArray();
    //             resolve(products);
    //         });
    //     } catch (err) {
    //         console.log(err);
    //     }
    // },

    /*================================           Sales Report For Vendor             ================================ */

    /*Get Order Count, sale Quantity, Total Amount By Vendor Id
    ============================================= */
    getCountByvendor: (vendorId) => {
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
                            $match: { "products.ven_id": objectId(vendorId) },
                        },
                        {
                            $project: {
                                // created: { $dateToString: { format: "%d-%m-%Y", date: "$created_date" } },
                                item: "$products.item",
                                product_name: "$products.product_name",
                                quantity: "$products.quantity",
                                price: "$products.price",
                                order_status: "$products.order_status",
                                ven_id: "$products.ven_id",
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
                            $group: {
                                _id: null,
                                order_count: { $sum: 1 },
                                total_amount: { $sum: { $multiply: ["$price", "$convertedQty"] } },
                                sale_quantity: { $sum: "$quantity" },
                            },
                        },
                        {
                            $project: {
                                order_count: 1,
                                sale_quantity: 1,
                                total_amount: { $divide: ["$total_amount", 1000] },
                            },
                        },
                    ])
                    .toArray();
                resolve(orderItems[0]);
            });
        } catch (err) {
            console.log(err);
        }
    },


    /*Get Order Count By Vendor Id
    ============================================= */
    getProductCountByvendor: (vendorId) => {
        try {
            return new Promise(async (resolve, reject) => {
                let product_count = await db
                    .get()
                    .collection(collection.PRODUCT_COLLECTION)
                    .find({ vendor_id: objectId(vendorId),status: 1 })
                    .count();
                resolve(product_count);
            });
        } catch (err) {
            console.log(err);
        }
    },

    /*View Sales Report By Vendor Id 
    ============================================= */
    viewSalesReportByvendor: (vendorId) => {
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
                            $match: { "products.ven_id": objectId(vendorId) },
                        },
                        {
                            $project: {
                                created: { $dateToString: { format: "%d-%m-%Y", date: "$created_date" } },
                                item: "$products.item",
                                product_name: "$products.product_name",
                                quantity: "$products.quantity",
                                price: "$products.price",
                                order_status: "$products.order_status",
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
                                orginalAmount: { $multiply: ["$convertedPrice", "$convertedQty"] },
                                totalAmount: { $multiply: ["$price", "$convertedQty"] },
                            },
                        },
                        {
                            $set: {
                                discount1:{ $divide: ["$totalAmount", "$quantity"] }                                
                            }
                        },
                        {
                            $addFields: {                                
                                discount:
                                {
                                    $cond: { if: { $eq: [ "$discount1","$convertedPrice" ] }, then:null, else: "$discount1" }
                                }
                                                          
                            },
                        }
                    ])
                    .toArray();
                resolve(orderItems);
            });
        } catch (err) {
            console.log(err);
        }
    },

    /*View Sales Report By Vendor Id, Date &Status
    ============================================= */
    viewSalesReportByDateIdAndstatus: (vendorId, dates) => {
        try {
            let start   =   dates.start;
            let end     =   dates.end;
            let status  =   dates.status;
            return new Promise(async (resolve, reject) => {
                let orderItems = await db
                    .get()
                    .collection(collection.ORDER_COLLECTION)
                    .aggregate([
                        {
                            $unwind: "$products",
                        },
                        {
                            $match: { "products.ven_id": objectId(vendorId) }
                        },
                        {
                            $project: {
                                created: { $dateToString: { format: "%d-%m-%Y", date: "$created_date" } },
                                created_date: { $dateToString: { format: "%Y-%m-%d", date: "$created_date" } },
                                item: "$products.item",
                                product_name: "$products.product_name",
                                quantity: "$products.quantity",
                                price: "$products.price",
                                order_status: "$products.order_status",
                            },
                        },
                        {
                            $match: {
                                created_date: {
                                    $gte: start,
                                    $lte: end,
                                },
                                order_status: status,
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
                                convertedPrice: { $toDecimal: "$product.price" },
                                convertedQty: { $toInt: "$quantity" },
                            },
                        },
                        {
                            $set: {
                                grossAmount: { $multiply: ["$convertedPrice", "$convertedQty"] },
                                totalAmount: { $multiply: ["$price", "$convertedQty"] },
                            },
                        },
                        {
                            $set: {
                                discount1:{ $divide: ["$totalAmount", "$quantity"] }                                
                            }
                        },
                        {
                            $addFields: {                                
                                discount:
                                {
                                    $cond: { if: { $eq: [ "$discount1","$convertedPrice" ] }, then:null, else: "$discount1" }
                                }
                                                          
                            },
                        }
                    ])
                    .toArray();
                resolve(orderItems);
            });
        } catch (err) {
            console.log(err);
        }
    },

    /*View Sales Report By Vendor Id, Date 
    ============================================= */
    viewSalesReportByDateAndId: (vendorId, dates) => {
        try {
            let start = dates.start;
            let end = dates.end;
            let status = dates.status;
            return new Promise(async (resolve, reject) => {
                let orderItems = await db
                    .get()
                    .collection(collection.ORDER_COLLECTION)
                    .aggregate([
                        {
                            $unwind: "$products",
                        },
                        {
                            $match: { "products.ven_id": objectId(vendorId) },
                        },
                        {
                            $project: {
                                created: { $dateToString: { format: "%d-%m-%Y", date: "$created_date" } },
                                created_date: { $dateToString: { format: "%Y-%m-%d", date: "$created_date" } },
                                item: "$products.item",
                                product_name: "$products.product_name",
                                quantity: "$products.quantity",
                                price: "$products.price",
                                order_status: "$products.order_status",
                            },
                        },
                        {
                            $match: {
                                created_date: {
                                    $gte: start,
                                    $lte: end,
                                },
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
                                convertedPrice: { $toDecimal: "$product.price" },
                                convertedQty: { $toInt: "$quantity" },
                            },
                        },
                        {
                            $set: {
                                grossAmount: { $multiply: ["$convertedPrice", "$convertedQty"] },
                                totalAmount: { $multiply: ["$price", "$convertedQty"] },
                            },
                        },
                        {
                            $set: {
                                discount1:{ $divide: ["$totalAmount", "$quantity"] }                                
                            }
                        },
                        {
                            $addFields: {                                
                                discount:
                                {
                                    $cond: { if: { $eq: [ "$discount1","$convertedPrice" ] }, then:null, else: "$discount1" }
                                }
                                                          
                            },
                        }
                    ])
                    .toArray();
                resolve(orderItems);
            });
        } catch (err) {
            console.log(err);
        }
    },

    /*Get Customer  Order History By Vendor Id
    ============================================= */
    getUserOrderhistoryByvendorId: (vendorId) => {
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
                            $match: {
                                "products.ven_id": objectId(vendorId),
                                $or: [{ "products.order_status": "completed" }, { "products.order_status": "cancelled" }],
                            },
                        },
                        {
                            $set: {
                                created_date: { $dateToString: { format: "%d-%m-%Y", date: "$created_date" } },
                                created_date_string: { $dateToString: { format: "%Y%m%d", date: "$created_date" } }
                            },
                        },
                        {
                            $group: {
                                _id: "$_id",
                                products: { $push: "$products" },
                                deliveryDetails: { $first: "$deliveryDetails" },
                                paymentMethod: { $first: "$paymentMethod" },
                                total: { $first: "$products.price" },
                                order_status: { $first: "$products.order_status" },
                                created_date: { $first: "$created_date" },
                                created_date_string: { $first: "$created_date_string" },
                            },
                        },
                    ])
                    .toArray();
                resolve(orders);
            });
        } catch (err) {
            console.log(err);
        }
    },

    /*Get Customer  Order Sales Report By Vendor Id and previous week
    ============================================= */
    getSalesReportByvendorIdAndWeek: (vendorId) => {
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
                                created_date: {
                                    $gte: new Date(new Date() - 7 * 60 * 60 * 24 * 1000),
                                },
                            },
                        },
                        {
                            $project: {
                                //deliveryDetails: 1,
                                userId: 1,
                                status: 1,
                                created: { $dateToString: { format: "%d-%m-%Y", date: "$created_date" } },
                                ven_id: "$products.ven_id",
                                item: "$products.item",
                                product_name: "$products.product_name",
                                quantity: "$products.quantity",
                                price: "$products.price",
                                order_status: "$products.order_status"
                            },
                        },
                        {
                            $match: { ven_id: objectId(vendorId) },
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
                                convertedPrice: { $toDecimal: "$product.price" },
                                convertedQty: { $toInt: "$quantity" },
                            },
                        },
                        {
                            $set: {
                                // totalAmount: { $multiply: ["$convertedPrice", "$convertedQty"] },
                                orginalAmount: { $multiply: ["$convertedPrice", "$convertedQty"] },
                                totalAmount: { $multiply: ["$price", "$convertedQty"] },
                            },
                        },
                        {
                            $set: {
                                discount1:{ $divide: ["$totalAmount", "$quantity"] }                                
                            }
                        },
                        {
                            $addFields: {                                
                                discount:
                                {
                                    $cond: { if: { $eq: [ "$discount1","$convertedPrice" ] }, then:null, else: "$discount1" }
                                }
                                                          
                            },
                        }
                    ])
                    .toArray();
                resolve(orderItems);
            });
        } catch (err) {
            console.log(err);
        }
    },

    /*Get Customer  Order Sales Report By Vendor Id and previous Month
    ============================================= */
    getSalesReportByvendorIdAndMonth: (vendorId) => {
        try {
            let previousMonth = new Date();
            previousMonth.setMonth(previousMonth.getMonth() - 1);
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
                                "products.ven_id": objectId(vendorId),
                                $expr: {
                                    $and: [
                                        { $eq: [{ $year: "$created_date" }, { $year: previousMonth }] },
                                        { $eq: [{ $month: "$created_date" }, { $month: previousMonth }] },
                                    ],
                                },
                            },
                        },
                        {
                            $project: {
                                userId: 1,
                                status: 1,
                                created: { $dateToString: { format: "%d-%m-%Y", date: "$created_date" } },
                                ven_id: "$products.ven_id",
                                item: "$products.item",
                                product_name: "$products.product_name",
                                quantity: "$products.quantity",
                                price: "$products.price",
                                order_status: "$products.order_status"
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
                                grossAmount: { $multiply: ["$convertedPrice", "$convertedQty"] },
                                totalAmount: { $multiply: ["$price", "$convertedQty"] },
                            },
                        },
                    ])
                    .toArray();
                //  console.log("vendor order:",orderItems)
                resolve(orderItems);
            });
        } catch (err) {
            console.log(err);
        }
    },

    /*================================          Chart Area Vendor            ==================================== */

    /*View Sales Report (Product Count) chart By Vendor Id 
    ============================================= */
    view_SalesReport_chart_Byvendor: (vendorId) => {
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
                                created_date: {
                                    $gte: new Date(new Date() - 30 * 60 * 60 * 24 * 1000),
                                },
                                "products.ven_id": objectId(vendorId),
                            },
                        },
                        {
                            $lookup: {
                                from: collection.PRODUCT_COLLECTION,
                                localField: "products.item",
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
                        //  {
                        //     $set: {
                        //         totalAmount:{ $multiply: [ "$convertedPrice", "$convertedQty" ] },
                        //     },
                        // },
                        {
                            $group: {
                                _id: "$products.item",
                                product_name: { $first: "$product.product_name" },
                                count: { $sum: "$products.quantity" },
                            },
                        },

                        //   {
                        //     $project: {
                        //         totalAmount:{ $multiply: [ "$product.price", "$quantity" ] },
                        //         _id:1,
                        //         product_name:1,
                        //         count:1

                        //     },
                        // },
                    ])
                    .toArray();
                //   console.log(orderItems)
                resolve(orderItems);
            });
        } catch (err) {
            console.log(err);
        }
    },

    /*View Sales Report (Product Amount)  Chart By Vendor Id 
    ============================================= */
    viewSalesReportChartAmountByvendor: (vendorId) => {
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
                                "products.ven_id": objectId(vendorId),
                                $expr: {
                                    $and: [
                                        { $eq: [{ $year: "$created_date" }, { $year: new Date() }] },
                                        { $eq: [{ $month: new Date() }, { $month: "$created_date" }] },
                                    ],
                                },
                            },
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
                            $unwind: "$product",
                        },                       
                        {
                            $group: {
                                _id: "$item",
                                product_name: { $first: "$product.product_name" },
                                totalAmount: { $sum: { $multiply: ["$price", "$quantity"] } },
                            },
                        },
                    ])
                    .toArray();
                // console.log("vendor order:",orderItems)
                resolve(orderItems);
            });
        } catch (err) {
            console.log(err);
        }
    },

    /*View Sales Report chart by Month 
    ============================================= */
    viewSalesReportChartMonthByvendor: (vendorId) => {
        try {
            var previousMonth = new Date();
            previousMonth.setMonth(previousMonth.getMonth() - 1);
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
                                "products.ven_id": objectId(vendorId),
                                $expr: {
                                    $or: [
                                        {
                                            $and: [
                                                { $eq: [{ $year: "$created_date" }, { $year: new Date() }] },
                                                { $eq: [{ $month: new Date() }, { $month: "$created_date" }] },
                                            ],
                                        },
                                        {
                                            $and: [
                                                { $eq: [{ $year: "$created_date" }, { $year: previousMonth }] },
                                                { $eq: [{ $month: "$created_date" }, { $month: previousMonth }] },                                             
                                            ],
                                        },
                                    ],
                                },
                            },
                        },                        
                        {
                            $group: {
                                _id: {
                                    month: { $month: "$created_date" },
                                    year: { $year: "$created_date" }
                                },
                                totalPrice: { $sum: { $multiply: ["$products.price", "$products.quantity"] } },
                                count: { $sum: 1 },
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

    /*================================          Sales Report For Admin          ==================================== */

    /*Get Count Of vendors,products,customers and orders
    ============================================= */
    getCount: () => {
        try {
            return new Promise(async (resolve, reject) => {
                let count = {};
                count.vendor = await db.get().collection(collection.VENDOR_COLLECTION).find({ active: "true" }).count();
                count.product = await db.get().collection(collection.PRODUCT_COLLECTION).countDocuments();
                count.order = await db.get().collection(collection.ORDER_COLLECTION).countDocuments();
                count.customers = await db.get().collection(collection.USERS_COLLECTION).find({ active: "true" }).count();
                resolve(count);
            });
        } catch (err) {
            console.log(err);
        }
    },

    /*Get all Sales Report  For Admin
    ============================================= */
    getAllSalesReport: () => {
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
                            $project: {
                                created     : { $dateToString: { format: "%d-%m-%Y", date: "$created_date" } },
                                item        : "$products.item",
                                product_name: "$products.product_name",
                                quantity    : "$products.quantity",
                                price       : "$products.price",
                                order_status: "$products.order_status",
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
                                grossAmount: { $multiply: ["$convertedPrice", "$convertedQty"] },
                                totalAmount: { $multiply: ["$price", "$convertedQty"] },                               
                            },
                        },
                        {
                            $set: {
                                discount1:{ $divide: ["$totalAmount", "$quantity"] }                                
                            }
                        },
                        {
                            $addFields: {                                
                                discount:
                                {
                                    $cond: { if: { $eq: [ "$discount1","$convertedPrice" ] }, then:null, else: "$discount1" }
                                }
                                                          
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

    /*Get Customer  Order Sales Report Of Previous week For Admin
    ============================================= */
    getSalesReportByweek: () => {
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
                                created_date: {
                                    $gte: new Date(new Date() - 7 * 60 * 60 * 24 * 1000),
                                },
                            },
                        },
                        {
                            $project: {
                                userId: 1,
                                status: 1,
                                created: { $dateToString: { format: "%d-%m-%Y", date: "$created_date" } },
                                ven_id: "$products.ven_id",
                                item: "$products.item",
                                product_name: "$products.product_name",
                                quantity: "$products.quantity",
                                price: "$products.price",
                                order_status: "$products.order_status",
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
                                convertedPrice: { $toDecimal: "$product.price" },
                                convertedQty: { $toInt: "$quantity" },
                            },
                        },
                        {
                            $set: {
                                grossAmount: { $multiply: ["$convertedPrice", "$convertedQty"] },
                                totalAmount: { $multiply: ["$price", "$convertedQty"] },
                            },
                        },
                        {
                            $set: {
                                discount1:{ $divide: ["$totalAmount", "$quantity"] }                                
                            }
                        },
                        {
                            $addFields: {                                
                                discount:
                                {
                                    $cond: { if: { $eq: [ "$discount1","$convertedPrice" ] }, then:null, else: "$discount1" }
                                }
                                                          
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

    /*Get Customer  Order Sales Report Of  Previous Month
    ============================================= */
    getSalesReportBymonth: () => {
        try {
            let previousMonth = new Date();
            previousMonth.setMonth(previousMonth.getMonth() - 1);
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
                                $expr: {
                                    $and: [
                                        { $eq: [{ $year: "$created_date" }, { $year: previousMonth }] },
                                        { $eq: [{ $month: "$created_date" }, { $month: previousMonth }] },
                                    ],
                                },
                            },
                        },
                        {
                            $project: {
                                userId      : 1,
                                status      : 1,
                                created     : { $dateToString: { format: "%d-%m-%Y", date: "$created_date" } },
                                ven_id      : "$products.ven_id",
                                item        : "$products.item",
                                product_name: "$products.product_name",
                                quantity    : "$products.quantity",
                                price       : "$products.price",
                                order_status: "$products.order_status",
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
                                orginalAmount: { $multiply: ["$convertedPrice", "$convertedQty"] },
                                totalAmount: { $multiply: ["$price", "$convertedQty"] },
                            },
                        },
                        {
                            $set: {
                                discount1:{ $divide: ["$totalAmount", "$quantity"] }                                
                            }
                        },
                        {
                            $addFields: {                                
                                discount:
                                {
                                    $cond: { if: { $eq: [ "$discount1","$convertedPrice" ] }, then:null, else: "$discount1" }
                                }
                                                          
                            },
                        }
                    ])
                    .toArray();
                resolve(orderItems);
            });
        } catch (err) {
            console.log(err);
        }
    },

    /*View Sales Report By  Date &Status
    ============================================= */
    viewSalesReportByDateAndStatus: (dates) => {
        try {
            let start_date = dates.start;
            let end_date = dates.end;
            let status = dates.status;
            return new Promise(async (resolve, reject) => {
                let orderItems = await db
                    .get()
                    .collection(collection.ORDER_COLLECTION)
                    .aggregate([
                        {
                            $unwind: "$products",
                        },
                        {
                            $project: {
                                created: { $dateToString: { format: "%d-%m-%Y", date: "$created_date" } },
                                created_date: { $dateToString: { format: "%Y-%m-%d", date: "$created_date" } },
                                item: "$products.item",
                                product_name: "$products.product_name",
                                quantity: "$products.quantity",
                                price: "$products.price",
                                order_status: "$products.order_status",
                            },
                        },
                        {
                            $match: {
                                created_date: {
                                    $gte: start_date,
                                    $lte: end_date,
                                },
                                order_status: status,
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
                                convertedPrice: { $toDecimal: "$product.price" },
                                convertedQty: { $toInt: "$quantity" },
                            },
                        },
                        {
                            $set: {
                                grossAmount: { $multiply: ["$convertedPrice", "$convertedQty"] },
                                totalAmount: { $multiply: ["$price", "$convertedQty"] },
                            },
                        },
                        {
                            $set: {
                                discount1:{ $divide: ["$totalAmount", "$quantity"] }                                
                            }
                        },
                        {
                            $addFields: {                                
                                discount:
                                {
                                    $cond: { if: { $eq: [ "$discount1","$convertedPrice" ] }, then:null, else: "$discount1" }
                                }
                                                          
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

    /*View Sales Report By Date 
    ============================================= */
    viewSalesReportByDate: (dates) => {
        try {
            let start_date  =   dates.start;
            let end_date    =   dates.end;

            return new Promise(async (resolve, reject) => {
                let orderItems = await db
                    .get()
                    .collection(collection.ORDER_COLLECTION)
                    .aggregate([
                        {
                            $unwind: "$products",
                        },
                        {
                            $project: {
                                created: { $dateToString: { format: "%d-%m-%Y", date: "$created_date" } },
                                created_date: { $dateToString: { format: "%Y-%m-%d", date: "$created_date" } },
                                item: "$products.item",
                                product_name: "$products.product_name",
                                quantity: "$products.quantity",
                                price: "$products.price",
                                order_status: "$products.order_status",
                            },
                        },
                        {
                            $match: {
                                created_date: {
                                    $gte: start_date,
                                    $lte: end_date,
                                },
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
                                convertedPrice: { $toDecimal: "$product.price" },
                                convertedQty: { $toInt: "$quantity" },
                            },
                        },
                        {
                            $set: {
                                orginalAmount: { $multiply: ["$convertedPrice", "$convertedQty"] },
                                totalAmount: { $multiply: ["$price", "$convertedQty"] },
                            },
                        },
                        {
                            $set: {
                                discount1:{ $divide: ["$totalAmount", "$quantity"] }                                
                            }
                        },
                        {
                            $addFields: {                                
                                discount:
                                {
                                    $cond: { if: { $eq: [ "$discount1","$convertedPrice" ] }, then:null, else: "$discount1" }
                                }
                                                          
                            },
                        }
                    ])
                    .toArray();
                resolve(orderItems);
            });
        } catch (err) {
            console.log(err);
        }
    },

    /*================================          Chart Area Admin        ==================================== */

    /*View Sales Report (Product Amount)  Chart  one month For Admin
    ============================================= */
    viewSalesReportChartProductAndAmount: () => {
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
                                $expr: {
                                    $and: [
                                        { $eq: [{ $year: "$created_date" }, { $year: new Date() }] },
                                        { $eq: [{ $month: new Date() }, { $month: "$created_date" }] },
                                        { $eq: [{ $dayOfMonth: new Date() }, { $dayOfMonth: "$created_date" }] },
                                    ],
                                },
                            },
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
                            $unwind: "$product",
                        },
                        {
                            $addFields: {
                                convertedPrice: { $toDouble: "$product.price" },
                                convertedQty: { $toInt: "$quantity" },
                                product_name: "$product.product_name",
                            },
                        },
                        {
                            $group: {
                                _id: "$item",
                                product_name: { $first: "$product.product_name" },
                                totalAmount: { $sum: { $multiply: ["$price", "$convertedQty"] } },
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

    /*View Sales Report (Vendor Amount)  Chart onemonth
    ============================================= */
    viewSalesReportChartVendorAndAmount: () => {
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
                                $expr: {
                                    $and: [
                                        { $eq: [{ $year: "$created_date" }, { $year: new Date() }] },
                                        { $eq: [{ $month: new Date() }, { $month: "$created_date" }] }
                                    ],
                                },
                            },
                        },
                        {
                            $project: {
                                item: "$products.item",
                                quantity: "$products.quantity",
                                price: "$products.price",
                                ven_id: "$products.ven_id",
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
                            $unwind: "$vendor",
                        },                     
                        {
                            $group: {
                                _id: "$ven_id",
                                ven_shop: { $first: "$vendor.ven_shop" },
                                totalAmount: { $sum: { $multiply: ["$price", "$quantity"] } },
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

    /*================================        Coupon Management        ==================================== */

    /* Get All Coupon Details
    ============================================= */
    getCouponDetails: () => {
        try {
            return new Promise(async (resolve, reject) => {
                let coupon = await db
                    .get()
                    .collection(collection.COUPON_COLLECTION)
                    .aggregate([
                        { $match: { active: true } },
                        {
                            $set: {
                                expiry_date: { $dateToString: { format: "%d-%m-%Y", date: "$expiry_date" } },
                            },
                        }
                    ])
                    .toArray();
                resolve(coupon);
            });
        } catch (err) {
            console.log(err);
        }
    },

    /* Generate Coupon Code(Admin)
    ============================================= */
    generateCouponCode: () => {
        try {
            return new Promise(async (resolve, reject) => {
                var coupon = "";
                var possible = "abcdefghijklmnopqrstuvwxyz0123456789";
                for (var i = 0; i < 8; i++) {
                    coupon += possible.charAt(Math.floor(Math.random() * possible.length));
                }
                resolve(coupon);
            });
        } catch (err) {
            console.log(err);
        }
    },

    /* Add Coupon Details(Admin)
    ============================================= */
    addCoupon: (couponData) => {
        try {
            return new Promise(async (resolve) => {
                let coupon = await db
                    .get()
                    .collection(collection.COUPON_COLLECTION)
                    .findOne({ coupon_code: couponData.coupon_code });
                if (coupon) {
                    resolve({ isCoupon: true });
                } else {
                    couponData.active = true;
                    db.get()
                        .collection(collection.COUPON_COLLECTION)
                        .insertOne({
                            expiry_date: new Date(couponData.expiry_date),
                            coupon_code: couponData.coupon_code,
                            coupon_amount: parseInt(couponData.coupon_amount),
                            minimum_amount: parseFloat(couponData.minimum_amount),
                            active: true,
                        })
                        .then((couponData) => {
                            resolve(couponData.ops[0]);
                        });
                }
            });
        } catch (err) {
            console.log(err);
        }
    },

    /* Check  Coupon Available Or Not
    ============================================= */
    checkCouponAvailable: (couponData) => {
        try {
            return new Promise(async (resolve, reject) => {
                let coupon = await db.get().collection(collection.COUPON_COLLECTION).findOne({ coupon_code: couponData });
                if (coupon) {
                    resolve({ isCoupon: true });
                }
            });
        } catch (err) {
            console.log(err);
        }
    },

    /* Delete Coupon
    ============================================= */
    deleteCoupon: (CouponId) => {
        try {
            return new Promise((resolve, reject) => {
                db.get()
                    .collection(collection.COUPON_COLLECTION)
                    .updateOne(
                        { _id: objectId(CouponId) },
                        {
                            $set: {
                                active: false,
                            },
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
};
