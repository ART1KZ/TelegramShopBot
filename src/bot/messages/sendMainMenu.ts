import { ExtendedContext } from "../types";
import { InlineKeyboard } from "grammy";

async function sendMainMenu(
    ctx: ExtendedContext,
    option: "create" | "edit" = "create"
) {
    const session = ctx.session;
    session.cityId = null;
    session.productId = null;
    const botMessage = `
<b>✨ Добро пожаловать в наш магазин! ✨</b>

Здесь вы найдёте всё необходимое. Используйте меню ниже, чтобы выбрать интересующий вас раздел 
    `;
    const menuKeyboard = new InlineKeyboard()
        .text("🛍️ Мои заказы", "orders")
        .text("🛒 Товары", "cities")
        .text("⚙️ Админ-панель", "admin_panel")
        .row()
        .url("⭐️ Отзывы", "https://example.com")
        .url("💬 Поддержка", "https://example.com");

    if (option === "edit") {
        return await ctx.editMessageText(botMessage, {
            reply_markup: menuKeyboard,
            parse_mode: "HTML",
        });
    }

    const sendedMessageId = await ctx
        .reply(botMessage, {
            reply_markup: menuKeyboard,
            parse_mode: "HTML",
        })
        .then((message) => message.message_id);

    return (ctx.session.botLastMessageId = sendedMessageId);
}

export default sendMainMenu;
