import { ExtendedContext } from "../types";
import { Product, Configuration, Order } from "../../database/models";
import mongoose from "mongoose";
import {
    generateUniqueAmount,
    getUserCanceledOrders,
    sendInvoicePayable,
} from "../orders";

async function purchaseProduct(ctx: ExtendedContext, data: string) {
    if (!ctx.from || !ctx.from.id) {
        await ctx.answerCallbackQuery("Не удалось определить пользователя");
        return;
    }

    const name = data.split("_")[1];
    const product = await Product.findOne({
        name,
        status: "available",
        city_id: ctx.session.cityId,
    });
    const config = await Configuration.findOne();

    if (!product || !config?.btc_address) {
        await ctx.answerCallbackQuery("Ошибка при покупке");
        return;
    }

    const userId = ctx.from.id;
    const pending = await Order.findOne({
        customer_tg_id: userId,
        status: "pending",
    });
    if (pending) {
        await ctx.answerCallbackQuery("У вас есть активный заказ");
        return;
    }

    const cancels = await getUserCanceledOrders(userId, 10);
    if (cancels.length > 2) {
        await ctx.answerCallbackQuery(
            "Слишком много отмен заказов. Подождите 10 минут"
        );
        return;
    }

    product.status = "reserved";
    product.reserved_at = new Date();
    await product.save();

    const order = new Order({
        customer_tg_id: userId,
        product_id: product._id,
        btc_amount: generateUniqueAmount(
            product.btc_price as mongoose.Types.Decimal128
        ),
        status: "pending",
    });
    await order.save();

    await sendInvoicePayable(ctx, order, product, config.btc_address);
}

export default purchaseProduct;
