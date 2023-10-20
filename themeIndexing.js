const fs = require('fs');
const path = require('path');

// Define the directory path where your theme JSON files are located
const themesDirectory = path.join(__dirname, 'utils/themes');

// Initialize an empty array to store theme index data
const themeIndex = [];

// Read the list of files in the themes directory
fs.readdir(themesDirectory, (err, files) => {
  if (err) {
    console.error('Error reading theme files:', err);
    return;
  }

  // Iterate through the files and process each theme JSON
  files.forEach((file) => {
    const filePath = path.join(themesDirectory, file);
    const themeData = require(filePath); // Load each JSON file

    // Check if "sm", "md", and "lg" properties are present in the theme data
    const supportedSizes = [];
    if (themeData.sm) supportedSizes.push('sm');
    if (themeData.md) supportedSizes.push('md');
    if (themeData.lg) supportedSizes.push('lg');

    // Create an index entry for the theme
    const themeIndexEntry = {
      id: themeData.id,
      supportedSizes,
      genre: themeData.genre,
    };

    // Add the theme to the index
    themeIndex.push(themeIndexEntry);
  });

  // Write the theme index to a JSON file
  const indexFilePath = path.join(__dirname, 'themeIndex.json');
  fs.writeFileSync(indexFilePath, JSON.stringify(themeIndex, null, 2));

  console.log('Theme index created and saved to themeIndex.json');
});
