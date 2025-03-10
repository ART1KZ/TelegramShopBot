import { ExtendedContext } from "../types";
import { Product } from "../../database/models";
import mongoose from "mongoose";

async function addOrUpdateProduct(
    ctx: ExtendedContext,
    userMessage: string,
    productId: string = "",
    groupId: string = ""
) {
    const session = ctx.session;
    const messageParts = userMessage.split(",").map((part) => part.trim());
    const backButtonCallbackData =
        productId && groupId
            ? `admin_option_product_${productId}_${groupId}`
            : `admin_option_productCities_${session.cityId}`;

    if (messageParts.length !== 4) {
        const msg = await ctx.reply(
            "<b>⚠️ Неверный формат!</b>\n" +
                "Используйте: <code>Название, Цена в RUB, Цена в BTC, Код</code>\n" +
                "Пример: <code>Подписка Netflix 1 месяц, 1200, 0.0005, NETFLIX-12345-XYZ</code>",
            {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: "❌ Отмена",
                                callback_data: backButtonCallbackData,
                            },
                        ],
                    ],
                },
                parse_mode: "HTML",
            }
        );
        session.botLastMessageId = msg.message_id;
        return false;
    }

    const [name, rubPriceStr, btcPriceStr, data] = messageParts;
    const rubPrice = rubPriceStr;
    const btcPrice = btcPriceStr;

    if (
        !name ||
        !rubPrice ||
        isNaN(parseFloat(rubPrice)) ||
        parseFloat(rubPrice) <= 0 ||
        !btcPrice ||
        isNaN(parseFloat(btcPrice)) ||
        parseFloat(btcPrice) <= 0 ||
        !data
    ) {
        const msg = await ctx.reply(
            "<b>⚠️ Ошибка в данных!</b>\n" +
                "Проверьте:\n" +
                "- Название не пустое\n" +
                "- Цена в RUB и BTC — корректные числа больше 0\n" +
                "- Код не пустой\n" +
                "Пример: <code>Подписка Netflix 1 месяц, 1200, 0.0005, NETFLIX-12345-XYZ</code>",
            {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: "❌ Отмена",
                                callback_data: backButtonCallbackData,
                            },
                        ],
                    ],
                },
                parse_mode: "HTML",
            }
        );
        session.botLastMessageId = msg.message_id;
        return false;
    }

    try {
        if (productId) {
            const updateResult = await Product.updateOne(
                { _id: productId },
                {
                    name,
                    rub_price: mongoose.Types.Decimal128.fromString(rubPrice),
                    btc_price: mongoose.Types.Decimal128.fromString(btcPrice),
                    data,
                }
            );
            if (updateResult.matchedCount === 0) {
                await ctx.reply("<b>⚠️ Товар не найден</b>", {
                    parse_mode: "HTML",
                });
                return false;
            }
            const updatedProduct = await Product.findById(productId);
            const sendedMessageId = await ctx
                .reply(
                    `<b>✅ Товар успешно изменён:</b>\n` +
                        `<code>${
                            updatedProduct?.name
                        }, ${updatedProduct?.rub_price.toString()}, ${updatedProduct?.btc_price.toString()}, ${
                            updatedProduct?.data
                        }</code>`,
                    {
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    {
                                        text: "🏠 В меню",
                                        callback_data: "admin_panel",
                                    },
                                ],
                            ],
                        },
                        parse_mode: "HTML",
                    }
                )
                .then((message) => message.message_id);
            session.botLastMessageId = sendedMessageId;
        } else {
            const createdProduct = await Product.create({
                name,
                city_id: session.cityId,
                rub_price: mongoose.Types.Decimal128.fromString(rubPrice),
                btc_price: mongoose.Types.Decimal128.fromString(btcPrice),
                data,
                status: "available",
            });
            const sendedMessageId = await ctx
                .reply(
                    `<b>✅ Товар успешно создан:</b>\n` +
                        `<code>${
                            createdProduct.name
                        }, ${createdProduct.rub_price.toString()}, ${createdProduct.btc_price.toString()}, ${
                            createdProduct.data
                        }</code>`,
                    {
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    {
                                        text: "🏠 В меню",
                                        callback_data: "admin_panel",
                                    },
                                ],
                            ],
                        },
                        parse_mode: "HTML",
                    }
                )
                .then((message) => message.message_id);
            session.botLastMessageId = sendedMessageId;
        }
        session.adminStep = undefined;
        session.cityId = null;
        return true;
    } catch (error) {
        console.error("Ошибка при создании/обновлении товара:", error);
        await ctx.reply(
            "<b>⚠️ Ошибка при обработке товара. Попробуйте позже.</b>",
            {
                parse_mode: "HTML",
            }
        );
        return false;
    }
}

export default addOrUpdateProduct;
