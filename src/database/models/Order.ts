import { Schema, model } from "mongoose";

const OrderSchema = new Schema({
    created_at: { type: Date, default: () => new Date() },
    customer_tg_id: { type: Number, required: true },
    product_id: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    btc_amount: { type: Number, required: true },
    status: {
        type: String,
        enum: ["pending", "completed", "canceled"],
        default: "pending",
    },
    tx_hash: { type: String },
});

const Order = model("Order", OrderSchema);

export default Order;
