interface SessionData {
    step: string;
    cityId: string | null;
    productId: string | null;
    botLastMessageId: number | null;
    isAdmin: boolean | null;
    adminStep: string | null;
    tempProduct: { name?: string; price?: number; cityId?: string } | null;
}

export default SessionData;
