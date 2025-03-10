import { ExtendedContext } from "../types";
import { City, Product } from "../../database/models";
import mongoose from "mongoose";
import { InlineKeyboard } from "grammy";
import { AdminProductsGroup } from "./../types";

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

export default handleAdminOption;
