import { Bot, InlineKeyboard, session } from "grammy";
import { City, Product, Order, Configuration } from "../database/models";
import connectToDatabase from "../database/index";
import { selectProduct, purchaseProduct } from "./products";
import { AdminProductsGroup, ExtendedContext, SessionData } from "./types";
import { sendMainMenu, sendAdminMenu } from "./messages";
import {
    cancelOrderAndProduct,
    scheduleOrdersCleanup,
    sendInvoicePayable,
    checkPaymentApi,
} from "./orders";
import { showCities, selectCity } from "./cities";
import mongoose from "mongoose";
import sendSuccessfulMessage from "./messages/sendSuccessfulMessage";

if (!process.env.TG_BOT_TOKEN) {
    throw new Error("Telegram bot token not found");
}

const bot = new Bot<ExtendedContext>(process.env.TG_BOT_TOKEN);

scheduleOrdersCleanup(120);

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
        await createConfigurationIfNotExist();
    } catch (e) {
        console.error(
            "Не удалось инициализировать начальные записи в базе данных",
            e
        );
    }
}

addRecords();

bot.use(
    session({
        initial: (): SessionData => ({
            userStartMessageId: null,
            cityId: null,
            botLastMessageId: null,
            lastPaymentCheck: null,
            userAdminPassword: undefined,
            adminStep: undefined,
            adminProductGroups: undefined,
        }),
    })
);

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
            case data.startsWith("confirm_cancel_"):
                await confirmCancel(ctx, data);
                break;
            case data.startsWith("cancel_"):
                await cancelOrder(ctx, data);
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
            case data === "admin_orders":
                await showOrders(ctx, true);
                break;
            default:
                await ctx.answerCallbackQuery("Неизвестная команда");
        }
    } catch (error) {
        console.error("Ошибка в callback:", error);
        await ctx.answerCallbackQuery("Произошла ошибка. Попробуйте позже.");
    }
});

async function confirmCancel(ctx: ExtendedContext, data: string) {
    const orderId = data.split("_")[2];
    await ctx.editMessageText(
        "<b>❓ Вы уверены, что хотите отменить заказ?\n</b>" +
            "<b>⚠️ Не отменяйте заказ, если уже перевели деньги</b>",
        {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "✅ Отменить заказ",
                            callback_data: `cancel_${orderId}`,
                        },
                        {
                            text: "❌ Понюхать бебру",
                            callback_data: `order_${orderId}`,
                        },
                    ],
                ],
            },
            parse_mode: "HTML",
        }
    );
}

async function cancelOrder(ctx: ExtendedContext, data: string) {
    const orderId = data.split("_")[1];
    const order = await Order.findOne({
        _id: orderId,
        status: "pending",
    });

    if (!order) {
        await sendMainMenu(ctx, "edit");
        return;
    }

    await cancelOrderAndProduct(
        new mongoose.Types.ObjectId(orderId),
        new mongoose.Types.ObjectId(order.product_id)
    );
    await sendMainMenu(ctx, "edit");
}

