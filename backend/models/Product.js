import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name : {
        type : String,
        required : true
    },
    category : {
        type : String,
        required : true
    },
    price : {
        type : Number,
        required : true
    }
},{timestamps : true});

productSchema.index({category : 1 , createdAt : -1 , _id : -1});
productSchema.index({createdAt : -1 , _id : -1});
export const Product = mongoose.model("Product", productSchema);