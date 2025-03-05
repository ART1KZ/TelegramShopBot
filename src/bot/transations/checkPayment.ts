import axios from "axios";

// Функция проверки платежа в блокчейне по сумме
async function checkPayment(
    payableBtcAddress: string,
    btcAmount: number
): Promise<{ paid: boolean; tx_hash?: string }> {
    try {
        const response = await axios.get(
            `https://api.blockcypher.com/v1/btc/main/addrs/${payableBtcAddress}`
        );
        const data = response.data;

        // Получаем список транзакций
        const transactions = data.txrefs || [];

        for (const tx of transactions) {
            // Сумма в BlockCypher в сатоши (1 BTC = 10^8 сатоши)
            const txAmount = tx.value / 100000000;
            console.log(txAmount);
            // Проверяем сумму и подтверждения
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

export default checkPayment;
