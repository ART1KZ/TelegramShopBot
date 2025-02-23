import mongoose from "mongoose";
import { Transaction, Product } from "../../database/models";

// Функция, отменяющая транзакции, которые пробыли в ожидании больше чем переданное количество минут
async function cancelExpiredTransactions(minutes: number) {
    const timeout = minutes * 60 * 1000; // Максимальное время ожидания в секундах
    const cutoffTime = new Date(Date.now() - timeout); // Время 30 минут назад

    // Поиск всех ожидающий транзакций, созданных более 30 минут назад
    const expiredTransactions = await Transaction.find({
        status: "pending",
        created_at: { $lt: cutoffTime }, // $lt = меньше, чем
    });

    // Отмена каждой истекшой транзакции
    for (const transaction of expiredTransactions) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Обновляем транзакцию на "canceled"
            await Transaction.updateOne(
                { _id: transaction._id, status: "pending" }, // Проверяем, что статус не изменился
                { status: "canceled" }
            ).session(session);

            // Возвращаем товар в "available"
            await Product.updateOne(
                { _id: transaction.product_id, status: "reserved" }, // Проверяем, что товар всё ещё зарезервирован
                { status: "available", reserved_at: null }
            ).session(session);

            await session.commitTransaction();
            console.log(`Отменена транзакция ${transaction._id}`);
        } catch (error) {
            await session.abortTransaction();
            console.error(
                `Ошибка при отмене транзакции ${transaction._id}:`,
                error
            );
        } finally {
            session.endSession();
        }
    }

    if (expiredTransactions.length > 0) {
        console.log(
            `Отменено ${expiredTransactions.length} просроченных транзакций`
        );
    }
}

export default cancelExpiredTransactions;
