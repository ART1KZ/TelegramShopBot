import { ExtendedContext } from "../types";

async function confirmCancelOrder(ctx: ExtendedContext, data: string) {
    const orderId = data.split("_")[2];
    await ctx.editMessageText(
        "<b>❓ Вы уверены, что хотите отменить заказ?\n</b>" +
            "<b>⚠️ Не отменяйте заказ, если уже перевели деньги</b>",
        {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "✅ Отменить заказ",
                            callback_data: `cancel_${orderId}`,
                        },
                        {
                            text: "❌ Понюхать бебру",
                            callback_data: `order_${orderId}`,
                        },
                    ],
                ],
            },
            parse_mode: "HTML",
        }
    );
}

export default confirmCancelOrder;
