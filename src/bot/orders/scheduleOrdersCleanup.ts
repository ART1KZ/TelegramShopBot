import { manageExpiredOrders } from "./index";
import cron from "node-cron";

/**
 * Каждые 5 минут запускает функцию управления истекшими транзакциями
 */
function scheduleOrdersCleanup(minutes: number) {
    // Проверка транзакций каждые 5 минут
    cron.schedule("*/5 * * * *", async () => {
        try {
            await manageExpiredOrders(minutes);
        } catch (error) {
            console.error("Ошибка в cron:", error);
        }
    });
}

export default scheduleOrdersCleanup;
