var db = require("../config/connection");
var collection = require("../config/collections");
const bcrypt = require("bcrypt");
const { response } = require("express");

var objectId = require("mongodb").ObjectID;
paypal =  require('paypal-rest-sdk')

    paypal.configure({
    'mode': 'sandbox', //sandbox or live
    'client_id': 'ARz77seSj_48d8nnhv7Djub47ZZbnIC4LRxCwU_4-e2ZCoscT4cB3CIImB1EfUjAiJHoCPcCIVVw7BEO',
    'client_secret': 'EIjRRcHEQAwGECxM79M3YAXOUjCe8ID5cMxzCi8p2X3p5FloMQ6n2rxmbAhpv1-k5XktN3gq3ECA3D9c'
  });


  module.exports = {
        payNow:function(paymentData,callback){
            var response ={};
            
            /* Creating Payment JSON for Paypal starts */
            const payment = {
            "intent": "authorize",
            "payer": {
            "payment_method": "paypal"
            },
            "redirect_urls": {
            "return_url": "http://127.0.0.1:81/execute",
            "cancel_url": "http://127.0.0.1:81/cancel"
            },
            "transactions": [{
            "amount": {
            "total": paymentData.total,
            "currency": "USD"
            },
            "description": "Payment Description"
            }]
            };
            /* Creating Payment JSON for Paypal ends */
            
            /* Creating Paypal Payment for Paypal starts */
            paypal.payment.create(payment, function (error, payment) {
                if (error) {
                    console.log(error);
                } 
                else {
                    console.log("hi")
                    if(payment.payer.payment_method === 'paypal') {
                        response.paymentId = payment.id;
                            var redirectUrl;
                        response.payment = payment;
                        for(var i=0; i < payment.links.length; i++) {
                            var link = payment.links[i];
                            if (link.method === 'REDIRECT') {
                                redirectUrl = link.href;
                            }
                        }
                        response.redirectUrl = redirectUrl;
                        // console.log(response.redirectUrl)
                    }
                }
                    /* 
                    * Sending Back Paypal Payment response 
                    */
                    callback(error,response);
            });
            /* Creating Paypal Payment for Paypal ends */
            },
        getResponse:function(data,PayerID,callback){
        
            var response = {};
            const serverAmount = parseFloat(data.paypalData.payment.transactions[0].amount.total);
            const clientAmount = parseFloat(data.clientData.price);
            const paymentId = data.paypalData.paymentId;
            const details = {
                "payer_id": PayerID 
            };
            
            response.userData= {
                userID : data._id,
                name : data.first_name
                // userID : data.sessionData.userID,
                // name : data.sessionData.name
            };
            
            if (serverAmount !== clientAmount) {
                response.error = true;
                response.message = "Payment amount doesn't matched.";
                callback(response);
            }
            else{
                paypal.payment.execute(paymentId, details, function (error, payment) {
                    if (error) {
                        console.log(error);
                        response.error = false;
                        response.message = "Payment Successful.";
                        callback(response);
                    } 
                    else {
                    
                            /*
                            * inserting paypal Payment in DB
                            */
                            console.log("insert into database")
                            const insertPayment={
                                userId : data.sessionData.userID,
                                paymentId : paymentId,
                                createTime : payment.create_time,
                                state : payment.state,
                                currency : "USD",
                                amount: serverAmount,
                                createAt : new Date().toISOString()
                            }
                            
                            //self.insertPayment(insertPayment,function(result){
                            
                            // if(! result.isPaymentAdded){
                            // response.error = true;
                            // response.message = "Payment Successful, but not stored.";
                            // callback(response);
                            // }else{
                            // response.error = false;
                            // response.message = "Payment Successful.";
                            // callback(response);
                            // };
                        // });
                    };
                });
                };
            }

  }
               