import { Bot, InlineKeyboard, session } from "grammy";
import { City, Product, Transaction, Configuration } from "../database/models";
import connectToDatabase from "../database/index";
import { generateUniqueAmount, getUniqueProducts } from "./helpers";
import { ExtendedContext, SessionData } from "./types";
import { sendMainMenu, sendAdminMenu, sendErrorMessage } from "./messages";
import {
    cancelTransactionAndProduct,
    getUserCanceledTransactions,
    scheduleTransactionsCleanup,
    sendInvoicePayable,
} from "./transations";
import mongoose from "mongoose";
import sendSuccessfulMessage from "./messages/sendSuccessfulMessage";

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
                admin_password: "test",
                btc_address: "1Q7rzSJm6Su4ymxPJ22EUDktfSLhRPAoN4",
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
            botOrderMessageId: null,
            userAdminPassword: undefined,
            adminStep: undefined,
            tempProduct: null,
        }),
    })
);

// Мидлвара для проверки авторизации админки
bot.use(async (ctx, next) => {
    const callbackQueryData = ctx.callbackQuery?.data;
    if (
        ctx.callbackQuery &&
        callbackQueryData?.startsWith("admin_") &&
        callbackQueryData !== "admin_panel"
    ) {
        const isAdminPasswordValid = (await Configuration.findOne({
            admin_password: ctx.session.userAdminPassword,
        }))
            ? true
            : false;
        if (!isAdminPasswordValid) {
            return await ctx.answerCallbackQuery(
                "Не узнаю вас. Введите ключ доступа через /start → Админ-панель"
            );
        }
    }

    await next(); // Продолжаем обработку для других запросов
});

// Обработчик команды /start
bot.command("start", async (ctx) => {
    await sendMainMenu(ctx);
});

