[1mdiff --git a/imagePosting.js b/imagePosting.js[m
[1mindex adb897a..85daa99 100644[m
[1m--- a/imagePosting.js[m
[1m+++ b/imagePosting.js[m
[36m@@ -75,7 +75,7 @@[m [mconst confirmPost = async (containerId) => {[m
 [m
 const { IgApiClient } = require("instagram-private-api");[m
 const ig = new IgApiClient();[m
[31m-[m
[32m+[m[32minstagramLogin();[m
 // LOG INTO IG ACOUNT[m
 [m
 async function instagramLogin() {[m
[36m@@ -88,7 +88,6 @@[m [masync function instagramLogin() {[m
 }[m
 [m
 async function createPrivateApiPost(imageBuffer) {[m
[31m-  await instagramLogin();[m
   let image = await imageBuffer;[m
 [m
   try {[m
[1mdiff --git a/server.js b/server.js[m
[1mindex 0d3347b..0ff0f2a 100644[m
[1m--- a/server.js[m
[1m+++ b/server.js[m
[36m@@ -34,6 +34,7 @@[m [mapp.use(cors());[m
 [m
 // HTTPS[m
 [m
[32m+[m[32m/*[m
 const sslOptions = {[m
   key: fs.readFileSync("/etc/letsencrypt/live/api.anonibot.com/privkey.pem"),[m
   cert: fs.readFileSync("/etc/letsencrypt/live/api.anonibot.com/cert.pem"),[m
[36m@@ -44,16 +45,17 @@[m [mconst server = https.createServer(sslOptions, app);[m
 [m
 server.listen(PORT, () => {[m
   console.log("Server initialized on PORT " + PORT);[m
[31m-});[m
[32m+[m[32m});[m[41m [m
[32m+[m[32m*/[m
  [m
 [m
 [m
 // HTTP[m
[31m-/*[m
[32m+[m
   app.listen(PORT, () => {[m
   console.log("DEVELOPMENT: Server initialized on PORT " + PORT);[m
 }); [m
[31m-*/[m
[32m+[m
 [m
 // GET IMAGE PREVIEW REQUEST[m
 [m
