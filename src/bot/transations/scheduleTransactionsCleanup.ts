import { cancelExpiredTransactions } from "./index";
import cron from "node-cron";

// Удаление истекших транзакций
function scheduleTransactionsCleanup() {
    // Проверка транзакций каждые 5 минут
    cron.schedule("*/5 * * * *", async () => {
        try {
            // Отмена транзакций, находящихся в ожидании более 30 минут
            await cancelExpiredTransactions(30);
        } catch (error) {
            console.error("Ошибка в cron:", error);
        }
    });
}

export default scheduleTransactionsCleanup;
