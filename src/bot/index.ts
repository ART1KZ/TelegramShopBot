import { Bot, InlineKeyboard, session } from "grammy";
import { City, Product, Transaction, Configuration } from "../database/models";
import { connectToDatabase } from "../database/index";
import { cancelExpiredTransactions, generateUniqueAmount } from "./helpers";
import cron from "node-cron";
import { ExtendedContext, SessionData } from "./types";
import { config } from "dotenv";
import { brotliCompress } from "zlib";

if (!process.env.TG_BOT_TOKEN) {
    throw new Error("Telegram bot токен не найден");
}

const bot = new Bot<ExtendedContext>(process.env.TG_BOT_TOKEN);

// Проверка транзакций каждые 5 минут
cron.schedule("*/5 * * * *", async () => {
    try {
        // Отмена транзакций, находящихся в ожидании более 30 минут
        await cancelExpiredTransactions(30);
    } catch (error) {
        console.error("Ошибка в cron:", error);
    }
});

async function addRecords() {
    try {
        await connectToDatabase();

        // Создаем города, если их еще нет
        const cities = await City.find();
        if (cities.length === 0) {
            await City.create({ name: "Сургут" });
            await City.create({ name: "Москва" });
            await City.create({ name: "Казань" });
        }

        const citiesIds = (await City.find()).map((city) => city.id);

        const products = await Product.find();
        if (products.length === 0) {
            await Product.create({
                name: "Аккаунт CS2",
                city_id: citiesIds[0],
                data: "логин пароль222",
                btc_price: 0.00909043132,
                rub_price: 44,
            });
            await Product.create({
                name: "Аккаунт Brawl",
                city_id: citiesIds[1],
                data: "логин пароль222",
                btc_price: 0.0800043132,
                rub_price: 33,
            });
            await Product.create({
                name: "Аккаунт DBD",
                city_id: citiesIds[2],
                data: "логин пароль222",
                btc_price: 0.0770043132,
                rub_price: 22,
            });
            await Product.create({
                name: "Аккаунт LOL",
                city_id: citiesIds[0],
                data: "логин пароль222",
                btc_price: 0.066043132,
                rub_price: 11,
            });
            await Product.create({
                name: "Аккаунт Blocksstrke",
                city_id: citiesIds[1],
                data: "логин пароль222",
                btc_price: 0.0055043132,
                rub_price: 66,
            });
            await Product.create({
                name: "Аккаунт NBA2022",
                city_id: citiesIds[2],
                data: "логин пароль222",
                btc_price: 0.0044043132,
                rub_price: 55,
            });
            await Product.create({
                name: "Аккаунт FIFA",
                city_id: citiesIds[0],
                data: "логин пароль222",
                btc_price: 0.0002243132,
                rub_price: 44,
            });
            await Product.create({
                name: "Аккаунт Dota 2",
                city_id: citiesIds[1],
                data: "логин пароль222",
                btc_price: 0.0004043132,
                rub_price: 99,
            });
            await Product.create({
                name: "Аккаунт CS2",
                city_id: citiesIds[0],
                data: "логин пароль222",
                btc_price: 0.00909043132,
                rub_price: 44,
            });
            await Product.create({
                name: "Аккаунт Brawl",
                city_id: citiesIds[1],
                data: "логин пароль222",
                btc_price: 0.0800043132,
                rub_price: 33,
            });
            await Product.create({
                name: "Аккаунт DBD",
                city_id: citiesIds[2],
                data: "логин пароль222",
                btc_price: 0.0770043132,
                rub_price: 22,
            });
            await Product.create({
                name: "Аккаунт LOL",
                city_id: citiesIds[0],
                data: "логин пароль222",
                btc_price: 0.066043132,
                rub_price: 11,
            });
            await Product.create({
                name: "Аккаунт Blocksstrke",
                city_id: citiesIds[1],
                data: "логин пароль222",
                btc_price: 0.0055043132,
                rub_price: 66,
            });
            await Product.create({
                name: "Аккаунт NBA2022",
                city_id: citiesIds[2],
                data: "логин пароль222",
                btc_price: 0.0044043132,
                rub_price: 55,
            });
            await Product.create({
                name: "Аккаунт FIFA",
                city_id: citiesIds[0],
                data: "логин пароль222",
                btc_price: 0.0002243132,
                rub_price: 44,
            });
            await Product.create({
                name: "Аккаунт Dota 2",
                city_id: citiesIds[1],
                data: "логин пароль222",
                btc_price: 0.0004043132,
                rub_price: 99,
            });
            await Product.create({
                name: "Аккаунт CS2",
                city_id: citiesIds[0],
                data: "логин пароль222",
                btc_price: 0.00909043132,
                rub_price: 44,
            });
            await Product.create({
                name: "Аккаунт Brawl",
                city_id: citiesIds[1],
                data: "логин пароль222",
                btc_price: 0.0800043132,
                rub_price: 33,
            });
            await Product.create({
                name: "Аккаунт DBD",
                city_id: citiesIds[2],
                data: "логин пароль222",
                btc_price: 0.0770043132,
                rub_price: 22,
            });
            await Product.create({
                name: "Аккаунт LOL",
                city_id: citiesIds[0],
                data: "логин пароль222",
                btc_price: 0.066043132,
                rub_price: 11,
            });
            await Product.create({
                name: "Аккаунт Blocksstrke",
                city_id: citiesIds[1],
                data: "логин пароль222",
                btc_price: 0.0055043132,
                rub_price: 66,
            });
            await Product.create({
                name: "Аккаунт NBA2022",
                city_id: citiesIds[2],
                data: "логин пароль222",
                btc_price: 0.0044043132,
                rub_price: 55,
            });
            await Product.create({
                name: "Аккаунт FIFA",
                city_id: citiesIds[0],
                data: "логин пароль222",
                btc_price: 0.0002243132,
                rub_price: 44,
            });
            await Product.create({
                name: "Аккаунт Dota 2",
                city_id: citiesIds[1],
                data: "логин пароль222",
                btc_price: 0.0004043132,
                rub_price: 99,
            });
            await Product.create({
                name: "Аккаунт CS2",
                city_id: citiesIds[0],
                data: "логин пароль222",
                btc_price: 0.00909043132,
                rub_price: 44,
            });
            await Product.create({
                name: "Аккаунт Brawl",
                city_id: citiesIds[1],
                data: "логин пароль222",
                btc_price: 0.0800043132,
                rub_price: 33,
            });
            await Product.create({
                name: "Аккаунт DBD",
                city_id: citiesIds[2],
                data: "логин пароль222",
                btc_price: 0.0770043132,
                rub_price: 22,
            });
            await Product.create({
                name: "Аккаунт LOL",
                city_id: citiesIds[0],
                data: "логин пароль222",
                btc_price: 0.066043132,
                rub_price: 11,
            });
            await Product.create({
                name: "Аккаунт Blocksstrke",
                city_id: citiesIds[1],
                data: "логин пароль222",
                btc_price: 0.0055043132,
                rub_price: 66,
            });
            await Product.create({
                name: "Аккаунт NBA2022",
                city_id: citiesIds[2],
                data: "логин пароль222",
                btc_price: 0.0044043132,
                rub_price: 55,
            });
            await Product.create({
                name: "Аккаунт FIFA",
                city_id: citiesIds[0],
                data: "логин пароль222",
                btc_price: 0.0002243132,
                rub_price: 44,
            });
            await Product.create({
                name: "Аккаунт Dota 2",
                city_id: citiesIds[1],
                data: "логин пароль222",
                btc_price: 0.0004043132,
                rub_price: 99,
            });
            await Product.create({
                name: "Аккаунт Dota 2",
                city_id: citiesIds[0],
                data: "логин пароль222",
                btc_price: 0.0004043132,
                rub_price: 99,
            });
        }

        const configCount = await Configuration.countDocuments();

        if (!configCount) {
            await Configuration.create({
                adminPassword: "test",
                btcAddress: "1Q7rzSJm6Su4ymxPJ22EUDktfSLhRPAoN4",
            });
        }
    } catch (e) {
        console.error("Error during initialization:", e);
    }
}

