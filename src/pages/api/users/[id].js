// src/pages/api/users/[id].ts
import { ObjectId } from "mongodb";
import connectToDB from "../../../utils/dbConnect";

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const db = (await connectToDB()).connection.db;

    const user = await db.collection("users").findOne({ _id: new ObjectId(id) });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    delete user.password_hash;

    return res.status(200).json({ user });
  } catch (error) {
    console.error("Failed to fetch user:", error);
    return res.status(500).json({ error: "Server error" });
  }
}
