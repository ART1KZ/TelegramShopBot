
import { ExtendedContext } from "../types";
import { Transaction, Product } from "../../database/models"
import { InferSchemaType, Document } from "mongoose";

const transactionSchema = Transaction.schema;
const productSchema = Product.schema;

type TransactionType = InferSchemaType<typeof transactionSchema> & Document;
type ProductType = InferSchemaType<typeof productSchema> & Document;

async function sendInvoicePayable(ctx: ExtendedContext, transaction: TransactionType, product: ProductType, btcAddressToPay: string) {
            
            // Рассчитываем время "Оплатить до" (30 минут от created_at)
            const createdAt = new Date(transaction.created_at); // Время создания в UTC
            const expiresAt = new Date(createdAt.getTime() + 30 * 60 * 1000); // +30 минут в UTC
    
            // Форматируем время в МСК (UTC+3)
            const expiresAtFormatted =
                expiresAt.toLocaleTimeString("ru-RU", {
                    timeZone: "Europe/Moscow",
                    hour12: false,
                    hour: "2-digit",
                    minute: "2-digit",
                }) + " ПО МСК";
    
            return await ctx.editMessageText(
                `<b>📅 Товар:</b> ${product.name}\n` +
                `<b>🆔 Заказ №:</b> <code>${transaction._id}</code>\n\n` +
                    `Отправьте <code>${transaction.btc_amount}</code> BTC на адрес: <code>${btcAddressToPay}</code>\n\n` +
                    `<b>ВАЖНО!!! Оплатите до ${expiresAtFormatted}</b>\n\n` +
                    `После оплаты нажмите <b>"Проверить оплату"</b>\n` +
                    `Текущий и завершенные заказы вы можете найти\n` +
                    `во вкладке <b>"🛍️ Мои заказы"</b> в главном меню`,
                {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: "🔍 Проверить оплату",
                                    callback_data: `check_${transaction._id}`,
                                },
                            ],
                            [
                                {
                                    text: "❌ Отменить покупку",
                                    callback_data: `cancel_${transaction._id}`,
                                },
                            ],
                        ],
                    },
                    parse_mode: "HTML",
                }
            );
}

export default sendInvoicePayable;