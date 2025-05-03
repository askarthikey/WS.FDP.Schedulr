const express = require("express");
const userApp = express.Router();
const dotenv = require("dotenv");
const expressAsyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const bcryptjs = require("bcryptjs");

dotenv.config();

userApp.use((req, res, next) => {
  const usersCollection = req.app.get("usersCollection");
  req.usersCollection = usersCollection;
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
    const usersCollection = req.usersCollection;
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

// Public routes (no authentication required)
userApp.post(
  "/signup",
  expressAsyncHandler(async (req, res) => {
    const newUser = req.body;
    const usersCollection = req.usersCollection;
    const dbUser = await usersCollection.findOne({
      username: newUser.username,
    });
    if (dbUser != null) {
      res.status(409).json({message:"User already exists!!"});
    } else {
      const hashedPass = await bcryptjs.hash(newUser.password, 6);
      newUser.password = hashedPass;
      await usersCollection.insertOne(newUser);
      res.status(201).json({ message: "User created successfully" });
    }
  }),
);

userApp.post("/signin",expressAsyncHandler(async(req,res)=>{
  const userCred=req.body
  const usersCollection=req.usersCollection
  const dbUser= await usersCollection.findOne({username:userCred.username})
  if(dbUser===null){
    res.send({ message: "Invalid Credentials - User not found in DB"})
  }
  else if(dbUser.isBlocked==="true"){
   res.send({message:"You have been blocked. Please contact admin for more details!!"}) 
  }
  else{
    const status=await bcryptjs.compare(userCred.password,dbUser.password)
    if(status===false){
      res.send({message:"Incorrect Password!! Please try again"})
    }
    else{
      const signedToken = jwt.sign({username:dbUser.username},process.env.SECRET_KEY)
      res.send({message:"Login Successful!!",token:signedToken,user:dbUser})
    }
  }
}))

// Protected routes (authentication required)
// Update Profile Route
userApp.put("/updateProfile", verifyToken, expressAsyncHandler(async(req, res) => {
  // We can use req.user.username instead of relying on the body
  const username = req.user.username;
  const { fullName, email, department, designation, bio } = req.body;
  const usersCollection = req.usersCollection;
  
  // Update user profile
  const updateResult = await usersCollection.updateOne(
    { username },
    { $set: { 
      fullName: fullName || req.user.fullName,
      email: email || req.user.email,
      department: department || req.user.department,
      designation: designation || req.user.designation,
      bio: bio || req.user.bio
    }}
  );

  if (updateResult.modifiedCount === 0) {
    return res.status(400).json({ message: "No changes made to profile" });
  }

  // Get updated user data
  const updatedUser = await usersCollection.findOne({ username });
  
  res.status(200).json({
    message: "Profile updated successfully",
    user: updatedUser
  });
}));

// Change Password Route
userApp.put("/changePassword", verifyToken, expressAsyncHandler(async(req, res) => {
  const { currentPassword, newPassword } = req.body;
  const username = req.user.username;
  const usersCollection = req.usersCollection;
  
  const isPasswordValid = await bcryptjs.compare(currentPassword, req.user.password);
  if (!isPasswordValid) {
    return res.status(401).json({ message: "Current password is incorrect" });
  }
  
  const hashedNewPassword = await bcryptjs.hash(newPassword, 6);
  const updateResult = await usersCollection.updateOne(
    { username },  
    { $set: { password: hashedNewPassword }}
  );
  
  if (updateResult.modifiedCount === 0) {
    return res.status(400).json({ message: "Password could not be updated" });
  }
  
  res.status(200).json({ message: "Password changed successfully" });
}));

// Delete Account Route
userApp.delete("/deleteAccount", verifyToken, expressAsyncHandler(async(req, res) => {
  const { password } = req.body;
  const username = req.user.username;
  const usersCollection = req.usersCollection;
  
  const isPasswordValid = await bcryptjs.compare(password, req.user.password);
  if (!isPasswordValid) {
    return res.status(401).json({ message: "Password is incorrect" });
  }
  
  const deleteResult = await usersCollection.deleteOne({ username });
  if (deleteResult.deletedCount === 0) {
    return res.status(400).json({ message: "Could not delete account" });
  }
  
  res.status(200).json({ message: "Account deleted successfully" });
}));

module.exports = userApp;
