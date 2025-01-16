require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion } = require("mongodb");
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fcial.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const db = client.db("studyHive");
    const tutorCollection = db.collection("tutors");
    const userCollection = db.collection("users");

    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    //jwt
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.send({ token });
    });

    // Save or Update a User
    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };

      // Check if user already exists
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ success: false, message: "User already exists." });
      }

      const result = await userCollection.insertOne({
        name: user.name,
        email: user.email,
        photo: user.photo,
        role: user.role,
        timestamp: new Date(),
      });

      res.send({ success: true, message: "User added successfully.", result });
    });
    app.get("/users", async (req, res) => {
      const email = req.query.email;

      const user = await userCollection.findOne({ email });
      if (!user) {
        return res
          .status(404)
          .send({ success: false, message: "User not found." });
      }

      res.send({ success: true, role: user.role });
    });

    app.get("/tutors", async (req, res) => {
      const result = await tutorCollection.find().toArray();
      res.send(result);
    });
    app.post("/tutors", async (req, res) => {
      const tutorData = req.body;
      const result = await tutorCollection.insertOne(tutorData);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("studyHive is running");
});

app.listen(port, () => {
  console.log(`Study Hive is running on pot ${port}`);
});
