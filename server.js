const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
require("dotenv").config();

const {
  saveImageToS3,
  createPostContainer,
  confirmPost,
} = require("./imagePosting");
const { buildImage } = require("./imageCreation.js");
const {
  encryptIPAddress,
  saveEncryptedIP,
  checkIPRequest,
} = require("./spamValidation");

const PORT = 9999;
app.use(bodyParser.json());
app.use(cors());

// START SERVER

app.listen(PORT, () => {
  console.log("Server initialized on PORT " + PORT);
});

// GET REQUEST IMAGE PREVIEW

app.post("/getPreview", (req, res) => {
  try {
    const { text, background } = req.body;

    console.log(`Received preview request...`);

    if (!text || !background) {
      return res.status(400).send("Both text and background are required.");
    }

    buildImage(text, background)
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
  console.log(`Received post creation request...`);

  if (!text || !background) {
    return res.status(400).send("Both text and background are required.");
  }

  try {
    const ipAddress = req.ip;
    const currentTime = new Date().toISOString();
    const encryptedIP = encryptIPAddress(ipAddress);

    // Check if the same IP made a request in the last 12 hours
    const isSpam = await checkIPRequest(encryptedIP);

    if (!isSpam) {
      return res.status(429).send("Too many requests. Please try again later.");
    }

    // Save the encrypted IP and current time to DynamoDB
    await saveEncryptedIP(encryptedIP, currentTime);

    // Perform Instagram post
    const imageBuffer = await buildImage(text, background);

    const imageURL = await saveImageToS3(imageBuffer);

    const containerId = await createPostContainer(imageURL);

    await confirmPost(containerId);

    res.status(200).send("Image posted successfully");
  } catch (err) {
    // Handle errors and respond with error message
    console.error(err);
    res
      .status(500)
      .send(
        "An error occurred while creating or posting the image: " + err.message
      );
  }
});
