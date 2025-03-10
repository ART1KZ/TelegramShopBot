import { ExtendedContext } from "../types";

async function createAdminProduct(ctx: ExtendedContext, data: string) {
    const cityId = data.split("_")[3];
    ctx.session.cityId = cityId;
    ctx.session.adminStep = "admin_create_product";
    await ctx.editMessageText(
        "<b>📦 Добавьте новый товар:</b>\n" +
            "Отправьте данные в формате: <code>Название, Цена в RUB, Цена в BTC, Данные товара</code>\n" +
            "Пример: <code>Подписка Netflix 1 месяц, 1200, 0.0005, NETFLIX-12345-XYZ</code>",
        {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "❌ Отмена",
                            callback_data: `admin_option_productCities_${cityId}`,
                        },
                    ],
                ],
            },
            parse_mode: "HTML",
        }
    );
}

export default createAdminProduct;
