// Генерация максимально уникальной суммы для платежа в BTC
function generateUniqueAmount(basePrice: number): number {
    // Генерируем случайное значение от 1 до 999 (в миллионных долях BTC)
    const randomAddition = Math.floor(Math.random() * 999) + 1; // 1–999
    // Добавляем к базовой цене случайное значение в диапазоне 0.000001–0.000999 BTC
    const uniqueAddition = randomAddition * 0.000001; // 0.000001–0.000999 BTC
    return parseFloat((basePrice + uniqueAddition).toFixed(8));
}

export default generateUniqueAmount;