import { Order } from "../../database/models";
import cancelOrderAndProduct from "./cancelOrderAndProduct";

/**
 * Функция, отменяющая транзакции, которые пробыли в ожидании больше чем указанное количество минут,
 * а также восстанавливающая зарезервированные лоты
 */
async function manageExpiredOrders(minutes: number) {
    const timeout = minutes * 60 * 1000; // Максимальное время ожидания в секундах
    const cutoffTime = new Date(Date.now() - timeout); // Время (minutes) минут назад

    // Поиск всех ожидающий транзакций, созданных более (minutes) минут назад
    const expiredOrders = await Order.find({
        status: "pending",
        created_at: { $lt: cutoffTime },
    });

    for (const order of expiredOrders) {
        try {
            await cancelOrderAndProduct(
                order._id,
                order.product_id
            ).then(() =>
                console.log(
                    `Отменена транзакция, находящаяся в ожидании ${order._id}`
                )
            );
        } catch (error) {
            console.error(
                `Ошибка при отмене транзакции, находящейся в ожидании ${order._id}:\n`,
                error
            );
        }
    }
}

export default manageExpiredOrders;
