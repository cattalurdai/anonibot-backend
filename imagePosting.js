const AWS = require("aws-sdk");
const axios = require("axios");

// Set your AWS credentials and region here
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: "sa-east-1",
});

// Initialize S3
const s3 = new AWS.S3();

// INSTAGRAM API
let GRAPH_API = `https://graph.facebook.com/v17.0/${process.env.IG_ACCOUNT_ID}`;

const createPostContainer = async (imageUrl) => {
  try {
    console.log(`[createPostContainer] Creating...`);
    const response = await axios.post(
      `${GRAPH_API}/media?image_url=${imageUrl}&access_token=${process.env.GRAPH_API_ACCESS_TOKEN}`
    );
    console.log(`[createPostContainer] Created successfully id: ${response.data.id}`);
    return response.data.id;
  } catch (err) {
    console.error(err);
    throw err; 
  }
};

const confirmPost = async (containerId) => {
  console.log("[confirmPost] Confirming...")
  try {
    const response = await axios.post(
      `${GRAPH_API}/media_publish?creation_id=${containerId}&access_token=${process.env.GRAPH_API_ACCESS_TOKEN}`
    );
    if (response.status === 200) {
      return response;
    }
  } catch (err) {
    console.error(err);
    throw err; 
  }
};



const uploadImageToS3 = async (imageBuffer) => {
  // Save the image to AWS S3
  const bucketName = "anonibot-s3-bucket"; // Replace with your S3 bucket name
  const imageName = `${Date.now()}.jpg`; // You can customize the image name here
  const params = {
    Bucket: bucketName,
    Key: imageName,
    Body: imageBuffer,
    ContentType: "image/jpeg",
  };

  try {
    console.log(`[uploadImageToS3] Uploading...`);
    await s3.upload(params).promise();
    console.log(`[uploadImageToS3] Uploaded successfully`);
    const imageUrl = `https://${bucketName}.s3.sa-east-1.amazonaws.com/${imageName}`;
    return imageUrl;
  } catch (err) {
    console.error("Error saving image to AWS S3:", err);
    throw err;
  }
};

module.exports = {
  uploadImageToS3,
  createPostContainer,
  confirmPost,
};
