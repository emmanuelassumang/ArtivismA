// /api/auth/signup
// import connectToDB from "../../../db/mongodb";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import connectToDB from "../../../utils/dbConnect";

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const { username, email, password, city } = req.body;
      console.log(req.body);
      if (!username || !email || !password) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const mongooseInstance = await connectToDB();
      const db = mongooseInstance.connection.useDb("artivism");

      const existingUser = await db.collection("users").findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = {
        username,
        email,
        password_hash: hashedPassword,
        city,
        profile_created_at: new Date(),
        liked_arts: [],
        created_tours: [],
      };

      const result = await db.collection("users").insertOne(newUser);

      const token = jwt.sign({ userId: result.insertedId }, "your_secret_key", {
        expiresIn: "7d",
      });

      return res.status(201).json({ message: "User registered", token });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
