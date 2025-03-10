import { Order, Product } from "../../database/models";
import { Types } from "mongoose";

async function cancelOrderAndProduct(
    orderId: Types.ObjectId,
    productId: Types.ObjectId
) {
    // Отмена транзакции
    await Order.updateOne(
        {
            _id: orderId,
            status: "pending",
        },
        { status: "canceled" }
    );

    // Возвращение товару статуса "available"
    await Product.updateOne(
        { _id: productId, status: "reserved" },
        { status: "available", reserved_at: null }
    );
}

export default cancelOrderAndProduct;
