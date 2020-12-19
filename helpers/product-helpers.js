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
            let categories = await db.get().collection(collection.CATEGORY_COLLECTION).find({ status: 1 }).toArray();
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
                .updateOne(
                    { _id: objectId(catId) },
                    {
                        $set: {
                            status: 0,
                        },
                    }
                )
                .then((response) => {
                    resolve();
                });
            // db.get()
            //     .collection(collection.CATEGORY_COLLECTION)
            //     .removeOne({ _id: objectId(catId) })
            //     .then((category) => {
            //         resolve(response);
            //     });
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
                        $match: { vendor_id: objectId(vendorId), status: 1 },
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
            .updateOne(
                {_id: objectId(productId)  },
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
    },

    /* Get Product Name By Vendor Id
    ============================================= */
    get_ProductsName_ByVendorId: (vendorId) => {
        return new Promise(async (resolve, reject) => {
            let products = await db
                .get()
                .collection(collection.PRODUCT_COLLECTION)
                .aggregate([
                    {
                        $match: { vendor_id: objectId(vendorId), status: 1 },
                    },
                    {
                        $project: {
                            product_name: 1,
                        },
                    },
                ])
                .toArray();
            resolve(products);
        });
    },




      /*------------------------------------- Sales Report For Vendor-----------------------------------------------
   ------------------------------------------------------------------------------------------------------------------*/


    /*View Sales Report By Vendor Id 
    ============================================= */
    view_SalesReport_Byvendor: (vendorId) => {

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
                            totalAmount: { $multiply: ["$convertedPrice", "$convertedQty"] },
                        },
                    },
                ])
                .toArray();
            resolve(orderItems);
        });
    },

    /*View Sales Report By Vendor Id, Date &Status
    ============================================= */
    view_SalesReport_ByDate_Id_status: (vendorId, dates) => {
        start = dates.start;
        end = dates.end;
        status = dates.status;
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
                            // $or:
                            // [
                            //    { order_status: status },

                            // ]
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
                            totalAmount: { $multiply: ["$convertedPrice", "$convertedQty"] },
                        },
                    },
                ])
                .toArray();
            resolve(orderItems);
        });
    },

    /*View Sales Report By Vendor Id, Date 
    ============================================= */
    view_SalesReport_ByDate_Id: (vendorId, dates) => {
        start = dates.start;
        end = dates.end;
        status = dates.status;
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
                            totalAmount: { $multiply: ["$convertedPrice", "$convertedQty"] },
                        },
                    },
                ])
                .toArray();
            resolve(orderItems);
        });
    },

    /*Get Customer  Order History By Vendor Id
    ============================================= */
    get_UserOrder_history_ByvendorId: (vendorId) => {
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
                        },
                    },
                    {
                        $group: {
                            _id: "$_id",
                            products: { $push: "$products" },
                            deliveryDetails: { $first: "$deliveryDetails" },
                            paymentMethod: { $first: "$paymentMethod" },
                            order_status: { $first: "$products.order_status" },
                            created_date: { $first: "$created_date" },
                        },
                    },
                ])
                .toArray();
            resolve(orders);
        });
    },

    /*Get Customer  Order Sales Report By Vendor Id and previous week
    ============================================= */
    get_SalesReport_ByvendorId_Week: (vendorId) => {
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
                            order_status: "$products.order_status",
                            // order_status: { $ne: [ "$products.order_status", "completed" ] }
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
                            totalAmount: { $multiply: ["$convertedPrice", "$convertedQty"] },
                        },
                    },
                ])
                .toArray();
            resolve(orderItems);
        });
    },

    /*Get Customer  Order Sales Report By Vendor Id and previous Month
    ============================================= */
    get_SalesReport_ByvendorId_Month: (vendorId) => {
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
                                    { $eq: [1, { $subtract: [{ $month: new Date() }, { $month: "$created_date" }] }] },
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
                            order_status: "$products.order_status",
                            // order_status: { $ne: [ "$products.order_status", "completed" ] }
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
                        },
                    },
                ])
                .toArray();
            //  console.log("vendor order:",orderItems)
            resolve(orderItems);
        });
    },

    /*------------------------------------- Chart Area Vendor------------------------------------------------------*/
  

    /*View Sales Report (Product Count) chart By Vendor Id 
    ============================================= */
    view_SalesReport_chart_Byvendor: (vendorId) => {
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
                            convertedPrice: { $toInt: "$product.price" },
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
    },

    /*View Sales Report (Product Amount)  Chart By Vendor Id 
    ============================================= */
    view_SalesReport_Chart_Amount_Byvendor: (vendorId) => {
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
                            convertedPrice: { $toInt: "$product.price" },
                            convertedQty: { $toInt: "$quantity" },
                            product_name: "$product.product_name",
                        },
                    },                  
                    {
                        $group: {
                            _id: "$item",
                            product_name: { $first: "$product.product_name" },               
                           totalAmount: { $sum: { $multiply: [ "$convertedPrice", "$convertedQty" ] } },
                        },
                    },                  
                ])
                .toArray();
            // console.log("vendor order:",orderItems)
            resolve(orderItems);
        });
    },

    /*View Sales Report chart by Month 
    ============================================= */
    view_SalesReport_Chart_Month_Byvendor: (vendorId) => {
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
                                            { $eq: [{ $year: "$created_date" }, { $year: new Date() }] },
                                            {
                                                $eq: [
                                                    1,
                                                    { $subtract: [{ $month: new Date() }, { $month: "$created_date" }] },
                                                ],
                                            },
                                        ],
                                    },
                                ],
                            },
                        },
                    },
                    {
                        $project: {
                            created_date: 1,
                            created: { $dateToString: { format: "%d-%m-%Y", date: "$created_date" } },
                            item: "$products.item",
                            quantity: "$products.quantity",
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
                            _id: {
                                month: { $month: "$created_date" },
                                // day: { $dayOfMonth: "$created_date" },
                                year: { $year: "$created_date" },
                            },
                            totalPrice: { $sum: { $multiply: ["$convertedPrice", "$convertedQty"] } },
                            count: { $sum: 1 },
                        },
                    },
                ])
                .toArray();
            //console.log("vendor order1:", orderItems);
            resolve(orderItems);
        });
    },




    
    /*------------------------------------- Sales Report For Admin-----------------------------------------------
   ------------------------------------------------------------------------------------------------------------------*/

    /*Get all Sales Report 
    ============================================= */
    get_All_Sales_Report: () => {

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
                            item: "$products.item",
                            product_name: "$products.product_name",
                            quantity: "$products.quantity",
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
                            totalAmount: { $multiply: ["$convertedPrice", "$convertedQty"] },
                        },
                    },
                ])
                .toArray();
            resolve(orderItems);
        });
    },

     /*Get Customer  Order Sales Report Of Previous week
    ============================================= */
    get_SalesReport_Byweek: () => {
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
                            totalAmount: { $multiply: ["$convertedPrice", "$convertedQty"] },
                        },
                    },
                ])
                .toArray();
            resolve(orderItems);
        });
    },

    /*Get Customer  Order Sales Report Of  Previous Month
    ============================================= */
    get_SalesReport_Bymonth: () => {
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
                                    { $eq: [1, { $subtract: [{ $month: new Date() }, { $month: "$created_date" }] }] },
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
                            totalAmount: { $multiply: ["$convertedPrice", "$convertedQty"] },
                        },
                    },
                ])
                .toArray();
            resolve(orderItems);
        });
    },

     /*View Sales Report By  Date &Status
    ============================================= */
    view_SalesReport_ByDate_Status: (dates) => {
        start = dates.start;
        end = dates.end;
        status = dates.status;
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
                            // $or:
                            // [
                            //    { order_status: status },

                            // ]
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
                            totalAmount: { $multiply: ["$convertedPrice", "$convertedQty"] },
                        },
                    },
                ])
                .toArray();
            resolve(orderItems);
        });
    },

    /*View Sales Report By Date 
    ============================================= */
    view_SalesReport_ByDate: (dates) => {
        start = dates.start;
        end = dates.end;
        status = dates.status;
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
                            totalAmount: { $multiply: ["$convertedPrice", "$convertedQty"] },
                        },
                    },
                ])
                .toArray();
            resolve(orderItems);
        });
    },

     /*------------------------------------- Chart Area Admin------------------------------------------------------*/


    /*View Sales Report (Product Amount)  Chart 
    ============================================= */
    view_SalesReport_Chart_Product_Amount: () => {
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
                                   // { $eq: [{ $dayOfMonth: new Date() }, { $dayOfMonth: "$created_date" }] },
                                ],
                            },
                        },
                    },
                    {
                        $project: {
                            item: "$products.item",
                            quantity: "$products.quantity",
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
                            convertedPrice: { $toInt: "$product.price" },
                            convertedQty: { $toInt: "$quantity" },
                            product_name: "$product.product_name",
                        },
                    },                  
                    {
                        $group: {
                            _id: "$item",
                            product_name: { $first: "$product.product_name" },               
                           totalAmount: { $sum: { $multiply: [ "$convertedPrice", "$convertedQty" ] } },
                        },
                    },                  
                ])
                .toArray();
            console.log("vendor order:",orderItems)
            resolve(orderItems);
        });
    },

};
