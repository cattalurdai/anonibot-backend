const AWS = require("aws-sdk");

const crypto = require("crypto");

// Set your AWS credentials and region here
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_ACCESS_SECRET_KEY,
  region: process.env.AWS_REGION,
});

// Initialize DynamoDB DocumentClient
const dynamoDB = new AWS.DynamoDB.DocumentClient();

// Function to encrypt IP address using SHA-256
const getUserHash = (ipAddress) => {
  console.log("[getUserHash] Encrypting...");
  const sha256 = crypto.createHash("sha256");
  sha256.update(ipAddress);
  const userHash = sha256.digest("hex");
  return userHash;
};

// Function to check if the same IP made a request in the last 12 hours
const checkSpam = async (userHash) => {
  try {
    console.log("[checkSpam] Checking hash for spam");
    const twelveHoursAgo = new Date(
      Date.now() - 12 * 60 * 60 * 1000
    ).toISOString();
    const queryParams = {
      TableName: "AnonibotRequests",
      KeyConditionExpression: "userHash = :hash",
      ExpressionAttributeValues: {
        ":hash": userHash,
        ":time": twelveHoursAgo,
      },
      FilterExpression: "requestTime >= :time",
    };
    const queryResult = await dynamoDB.query(queryParams).promise();
    const requestsCount = queryResult.Count;

    if (requestsCount > 0) {
      console.log("[checkSpam] DENIED: Too many requests");
      return true;
    } else {
      console.log("[checkSpam] GRANTED: Proceeding...");
      return false;
    }
  } catch (err) {
    console.error("[checkSpam] Error checking IP:", err);
    throw err;
  }
};

// Function to save the encrypted IP and current time to DynamoDB
const saveUserHash = async (userHash, currentTime) => {
  try {
    console.log("[saveUserhash} Saving...");
    await dynamoDB
      .put({
        TableName: "AnonibotRequests",
        Item: {
          userHash: userHash,
          requestTime: currentTime,
        },
      })
      .promise();

    console.log("[saveUserHash] Saved successfully");
  } catch (err) {
    console.error("[saveUserHash] Error saving hash:", err);
    throw err;
  }
};

// Middleware to check if the provided password is valid
const authenticateAdmin = (req, res, next) => {
  const providedPassword = req.header("auth_key");

  if (!providedPassword || providedPassword !== process.env.ADMIN_AUTH_KEY) {
    console.error(
      "[Unauthorized] User attempted to access admin route without valid auth_key."
    );
    return res.status(401).json({ error: "Unauthorized" });
  }

  // If the password matches, continue to the next middleware/route
  next();
};



const getBlacklist = async () => {
  try {
    console.log("[getBlacklistTable] Fetching AnonibotBlacklist table...");
    const scanParams = {
      TableName: "AnonibotBlacklist",
    };

    const scanResult = await dynamoDB.scan(scanParams).promise();
    return scanResult.Items;
  } catch (err) {
    console.error("[getBlacklistTable] Error fetching AnonibotBlacklist table:", err);
    throw err;
  }
};



// Function to add a user to the blacklist
const addToBlacklist = async (userHash) => {
  if (!userHash) {
    console.error("[addToBlacklist] Error: userHash is undefined or null.");
    throw new Error("userHash is required.");
  }

  try {
    console.log("[addToBlacklist] Adding user to the blacklist...");

    const params = {
      TableName: "AnonibotBlacklist",
      Item: {
        userHash: userHash,
      },
    };

    await dynamoDB.put(params).promise();

    console.log("[addToBlacklist] User added to the blacklist successfully");
  } catch (err) {
    console.error("[addToBlacklist] Error adding user to the blacklist:", err);
    throw err;
  }
};

const checkBlacklist = async (userHash) => {
  try {
    console.log("[checkBlacklist] Checking if user is blacklisted...");

    const queryParams = {
      TableName: "AnonibotBlacklist",
      KeyConditionExpression: "userHash = :hash",
      ExpressionAttributeValues: {
        ":hash": userHash,
      },
    };

    const queryResult = await dynamoDB.query(queryParams).promise();
    const isBlacklisted = queryResult.Count > 0;

    if (isBlacklisted) {
      console.log("[checkBlacklist] DENIED: User is blacklisted");
      return true;
    } else {
      console.log("[checkBlacklist] User is not blacklisted");
      return false;
    }
  } catch (err) {
    console.error("[checkBlacklist] Error checking blacklist:", err);
    throw err;
  }
};

// Function to remove a user from the blacklist
const removeFromBlacklist = async (userHash) => {
  if (!userHash) {
    console.error(
      "[removeFromBlacklist] Error: userHash is undefined or null."
    );
    throw new Error("userHash is required.");
  }

  try {
    console.log("[removeFromBlacklist] Removing user from the blacklist...");

    const params = {
      TableName: "AnonibotBlacklist",
      Key: {
        userHash: userHash,
      },
    };

    await dynamoDB.delete(params).promise();

    console.log(
      "[removeFromBlacklist] User removed from the blacklist successfully"
    );
  } catch (err) {
    console.error(
      "[removeFromBlacklist] Error removing user from the blacklist:",
      err
    );
    throw err;
  }
};

module.exports = {
  getUserHash,
  checkSpam,
  saveUserHash,
  checkBlacklist,
  addToBlacklist,
  removeFromBlacklist,
  authenticateAdmin,
  getBlacklist
};
