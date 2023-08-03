const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
require("dotenv").config();

const { buildImage } = require("./imageCreation.js");

const {
  uploadImageToS3,
  createPostContainer,
  confirmPost,
} = require("./imagePosting.js");
const {
  getUserHash,
  saveUserRequest,
  checkSpam,
  authenticateAdmin,
  addToBlacklist,
  removeFromBlacklist,
  checkBlacklist,
  getBlacklist,
} = require("./securityMiddleware.js");

const PORT = 9999;
app.use(bodyParser.json());
app.use(cors());

// START SERVER

app.listen(PORT, () => {
  console.log("Server initialized on PORT " + PORT);
});

// GET IMAGE PREVIEW REQUEST

app.post("/getPreview", (req, res) => {
  try {
    const { text, theme, font } = req.body;

    console.log(`[GET /getPreview] Received preview request...`);

    if (!text || !theme || !font) {
      return res.status(400).send("Theme, font, and text parameters are required");
    }

    buildImage(text, theme,font)
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

// CREATE POST REQUEST

app.post("/createPost", async (req, res) => {
  console.log(`[POST /createPost] Received post creation request...`);

  // Validate request
  const { text, theme, font } = req.body;
  const userHash = getUserHash(req.ip);

  if (!text || !theme || !font) {
    console.log("[POST /createPost] Rejected: Parameters not valid");
    return res.status(400).send("Required parameters not received.");
  }

  const isBlacklisted = await checkBlacklist(userHash);
  if (isBlacklisted) {
    return res.status(429).send("User is blacklisted");
  }

  const isSpam = await checkSpam(userHash);
  // if (isSpam) {
  //   return res.status(429).send("Too many requests. Please try again later.");
  // }

  try {
    // Perform Instagram post

    const imageBuffer = await buildImage(text, theme, font);

    const imageURL = await uploadImageToS3(imageBuffer);

    const containerId = await createPostContainer(imageURL);

    await confirmPost(containerId);

    await saveUserRequest(userHash, new Date().toISOString());

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

// GET USER REQUESTS TABLE
app.get("/userRequests", authenticateAdmin, async (req, res) => {
  try {
    res.json(await getAnonibotRequests());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET BLACKLIST TABLE
app.get("/blacklist", authenticateAdmin, async (req, res) => {
  console.log("[GET /blacklist] AnonibotBlacklist table requested");
  try {
    const blacklistTable = await getBlacklist();
    res.json(blacklistTable);
    console.log("[GET /blacklist] Blacklist sent");
  } catch (err) {
    console.error("[GET] Error fetching AnonibotBlacklist table:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ADD USER TO BLACKLIST
app.post("/blacklist", authenticateAdmin, async (req, res) => {
  try {
    console.log("[POST /blacklist] Blacklisting user...");
    const userHash = req.query.userHash;
    await addToBlacklist(userHash);

    res.json({ message: "User blacklisted successfully" });
  } catch (err) {
    console.error("[POST /blacklist] Error blacklisting user:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// REMOVE USER FROM BLACKLIST
app.delete("/blacklist", authenticateAdmin, async (req, res) => {
  try {
    console.log("[DELETE /blacklist] Removing user from the blacklist...");
    const userHash = req.query.userHash;

    await removeFromBlacklist(userHash);
    res.json({ message: "User removed from the blacklist successfully" });
  } catch (err) {
    console.error(
      "[DELETE /blacklist] Error removing user from the blacklist:",
      err
    );
    res.status(500).json({ error: "Internal Server Error" });
  }
});
