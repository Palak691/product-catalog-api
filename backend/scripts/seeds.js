import dotenv from 'dotenv';
// dotenv.config();
dotenv.config({ path: '../.env' });
import mongoose from "mongoose";
import {Product} from '../models/Product.js';

// dotenv.config();
const MONGO_URI = process.env.MONGO_URI;

 
const TOTAL_PRODUCTS = 200000 ;
const BATCH_SIZE = 5000;


const CATEGORIES = [ "Electronics", "Clothing", "Home & Kitchen", "Books", "Sports & Outdoors",
  "Toys & Games", "Beauty & Personal Care", "Grocery", "Automotive", "Office Supplies",
];

const ADJECTIVES = [
  "Premium", "Compact", "Wireless", "Portable", "Classic", "Deluxe",
  "Eco-Friendly", "Heavy-Duty", "Lightweight", "Smart", "Vintage", "Pro",
];

const PRODUCTS = {
  Electronics: [ "Laptop", "Smartphone","Tablet", "Smartwatch", "Headphones", "Earbuds", "Keyboard",
 "Mouse","Monitor","Printer","Webcam","Power Bank","USB Drive","Bluetooth Speaker","Router", ],

  Clothing: ["T-Shirt","Jeans","Shirt","Jacket","Hoodie","Sweater","Shorts","Sneakers","Socks",
    "Cap","Dress","Skirt","Blazer","Tracksuit","Scarf",],

  "Home & Kitchen": [  "Cookware Set",  "Frying Pan",  "Pressure Cooker",  "Mixer Grinder",  "Blender",
  "Electric Kettle", "Microwave Oven", "Dining Table", "Chair", "Bedsheet", "Pillow", "Blanket", "Storage Box", "Vacuum Cleaner", "Air Fryer",
  ],

  Books: [
    "JavaScript Guide","Node.js Handbook","React Basics","Python Programming","Data Structures","Algorithms",
    "Clean Code","Atomic Habits","Deep Work","The Pragmatic Programmer",
    "Rich Dad Poor Dad", "Think and Grow Rich", "Harry Potter", "The Hobbit", "The Alchemist",
  ],

  "Sports & Outdoors": ["Football","Cricket Bat","Basketball","Tennis Racket","Yoga Mat",
    "Skipping Rope", "Dumbbells", "Resistance Bands", "Camping Tent", "Sleeping Bag", "Cycling Helmet",
    "Water Bottle","Badminton Racket","Running Shoes","Fitness Tracker",
  ],

  "Toys & Games": [
    "LEGO Set", "Puzzle", "Chess Board", "Playing Cards", "Remote Control Car", "Action Figure",
    "Doll","Board Game","Rubik's Cube","Toy Train","Building Blocks","Drone Toy","Stuffed Teddy Bear",
    "Toy Kitchen Set","UNO Cards",
  ],

  "Beauty & Personal Care": [
    "Face Wash","Moisturizer","Shampoo","Conditioner","Body Lotion","Sunscreen",
    "Lip Balm","Hair Dryer","Perfume","Deodorant","Face Serum","Toothbrush","Electric Trimmer",
    "Hair Oil","Hand Cream",
  ],

  Grocery: [
    "Rice","Wheat Flour","Sugar","Salt","Tea","Coffee","Cooking Oil",
    "Pasta","Noodles","Lentils","Spices","Biscuits","Honey","Peanut Butter","Oats",
  ],

  Automotive: [
    "Car Cover","Engine Oil","Car Vacuum","Tyre Inflator","Phone Holder","Seat Cover","Car Perfume",
    "Dash Camera","Jump Starter","Toolkit","Helmet","Bike Cover",
    "Car Charger","Windshield Cleaner","Microfiber Cloth",
  ],

  "Office Supplies": [
    "Notebook","Ball Pen","Pencil","Marker","Stapler","Paper Clips",
    "Desk Organizer","Calculator","Printer Paper","Sticky Notes","File Folder","Whiteboard","Scissors",
    "Glue Stick","Clipboard",
  ],
};


function randomInt(min,max){// rand inter b/w max and min val (inclusive)
    return Math.floor(Math.random() *  (max - min + 1)) + min ;
}

function randomChoice(arr){
    return arr[randomInt(0, arr.length - 1)]
}

function randomPrice() {
  return Number((Math.random()*1000).toFixed(2));
}

function randomName(category){
    return `${randomChoice(ADJECTIVES)} ${randomChoice(PRODUCTS[category])}`;
}


function randomCreatedAt() {
  const now = Date.now();
  const twoYearsMs = 2 * 365 * 24 * 60 * 60 * 1000;
  const ts = now - randomInt(0, twoYearsMs);
  // Round down to increase collision rate.
  return new Date(Math.floor(ts / 1000) * 1000);
}



function generateBatch(size){
    let docs = [];
    for(let i = 0 ; i < size ; i++){
        const createdAt = randomCreatedAt();
        const category = randomChoice(CATEGORIES);
        docs.push({
          category,
            name : randomName(category),
            price : randomPrice(),
            createdAt,
            updatedAt : createdAt
        });
      }
      return docs;
}




async function seed() {
  await mongoose.connect(MONGO_URI);

  try {
    await Product.collection.drop();
  } catch {}

  for (let inserted = 0; inserted < TOTAL_PRODUCTS; inserted += BATCH_SIZE) {
    const size = Math.min(BATCH_SIZE, TOTAL_PRODUCTS - inserted);

    const batch = generateBatch(size);

    await Product.insertMany(batch, {ordered : false});
  }

  await mongoose.disconnect();
}

seed().catch(console.error);