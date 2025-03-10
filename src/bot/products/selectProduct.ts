import { ExtendedContext } from "../types";
import { Product } from "../../database/models";

async function selectProduct(ctx: ExtendedContext, data: string) {
    const [_, name, rubPrice] = data.split("_");
    const product = await Product.findOne({
        name,
        rub_price: parseInt(rubPrice),
        status: "available",
        city_id: ctx.session.cityId,
    });

    if (!product) {
        await ctx.answerCallbackQuery("Товар недоступен");
        return;
    }

    await ctx.editMessageText(
        `<b>📦 Товар:</b> "${product.name}"\n<b>💸 Цена:</b> ${product.rub_price} RUB`,
        {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "🛒 Купить",
                            callback_data: `purchase_${product.name}`,
                        },
                    ],
                    [
                        {
                            text: "❌ Назад",
                            callback_data: `city_${ctx.session.cityId}`,
                        },
                    ],
                ],
            },
            parse_mode: "HTML",
        }
    );
}

export default selectProduct;
