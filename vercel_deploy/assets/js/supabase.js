// ============================================================
// SUPABASE - دوال الاتصال بقاعدة البيانات
// ============================================================

import { SUPABASE_URL, SUPABASE_KEY, STATE } from './config.js';

// إنشاء عميل Supabase
export const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ============================================================
// دوال جلب البيانات
// ============================================================

// جلب معلومات المتجر
export async function loadStoreDetails() {
    const { data } = await supabase
        .from('stores')
        .select('store_name')
        .eq('id', STATE.currentStoreId)
        .single();
    return data;
}

// جلب جميع المنتجات
export async function loadProducts() {
    const { data } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', STATE.currentStoreId);
    return data || [];
}

// جلب جميع العملاء
export async function loadCustomers() {
    const { data } = await supabase
        .from('customers')
        .select('*')
        .eq('store_id', STATE.currentStoreId);
    return data || [];
}

// جلب المعاملات المالية
export async function loadTransactions() {
    const { data } = await supabase
        .from('transactions')
        .select('amount, created_at')
        .eq('store_id', STATE.currentStoreId);
    return data || [];
}

// جلب الفواتير
export async function loadInvoices(filters = {}) {
    let query = supabase
        .from('invoices')
        .select('*')
        .eq('store_id', STATE.currentStoreId);
    
    if (filters.fromDate) {
        query = query.gte('created_at', filters.fromDate);
    }
    if (filters.toDate) {
        query = query.lte('created_at', filters.toDate);
    }
    if (filters.paymentType) {
        query = query.eq('payment_type', filters.paymentType);
    }
    
    const { data } = await query;
    return data || [];
}

// جلب عناصر الفواتير
export async function loadInvoiceItems(invoiceIds) {
    const { data } = await supabase
        .from('invoice_items')
        .select('product_id, quantity')
        .in('invoice_id', invoiceIds);
    return data || [];
}

// ============================================================
// دوال الإدراج والتحديث
// ============================================================

// إضافة منتج جديد
export async function insertProduct(productData) {
    const { data, error } = await supabase
        .from('products')
        .insert([{
            ...productData,
            store_id: STATE.currentStoreId,
            updated_at: new Date().toISOString()
        }])
        .select()
        .single();
    if (error) throw error;
    return data;
}

// تحديث منتج
export async function updateProduct(id, productData) {
    const { data, error } = await supabase
        .from('products')
        .update({
            ...productData,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('store_id', STATE.currentStoreId)
        .select()
        .single();
    if (error) throw error;
    return data;
}

// إضافة عميل جديد
export async function insertCustomer(customerData) {
    const { data, error } = await supabase
        .from('customers')
        .insert([{
            ...customerData,
            store_id: STATE.currentStoreId,
            total_debt: 0
        }])
        .select()
        .single();
    if (error) throw error;
    return data;
}

// تحديث دين العميل
export async function updateCustomerDebt(id, newDebt) {
    const { error } = await supabase
        .from('customers')
        .update({ total_debt: newDebt })
        .eq('id', id);
    if (error) throw error;
}

// إنشاء فاتورة جديدة
export async function insertInvoice(invoiceData) {
    const { data, error } = await supabase
        .from('invoices')
        .insert([{
            ...invoiceData,
            store_id: STATE.currentStoreId
        }])
        .select()
        .single();
    if (error) throw error;
    return data;
}

// إضافة عناصر الفاتورة
export async function insertInvoiceItems(items) {
    const { error } = await supabase
        .from('invoice_items')
        .insert(items);
    if (error) throw error;
}

// إضافة معاملة مالية
export async function insertTransaction(transactionData) {
    const { error } = await supabase
        .from('transactions')
        .insert([{
            ...transactionData,
            store_id: STATE.currentStoreId
        }]);
    if (error) throw error;
}

// تحديث مخزون المنتج
export async function updateProductStock(id, newStock) {
    const { error } = await supabase
        .from('products')
        .update({ 
            stock: newStock,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('store_id', STATE.currentStoreId);
    if (error) throw error;
}

// ============================================================
// دوال المصادقة
// ============================================================

// تسجيل الدخول
export async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });
    if (error) throw error;
    return data;
}

// التحقق من الجلسة
export async function getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
}

// تسجيل الخروج
export async function signOut() {
    await supabase.auth.signOut();
}

// التحقق من صلاحيات المستخدم
export async function verifyStaff(username, password, storeId) {
    const { data, error } = await supabase
        .from('staff_profiles')
        .select('*')
        .eq('store_id', storeId)
        .eq('username', username)
        .eq('password', password)
        .single();
    if (error) throw error;
    return data;
}