addRecords();

// Мидлвара для хранения сессий
bot.use(
    session({
        initial: (): SessionData => ({
            step: "start",
            cityId: null,
            categoryId: null,
            productId: null,
        }),
    })
);

// Обработчик команды /start
bot.command("start", async (ctx) => {
    await sendMainMenu(ctx);
});

// Обработка нажатий на кнопку
bot.on("callback_query:data", async (ctx) => {
    const data = ctx.callbackQuery.data;
    const session = ctx.session;

    // Если пользователь нажал на кнопку "Товары"
    if (data === "cities") {
        session.step = "city";

        const cities = await City.find();
        const cityKeyboard = new InlineKeyboard();
        cities.forEach((city) => {
            cityKeyboard.text(`🏙️ ${city.name}`, `city_${city._id}`);
        });
        cityKeyboard.row().text("❌ Назад", "menu");
        await ctx.editMessageText("🌆 Выберите город:", {
            reply_markup: cityKeyboard,
        });

        // Если пользователь выбрал город (или нажал назад на моменте выбора товара)
    } else if (data.startsWith("city_")) {
        const cityId = data.split("_")[1];
        session.cityId = cityId;
        session.step = "product";

        // Уникальные названия товаров
        const uniqueProductNames = await Product.distinct("name", {
            city_id: cityId,
            status: "available",
        });

        const uniqueProductNamesKeyboard = new InlineKeyboard();

        if (uniqueProductNames.length === 0) {
            return await ctx.answerCallbackQuery(
                "В этом городе нет доступных товаров"
            );
        }

        uniqueProductNames.forEach((product) => {
            uniqueProductNamesKeyboard
                .text(`📦 ${product}`, `product_${product}`)
                .row();
        });
        uniqueProductNamesKeyboard.row().text("❌ Назад", "cities");
        return await ctx.editMessageText("🛒 Выберите товар:", {
            reply_markup: uniqueProductNamesKeyboard,
        });
    }

    // Если пользователь выбрал товар
    else if (data.startsWith("product_")) {
        const cityId = ctx.session.cityId;
        const productName = data.split("_")[1];
        const product = await Product.findOne({
            name: productName,
            status: "available",
            city_id: cityId,
        });

        if (!product) {
            return await ctx.answerCallbackQuery(
                "Товар уже зарезервирован или недоступен, попробуйте выбрать другой"
            );
        }

        return await ctx.editMessageText(
            `📦 Товар: "${product.name}"\n` +
                `💸 Цена: ${product.rub_price} RUB`,
            {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: "🛒 Купить",
                                callback_data: `purchase_${product.name}`,
                            },
                        ],

                        // В случае отмены возвращение к городу
                        [
                            {
                                text: "❌ Назад",
                                callback_data: `city_${cityId}`,
                            },
                        ],
                    ],
                },
            }
        );
    } else if (data.startsWith("purchase_")) {
        const configData = await Configuration.findOne();
        const cityId = ctx.session.cityId;
        const productName = data.split("_")[1];
        const product = await Product.findOne({
            name: productName,
            status: "available",
            city_id: cityId,
        });
        const tgUserId = ctx.callbackQuery.from.id;
        const userReservedPurchases = await Transaction.findOne({
            customer_tg_id: tgUserId,
            status: "pending",
        });
        console.log(userReservedPurchases)
        if(userReservedPurchases) {
            return await ctx.answerCallbackQuery(
                "У вас есть активные заказы.\n" + "Чтобы купить товар, оплатите или отмените предыдущий заказ"
            );
        }
        if (!product || !configData) {
            return await ctx.answerCallbackQuery(
                "Товар уже зарезервирован или недоступен, попробуйте выбрать другой"
            );
        }
        console.log(product.id);
        session.productId = product.id;
        product.status = "reserved";
        product.reserved_at = new Date();
        await product.save();

        const transaction = new Transaction({
            customer_tg_id: ctx.from.id,
            product_id: product._id,
            btc_amount: generateUniqueAmount(product.btc_price),
            status: "pending",
        });
        await transaction.save();

        await ctx.reply(
            `📅 Товар "${product.name}" зарезервирован.\n` +
                `Отправьте ${transaction.btc_amount} BTC на адрес: ${configData.btcAddress}\n` +
                `После оплаты нажмите "Проверить оплату"\n` +
                `Текущий заказ и ваши покупки вы можете найти во вкладке "🛍️ Мои покупки" в главном меню`,
            {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: "🔍 Проверить оплату",
                                callback_data: `check_${transaction._id}`,
                            },
                        ],
                        // В случае отмены возвращение к городу
                        [
                            {
                                text: "❌ Отменить покупку",
                                callback_data: `cancel_${transaction._id}`,
                            },
                        ],
                    ],
                },
            }
        );

        return await ctx.answerCallbackQuery();
    } else if (data.startsWith("cancel_")) {
        const transactionId = data.split("_")[1];
        const productId = ctx.session.productId;
        await Transaction.deleteOne(
            { _id: transactionId }
        );
        console.log("Транзакция отменена");
        await Product.updateOne(
            { _id: productId },
            { status: "available", reserved_at: null }
        );
        console.log("Товар восстановлен");

        await ctx.deleteMessage();
    }
    // Проверка оплаты (заглушка)
    else if (data.startsWith("check_")) {
        const cityId = ctx.session.cityId;
        const transactionId = data.split("_")[1];
        const transaction = await Transaction.findById(transactionId);
        if (transaction && transaction.status === "pending" && cityId) {
            // Здесь будет интеграция с Blockchair API позже
            const paid = true; // Заглушка
            if (paid) {
                transaction.status = "completed";
                await transaction.save();
                const product = await Product.findById(transaction.product_id);
                if (product) {
                    product.status = "sold";
                    product.sold_at = new Date();
                    await product.save();
                    session.productId = null;
                    await ctx.editMessageText(
                        `🎉 Спасибо за покупку!\n` +
                            `💎 Ваш товар: ${product.data}`,
                        {
                            reply_markup: {
                                inline_keyboard: [
                                    [
                                        {
                                            text: "🏠 В главное меню",
                                            callback_data: `menu`,
                                        },
                                    ],
                                ],
                            },
                        }
                    );
                }
            } else {
                await ctx.answerCallbackQuery("Оплата ещё не получена.");
            }
        }
    }

    // Отмена, возвращение в меню
    else if (data === "menu") {
        return await sendMainMenu(ctx, "edit");

        // Если пользователь нажал на кнопку "Админ-панель"
    } else if (data === "admin_panel") {
        return ctx.editMessageText(`Секрет =)`, {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "❌ Назад",
                            callback_data: `menu`,
                        },
                    ],
                ],
            },
        });

        // Если пользователь нажал на кнопку "Мои покупки"
    } else if (data === "purchases") {
        const tgUserId = ctx.callbackQuery.from.id;
        const purchases = await Transaction.find({
            customer_tg_id: tgUserId,
            status: "completed",
        });

        if (purchases.length === 0) {
            return await ctx.answerCallbackQuery(
                "Вы еще не совершали покупок в нашем магазине"
            );
        }

        const purchasesKeyboard = new InlineKeyboard();
        for (const transaction of purchases) {
            const productId = transaction.product_id;
            const product = await Product.findOne({
                _id: productId,
                status: "sold",
            });

            if (product) {
                purchasesKeyboard
                    .text(`✅ ${product.name}`, `purchased_${product._id}`)
                    .row();
            }
        }
        purchasesKeyboard.row();
        purchasesKeyboard.text("❌ Назад", `menu`);
        return ctx.editMessageText(`🛒 Ваши покупки:`, {
            reply_markup: purchasesKeyboard,
        });

        // Если пользователь выбрал товар в своих покупках
    } else if (data.startsWith("purchased_")) {
        const productId = data.split("_")[1];
        const product = await Product.findById(productId);

        if (!product) {
            return ctx.answerCallbackQuery(
                "Товар не найден. Возможно, стоит попробовать позже"
            );
        }
        return ctx.editMessageText(`💎 Ваш товар: ${product.data}`, {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "❌ Назад",
                            callback_data: `purchases`,
                        },
                    ],
                ],
            },
        });
    }
});

