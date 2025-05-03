const express = require("express");
const { MongoClient, MongoError } = require("mongodb");
const dotenv = require("dotenv").config();
const userApp = require("./APIs/userApi");
const workshopApp = require("./APIs/workshopApi");
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

MongoClient.connect(process.env.DB_URL)
  .then(client => {
    // Get database object
    const db = client.db("nexuZ");
    
    // Get collection objects
    const usersCollection = db.collection("usersCollection");
    const workshopCollection = db.collection("workshopCollection");
    
    // Share collection objects with express app
    app.set("usersCollection", usersCollection);
    app.set("workshopCollection", workshopCollection);
    
    // Confirm db connection status
    console.log("DB connection successful!!");
  })
  .catch(err => console.log("Error in connection of database", err.message));

app.use("/userApi", userApp);
app.use("/workshopApi", workshopApp);
app.use((err, req, res, next) => {
  res.send({ message: "Error", payload: err.message });
});

const port = process.env.PORTNO || 5000;
app.listen(port, () => console.log(`Server is running on port ${port}`));
