import { ExtendedContext } from "../types";

async function createAdminCity(ctx: ExtendedContext) {
    ctx.session.adminStep = "admin_create_city";
    await ctx.editMessageText("<b>🏙️ Введите название нового города:</b>", {
        reply_markup: {
            inline_keyboard: [
                [{ text: "❌ Назад", callback_data: "admin_cities" }],
            ],
        },
        parse_mode: "HTML",
    });
}

export default createAdminCity;
