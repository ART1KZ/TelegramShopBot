import { ExtendedContext } from "../types";
import { City, Product } from "../../database/models";
import { sendSuccessfulMessage } from "../messages";

async function deleteAdminItem(ctx: ExtendedContext, data: string) {
    const parts = data.split("_");
    const type = parts[2];
    const id = parts[3];

    if (type === "city") {
        await City.deleteOne({ _id: id });
        await Product.deleteMany({ city_id: id, status: "available" });
        await sendSuccessfulMessage(ctx, "admin_panel", "edit");
    } else if (type === "product") {
        await Product.deleteOne({ _id: id });
        await sendSuccessfulMessage(ctx, "admin_panel", "edit");
    }
}

export default deleteAdminItem;
