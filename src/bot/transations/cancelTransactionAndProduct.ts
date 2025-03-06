import { Transaction, Product } from "../../database/models";
import { Types } from "mongoose";

async function cancelTransactionAndProduct(
    transactionId: Types.ObjectId,
    productId: Types.ObjectId
) {
    // Отмена транзакции
    await Transaction.updateOne(
        {
            _id: transactionId,
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

export default cancelTransactionAndProduct;
