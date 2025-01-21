require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const stripe = require("stripe")(process.env.PAYMENT_SECRET_KEY);
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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
    const metarialCollection = db.collection("metarial");
    const bookedCollection = db.collection("booked");
    const reviewCollection = db.collection("reviews");
    const noteCollection = db.collection("notes");

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

    app.get("/users/role/:email", async (req, res) => {
      const email = req.params.email;
      const result = await userCollection.findOne({ email });
      res.send({ role: result?.role });
    });
    app.get("/all-users/:email", async (req, res) => {
      const search = req.query.search;
      const email = req.params.email;
      // const query = { email: { $ne: email } };
      let query = {
        email: { $ne: email },
        $or: [
          {
            name: {
              $regex: new RegExp(search),
              $options: "i",
            },
          },
          {
            email: {
              $regex: new RegExp(search),
              $options: "i",
            },
          },
        ],
      };
      const user = await userCollection.find(query).toArray();
      res.send(user);
    });
    app.patch("/user/role/:email", async (req, res) => {
      const email = req.params.email;
      const { role } = req.body;
      const filter = { email };
      const updateDoc = {
        $set: { role },
      };
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);
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
    app.get("/tutors/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await tutorCollection.findOne(query);
      res.send(result);
    });
    app.put("/tutors/:id", async (req, res) => {
      const id = req.params.id;
      const { status, registrationFee } = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateData = {
        $set: {
          status,
          registrationFee,
        },
      };
      const result = await tutorCollection.updateOne(filter, updateData, {
        upsert: true,
      });

      res.send(result);
    });
    app.get("/veiwSession/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const sessions = await tutorCollection.find(query).toArray();
      res.send(sessions);
    });

    app.get("/metarial", async (req, res) => {
      const result = await metarialCollection.find().toArray();
      res.send(result);
    });
    app.post("/metarial", async (req, res) => {
      const tutorData = req.body;
      const result = await metarialCollection.insertOne(tutorData);
      res.send(result);
    });
    app.get("/veiwMetarial", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const sessions = await metarialCollection.find(query).toArray();
      res.send(sessions);
    });

    app.get("/metarials/session/:sessionId", async (req, res) => {
      const sessionId = req.params.sessionId;
      const query = { sessionId: sessionId };
      const materials = await metarialCollection.find(query).toArray();
      res.send(materials);
    });

    // app.get("/veiwSession", async (req, res) => {
    //   const email = req.params.email;
    //   const query = { email: email };
    //   const result = await tutorCollection.find(query).toArray();
    //   res.send(result);
    // });
    app.delete("/veiwMetarial/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await metarialCollection.deleteOne(query);
      res.send(result);
    });
    app.put("/VeiwMetarils/:id", async (req, res) => {
      const id = req.params.id;
      const metarialData = req.body;
      const updated = {
        $set: metarialData,
      };
      const query = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const result = await metarialCollection.updateOne(query, updated, options);

      res.send(result);
    });
    app.delete("/tutors/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await tutorCollection.deleteOne(query);
      res.send(result);
    });
    app.get("/veiwMetarial/tutors/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await tutorCollection.findOne(query);
      res.send(result);
    });
    app.put("/updateMetarials/:id", async (req, res) => {
      const id = req.params.id;
      const tutorData = req.body;
      const updated = {
        $set: tutorData,
      };
      const query = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const result = await tutorCollection.updateOne(query, updated, options);

      res.send(result);
    });

    //booked
    app.get("/booked", async (req, res) => {
      const result = await bookedCollection.find().toArray();
      res.send(result);
    });
    app.get("/booked/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookedCollection.findOne(query);
      res.send(result);
    });
    app.post("/booked", async (req, res) => {
      const bookedData = req.body;

      const result = await bookedCollection.insertOne(bookedData);
      res.send(result);
    });
    app.get("/viewBooked", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await bookedCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/reviews", async (req, res) => {
      const result = await reviewCollection.find().toArray();
      res.send(result);
    });
    app.post("/reviews", async (req, res) => {
      const reviewData = req.body;
      const result = await reviewCollection.insertOne(reviewData);
      res.send(result);
    });
    app.get("/review/session/:sessionId", async (req, res) => {
      const sessionId = req.params.sessionId;
      const query = { sessionId: sessionId };
      const result = await reviewCollection.find(query).toArray();
      res.send(result);
    });

    //note
    app.get("/notes", async (req, res) => {
      const result = await noteCollection.find().toArray();
      res.send(result);
    });
    app.post("/notes", async (req, res) => {
      const noteData = req.body;
      const result = await noteCollection.insertOne(noteData);
      res.send(result);
    });
    app.get("/veiwNotes", async (req, res) => {
      const email = req.query.email;
      const query = {
        studentEmail: email,
      };
      const result = await noteCollection.find(query).toArray();
      res.send(result);
    });
    app.delete("/notes/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await noteCollection.deleteOne(query);
      res.send(result);
    });
    app.get("/veiwNotes/notes/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await noteCollection.findOne(query);
      res.send(result);
    });
    app.put("/updateNotes/:id", async (req, res) => {
      const id = req.params.id;
      const noteData = req.body;
      const updated = {
        $set: noteData,
      };
      const query = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const result = await noteCollection.updateOne(query, updated, options);

      res.send(result);
    });
    // create payment intent
    app.post("/create-payment-intent", async (req, res) => {
      const { registrationFee } = req.body;
      if (!registrationFee || isNaN(registrationFee)) {
        return res.status(400).send({ error: "Invalid registration fee." });
      }

      const fee = Math.round(registrationFee * 100);

      const { client_secret } = await stripe.paymentIntents.create({
        amount: fee,
        currency: "usd",
        automatic_payment_methods: {
          enabled: true,
        },
      });
      res.send({ clientSecret: client_secret });
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
