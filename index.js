const express = require("express")
const multer = require("multer")
const path = require("path")
const fs = require("fs")
const passwordValidator = require('password-validator')
const bcrypt = require('bcrypt')
const jsonwebtoken = require("jsonwebtoken")
const nodemailer = require("nodemailer")
const Razorpay = require("razorpay")
const cors = require("cors")
const dotenv = require("dotenv")

dotenv.config()

const Maincategory = require("./models/Maincategory")
const Subcategory = require("./models/Subcategory")
const Brand = require("./models/Brand")
const Product = require("./models/Product")
const User = require("./models/User")
const Cart = require("./models/Cart")
const Wishlist = require("./models/Wishlist")
const Newslatter = require("./models/Newslatter")
const Contact = require("./models/Contact")
const Checkout = require("./models/Checkout")

require("./dbConnect")

const app = express()
app.use(express.static(path.join(__dirname, 'build')));
app.set(express.static(path.join(__dirname, "public")))
app.use(express.json())
app.use(cors())

app.use("/public", express.static("public"))

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/images')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + file.originalname)
    }
})
const upload = multer({ storage: storage })
var schema = new passwordValidator();
schema
    .is().min(8)                                    // Minimum length 8
    .is().max(100)                                  // Maximum length 100
    .has().uppercase()                              // Must have uppercase letters
    .has().lowercase()                              // Must have lowercase letters
    .has().digits(1)                                // Must have at least 1 digits
    .has().not().spaces()                           // Should not have spaces
    .is().not().oneOf(['Password@123', 'User@123', "User123", "ADMIN123", "Admin@123"])

const JSONSALTKEY = process.env.JSONSALTKEY

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
        user: process.env.MAILSENDER,
        pass: process.env.PASSWORD
    }

})

async function varifyTokenAdmin(req, res, next) {
    var token = req.headers['authorization']
    var role = req.headers['role']
    var username = req.headers['username']
    if (token) {
        let user = await User.findOne({ username: username })
        if (user && user.tokens.findIndex((item) => item === token) !== -1) {
            jsonwebtoken.verify(token, JSONSALTKEY, (error, data) => {
                if (error) {
                    res.send({ result: "Fail", message: "you are not authorized to Access this Data" })
                }
                else {
                    if (user.role == "Admin")
                        next()
                    else
                        res.send({ result: "Fail", message: "you are not Authorized to Perform this Action" })
                }
            })
        }
        else
            res.send({ result: "Fail", message: "You Currently Logged Out!!! Please Login Again " })
    }
    else
        res.send({ result: "Fail", message: "you are not authorized to Access this Data" })
}
async function varifyToken(req, res, next) {
    var token = req.headers['authorization']
    var role = req.headers['role']
    var username = req.headers['username']
    if (token) {
        let user = await User.findOne({ username: username })
        if (user && user.tokens.findIndex((item) => item === token) !== -1) {
            jsonwebtoken.verify(token, JSONSALTKEY, (error, data) => {
                if (error) {
                    res.send({ result: "Fail", message: "you are not Authorized to Perform this Axtion" })
                }
                else {
                    //let user = User.findOne({username:username})

                    next()
                }
            })
        }
        else
            res.send({ result: "Fail", message: "You Currently Logged Out!!! Please Login Again " })

    }
    else
        res.send({ result: "Fail", message: "you are not authorized to Access this Data" })
}

//Payment API
app.post("/orders", varifyToken, async (req, res) => {
    try {
        const instance = new Razorpay({
            key_id: process.env.RPKEYID,
            key_secret: process.env.PPSECRETKEY,
        });

        const options = {
            amount: req.body.amount * 100,
            currency: "INR"
        };

        instance.orders.create(options, (error, order) => {
            if (error) {
                console.log(error);
                return res.status(500).json({ message: "Something Went Wrong!" });
            }
            res.status(200).json({ data: order });
        });
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error!" });
        console.log(error);
    }
});