async function checkPayment(ctx: ExtendedContext, data: string) {
    const lastPaymentCheck = ctx.session.lastPaymentCheck;
    const currentTime = Date.now();
    const minuteInMs = 1000 * 60;

    if (
        lastPaymentCheck &&
        lastPaymentCheck.getTime() + minuteInMs > currentTime
    ) {
        const allowedTimeToCheck = lastPaymentCheck.getTime() + minuteInMs;
        const secondsLeftToCheck = Math.floor(
            (allowedTimeToCheck - currentTime) / 1000
        );
        await ctx.answerCallbackQuery(`Подождите ${secondsLeftToCheck} секунд`);
        return;
    }

    const orderId = data.split("_")[1];
    const order = await Order.findOne({
        _id: orderId,
        status: "pending",
    });

    if (!order) {
        await ctx.answerCallbackQuery("Не удалось проверить оплату");
        return;
    }

    const config = await Configuration.findOne();
    if (!config?.btc_address) {
        await ctx.answerCallbackQuery("Адрес оплаты не настроен");
        return;
    }

    const btcAmount = parseFloat(order.btc_amount.toString());
    const paymentResult = await checkPaymentApi(
        config.btc_address,
        btcAmount,
        order.created_at,
        24 // проверка транзакций за последние 24 часа
    );
    ctx.session.lastPaymentCheck = new Date();

    if (paymentResult.paid) {
        order.status = "completed";
        order.tx_hash = paymentResult.tx_hash; // сохранение хеша транзакции
        await order.save();

        const product = await Product.findById(order.product_id);
        if (product) {
            product.status = "sold";
            product.sold_at = new Date();
            await product.save();

            await ctx.editMessageText(
                `<b>🎉 Спасибо за покупку!</b>\n` +
                    `<b>🆔 Заказ №:</b> <code>${order._id}</code>\n` +
                    `<b>💎 Ваш товар:</b> <code>${product.data}</code>\n` +
                    `<b>🔗 Хэш транзакции:</b> <code>${paymentResult.tx_hash}</code>`,
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

async function showOrders(ctx: ExtendedContext, admin: boolean = false) {
    if (admin) {
        ctx.session.adminStep = "admin_find_order";
        await ctx.editMessageText(
            "<b>🔎 Введите № заказа</b>\n" +
                "✅ Пример: <code>67cdc2bfd4c99c56fcd3f2f4</code>",
            {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "❌ Назад", callback_data: "admin_panel" }],
                    ],
                },
                parse_mode: "HTML",
            }
        );
        return;
    }

    if (!ctx.from || !ctx.from.id) {
        await ctx.answerCallbackQuery("Не удалось определить пользователя");
        return;
    }

    const orders = await Order.find({
        customer_tg_id: ctx.from.id,
        status: { $in: ["completed", "pending", "canceled"] },
    });

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
    const orderId = data.split("_")[1];
    const order = await Order.findById(orderId);
    const product = order ? await Product.findById(order.product_id) : null;
    const config = await Configuration.findOne();

    if (!order || !product || !config?.btc_address) {
        await ctx.answerCallbackQuery("Заказ не найден");
        return;
    }

    if (product.status === "sold") {
        await ctx.editMessageText(
            `<b>🆔 Заказ №:</b> <code>${order._id}</code>\n` +
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
        await sendInvoicePayable(ctx, order, product, config.btc_address);
    } else {
        await ctx.editMessageText(
            `<b>🆔 Заказ №:</b> <code>${order._id}</code>\n` +
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

    const now = new Date(); // текущее время
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000); // время час назад

    // проверка, есть ли отменённые заказы старше 1 часа
    const hasCanceledOrders = await Order.findOne({
        customer_tg_id: userId,
        status: "canceled",
        created_at: { $lt: oneHourAgo }, // заказы, созданные раньше, чем 1 час назад
    });

    if (!hasCanceledOrders) {
        await ctx.answerCallbackQuery(
            "У вас нет отменённых заказов старше часа"
        );
        return;
    }

    // удаляем все отменённые заказы старше 1 часа
    await Order.deleteMany({
        customer_tg_id: userId,
        status: "canceled",
        created_at: { $lt: oneHourAgo },
    });

    await showOrders(ctx);
}

async function showAdminPanel(ctx: ExtendedContext) {
    const config = await Configuration.findOne({
        admin_password: ctx.session.userAdminPassword,
    });
    if (!config || !ctx.session.userAdminPassword) {
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
                )
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
            (await Order.find({ status: "pending" }).countDocuments()) > 0;
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
    productId: string = "",
    groupId: string = ""
) {
    const session = ctx.session;
    const messageParts = userMessage.split(",").map((part) => part.trim());
    const backButtonCallbackData =
        productId && groupId
            ? `admin_option_product_${productId}_${groupId}`
            : `admin_option_productCities_${session.cityId}`;

    if (messageParts.length !== 4) {
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
                                callback_data: backButtonCallbackData,
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
                                callback_data: backButtonCallbackData,
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

    try {
        if (productId) {
            const updateResult = await Product.updateOne(
                { _id: productId },
                {
                    name,
                    rub_price: mongoose.Types.Decimal128.fromString(rubPrice),
                    btc_price: mongoose.Types.Decimal128.fromString(btcPrice),
                    data,
                }
            );
            if (updateResult.matchedCount === 0) {
                await ctx.reply("<b>⚠️ Товар не найден</b>", {
                    parse_mode: "HTML",
                });
                return false;
            }
            const updatedProduct = await Product.findById(productId);
            const sendedMessageId = await ctx
                .reply(
                    `<b>✅ Товар успешно изменён:</b>\n` +
                        `<code>${
                            updatedProduct?.name
                        }, ${updatedProduct?.rub_price.toString()}, ${updatedProduct?.btc_price.toString()}, ${
                            updatedProduct?.data
                        }</code>`,
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
                )
                .then((message) => message.message_id);
            session.botLastMessageId = sendedMessageId;
        } else {
            const createdProduct = await Product.create({
                name,
                city_id: session.cityId,
                rub_price: mongoose.Types.Decimal128.fromString(rubPrice),
                btc_price: mongoose.Types.Decimal128.fromString(btcPrice),
                data,
                status: "available",
            });
            const sendedMessageId = await ctx
                .reply(
                    `<b>✅ Товар успешно создан:</b>\n` +
                        `<code>${
                            createdProduct.name
                        }, ${createdProduct.rub_price.toString()}, ${createdProduct.btc_price.toString()}, ${
                            createdProduct.data
                        }</code>`,
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
                )
                .then((message) => message.message_id);
            session.botLastMessageId = sendedMessageId;
        }
        session.adminStep = undefined;
        session.cityId = null;
        return true;
    } catch (error) {
        console.error("Ошибка при создании/обновлении товара:", error);
        await ctx.reply(
            "<b>⚠️ Ошибка при обработке товара. Попробуйте позже.</b>",
            {
                parse_mode: "HTML",
            }
        );
        return false;
    }
}

bot.on("message", async (ctx) => {
    try {
        try {
            await ctx.deleteMessage();
        } catch (e) {
            console.warn("Не удалось удалить сообщение пользователя:", e);
        }

        const session = ctx.session;
        const text = ctx.message.text?.trim();

        if (!text) return;

        // Удаление предыдущего сообщения бота, если оно есть
        if (session.botLastMessageId) {
            try {
                await ctx.api.deleteMessage(
                    ctx.chat.id,
                    session.botLastMessageId
                );
                session.botLastMessageId = null;
            } catch (e) {
                console.warn(
                    "Не удалось удалить предыдущее сообщение бота:",
                    e
                );
            }
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
                const groupId = parts[4];
                const isSuccessful = await addOrUpdateProduct(
                    ctx,
                    text,
                    productId,
                    groupId
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
        } else if (session.adminStep === "admin_find_order") {
            // Проверка, является ли текст валидным ObjectId
            if (!mongoose.Types.ObjectId.isValid(text)) {
                const msg = await ctx.reply(
                    "<b>⚠️ Неверный формат ID заказа</b>\n" +
                        "Введите корректный ID, например: <code>67cdc2bfd4c99c56fcd3f2f4</code>",
                    {
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    {
                                        text: "❌ Назад",
                                        callback_data: "admin_panel",
                                    },
                                ],
                            ],
                        },
                        parse_mode: "HTML",
                    }
                );
                session.botLastMessageId = msg.message_id;
                return;
            }

            const order = await Order.findById(text).populate("product_id");
            session.adminStep = undefined;

            if (!order) {
                const msg = await ctx.reply("<b>🚫 Заказ не найден</b>", {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: "❌ Назад",
                                    callback_data: "admin_orders",
                                },
                            ],
                        ],
                    },
                    parse_mode: "HTML",
                });
                session.botLastMessageId = msg.message_id;
                return;
            }

            const product = order.product_id as any;
            const city = await City.findById(product?.city_id);
            const statusText =
                order.status === "pending"
                    ? "🔄 Ожидает оплаты"
                    : order.status === "completed"
                    ? "✅ Завершён"
                    : "🚫 Отменён";

            const msg = await ctx.reply(
                `<b>🆔 Номер заказа:</b> <code>${order._id}</code>\n` +
                    `<b>👤 ID клиента:</b> <code>${order.customer_tg_id}</code>\n` +
                    `<b>📦 Товар:</b> ${product?.name || "Не найден"}\n` +
                    `<b>🌆 Город:</b> ${city?.name || "Не указан"}\n` +
                    `<b>₿ Сумма в BTC:</b> ${order.btc_amount}\n` +
                    `<b>⚡ Статус:</b> ${statusText}\n` +
                    `<b>📅 Создан:</b> ${new Date(
                        order.created_at
                    ).toLocaleString()}\n` +
                    `<b>🔗 Хэш транзакции:</b> ${
                        order.tx_hash
                            ? `<code>${order.tx_hash}</code>`
                            : "Не указан"
                    }\n` +
                    `<b>💎 Данные товара:</b> ${
                        product?.data
                            ? `<code>${product.data}</code>`
                            : "Не доступны"
                    }`,
                {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: "❌ Назад",
                                    callback_data: "admin_orders",
                                },
                            ],
                        ],
                    },
                    parse_mode: "HTML",
                }
            );
            session.botLastMessageId = msg.message_id;
        } else {
            const msg = await ctx.reply(
                "<b>❓ Не понял вашей команды</b>\n\nЧтобы открыть меню, введите /start",
                { parse_mode: "HTML" }
            );
            session.botLastMessageId = msg.message_id;
        }
    } catch (error) {
        console.error("Ошибка в обработке сообщения:", error);
        const msg = await ctx.reply("⚠️ Произошла ошибка. Попробуйте позже", {
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
        ctx.session.botLastMessageId = msg.message_id;
    }
});

bot.catch((err) => console.error("Ошибка в боте:", err));

bot.start();
