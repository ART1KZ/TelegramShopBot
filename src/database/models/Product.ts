import { Schema, model, Types } from "mongoose";

const ProductSchema = new Schema({
    created_at: {
        type: Date,
        default: () => new Date(),
    },
    city_id: {
        type: Schema.Types.ObjectId,
        ref: "City",
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    rub_price: {
        type: Types.Decimal128,
        required: true,
    },
    btc_price: { type: Types.Decimal128, required: true },
    status: {
        type: String,
        enum: ["available", "reserved", "sold"],
        default: "available",
    },
    data: {
        type: String,
        required: true,
    },
    reserved_at: {
        type: Date || null,
        default: null,
    },
    sold_at: {
        type: Date || null,
        default: null,
    },
});

const Product = model("Product", ProductSchema);

export default Product;
