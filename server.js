const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
require("dotenv").config();

const {
  uploadImageToS3,
  createPostContainer,
  confirmPost,
} = require("./imagePosting");
const { buildImage } = require("./imageCreation.js");
const {
  getUserHash,
  saveUserHash,
  checkSpam,
  authenticateAdmin,
  addToBlacklist,
  removeFromBlacklist,
  checkBlacklist,
  getBlacklist
} = require("./securityMiddleware.js");

const AWS = require("aws-sdk");

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_ACCESS_SECRET_KEY,
  region: process.env.AWS_REGION,
});

// Initialize DynamoDB DocumentClient
const dynamoDB = new AWS.DynamoDB.DocumentClient();

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

    console.log(`[GET /getPreview] Received preview request...`);

    if (!text || !background) {
      return res.status(400).send("Both text and background are required.");
    }

    buildImage(text, background)
      .then((imageBuffer) => {
        res.send(imageBuffer.toString("base64"));
        console.log("[GET /getPreview] Preview sent successfully");
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
  console.log(`[POST /createPost] Received post creation request...`);

  if (!text || !background) {
    console.log("[POST /createPost] Rejected: Text was not valid");
    return res.status(400).send("Both text and background are required.");
  }

  try {
    const ipAddress = req.ip;
    const currentTime = new Date().toISOString();
    const encryptedIP = getUserHash(ipAddress);

    // Check if the user is blacklisted
    const isBlacklisted = await checkBlacklist(encryptedIP);

    if (isBlacklisted) {
      return res.status(429).send("User is blacklisted");
    }

    // Check if the same IP made a request in the last 12 hours
     const isSpam = await checkSpam(encryptedIP);

     if (isSpam) {
       return res.status(429).send("Too many requests. Please try again later.");
     }

    // Save the encrypted IP and current time to DynamoDB
    await saveUserHash(encryptedIP, currentTime);

    // Perform Instagram post
    const imageBuffer = await buildImage(text, background);

    const imageURL = await uploadImageToS3(imageBuffer);

    const containerId = await createPostContainer(imageURL);

    await confirmPost(containerId);

    res.status(200).send("Image posted successfully");
    console.log("[POST /createPost] SUCCESS: Image posted");
  } catch (err) {
    // Handle errors and respond with error message
    console.error("[POST /createPost] Error processing request", err);
    res
      .status(500)
      .send(
        "An error occurred while creating or posting the image: " + err.message
      );
  }
});

// GET request to return the UserRequest table
app.get("/userRequests", authenticateAdmin, async (req, res) => {
  try {
    console.log("[GET /userRequests] Fetching AnonibotRequests table...");
    const scanParams = {
      TableName: "AnonibotRequests",
    };

    const scanResult = await dynamoDB.scan(scanParams).promise();
    res.json(scanResult.Items);
    console.log("[GET /userRequests] Requests sent");
  } catch (err) {
    console.error(
      "[GET /userRequests] Error fetching AnonibotRequests table:",
      err
    );
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET request to fetch the entire AnonibotBlacklist table
app.get("/blacklist", authenticateAdmin, async (req, res) => {
  console.log("[GET /blacklist] AnonibotBlacklist table requested")
  try {
    const blacklistTable = await getBlacklist();
    res.json(blacklistTable);
    console.log("[GET /blacklist] Blacklist sent")
  } catch (err) {
    console.error("[GET] Error fetching AnonibotBlacklist table:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


// POST request to blacklist a user
app.post("/blacklist", authenticateAdmin, async (req, res) => {
  try {
    console.log("[POST /blacklist] Blacklisting user...");
    const userHash = req.query.userHash; // Assuming the user hash is passed in the request body

    // Assuming the user hash is an IP address, you can directly use it as-is
    await addToBlacklist(userHash);

    res.json({ message: "User blacklisted successfully" });
  } catch (err) {
    console.error("[POST /blacklist] Error blacklisting user:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// DELETE request to remove a user from the blacklist
app.delete("/blacklist", authenticateAdmin, async (req, res) => {
  try {
    console.log("[DELETE /blacklist] Removing user from the blacklist...");
    const userHash = req.query.userHash; // Get the userHash from the query parameters

    // Assuming the user hash is an IP address, you can directly use it as-is
    await removeFromBlacklist(userHash);
    res.json({ message: "User removed from the blacklist successfully" });
  } catch (err) {
    console.error("[DELETE /blacklist] Error removing user from the blacklist:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
