import { ExtendedContext } from "../types";
import { Configuration } from "../../database/models";

async function showAdminConfig(ctx: ExtendedContext) {
    ctx.session.adminStep = undefined;
    const config = await Configuration.findOne();
    if (!config) {
        await ctx.answerCallbackQuery("Не удалось загрузить конфигурацию");
        return;
    }

    await ctx.editMessageText(
        `<b>💸 Адрес оплаты:</b> <code>${config.btc_address}</code>\n` +
            `<b>🔑 Пароль админки:</b> <code>${config.admin_password}</code>`,
        {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "🔄 Изменить адрес",
                            callback_data: "admin_update_address",
                        },
                    ],
                    [
                        {
                            text: "🔄 Изменить пароль",
                            callback_data: "admin_update_password",
                        },
                    ],
                    [{ text: "❌ Назад", callback_data: "admin_panel" }],
                ],
            },
            parse_mode: "HTML",
        }
    );
}

export default showAdminConfig;
