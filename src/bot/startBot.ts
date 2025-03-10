import { Bot, session } from "grammy";
import { City, Order, Configuration } from "../database/models";
import connectToDatabase from "../database/connectToDatabase";
import { selectProduct, purchaseProduct } from "./products";
import { ExtendedContext, SessionData } from "./types";
import { sendMainMenu } from "./messages";
import {
    checkPayment,
    scheduleOrdersCleanup,
    selectOrder,
    cancelOrder,
    confirmCancelOrder,
    showOrders,
    deleteCanceledOrders,
} from "./orders";
import {
    showAdminPanel,
    showAdminConfig,
    handleAdminOption,
    deleteAdminItem,
    showAdminCities,
    updateAdminItem,
    createAdminCity,
    showAdminProducts,
    createAdminProduct,
    sendAdminMenu,
    addOrUpdateProduct,
} from "./admin";
import { showCities, selectCity } from "./cities";
import mongoose from "mongoose";
import sendSuccessfulMessage from "./messages/sendSuccessfulMessage";

async function startBot() {
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
                btc_address: "bc1qsjux6cmmupvgusl53j07j9lxdz80ksujgycp5y",
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
        if (
            callbackData?.startsWith("admin_") &&
            callbackData !== "admin_panel"
        ) {
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
                    await confirmCancelOrder(ctx, data);
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
            await ctx.answerCallbackQuery(
                "Произошла ошибка. Попробуйте позже."
            );
        }
    });

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
                    const msg = await ctx.reply(
                        "<b>⚠️ Неверный ключ доступа</b>",
                        {
                            reply_markup: {
                                inline_keyboard: [
                                    [
                                        {
                                            text: "❌ Назад",
                                            callback_data: "menu",
                                        },
                                    ],
                                ],
                            },
                            parse_mode: "HTML",
                        }
                    );
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
            const msg = await ctx.reply(
                "⚠️ Произошла ошибка. Попробуйте позже",
                {
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
                }
            );
            ctx.session.botLastMessageId = msg.message_id;
        }
    });

    bot.catch((err) => console.error("Ошибка в боте:", err));

    bot.start();
}

export default startBot;
