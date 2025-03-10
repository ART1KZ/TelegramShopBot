import { Product } from "../../database/models";
import mongoose from "mongoose";

async function getUniqueProducts(cityId: string) {
    return await Product.aggregate([
        {
            $match: {
                city_id: new mongoose.Types.ObjectId(cityId),
                status: "available",
            },
        },
        {
            $group: {
                _id: { name: "$name", price: "$rub_price" },
            },
        },
        {
            $project: {
                name: "$_id.name",
                rub_price: "$_id.price",
                _id: 0,
            },
        },
    ]);
}

export default getUniqueProducts;
