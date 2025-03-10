import { ExtendedContext } from "../types";
import { City } from "../../database/models";
import { InlineKeyboard } from "grammy";

async function showAdminProducts(ctx: ExtendedContext) {
    ctx.session.adminProductGroups = undefined;
    const cities = await City.find();
    if (!cities.length) {
        await ctx.editMessageText("<b>⚠️ Ошибка:</b> Города не найдены", {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "❌ Назад", callback_data: "admin_panel" }],
                ],
            },
            parse_mode: "HTML",
        });
        return;
    }

    const keyboard = new InlineKeyboard();
    cities.forEach((city, i) => {
        keyboard.text(
            `🏙️ ${city.name}`,
            `admin_option_productCities_${city._id}`
        );
        if ((i + 1) % 2 === 0 || i === cities.length - 1) keyboard.row();
    });
    keyboard.row().text("❌ Назад", "admin_panel");

    await ctx.editMessageText("<b>🌆 Выберите город:</b>", {
        reply_markup: keyboard,
        parse_mode: "HTML",
    });
}

export default showAdminProducts;
