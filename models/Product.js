const mongoose = require("mongoose")

const ProductSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Product Name Must Required"]
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
    color: {
        type: String,
        required: [true, "Product Color Must Required"]
    },
    size: {
        type: String,
        required: [true, "Product Size Must Required"]
    },
    baseprice: {
        type: Number,
        required: [true, "Product Base Price Must Required"]
    },
    discount: {
        type: Number,
        default: 0
    },
    finalprice: {
        type: Number,
        required: [true, "Product Final Price Must Required"]
    },
    stock: {
        type: String,
        default: "In Stock"
    },
    description: {
        type: String,
        default: "This is Sample Product"
    },
    pic1: {
        type: String,
        default: ""
    },
    pic2: {
        type: String,
        default: ""
    },
    pic3: {
        type: String,
        default: ""
    },
    pic4: {
        type: String,
        default: ""
    },
})
const Product = new mongoose.model("Product", ProductSchema)
module.exports = Product