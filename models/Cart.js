const mongoose = require("mongoose")

const CartSchema = new mongoose.Schema({
    userid:{
        type:String,
        required:[true,"User Id Must Required"]
    },
    productid:{
        type:String,
        required:[true,"Product Id Must Required"]
    },
    name:{
        type:String,
        required:[true,"Product Name Must Required"]
    },
    color:{
        type:String,
        required:[true,"Product Oolor Must Required"]
    },
    size:{
        type:String,
        required:[true,"Product Size Must Required"]
    },
    maincategory:{
        type:String,
        required:[true,"Product Maincategory Must Required"]
    },
    subcategory:{
        type:String,
        required:[true,"Product Subcategory Must Required"]
    },
    brand:{
        type:String,
        required:[true,"Product Brand Must Required"]
    },
    price:{
        type:Number,
        required:[true,"Product Price Must Required"]
    },
    qty:{
        type:Number,
        default:1
    },
    total:{
        type:Number,
        required:[true,"Cart Total Must Required"]
    },
    pic:{
        type:String,
        default:""
    }
})
const Cart = new mongoose.model("Cart",CartSchema)
module.exports = Cart