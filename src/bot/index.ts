import { Bot, InlineKeyboard, session } from "grammy";
import { City, Product, Transaction, Configuration } from "../database/models";
import connectToDatabase from "../database/index";
import { generateUniqueAmount, getUniqueProducts } from "./helpers";
import { AdminProductsGroup, ExtendedContext, SessionData } from "./types";
import { sendMainMenu, sendAdminMenu } from "./messages";
import {
    cancelTransactionAndProduct,
    getUserCanceledTransactions,
    scheduleTransactionsCleanup,
    sendInvoicePayable,
} from "./transations";
import mongoose, { Decimal128 } from "mongoose";
import sendSuccessfulMessage from "./messages/sendSuccessfulMessage";

if (!process.env.TG_BOT_TOKEN) {
    throw new Error("Telegram bot token not found");
}

const bot = new Bot<ExtendedContext>(process.env.TG_BOT_TOKEN);

// Поиск и отмена транзакций, находящихся в ожидании больше часа, каждые 5 минут
scheduleTransactionsCleanup(60);

// Helper functions for initial data setup
async function createCitiesIfNotExist() {
    const cities = await City.find();
    if (!cities.length) {
        await Promise.all([
            City.create({ name: "Токио" }),
            City.create({ name: "Лондон" }),
            City.create({ name: "Нью-Йорк" }),
            City.create({ name: "Берлин" }),
            City.create({ name: "Сидней" }),
            City.create({ name: "Москва" }),
            City.create({ name: "Сингапур" }),
        ]);
    }
}

async function createProductsIfNotExist() {
    const products = await Product.find();
    if (!products.length) {
        const cities = await City.find();
        const citiesIds = cities.map((city) => city.id);
        await Promise.all([
            Product.create({
                name: "Подписка Netflix 1 месяц",
                city_id: citiesIds[0],
                data: "NETFLIX-12345-XYZ",
                btc_price: "0.0005", // Число → строка
                rub_price: "1200", // Число → строка
            }),
            Product.create({
                name: "Лицензия Adobe Photoshop",
                city_id: citiesIds[1],
                data: "ADOBE-PS-98765",
                btc_price: "0.015",
                rub_price: "4500",
            }),
            Product.create({
                name: "Ключ Steam $50",
                city_id: citiesIds[2],
                data: "STEAM-50USD-ABCDE",
                btc_price: "0.002",
                rub_price: "4800",
            }),
            Product.create({
                name: "Подписка Spotify Premium",
                city_id: citiesIds[3],
                data: "SPOTIFY-3M-54321",
                btc_price: "0.0004",
                rub_price: "900",
            }),
            Product.create({
                name: "Цифровой код PlayStation Plus",
                city_id: citiesIds[4],
                data: "PSPLUS-12M-XYZ123",
                btc_price: "0.0018",
                rub_price: "3600",
            }),
            Product.create({
                name: "Ключ активации Windows 11 Pro",
                city_id: citiesIds[5],
                data: "WIN11-PRO-7890-ABC",
                btc_price: "0.003",
                rub_price: "7500",
            }),
            Product.create({
                name: "Подписка Xbox Game Pass",
                city_id: citiesIds[6],
                data: "XBOX-GP-6M-45678",
                btc_price: "0.0012",
                rub_price: "2400",
            }),
            Product.create({
                name: "Цифровой код Amazon $25",
                city_id: citiesIds[0],
                data: "AMAZON-25USD-DEF456",
                btc_price: "0.001",
                rub_price: "2300",
            }),
            Product.create({
                name: "Ключ VPN NordVPN 1 год",
                city_id: citiesIds[1],
                data: "NORDVPN-1Y-123XYZ",
                btc_price: "0.0025",
                rub_price: "6000",
            }),
            Product.create({
                name: "Подписка YouTube Premium",
                city_id: citiesIds[2],
                data: "YT-PREM-3M-ABC789",
                btc_price: "0.0006",
                rub_price: "1500",
            }),
            Product.create({
                name: "Лицензия Microsoft Office 365",
                city_id: citiesIds[3],
                data: "OFFICE-365-1Y-XYZ987",
                btc_price: "0.0028",
                rub_price: "7000",
            }),
            Product.create({
                name: "Код Roblox 1000 Robux",
                city_id: citiesIds[4],
                data: "ROBLOX-1000R-DEF123",
                btc_price: "0.00045",
                rub_price: "1000",
            }),
            Product.create({
                name: "Подписка Discord Nitro",
                city_id: citiesIds[5],
                data: "DISCORD-NITRO-1M-456XYZ",
                btc_price: "0.00035",
                rub_price: "800",
            }),
            Product.create({
                name: "Ключ активации Kaspersky",
                city_id: citiesIds[6],
                data: "KASPERSKY-1Y-789ABC",
                btc_price: "0.0015",
                rub_price: "3000",
            }),
            Product.create({
                name: "Цифровой код Google Play $10",
                city_id: citiesIds[0],
                data: "GOOGLE-PLAY-10USD-XYZ456",
                btc_price: "0.0004",
                rub_price: "950",
            }),
            Product.create({
                name: "Ключ активации ESET NOD32",
                city_id: citiesIds[1],
                data: "ESET-NOD32-1Y-ABC123",
                btc_price: "0.0013",
                rub_price: "2800",
            }),
            Product.create({
                name: "Подписка Apple Music 3 месяца",
                city_id: citiesIds[2],
                data: "APPLE-MUSIC-3M-DEF789",
                btc_price: "0.0007",
                rub_price: "1600",
            }),
            Product.create({
                name: "Код Fortnite 2800 V-Bucks",
                city_id: citiesIds[3],
                data: "FORTNITE-2800VB-XYZ456",
                btc_price: "0.0011",
                rub_price: "2500",
            }),
            Product.create({
                name: "Лицензия CorelDRAW",
                city_id: citiesIds[4],
                data: "COREL-DRAW-2023-ABC987",
                btc_price: "0.012",
                rub_price: "4000",
            }),
            Product.create({
                name: "Подписка Twitch Turbo",
                city_id: citiesIds[5],
                data: "TWITCH-TURBO-1M-DEF123",
                btc_price: "0.0003",
                rub_price: "700",
            }),
            Product.create({
                name: "Ключ активации Autodesk AutoCAD",
                city_id: citiesIds[6],
                data: "AUTOCAD-2023-XYZ789",
                btc_price: "0.025",
                rub_price: "9000",
            }),
            Product.create({
                name: "Цифровой код iTunes $15",
                city_id: citiesIds[0],
                data: "ITUNES-15USD-ABC456",
                btc_price: "0.0006",
                rub_price: "1400",
            }),
            Product.create({
                name: "Подписка Paramount+ 1 месяц",
                city_id: citiesIds[1],
                data: "PARAMOUNT-1M-DEF789",
                btc_price: "0.00045",
                rub_price: "1100",
            }),
            Product.create({
                name: "Ключ VPN ExpressVPN 6 месяцев",
                city_id: citiesIds[2],
                data: "EXPRESSVPN-6M-XYZ123",
                btc_price: "0.002",
                rub_price: "4800",
            }),
            Product.create({
                name: "Код Minecraft Java Edition",
                city_id: citiesIds[3],
                data: "MINECRAFT-JAVA-ABC789",
                btc_price: "0.0014",
                rub_price: "3200",
            }),
        ]);
    }
}

