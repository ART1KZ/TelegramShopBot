import { manageExpiredTransactions } from "./index";
import cron from "node-cron";

/**
 * Каждые 5 минут запускает функцию управления истекшими транзакциями
 */
function scheduleTransactionsCleanup(minutes: number) {
    // Проверка транзакций каждые 5 минут
    cron.schedule("*/5 * * * *", async () => {
        try {
            await manageExpiredTransactions(minutes);
        } catch (error) {
            console.error("Ошибка в cron:", error);
        }
    });
}

export default scheduleTransactionsCleanup;
