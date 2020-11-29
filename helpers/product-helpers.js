var db              =   require('../config/connection')
var collection      =   require('../config/collections')
const bcrypt        =   require('bcrypt')
const { response }  =   require('express')

var objectId        =   require('mongodb').ObjectID


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
            // console.log("kilo",catDetails)
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
    add_Product: (productData,vendor_id) => {
       
        return new Promise(async (resolve, reject) => {
            productData.status      =   1;
            productData.vendor_id   =   objectId(vendor_id);
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
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray();
            resolve(products);

            // let product_details = db
            //     .get()
            //     .collection(collection.PRODUCT_COLLECTION)
            //     .aggregate([
            //         {
            //             $lookup: {
            //                 from: collection.CATEGORY_COLLECTION,
            //                 localField: "category",
            //                 foreignField: "_id",
            //                 as: "product",
            //             },
            //         },
                    // {
                    //     $unwind:'$product'
                    // }
                    // {
                    
                    //     $project:{
                    //         cat_name:1,product_name:1,product:{$arrayElemAt:['$product',0]}                    
                            
                    //     }
                    // },
                // ]).toArray()
                // // console.log("total-----------------",total[0].total)
                // resolve(product_details)
                // .toArray(function (err, res) {
                //     if (err) throw err;

                //     console.log("json:",JSON.stringify(res));

                //     // resolve(res);
                //     console.log("hai:",res[0].product);
                //     //console.log("mn:",res[0].product);
                // });
            // .toArray()
            // resolve(product_details)

           
          // console.log(product_details[0].product)
           
        });
    },

    /* Get Product By Vendor Id
    ============================================= */
    get_ProductsByVendorId:(vendorId)=>{
        
        return new Promise (async(resolve,reject)=>{
            let products =  await db.get().collection(collection.PRODUCT_COLLECTION)
            
            .aggregate([
                {
                    $match:{vendor_id:objectId(vendorId)}
                },
                {$set: {cat_id: {$toObjectId: "$category"} }},
                {
                    $lookup:{
                       from:collection.CATEGORY_COLLECTION,
                       localField:"cat_id",
                       foreignField:"_id",
                       as:'category'

                    }
                 },
                 {
                    $unwind:'$category'
                },
              
              
                {
                 
                    $project:{
                        product_name : 1,
                        price        : 1,
                        cat_id       : '$category._id',                     
                        cat_name     : '$category.cat_name',
                         
                    }
                  
                 },

            ]).toArray()
              //console.log(products)            
            //resolve(cartItems[0].cartItems)
            resolve(products)

        })
   
 
    },


      /* Get Product Count By Vendor Id
    ============================================= */
    get_AllproductCount_ByVenId: (vendorId) => {
        return new Promise(async (resolve, reject) => {
            let product_count = await db.get().collection(collection.PRODUCT_COLLECTION)           
            .find({vendor_id:objectId(vendorId)}).count();
            if(product_count){
                resolve(product_count);
            }
            else{
                resolve({count_status:false})
            }

        });
    },




    /* Update product
    ============================================= */
    update_Product: (productDetails, productId) => {
        return new Promise((resolve, reject) => {
          //   console.log("kilo",productDetails.product_name)
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
       
        console.log("helper:",productId)
        return new Promise((resolve, reject) => {
       
            db.get()
                .collection(collection.PRODUCT_COLLECTION)
                .removeOne({ _id: objectId(productId) })
                .then((product) => {
                    resolve(product);
                })
            
        });
    }


    
}