// Обрабочик нажатий на кнопки
bot.on("callback_query:data", async (ctx) => {
    const data = ctx.callbackQuery.data;
    const session = ctx.session;

    // Если пользователь нажал на кнопку "Товары"
    if (data === "cities") {
        const cities = await City.find();
        if (!cities || cities.length === 0) {
            return await ctx.editMessageText(
                "<b>⚠️ Ошибка:</b> Города не найдены",
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
                .text(
                    `📦 ${product.name} (${product.rub_price} RUB)`,
                    `product_${product.name}_${product.rub_price}`
                )
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
        const btcAddressToPay = await Configuration.findOne().then(
            (config) => config?.btc_address
        );
        const cityId = session.cityId;
        const productName = data.split("_")[1];
        const product = await Product.findOne({
            name: productName,
            status: "available",
            city_id: cityId,
        });
        const tgUserId = ctx.callbackQuery.from.id;

        const checkOrderMinutes = 10;
        const isUserCanceledManyOrders =
            (await getUserCanceledTransactions(tgUserId, checkOrderMinutes))
                .length > 2;
        const isUserGotReservedPurchases = await Transaction.findOne({
            customer_tg_id: tgUserId,
            status: "pending",
        });

        if (isUserGotReservedPurchases) {
            return await ctx.answerCallbackQuery(
                "У вас есть активные заказы.\n" +
                    "Чтобы купить товар, оплатите или отмените предыдущий заказ"
            );
        }

        if (isUserCanceledManyOrders) {
            return await ctx.answerCallbackQuery(
                "Вы слишком часто отменяли заказы.\n" +
                    `Подождите около ${checkOrderMinutes} минут, прежде чем совершить следующий заказ`
            );
        }
        if (!product) {
            return await ctx.answerCallbackQuery(
                "Товар уже зарезервирован или недоступен, попробуйте выбрать другой"
            );
        }

        if (!btcAddressToPay) {
            return await ctx.answerCallbackQuery(
                "Не удалось создать счет из-за отсутсвия платежного адреса"
            );
        }

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

        return await sendInvoicePayable(
            ctx,
            transaction,
            product,
            btcAddressToPay
        );
    } else if (data.startsWith("cancel_")) {
        try {
            const transactionId = data.split("_")[1];
            const productId = await Transaction.findOne({
                _id: transactionId,
                status: "pending",
            }).then((transaction) => transaction?.product_id);

            if (!productId) {
                return ctx.deleteMessage();
            }

            await cancelTransactionAndProduct(
                new mongoose.Types.ObjectId(transactionId),
                new mongoose.Types.ObjectId(productId)
            );

            return await sendMainMenu(ctx, "edit");
        } catch (error) {
            console.error(
                "Не удалось отменить транзакцию пользователем:\n\n",
                error
            );
        }
    }
    // Проверка оплаты
    else if (data.startsWith("check_")) {
        const transactionId = data.split("_")[1];
        const transaction = await Transaction.findOne({
            _id: transactionId,
            status: "pending",
        });

        if (transaction && transaction.status === "pending") {
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
                    // session.productId = null;
                    return await ctx.editMessageText(
                        `<b>🎉 Спасибо за покупку!</b>\n` +
                            `<b>🆔 Заказ №:</b> <code>${transaction._id}</code>\n` +
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
                return await ctx.answerCallbackQuery("Оплата ещё не получена");
            }
        }
        return await ctx.answerCallbackQuery(
            "Не удалось проверить оплату. Возможно, заказ уже отменен или завершен"
        );
    }

    // Отмена, возвращение в меню
    else if (data === "menu") {
        return await sendMainMenu(ctx, "edit");

        // Если пользователь нажал на кнопку "Мои заказы"
    } else if (data === "orders") {
        const tgUserId = ctx.callbackQuery.from.id;
        const orders = await Transaction.find({
            customer_tg_id: tgUserId,
            status: { $in: ["completed", "pending"] },
        });

        if (orders.length === 0) {
            return await ctx.answerCallbackQuery(
                "Вы еще не совершали покупок в нашем магазине"
            );
        }

        const ordersKeyboard = new InlineKeyboard();
        await Promise.all(
            orders.map(async (transaction) => {
                if (transaction.status === "completed") {
                    const productId = transaction.product_id;
                    const product = await Product.findOne({
                        _id: productId,
                        status: "sold",
                    });

                    if (product) {
                        ordersKeyboard
                            .text(
                                `✅ ${product.name}`,
                                `order_${transaction._id}`
                            )
                            .row();
                    }
                } else {
                    const productId = transaction.product_id;
                    const product = await Product.findOne({
                        _id: productId,
                        status: "reserved",
                    });

                    if (product) {
                        ordersKeyboard
                            .text(
                                `🔄 ${product.name}`,
                                `order_${transaction._id}`
                            )
                            .row();
                    }
                }
            })
        );

        ordersKeyboard.row();
        ordersKeyboard.text("❌ Назад", `menu`);
        return ctx.editMessageText(`<b>🛒 Ваши заказы:</b>`, {
            reply_markup: ordersKeyboard,
            parse_mode: "HTML",
        });

        // Если пользователь выбрал товар в своих заказах
    } else if (data.startsWith("order_")) {
        const transactionId = data.split("_")[1];
        const transaction = await Transaction.findById(transactionId);
        const productId = transaction?.product_id;
        const product = await Product.findById(productId);
        const btcAddressToPay = await Configuration.findOne().then(
            (config) => config?.btc_address
        );
        const notFoundMessage =
            "Заказ не найден. Возможно, стоит попробовать позже";

        if (!product || !transaction || !btcAddressToPay) {
            return ctx.answerCallbackQuery(notFoundMessage);
        }

        if (product.status === "sold") {
            return ctx.editMessageText(
                `<b>🏷️ Название товара:</b> ${product.name}\n` +
                    `<b>🆔 Заказ №:</b> <code>${transaction._id}</code>\n` +
                    `<b>💎 Товар:</b> <code>${product.data}</code>`,
                {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: "❌ Назад",
                                    callback_data: `orders`,
                                },
                            ],
                        ],
                    },
                    parse_mode: "HTML",
                }
            );
        }

        return await sendInvoicePayable(
            ctx,
            transaction,
            product,
            btcAddressToPay
        );
    } else if (data === "admin_panel") {
        const isAdminPasswordValid = (await Configuration.findOne({
            admin_password: session.userAdminPassword,
        }))
            ? true
            : false;
        if (!isAdminPasswordValid) {
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
    } else if (data === "admin_config") {
        session.adminStep = undefined;
        const configuration = await Configuration.findOne();

        if (!configuration) {
            return await ctx.answerCallbackQuery(
                "Не удалось получить адрес оплаты"
            );
        }

        return await ctx.editMessageText(
            `<b>💸 Текущий адрес оплаты:</b> <code>${configuration.btc_address}</code>\n` +
                `<b>🔑 Текущий пароль к админке:</b> <code>${configuration.admin_password}</code>`,
            {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: "🔄 Изменить адрес оплаты",
                                
                                callback_data: `admin_update_address`,
                            },
                        ],
                        [
                            {
                                text: "🔄 Изменить пароль",

                                callback_data: `admin_update_password`,
                            },
                        ],
                        [
                            {
                                text: "❌ Назад",

                                callback_data: `admin_panel`,
                            },
                        ],
                    ],
                },

                parse_mode: "HTML",
            }
        );
    } else if (data.startsWith("admin_option_")) {
        const isCityOption = data.split("_")[2] === "city";

        if (isCityOption) {
            const cityId = data.split("_")[3];
            const actionKeyboard = new InlineKeyboard();
            const city = await City.findOne({ _id: cityId });

            if (!city) {
                return await sendErrorMessage(ctx, "admin_panel", "edit");
            }

            actionKeyboard
                .text("🔄 Изменить", `admin_update_city_${cityId}`)
                .text("🗑️ Удалить", `admin_delete_city_${cityId}`)
                .row()
                .text("❌ Назад", `admin_cities`);

            return await ctx.editMessageText(`<b>🏙️ Город: ${city.name}</b>`, {
                reply_markup: actionKeyboard,
                parse_mode: "HTML",
            });
        }

        const isPasswordChanging = data.split("_")[2] === "password";
        const isBtcAddressChanging = data.split("_")[2] === "address";

        if (isPasswordChanging) {
            session.adminStep = data;
            return await ctx.editMessageText(
                `<b>💸 Отправьте новый пароль для входа без кавычек и пробелов</b>\n` +
                    `<b>🔑 Пример:</b> da1s2lKsa!13L_asd2`,
                {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: "❌ Назад",

                                    callback_data: `admin_config`,
                                },
                            ],
                        ],
                    },

                    parse_mode: "HTML",
                }
            );
        }

        if (isBtcAddressChanging) {
            const hasPendingTransactions =
                (await Transaction.find({ status: "pending" })).length > 0;

            if (hasPendingTransactions) {
                return ctx.answerCallbackQuery(
                    "Вы не можете изменить адрес оплаты, пока у клиентов есть активные неоплаченные заказы"
                );
            }
            session.adminStep = "admin_update_address";
            return await ctx.editMessageText(
                `<b>💸 Отправьте новый адрес оплаты без кавычек и пробелов</b>\n` +
                    `<b>🔑 Пример:</b> 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa`,
                {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: "❌ Назад",

                                    callback_data: `admin_config`,
                                },
                            ],
                        ],
                    },

                    parse_mode: "HTML",
                }
            );
        }
    } else if (data.startsWith("admin_delete_")) {
        const isCityDeleting = data.split("_")[2] === "city";

        if (isCityDeleting) {
            const cityId = data.split("_")[3];

            await City.deleteOne({ _id: cityId });

            return await sendSuccessfulMessage(ctx, "admin_panel", "edit");
        }
    } else if (data === "admin_cities") {
        const cities = await City.find();

        const cityKeyboard = new InlineKeyboard();
        cities.forEach((city, index) => {
            // Добавляем кнопку с названием города и его ID
            cityKeyboard.text(
                `🏙️ ${city.name}`,
                `admin_option_city_${city._id}`
            );
            // После каждой второй кнопки (или последней) добавляем перенос строки
            if ((index + 1) % 2 === 0 || index === cities.length - 1) {
                cityKeyboard.row();
            }
        });

        // Кнопка "Назад" в отдельной строке
        cityKeyboard.row().text("➕ Добавить город", "admin_create_city");
        cityKeyboard.row().text("❌ Назад", "admin_panel");

        await ctx.editMessageText("<b>🌆 Выберите город:</b>", {
            reply_markup: cityKeyboard,
            parse_mode: "HTML",
        });
    } else if (data.startsWith("admin_update_")) {
        const isCityUpdate = data.split("_")[2] === "city";

        if (isCityUpdate) {
            const cityId = data.split("_")[3];

            session.adminStep = data;

            return await ctx.editMessageText(
                `<b>🏙️ Отправьте новое название города</b>`,
                {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: "❌ Назад",
                                    callback_data: `admin_option_city_${cityId}`,
                                },
                            ],
                        ],
                    },
                    parse_mode: "HTML",
                }
            );
        }
    } else if (data === "admin_create_city") {
        session.adminStep = "admin_create_city";
        await ctx.editMessageText(
            "<b>🏙️ Отправьте название нового города</b>",
            {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: "❌ Назад",

                                callback_data: `admin_cities`,
                            },
                        ],
                    ],
                },

                parse_mode: "HTML",
            }
        );
    }
});

