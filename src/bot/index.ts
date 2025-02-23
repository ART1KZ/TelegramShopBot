import { Bot, InlineKeyboard, session } from "grammy";
import { City, Product, Transaction } from "../database/models";
import { connectToDatabase } from "../database/index";
import { cancelExpiredTransactions, generateUniqueAmount } from "./helpers";
import cron from "node-cron";
import { ExtendedContext, SessionData } from "./types";

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
        }
    } catch (e) {
        console.error("Error during initialization:", e);
    }
}

addRecords();

//
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
    console.log(ctx.session);
});

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
        await ctx.editMessageText("Выберите город:", {
            reply_markup: cityKeyboard,
        });
    } else if (data.startsWith("city_")) {
        const cityId = data.split("_")[1];
        session.cityId = cityId;
        session.step = "product";

        const products = await Product.find({
            city_id: cityId,
            status: "available",
        });
        const productsKeyboard = new InlineKeyboard();

        if (products.length === 0) {
            return await ctx.editMessageText(
                "В этом городе нет доступных товаров.",
                {
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: "❌ Назад", callback_data: "cities" }],
                        ],
                    },
                }
            );
        }

        products.forEach((product) => {
            productsKeyboard.text(product.name, `product_${product._id}`).row();
        });
        productsKeyboard.row().text("❌ Назад", "cities");
        return await ctx.editMessageText("Выберите товар:", {
            reply_markup: productsKeyboard,
        });
    }

    // Если пользователь выбрал товар
    else if (data.startsWith("product_")) {
        const cityId = ctx.session.cityId;
        const productId = data.split("_")[1];
        session.productId = productId;
        const product = await Product.findById(productId);
        if (product && product.status === "available" && cityId) {
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

            return await ctx.editMessageText(
                `Продукт "${product.name}" зарезервирован.\n` +
                    `Отправьте ${transaction.btc_amount} BTC на адрес: ${process.env.BTC_ADDRESS}\n` +
                    `После оплаты нажмите "Проверить оплату"`,
                {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: "Проверить оплату",
                                    callback_data: `check_${transaction._id}`,
                                },
                            ],
                            // В случае отмены возвращение к городу
                            // [
                            //     {
                            //         text: "❌ Назад",
                            //         callback_data: `city_${cityId}`,
                            //     },
                            // ],
                        ],
                    },
                }
            );
        }
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
                        `Спасибо! Ваш продукт: ${product.data}`,
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

    // Назад к городам
    // else if (data === "back_city") {
    //     session.step = "city";
    //     const cities = await City.find();
    //     const keyboard = new InlineKeyboard();
    //     cities.forEach((city) => {
    //         keyboard.text(city.name, `city_${city._id}`);
    //     });
    //     keyboard.row().text("❌ Отмена", "cancel");
    //     return await ctx.editMessageText("Выберите город:", {
    //         reply_markup: keyboard,
    //     });
    // }

    // Отмена
    else if (data === "menu") {
        // if (session.productId) {
        //     const product = await Product.findById(session.productId);
        //     if (product && product.status === "reserved") {
        //         product.status = "available";
        //         product.reserved_at = null;
        //         await product.save();
        //         await Transaction.deleteOne({ product_id: product._id, status: "pending" });
        //     }
        // }
        return await sendMainMenu(ctx, "edit");
    } else if (data === "feedback") {
        return ctx.editMessageText(`Тут скоро будут отзывы`, {
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
    } else if (data === "support") {
        return ctx.editMessageText(`Тут будет поддержка`, {
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
    } else if (data === "purchases") {
        const tgUserId = ctx.callbackQuery.from.id;
        const purchases = await Transaction.find({
            customer_tg_id: tgUserId,
            status: "completed",
        });

        if (purchases.length === 0) {
            return ctx.editMessageText(
                `Вы еще не совершали покупок в нашем магазине`,
                {
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
                }
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
                purchasesKeyboard.text(
                    product.name,
                    `purchased_${product._id}`
                );
            }
        }
        purchasesKeyboard.row();
        purchasesKeyboard.text("❌ Назад", `menu`);
        return ctx.editMessageText(`Ваши покупки:`, {
            reply_markup: purchasesKeyboard,
        });
    } else if (data.startsWith("purchased_")) {
        const productId = data.split("_")[1];
        const product = await Product.findById(productId);

        if (!product) {
            return ctx.editMessageText(`Товар не найден`, {
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
        }
        return ctx.editMessageText(`Ваш товар: ${product.data}`, {
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

    await ctx.answerCallbackQuery();
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
        .text("⭐️ Отзывы", "feedback")
        .row()
        .text("💬 Поддержка", "support")
        .text("⚙️ Админ-панель", "admin_panel");

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
    console.error("Error in bot:", err);
});

// Запуск бота
// addRecords();
bot.start();
