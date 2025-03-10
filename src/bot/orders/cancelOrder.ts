import mongoose from "mongoose";
import { ExtendedContext } from "../types";
import { Order } from "../../database/models";
import { sendMainMenu } from "../messages";
import { cancelOrderAndProduct } from "./index";

async function cancelOrder(ctx: ExtendedContext, data: string) {
    const orderId = data.split("_")[1];
    const order = await Order.findOne({
        _id: orderId,
        status: "pending",
    });

    if (!order) {
        await sendMainMenu(ctx, "edit");
        return;
    }

    await cancelOrderAndProduct(
        new mongoose.Types.ObjectId(orderId),
        new mongoose.Types.ObjectId(order.product_id)
    );
    await sendMainMenu(ctx, "edit");
}

export default cancelOrder;
