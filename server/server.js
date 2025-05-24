const express = require("express");
const { MongoClient, MongoError } = require("mongodb");
const dotenv = require("dotenv").config();
const userApp = require("./APIs/userApi");
const workshopApp = require("./APIs/workshopApi");
const cors = require('cors');
const cron = require('node-cron');

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
    
    // Set up daily cleanup job for expired access
    setupDailyCleanup(workshopCollection, usersCollection);
    
    // Confirm db connection status
    console.log("DB connection successful!!");
  })
  .catch(err => console.log("Error in connection of database", err.message));

// Function to set up daily cleanup job
function setupDailyCleanup(workshopCollection, usersCollection) {
  // Schedule to run at midnight every day (00:00)
  cron.schedule('0 0 * * *', async () => {
    try {
      console.log("Running daily cleanup...");
      const currentDate = new Date();
      
      // 1. Clean up workshop access expiry
      console.log("Cleaning up expired workshop access...");
      const workshops = await workshopCollection.find({ accessExpiry: { $exists: true } }).toArray();
      
      for (const workshop of workshops) {
        const accessExpiry = workshop.accessExpiry || {};
        const editAccessUsers = workshop.editAccessUsers || [];
        const usersToRemove = [];
        let needsUpdate = false;
        
        // Check each user's expiry date
        for (const [username, expiryDateStr] of Object.entries(accessExpiry)) {
          const expiryDate = new Date(expiryDateStr);
          
          if (currentDate > expiryDate) {
            // Access has expired
            delete accessExpiry[username];
            usersToRemove.push(username);
            needsUpdate = true;
          }
        }
        
        if (needsUpdate) {
          // Filter out expired users while keeping admins
          const updatedEditAccessUsers = editAccessUsers.filter(user => !usersToRemove.includes(user));
          
          // Update the document in the database
          await workshopCollection.updateOne(
            { _id: workshop._id },
            { 
              $set: { 
                accessExpiry: accessExpiry,
                editAccessUsers: updatedEditAccessUsers
              }
            }
          );
          
          console.log(`Cleaned up expired access for workshop '${workshop.eventTitle}' - Removed ${usersToRemove.length} users`);
        }
      }
      
      // 2. NEW: Clean up expired create access for users
      console.log("Cleaning up expired create access for users...");
      const result = await usersCollection.updateMany(
        {
          hasCreateAccess: true,
          createAccessExpiry: { $exists: true, $lt: currentDate.toISOString() }
        },
        {
          $set: {
            hasCreateAccess: false,
            createAccessExpiry: null
          }
        }
      );
      
      console.log(`Revoked expired create access from ${result.modifiedCount} users`);
      console.log("Daily cleanup completed successfully");
      
    } catch (error) {
      console.error("Error during daily cleanup:", error);
    }
  });
  
  console.log("Daily cleanup job scheduled");
}

// Daily job to check and revoke expired create access
const cronCreateAccessCleanup = cron.schedule('0 0 * * *', async () => {
  try {
    console.log("Running daily create access cleanup...");
    const currentDate = new Date().toISOString();
    
    const result = await usersCollection.updateMany(
      { 
        hasCreateAccess: true,
        createAccessExpiry: { $lt: currentDate } 
      },
      { 
        $set: { 
          hasCreateAccess: false,
          createAccessExpiry: null
        }
      }
    );
    
    console.log(`Revoked expired create access from ${result.modifiedCount} users`);
  } catch (err) {
    console.error("Error in create access cleanup job:", err);
  }
});

app.use("/userApi", userApp);
app.use("/workshopApi", workshopApp);
app.use((err, req, res, next) => {
  res.send({ message: "Error", payload: err.message });
});

const port = process.env.PORTNO || 5000;
app.listen(port, () => console.log(`Server is running on port ${port}`));
