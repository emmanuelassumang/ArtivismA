// view all tours created by a user
// Required fields: user_id
import connectToDB from "../../../db/mongodb";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const { user_id } = req.query;
      if (!user_id) {
        return res.status(400).json({ error: "Missing user_id parameter" });
      }

      const mongooseInstance = await connectToDB();
      const db = mongooseInstance.connection.db;

      const tours = await db.collection("Tours").find({ user_id }).toArray();
      return res.status(200).json({ tours });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
