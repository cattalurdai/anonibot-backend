// WEB SERVER
const express = require("express");
const webpack = require("webpack");
const webpackDevMiddleware = require("webpack-dev-middleware");
const webpackConfig = require("./webpack.config")
const bodyParser = require('body-parser');
const PORT = 4555

require("dotenv").config();
const fs = require("fs")
const util = require('util');
const readFileAsync = util.promisify(fs.readFile);
const app = express()

app.set("port", PORT)
app.use(bodyParser.json());
app.use("/static", express.static("dist"))
app.use(webpackDevMiddleware(webpack(webpackConfig)))


app.get("/", (req, res, next) => {
    res.send("EWebik")
})

app.listen(app.get("port"), () => {
    console.log("Server deployed on PORT :" + PORT);
})


const { IgApiClient } = require('instagram-private-api');
const ig = new IgApiClient();

const path = "./image.png"

// LOG INTO IG ACOUNT

async function login() {
    ig.state.generateDevice(process.env.IG_USERNAME);
    await ig.account.login(process.env.IG_USERNAME, process.env.IG_PASSWORD);
}


// CONVERT IMAGE

function base64ToPng(base64Image) {
    base64Image = base64Image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Image, "base64");
    fs.writeFileSync("image.png", buffer);
}

// IMAGE CONSTRUCTION

const Jimp = require('jimp');
const { resolve } = require("path");
const { post } = require("request-promise");

async function createImage(text, background) {
    // Reading image
    let image = await Jimp.read('./dist/img/' + background + ".png");
    // Defining the text font
    const font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
    image.print(font, 100, 100, text, 1000);

    image = await image.getBufferAsync(Jimp.MIME_PNG, (err, buffer) => {
        return buffer
    })

    return image

}



// GET IMAGE PREVIEW

app.post("/getPreview", (req, res) => {

    createImage(req.body.text, req.body.background).then(buffer => {
        res.send(buffer.toString("base64"))
        
    })

})

// UPLOAD PHOTO

app.post("/createPost", (req, res) => {

    postImage(req.body.text, req.body.background)

})

async function postImage(text, background) {
    let image64 = await createImage(text, background);
    await login();



    const publishResult = await ig.publish.photo({
        file: readFileAsync(path),
    });

    console.log("Image posted successfully");
};



