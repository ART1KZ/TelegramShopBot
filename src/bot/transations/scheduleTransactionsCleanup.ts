import { manageExpiredTransactions } from "./index";
import cron from "node-cron";

/**
 * Каждые 5 минут запускает функцию управления истекшими транзакциями
 */
function scheduleTransactionsCleanup() {
    // Проверка транзакций каждые 5 минут
    cron.schedule("*/5 * * * *", async () => {
        try {
            await manageExpiredTransactions(30);
        } catch (error) {
            console.error("Ошибка в cron:", error);
        }
    });
}

export default scheduleTransactionsCleanup;
