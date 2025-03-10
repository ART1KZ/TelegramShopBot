import { ExtendedContext } from "../types";
import { Order, Configuration, Product } from "../../database/models";
import { checkPaymentApi } from "./index";

async function checkPayment(ctx: ExtendedContext, data: string) {
    const lastPaymentCheck = ctx.session.lastPaymentCheck;
    const currentTime = Date.now();
    const minuteInMs = 1000 * 60;

    if (
        lastPaymentCheck &&
        lastPaymentCheck.getTime() + minuteInMs > currentTime
    ) {
        const allowedTimeToCheck = lastPaymentCheck.getTime() + minuteInMs;
        const secondsLeftToCheck = Math.floor(
            (allowedTimeToCheck - currentTime) / 1000
        );
        await ctx.answerCallbackQuery(`Подождите ${secondsLeftToCheck} секунд`);
        return;
    }

    const orderId = data.split("_")[1];
    const order = await Order.findOne({
        _id: orderId,
        status: "pending",
    });

    if (!order) {
        await ctx.answerCallbackQuery("Не удалось проверить оплату");
        return;
    }

    const config = await Configuration.findOne();
    if (!config?.btc_address) {
        await ctx.answerCallbackQuery("Адрес оплаты не настроен");
        return;
    }

    const btcAmount = parseFloat(order.btc_amount.toString());
    const paymentResult = await checkPaymentApi(
        config.btc_address,
        btcAmount,
        order.created_at,
        24 // проверка транзакций за последние 24 часа
    );
    ctx.session.lastPaymentCheck = new Date();

    if (paymentResult.paid) {
        order.status = "completed";
        order.tx_hash = paymentResult.tx_hash; // сохранение хеша транзакции
        await order.save();

        const product = await Product.findById(order.product_id);
        if (product) {
            product.status = "sold";
            product.sold_at = new Date();
            await product.save();

            await ctx.editMessageText(
                `<b>🎉 Спасибо за покупку!</b>\n` +
                    `<b>🆔 Заказ №:</b> <code>${order._id}</code>\n` +
                    `<b>💎 Ваш товар:</b> <code>${product.data}</code>\n` +
                    `<b>🔗 Хэш транзакции:</b> <code>${paymentResult.tx_hash}</code>`,
                {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: "🏠 В главное меню",
                                    callback_data: "menu",
                                },
                            ],
                        ],
                    },
                    parse_mode: "HTML",
                }
            );
        }
    } else {
        await ctx.answerCallbackQuery("Оплата ещё не получена");
    }
}

export default checkPayment;