async function createConfigurationIfNotExist() {
    const configCount = await Configuration.countDocuments();
    if (!configCount) {
        await Configuration.create({
            admin_password: "test",
            btc_address: "1Q7rzSJm6Su4ymxPJ22EUDktfSLhRPAoN4",
        });
    }
}

async function addRecords() {
    try {
        await connectToDatabase();
        await createCitiesIfNotExist();
        await createProductsIfNotExist();
        await createConfigurationIfNotExist();
    } catch (e) {
        console.error("Failed to create test records:", e);
    }
}

addRecords();

// Мидлвара хранящая сессии
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
            adminProductGroups: undefined,
        }),
    })
);

// Мидлавара для проверки прав администратора
bot.use(async (ctx, next) => {
    const callbackData = ctx.callbackQuery?.data;
    if (callbackData?.startsWith("admin_") && callbackData !== "admin_panel") {
        const config = await Configuration.findOne({
            admin_password: ctx.session.userAdminPassword,
        });
        if (!config) {
            await ctx.answerCallbackQuery(
                "Нет доступа. Введите ключ доступа через /start → Админ-панель"
            );
            return;
        }
    }
    await next();
});

bot.command("start", async (ctx) => await sendMainMenu(ctx));

// Обработчик нажатий на кнопки
bot.on("callback_query:data", async (ctx) => {
    try {
        const data = ctx.callbackQuery.data;

        switch (true) {
            case data === "cities":
                await showCities(ctx);
                break;
            case data.startsWith("city_"):
                await selectCity(ctx, data);
                break;
            case data.startsWith("product_"):
                await selectProduct(ctx, data);
                break;
            case data.startsWith("purchase_"):
                await purchaseProduct(ctx, data);
                break;
            case data.startsWith("cancel_"):
                await cancelPurchase(ctx, data);
                break;
            case data.startsWith("check_"):
                await checkPayment(ctx, data);
                break;
            case data === "menu":
                await sendMainMenu(ctx, "edit");
                break;
            case data === "orders":
                await showOrders(ctx);
                break;
            case data.startsWith("order_"):
                await selectOrder(ctx, data);
                break;
            case data === "orders_clear":
                await deleteCanceledOrders(ctx, data);
                break;
            case data === "admin_panel":
                await showAdminPanel(ctx);
                break;
            case data === "admin_config":
                await showAdminConfig(ctx);
                break;
            case data.startsWith("admin_option_"):
                await handleAdminOption(ctx, data);
                break;
            case data.startsWith("admin_delete_"):
                await deleteAdminItem(ctx, data);
                break;
            case data === "admin_cities":
                await showAdminCities(ctx);
                break;
            case data.startsWith("admin_update_"):
                await updateAdminItem(ctx, data);
                break;
            case data === "admin_create_city":
                await createAdminCity(ctx);
                break;
            case data === "admin_products":
                await showAdminProducts(ctx);
                break;
            case data.startsWith("admin_create_product_"):
                await createAdminProduct(ctx, data);
                break;
            default:
                await ctx.answerCallbackQuery("Неизвестная команда");
        }
    } catch (error) {
        console.error("Ошибка в callback:", error);
        await ctx.answerCallbackQuery("Произошла ошибка. Попробуйте позже.");
    }
});

