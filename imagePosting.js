const { IgApiClient } = require("instagram-private-api");
const ig = new IgApiClient();
const AWS = require("aws-sdk");

// LOG INTO IG ACOUNT

async function instagramLogin() {
  console.log(
    `Logging into Instagram account with username '${process.env.IG_USERNAME}'...`
  );
  ig.state.generateDevice(process.env.IG_USERNAME);
  await ig.account.login(process.env.IG_USERNAME, process.env.IG_PASSWORD);
  console.log(`Logged into Instagram account successfully`);
}

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
    console.log(imageUrl)
    return imageUrl;
  } catch (err) {
    console.error("Error saving image to AWS S3:", err);
    throw err;
  }
};

module.exports = {
  saveImageToS3,
  postImage
};
