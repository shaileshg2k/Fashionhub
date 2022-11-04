const mongoose = require("mongoose")

mongoose.connect(process.env.DBKEY)
// mongoose.connect("mongodb://localhost:27017/ducatrestapi")
.then(()=>console.log("Data Base is Connected"))
.catch((error)=>console.log(error))