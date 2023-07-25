const AWS = require("aws-sdk");
const axios = require("axios");

// INSTAGRAM API

let GRAPH_API = `https://graph.facebook.com/v17.0/${process.env.IG_ACCOUNT_ID}`;

const createPostContainer = async (imageUrl) => {
  try {
    const response = await axios.post(
      `${GRAPH_API}/media?image_url=${imageUrl}&access_token=${process.env.GRAPH_API_ACCESS_TOKEN}`
    );
    console.log(`Post container created successfully id: ${response.data.id}`);
    return response.data.id;
  } catch (err) {
    console.error(err);
    throw err; // Rethrow the error to be caught by the calling function if needed
  }
};

const confirmPost = async (containerId) => {
  try {
    const response = await axios.post(
      `${GRAPH_API}/media_publish?creation_id=${containerId}&access_token=${process.env.GRAPH_API_ACCESS_TOKEN}`
    );
    if (response.status === 200) {
      console.log(`SUCCESS: Image posted successfully`);
      return response;
    }
  } catch (err) {
    console.error(err);
    throw err; // Rethrow the error to be caught by the calling function if needed
  }
};

// Set your AWS credentials and region here
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: "sa-east-1",
});

// Initialize S3
const s3 = new AWS.S3();

const saveImageToS3 = async (imageBuffer) => {
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
    await s3.upload(params).promise();
    console.log(`Image saved to AWS S3 successfully`);
    const imageUrl = `https://${bucketName}.s3.sa-east-1.amazonaws.com/${imageName}`;
    console.log(imageUrl);
    return imageUrl;
  } catch (err) {
    console.error("Error saving image to AWS S3:", err);
    throw err;
  }
};

module.exports = {
  saveImageToS3,
  createPostContainer,
  confirmPost,
};
