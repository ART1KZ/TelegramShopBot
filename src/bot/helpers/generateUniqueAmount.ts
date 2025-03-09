import mongoose from "mongoose";
import Decimal from "decimal.js";

Decimal.set({ precision: 8 });

function generateUniqueAmount(basePrice: mongoose.Types.Decimal128): mongoose.Types.Decimal128 {
    const basePriceDecimal = new Decimal(basePrice.toString());
    
    // Генерация случайной добавки к цене и превращение в Decimal
    const randomAddition = Math.floor(Math.random() * 999) + 1; // 1-999
    const uniqueAddition = new Decimal(randomAddition).mul("0.00000001"); // 0.00000001 - 0.00000999
    
    // Вычисление результата с точностью до 8 знаков
    const resultDecimal = basePriceDecimal.add(uniqueAddition);
    
    return mongoose.Types.Decimal128.fromString(resultDecimal.toFixed(8));
}

export default generateUniqueAmount;