async function showCities(ctx: ExtendedContext) {
    const cities = await City.find();
    if (!cities.length) {
        await ctx.editMessageText("<b>⚠️ Ошибка:</b> Города не найдены", {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "❌ Назад", callback_data: "menu" }],
                ],
            },
            parse_mode: "HTML",
        });
        return;
    }

    const keyboard = new InlineKeyboard();
    cities.forEach((city, i) => {
        keyboard.text(`🏙️ ${city.name}`, `city_${city._id}`);
        if ((i + 1) % 2 === 0 || i === cities.length - 1) keyboard.row();
    });
    keyboard.row().text("❌ Назад", "menu");

    await ctx.editMessageText("<b>🌆 Выберите город:</b>", {
        reply_markup: keyboard,
        parse_mode: "HTML",
    });
}

async function selectCity(ctx: ExtendedContext, data: string) {
    const cityId = data.split("_")[1];
    ctx.session.cityId = cityId;

    const uniqueProducts = await getUniqueProducts(cityId);
    if (!uniqueProducts.length) {
        await ctx.answerCallbackQuery("В этом городе нет доступных товаров");
        return;
    }

    const keyboard = new InlineKeyboard();
    uniqueProducts.forEach((product, i) => {
        keyboard.text(
            `📦 ${product.name} - ${product.rub_price} RUB`,
            `product_${product.name}_${product.rub_price}`
        );
        if ((i + 1) % 2 === 0 || i === uniqueProducts.length - 1)
            keyboard.row();
    });
    keyboard.row().text("❌ Назад", "cities");

    await ctx.editMessageText("<b>🛒 Выберите товар:</b>", {
        reply_markup: keyboard,
        parse_mode: "HTML",
    });
}

async function selectProduct(ctx: ExtendedContext, data: string) {
    const [_, name, rubPrice] = data.split("_");
    const product = await Product.findOne({
        name,
        rub_price: parseInt(rubPrice),
        status: "available",
        city_id: ctx.session.cityId,
    });

    if (!product) {
        await ctx.answerCallbackQuery("Товар недоступен");
        return;
    }

    await ctx.editMessageText(
        `<b>📦 Товар:</b> "${product.name}"\n<b>💸 Цена:</b> ${product.rub_price} RUB`,
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
                            callback_data: `city_${ctx.session.cityId}`,
                        },
                    ],
                ],
            },
            parse_mode: "HTML",
        }
    );
}