bot.on("message", async (ctx) => {
    const session = ctx.session;

    if (session.adminStep === "password_input") {
        const isPasswordValid = (await Configuration.findOne({
            admin_password: ctx.message.text,
        }))
            ? true
            : false;

        if (session.botLastMessageId) {
            ctx.deleteMessage();
            ctx.api.deleteMessage(ctx.chat.id, session.botLastMessageId);

            session.botLastMessageId = null;
        }

        if (isPasswordValid) {
            session.userAdminPassword = ctx.message.text;
            return await sendAdminMenu(ctx);
        }

        const sendedMessageId = await ctx
            .reply(`<b>⚠️ Неверный ключ доступа</b>`, {
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
            })
            .then((message) => message.message_id);
        session.adminStep = undefined;

        return (ctx.session.botLastMessageId = sendedMessageId);
    } else if (session.adminStep?.startsWith("admin_update_")) {
        const userMessage = ctx.message.text?.trim();

        const isPasswordChanging =
            session.adminStep.split("_")[2] === "password";
        const isBtcAddressChanging =
            session.adminStep.split("_")[2] === "address";
        const isCityChanging = session.adminStep.split("_")[2] === "city";

        if (session.botLastMessageId) {
            ctx.deleteMessage();
            ctx.api.deleteMessage(ctx.chat.id, session.botLastMessageId);

            session.botLastMessageId = null;
        }

        if (!userMessage) {
            return await sendErrorMessage(ctx, "admin_panel");
        }

        if (isCityChanging) {
            const cityId = session.adminStep.split("_")[3];
            await City.updateOne({ _id: cityId }, { name: userMessage });

            return await sendSuccessfulMessage(ctx, "admin_panel");
        }
        const configuration = await Configuration.findOne();

        if (!configuration) {
            return await sendErrorMessage(ctx, "admin_panel");
        }

        if (isPasswordChanging) {
            configuration.admin_password = userMessage;
            await configuration.save();
            session.userAdminPassword = userMessage;

            return await sendSuccessfulMessage(ctx, "admin_panel");
        }

        if (isBtcAddressChanging) {
            configuration.btc_address = userMessage;
            await configuration.save();

            return await sendSuccessfulMessage(ctx, "admin_panel");
        }
    } else if (session.adminStep?.startsWith("admin_create_city")) {
        const userMessage = ctx.message.text?.trim();

        if (session.botLastMessageId) {
            ctx.deleteMessage();
            ctx.api.deleteMessage(ctx.chat.id, session.botLastMessageId);

            session.botLastMessageId = null;
        }

        if (!userMessage) {
            return await sendErrorMessage(ctx, "admin_panel");
        }

        await City.create({ name: userMessage });
        return await sendSuccessfulMessage(ctx, "admin_panel");
    }
    const sendedMessageId = await ctx
        .reply(
            `<b>❓ Не понял вашей команды</b>\n\nЧтобы открыть меню навигации, введите /start`,
            {
                parse_mode: "HTML",
            }
        )
        .then((message) => message.message_id);

    return (session.botLastMessageId = sendedMessageId);
});

bot.catch((err) => {
    console.error("Произошла ошибка в боте:\n\n", err);
});

bot.start();
