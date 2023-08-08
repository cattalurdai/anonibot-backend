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
  createPrivateApiPost,
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
  checkBadIp,
} = require("./securityMiddleware.js");

const https = require("https");
const fs = require("fs");

const PORT = 9999;
app.use(bodyParser.json());
app.use(cors());

//// START SERVER

if (process.env.HTTPS === "true") {
  // USE HTTPS
  const sslOptions = {
    key: fs.readFileSync("/etc/letsencrypt/live/api.anonibot.com/privkey.pem"),
    cert: fs.readFileSync("/etc/letsencrypt/live/api.anonibot.com/cert.pem"),
    ca: fs.readFileSync("/etc/letsencrypt/live/api.anonibot.com/chain.pem"),
  };

  const server = https.createServer(sslOptions, app);

  server.listen(PORT, () => {
    console.log("PRODUCTION: Server initialized on PORT " + PORT);
  });
} else {
  // USE HTTP
  app.listen(PORT, () => {
    console.log("DEVELOPMENT: Server initialized on PORT " + PORT);
  });
}

// GET IMAGE PREVIEW REQUEST

app.post("/getPreview", (req, res) => {
  try {
    const { text, theme, font, size } = req.body;

    console.log(`[GET /getPreview] Received preview request...`);

    if (!text || !theme || !font || !size) {
      return res.status(400).send("Required parameters not present");
    }

    buildImage(text, theme, font, size)
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

app.post(
  "/createPost",
  checkBlacklist,
  checkSpam,
  checkBadIp,
  async (req, res) => {
    console.log(`[POST /createPost] Received post creation request...`);

    // Validate request
    const { text, theme, font, size } = req.body;
    const userHash = getUserHash(req.ip);
    console.log(`[POST /createPost] Text ${text}, User ${userHash}`);

    if (!text || !theme || !font || !size) {
      console.log("[POST /createPost] Rejected: Parameters not valid");
      return res.status(400).send("Required parameters not received.");
    }

    const imageBuffer = await buildImage(text, theme, font, size);

    try {
      // Perform Instagram post
      try {
        const imageURL = await uploadImageToS3(imageBuffer);

        const containerId = await createPostContainer(imageURL);

        await confirmPost(containerId);
        console.log("[POST /createPost] SUCCESS: Image posted with public API");
        // Save user request here once the public API succeeds
        await saveUserRequest(userHash, new Date().toISOString());
        res.status(200).send("Image posted successfully");
        return;
      } catch (publicApiErr) {
        console.log("Error while posting image with PUBLIC API");

        // If the error occurs with public API, try with private API
        try {
          await createPrivateApiPost(imageBuffer);
          console.log(
            "[POST /createPost] SUCCESS: Image posted with private API"
          );
          // Save user request here once the private API succeeds
          await saveUserRequest(userHash, new Date().toISOString());
          res.status(200).send("Image posted successfully");
          return;
        } catch (privateApiErr) {
          console.log("Error while posting image with PRIVATE API");
          throw privateApiErr; // Re-throw the error to be caught in the outer catch block
        }
      }
    } catch (err) {
      // Handle errors and respond with error message
      console.error("[POST /createPost] Error processing request", err);
      res
        .status(500)
        .send(
          "An error occurred while creating or posting the image: " +
            err.message
        );
    }
  }
);

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