async function purchaseProduct(ctx: ExtendedContext, data: string) {
    if (!ctx.from || !ctx.from.id) {
        await ctx.answerCallbackQuery("Не удалось определить пользователя");
        return;
    }

    const name = data.split("_")[1];
    const product = await Product.findOne({
        name,
        status: "available",
        city_id: ctx.session.cityId,
    });
    const config = await Configuration.findOne();

    if (!product || !config?.btc_address) {
        await ctx.answerCallbackQuery("Ошибка при покупке");
        return;
    }

    const userId = ctx.from.id;
    const pending = await Transaction.findOne({
        customer_tg_id: userId,
        status: "pending",
    });
    if (pending) {
        await ctx.answerCallbackQuery("У вас есть активный заказ");
        return;
    }

    const cancels = await getUserCanceledTransactions(userId, 10);
    if (cancels.length > 2) {
        await ctx.answerCallbackQuery(
            "Слишком много отмен заказов. Подождите 10 минут"
        );
        return;
    }

    product.status = "reserved";
    product.reserved_at = new Date();
    await product.save();

    const transaction = new Transaction({
        customer_tg_id: userId,
        product_id: product._id,
        btc_amount: generateUniqueAmount(
            product.btc_price as mongoose.Types.Decimal128
        ),
        status: "pending",
    });
    await transaction.save();

    await sendInvoicePayable(ctx, transaction, product, config.btc_address);
}

async function cancelPurchase(ctx: ExtendedContext, data: string) {
    const transactionId = data.split("_")[1];
    const transaction = await Transaction.findOne({
        _id: transactionId,
        status: "pending",
    });

    if (!transaction) {
        await await sendMainMenu(ctx, "edit");
        return;
    }

    await cancelTransactionAndProduct(
        new mongoose.Types.ObjectId(transactionId),
        new mongoose.Types.ObjectId(transaction.product_id)
    );
    await sendMainMenu(ctx, "edit");
}

async function checkPayment(ctx: ExtendedContext, data: string) {
    const transactionId = data.split("_")[1];
    const transaction = await Transaction.findOne({
        _id: transactionId,
        status: "pending",
    });

    if (!transaction) {
        await ctx.answerCallbackQuery("Не удалось проверить оплату");
        return;
    }

    const paid = true; // Placeholder for actual payment check logic
    if (paid) {
        transaction.status = "completed";
        await transaction.save();

        const product = await Product.findById(transaction.product_id);
        if (product) {
            product.status = "sold";
            product.sold_at = new Date();
            await product.save();

            await ctx.editMessageText(
                `<b>🎉 Спасибо за покупку!</b>\n` +
                    `<b>🆔 Заказ №:</b> <code>${transaction._id}</code>\n` +
                    `<b>💎 Ваш товар:</b> <code>${product.data}</code>`,
                {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: "🏠 В главное меню",
                                    callback_data: "menu",
                                },
                            ],
                        ],
                    },
                    parse_mode: "HTML",
                }
            );
        }
    } else {
        await ctx.answerCallbackQuery("Оплата ещё не получена");
    }
}

async function showOrders(ctx: ExtendedContext) {
    if (!ctx.from || !ctx.from.id) {
        await ctx.answerCallbackQuery("Не удалось определить пользователя");
        return;
    }

    const orders = await Transaction.find({
        customer_tg_id: ctx.from.id,
        status: { $in: ["completed", "pending", "canceled"] },
    });

    if (!orders.length) {
        await ctx.answerCallbackQuery("У вас нет заказов");
        return;
    }

    const keyboard = new InlineKeyboard();
    await Promise.all(
        orders.map(async (order) => {
            const product = await Product.findById(order.product_id);
            if (product) {
                let icon = order.status === "completed" ? "✅" : "🔄";

                if (order.status === "canceled") {
                    icon = "🚫";
                }

                keyboard
                    .text(`${icon} ${product.name}`, `order_${order._id}`)
                    .row();
            }
        })
    );
    keyboard.row().text("🗑️ Удалить отмененные заказы", "orders_clear");
    keyboard.row().text("❌ Назад", "menu");

    await ctx.editMessageText("<b>🛒 Ваши заказы:</b>", {
        reply_markup: keyboard,
        parse_mode: "HTML",
    });
}

async function selectOrder(ctx: ExtendedContext, data: string) {
    const transactionId = data.split("_")[1];
    const transaction = await Transaction.findById(transactionId);
    const product = transaction
        ? await Product.findById(transaction.product_id)
        : null;
    const config = await Configuration.findOne();

    if (!transaction || !product || !config?.btc_address) {
        await ctx.answerCallbackQuery("Заказ не найден");
        return;
    }

    if (product.status === "sold") {
        await ctx.editMessageText(
            `<b>🆔 Заказ №:</b> <code>${transaction._id}</code>\n` +
                `<b>🏷️ Название товара:</b> ${product.name}\n` +
                `<b>💎 Товар:</b> <code>${product.data}</code>`,
            {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "❌ Назад", callback_data: "orders" }],
                    ],
                },
                parse_mode: "HTML",
            }
        );
    } else if (product.status === "reserved") {
        await sendInvoicePayable(ctx, transaction, product, config.btc_address);
    } else {
        await ctx.editMessageText(
            `<b>🆔 Заказ №:</b> <code>${transaction._id}</code>\n` +
                `<b>🏷️ Название товара:</b> ${product.name}\n` +
                `<b>❌ Статус:</b> Отменен`,
            {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "❌ Назад", callback_data: "orders" }],
                    ],
                },
                parse_mode: "HTML",
            }
        );
    }
}

