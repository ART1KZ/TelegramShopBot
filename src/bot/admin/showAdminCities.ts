import { ExtendedContext } from "../types";
import { City } from "../../database/models";
import { InlineKeyboard } from "grammy";

async function showAdminCities(ctx: ExtendedContext) {
    const cities = await City.find();

    const keyboard = new InlineKeyboard();
    cities.forEach((city, i) => {
        keyboard.text(`🏙️ ${city.name}`, `admin_option_city_${city._id}`);
        if ((i + 1) % 2 === 0 || i === cities.length - 1) keyboard.row();
    });
    keyboard.row().text("➕ Добавить город", "admin_create_city");
    keyboard.row().text("❌ Назад", "admin_panel");

    await ctx.editMessageText("<b>🌆 Выберите город:</b>", {
        reply_markup: keyboard,
        parse_mode: "HTML",
    });
}

export default showAdminCities;
