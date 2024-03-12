# Anonibot

Anonibot is a platform designed to facilitate anonymous sharing on Instagram. With Anonibot, users can express themselves freely without revealing their identity, allowing them to share secrets, thoughts, or messages anonymously with the world.

## Features

- **Anonymous Posting:** Users can post messages anonymously without revealing their identity.
- **Customization:** Anonibot provides customization options, allowing users to customize the appearance of their posts with different themes, fonts, and sizes.
- **Instagram Integration:** The platform automatically uploads the customized posts to Instagram, making them visible to the public.
- **Security Measures:** Anonibot implements security measures to prevent spam and ensure the integrity of the platform, including IP checks and user blacklisting.

## Technologies Used

Anonibot is built using the following technologies:

- **Node.js:** The backend server is built using Node.js, providing a robust and scalable infrastructure.
- **Express:** Anonibot utilizes the Express framework to handle HTTP requests and routing.
- **AWS S3:** Images generated by Anonibot are stored securely in an AWS S3 bucket.
- **Instagram API:** Anonibot integrates with the Instagram API to post images directly to Instagram.
- **Canvas:** Image creation is done using the Canvas library to dynamically generate images with customized text and styles.
- **DynamoDB:** User requests and blacklist data are stored in DynamoDB, ensuring efficient data management.

## Usage

1. **Preview Generation:** Users can generate a preview of their post by sending a request with text, theme, font, and size parameters to the `/getPreview` endpoint.
2. **Post Creation:** To create a post, users send a request with text, theme, font, and size parameters to the `/createPost` endpoint. Anonibot automatically generates the image, uploads it to Instagram, and saves the user's request.
3. **Admin Access:** Administrators can access user requests and blacklist data through the `/userRequests` and `/blacklist` endpoints, respectively. These endpoints are protected with authentication to ensure only authorized access.

Anonibot provides a seamless and secure platform for users to share their thoughts and messages anonymously on Instagram.

## Requirements

Before installing and running Anonibot, ensure you have the following prerequisites set up:

- **Node.js**: Make sure you have Node.js installed on your system. You can download it from the [official Node.js website](https://nodejs.org/).
- **AWS Account**: Anonibot uses AWS services for storing images (Amazon S3) and managing user requests (Amazon DynamoDB). You need an AWS account and appropriate credentials to access AWS services. Sign up for an AWS account [here](https://aws.amazon.com/).
- **Instagram Account**: An Instagram account is required for posting images. Ensure you have an Instagram account and the necessary credentials ready.
- **Environment Variables**: Set up environment variables in a `.env` file as described in the installation steps below.

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/anonibot.git
   ```

2. Install dependencies:

   ```bash
   cd anonibot
   npm install
   ```

3. Set up environment variables:

   Create a `.env` file in the root directory and add the following variables:

   ```plaintext
   ENVIRONMENT=development
   POST_TIME_LIMIT=24
   AWS_ACCESS_KEY=your_aws_access_key
   AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
   DEV_IG_ACCOUNT_ID=your_instagram_account_id
   DEV_GRAPH_API_ACCESS_TOKEN=your_instagram_graph_api_access_token
   DEV_IG_USERNAME=your_instagram_username
   DEV_IG_PASSWORD=your_instagram_password
   ```

   Replace `development` with `production` if deploying in a production environment. Fill in the values for AWS and Instagram accordingly.

4. Start the server:

   ```bash
   npm start
   ```

## Usage

### Get Image Preview

Endpoint: `POST /getPreview`

Request body:
```json
{
  "text": "Your text here",
  "theme": "Theme name",
  "font": "Font name",
  "size": "Font size"
}
```

### Create Post

Endpoint: `POST /createPost`

Request body:
```json
{
  "text": "Your text here",
  "theme": "Theme name",
  "font": "Font name",
  "size": "Font size"
}
```

### Get User Requests Table

Endpoint: `GET /userRequests`

### Get Blacklist Table

Endpoint: `GET /blacklist`

### Add User to Blacklist

Endpoint: `POST /blacklist`

Query parameters:
- `userHash`: User hash to be blacklisted.

### Remove User from Blacklist

Endpoint: `DELETE /blacklist`

Query parameters:
- `userHash`: User hash to be removed from the blacklist.

### Save Request

Endpoint: `POST /saveRequest`

No request body required.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