async function deleteCanceledOrders(ctx: ExtendedContext, data: string) {
    const userId = ctx.callbackQuery?.from.id;

    const hasCanceledOrders = (await Transaction.findOne({
        customer_tg_id: userId,
        status: "canceled",
    }))
        ? true
        : false;

    if (!hasCanceledOrders) {
        await ctx.answerCallbackQuery("У вас нет отмененных заказов");
        return;
    }

    await Transaction.deleteMany({
        customer_tg_id: userId,
        status: "canceled",
    });
    await showOrders(ctx);
}

async function showAdminPanel(ctx: ExtendedContext) {
    const config = await Configuration.findOne({
        admin_password: ctx.session.userAdminPassword,
    });
    if (!config) {
        ctx.session.adminStep = "password_input";
        await ctx.editMessageText("<b>🔑 Введите ключ доступа:</b>", {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "❌ Назад", callback_data: "menu" }],
                ],
            },
            parse_mode: "HTML",
        });
    } else {
        await sendAdminMenu(ctx, "edit");
    }
}

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

async function handleAdminOption(ctx: ExtendedContext, data: string) {
    const parts = data.split("_");
    const type = parts[2];
    const id = parts[3];

    if (type === "city") {
        const city = await City.findById(id);
        if (!city) {
            await ctx.answerCallbackQuery("Город не найден");
            return;
        }

        ctx.session.adminStep = undefined;
        const keyboard = new InlineKeyboard()
            .text("🔄 Изменить", `admin_update_city_${id}`)
            .text("🗑️ Удалить", `admin_delete_city_${id}`)
            .row()
            .text("❌ Назад", "admin_cities");

        await ctx.editMessageText(
            `<b>🏙️ Город:</b> ${city.name}\n\n` +
                `<b>⚠️ ВАЖНО!!! При удалении города будут также удалены все не проданные привязанные к нему товары</b>`,
            {
                reply_markup: keyboard,
                parse_mode: "HTML",
            }
        );
    } else if (type === "productCities") {
        const groupedProducts = await Product.aggregate([
            {
                $match: {
                    city_id: new mongoose.Types.ObjectId(id),
                    status: { $in: ["available", "reserved"] },
                },
            },
            {
                $group: {
                    _id: {
                        name: "$name",
                        rub_price: "$rub_price",
                        btc_price: "$btc_price",
                        status: "$status",
                    },
                    count: { $sum: 1 },
                    productIds: { $push: "$_id" },
                },
            },
            {
                $project: {
                    name: "$_id.name",
                    rub_price: "$_id.rub_price",
                    btc_price: "$_id.btc_price",
                    status: "$_id.status",
                    count: 1,
                    productIds: 1,
                    _id: 0,
                },
            },
        ]);
        if (!groupedProducts.length) {
            await ctx.answerCallbackQuery("В этом городе нет товаров");
            return;
        }

        const groupedProductsWithIds: AdminProductsGroup[] =
            groupedProducts.map((group, index) => ({
                id: index + 1,
                ...group,
            }));
        ctx.session.adminStep = undefined;
        ctx.session.adminProductGroups = groupedProductsWithIds;

        const keyboard = new InlineKeyboard();
        groupedProductsWithIds.forEach((group) => {
            const statusIcon = group.status === "available" ? "✅" : "🔄";
            keyboard
                .text(
                    `${statusIcon} ${group.name} - ${group.rub_price} RUB, ${group.btc_price} BTC`,
                    `admin_option_group_${group.id}`
                )
                .row();
        });
        keyboard
            .row()
            .text("➕ Добавить товар", `admin_create_product_${id}`)
            .text("❌ Назад", "admin_products");

        await ctx.editMessageText("<b>📦 Выберите группу товаров:</b>", {
            reply_markup: keyboard,
            parse_mode: "HTML",
        });
    } else if (type === "group") {
        if (!ctx.session.adminProductGroups) {
            ctx.answerCallbackQuery("Попробуйте заново через /start");
            return;
        }

        const groupedProductsWithIds = ctx.session.adminProductGroups;
        const productsGroup = groupedProductsWithIds.filter((group) => {
            return group.id === parseInt(id);
        })[0];

        const products = await Product.find({
            name: productsGroup.name,
            rub_price: productsGroup.rub_price,
            btc_price: productsGroup.btc_price,
            status: productsGroup.status,
        });

        const keyboard = new InlineKeyboard();
        products.forEach((product, index) => {
            keyboard
                .text(
                    `#️⃣ ${index + 1}`,
                    `admin_option_product_${product.id}_${id}`
                ) // ${id} - id группы
                .row();
        });
        keyboard
            .row()
            .text(
                "❌ Назад",
                `admin_option_productCities_${products[0].city_id}`
            );

        await ctx.editMessageText("<b>📦 Выберите товар:</b>", {
            reply_markup: keyboard,
            parse_mode: "HTML",
        });
    } else if (type === "product") {
        const groupId = parts[4];
        const product = await Product.findById(id);
        const cityName = await City.findOne({ _id: product?.city_id }).then(
            (city) => city?.name
        );

        if (!product || !cityName) {
            await ctx.answerCallbackQuery("Товар не найден");
            return;
        }

        ctx.session.adminStep = undefined;

        const keyboard = new InlineKeyboard()
            .text(
                "🔄 Изменить",
                `admin_update_product_${product.id}_${groupId}`
            )
            .text("🗑️ Удалить", `admin_delete_product_${product.id}`)
            .row()
            .text("❌ Назад", `admin_option_group_${groupId}`);

        await ctx.editMessageText(
            `<b>🆔 Номер товара:</b> <code>${product.id}</code>\n` +
                `<b>✍️ Название:</b> ${product.name}\n` +
                `<b>🌆 Город:</b> ${cityName}\n` +
                `<b>₽ Цена в рублях:</b> ${product.rub_price.toString()}\n` +
                `<b>₿ Цена в BTC:</b> ${product.btc_price.toString()}\n` +
                `<b>⚡ Статус:</b> ${
                    product.status === "available"
                        ? "В наличии"
                        : "Зарезервирован покупателем"
                }\n` +
                `<b>📄 Данные:</b> ${product.data}\n` +
                `<b>📅 Создан:</b> ${new Date(product.created_at)}\n` +
                `<b>📌 Забронирован:</b> ${
                    product.reserved_at
                        ? new Date(product.reserved_at)
                        : "Не забронирован"
                }\n` +
                `<b>✅ Продан:</b> ${
                    product.sold_at
                        ? new Date(product.sold_at).toLocaleDateString()
                        : "Не продан"
                }\n` +
                `📦 Готовое сообщение для удобного редактирования:\n` +
                `<code>${product.name}, ${product.rub_price}, ${product.btc_price}, ${product.data}</code>`,
            {
                reply_markup: keyboard,
                parse_mode: "HTML",
            }
        );
    }
}

