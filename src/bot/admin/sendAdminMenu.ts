import { ExtendedContext } from "../types";
import { InlineKeyboard } from "grammy";

async function sendAdminMenu(
    ctx: ExtendedContext,
    option: "create" | "edit" = "create"
) {
    const session = ctx.session;
    session.adminStep = "undefined";
    session.adminProductGroups = undefined;
    const botMessage = `
<b>✨ Админ-панель</b>
Ниже представлены разделы, с которыми вы можете взаимодействовать. Выберите один из них:
    `; // приветственное сообщение в админ панели
    const adminMenuKeyboard = new InlineKeyboard()
        .text("🛍️ Товары", "admin_products")
        .text("🏙️ Города", "admin_cities")
        .row()
        .text("🛒 Заказы", "admin_orders")
        .text("⚙️ Конфигурация", "admin_config")
        .row()
        .text("🏠 Главное меню", "menu");

    if (option === "edit") {
        return await ctx.editMessageText(botMessage, {
            reply_markup: adminMenuKeyboard,
            parse_mode: "HTML",
        });
    }

    // Если создается новое сообщение, удаляет предыдущее
    if (session.botLastMessageId) {
        if (ctx?.chat?.id) {
            try {
                await ctx.api.deleteMessage(
                    ctx.chat.id,
                    session.botLastMessageId
                );
                session.botLastMessageId = null;
            } catch (e) {
                console.warn(
                    "Не удалось удалить предыдущее сообщение бота:",
                    e
                );
            }
        }
    }

    const sendedMessageId = await ctx
        .reply(botMessage, {
            reply_markup: adminMenuKeyboard,
            parse_mode: "HTML",
        })
        .then((message) => message.message_id);

    return (ctx.session.botLastMessageId = sendedMessageId);
}

export default sendAdminMenu;
