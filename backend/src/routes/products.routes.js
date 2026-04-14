const express = require("express");
const router = express.Router();
const Product = require("../models/Product");

// GET PUBLIC PRODUCTS (avec API KEY)
router.get("/public/products", async (req, res) => {
  try {
    const apiKey = req.headers["x-api-key"];

    if (!apiKey || apiKey !== process.env.API_KEY) {
      return res.status(401).json({ message: "Non autorisé" });
    }

    const products = await Product.find({ isApproved: true });

    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;