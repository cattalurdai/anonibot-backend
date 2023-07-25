const { createCanvas, loadImage, registerFont } = require("canvas");

async function wrapText(ctx, text, x, y, maxWidth, lineHeight, textAlign) {
  const words = text.split(" ");
  let line = "";
  let offsetY = 0;

  if (textAlign === "center") {
    x += maxWidth / 2;
  } else if (textAlign === "right") {
    x += maxWidth;
  }

  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + " ";
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && i > 0) {
      ctx.fillText(line, x, y + offsetY);
      line = words[i] + " ";
      offsetY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y + offsetY);
}

const buildImage = async (text, selectedTheme) => {
    console.log(
      `Creating image with theme '${selectedTheme}' and text '${text}'...`
    );
  
    // Read the theme JSON file based on the selected theme
    let themeData = require(`./utils/themes/${selectedTheme}.json`);
  
    // Register the font
    registerFont(themeData.fontPath, { family: "customFont" });
  
    // Load the background image
    const image = await loadImage(`./dist/img/${selectedTheme}.png`);
  
    // Create canvas and draw the background image on it
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext("2d");
    ctx.textDrawingMode = "glyph";
    ctx.drawImage(image, 0, 0, image.width, image.height);
  
    // Set the font style
    const fontSize = 48;
    ctx.font = `${fontSize}px customFont`;
  
    // Set the text color
    const textColor = themeData.textColor || "black";
    ctx.fillStyle = textColor;
  
    // Set the text position
    const textX = themeData.textPosition.x || 0;
    const textY = themeData.textPosition.y || 0;
  
    // Set the maximum width of the text container
    const maxWidth = themeData.maxWidth || image.width;
  
    // Set the text alignment
    const alignMethod = themeData.alignMethod || "left";
    ctx.textAlign = alignMethod;
  
    // Draw the wrapped text on the canvas
    await wrapText(ctx, text, textX, textY, maxWidth, fontSize + 10, alignMethod);
  
    // Get the buffer containing the image data
    const imageBuffer = canvas.toBuffer("image/jpeg");
  
    console.log(`Image created successfully`);
    return imageBuffer;
  };
  

module.exports = {
    buildImage,
};