import { Router } from "express";
import { Product } from "../models/Product.js";
const router = Router();

function encodeCursor(createdAt, id) {

  const cursorObject = {
    createdAt: createdAt.toISOString(), 
    id: id.toString(),                  
  };
  

  const jsonString = JSON.stringify(cursorObject);

  const base64Cursor = Buffer.from(jsonString, "utf8").toString("base64url");

  return base64Cursor;
}




function decodeCursor(cursorString) {
  try {
    const jsonString = Buffer.from(cursorString, "base64url").toString("utf8");

    const cursorObject = JSON.parse(jsonString);

    return {
      createdAt: new Date(cursorObject.createdAt),
      id: cursorObject.id,                          
    };
  } catch (error) {
    return null;
  }
}



router.get("/products", async (req, res) => {
  try {

    const requestedLimit = parseInt(req.query.limit, 10); 
    const limit = Math.min(requestedLimit || 20, 100);    

    const category = req.query.category;

    const cursorString = req.query.cursor;
    


    const filter = {};

    if (category && category !== "all") {
      filter.category = category;
    }


    if (cursorString) {
      const decodedCursor = decodeCursor(cursorString);

      if (decodedCursor === null) {
        return res.status(400).json({ error: "Invalid cursor" });
      }


      filter.$or = [
        {
          createdAt: { $lt: decodedCursor.createdAt }, 
        },
        {
          createdAt: decodedCursor.createdAt,           
          _id: { $lt: decodedCursor.id },               
        },
      ];
    }


    const fetchedDocs = await Product.find(filter)
      .sort({ createdAt: -1, _id: -1 }) 
      .limit(limit + 1)                  
      .lean();                           




    const hasNextPage = fetchedDocs.length > limit;

    const productsToReturn = hasNextPage ? fetchedDocs.slice(0, limit) : fetchedDocs;

    let nextCursor = null;

    if (hasNextPage && productsToReturn.length > 0) {
      const lastProduct = productsToReturn[productsToReturn.length - 1];
      nextCursor = encodeCursor(lastProduct.createdAt, lastProduct._id);
    }

    res.json({
      products: productsToReturn,
      nextCursor: nextCursor, 
      hasMore: hasNextPage,   
    });

  } catch (err) {
    console.error("GET /products error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});




router.get("/categories", async (req, res) => {
  try {
    const categoriesList = await Product.distinct("category");

    categoriesList.sort();

    res.json({ categories: categoriesList });

  } catch (err) {
    console.error("GET /categories error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


export default router;