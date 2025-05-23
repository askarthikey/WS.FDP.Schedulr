const express = require('express');
const workshopApp = express.Router();
const expressAsyncHandler = require('express-async-handler');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');

dotenv.config();

workshopApp.use((req, res, next) => {
  const workshopCollection = req.app.get('workshopCollection');
  req.workshopCollection = workshopCollection;
  next();
});

// Admin authentication middleware
const verifyAdmin = expressAsyncHandler(async (req, res, next) => {
  // User must be authenticated first
  if (!req.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  if (req.user.isAdmin !== "true") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
});

// Authentication middleware
const verifyToken = expressAsyncHandler(async (req, res, next) => {
  try {
    // Get token from the Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: "No token provided, access denied" });
    }
    
    // Extract the token
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    
    // Find user from database
    const usersCollection = req.app.get('usersCollection');
    const user = await usersCollection.findOne({ username: decoded.username });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Check if user is blocked
    if (user.isBlocked === "true") {
      return res.status(403).json({ message: "Your account has been blocked. Please contact admin." });
    }
    
    // Add user info to request
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token, authentication failed" });
  }
});

// Check if user has create access
const verifyCreateAccess = expressAsyncHandler(async (req, res, next) => {
  try {
    // Admin always has create access
    if (req.user.isAdmin === "true") {
      return next();
    }
    
    // Check if user has create access
    if (!req.user.hasCreateAccess) {
      return res.status(403).json({ 
        message: "You don't have permission to create workshops. Please contact an administrator."
      });
    }
    
    // Check if create access has expired
    if (req.user.createAccessExpiry) {
      const expiryDate = new Date(req.user.createAccessExpiry);
      const currentDate = new Date();
      
      if (currentDate > expiryDate) {
        // Access has expired, update the user record
        const usersCollection = req.app.get('usersCollection');
        await usersCollection.updateOne(
          { _id: req.user._id },
          { $set: { hasCreateAccess: false, createAccessExpiry: null } }
        );
        
        return res.status(403).json({ 
          message: "Your workshop creation access has expired. Please contact an administrator to renew."
        });
      }
    }
    
    next();
  } catch (error) {
    return res.status(500).json({ 
      message: "Error checking create access permissions", 
      error: error.message 
    });
  }
});

// Create a new workshop - Protected route
workshopApp.post('/create', verifyToken, verifyCreateAccess, expressAsyncHandler(async(req, res) => {
  const newWks = req.body;
  const workshopCollection = req.workshopCollection;
  
  // Add creator information from the authenticated user
  newWks.createdBy = req.user.username;
  
  // Validate required fields
  if (!newWks.eventTitle) {
    return res.status(400).json({ message: "Workshop title is required" });
  }
  
  try {
    const dbWks = await workshopCollection.findOne({ eventTitle: newWks.eventTitle });
    if (dbWks !== null) {
      return res.status(409).json({ message: "Workshop with same name exists. Use different title" });
    }
    else {
      const result = await workshopCollection.insertOne(newWks);
      
      // Record this creation in the user's record if they're not an admin
      if (req.user.isAdmin !== "true") {
        const usersCollection = req.app.get('usersCollection');
        await usersCollection.updateOne(
          { _id: req.user._id },
          { $inc: { workshopsCreated: 1 } }
        );
      }
      
      return res.status(201).json({ message: "Workshop Created Successfully!!", id: result.insertedId });
    }
  } catch (error) {
    return res.status(500).json({ message: "Server error while creating workshop", error: error.message });
  }
}));

// Get all workshops - Public route
workshopApp.get('/getwks', expressAsyncHandler(async(req, res) => {
  try {
    const workshopCollection = req.workshopCollection;
    const wkshps = await workshopCollection.find().toArray();
    return res.status(200).json({ Workshops: wkshps });
  } catch (error) {
    return res.status(500).json({ message: "Error retrieving workshops", error: error.message });
  }
}));

// Update a workshop - Protected route
workshopApp.put('/editwks/:eventTitle', verifyToken, expressAsyncHandler(async(req, res) => {
  try {
    const workshopCollection = req.workshopCollection;
    const title = req.params.eventTitle;
    const updateWks = req.body;
    
    // Check if workshop exists before updating
    const existingWorkshop = await workshopCollection.findOne({ eventTitle: title });
    if (!existingWorkshop) {
      return res.status(404).json({ message: "Workshop not found" });
    }
    const isAdmin = req.user.isAdmin === "true";
    
    if (!isAdmin) {
      // Check if user is in editAccessUsers array
      const hasAccess = existingWorkshop.editAccessUsers && 
        existingWorkshop.editAccessUsers.includes(req.user.username);
      
      if (!hasAccess) {
        return res.status(403).json({ message: "You don't have permission to edit this workshop" });
      }
      
      // Check if access has expired
      const username = req.user.username;
      const expiryDate = existingWorkshop.accessExpiry?.[username];
      
      if (expiryDate) {
        const expiryDateTime = new Date(expiryDate).getTime();
        const currentTime = new Date().getTime();
        
        if (currentTime > expiryDateTime) {
          return res.status(403).json({ message: "Your edit access has expired" });
        }
      }
    }
    
    // Prevent changing the creator
    delete updateWks.createdBy;
    
    const result = await workshopCollection.updateOne({ eventTitle: title }, { $set: updateWks });
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Workshop not found" });
    }
    
    if (result.modifiedCount === 0) {
      return res.status(304).json({ message: "No changes made to the workshop" });
    }
    
    return res.status(200).json({ message: "Update successful", details: result });
  } catch (error) {
    return res.status(500).json({ message: "Error updating workshop", error: error.message });
  }
}));

