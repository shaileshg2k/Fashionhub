const mongoose = require("mongoose")

mongoose.connect(process.env.DBKEY)
.then(()=>console.log("Data Base is Connected"))
.catch((error)=>console.log(error))