/////// WEB SERVER ///////
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const PORT = 4555;

require("dotenv").config();
const fs = require("fs");
const util = require("util");
const readFileAsync = util.promisify(fs.readFile);
const app = express();

app.use(bodyParser.json());

app.use(cors());

app.listen(PORT, () => {
  console.log("Server deployed on PORT :" + PORT);
});

/////// IMAGE CONSTRUCTION
const Jimp = require("jimp");

async function createImage(text, background) {
  console.log(
    `Creating image with background '${background}' and text '${text}'...`
  );

  // Reading image with selected background
  let image = await Jimp.read(`./dist/img/${background}.png`);

  // Defining the text font
  const font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);

  // Printing image
  image.print(font, 100, 100, text, 1000);

  // Get the buffer containing the image data
  const imageBuffer = await image.getBufferAsync(Jimp.MIME_JPEG);

  console.log(`Image created successfully`);
  return imageBuffer;
}

/////// INSTAGRAM POSTING FUNCTIONALITIES

const { IgApiClient } = require('instagram-private-api');
const ig = new IgApiClient();

// LOG INTO IG ACOUNT

async function login() {
    console.log(`Logging into Instagram account with username '${process.env.IG_USERNAME}'...`);
    ig.state.generateDevice(process.env.IG_USERNAME);
    await ig.account.login(process.env.IG_USERNAME, process.env.IG_PASSWORD);
    console.log(`Logged into Instagram account successfully`);
}


// GET REQUEST IMAGE PREVIEW
app.post("/getPreview", (req, res) => {
  
  try {
    const { text, background } = req.body;

    console.log(`Received preview request...`);


    if (!text || !background) {
      return res.status(400).send("Both text and background are required.");
    }

    createImage(text, background)
      .then((imageBuffer) => {
        res.send(imageBuffer.toString("base64"));
        console.log("Image sent successfully")
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
      });
  } catch (err) {
    console.error(err);
    res.status(500).send("An error occurred while handling the request.");
  }
});

// UPLOAD IMAGE TO INSTAGRAM

async function postImage(imageBuffer) {
  await login();
  let image = await imageBuffer;

  try {
    const publishResult = await ig.publish.photo({
      file: image,
    });
    console.log("Image posted successfully");
  } catch (error) {
    console.log("Error publishing photo:", error);
  }
}

/////// INSTAGRAM GET FUNCTIONALITIES ///////

/* const API = `https://graph.instagram.com/5866463780137746/media?`
const IG_API_TOKEN = process.env.IG_TOKEN 
const axios = require("axios");
const { stringify } = require("querystring");
let limit = 5


async function getMedia(){
  const response = await axios.get(`${API}fields=media_url&access_token=${IG_API_TOKEN}&limit=${limit}`);
  return response.data.data
}



app.get("/getIgPosts", (req, res) => {
getMedia().then(media => res.send(media))
}) */
