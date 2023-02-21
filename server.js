/////// WEB SERVER ///////
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

app.use(bodyParser.json());
app.use("/static", express.static("dist"))
app.use(webpackDevMiddleware(webpack(webpackConfig)))


app.get("/", (req, res, next) => {
    res.send("EWebik")
})

app.listen(PORT, () => {
    console.log("Server deployed on PORT :" + PORT);
})


/////// INSTAGRAM FUNCTIONALITIES ///////

const { IgApiClient } = require('instagram-private-api');
const ig = new IgApiClient();


// LOG INTO IG ACOUNT

async function login() {
    ig.state.generateDevice(process.env.IG_USERNAME);
    await ig.account.login(process.env.IG_USERNAME, process.env.IG_PASSWORD);
}

// IMAGE CONSTRUCTION

const Jimp = require('jimp');

async function createImage(text, background) {
    // Reading image with selected bg
    let image = await Jimp.read('./dist/img/' + background + ".png");

    // Defining the text font
    const font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);

    // Printing image
    image.print(font, 100, 100, text, 1000);

    // Get the buffer containing the image data
    const imageBuffer = await image.getBufferAsync(Jimp.MIME_JPEG);

    return imageBuffer;
}

// GET REQUEST IMAGE PREVIEW
app.post("/getPreview", (req, res) => {
    try {
      const { text, background } = req.body;
  
      if (!text || !background) {
        return res.status(400).send("Both text and background are required.");
      }
  
      createImage(text, background)
        .then((imageBuffer) => {
          res.send(imageBuffer.toString("base64"));
        })
        .catch((err) => {
          console.error(err);
          res.status(500).send("An error occurred while creating the image.");
        });
    } catch (err) {
      console.error(err);
      res.status(500).send("An error occurred while handling the request.");
    }
  });
  

// POST REQUEST UPLOAD PHOTO 

app.post("/createPost", (req, res) => {
  try {
    const { text, background } = req.body;

    if (!text || !background) {
      return res.status(400).send("Both text and background are required.");
    }

    createImage(text, background)
      .then((imageBuffer) => {
        postImage(imageBuffer);
        res.status(200).send("Image posted successfully");
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("An error occurred while creating the image");
      })
  } catch (err) {
    console.error(err);
    res.status(500).send("An error occurred while handling the request.");
  }

})

// UPLOAD IMAGE TO INSTAGRAM 

async function postImage(imageBuffer) {
    await login();
    let image = await imageBuffer;

    try {
        const publishResult = await ig.publish.photo({
            file: image
        });
        console.log("Image posted successfully");
    } catch (error) {
        console.log("Error publishing photo:", error);
    }
};
