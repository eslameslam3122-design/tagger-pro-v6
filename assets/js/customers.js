// ============================================================
// CUSTOMERS - دوال إدارة العملاء
// ============================================================

import { STATE, updateState } from './config.js';
import { 
    loadCustomers as loadCustomersFromDB,
    insertCustomer as insertCustomerDB,
    updateCustomerDebt,
    insertTransaction
} from './supabase.js';
import { showToast, showModal, hideModal, getValue, setValue } from './utils.js';
import { updateDashboardStats } from './dashboard.js';

// ============================================================
// تحميل العملاء
// ============================================================
export async function loadCustomers() {
    const customers = await loadCustomersFromDB();
    updateState({ allCustomers: customers });
    updateCustomerSelect(customers);
    renderCustomersTable(customers);
    return customers;
}

// ============================================================
// تحديث قائمة العملاء في الفاتورة
// ============================================================
function updateCustomerSelect(customers) {
    const select = document.getElementById('invoiceCustomer');
    if (!select) return;
    
    select.innerHTML = `<option value="cash_customer">👤 زبون نقدي (كاش)</option>`;
    customers.forEach(c => {
        select.innerHTML += `<option value="${c.id}">👤 ${c.customer_name}</option>`;
    });
}

// ============================================================
// عرض العملاء في الجدول
// ============================================================
export function renderCustomersTable(list) {
    const tbody = document.getElementById('customersTableBody');
    if (!tbody) return;
    
    if (!list || list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center p-4 text-slate-500">لا يوجد حسابات عملاء مسجلة</td></tr>`;
        return;
    }
    
    tbody.innerHTML = list.map(c => {
        const debt = parseFloat(c.total_debt || 0);
        return `
            <tr class="border-b border-slate-800/40 hover:bg-slate-900/20">
                <td class="p-4 font-bold">${c.customer_name}</td>
                <td class="p-4 font-mono text-slate-400">${c.phone || '—'}</td>
                <td class="p-4 text-xs text-slate-400">${c.address || '—'}</td>
                <td class="p-4 font-black ${debt > 0 ? 'text-red-400' : 'text-slate-500'}">${debt.toFixed(2)} ج.م</td>
                <td class="p-4 text-center">
                    <button onclick="window.openPaymentModal('${c.id}', '${c.customer_name}', ${debt})" 
                            class="bg-emerald-950 text-emerald-400 border border-emerald-900/50 px-3 py-1 rounded-xl text-xs font-bold hover:bg-emerald-900">
                        تحصيل سداد 💵
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// ============================================================
// فلتر العملاء
// ============================================================
export function filterCustomers() {
    const query = document.getElementById('customerSearch').value.trim().toLowerCase();
    if (!query) {
        renderCustomersTable(STATE.allCustomers);
        return;
    }
    const filtered = STATE.allCustomers.filter(c => 
        c.customer_name.toLowerCase().includes(query) || 
        (c.phone && c.phone.includes(query))
    );
    renderCustomersTable(filtered);
}

// ============================================================
// إضافة عميل جديد
// ============================================================
export function openAddCustomerModal() {
    showModal('addCustomerModal');
}

export async function saveNewCustomer() {
    const name = getValue('newCustomerName').trim();
    const phone = getValue('newCustomerPhone').trim();
    const address = getValue('newCustomerAddress').trim();
    
    if (!name) { showToast('⚠️ يرجى كتابة اسم العميل', 'error'); return; }
    
    try {
        await insertCustomerDB({
            customer_name: name,
            phone: phone || null,
            address: address || null
        });
        
        hideModal('addCustomerModal');
        ['newCustomerName', 'newCustomerPhone', 'newCustomerAddress']
            .forEach(id => setValue(id, ''));
        
        showToast('✅ تم إضافة العميل بنجاح', 'success');
        await loadCustomers();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// ============================================================
// تحصيل المدفوعات
// ============================================================
export function openPaymentModal(id, name, debt) {
    setValue('payCustId', id);
    setValue('payCustName', name);
    setValue('payCustDebt', debt.toFixed(2) + ' ج.م');
    setValue('payAmountInput', '');
    showModal('paymentCustomerModal');
}

export async function submitCustomerPayment() {
    const id = getValue('payCustId');
    const name = getValue('payCustName');
    const currentDebt = parseFloat(getValue('payCustDebt')) || 0;
    const payAmount = parseFloat(getValue('payAmountInput')) || 0;
    
    if (payAmount <= 0) {
        showToast('⚠️ يرجى كتابة مبلغ سداد صحيح', 'error');
        return;
    }
    if (payAmount > currentDebt) {
        showToast('⚠️ المبلغ المدفوع أكبر من المديونية', 'error');
        return;
    }
    
    try {
        const newDebt = Math.max(0, currentDebt - payAmount);
        await updateCustomerDebt(id, newDebt);
        await insertTransaction({
            type: 'income',
            amount: payAmount,
            description: `تحصيل جزء من حساب العميل: ${name}`
        });
        
        hideModal('paymentCustomerModal');
        showToast('🎉 تم تحصيل المبلغ وتحديث الحساب بنجاح', 'success');
        await loadCustomers();
        await updateDashboardStats();
    } catch (error) {
        showToast(error.message, 'error');
    }
}