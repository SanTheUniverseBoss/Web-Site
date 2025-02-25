const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { OAuth2Client } = require("google-auth-library");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

const UserSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  googleId: String,
});

const CommentSchema = new mongoose.Schema({
  canvasId: mongoose.Schema.Types.ObjectId,
  userId: mongoose.Schema.Types.ObjectId,
  text: String,
  timestamp: { type: Date, default: Date.now },
});

const CanvasSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  canvasData: Object,
  collaborators: [{ userId: mongoose.Schema.Types.ObjectId, role: String }],
  versionHistory: [{
    canvasData: Object,
    timestamp: { type: Date, default: Date.now },
  }],
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", UserSchema);
const Canvas = mongoose.model("Canvas", CanvasSchema);
const Comment = mongoose.model("Comment", CommentSchema);

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User({ username, email, password: hashedPassword });
  await newUser.save();
  res.json({ message: "User registered successfully" });
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: "User not found" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
  res.json({ token, userId: user._id });
});

app.post("/save-canvas", async (req, res) => {
  const { userId, canvasData, collaborators } = req.body;
  const existingCanvas = await Canvas.findOne({ userId });
  if (existingCanvas) {
    existingCanvas.versionHistory.push({ canvasData });
    existingCanvas.canvasData = canvasData;
    existingCanvas.collaborators = collaborators;
    await existingCanvas.save();
  } else {
    const newCanvas = new Canvas({ userId, canvasData, collaborators, versionHistory: [{ canvasData }] });
    await newCanvas.save();
  }
  res.json({ message: "Canvas saved successfully" });
});

app.get("/load-canvas/:userId", async (req, res) => {
  const { userId } = req.params;
  const canvases = await Canvas.find({
    $or: [
      { userId },
      { collaborators: { $elemMatch: { userId } } }
    ]
  });
  res.json(canvases);
});

app.post("/add-comment", async (req, res) => {
  const { canvasId, userId, text } = req.body;
  const newComment = new Comment({ canvasId, userId, text });
  await newComment.save();
  res.json({ message: "Comment added successfully" });
});

app.get("/get-comments/:canvasId", async (req, res) => {
  const { canvasId } = req.params;
  const comments = await Comment.find({ canvasId }).populate("userId", "username");
  res.json(comments);
});

io.on("connection", (socket) => {
  console.log("User connected", socket.id);

  socket.on("join-canvas", (canvasId) => {
    socket.join(canvasId);
  });

  socket.on("canvas-update", ({ canvasId, canvasData }) => {
    socket.to(canvasId).emit("receive-update", canvasData);
  });

  socket.on("new-comment", async ({ canvasId, userId, text }) => {
    const newComment = new Comment({ canvasId, userId, text });
    await newComment.save();
    io.to(canvasId).emit("receive-comment", { userId, text });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected", socket.id);
  });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