async function deleteAdminItem(ctx: ExtendedContext, data: string) {
    const parts = data.split("_");
    const type = parts[2];
    const id = parts[3];

    if (type === "city") {
        await City.deleteOne({ _id: id });
        await Product.deleteMany({ city_id: id, status: "available" });
        await sendSuccessfulMessage(ctx, "admin_panel", "edit");
    } else if (type === "product") {
        await Product.deleteOne({ _id: id });
        await sendSuccessfulMessage(ctx, "admin_panel", "edit");
    }
}

async function updateAdminItem(ctx: ExtendedContext, data: string) {
    const parts = data.split("_");
    const type = parts[2];
    const id = parts[3];

    if (type === "city" && id) {
        ctx.session.adminStep = data;
        await ctx.editMessageText("<b>🏙️ Введите новое название города:</b>", {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "❌ Назад",
                            callback_data: `admin_option_city_${id}`,
                        },
                    ],
                ],
            },
            parse_mode: "HTML",
        });
    } else if (type === "password") {
        ctx.session.adminStep = "admin_update_password";
        await ctx.editMessageText(
            `<b>🔑 Отправьте новый пароль (без пробелов):</b>\nПример: <code>da1s2lKsa!13L_asd2</code>`,
            {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "❌ Назад", callback_data: "admin_config" }],
                    ],
                },
                parse_mode: "HTML",
            }
        );
    } else if (type === "address") {
        const hasPending =
            (await Transaction.find({ status: "pending" }).countDocuments()) >
            0;
        if (hasPending) {
            await ctx.answerCallbackQuery(
                "Нельзя изменить адрес при активных заказах"
            );
            return;
        }
        ctx.session.adminStep = "admin_update_address";
        await ctx.editMessageText(
            `<b>💸 Отправьте новый адрес BTC:</b>\nПример: <code>1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa</code>`,
            {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "❌ Назад", callback_data: "admin_config" }],
                    ],
                },
                parse_mode: "HTML",
            }
        );
    } else if (type === "product") {
        const groupId = parts[4];
        ctx.session.adminStep = data;
        await ctx.editMessageText(
            "<b>📦 Введите новую информацию товара:</b>\n" +
                "Отправьте данные в формате: <code>Название, Цена в RUB, Цена в BTC, Данные товара</code>\n" +
                "Пример: <code>Подписка Netflix 1 месяц, 1200, 0.0005, NETFLIX-12345-XYZ</code>",
            {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: "❌ Отмена",
                                callback_data: `admin_option_product_${id}_${groupId}`,
                            },
                        ],
                    ],
                },
                parse_mode: "HTML",
            }
        );
    }
}

