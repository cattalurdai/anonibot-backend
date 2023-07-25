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
const encryptIPAddress = (ipAddress) => {
  console.log("[encryptIPAddress] Encrypting...");
  const sha256 = crypto.createHash("sha256");
  sha256.update(ipAddress);
  const hashedIP = sha256.digest("hex");
  return hashedIP;
};

// Function to check if the same IP made a request in the last 12 hours
const checkIPRequest = async (encryptedIP) => {
  try {
    console.log(
      "[checkIPRequest] Checking hash for spam"
    );
    const twelveHoursAgo = new Date(
      Date.now() - 12 * 60 * 60 * 1000
    ).toISOString();
    const queryParams = {
      TableName: "AnonibotRequests",
      KeyConditionExpression: "ipId = :ip",
      ExpressionAttributeValues: {
        ":ip": encryptedIP,
        ":time": twelveHoursAgo,
      },
      FilterExpression: "requestTime >= :time",
    };
    const queryResult = await dynamoDB.query(queryParams).promise();
    const requestsCount = queryResult.Count;

    if (requestsCount > 0) {
      console.log("[checkIPRequest] DENIED: Too many requests");
      return true
      
    } else {
      console.log("[checkIPRequest] GRANTED: Proceeding...")
      return false
    }

  } catch (err) {
    console.error("[checkIPRequest] Error checking IP:", err);
    throw err;
  }
};

// Function to save the encrypted IP and current time to DynamoDB
const saveEncryptedIP = async (encryptedIP, currentTime) => {
  try {
    console.log("[saveEncryptedIP} Saving...");
    await dynamoDB
      .put({
        TableName: "AnonibotRequests",
        Item: {
          ipId: encryptedIP,
          requestTime: currentTime,
        },
      })
      .promise();

    console.log("[saveEncryptedIP] Saved successfully");
  } catch (err) {
    console.error("[saveEncryptedIP] Error saving IP:", err);
    throw err;
  }
};

module.exports = {
  encryptIPAddress,
  checkIPRequest,
  saveEncryptedIP,
};
