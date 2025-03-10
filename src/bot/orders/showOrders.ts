import { ExtendedContext } from "../types";
import { Order, Product } from "../../database/models";
import { InlineKeyboard } from "grammy";

async function showOrders(ctx: ExtendedContext, admin: boolean = false) {
    if (admin) {
        ctx.session.adminStep = "admin_find_order";
        await ctx.editMessageText(
            "<b>🔎 Введите № заказа</b>\n" +
                "✅ Пример: <code>67cdc2bfd4c99c56fcd3f2f4</code>",
            {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "❌ Назад", callback_data: "admin_panel" }],
                    ],
                },
                parse_mode: "HTML",
            }
        );
        return;
    }

    if (!ctx.from || !ctx.from.id) {
        await ctx.answerCallbackQuery("Не удалось определить пользователя");
        return;
    }

    const orders = await Order.find({
        customer_tg_id: ctx.from.id,
        status: { $in: ["completed", "pending", "canceled"] },
    });

    const keyboard = new InlineKeyboard();
    await Promise.all(
        orders.map(async (order) => {
            const product = await Product.findById(order.product_id);
            if (product) {
                let icon = order.status === "completed" ? "✅" : "🔄";
                if (order.status === "canceled") {
                    icon = "🚫";
                }
                keyboard
                    .text(`${icon} ${product.name}`, `order_${order._id}`)
                    .row();
            }
        })
    );
    keyboard.row().text("🗑️ Удалить отмененные заказы", "orders_clear");
    keyboard.row().text("❌ Назад", "menu");

    await ctx.editMessageText("<b>🛒 Ваши заказы:</b>", {
        reply_markup: keyboard,
        parse_mode: "HTML",
    });
}

export default showOrders;
