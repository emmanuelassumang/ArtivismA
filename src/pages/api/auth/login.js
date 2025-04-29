// /api/auth/login
import connectToDB from "../../../db/mongodb";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Missing email or password" });
      }

      const mongooseInstance = await connectToDB();
      // const db = mongooseInstance.connection.db;
      const db = mongooseInstance.connection.useDb("artivism");
      const user = await db.collection("users").findOne({ email: email });
      if (!user) {
        return res.status(400).json({ error: "User not found" });
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(400).json({ error: "Invalid credentials" });
      }

      const token = jwt.sign(
        { userId: user._id, username: user.username },
        "your_secret_key",
        {
          expiresIn: "7d",
        }
      );

      return res.status(200).json({ message: "Login successful", token });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
