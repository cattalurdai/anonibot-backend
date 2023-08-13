const AWS = require("aws-sdk");
const crypto = require("crypto");
const axios = require('axios');

// SET AWS CREDENTIALS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_ACCESS_SECRET_KEY,
  region: process.env.AWS_REGION,
});


// INITIALIZE DYNAMODB
const dynamoDB = new AWS.DynamoDB.DocumentClient();


// ADMIN AUTH KEY VALIDATION
const authenticateAdmin = (req, res, next) => {
  const providedPassword = req.header("auth_key");

  if (!providedPassword || providedPassword !== process.env.ADMIN_AUTH_KEY) {
    console.error(
      "[Unauthorized] User attempted to access admin route without valid auth_key."
    );
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
};

// GET BLACKLIST TABLE
const getBlacklist = async () => {
  try {
    console.log("[getBlacklistTable] Fetching AnonibotBlacklist table...");
    const scanParams = {
      TableName: "AnonibotBlacklist",
    };

    const scanResult = await dynamoDB.scan(scanParams).promise();
    return scanResult.Items;
  } catch (err) {
    console.error(
      "[getBlacklistTable] Error fetching AnonibotBlacklist table:",
      err
    );
    throw err;
  }
};

// GET USER REQUESTS TABLE
const getAnonibotRequests = async () => {
  try {
    console.log("[GET /userRequests] Fetching AnonibotRequests table...");
    const scanParams = {
      TableName: "AnonibotRequests",
    };

    const scanResult = await dynamoDB.scan(scanParams).promise();
    console.log("[GET /userRequests] Requests sent");
    return scanResult.Items;
  } catch (err) {
    console.error(
      "[GET /userRequests] Error fetching AnonibotRequests table:",
      err
    );
    throw new Error("Internal Server Error");
  }
};


// GET USER HASH FROM IP
const getUserHash = (ip) => {
  const sha256 = crypto.createHash("sha256");
  sha256.update(ip);
  const userHash = sha256.digest("hex");
  return userHash;
};

// CHECK REQUEST FREQUENCY
async function checkSpam(req, res, next) {
  const userHash = getUserHash(req.ip);

  try {
    console.log("[checkSpam] Checking hash for spam");
    const timeLimit = new Date(
      Date.now() - parseInt(process.env.POST_TIME_LIMIT) * 60 * 60 * 1000 // Limit to the last 4 hours
    ).toISOString();

    const queryParams = {
      TableName: "AnonibotRequests",
      KeyConditionExpression: "userHash = :hash",
      ExpressionAttributeValues: {
        ":hash": userHash,
        ":time": timeLimit,
      },
      FilterExpression: "requestTime >= :time",
    };

    const queryResult = await dynamoDB.query(queryParams).promise();
    const requestsCount = queryResult.Count;

    if (requestsCount > 0) {
      console.log("[checkSpam] DENIED: Too many requests");
      return res.status(429).send("Too many requests. Please try again later.");
    } else {
      console.log("[checkSpam] OK: Proceeding...");
      next(); // No spam detected, proceed to the next middleware
    }
  } catch (err) {
    console.error("[checkSpam] Error checking IP:", err);
    return res.status(500).send("Error checking IP for spam");
  }
}

// LOG USER REQUEST ON DYNAMODB
const saveUserRequest = async (userHash, currentTime) => {
  try {
    console.log("[saveUserRequest} Saving request log...");
    await dynamoDB
      .put({
        TableName: "AnonibotRequests",
        Item: {
          userHash: userHash,
          requestTime: currentTime,
        },
      })
      .promise();

    console.log("[saveUserRequest] Saved successfully");
  } catch (err) {
    console.error("[saveUserRequest] Error saving hash:", err);
    throw err;
  }
};


// BLACKLIST USER
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

// CHECK IF USER IS BLACKLISTED
async function checkBlacklist(req, res, next) {
  const userHash = getUserHash(req.ip);

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
      return res.status(429).send("User is blacklisted");
    } else {
      console.log("[checkBlacklist] User is not blacklisted");
      next(); // User is not blacklisted, proceed to the next middleware
    }
  } catch (err) {
    console.error("[checkBlacklist] Error checking blacklist:", err);
    return res.status(500).send("Error checking blacklist");
  }
}

// REMOVE USER FROM BLACKLIST
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



const API_KEY = '9d704e94c5fb4dfaa7229690e7e9e99f';
const VPN_API_BASE_URL = 'https://vpnapi.io/api/';



async function checkBadIp(req, res, next) {
  let clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  // Strip off IPv6 prefix if present
  if (clientIp.startsWith('::ffff:')) {
    clientIp = clientIp.substring(7);
  }

  const apiUrl = `${VPN_API_BASE_URL}${clientIp}?key=${API_KEY}`;

  console.log("[checkBadIp] Making request...")
  try {
    const response = await axios.get(apiUrl);
    const responseData = response.data;

    req.vpnDetected = responseData.security && responseData.security.vpn;

    const allowedCountries = ['Uruguay', 'Argentina'];
    
    if (req.vpnDetected) {
      console.log("[checkBadIp] DENIED: VPN detected")
      return res.status(403).json({ message: 'Access denied.' });
    }



    if (!allowedCountries.includes(responseData.location.country)) {
      console.log("[checkBadIp] DENIED: Unsupported location")
      return res.status(403).json({ message: 'Access denied.' });
    }


    console.log("GRANTED: User meets security criteria ")
    next();
  } catch (error) {
    console.error('API request error:', error);
    req.vpnDetected = false;
    
  }
}


module.exports = {
  getUserHash,
  checkSpam,
  saveUserRequest,
  checkBlacklist,
  addToBlacklist,
  removeFromBlacklist,
  authenticateAdmin,
  getBlacklist,
  getAnonibotRequests,
  checkBadIp
};
