import { ExtendedContext } from "../types";
import { Order } from "../../database/models";

async function updateAdminItem(ctx: ExtendedContext, data: string) {
    const parts = data.split("_");
    const type = parts[2];
    const id = parts[3];

    if (type === "city" && id) {
        ctx.session.adminStep = data;
        await ctx.editMessageText("<b>🏙️ Введите новое название города:</b>", {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "❌ Назад",
                            callback_data: `admin_option_city_${id}`,
                        },
                    ],
                ],
            },
            parse_mode: "HTML",
        });
    } else if (type === "password") {
        ctx.session.adminStep = "admin_update_password";
        await ctx.editMessageText(
            `<b>🔑 Отправьте новый пароль (без пробелов):</b>\nПример: <code>da1s2lKsa!13L_asd2</code>`,
            {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "❌ Назад", callback_data: "admin_config" }],
                    ],
                },
                parse_mode: "HTML",
            }
        );
    } else if (type === "address") {
        const hasPending =
            (await Order.find({ status: "pending" }).countDocuments()) > 0;
        if (hasPending) {
            await ctx.answerCallbackQuery(
                "Нельзя изменить адрес при активных заказах"
            );
            return;
        }
        ctx.session.adminStep = "admin_update_address";
        await ctx.editMessageText(
            `<b>💸 Отправьте новый адрес BTC:</b>\nПример: <code>1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa</code>`,
            {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "❌ Назад", callback_data: "admin_config" }],
                    ],
                },
                parse_mode: "HTML",
            }
        );
    } else if (type === "product") {
        const groupId = parts[4];
        ctx.session.adminStep = data;
        await ctx.editMessageText(
            "<b>📦 Введите новую информацию товара:</b>\n" +
                "Отправьте данные в формате: <code>Название, Цена в RUB, Цена в BTC, Данные товара</code>\n" +
                "Пример: <code>Подписка Netflix 1 месяц, 1200, 0.0005, NETFLIX-12345-XYZ</code>",
            {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: "❌ Отмена",
                                callback_data: `admin_option_product_${id}_${groupId}`,
                            },
                        ],
                    ],
                },
                parse_mode: "HTML",
            }
        );
    }
}

export default updateAdminItem;
