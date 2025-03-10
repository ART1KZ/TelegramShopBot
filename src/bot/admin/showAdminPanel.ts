import { ExtendedContext } from "../types";
import { Configuration } from "../../database/models";
import { sendAdminMenu } from "./index";

async function showAdminPanel(ctx: ExtendedContext) {
    const config = await Configuration.findOne({
        admin_password: ctx.session.userAdminPassword,
    });
    if (!config || !ctx.session.userAdminPassword) {
        ctx.session.adminStep = "password_input";
        await ctx.editMessageText("<b>🔑 Введите ключ доступа:</b>", {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "❌ Назад", callback_data: "menu" }],
                ],
            },
            parse_mode: "HTML",
        });
    } else {
        await sendAdminMenu(ctx, "edit");
    }
}

export default showAdminPanel;
