import { ExtendedContext } from "../types";
import { InlineKeyboard } from "grammy";
import { getUniqueProducts } from "../products/index";

async function selectCity(ctx: ExtendedContext, data: string) {
    const cityId = data.split("_")[1];
    ctx.session.cityId = cityId;

    const uniqueProducts = await getUniqueProducts(cityId);
    if (!uniqueProducts.length) {
        await ctx.answerCallbackQuery("В этом городе нет доступных товаров");
        return;
    }

    const keyboard = new InlineKeyboard();
    uniqueProducts.forEach((product, i) => {
        keyboard.text(
            `📦 ${product.name} - ${product.rub_price} RUB`,
            `product_${product.name}_${product.rub_price}`
        );
        if ((i + 1) % 2 === 0 || i === uniqueProducts.length - 1)
            keyboard.row();
    });
    keyboard.row().text("❌ Назад", "cities");

    await ctx.editMessageText("<b>🛒 Выберите товар:</b>", {
        reply_markup: keyboard,
        parse_mode: "HTML",
    });
}

export default selectCity;
