import { AdminProductsGroup } from "./index";

interface SessionData {
    userStartMessageId: number | null;
    cityId: string | null;
    botLastMessageId: number | null;
    lastPaymentCheck: Date | null;
    userAdminPassword: string | undefined;
    adminStep: string | undefined;
    adminProductGroups: AdminProductsGroup[] | undefined;
}

export default SessionData;
