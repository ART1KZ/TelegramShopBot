import { Bot, InlineKeyboard, session } from "grammy";
import { City, Product, Transaction, Configuration } from "../database/models";
import { connectToDatabase } from "../database/index";
import { generateUniqueAmount, getUniqueProducts } from "./helpers";
import { ExtendedContext, SessionData } from "./types";
import { sendMainMenu, sendAdminMenu } from "./menus";
import { scheduleTransactionsCleanup } from "./transations";

if (!process.env.TG_BOT_TOKEN) {
    throw new Error("Telegram bot токен не найден");
}

const bot = new Bot<ExtendedContext>(process.env.TG_BOT_TOKEN);

// Удаление истекших транзакций каждые 5 минут
scheduleTransactionsCleanup();

async function addRecords() {
    try {
        await connectToDatabase();

        // Создаем города, если их еще нет
        const cities = await City.find();
        if (cities.length === 0) {
            await City.create({ name: "Токио" });
            await City.create({ name: "Лондон" });
            await City.create({ name: "Нью-Йорк" });
            await City.create({ name: "Берлин" });
            await City.create({ name: "Сидней" });
            await City.create({ name: "Москва" });
            await City.create({ name: "Сингапур" });
        }

        const citiesIds = (await City.find()).map((city) => city.id);

        const products = await Product.find();
        if (products.length === 0) {
            await Product.create({
                name: "Подписка Netflix 1 месяц",
                city_id: citiesIds[0],
                data: "NETFLIX-12345-XYZ",
                btc_price: 0.0005,
                rub_price: 1200,
            });
            await Product.create({
                name: "Лицензия Adobe Photoshop",
                city_id: citiesIds[1],
                data: "ADOBE-PS-98765",
                btc_price: 0.015,
                rub_price: 4500,
            });
            await Product.create({
                name: "Ключ Steam $50",
                city_id: citiesIds[2],
                data: "STEAM-50USD-ABCDE",
                btc_price: 0.002,
                rub_price: 4800,
            });
            await Product.create({
                name: "Подписка Spotify Premium",
                city_id: citiesIds[3],
                data: "SPOTIFY-3M-54321",
                btc_price: 0.0004,
                rub_price: 900,
            });
            await Product.create({
                name: "Цифровой код PlayStation Plus",
                city_id: citiesIds[4],
                data: "PSPLUS-12M-XYZ123",
                btc_price: 0.0018,
                rub_price: 3600,
            });
            await Product.create({
                name: "Ключ активации Windows 11 Pro",
                city_id: citiesIds[5],
                data: "WIN11-PRO-7890-ABC",
                btc_price: 0.003,
                rub_price: 7500,
            });
            await Product.create({
                name: "Подписка Xbox Game Pass",
                city_id: citiesIds[6],
                data: "XBOX-GP-6M-45678",
                btc_price: 0.0012,
                rub_price: 2400,
            });
            await Product.create({
                name: "Цифровой код Amazon $25",
                city_id: citiesIds[0],
                data: "AMAZON-25USD-DEF456",
                btc_price: 0.001,
                rub_price: 2300,
            });
            await Product.create({
                name: "Ключ VPN NordVPN 1 год",
                city_id: citiesIds[1],
                data: "NORDVPN-1Y-123XYZ",
                btc_price: 0.0025,
                rub_price: 6000,
            });
            await Product.create({
                name: "Подписка YouTube Premium",
                city_id: citiesIds[2],
                data: "YT-PREM-3M-ABC789",
                btc_price: 0.0006,
                rub_price: 1500,
            });
            await Product.create({
                name: "Лицензия Microsoft Office 365",
                city_id: citiesIds[3],
                data: "OFFICE-365-1Y-XYZ987",
                btc_price: 0.0028,
                rub_price: 7000,
            });
            await Product.create({
                name: "Код Roblox 1000 Robux",
                city_id: citiesIds[4],
                data: "ROBLOX-1000R-DEF123",
                btc_price: 0.00045,
                rub_price: 1000,
            });
            await Product.create({
                name: "Подписка Discord Nitro",
                city_id: citiesIds[5],
                data: "DISCORD-NITRO-1M-456XYZ",
                btc_price: 0.00035,
                rub_price: 800,
            });
            await Product.create({
                name: "Ключ активации Kaspersky",
                city_id: citiesIds[6],
                data: "KASPERSKY-1Y-789ABC",
                btc_price: 0.0015,
                rub_price: 3000,
            });
            await Product.create({
                name: "Цифровой код Google Play $10",
                city_id: citiesIds[0],
                data: "GOOGLE-PLAY-10USD-XYZ456",
                btc_price: 0.0004,
                rub_price: 950,
            });
            await Product.create({
                name: "Ключ активации ESET NOD32",
                city_id: citiesIds[1],
                data: "ESET-NOD32-1Y-ABC123",
                btc_price: 0.0013,
                rub_price: 2800,
            });
            await Product.create({
                name: "Подписка Apple Music 3 месяца",
                city_id: citiesIds[2],
                data: "APPLE-MUSIC-3M-DEF789",
                btc_price: 0.0007,
                rub_price: 1600,
            });
            await Product.create({
                name: "Код Fortnite 2800 V-Bucks",
                city_id: citiesIds[3],
                data: "FORTNITE-2800VB-XYZ456",
                btc_price: 0.0011,
                rub_price: 2500,
            });
            await Product.create({
                name: "Лицензия CorelDRAW",
                city_id: citiesIds[4],
                data: "COREL-DRAW-2023-ABC987",
                btc_price: 0.012,
                rub_price: 4000,
            });
            await Product.create({
                name: "Подписка Twitch Turbo",
                city_id: citiesIds[5],
                data: "TWITCH-TURBO-1M-DEF123",
                btc_price: 0.0003,
                rub_price: 700,
            });
            await Product.create({
                name: "Ключ akтивации Autodesk AutoCAD",
                city_id: citiesIds[6],
                data: "AUTOCAD-2023-XYZ789",
                btc_price: 0.025,
                rub_price: 9000,
            });
            await Product.create({
                name: "Цифровой код iTunes $15",
                city_id: citiesIds[0],
                data: "ITUNES-15USD-ABC456",
                btc_price: 0.0006,
                rub_price: 1400,
            });
            await Product.create({
                name: "Подписка Paramount+ 1 месяц",
                city_id: citiesIds[1],
                data: "PARAMOUNT-1M-DEF789",
                btc_price: 0.00045,
                rub_price: 1100,
            });
            await Product.create({
                name: "Ключ VPN ExpressVPN 6 месяцев",
                city_id: citiesIds[2],
                data: "EXPRESSVPN-6M-XYZ123",
                btc_price: 0.002,
                rub_price: 4800,
            });
            await Product.create({
                name: "Код Minecraft Java Edition",
                city_id: citiesIds[3],
                data: "MINECRAFT-JAVA-ABC789",
                btc_price: 0.0014,
                rub_price: 3200,
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
        console.error("Не удалось создать тестовые записи:", e);
    }
}

addRecords();

// Мидлвара для хранения сессий
bot.use(
    session({
        initial: (): SessionData => ({
            step: "start",
            cityId: null,
            productId: null,
            botLastMessageId: null,
            isAdmin: null,
            adminStep: null,
            tempProduct: null,
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
        const cities = await City.find();
        if (!cities || cities.length === 0) {
            return await ctx.editMessageText(
                "<b>❌ Ошибка:</b> Города не найдены в базе данных.",
                { parse_mode: "HTML" }
            );
        }

        const cityKeyboard = new InlineKeyboard();
        cities.forEach((city, index) => {
            // Добавляем кнопку с названием города и его ID
            cityKeyboard.text(`🏙️ ${city.name}`, `city_${city._id}`);
            // После каждой второй кнопки (или последней) добавляем перенос строки
            if ((index + 1) % 2 === 0 || index === cities.length - 1) {
                cityKeyboard.row();
            }
        });
        // Кнопка "Назад" в отдельной строке
        cityKeyboard.row().text("❌ Назад", "menu");

        await ctx.editMessageText("<b>🌆 Выберите город:</b>", {
            reply_markup: cityKeyboard,
            parse_mode: "HTML",
        });
    } else if (data.startsWith("city_")) {
        const cityId = data.split("_")[1];
        session.cityId = cityId;

        // Уникальные названия товаров
        const uniqueProducts = await getUniqueProducts(cityId);

        if (uniqueProducts.length === 0) {
            return await ctx.answerCallbackQuery(
                "В этом городе нет доступных товаров"
            );
        }
        const uniqueProductsKeyboard = new InlineKeyboard();

        uniqueProducts.forEach((product) => {
            uniqueProductsKeyboard
                .text(`📦 ${product.name} (${product.rub_price} RUB)`, `product_${product.name}_${product.rub_price}`)
                .row();
        });
        uniqueProductsKeyboard.row().text("❌ Назад", "cities");
        return await ctx.editMessageText("<b>🛒 Выберите товар:</b>", {
            reply_markup: uniqueProductsKeyboard,
            parse_mode: "HTML",
        });
    }

    // Если пользователь выбрал товар
    else if (data.startsWith("product_")) {
        const cityId = session.cityId;
        const productName = data.split("_")[1];
        const productRubPrice = data.split("_")[2];

        const product = await Product.findOne({
            name: productName,
            rub_price: productRubPrice,
            status: "available",
            city_id: cityId,
        });

        if (!product) {
            return await ctx.answerCallbackQuery(
                "Товар уже зарезервирован или недоступен, попробуйте выбрать другой"
            );
        }

        return await ctx.editMessageText(
            `<b>📦 Товар:</b> "${product.name}"\n` +
                `<b>💸 Цена:</b> ${product.rub_price} RUB`,
            {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: "🛒 Купить",
                                callback_data: `purchase_${product.name}`,
                            },
                        ],
                        [
                            {
                                text: "❌ Назад",
                                callback_data: `city_${cityId}`,
                            },
                        ],
                    ],
                },
                parse_mode: "HTML",
            }
        );
    } else if (data.startsWith("purchase_")) {
        const configData = await Configuration.findOne();
        const cityId = session.cityId;
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

        if (userReservedPurchases) {
            return await ctx.answerCallbackQuery(
                "У вас есть активные заказы.\n" +
                    "Чтобы купить товар, оплатите или отмените предыдущий заказ"
            );
        }
        if (!product || !configData) {
            return await ctx.answerCallbackQuery(
                "Товар уже зарезервирован или недоступен, попробуйте выбрать другой"
            );
        }

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
            `<b>📅 Товар "${product.name}" зарезервирован.</b>\n\n` +
                `Отправьте <code>${transaction.btc_amount}</code> BTC на адрес: <code>${configData.btcAddress}</code>\n\n` +
                `После оплаты нажмите "Проверить оплату"\n` +
                `Текущий заказ и ваши покупки вы можете найти во вкладке "<i>🛍️ Мои покупки</i>" в главном меню`,
            {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: "🔍 Проверить оплату",
                                callback_data: `check_${transaction._id}`,
                            },
                        ],
                        [
                            {
                                text: "❌ Отменить покупку",
                                callback_data: `cancel_${transaction._id}`,
                            },
                        ],
                    ],
                },
                parse_mode: "HTML",
            }
        );

        return await ctx.answerCallbackQuery();
    } else if (data.startsWith("cancel_")) {
        const transactionId = data.split("_")[1];
        const productId = session.productId;
        await Transaction.deleteOne({ _id: transactionId });
        console.log("Транзакция отменена");
        await Product.updateOne(
            { _id: productId },
            { status: "available", reserved_at: null }
        );
        console.log("Товар восстановлен");

        await ctx.deleteMessage();
    }
    // Проверка оплаты
    else if (data.startsWith("check_")) {
        const cityId = session.cityId;
        const transactionId = data.split("_")[1];
        const transaction = await Transaction.findById(transactionId);
        if (transaction && transaction.status === "pending" && cityId) {
            // const { paid, tx_hash } = await checkPayment(
            // transaction.created_at,
            //     transaction.btc_amount
            // );
            const paid = true;
            if (paid) {
                // transaction.tx_hash = tx_hash;
                transaction.status = "completed";
                await transaction.save();
                const product = await Product.findById(transaction.product_id);
                if (product) {
                    product.status = "sold";
                    product.sold_at = new Date();
                    await product.save();
                    session.productId = null;
                    await ctx.editMessageText(
                        `<b>🎉 Спасибо за покупку!</b>\n\n` +
                            `<b>💎 Ваш товар:</b> <code>${product.data}</code>`,
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
                            parse_mode: "HTML",
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
        return ctx.editMessageText(`<b>🛒 Ваши покупки:</b>`, {
            reply_markup: purchasesKeyboard,
            parse_mode: "HTML",
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
        return ctx.editMessageText(
            `<b>💎 Ваш товар:</b> <code>${product.data}</code>`,
            {
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
                parse_mode: "HTML",
            }
        );
    } else if (data === "admin_panel") {
        if (!session.isAdmin) {
            session.adminStep = "password_input";

            return await ctx.editMessageText(
                "🔑 <b>Введите ключ доступа ниже</b>",
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
                    parse_mode: "HTML",
                }
            );
        }

        return await sendAdminMenu(ctx, "edit");
    }
});

bot.on("message", async (ctx) => {
    const session = ctx.session;

    if (session.adminStep === "password_input") {
        const inputedPassword = ctx.message.text;
        const isPasswordValid = (await Configuration.findOne({
            adminPassword: inputedPassword,
        }))
            ? true
            : false;

        if (session.botLastMessageId) {
            ctx.deleteMessage();
            ctx.api.deleteMessage(ctx.chat.id, session.botLastMessageId);
            session.botLastMessageId = null;
        }

        if (isPasswordValid) {
            session.isAdmin = true;
            return await sendAdminMenu(ctx);
        }

        return await ctx.reply(`<b>⚠️ Неверный ключ доступа</b>`, {
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
            parse_mode: "HTML",
        });
    }
    return await ctx.reply(
        `<b>❓ Не понял вашей команды</b>\n\nЧтобы открыть меню навигации, введите /start`,
        {
            parse_mode: "HTML",
        }
    );
});

bot.catch((err) => {
    console.error("Произошла ошибка в боте:\n", err);
});

bot.start();
