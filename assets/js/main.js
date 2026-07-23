// ============================================================
// MAIN - الملف الرئيسي الذي يربط كل شيء
// ============================================================

import { STATE, updateState } from './config.js';
import { supabase, getSession } from './supabase.js';
import { loadUserFromStorage, applyRolePermissions, logout } from './auth.js';
import { showToast, setText, showModal, hideModal } from './utils.js';
import { 
    loadProducts, 
    saveNewProduct, 
    openEditProductModal, 
    updateProduct,
    restockProduct,
    exportProductsToExcel,
    applyProductFilters,
    resetProductFilters
} from './products.js';
import {
    loadCustomers,
    saveNewCustomer,
    openAddCustomerModal,
    filterCustomers,
    openPaymentModal,
    submitCustomerPayment
} from './customers.js';
import {
    addToCart,
    addQuickService,
    addGiftItem,
    updateCartUI,
    calculateInvoiceFinals,
    updateCartQty,
    updateCartQtyInput,
    modifyItemPriceInline,
    updatePaymentTypeUI,
    holdCurrentInvoice,
    restoreOnHoldInvoice,
    clearCartWithConfirm,
    processInvoiceCheckout,
    reprintLastInvoice,
    openWhatsAppModal,
    sendWhatsApp,
    initSearchAndBarcode
} from './pos.js';
import {
    updateDashboardStats,
    updateChartData
} from './dashboard.js';

// ============================================================
// تهيئة التطبيق
// ============================================================
async function initApp() {
    // 1. التحقق من الجلسة
    const session = await getSession();
    if (!session) {
        window.location.href = 'index.html';
        return;
    }
    
    // 2. تحديث storeId
    updateState({ currentStoreId: session.user.id });
    
    // 3. تحميل بيانات المستخدم
    loadUserFromStorage();
    
    // 4. تطبيق الصلاحيات
    applyRolePermissions();
    
    // 5. تحميل البيانات
    await loadStoreName();
    await loadCustomers();
    await loadProducts();
    await updateDashboardStats();
    
    // 6. تشغيل الساعة
    setInterval(() => {
        document.getElementById('liveClock').innerText = '🕒 ' + new Date().toLocaleTimeString('ar-EG');
    }, 1000);
    
    // 7. تفعيل البحث
    initSearchAndBarcode();
    
    // 8. اختصارات الكيبورد
    initKeyboardShortcuts();
    
    // 9. مخطط المبيعات
    setTimeout(async () => {
        await initWeeklyChart();
    }, 500);
}

// ============================================================
// تحميل اسم المتجر
// ============================================================
async function loadStoreName() {
    try {
        const { data } = await supabase
            .from('stores')
            .select('store_name')
            .eq('id', STATE.currentStoreId)
            .single();
        if (data) {
            document.getElementById('storeName').innerText = data.store_name;
        }
    } catch (error) {
        console.error('خطأ في تحميل اسم المتجر:', error);
    }
}

// ============================================================
// اختصارات الكيبورد
// ============================================================
function initKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
        if (e.key === 'F2') {
            e.preventDefault();
            document.getElementById('barcodeSearch').focus();
        }
        if (e.key === 'F12') {
            e.preventDefault();
            processInvoiceCheckout();
        }
    });
}

// ============================================================
// المخطط البياني الأسبوعي
// ============================================================
async function initWeeklyChart() {
    const ctx = document.getElementById('weeklySalesChart')?.getContext('2d');
    if (!ctx) return;
    
    const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const today = new Date().getDay();
    const labels = [];
    for (let i = 6; i >= 0; i--) {
        const idx = (today - i + 7) % 7;
        labels.push(days[idx]);
    }
    
    const chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'المبيعات (ج.م)',
                data: [0, 0, 0, 0, 0, 0, 0],
                backgroundColor: 'rgba(59, 130, 246, 0.6)',
                borderColor: '#3b82f6',
                borderWidth: 2,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: '#94a3b8',
                        font: { size: 10 }
                    }
                }
            },
            scales: {
                y: {
                    ticks: { color: '#64748b', font: { size: 10 } },
                    grid: { color: '#1e293b' },
                    beginAtZero: true
                },
                x: {
                    ticks: { color: '#64748b', font: { size: 10 } },
                    grid: { display: false }
                }
            }
        }
    });
    
    updateState({ weeklySalesChart: chart });
    await updateChartData(chart);
}

// ============================================================
// التنقل بين التبويبات
// ============================================================
window.switchTab = function(id) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    const target = document.getElementById(`${id}-tab`);
    if (target) target.classList.remove('hidden');
    
    document.querySelectorAll('.sidebar-desktop .nav-link').forEach(b => {
        b.className = 'nav-link w-full flex items-center gap-3 px-4 py-3.5 text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 rounded-xl font-medium transition';
    });
    
    const activeBtn = document.getElementById(`btn-${id}`);
    if (activeBtn) {
        activeBtn.className = 'nav-link w-full flex items-center gap-3 px-4 py-3.5 bg-blue-600/10 text-blue-400 border border-blue-500/30 rounded-xl font-bold transition';
    }
    
    document.querySelectorAll('.sidebar-mobile button').forEach(btn => btn.classList.remove('active'));
    const activeMobBtn = document.getElementById(`mbtn-${id}`);
    if (activeMobBtn) activeMobBtn.classList.add('active');
    
    if (id === 'dashboard') {
        updateDashboardStats();
        setTimeout(() => updateChartData(STATE.weeklySalesChart), 300);
    }
};

// ============================================================
// دوال عامة للـ Window (ليتم استدعاؤها من HTML)
// ============================================================
window.logout = logout;
window.showToast = showToast;
window.showModal = showModal;
window.hideModal = hideModal;
window.addToCart = addToCart;
window.addQuickService = addQuickService;
window.addGiftItem = addGiftItem;
window.updateCartQty = updateCartQty;
window.updateCartQtyInput = updateCartQtyInput;
window.modifyItemPriceInline = modifyItemPriceInline;
window.updatePaymentTypeUI = updatePaymentTypeUI;
window.holdCurrentInvoice = holdCurrentInvoice;
window.restoreOnHoldInvoice = restoreOnHoldInvoice;
window.clearCartWithConfirm = clearCartWithConfirm;
window.processInvoiceCheckout = processInvoiceCheckout;
window.reprintLastInvoice = reprintLastInvoice;
window.openWhatsAppModal = openWhatsAppModal;
window.sendWhatsApp = sendWhatsApp;
window.openAddProductModal = () => showModal('productModal');
window.saveNewProduct = saveNewProduct;
window.openEditProductModal = openEditProductModal;
window.updateProduct = updateProduct;
window.restockProduct = restockProduct;
window.exportProductsToExcel = exportProductsToExcel;
window.applyProductFilters = applyProductFilters;
window.resetProductFilters = resetProductFilters;
window.openAddCustomerModal = openAddCustomerModal;
window.saveNewCustomer = saveNewCustomer;
window.filterCustomers = filterCustomers;
window.openPaymentModal = openPaymentModal;
window.submitCustomerPayment = submitCustomerPayment;

// ============================================================
// تشغيل التطبيق
// ============================================================
document.addEventListener('DOMContentLoaded', initApp);