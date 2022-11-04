const mongoose = require("mongoose")

const SubcategorySchema = new mongoose.Schema({
    name:{
        type:String,
        unique:true,
        required:[true,"Subcategory Name Must Required"]
    }
})
const Subcategory = new mongoose.model("Subcategory",SubcategorySchema)
module.exports = Subcategory