async function createAdminCity(ctx: ExtendedContext) {
    ctx.session.adminStep = "admin_create_city";
    await ctx.editMessageText("<b>🏙️ Введите название нового города:</b>", {
        reply_markup: {
            inline_keyboard: [
                [{ text: "❌ Назад", callback_data: "admin_cities" }],
            ],
        },
        parse_mode: "HTML",
    });
}

async function showAdminCities(ctx: ExtendedContext) {
    const cities = await City.find();

    const keyboard = new InlineKeyboard();
    cities.forEach((city, i) => {
        keyboard.text(`🏙️ ${city.name}`, `admin_option_city_${city._id}`);
        if ((i + 1) % 2 === 0 || i === cities.length - 1) keyboard.row();
    });
    keyboard.row().text("➕ Добавить город", "admin_create_city");
    keyboard.row().text("❌ Назад", "admin_panel");

    await ctx.editMessageText("<b>🌆 Выберите город:</b>", {
        reply_markup: keyboard,
        parse_mode: "HTML",
    });
}

// Выбор города после нажатия на кнопку Товары в админке
async function showAdminProducts(ctx: ExtendedContext) {
    ctx.session.adminProductGroups = undefined;
    const cities = await City.find();
    if (!cities.length) {
        await ctx.editMessageText("<b>⚠️ Ошибка:</b> Города не найдены", {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "❌ Назад", callback_data: "admin_panel" }],
                ],
            },
            parse_mode: "HTML",
        });
        return;
    }

    const keyboard = new InlineKeyboard();
    cities.forEach((city, i) => {
        keyboard.text(
            `🏙️ ${city.name}`,
            `admin_option_productCities_${city._id}`
        );
        if ((i + 1) % 2 === 0 || i === cities.length - 1) keyboard.row();
    });
    keyboard.row().text("❌ Назад", "admin_panel");

    await ctx.editMessageText("<b>🌆 Выберите город:</b>", {
        reply_markup: keyboard,
        parse_mode: "HTML",
    });
}

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

async function addOrUpdateProduct(
    ctx: ExtendedContext,
    userMessage: string,
    productId: string = ""
) {
    const session = ctx.session;
    const messageParts = userMessage.split(",").map((part) => part.trim()); // Разделение сообщения по запятым
    const backButtonCallback_data =
        productId !== ""
            ? `admin_option_product_${productId}`
            : `admin_option_productCities_${session.cityId}`;

    if (messageParts.length !== 4) {
        // Проверка, что введено 4 части
        const msg = await ctx.reply(
            "<b>⚠️ Неверный формат!</b>\n" +
                "Используйте: <code>Название, Цена в RUB, Цена в BTC, Код</code>\n" +
                "Пример: <code>Подписка Netflix 1 месяц, 1200, 0.0005, NETFLIX-12345-XYZ</code>",
            {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: "❌ Отмена",
                                callback_data: backButtonCallback_data,
                            },
                        ],
                    ],
                },
                parse_mode: "HTML",
            }
        );
        session.botLastMessageId = msg.message_id;
        return false;
    }

    const [name, rubPriceStr, btcPriceStr, data] = messageParts;
    const rubPrice = rubPriceStr;
    const btcPrice = btcPriceStr;

    // Проверка корректности данных
    if (
        !name ||
        !rubPrice ||
        isNaN(parseFloat(rubPrice)) ||
        parseFloat(rubPrice) <= 0 ||
        !btcPrice ||
        isNaN(parseFloat(btcPrice)) ||
        parseFloat(btcPrice) <= 0 ||
        !data
    ) {
        const msg = await ctx.reply(
            "<b>⚠️ Ошибка в данных!</b>\n" +
                "Проверьте:\n" +
                "- Название не пустое\n" +
                "- Цена в RUB и BTC — корректные числа больше 0\n" +
                "- Код не пустой\n" +
                "Пример: <code>Подписка Netflix 1 месяц, 1200, 0.0005, NETFLIX-12345-XYZ</code>",
            {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: "❌ Отмена",
                                callback_data: backButtonCallback_data,
                            },
                        ],
                    ],
                },
                parse_mode: "HTML",
            }
        );
        session.botLastMessageId = msg.message_id;
        return false;
    }

    if (productId) {
        const updatedProduct = await Product.updateOne(
            { id: productId },
            {
                name,
                rub_price: mongoose.Types.Decimal128.fromString(rubPrice),
                btc_price: mongoose.Types.Decimal128.fromString(btcPrice),
            }
        );

        await ctx.reply(
            `<b>✅ Товар успешно изменен: </b>\n<code>${updatedProduct}</code>`,
            {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: "🏠 В меню",
                                callback_data: "admin_panel",
                            },
                        ],
                    ],
                },
                parse_mode: "HTML",
            }
        );
        session.adminStep = undefined;
        session.cityId = null;
        return true;
    }

    const createdProduct = await Product.create({
        name,
        city_id: session.cityId,
        rub_price: rubPrice,
        btc_price: btcPrice,
        data,
        status: "available",
    });

    await ctx.reply(
        `<b>✅ Товар успешно создан: </b>\n<code>${createdProduct}</code>`,
        {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "🏠 В меню",
                            callback_data: "admin_panel",
                        },
                    ],
                ],
            },
            parse_mode: "HTML",
        }
    );
    session.adminStep = undefined;
    session.cityId = null;
    return true;
}

