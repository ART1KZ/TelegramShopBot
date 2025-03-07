interface SessionData {
    step: string;
    cityId: string | null;
    productId: string | null;
    botLastMessageId: number | null;
    botOrderMessageId: number | null;
    userAdminPassword: string | undefined;
    adminStep: string | undefined;
    tempProduct: { name?: string; price?: number; cityId?: string } | null;
}

export default SessionData;
