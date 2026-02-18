const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
app.use(express.json());

// 👇 PUT TEST ROUTE HERE
app.get("/api/test-db", async (req, res) => {
  const User = require("./models/User");

  const user = await User.create({
    fullName: "Test",
    email: "test@test.com",
    password: "123456",
    phone: "99999999",
    role: "ARTISAN",
  });

  res.json(user);
});

// DB connection here
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