bot.on("message", async (ctx) => {
    try {
        // Удаление сообщения пользователя сразу
        await ctx.deleteMessage();

        const session = ctx.session;
        const text = ctx.message.text?.trim();

        if (!text) return;

        if (session.botLastMessageId) {
            await ctx.api.deleteMessage(ctx.chat.id, session.botLastMessageId);
            session.botLastMessageId = null;
        }

        if (session.adminStep === "password_input") {
            const config = await Configuration.findOne({
                admin_password: text,
            });
            if (config) {
                session.userAdminPassword = text;
                await sendAdminMenu(ctx);
            } else {
                const msg = await ctx.reply("<b>⚠️ Неверный ключ доступа</b>", {
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: "❌ Назад", callback_data: "menu" }],
                        ],
                    },
                    parse_mode: "HTML",
                });
                session.botLastMessageId = msg.message_id;
            }
            session.adminStep = undefined;
        } else if (session.adminStep?.startsWith("admin_update_")) {
            const parts = session.adminStep.split("_");
            const type = parts[2];
            const id = parts[3];

            if (type === "city" && id) {
                await City.updateOne({ _id: id }, { name: text });
                await sendSuccessfulMessage(ctx, "admin_panel");
            } else if (type === "password") {
                const config = await Configuration.findOne();
                if (config) {
                    config.admin_password = text;
                    await config.save();
                    session.userAdminPassword = text;
                    await sendSuccessfulMessage(ctx, "admin_panel");
                }
            } else if (type === "address") {
                const config = await Configuration.findOne();
                if (config) {
                    config.btc_address = text;
                    await config.save();
                    await sendSuccessfulMessage(ctx, "admin_panel");
                }
            } else if (type === "product") {
                const productId = id;
                const isSuccessful = await addOrUpdateProduct(
                    ctx,
                    text,
                    productId
                );
                if (!isSuccessful) {
                    return;
                }
            }
            session.adminStep = undefined;
        } else if (session.adminStep === "admin_create_city") {
            await City.create({ name: text });
            await sendSuccessfulMessage(ctx, "admin_panel");
            session.adminStep = undefined;
        } else if (session.adminStep === "admin_create_product") {
            await addOrUpdateProduct(ctx, text);
        } else {
            const msg = await ctx.reply(
                "<b>❓ Не понял вашей команды</b>\n\nЧтобы открыть меню, введите /start",
                { parse_mode: "HTML" }
            );
            session.botLastMessageId = msg.message_id;
        }
    } catch (error) {
        console.error("Ошибка в обработке сообщения:", error);
        await ctx.reply("⚠️ Произошла ошибка. Попробуйте позже", {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "🏠 В меню",
                            callback_data: "menu",
                        },
                    ],
                ],
            },
            parse_mode: "HTML",
        });
    }
});

// Error handler
bot.catch((err) => console.error("Ошибка в боте:", err));

bot.start();
