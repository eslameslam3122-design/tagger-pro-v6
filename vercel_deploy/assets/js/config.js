// ============================================================
// CONFIGURATION - الثوابت والإعدادات العامة
// ============================================================

// Supabase
export const SUPABASE_URL = "https://kxavxmgjqximpuouzejr.supabase.co";
export const SUPABASE_KEY = "sb_publishable_wU-5h54z8dnIrASa3h4t8g_ZXo0fYnk";

// إعدادات التطبيق
export const APP_CONFIG = {
    storeName: 'TAGGER PRO V2',
    currency: 'ج.م',
    lowStockAlert: 5,
    maxTopProducts: 5,
    daysForTopProducts: 30
};

// المتغيرات العامة (سيتم تعيينها أثناء التشغيل)
export let STATE = {
    currentStoreId: null,
    allProducts: [],
    allCustomers: [],
    cart: [],
    userRole: 'admin',
    staffName: 'المدير العام',
    heldInvoice: null,
    lastPrintedInvoiceData: null,
    sessionInvoicesCounter: 0,
    dailyItemsSoldCount: 0,
    weeklySalesChart: null,
    lastAddedProductId: null,
    lastAddedTimeout: null
};

// دالة لتحديث الـ State
export function updateState(newState) {
    Object.assign(STATE, newState);
}