// Генерация уникальной суммы для платежа в BTC
function generateUniqueAmount(basePrice: number): number {
    const randomCents = Math.floor(Math.random() * 90) + 10;
    return parseFloat((basePrice + randomCents / 100).toFixed(8));
}

export default generateUniqueAmount;
