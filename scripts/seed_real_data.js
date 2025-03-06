import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import connectToDB from "../src/utils/dbConnect.js";

async function seedDB(file_path) {
  try {
    const mongooseInstance = await connectToDB();
    const db = mongooseInstance.connection.useDb("artivism");
    const artCollection = db.collection("arts");

    const rawData = fs.readFileSync(file_path, "utf-8");
    const originalData = JSON.parse(rawData);

    await artCollection.insertMany(originalData);
    console.log("Data seeded successfully");
  } catch (error) {
    console.error("Error seeding the database:", error);
  }
}

const file_path = path.join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "data",
  "cleaned_Month-2024-08.json" // Ensure this points to your actual data file
);

if (import.meta.url === `file://${process.argv[1]}`) {
  seedDB(file_path)
    .then(() => {
      console.log("Seeded data successfully");
      mongooseInstance.connection.close(); // Close the connection after testing
    })
    .catch((error) => {
      console.error("Seeded data failed:", error);
    });
}
// seedDB(file_path);
