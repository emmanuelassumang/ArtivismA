import connectToDB from "../src/utils/dbConnect.js";

async function updateArtworks() {
  try {
    const mongooseInstance = await connectToDB();
    const db = mongooseInstance.connection.db;

    // Step 1: Find all artworks and convert the cursor to an array
    const artworksCursor = await db.collection("arts").find({});
    const artworks = await artworksCursor.toArray(); // Convert cursor to array
    console.log(artworks);

    // Iterate through each artwork and fix the schema
    for (const artwork of artworks) {
      const { interactions } = artwork;

      // Check if interactions exist
      if (interactions) {
        // Update likes and comments arrays based on interactions
        const likes =
          interactions.likes_count > 0
            ? new Array(interactions.likes_count).fill("userIdPlaceholder")
            : []; // Update with actual user data
        const comments = interactions.comments || [];

        // Set the new schema
        artwork.likes = likes;
        artwork.comments = comments;

        // Remove the old interactions field
        delete artwork.interactions;

        // Update the artwork document in the collection
        await db
          .collection("arts")
          .updateOne({ _id: artwork._id }, { $set: artwork });
        console.log(`Updated artwork: ${artwork._id}`);
      }
    }

    console.log("All artworks have been updated.");
  } catch (err) {
    console.error("Error updating artworks:", err);
  }
}

updateArtworks();
