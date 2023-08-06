const AWS = require("aws-sdk");
const axios = require("axios");

// SET AWS CREDENTIALS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: "sa-east-1",
});

// INITIALIZE S3
const s3 = new AWS.S3();

// UPLOAD IMAGE TO S3 BUCKET
const uploadImageToS3 = async (imageBuffer) => {
  const bucketName = "anonibot-s3-bucket";
  const imageName = `${Date.now()}.jpg`;
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

// BUILD INSTAGRAM GRAPH API
let GRAPH_API = `https://graph.facebook.com/v17.0/${process.env.IG_ACCOUNT_ID}`;

// CREATE POST CONTAINER
const createPostContainer = async (imageUrl) => {
  try {
    console.log(`[createPostContainer] Creating...`);
    const response = await axios.post(
      `${GRAPH_API}/media?image_url=${imageUrl}&access_token=${process.env.GRAPH_API_ACCESS_TOKEN}`
    );
    console.log(
      `[createPostContainer] Created successfully id: ${response.data.id}`
    );
    return response.data.id;
  } catch (err) {
    console.error(err);
    throw err;
  }
};

// CONFIRM POST CONTAINER(PUSLISH)
const confirmPost = async (containerId) => {
  console.log("[confirmPost] Confirming post container...");
  try {
    const response = await axios.post(
      `${GRAPH_API}/media_publish?creation_id=${containerId}&access_token=${process.env.GRAPH_API_ACCESS_TOKEN}`
    );
    if (response.status === 200) {
      console.log("[confirmPost] Confirmed");
      return response;
    }
  } catch (err) {
    console.error(err);
    throw err;
  }
};



const { IgApiClient } = require("instagram-private-api");
const ig = new IgApiClient();
instagramLogin();
// LOG INTO IG ACOUNT

async function instagramLogin() {
  console.log(
    `Logging into Instagram account with username '${process.env.IG_USERNAME}'...`
  );
  ig.state.generateDevice(process.env.IG_USERNAME);
  await ig.account.login(process.env.IG_USERNAME, process.env.IG_PASSWORD);
  console.log(`Logged into Instagram account successfully`);
}

async function createPrivateApiPost(imageBuffer) {
  let image = await imageBuffer;

  try {
    const publishResult = await ig.publish.photo({
      file: image,
    });
    console.log("[createPrivateApiPost] Image posted successfully");
  } catch (error) {
    throw new Error("Error while posting the image with private API");
  }
}


module.exports = {
  uploadImageToS3,
  createPostContainer,
  confirmPost,
  createPrivateApiPost
};
