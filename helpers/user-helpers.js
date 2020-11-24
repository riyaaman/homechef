
var db              =   require('../config/connection')
var collection      =   require('../config/collections')
const bcrypt        =   require('bcrypt')
const { response }  =   require('express')

var objectId        =   require('mongodb').ObjectID


module.exports={
    
   
     /* Login For Admin
    ============================================= */
    doLogin:(adminData)=>{

        return new Promise(async(resolve,reject)=>{
            let loginStatus     =   false
            let response        =   {}  //null object created
            let user            =   await db.get().collection(collection.USER_COLLECTION).findOne({username:adminData.username})
            if(user){
                bcrypt.compare(adminData.password,user.password).then((loginStatus)=>{
                    if(loginStatus){
                      
                        response.user           =   user
                        response.loginStatus    =   true
                        resolve(response)
                    }
                    else{
                      
                        resolve({loginStatus:false})
                    }
                })


            }
            else{
                //  console.log("email not registered")
                resolve({status:false})
            }
           
        })
    },

    

     /* SignUp For Vendors
    ============================================= */
    doSignup_Vendor:(vendorData)=>{
       
        // console.log(vendorData)
        let signup_status   =   true
        return new Promise(async(resolve,reject)=>{
            
            vendorData.password     =   await bcrypt.hash(vendorData.ven_password,10)               
           
            var vendorDetails = { ven_name:vendorData.ven_name,ven_shop:vendorData.ven_shop_name,
                ven_phone:vendorData.ven_phone,ven_email:vendorData.ven_email,
                ven_password:vendorData.password,status:"vendor",active:"true",created:new Date() };
                
            let user            =   await db.get().collection(collection.VENDOR_COLLECTION).findOne({ven_email:vendorData.ven_email})
            // console.log(vendorDetails)
            if(user){
                resolve({signup_status:false})
            //   console.log("failed")
            }
            else{                   
                db.get().collection(collection.VENDOR_COLLECTION).insertOne(vendorDetails).then((vendorDetails)=>{
                     resolve(vendorDetails.ops[0])
                    // console.log(vendorDetails.ops[0])
                })
            }

         
        })
    },

     /* Login For Vendors
    ============================================= */
    doLogin_Vendor:(vendorData)=>{

        return new Promise(async(resolve,reject)=>{
            let loginStatus     =   false
            let response        =   {}  //null object created
            let user            =   await db.get().collection(collection.VENDOR_COLLECTION).findOne({ven_email:vendorData.email})
            if(user){
                bcrypt.compare(vendorData.password,user.ven_password).then((loginStatus)=>{
                    if(loginStatus){
                      
                        response.user           =   user
                        response.loginStatus    =   true
                        resolve(response)
                    }
                    else{
                      
                        resolve({loginStatus:false})
                    }
                })


            }
            else{
                //  console.log("email not registered")
                resolve({status:false})
            }
           
        })
    },

}