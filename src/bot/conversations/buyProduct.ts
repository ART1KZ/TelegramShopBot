import { Conversation } from "@grammyjs/conversations";
import { Context, InlineKeyboard } from "grammy";
import { Category, City, Product } from "../../database/models";
import { Types } from "mongoose";

async function buyProduct(conversation: Conversation, ctx: Context) {
    // Получение городов
    const cities = await City.find();
    if (!cities || cities.length === 0) {
        await ctx.reply("😔 Города не найдены");
        return;
    }

    // Создание кнопок с городами
    const citiesKeyboard = new InlineKeyboard();
    cities.forEach((city) => {
        citiesKeyboard.text(`🌆 ${city.name}`, `city_${city._id}`).row();
    });
    citiesKeyboard.text("❌ Отмена", "cancel");

    // Отправляем сообщение с клавиатурой
    await ctx.reply("🏙️ Выберите город:", { reply_markup: citiesKeyboard });

    // Ждем выбора пользователя
    const cityAction = await conversation.waitFor("callback_query:data");
    const cityData = cityAction.callbackQuery.data;

    // Обрабатываем выбор пользователя
    if (cityData === "cancel") {
        return;
    }

    // Извлекаем ID города из callback_data
    const cityId = cityData.replace("city_", "");
    const selectedCity = cities.find((city) => city._id.toString() === cityId);

    if (!selectedCity) {
        await ctx.reply("⚠️ Город не найден. Пожалуйста, попробуйте снова.");
        return;
    }

    type AvailableCategory = {
        _id: Types.ObjectId;
        city_id: Types.ObjectId;
        products_count: Number;
    };

    async function getAvailableCategories(): Promise<AvailableCategory[]> {
        const result = await Product.aggregate([
            // Фильтр только на доступные товары (не зарезервированные)
            { $match: { status: "available" } },

            // Группировка по category_id с подсчетом количества товаров в категории
            {
                $group: {
                    _id: "$category_id",
                    products_count: { $sum: 1 },
                },
            },
        ]);

        return result as AvailableCategory[];
    }

    // Получение категорий, где есть товары в наличии
    const availableCategories = await getAvailableCategories();
    console.log(availableCategories)
    const categories = await Category.find({
        _id: { $in: availableCategories.map((category) => category._id) },
    });
    if (!categories || categories.length === 0) {
        await ctx.reply("😔 Товары не найдены");
        return;
    }

    const categoriesKeyboard = new InlineKeyboard();
    categories.forEach((category) => {
        const productsCount = availableCategories.find(
            (category) => category._id === category._id
        )?.products_count;
        categoriesKeyboard
            .text(
                `${category.name} (${productsCount} шт.)`,
                `cat_${category._id}`
            )
            .row();
    });

    // Подтверждаем выбор города
    await ctx.reply(`Город: 🌆 ${selectedCity.name}\nВыберите товар для покупки`, {
        reply_markup: categoriesKeyboard,
    });
}

export default buyProduct;
