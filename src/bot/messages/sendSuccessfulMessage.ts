import { ExtendedContext } from "../types";

async function sendSuccessfulMessage(
    ctx: ExtendedContext,
    backButtonData: "admin_panel" | "menu" = "menu",
    option: "create" | "edit" = "create"
) {
    const message = "<b>✅ Операция успешна </b>";
    const keyboard = {
        inline_keyboard: [
            [{ text: "🏠 В меню", callback_data: backButtonData }],
        ],
    };

    const params = {
        reply_markup: keyboard,
        parse_mode: "HTML" as const,
    };

    if (option === "edit") {
        return await ctx.editMessageText(message, params);
    }

    const sendedMessageId = await ctx
        .reply(message, params)
        .then((message) => message.message_id);

    return (ctx.session.botLastMessageId = sendedMessageId);
}

export default sendSuccessfulMessage;
