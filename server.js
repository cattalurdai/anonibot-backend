const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
require("dotenv").config();

const PORT = 9999;

app.use(bodyParser.json());
app.use(cors());

// START SERVER

app.listen(PORT, () => {
  console.log("Server initialized on PORT " + PORT);
});

/////// IMAGE CONSTRUCTION
const { createCanvas, loadImage, registerFont } = require("canvas");

async function wrapText(ctx, text, x, y, maxWidth, lineHeight, textAlign) {
  const words = text.split(" ");
  let line = "";
  let offsetY = 0;

  if (textAlign === "center") {
    x += maxWidth / 2;
  } else if (textAlign === "right") {
    x += maxWidth;
  }

  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + " ";
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && i > 0) {
      ctx.fillText(line, x, y + offsetY);
      line = words[i] + " ";
      offsetY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y + offsetY);
}

async function buildImage(text, selectedTheme) {
  console.log(
    `Creating image with theme '${selectedTheme}' and text '${text}'...`
  );

  // Read the theme JSON file based on the selected theme
  let themeData = require(`./utils/themes/${selectedTheme}.json`);

  // Register the font
  registerFont(themeData.fontPath, { family: "customFont" });

  // Load the background image
  const image = await loadImage(`./dist/img/${selectedTheme}.png`);

  // Create canvas and draw the background image on it
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");
  ctx.textDrawingMode = "glyph";
  ctx.drawImage(image, 0, 0, image.width, image.height);

  // Set the font style
  const fontSize = 48;
  ctx.font = `${fontSize}px customFont`;

  // Set the text color
  const textColor = themeData.textColor || "black";
  ctx.fillStyle = textColor;

  // Set the text position
  const textX = themeData.textPosition.x || 0;
  const textY = themeData.textPosition.y || 0;

  // Set the maximum width of the text container
  const maxWidth = themeData.maxWidth || image.width;

  // Set the text alignment
  const alignMethod = themeData.alignMethod || "left";
  ctx.textAlign = alignMethod;

  // Draw the wrapped text on the canvas
  await wrapText(ctx, text, textX, textY, maxWidth, fontSize + 10, alignMethod);

  // Get the buffer containing the image data
  const imageBuffer = canvas.toBuffer("image/jpeg");

  console.log(`Image created successfully`);
  return imageBuffer;
}

/////// INSTAGRAM POSTING FUNCTIONALITIES

const { IgApiClient } = require("instagram-private-api");
const ig = new IgApiClient();

// LOG INTO IG ACOUNT

async function instagramLogin() {
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


const { encryptIPAddress, saveEncryptedIP, checkIPRequest } = require("./spamValidation");


app.post("/createPost", async (req, res) => {
  const { text, background } = req.body;
  console.log(`Received post request...`);

  if (!text || !background) {
    return res.status(400).send("Both text and background are required.");
  }

  try {
    const ipAddress = req.ip; // Assuming you're using a middleware to get the client IP address
    const currentTime = new Date().toISOString();
    const encryptedIP = encryptIPAddress(ipAddress);

    // Check if the same IP made a request in the last 12 hours
    const isSpam = await checkIPRequest(encryptedIP);

    if (isSpam) {
      return res.status(429).send("Too many requests. Please try again later.");
    }

    // Save the encrypted IP and current time to DynamoDB
    await saveEncryptedIP(encryptedIP, currentTime);

    // Perform the buildImage and postImage operations here
    const imageBuffer = await buildImage(text, background);
    // await postImage(imageBuffer);

    // Respond with success message
    res.status(200).send("Image posted successfully");
    console.log("Image posted successfully");
  } catch (err) {
    // Handle errors and respond with error message
    console.error(err);
    res
      .status(500)
      .send("An error occurred while creating or posting the image: " + err.message);
  }
});



// UPLOAD IMAGE TO INSTAGRAM

async function postImage(imageBuffer) {
  await instagramLogin();
  let image = await imageBuffer;

  try {
    const publishResult = await ig.publish.photo({
      file: image,
    });
    console.log("SUCCESS: Image posted");
  } catch (error) {
    console.log("Error publishing photo:", error);
    throw new Error("An error occurred while posting the image");
  }
}
