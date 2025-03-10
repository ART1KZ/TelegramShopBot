import { ExtendedContext } from "../types";
import { Order, Configuration, Product } from "../../database/models";
import { sendInvoicePayable } from "./index";

async function selectOrder(ctx: ExtendedContext, data: string) {
    const orderId = data.split("_")[1];
    const order = await Order.findById(orderId);
    const product = order ? await Product.findById(order.product_id) : null;
    const config = await Configuration.findOne();

    if (!order || !product || !config?.btc_address) {
        await ctx.answerCallbackQuery("Заказ не найден");
        return;
    }

    if (product.status === "sold") {
        await ctx.editMessageText(
            `<b>🆔 Заказ №:</b> <code>${order._id}</code>\n` +
                `<b>🏷️ Название товара:</b> ${product.name}\n` +
                `<b>💎 Товар:</b> <code>${product.data}</code>`,
            {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "❌ Назад", callback_data: "orders" }],
                    ],
                },
                parse_mode: "HTML",
            }
        );
    } else if (product.status === "reserved") {
        await sendInvoicePayable(ctx, order, product, config.btc_address);
    } else {
        await ctx.editMessageText(
            `<b>🆔 Заказ №:</b> <code>${order._id}</code>\n` +
                `<b>🏷️ Название товара:</b> ${product.name}\n` +
                `<b>❌ Статус:</b> Отменен`,
            {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "❌ Назад", callback_data: "orders" }],
                    ],
                },
                parse_mode: "HTML",
            }
        );
    }
}

export default selectOrder;
