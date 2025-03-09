interface AdminProductsGroup {
    id: number,
    name: string,
    rub_price: string,
    btc_price: string,
    status: string,
    count: number,
    productIds: string[],
}

export default AdminProductsGroup;
