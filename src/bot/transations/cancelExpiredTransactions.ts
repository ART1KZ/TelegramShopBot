import { Transaction, Product } from "../../database/models";

// Функция, отменяющая транзакции, которые пробыли в ожидании больше чем указанное количество минут
async function cancelExpiredTransactions(minutes: number) {
    const timeout = minutes * 60 * 1000; // Максимальное время ожидания в секундах
    const cutoffTime = new Date(Date.now() - timeout); // Время 30 минут назад

    // Поиск всех ожидающий транзакций, созданных более 30 минут назад
    const expiredTransactions = await Transaction.find({
        status: "pending",
        created_at: { $lt: cutoffTime },
    });

    for (const transaction of expiredTransactions) {
        try {
            // Удаление истекшой транзакции, находящейся в ожидании
            await Transaction.deleteOne({
                _id: transaction._id,
                status: "pending",
            }),
                // Возвращение товару статуса "available"
                await Product.updateOne(
                    { _id: transaction.product_id, status: "reserved" }, // Проверка, что товар всё ещё зарезервирован
                    { status: "available", reserved_at: null }
                ),
                console.log(
                    `Отменена транзакция, находящаяся в ожидании ${transaction._id}`
                );
        } catch (error) {
            console.error(
                `Ошибка при отмене транзакции, находящейся в ожидании ${transaction._id}:\n`,
                error
            );
        }
    }
}

export default cancelExpiredTransactions;