app.put("/verify", varifyToken, async (req, res) => {
    try {
        var check = await Checkout.findOne({ _id: req.body.checkid })
        check.rppid = req.body.razorpay_payment_id
        check.paymentstatus = "Done"
        check.mode = "Net Banking"
        await check.save()
        var user = await User.findOne({ _id: check.userid })
        let mailOption = {
            from: process.env.MAILSENDER,
            to: user.email,
            subject: "Payment Done !!! : Team FashionHub",
            text: `Thanks to Shop with Us\nYour Payment is Confirmed\nTrack Order in Profile Section!!!\nTeam FashionHub`
        }
        transporter.sendMail(mailOption, (error, data) => {
            if (error)
                console.log(error);
        })
        res.status(200).send({ result: "Done" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error!" });
    }
});

//api for maincategory
app.post("/maincategory", varifyTokenAdmin, async (req, res) => {
    try {
        const data = new Maincategory(req.body)
        await data.save()
        res.send({ result: "Done", message: "Maincategory is Created!!!!" })
    }
    catch (error) {
        // console.log(error)
        if (error.keyValue)
            res.status(400).send({ result: "Fail", message: "Maincategory Already Exist" })
        else if (error.errors.name)
            res.status(400).send({ result: "Fail", message: error.errors.name.message })
        else
            res.status(500).send({ result: "Fail", message: "Internal Server Error" })
    }
})
app.get("/maincategory", async (req, res) => {
    try {
        const data = await Maincategory.find()
        res.send({ result: "Done", data: data })
    }
    catch (error) {
        res.status(500).send({ result: "Fail", message: "Internal Server Error" })
    }
})
app.get("/maincategory/:_id", varifyTokenAdmin, async (req, res) => {
    try {
        const data = await Maincategory.findOne({ _id: req.params._id })
        if (data)
            res.send({ result: "Done", data: data })
        else
            res.status(404).send({ result: "Fail", message: "Invalid ID" })
    }
    catch (error) {
        res.status(500).send({ result: "Fail", message: "Internal Server Error" })
    }
})
app.put("/maincategory/:_id", varifyTokenAdmin, async (req, res) => {
    try {
        const data = await Maincategory.findOne({ _id: req.params._id })
        if (data) {
            data.name = req.body.name
            await data.save()
            res.send({ result: "Done", message: "Maincategory Updated!!!!!" })
        }
        else
            res.status(404).send({ result: "Fail", message: "Invalid ID" })
    }
    catch (error) {
        res.status(500).send({ result: "Fail", message: "Internal Server Error Or Main Category Already exist" })
    }
})
app.delete("/maincategory/:_id", varifyTokenAdmin, async (req, res) => {
    try {
        const data = await Maincategory.findOne({ _id: req.params._id })
        if (data) {
            await data.delete()
            res.send({ result: "Done", message: "Maincategory is deleted!!!!" })
        }
        else
            res.status(404).send({ result: "Fail", message: "Invalid ID" })
    }
    catch (error) {
        res.status(500).send({ result: "Fail", message: "Internal Server Error" })
    }
})

//api for subcategory
app.post("/subcategory", varifyTokenAdmin, async (req, res) => {
    try {
        const data = new Subcategory(req.body)
        await data.save()
        res.send({ result: "Done", message: "Subcategory is Created!!!!" })
    }
    catch (error) {
        // console.log(error)
        if (error.keyValue)
            res.status(400).send({ result: "Fail", message: "Subcategory Already Exist" })
        else if (error.errors.name)
            res.status(400).send({ result: "Fail", message: error.errors.name.message })
        else
            res.status(500).send({ result: "Fail", message: "Internal Server Error" })
    }
})
app.get("/subcategory", async (req, res) => {
    try {
        const data = await Subcategory.find()
        res.send({ result: "Done", data: data })
    }
    catch (error) {
        res.status(500).send({ result: "Fail", message: "Internal Server Error" })
    }
})
app.get("/subcategory/:_id", varifyTokenAdmin, async (req, res) => {
    try {
        const data = await Subcategory.findOne({ _id: req.params._id })
        if (data)
            res.send({ result: "Done", data: data })
        else
            res.status(404).send({ result: "Fail", message: "Invalid ID" })
    }
    catch (error) {
        res.status(500).send({ result: "Fail", message: "Internal Server Error" })
    }
})
app.put("/subcategory/:_id", varifyTokenAdmin, async (req, res) => {
    try {
        const data = await Subcategory.findOne({ _id: req.params._id })
        if (data) {
            data.name = req.body.name
            await data.save()
            res.send({ result: "Done", message: "Subcategory Updated!!!!!" })
        }
        else
            res.status(404).send({ result: "Fail", message: "Invalid ID" })
    }
    catch (error) {
        res.status(500).send({ result: "Fail", message: "Internal Server Error Or  Sub Category Already exist" })
    }
})
app.delete("/subcategory/:_id", varifyTokenAdmin, async (req, res) => {
    try {
        const data = await Subcategory.findOne({ _id: req.params._id })
        if (data) {
            await data.delete()
            res.send({ result: "Done", message: "Subcategory is deleted!!!!" })
        }
        else
            res.status(404).send({ result: "Fail", message: "Invalid ID" })
    }
    catch (error) {
        res.status(500).send({ result: "Fail", message: "Internal Server Error" })
    }
})

//api for brand
app.post("/brand", varifyTokenAdmin, async (req, res) => {
    try {
        const data = new Brand(req.body)
        await data.save()
        res.send({ result: "Done", message: "Brand is Created!!!!" })
    }
    catch (error) {
        // console.log(error)
        if (error.keyValue)
            res.status(400).send({ result: "Fail", message: "Brand Already Exist" })
        else if (error.errors.name)
            res.status(400).send({ result: "Fail", message: error.errors.name.message })
        else
            res.status(500).send({ result: "Fail", message: "Internal Server Error" })
    }
})
app.get("/brand", async (req, res) => {
    try {
        const data = await Brand.find()
        res.send({ result: "Done", data: data })
    }
    catch (error) {
        res.status(500).send({ result: "Fail", message: "Internal Server Error" })
    }
})
app.get("/brand/:_id", varifyTokenAdmin, async (req, res) => {
    try {
        const data = await Brand.findOne({ _id: req.params._id })
        if (data)
            res.send({ result: "Done", data: data })
        else
            res.status(404).send({ result: "Fail", message: "Invalid ID" })
    }
    catch (error) {
        res.status(500).send({ result: "Fail", message: "Internal Server Error" })
    }
})
app.put("/brand/:_id", varifyTokenAdmin, async (req, res) => {
    try {
        const data = await Brand.findOne({ _id: req.params._id })
        if (data) {
            data.name = req.body.name
            await data.save()
            res.send({ result: "Done", message: "Brand Updated!!!!!" })
        }
        else
            res.status(404).send({ result: "Fail", message: "Invalid ID" })
    }
    catch (error) {
        res.status(500).send({ result: "Fail", message: "Internal Server Error Or  Brand name Already exist" })
    }
})
app.delete("/brand/:_id", varifyTokenAdmin, async (req, res) => {
    try {
        const data = await Brand.findOne({ _id: req.params._id })
        if (data) {
            await data.delete()
            res.send({ result: "Done", message: "Brand is deleted!!!!" })
        }
        else
            res.status(404).send({ result: "Fail", message: "Invalid ID" })
    }
    catch (error) {
        res.status(500).send({ result: "Fail", message: "Internal Server Error" })
    }
})

//api for Product
app.post("/product", varifyTokenAdmin, upload.fields([
    { name: "pic1", maxCount: 1 },
    { name: "pic2", maxCount: 1 },
    { name: "pic3", maxCount: 1 },
    { name: "pic4", maxCount: 1 }
]), async (req, res) => {
    try {
        const data = new Product(req.body)
        if (req.files.pic1) {
            data.pic1 = req.files.pic1[0].filename
        }
        if (req.files.pic2) {
            data.pic2 = req.files.pic2[0].filename
        }
        if (req.files.pic3) {
            data.pic3 = req.files.pic3[0].filename
        }
        if (req.files.pic4) {
            data.pic4 = req.files.pic4[0].filename
        }
        await data.save()
        res.send({ result: "Done", message: "Product is Created!!!!" })
    }
    catch (error) {
        // console.log(error)
        if (error.errors.name)
            res.status(400).send({ result: "Fail", message: error.errors.name.message })
        else if (error.errors.maincategory)
            res.status(400).send({ result: "Fail", message: error.errors.maincategory.message })
        else if (error.errors.subcategory)
            res.status(400).send({ result: "Fail", message: error.errors.subcategory.message })
        else if (error.errors.brand)
            res.status(400).send({ result: "Fail", message: error.errors.brand.message })
        else if (error.errors.color)
            res.status(400).send({ result: "Fail", message: error.errors.color.message })
        else if (error.errors.size)
            res.status(400).send({ result: "Fail", message: error.errors.size.message })
        else if (error.errors.baseprice)
            res.status(400).send({ result: "Fail", message: error.errors.baseprice.message })
        else if (error.errors.finalprice)
            res.status(400).send({ result: "Fail", message: error.errors.finalprice.message })
        else
            res.status(500).send({ result: "Fail", message: "Internal Server Error" })
    }
})
app.get("/product", async (req, res) => {
    try {
        const data = await Product.find()
        res.send({ result: "Done", data: data })
    }
    catch (error) {
        res.status(500).send({ result: "Fail", message: "Internal Server Error" })
    }
})
app.get("/product/:_id", async (req, res) => {
    try {
        const data = await Product.findOne({ _id: req.params._id })
        if (data)
            res.send({ result: "Done", data: data })
        else
            res.status(404).send({ result: "Fail", message: "Invalid ID" })
    }
    catch (error) {
        res.status(500).send({ result: "Fail", message: "Internal Server Error" })
    }
})
app.put("/product/:_id", varifyTokenAdmin, upload.fields([
    { name: "pic1", maxCount: 1 },
    { name: "pic2", maxCount: 1 },
    { name: "pic3", maxCount: 1 },
    { name: "pic4", maxCount: 1 }
]), async (req, res) => {
    try {
        const data = await Product.findOne({ _id: req.params._id })
        if (data) {
            data.name = req.body.name ?? data.name
            data.maincategory = req.body.maincategory ?? data.maincategory
            data.subcategory = req.body.subcategory ?? data.subcategory
            data.brand = req.body.brand ?? data.brand
            data.color = req.body.color ?? data.color
            data.size = req.body.size ?? data.size
            data.baseprice = req.body.baseprice ?? data.baseprice
            data.discount = req.body.discount ?? data.discount
            data.finalprice = req.body.finalprice ?? data.finalprice
            data.stock = req.body.stock ?? data.stock
            data.description = req.body.description ?? data.description
            if (req.files.pic1) {
                try {
                    fs.unlinkSync(`./public/images/${data.pic1}`)
                } catch (error) { }
                data.pic1 = req.files.pic1[0].filename
            }
            if (req.files.pic2) {
                try {
                    fs.unlinkSync(`./public/images/${data.pic2}`)
                } catch (error) { }
                data.pic2 = req.files.pic2[0].filename
            }
            if (req.files.pic3) {
                try {
                    fs.unlinkSync(`./public/images/${data.pic3}`)
                } catch (error) { }
                data.pic3 = req.files.pic3[0].filename
            }
            if (req.files.pic4) {
                try {
                    fs.unlinkSync(`./public/images/${data.pic4}`)
                } catch (error) { }
                data.pic4 = req.files.pic4[0].filename
            }
            await data.save()
            res.send({ result: "Done", message: "Product Updated!!!!!" })
        }
        else
            res.status(404).send({ result: "Fail", message: "Invalid ID" })
    }
    catch (error) {
        res.status(500).send({ result: "Fail", message: "Internal Server Error" })
    }
})
app.delete("/product/:_id", varifyTokenAdmin, async (req, res) => {
    try {
        const data = await Product.findOne({ _id: req.params._id })
        if (data) {
            await data.delete()
            res.send({ result: "Done", message: "Product is deleted!!!!" })
        }
        else
            res.status(404).send({ result: "Fail", message: "Invalid ID" })
    }
    catch (error) {
        res.status(500).send({ result: "Fail", message: "Internal Server Error" })
    }
})

//api for User
app.post("/user", async (req, res) => {
    try {
        if (schema.validate(req.body.password)) {
            bcrypt.hash(req.body.password, 12, async function (err, hash) {
                const data = new User(req.body)
                data.password = hash
                await data.save()
                let mailOption = {
                    from: process.env.MAILSENDER,
                    to: data.email,
                    subject: "Your Account is Created !!! : Team FashionHub",
                    text: `Thanks to Create an Account With us!!!\nTeam FashionHub`
                }
                transporter.sendMail(mailOption, (error, data) => {
                    if (error)
                        console.log(error);
                })
                res.send({ result: "Done", message: "User is Created!!!!" })
            });
        }
        else
            res.send({ result: "Fail", message: "Invalid Password\nPassword Length Must be Atleast 8 and Maximum 100, Must Contain Atleast 1 Upper Case Character, Atleast 1 Lowe Case Character, Does not Contain Space" })
    }
    catch (error) {
        // console.log(error)
        if (error.keyValue)
            res.status(400).send({ result: "Fail", message: "User Name Already Registered" })
        else if (error.errors.name)
            res.status(400).send({ result: "Fail", message: error.errors.name.message })
        else if (error.errors.email)
            res.status(400).send({ result: "Fail", message: error.errors.email.message })
        else if (error.errors.username)
            res.status(400).send({ result: "Fail", message: error.errors.username.message })
        else if (error.errors.phone)
            res.status(400).send({ result: "Fail", message: error.errors.phone.message })
        else if (error.errors.password)
            res.status(400).send({ result: "Fail", message: error.errors.password.message })
        else
            res.status(500).send({ result: "Fail", message: "Internal Server Error" })
    }
})
app.get("/user", varifyTokenAdmin, async (req, res) => {
    try {
        const data = await User.find()
        res.send({ result: "Done", data: data })
    }
    catch (error) {
        res.status(500).send({ result: "Fail", message: "Internal Server Error" })
    }
})
app.get("/user/:_id", varifyToken, async (req, res) => {
    try {
        const data = await User.findOne({ _id: req.params._id })
        if (data)
            res.send({ result: "Done", data: data })
        else
            res.status(404).send({ result: "Fail", message: "Invalid ID" })
    }
    catch (error) {
        res.status(500).send({ result: "Fail", message: "Internal Server Error" })
    }
})

app.put("/user/:_id", varifyToken, upload.single("pic"), async (req, res) => {
    try {
        const data = await User.findOne({ _id: req.params._id })
        if (data) {
            data.name = req.body.name ?? data.name
            data.email = req.body.email ?? data.email
            data.phone = req.body.phone ?? data.phone
            data.addressline1 = req.body.addressline1 ?? data.addressline1
            data.addressline2 = req.body.addressline2 ?? data.addressline2
            data.addressline3 = req.body.addressline3 ?? data.addressline3
            data.pin = req.body.pin ?? data.pin
            data.city = req.body.city ?? data.city
            data.state = req.body.state ?? data.state
            if (req.file) {
                try {
                    fs.unlinkSync(`./public/images/${data.pic}`)
                } catch (error) { }
                data.pic = req.file.filename
            }
            await data.save()
            res.send({ result: "Done", message: "User Updated!!!!!" })
        }
        else
            res.status(404).send({ result: "Fail", message: "Invalid ID" })
    }
    catch (error) {
        res.status(500).send({ result: "Fail", message: "Internal Server Error" })
    }
})
app.delete("/user/:_id", varifyToken, async (req, res) => {
    try {
        const data = await User.findOne({ _id: req.params._id })
        if (data) {
            await data.delete()
            res.send({ result: "Done", message: "User is deleted!!!!" })
        }
        else
            res.status(404).send({ result: "Fail", message: "Invalid ID" })
    }
    catch (error) {
        res.status(500).send({ result: "Fail", message: "Internal Server Error" })
    }
})
//api for Cart
app.post("/cart", varifyToken, async (req, res) => {
    try {
        const data = new Cart(req.body)
        await data.save()
        res.send({ result: "Done", message: "Cart is Created!!!!" })
    }
    catch (error) {
        // console.log(error)
        if (error.errors.userid)
            res.status(400).send({ result: "Fail", message: error.errors.userid.message })
        else if (error.errors.productid)
            res.status(400).send({ result: "Fail", message: error.errors.productid.message })
        else if (error.errors.name)
            res.status(400).send({ result: "Fail", message: error.errors.name.message })
        else if (error.errors.maincategory)
            res.status(400).send({ result: "Fail", message: error.errors.maincategory.message })
        else if (error.errors.subcategory)
            res.status(400).send({ result: "Fail", message: error.errors.subcategory.message })
        else if (error.errors.brand)
            res.status(400).send({ result: "Fail", message: error.errors.brand.message })
        else if (error.errors.color)
            res.status(400).send({ result: "Fail", message: error.errors.color.message })
        else if (error.errors.size)
            res.status(400).send({ result: "Fail", message: error.errors.size.message })
        else if (error.errors.price)
            res.status(400).send({ result: "Fail", message: error.errors.price.message })
        else if (error.errors.total)
            res.status(400).send({ result: "Fail", message: error.errors.total.message })
        else
            res.status(500).send({ result: "Fail", message: "Internal Server Error" })
    }
})
app.get("/cartAll/:userid", varifyToken, async (req, res) => {
    try {
        const data = await Cart.find({ userid: req.params.userid })
        res.send({ result: "Done", data: data })
    }
    catch (error) {
        res.status(500).send({ result: "Fail", message: "Internal Server Error" })
    }
})
app.get("/cart/:_id", varifyToken, async (req, res) => {
    try {
        const data = await Cart.findOne({ _id: req.params._id })
        if (data)
            res.send({ result: "Done", data: data })
        else
            res.status(404).send({ result: "Fail", message: "Invalid ID" })
    }
    catch (error) {
        res.status(500).send({ result: "Fail", message: "Internal Server Error" })
    }
})
app.put("/cart/:_id", varifyToken, async (req, res) => {
    try {
        const data = await Cart.findOne({ _id: req.params._id })
        if (data) {
            data.qty = req.body.qty
            data.total = req.body.total
            await data.save()
            res.send({ result: "Done", message: "Cart Updated!!!!!" })
        }
        else
            res.status(404).send({ result: "Fail", message: "Invalid ID" })
    }
    catch (error) {
        res.status(500).send({ result: "Fail", message: "Internal Server Error" })
    }
})
app.delete("/cart/:_id", varifyToken, async (req, res) => {
    try {
        const data = await Cart.findOne({ _id: req.params._id })
        if (data) {
            await data.delete()
            res.send({ result: "Done", message: "Cart is deleted!!!!" })
        }
        else
            res.status(404).send({ result: "Fail", message: "Invalid ID" })
    }
    catch (error) {
        res.status(500).send({ result: "Fail", message: "Internal Server Error" })
    }
})
app.delete("/cartAll/:userid", varifyToken, async (req, res) => {
    try {
        const data = await Cart.deleteMany({ userid: req.params.userid })
        res.send({ result: "Done", message: "All Carts Are deleted!!!!" })
    }
    catch (error) {
        res.status(500).send({ result: "Fail", message: "Internal Server Error" })
    }
})

//api for Wishlist
app.post("/wishlist", varifyToken, async (req, res) => {
    try {
        const data = new Wishlist(req.body)
        await data.save()
        res.send({ result: "Done", message: "Wishlist is Created!!!!" })
    }
    catch (error) {
        // console.log(error)
        if (error.errors.userid)
            res.status(400).send({ result: "Fail", message: error.errors.userid.message })
        else if (error.errors.productid)
            res.status(400).send({ result: "Fail", message: error.errors.productid.message })
        else if (error.errors.name)
            res.status(400).send({ result: "Fail", message: error.errors.name.message })
        else if (error.errors.maincategory)
            res.status(400).send({ result: "Fail", message: error.errors.maincategory.message })
        else if (error.errors.subcategory)
            res.status(400).send({ result: "Fail", message: error.errors.subcategory.message })
        else if (error.errors.brand)
            res.status(400).send({ result: "Fail", message: error.errors.brand.message })
        else if (error.errors.color)
            res.status(400).send({ result: "Fail", message: error.errors.color.message })
        else if (error.errors.size)
            res.status(400).send({ result: "Fail", message: error.errors.size.message })
        else if (error.errors.price)
            res.status(400).send({ result: "Fail", message: error.errors.price.message })
        else
            res.status(500).send({ result: "Fail", message: "Internal Server Error" })
    }
})
app.get("/wishlist/:userid", varifyToken, async (req, res) => {
    try {
        const data = await Wishlist.find({ userid: req.params.userid })
        res.send({ result: "Done", data: data })
    }
    catch (error) {
        res.status(500).send({ result: "Fail", message: "Internal Server Error" })
    }
})
app.delete("/wishlist/:_id", varifyToken, async (req, res) => {
    try {
        const data = await Wishlist.findOne({ _id: req.params._id })
        if (data) {
            await data.delete()
            res.send({ result: "Done", message: "Wishlist is deleted!!!!" })
        }
        else
            res.status(404).send({ result: "Fail", message: "Invalid ID" })
    }
    catch (error) {
        res.status(500).send({ result: "Fail", message: "Internal Server Error" })
    }
})

//api for newslatter
app.post("/newslatter", async (req, res) => {
    try {
        const data = new Newslatter(req.body)
        await data.save()
        let mailOption = {
            from: process.env.MAILSENDER,
            to: data.email,
            subject: "Email Registerd !!! : Team FashionHub",
            text: `Thanks to Subscribe our Newslatter Service!!!\nNow we Send Email about Latest Products & Offers\nTeam FashionHub`
        }
        transporter.sendMail(mailOption, (error, data) => {
            if (error)
                console.log(error);
        })
        res.send({ result: "Done", message: "Thanks to Subscribe our Newslatter Service\nNow We Send Email regarding Latest Products and Offerse!!!!" })
    }
    catch (error) {
        console.log(error)
        if (error.keyValue)
            res.status(400).send({ result: "Fail", message: "Your Email Id Already Subscribed" })
        else if (error.errors.email)
            res.status(400).send({ result: "Fail", message: error.errors.email.message })
        else
            res.status(500).send({ result: "Fail", message: "Internal Server Error" })
    }
})
app.get("/newslatter", varifyTokenAdmin, async (req, res) => {
    try {
        const data = await Newslatter.find()
        res.send({ result: "Done", data: data })
    }
    catch (error) {
        res.status(500).send({ result: "Fail", message: "Internal Server Error" })
    }
})
app.delete("/newslatter/:_id", varifyTokenAdmin, async (req, res) => {
    try {
        const data = await Newslatter.findOne({ _id: req.params._id })
        if (data) {
            await data.delete()
            res.send({ result: "Done", message: "Newslatter is deleted!!!!" })
        }
        else
            res.status(404).send({ result: "Fail", message: "Invalid ID" })
    }
    catch (error) {
        res.status(500).send({ result: "Fail", message: "Internal Server Error" })
    }
})

//api for Contact
app.post("/contact", async (req, res) => {
    try {
        const data = new Contact(req.body)
        await data.save()
        let mailOption = {
            from: process.env.MAILSENDER,
            to: data.email,
            subject: "Your Query Received !!! : Team FashionHub",
            text: `Thanks to Share Your Query With Us\nOur Team Will Contact You Soon!!!\nTeam FashionHub`
        }
        transporter.sendMail(mailOption, (error, data) => {
            if (error)
                console.log(error);
        })
        res.send({ result: "Done", message: "Contact is Created!!!!" })
    }
    catch (error) {
        // console.log(error)
        if (error.errors.name)
            res.status(400).send({ result: "Fail", message: error.errors.name.message })
        else if (error.errors.email)
            res.status(400).send({ result: "Fail", message: error.errors.email.message })
        else if (error.errors.phone)
            res.status(400).send({ result: "Fail", message: error.errors.phone.message })
        else if (error.errors.subject)
            res.status(400).send({ result: "Fail", message: error.errors.subject.message })
        else if (error.errors.message)
            res.status(400).send({ result: "Fail", message: error.errors.message.message })
        else
            res.status(500).send({ result: "Fail", message: "Internal Server Error" })
    }
})
app.get("/contact", varifyTokenAdmin, async (req, res) => {
    try {
        const data = await Contact.find()
        res.send({ result: "Done", data: data })
    }
    catch (error) {
        res.status(500).send({ result: "Fail", message: "Internal Server Error" })
    }
})
app.get("/contact/:_id", varifyTokenAdmin, async (req, res) => {
    try {
        const data = await Contact.findOne({ _id: req.params._id })
        if (data)
            res.send({ result: "Done", data: data })
        else
            res.status(404).send({ result: "Fail", message: "Invalid ID" })
    }
    catch (error) {
        res.status(500).send({ result: "Fail", message: "Internal Server Error" })
    }
})
app.put("/contact/:_id", varifyTokenAdmin, async (req, res) => {
    try {
        const data = await Contact.findOne({ _id: req.params._id })
        if (data) {
            data.status = req.body.status
            await data.save()
            res.send({ result: "Done", message: "Contact Updated!!!!!" })
        }
        else
            res.status(404).send({ result: "Fail", message: "Invalid ID" })
    }
    catch (error) {
        res.status(500).send({ result: "Fail", message: "Internal Server Error" })
    }
})
app.delete("/contact/:_id", varifyTokenAdmin, async (req, res) => {
    try {
        const data = await Contact.findOne({ _id: req.params._id })
        if (data) {
            await data.delete()
            res.send({ result: "Done", message: "Contact is deleted!!!!" })
        }
        else
            res.status(404).send({ result: "Fail", message: "Invalid ID" })
    }
    catch (error) {
        res.status(500).send({ result: "Fail", message: "Internal Server Error" })
    }
})

//api for Checkout
app.post("/checkout", varifyToken, async (req, res) => {
    try {
        const data = new Checkout(req.body)
        await data.save()
        var user = await User.findOne({ _id: data.userid })
        let mailOption = {
            from: process.env.MAILSENDER,
            to: data.email,
            subject: "Your Query Received !!! : Team FashionHub",
            text: `Thanks to Place Order With Us\nNow You Can Track Your Order in Profile Section\nOur Team Will Deliver your Order Soon!!!\nTeam FashionHub`
        }
        transporter.sendMail(mailOption, (error, data) => {
            if (error)
                console.log(error);
        })
        res.send({ result: "Done", message: "Checkout is Created!!!!" })
    }
    catch (error) {
        if (error.errors.userid)
            res.status(400).send({ result: "Fail", message: error.errors.userid.message })
        else if (error.errors.totalAmount)
            res.status(400).send({ result: "Fail", message: error.errors.totalAmount.message })
        else if (error.errors.shippingAmount)
            res.status(400).send({ result: "Fail", message: error.errors.shippingAmount.message })
        else if (error.errors.finalAmount)
            res.status(400).send({ result: "Fail", message: error.errors.finalAmount.message })
        else if (error.errors.name)
            res.status(400).send({ result: "Fail", message: error.errors.name.message })
        else if (error.errors.maincategory)
            res.status(400).send({ result: "Fail", message: error.errors.maincategory.message })
        else if (error.errors.subcategory)
            res.status(400).send({ result: "Fail", message: error.errors.subcategory.message })
        else if (error.errors.brand)
            res.status(400).send({ result: "Fail", message: error.errors.brand.message })
        else if (error.errors.color)
            res.status(400).send({ result: "Fail", message: error.errors.color.message })
        else if (error.errors.size)
            res.status(400).send({ result: "Fail", message: error.errors.size.message })
        else if (error.errors.price)
            res.status(400).send({ result: "Fail", message: error.errors.price.message })
        else if (error.errors.total)
            res.status(400).send({ result: "Fail", message: error.errors.total.message })
        else if (error.errors.productid)
            res.status(400).send({ result: "Fail", message: error.errors.productid.message })
        else
            res.status(500).send({ result: "Fail", message: "Internal Server Error" })
    }
})
app.get("/checkout", varifyTokenAdmin, async (req, res) => {
    try {
        const data = await Checkout.find()
        res.send({ result: "Done", data: data })
    }
    catch (error) {
        res.status(500).send({ result: "Fail", message: "Internal Server Error" })
    }
})
app.get("/checkoutUser/:userid", varifyToken, async (req, res) => {
    try {
        const data = await Checkout.find({ userid: req.params.userid })
        if (data)
            res.send({ result: "Done", data: data })
        else
            res.status(404).send({ result: "Fail", message: "Invalid ID" })
    }
    catch (error) {
        res.status(500).send({ result: "Fail", message: "Internal Server Error" })
    }
})
app.get("/checkout/:_id", varifyToken, async (req, res) => {
    try {
        const data = await Checkout.findOne({ _id: req.params._id })
        if (data)
            res.send({ result: "Done", data: data })
        else
            res.status(404).send({ result: "Fail", message: "Invalid ID" })
    }
    catch (error) {
        res.status(500).send({ result: "Fail", message: "Internal Server Error" })
    }
})
app.put("/checkout/:_id", varifyTokenAdmin, async (req, res) => {
    try {
        const data = await Checkout.findOne({ _id: req.params._id })
        if (data) {
            data.mode = req.body.mode ?? data.mode
            data.status = req.body.status ?? data.status
            data.paymentstatus = req.body.paymentstatus ?? data.paymentstatus
            data.rppid = req.body.rppid ?? data.rppid
            await data.save()
            res.send({ result: "Done", message: "Checkout Updated!!!!!" })
        }
        else
            res.status(404).send({ result: "Fail", message: "Invalid ID" })
    }
    catch (error) {
        res.status(500).send({ result: "Fail", message: "Internal Server Error" })
    }
})
// app.delete("/checkout/:_id", async (req, res) => {
//     try {
//         const data = await Checkout.findOne({ _id: req.params._id })
//         if (data) {
//             await data.delete()
//             res.send({ result: "Done", message: "Checkout is deleted!!!!" })
//         }
//         else
//             res.status(404).send({ result: "Fail", message: "Invalid ID" })
//     }
//     catch (error) {
//         res.status(500).send({ result: "Fail", message: "Internal Server Error" })
//     }
// })

//API for Login
app.post("/login", async (req, res) => {
    try {
        const data = await User.findOne({ username: req.body.username })
        if (data) {
            if (await bcrypt.compare(req.body.password, data.password)) {
                jsonwebtoken.sign({ data }, JSONSALTKEY, async (error, token) => {
                    if (error) {
                        console.log(error)
                        res.status(500).send({ result: "Fail", message: "Internal Server Error" })
                    }
                    else {
                        if (data.tokens.length < 3) {
                            data.tokens.push(token)
                            await data.save()
                            res.send({ result: "Done", data: data, token: token })
                        }
                        else
                            res.status(400).send({ result: "Fail", message: "You Already Logged in From 3 Device!!!! to Login on This Device Logout From any Other Device" })
                    }
                })
            }
            else
                res.status(400).send({ result: "Fail", message: "Username or Password Incorrect" })
        }
        else
            res.status(400).send({ result: "Fail", message: "Username or Password Incorrect" })
    }
    catch (error) {
        console.log(error);
        console.log(JSONSALTKEY);
        res.status(500).send({ result: "Fail", message: "Internal Server Error" })
        
    }
})


//API for Logout
app.post("/logout", async (req, res) => {
    try {
        const data = await User.findOne({ username: req.body.username })
        if (data) {
            let index = data.tokens.findIndex((item) => item === req.body.token)
            if (index !== -1) {
                data.tokens.splice(index, 1)
                await data.save()
            }
        }
        res.status(500).send({ result: "Done", message: "Your Logged Out" })
    }
    catch (error) {
        res.status(500).send({ result: "Fail", message: "Internal Server Error" })
    }
})
app.post("/logoutall", async (req, res) => {
    try {
        const data = await User.findOne({ username: req.body.username })
        if (data) {
            let index = data.tokens.findIndex((item) => item === req.body.token)
            if (index !== -1) {
                data.tokens = []
                await data.save()
            }
        }
        res.status(500).send({ result: "Done", message: "Your Logged Out from All Device" })
    }
    catch (error) {
        res.status(500).send({ result: "Fail", message: "Internal Server Error" })
    }
})



//api for Search
app.post("/search", async (req, res) => {
    try {
        const data = await Product.find({
            $or: [
                { name: { $regex: `.*${req.body.search}.*`, $options: "i" } },
                { maincategory: { $regex: `.*${req.body.search}.*`, $options: "i" } },
                { subcategory: { $regex: `.*${req.body.search}.*`, $options: "i" } },
                { color: { $regex: `.*${req.body.search}.*`, $options: "i" } },
                { size: { $regex: `.*${req.body.search}.*`, $options: "i" } },
                { brand: { $regex: `.*${req.body.search}.*`, $options: "i" } },
                { description: { $regex: `.*${req.body.search}.*`, $options: "i" } }
            ]
        })
        res.status(400).send({ result: "Done", data: data })
    }
    catch (error) {
        res.status(500).send({ result: "Fail", message: "Internal Server Error" })
    }
})

//Api for Password reset
app.post("/resetpassword-username", async (req, res) => {
    try {
        let data = await User.findOne({ username: req.body.username })
        if (data) {
            let num = parseInt(Math.random() * 1000000)
            data.otp = num
            await data.save()
            let mailOption = {
                from: process.env.MAILSENDER,
                to: data.email,
                subject: "OTP for Password Reset !!! : Team FashionHub",
                text: `OTP for Password Reset is ${num}!!!\nTeam FashionHub`
            }
            transporter.sendMail(mailOption, (error, data) => {
                if (error)
                    console.log(error);
            })
            res.send({ result: "Done", message: "OTP is Sent on Your Registered Email Id" })
        }
        else
            res.status(404).send({ result: "Fail", message: "Invalid User Name" })

    }
    catch (error) {
        res.status(500).send({ result: "Fail", message: "Internal Server Error" })
    }
})
app.post("/resetpassword-otp", async (req, res) => {
    try {
        let data = await User.findOne({ username: req.body.username })
        if (data) {
            if (data.otp === req.body.otp) {
                res.send({ result: "Done" })
            }
            else
                res.status(404).send({ result: "Fail", message: "Invalid OTP" })
        }
        else
            res.status(404).send({ result: "Fail", message: "Invalid User Name" })
    }
    catch (error) {
        res.status(500).send({ result: "Fail", message: "Internal Server Error" })
    }
})
app.post("/resetpassword-password", async (req, res) => {
    try {
        let data = await User.findOne({ username: req.body.username })
        if (data) {
            if (schema.validate(req.body.password)) {
                bcrypt.hash(req.body.password, 12, async function (err, hash) {
                    data.password = hash
                    await data.save()
                    res.send({ result: "Done", message: "Password Has Been Reset!!!!!" })
                });
            }
            else
                res.status(404).send({ result: "Fail", message: "Invalid User Name" })
        }
        else
            res.status(404).send({ result: "Fail", message: "Invalid User Name" })
    }
    catch (error) {
        res.status(500).send({ result: "Fail", message: "Internal Server Error" })
    }
})


app.use('*', express.static(path.join(__dirname, 'build'))); 
app.listen(process.env.PORT||8000, () => console.log("Server is Running at PORT 8000"))