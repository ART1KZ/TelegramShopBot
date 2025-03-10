import axios from "axios";

/**
 * Проверяет, была ли оплата на указанный BTC-адрес в нужной сумме за определённый период
 *
 * @param payableBtcAddress - Bitcoin-адрес для проверки
 * @param btcAmount - Ожидаемая сумма в BTC (в виде числа)
 * @param orderCreatedAt - Время создания заказа (для фильтрации старых транзакций)
 * @param timeWindowHours - Временное окно в часах для проверки (по умолчанию 24 часа)
 * @returns Объект с результатом проверки и хэшем транзакции (если оплата найдена)
 */
async function checkPaymentApi(
    payableBtcAddress: string,
    btcAmount: number,
    orderCreatedAt: Date,
    timeWindowHours: number = 24
): Promise<{ paid: boolean; tx_hash?: string }> {
    try {
        const response = await axios.get(
            `https://api.blockcypher.com/v1/btc/main/addrs/${payableBtcAddress}?token=${process.env.BLOCKCYPHER_API_TOKEN}`
        );
        const data = response.data;

        const orders = data.txrefs || [];
        if (!Array.isArray(orders)) {
            console.warn("BlockCypher вернул некорректные данные:", data);
            return { paid: false };
        }

        // Минимальное время для проверки (created_at минус timeWindowHours)
        const minTime = new Date(orderCreatedAt);
        minTime.setHours(minTime.getHours() - timeWindowHours);

        for (const tx of orders) {
            // Сумма в сатоши → BTC
            const txAmount = tx.value / 100000000;

            // Время подтверждения транзакции
            const txConfirmed = new Date(tx.confirmed);

            // Проверка, попадает ли транзакция в временное окно
            if (txConfirmed < minTime) {
                continue; // Пропуск транзакций старше временного окна
            }

            // Проверка сумму и подтверждения
            if (
                Math.abs(txAmount - btcAmount) < 0.00000001 && // Точность до 8 знаков
                tx.confirmations >= 1 // Минимум 1 подтверждение
            ) {
                return { paid: true, tx_hash: tx.tx_hash };
            }
        }

        return { paid: false };
    } catch (error) {
        console.error("Ошибка проверки оплаты через BlockCypher:", error);
        return { paid: false };
    }
}

export default checkPaymentApi;
