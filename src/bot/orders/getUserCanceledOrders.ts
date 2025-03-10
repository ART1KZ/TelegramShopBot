import { Order } from "../../database/models";

/**
 * Возвращает отменённые транзакции пользователя за последнее (переданное) количество минут.
 *
 * @param {number} tgUserId - Telegram ID пользователя.
 * @param {number} minutes - Количество минут, за которые нужно получить транзакции (должно быть положительным).
 * @returns Массив отменённых транзакций за указанный период.
 */
async function getUserCanceledOrders(tgUserId: number, minutes: number) {
    const timeIntervalMs = 1000 * 60 * minutes;
    const cutoffTime = new Date(Date.now() - timeIntervalMs);

    return await Order.find({
        created_at: { $gt: cutoffTime },
        customer_tg_id: tgUserId,
        status: "canceled",
    });
}

export default getUserCanceledOrders;
