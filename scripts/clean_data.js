const fs = require("fs");
const { ObjectId } = require("mongodb");
const path = require("path");

// Load the original JSON file
const baseFilePath = path.join(__dirname, "..", "data");
const dataFilePath = path.join(baseFilePath, "Month-2024-08.json");
const cleanedFilePath = path.join(baseFilePath, "cleaned_Month-2024-08.json");
const rawData = fs.readFileSync(dataFilePath, "utf-8");


const originalData = JSON.parse(rawData);

// Function to get a random subset of 500 artworks
const getRandomSubset = (data, count = 500) => {
  return data
    .sort(() => 0.5 - Math.random())
    .slice(0, Math.min(count, data.length));
};

// Function to clean and transform artwork data
const transformArtworkData = (originalData) => {
  const possibleThemes = [
    "Activism",
    "Environment",
    "Social Justice",
    "Cultural Heritage",
    "Abstract",
  ];
  return originalData.map((art) => ({
    _id: new ObjectId().toString(), // Ensure _id is a string
    image_url: art.url || "",
    location: {
      coordinates: [art.latitude, art.longitude] || [0.0, 0.0],
      city: art.city_id || "Unknown",
      address: art.address || "Unknown Address",
      country: art.country || "Unknown Country",
    },
    artists:
      art.artists_count > 0
        ? Array.from(
            { length: art.artists_count },
            (_, i) => art[`artist${i + 1}_title`] || "Unknown Artist"
          )
        : ["Unknown Artist"],
    name: art.title || "Untitled",
    themes:
      art.themes && art.themes.length > 0
        ? art.themes
        : [possibleThemes[Math.floor(Math.random() * possibleThemes.length)]], // Assign random themes
    description: art.description || "No description available",
    created_at: art.time_created || new Date().toISOString(),
    interactions: {
      likes_count: 0,
      comments: [],
    },
  }));
};

// Get a random 500 items from the JSON file
const randomSubset = getRandomSubset(originalData, 500);
const cleanedArtworks = transformArtworkData(randomSubset);

// Write the cleaned data to a new JSON file
fs.writeFileSync(
  cleanedFilePath,
  JSON.stringify(cleanedArtworks, null, 2),
  "utf-8"
);

console.log("Cleaned JSON file has been created successfully!");
