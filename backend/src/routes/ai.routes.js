const express = require("express");
const router = express.Router();
const Product = require("../models/Product");

// route simple IA (sans auth pour tester)
router.get("/search", async (req, res) => {
  try {
    const query = req.query.q;

    const products = await Product.find({
      name: { $regex: query, $options: "i" }
    });

    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;