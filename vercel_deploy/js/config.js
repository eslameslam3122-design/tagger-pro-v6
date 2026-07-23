// TAGGER PRO V6 - Configuration & Constants
// ============================================================
// TAGGER PRO V6 - Supabase Edition
// جميع التعاملات مع Supabase بدلاً من localStorage
// ============================================================

// ====== كشف بيئة التشغيل ======
const isCapacitorApp = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());

// ====== إعدادات Supabase ======
const SUPABASE_URL = "https://kxavxmgjqximpuouzejr.supabase.co";
const SUPABASE_KEY = "sb_publishable_wU-5h54z8dnIrASa3h4t8g_ZXo0fYnk"; // مفتاح Supabase العام — يبدأ بـ eyJ
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ====== الحصول على store_id من الجلسة ======
const storeId = localStorage.getItem('active_store_id');
if (!storeId && !isCapacitorApp) {
    window.location.href = "index.html";
}
const currentStoreId = storeId || '';

// ====== الحصول على دور المستخدم ======
const userRole = localStorage.getItem('active_staff_role') || 'cashier';
const isSuperAdmin = localStorage.getItem('is_super_admin') === 'true';

// ====== المتغيرات العامة ======
const PAYMENT_LABELS = {
    'cash': '💵 كاش',
    'vodafone': '📱 فودافون كاش',
    'instapay': '🏦 إنستا باي',
    'qrcode': '📲 QR Code',
    'bank': '🏛️ تحويل بنكي',
    'later': '📝 آجل'
};
