// const mongoose = require('mongoose');
// const Category = require('./src/models/Category');

// async function seedCategories() {
//   await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bmp');

//   const categories = [
//     { name: 'Matériaux de base', slug: 'materiaux-de-base' },
//     { name: 'Revêtements de sol', slug: 'revetements-de-sol' },
//     { name: 'Peinture', slug: 'peinture' },
//     { name: 'Menuiserie', slug: 'menuiserie' },
//     { name: 'Electricité', slug: 'electricite' },
//     { name: 'Plomberie', slug: 'plomberie' }
//   ];

//   for (const cat of categories) {
//     const existing = await Category.findOne({ slug: cat.slug });
//     if (!existing) {
//       await new Category(cat).save();
//       console.log(`Seeded ${cat.name}`);
//     } else {
//       console.log(`${cat.name} exists`);
//     }
//   }

//   await mongoose.disconnect();
//   console.log('Seeding complete');
// }

// seedCategories().catch(console.error);