async function sendMainMenu(
    ctx: ExtendedContext,
    option: "create" | "edit" = "create"
) {
    const session = ctx.session;
    session.step = "start";
    session.cityId = null;
    session.productId = null;
    const menuKeyboard = new InlineKeyboard()
        .text("🛍️ Мои покупки", "purchases")
        .text("🛒 Товары", "cities")
        .text("⚙️ Админ-панель", "admin_panel")
        .row()
        .url("⭐️ Отзывы", "https://example.com")
        .url("💬 Поддержка", "https://example.com");

    if (option === "edit") {
        return await ctx.editMessageText(
            "✨ Добро пожаловать в наш магазин! ✨\n\nЗдесь вы найдёте всё необходимое. Используйте меню ниже, чтобы выбрать интересующий вас раздел 😊",
            { reply_markup: menuKeyboard }
        );
    }

    return await ctx.reply(
        "✨ Добро пожаловать в наш магазин! ✨\n\nЗдесь вы найдёте всё необходимое. Используйте меню ниже, чтобы выбрать интересующий вас раздел 😊",
        { reply_markup: menuKeyboard }
    );
}

bot.on("message", async (ctx) => {
    await ctx.reply(
        "Не понял вашей команды. Чтобы открыть меню навигации введите /start"
    );
});

// Обработка ошибок
bot.catch((err) => {
    console.error("Произошла ошибка в боте: ", err);
});

// Запуск бота
// addRecords();
bot.start();
