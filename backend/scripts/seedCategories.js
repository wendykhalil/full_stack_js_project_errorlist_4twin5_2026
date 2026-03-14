const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const Category = require('../src/models/Category');

const categories = [
  { name: 'Basic Materials', slug: 'basic-materials', description: 'Basic construction materials' },
  { name: 'Flooring', slug: 'flooring', description: 'Flooring materials and accessories' },
  { name: 'Paint', slug: 'paint', description: 'Paints and painting supplies' },
  { name: 'Carpentry', slug: 'carpentry', description: 'Wood and carpentry materials' },
  { name: 'Electricity', slug: 'electricity', description: 'Electrical supplies and equipment' },
  { name: 'Plumbing', slug: 'plumbing', description: 'Plumbing materials and fixtures' }
];

async function seedCategories() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing categories
    await Category.deleteMany({});
    console.log('Cleared existing categories');

    // Insert new categories
    const result = await Category.insertMany(categories);
    console.log(`Added ${result.length} categories:`);
    result.forEach(cat => console.log(`- ${cat.name} (ID: ${cat._id})`));

  } catch (error) {
    console.error('Error seeding categories:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

seedCategories();