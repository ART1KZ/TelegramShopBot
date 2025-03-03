interface SessionData {
    step: string;
    cityId: string | null;
    categoryId: string | null;
    productId: string | null;
    isAdmin?: boolean;
    adminStep?: string; 
    tempProduct?: { name?: string; price?: number; cityId?: string };
}

export default SessionData;
