import { ExtendedContext } from "../types";
import { Order } from "../../database/models";
import { showOrders } from "./index";

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

    // удаление всех отменённых заказов старше 1 часа
    await Order.deleteMany({
        customer_tg_id: userId,
        status: "canceled",
        created_at: { $lt: oneHourAgo },
    });

    await showOrders(ctx);
}

export default deleteCanceledOrders;
