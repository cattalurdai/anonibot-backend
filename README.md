
# Anonibot

Anonibot is a platform that allows users to anonymously share their secrets with the world via Instagram. Express yourself, customize your posts, and automatically upload them to Instagram for everyone to see.

## Features

- **Anonymous Sharing:** Share your secrets without revealing your identity.
- **Customization:** Customize your posts with different themes, fonts, and sizes.
- **Automatic Posting:** Posts are automatically uploaded to Instagram for public viewing.

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
   ```

   Replace `development` with `production` if deploying in a production environment.

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
```
```
