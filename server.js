/////// WEB SERVER ///////
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const Jimp = require("jimp");
const PORT = 9999;
const app = express();

app.use(bodyParser.json());

app.use(cors());

app.listen(PORT, () => {
  console.log("Server initialized on PORT " + PORT);
});

/////// IMAGE CONSTRUCTION

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

const { IgApiClient } = require("instagram-private-api");
const ig = new IgApiClient();

// LOG INTO IG ACOUNT

async function login() {
  console.log(
    `Logging into Instagram account with username '${process.env.IG_USERNAME}'...`
  );
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
        console.log("Preview image sent successfully");
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
app.post("/createPost", async (req, res) => {
  const { text, background } = req.body;
  console.log(`Received post request...`);

  if (!text || !background) {
    return res.status(400).send("Both text and background are required.");
  }

  try {
    const imageBuffer = await createImage(text, background);
    await postImage(imageBuffer);
    res.status(200).send("Image posted successfully");
    console.log("Image posted successfully");
  } catch (err) {
    console.error(err);
    res.status(500).send("An error occurred while creating or posting the image: " + err.message);
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
    throw new Error("An error occurred while posting the image");
  }
}