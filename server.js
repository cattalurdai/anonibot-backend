// WEB SERVER
const express = require("express");
const webpack = require("webpack");
const webpackDevMiddleware = require("webpack-dev-middleware");
const webpackConfig = require("./webpack.config")


const app = express()
app.set("port", 4555)
app.use("/static",express.static("dist"))
app.use(webpackDevMiddleware(webpack(webpackConfig)))

app.get("/", (req,res,next) =>{
    res.send("EWebik")
})

app.listen(app.get("port"),()=>{
    console.log("Server deployed");
})












require("dotenv").config();
const { IgApiClient } = require('instagram-private-api');
const fs = require("fs")
const util = require('util');
const readFileAsync = util.promisify(fs.readFile);
const path = "./editedphoto.jpg"
const ig = new IgApiClient();




// IMAGE CONSTRUCTION

const Jimp = require('jimp');

async function imgAddText() {
    // Reading image
    const image = await Jimp.read('./background.jpg');
    // Defining the text font
    const font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
    image.print(font, 100, 100, 'THIS IS AN ALPHA THIS IS AN ALPHA THIS IS AN ALPHA THIS IS AN ALPHA THIS IS AN ALPHA THIS IS AN ALPHA THIS IS AN ALPHA THIS IS AN ALPHA THIS IS AN ALPHA THIS IS AN ALPHA THIS IS AN ALPHA THIS IS AN ALPHA THIS IS AN ALPHA ', 1000);
    // Writing image after processing
    await image.writeAsync('./editedphoto.jpg');
    console.log("Image created");
}

// INSTAGRAM 

// LOGIN INTO ACOUNT
async function login() {

    ig.state.generateDevice(process.env.IG_USERNAME);

    await ig.account.login(process.env.IG_USERNAME, process.env.IG_PASSWORD);
}

// WHEN LOGGED UPLOAD PHOTO

async function postPhoto() {
    await login();
    await imgAddText();

    const publishResult = await ig.publish.photo({
        file: await readFileAsync(path),
    });

    console.log("Photo uploaded successfully");
};