// Delete a workshop - Protected route
workshopApp.delete('/delwks/:eventTitle', verifyToken, expressAsyncHandler(async(req, res) => {
  try {
    const workshopCollection = req.workshopCollection;
    const title = req.params.eventTitle;
    
    // Check if workshop exists before deleting
    const existingWorkshop = await workshopCollection.findOne({ eventTitle: title });
    if (!existingWorkshop) {
      return res.status(404).json({ message: "Workshop not found" });
    }
    // Check if user is an admin
    if (req.user.isAdmin !== 'true') {
      return res.status(403).json({ message: "You don't have permission to delete this workshop" });
    }
    
    const result = await workshopCollection.deleteOne({ eventTitle: title });
    
    if (result.deletedCount === 0) {
      return res.status(500).json({ message: "Failed to delete workshop" });
    }
    
    return res.status(200).json({ message: "Deleted Successfully!!" });
  } catch (error) {
    return res.status(500).json({ message: "Error deleting workshop", error: error.message });
  }
}));

// Get workshops sorted by date - Public route
workshopApp.get('/sortedgetwks', expressAsyncHandler(async(req, res) => {
  try {
    const workshopCollection = req.workshopCollection;
    const sortedwks = await workshopCollection.find().sort({ eventStDate: 1 }).toArray();
    return res.status(200).json({ message: "Retrieved Successfully", details: sortedwks });
  } catch (error) {
    return res.status(500).json({ message: "Error retrieving sorted workshops", error: error.message });
  }
}));


// Grant access to a user to edit a workshop - Protected route
workshopApp.put('/grantAccess/:eventTitle', verifyToken, verifyAdmin, expressAsyncHandler(async(req, res) => {
  try {
    const workshopCollection = req.workshopCollection;
    const title = req.params.eventTitle;
    const { username, expiryDate } = req.body;
    
    // Validate input
    if (!username || !expiryDate) {
      return res.status(400).json({ message: "Username and expiry date are required" });
    }
    
    // Check if workshop exists
    const existingWorkshop = await workshopCollection.findOne({ eventTitle: title });
    if (!existingWorkshop) {
      return res.status(404).json({ message: "Workshop not found" });
    }
    
    // Check if user has permission to grant access (creator or admin)
    if (req.user.isAdmin !== "true") {
      return res.status(403).json({ message: "You don't have permission to modify access for this workshop" });
    }
    
    // Update or add the user to editAccessUsers array
    const result = await workshopCollection.updateOne(
      { eventTitle: title }, 
      { 
        $addToSet: { editAccessUsers: username },
        $set: { [`accessExpiry.${username}`]: expiryDate } 
      }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Workshop not found" });
    }
    
    return res.status(200).json({ 
      message: "Access granted successfully", 
      username: username,
      expiryDate: expiryDate 
    });
    
  } catch (error) {
    return res.status(500).json({ message: "Error granting access", error: error.message });
  }
}));

// Get workshops by category - Public route
workshopApp.get('/selectedwks/:cat', expressAsyncHandler(async(req, res) => {
  try {
    const workshopCollection = req.workshopCollection;
    const cat = req.params.cat;
    
    // Handle array field search correctly
    const selectwks = await workshopCollection.find({ category: cat }).sort({ eventStDate: 1 }).toArray();
    
    // Even if no workshops match, return 200 with empty array
    return res.status(200).json({ message: "Successful retrieval", details: selectwks });
  } catch (error) {
    return res.status(500).json({ message: "Error retrieving workshops by category", error: error.message });
  }
}));

// Get user's created workshops - Protected route
workshopApp.get('/myworkshops', verifyToken, expressAsyncHandler(async(req, res) => {
  try {
    const workshopCollection = req.workshopCollection;
    const username = req.user.username;
    
    const userWorkshops = await workshopCollection.find({ createdBy: username }).toArray();
    
    return res.status(200).json({ 
      message: "Retrieved user workshops successfully",
      workshops: userWorkshops
    });
  } catch (error) {
    return res.status(500).json({ message: "Error retrieving user workshops", error: error.message });
  }
}));

module.exports = workshopApp;