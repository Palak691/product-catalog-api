import dotenv from 'dotenv';
// dotenv.config();
dotenv.config({ path: '../.env' });
import mongoose from "mongoose";
import {Product} from '../models/Product.js';

// dotenv.config();
const MONGO_URI = process.env.MONGO_URI;

 
const TOTAL_PRODUCTS = 200000 ;
const BATCH_SIZE = 5000;

const CATEGORIES = [
  "Electronics",
  "Clothing",
  "Home & Kitchen",
  "Books",
  "Sports & Outdoors",
  "Toys & Games",
  "Beauty & Personal Care",
  "Grocery",
  "Automotive",
  "Office Supplies",
];

const ADJECTIVES = [
  "Premium", "Compact", "Wireless", "Portable", "Classic", "Deluxe",
  "Eco-Friendly", "Heavy-Duty", "Lightweight", "Smart", "Vintage", "Pro",
];

const NOUNS = [
  "Backpack", "Headphones", "Blender", "Notebook", "Sneakers", "Lamp",
  "Charger", "Water Bottle", "Jacket", "Keyboard", "Mug", "Speaker",
  "Desk Organizer", "Yoga Mat", "Watch", "Sunglasses",
];


function randomInt(min,max){// rand inter b/w max and min val (inclusive)
    return Math.floor(Math.random() *  (max - min + 1)) + min ;
}

function randomChoice(arr){
    return arr[randomInt(0, arr.length - 1)]
}



function randomPrice() {
  return Number((Math.random()*1000).toFixed(2));
}

function randomName(){
    return `${randomChoice(ADJECTIVES)} ${randomChoice(NOUNS)}`;
}


function randomCreatedAt() {
  const now = Date.now();
  const twoYearsMs = 2 * 365 * 24 * 60 * 60 * 1000;
  const ts = now - randomInt(0, twoYearsMs);
  // Round down to the nearest second to intentionally increase collision rate.
  return new Date(Math.floor(ts / 1000) * 1000);
}



function generateBatch(size){
    let docs = [];
    for(let i = 0 ; i < size ; i++){
        const createdAt = randomCreatedAt();
        docs.push({
            name : randomName(),
            category : randomChoice(CATEGORIES),
            price : randomPrice(),
            createdAt,
            updatedAt : createdAt
        });
      }
      return docs;
}

// async function seed() {
//   console.log(`Connecting to ${MONGO_URI}`);
//   await mongoose.connect(MONGO_URI);

//   console.log("Dropping existing products collection (if any) ...");
//   await Product.collection.drop().catch(() => {
//     // collection may not exist yet on first run - that's fine
//   });

//   console.log(`Inserting ${TOTAL_PRODUCTS} products in batches of ${BATCH_SIZE} ...`);
//   const start = Date.now();

//   for (let inserted = 0; inserted < TOTAL_PRODUCTS; inserted += BATCH_SIZE) {
//     const size = Math.min(BATCH_SIZE, TOTAL_PRODUCTS - inserted);
//     const batch = generateBatch(size);
//     await Product.insertMany(batch, { ordered: false });

//     console.log(`  inserted ${inserted + size} / ${TOTAL_PRODUCTS}`);
//   }

//   console.log("Building indexes ...");
//   await Product.syncIndexes();

//   const elapsedSec = ((Date.now() - start) / 1000).toFixed(1);
//   console.log(`Done. Inserted ${TOTAL_PRODUCTS} products in ${elapsedSec}s.`);

//   await mongoose.disconnect();
// }

// seed().catch((err) => {
//   console.error("Seed failed:", err);
//   process.exit(1);
// });



async function seed() {
  await mongoose.connect(MONGO_URI);

  try {
    await Product.collection.drop();
  } catch {}

  for (let inserted = 0; inserted < TOTAL_PRODUCTS; inserted += BATCH_SIZE) {
    const size = Math.min(BATCH_SIZE, TOTAL_PRODUCTS - inserted);

    const batch = generateBatch(size);

    await Product.insertMany(batch);
  }

  await mongoose.disconnect();
}

seed().catch(console.error);