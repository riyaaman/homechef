const mongoClient       =   require('mongodb').MongoClient
const state             =   {db:null}
module.exports.connect  =   function (done){
    
   // const url       =   'mongodb://localhost:27017'
    const url       =   'mongodb+srv://riyarahim:ashriya@cluster0.jvvz7.mongodb.net/test'
    const dbname    =   'db-snacky'

    mongoClient.connect(url,(err,data)=>{
        if(err) return done(err)
        // if (err) throw err
        state.db = data.db(dbname)
        done()
    })
  
}

module.exports.get= function(){
    return state.db
}