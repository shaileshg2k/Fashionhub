const mongoose = require("mongoose")

const NewslatterSchema = new mongoose.Schema({
    email:{
        type:String,
        unique:[true],
        required:[true,"Email Address Must Required"]
    }
})
const Newslatter =  mongoose.model("Newslatter",NewslatterSchema)
module.exports = Newslatter

