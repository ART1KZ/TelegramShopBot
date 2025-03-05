import { Transaction } from "../../database/models";

/**
 * Возвращает отменённые транзакции пользователя за последние указанные минуты.
 *
 * @param {number} tgUserId - Telegram ID пользователя.
 * @param {number} minutes - Количество минут, за которые нужно получить транзакции (должно быть положительным).
 * @returns Массив отменённых транзакций за указанный период.
 */
async function getUserCanceledTransactions(tgUserId: number, minutes: number) {
    const timeIntervalMs = 1000 * 60 * minutes;
    const cutoffTime = new Date(Date.now() - timeIntervalMs);

    return await Transaction.find({
        created_at: { $gt: cutoffTime },
        customer_tg_id: tgUserId,
        status: "canceled",
    });
}

export default getUserCanceledTransactions;
