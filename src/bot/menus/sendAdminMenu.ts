import { ExtendedContext } from "../types";
import { InlineKeyboard } from "grammy";

async function sendAdminMenu(
    ctx: ExtendedContext,
    option: "create" | "edit" = "create"
) {
    const session = ctx.session;
    session.adminStep = "admin_menu";
    const botMessage = `
<b>✨ Админ-панель</b>
Ниже представлены разделы, с которыми вы можете взаимодействовать. Выберите один из них:
    `;
    const adminMenuKeyboard = new InlineKeyboard()
        .text("🛍️ Товары", "admin_products")
        .text("🏙️ Города", "admin_cities")
        .row()
        .text("⚙️ Конфигурация", "admin_config")
        .text("🏠 Главное меню", "menu");

    if (option === "edit") {
        return await ctx.editMessageText(botMessage, {
            reply_markup: adminMenuKeyboard,
            parse_mode: "HTML",
        });
    }

    const sendedMessageId = await ctx
        .reply(botMessage, {
            reply_markup: adminMenuKeyboard,
            parse_mode: "HTML",
        })
        .then((message) => message.message_id);

    return ctx.session.botLastMessageId = sendedMessageId;
}

export default sendAdminMenu;
