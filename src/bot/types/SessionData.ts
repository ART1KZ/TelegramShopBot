import { AdminProductsGroup } from "./index";

interface SessionData {
    step: string;
    cityId: string | null;
    productId: string | null;
    botLastMessageId: number | null;
    botOrderMessageId: number | null;
    userAdminPassword: string | undefined;
    adminStep: string | undefined;
    adminProductGroups: AdminProductsGroup[] | undefined;
}

export default SessionData;
