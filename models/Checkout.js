const mongoose = require("mongoose")

const CheckoutSchema = new mongoose.Schema({
    userid: {
        type: String,
        required: [true, "User Id Must Required"]
    },
    mode: {
        type: String,
        default:"COD"
    },
    status: {
        type: String,
        default:"Order placed"
    },
    paymentstatus: {
        type: String,
        default:"Pending"
    },
    totalAmount: {
        type: Number,
        required: [true, "Checkout Total Amount Must Required"]
    },
    shippingAmount: {
        type: Number,
        required: [true, "Checkout Shipping Amount Must Required"]
    },
    finalAmount: {
        type: Number,
        required: [true, "Checkout Final Amount Must Required"]
    },
    rppid:{
        type:String,
        default:""
    },
    date:{
        type:String,
        default:""
    },
    products: [
        {
            productid: {
                type: String,
                required: [true, "Product Id Must Required"]
            },
            name: {
                type: String,
                required: [true, "Product Name Must Required"]
            },
            color: {
                type: String,
                required: [true, "Product Oolor Must Required"]
            },
            size: {
                type: String,
                required: [true, "Product Size Must Required"]
            },
            maincategory: {
                type: String,
                required: [true, "Product Maincategory Must Required"]
            },
            subcategory: {
                type: String,
                required: [true, "Product Subcategory Must Required"]
            },
            brand: {
                type: String,
                required: [true, "Product Brand Must Required"]
            },
            price: {
                type: Number,
                required: [true, "Product Price Must Required"]
            },
            qty: {
                type: Number,
                default: 1
            },
            total: {
                type: Number,
                required: [true, "Cart Total Must Required"]
            },
            pic: {
                type: String,
                default: ""
            }
        }
    ]
})
const Checkout = new mongoose.model("Checkout", CheckoutSchema)
module.exports = Checkout