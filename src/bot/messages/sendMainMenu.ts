import { ExtendedContext } from "../types";
import { InlineKeyboard } from "grammy";

async function sendMainMenu(
    ctx: ExtendedContext,
    option: "create" | "edit" = "create"
) {
    const session = ctx.session;
    session.cityId = null;
    const botMessage = `
<b>✨ Добро пожаловать в наш магазин! ✨</b>

Здесь вы найдёте всё необходимое. Используйте меню ниже, чтобы выбрать интересующий вас раздел 
    `; // приветственное сообщение в меню
    const menuKeyboard = new InlineKeyboard()
        .text("🛍️ Мои заказы", "orders")
        .text("🛒 Товары", "cities")
        .text("⚙️ Админ-панель", "admin_panel")
        .row()
        .url("⭐️ Отзывы", "https://t.me/+G8pMGy5LR-1hNjJi") // здесь можно изменить ссылку на отзывы
        .url("💬 Поддержка", "https://t.me/brotanchikJA"); // здесь можно изменить ссылку на поддержку

    if (option === "edit") {
        return await ctx.editMessageText(botMessage, {
            reply_markup: menuKeyboard,
            parse_mode: "HTML",
        });
    }

    // Если создается новое сообщение, удаляет предыдущее
    if (session.botLastMessageId) {
        if (ctx?.chat?.id) {
            try {
                if (session.userStartMessageId) {
                    await ctx.api.deleteMessage(
                        ctx.chat.id,
                        session.userStartMessageId
                    );
                }

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
            reply_markup: menuKeyboard,
            parse_mode: "HTML",
        })
        .then((message) => message.message_id);
    
    // Удаление предыдущей команды start пользователя
    if (ctx.message?.message_id) {
        session.userStartMessageId = ctx.message.message_id;
    }

    return (ctx.session.botLastMessageId = sendedMessageId);
}

export default sendMainMenu;
