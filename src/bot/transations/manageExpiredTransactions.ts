import { Transaction } from "../../database/models";
import cancelTransactionAndProduct from "./cancelTransactionAndProduct";

/**
 * Функция, отменяющая транзакции, которые пробыли в ожидании больше чем указанное количество минут,
 * а также восстанавливающая зарезервированные лоты
 */
async function manageExpiredTransactions(minutes: number) {
    const timeout = minutes * 60 * 1000; // Максимальное время ожидания в секундах
    const cutoffTime = new Date(Date.now() - timeout); // Время 30 минут назад

    // Поиск всех ожидающий транзакций, созданных более 30 минут назад
    const expiredTransactions = await Transaction.find({
        status: "pending",
        created_at: { $lt: cutoffTime },
    });

    for (const transaction of expiredTransactions) {
        try {
            await cancelTransactionAndProduct(
                transaction._id,
                transaction.product_id
            ).then(() =>
                console.log(
                    `Отменена транзакция, находящаяся в ожидании ${transaction._id}`
                )
            );
        } catch (error) {
            console.error(
                `Ошибка при отмене транзакции, находящейся в ожидании ${transaction._id}:\n`,
                error
            );
        }
    }
}

export default manageExpiredTransactions;
