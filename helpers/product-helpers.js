var db              =   require('../config/connection')
var collection      =   require('../config/collections')
const bcrypt        =   require('bcrypt')
const { response }  =   require('express')

var objectId        =   require('mongodb').ObjectID


module.exports={
    
  
  /* Add Category Details
    ============================================= */
    add_Category:(categoryData)=>{
        
        return new Promise(async(resolve,reject)=>{
                categoryData.status =1
                let user =  db.get().collection(collection.CATEGORY_COLLECTION).insertOne(categoryData).then((categoryData)=>{
                   
                    resolve(categoryData.ops[0])
                })
            
         
        })
    },


    /* Get All Categories
    ============================================= */
    get_Allcategories:()=>{
        return new Promise (async(resolve,reject)=>{
            let categories     =   await db.get().collection(collection.CATEGORY_COLLECTION).find().toArray()           
            resolve(categories)

        })
    },

     /* Update Category
    ============================================= */
    update_Category:(catDetails,catId)=>{
        return new Promise((resolve,reject)=>{
            // console.log("kilo",catDetails)
            db.get().collection(collection.CATEGORY_COLLECTION).
            updateOne({_id:objectId(catId)},{
                $set:{
                    cat_name    :   catDetails.cat_name  
                }
            }).then((response)=>{
                resolve()
            })
        })
    },


     /* Delete Category
    ============================================= */
    delete_Category:(catId)=>{
        return new Promise((resolve,reject)=>{
                db.get().collection(collection.CATEGORY_COLLECTION).removeOne({_id:objectId(catId)}).then((category)=>{
                    resolve(response)
                    
                })
                // .catch(err => {
                //     console.error(err)
                //   })
        })
    },


}