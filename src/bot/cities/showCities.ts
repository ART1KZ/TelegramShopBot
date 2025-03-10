import { ExtendedContext } from "../types/index";
import { InlineKeyboard } from "grammy";
import { City } from "../../database/models";

async function showCities(ctx: ExtendedContext) {
    const cities = await City.find();
    if (!cities.length) {
        await ctx.editMessageText("<b>⚠️ Ошибка:</b> Города не найдены", {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "❌ Назад", callback_data: "menu" }],
                ],
            },
            parse_mode: "HTML",
        });
        return;
    }

    const keyboard = new InlineKeyboard();
    cities.forEach((city, i) => {
        keyboard.text(`🏙️ ${city.name}`, `city_${city._id}`);
        if ((i + 1) % 2 === 0 || i === cities.length - 1) keyboard.row();
    });
    keyboard.row().text("❌ Назад", "menu");

    await ctx.editMessageText("<b>🌆 Выберите город:</b>", {
        reply_markup: keyboard,
        parse_mode: "HTML",
    });
}

export default showCities;
