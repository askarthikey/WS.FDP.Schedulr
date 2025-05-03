const express = require("express");
const { MongoClient, MongoError } = require("mongodb");
const dotenv = require("dotenv");
const userApp = require("./APIs/userApi");
const workshopApp = require("./APIs/workshopApi");
const cors = require('cors');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
const connectDB = async () => {
  try {
    const client = await MongoClient.connect(process.env.DB_URL, {
      tls: true,
      tlsAllowInvalidCertificates: false,
      tlsAllowInvalidHostnames: false,
    });
    const db = client.db("nexuZ");
    const usersCollection = db.collection("usersCollection");
    const workshopCollection = db.collection("workshopCollection");
    app.set("usersCollection", usersCollection);
    app.set("workshopCollection", workshopCollection);
    console.log("DB connection successful!!");
  } catch (err) {
    console.log("Error in connection of database", err.message);
  }
};

// Initialize DB connection
connectDB();

app.use("/userApi", userApp);
app.use("/workshopApi", workshopApp);
app.use((err, req, res, next) => {
  res.send({ message: "Error", payload: err.message });
});

const port = process.env.PORTNO || 5000;
app.listen(port, () => console.log(`Server is running on port ${port}`));
