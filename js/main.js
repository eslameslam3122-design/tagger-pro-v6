// TAGGER PRO V6 - Main Initialization & Global State

let localProducts = [];
let currentInvoiceItems = [];
let holdedInvoices = JSON.parse(localStorage.getItem('holdedInvoices_' + currentStoreId) || '[]');

function saveHoldedInvoices() {
    localStorage.setItem('holdedInvoices_' + currentStoreId, JSON.stringify(holdedInvoices));
    const count = holdedInvoices.length;
    if (document.getElementById('holdCount')) document.getElementById('holdCount').innerText = count;
    if (document.getElementById('holdBadge')) document.getElementById('holdBadge').textContent = count;
}
let allCustomers = [];
let selectedPaymentMethod = 'cash';
let appliedCoupon = null;
let allInvoices = [];
let selectedCustomerForPayment = null;

let maintenanceTickets = [];
let currentMaintenanceFilter = 'all';
let financeTransactions = [];
let shifts = [];
let currentShift = null;
let suppliers = [];
let supplierTransactions = [];
let users = [];
let currentUserData = null;
let allCategories = ['إكسسوارات', 'قطع غيار', 'خدمات صيانة', 'أخرى'];
let currentInventoryFilter = 'all';
let selectedProductImage = null;
let lowStockThreshold = 5;

let dailyChartInstance = null;
let weeklyChartInstance = null;
let monthlyChartInstance = null;

window.addEventListener('DOMContentLoaded', async () => {
    window.onerror = function(msg, url, line, col, error) {
        console.error('Global error:', msg, url, line);
        showToast('❌ خطأ غير متوقع: ' + msg, 'error');
        return false;
    };
    window.addEventListener('unhandledrejection', (e) => {
        console.error('Unhandled rejection:', e.reason);
        showToast('❌ خطأ في الخلفية: ' + (e.reason?.message || 'خطأ غير معروف'), 'error');
    });

    document.documentElement.lang = currentLang;
    document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
    const langEl = document.getElementById('langToggle');
    if (langEl) langEl.textContent = currentLang === 'ar' ? 'EN/عربي' : 'عربي/EN';
    const savedTheme = localStorage.getItem('tagger_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    if (document.getElementById('themeIcon')) document.getElementById('themeIcon').textContent = savedTheme === 'dark' ? '🌙' : '☀️';
    if (document.getElementById('sidebarThemeIcon')) document.getElementById('sidebarThemeIcon').textContent = savedTheme === 'dark' ? '🌙' : '☀️';
    if (document.getElementById('mobileThemeIcon')) document.getElementById('mobileThemeIcon').textContent = savedTheme === 'dark' ? '🌙' : '☀️';
    applyTranslations();
    const staffName = localStorage.getItem('active_staff_name') || (currentLang === 'ar' ? 'الكاشير' : 'Cashier');
    const staffEl = document.getElementById('currentStaffName');
    if (staffEl) staffEl.innerText = staffName;
    const sidebarStaffEl = document.getElementById('sidebarStaffName');
    if (sidebarStaffEl) sidebarStaffEl.textContent = staffName;

    const { data: { session } } = await sb.auth.getSession();
    if(!session) {
        if (isCapacitorApp) {
            document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#0f1524;color:white;font-family:Cairo,sans-serif;text-align:center;padding:20px;"><div><h1 style="font-size:24px;margin-bottom:12px;">يرجى تسجيل الدخول</h2><p style="color:#94a3b8;">العودة لصفحة تسجيل الدخول...</p></div></div>';
            setTimeout(function(){ window.location.href = "index.html"; }, 1500);
        } else {
            window.location.href = "index.html";
        }
        return;
    }

    try {
        const { data: storeData, error: storeErr } = await sb.from('stores').select('store_name, id').eq('id', currentStoreId).single();
        if (storeData && storeData.store_name) {
            localStorage.setItem('active_store_name', storeData.store_name);
            const pHeaderName = document.getElementById('pHeaderName');
            if (pHeaderName) pHeaderName.textContent = storeData.store_name;
            document.title = storeData.store_name + ' - TAGGER PRO';
        } else if (storeErr || !storeData) {
            const storeName = localStorage.getItem('active_store_name') || 'المحل';
            await sb.from('stores').upsert([{
                id: currentStoreId,
                store_name: storeName,
                owner_id: currentStoreId,
                is_active: true,
                created_at: new Date().toISOString()
            }], { onConflict: 'id' });
            console.log('✅ تم تسجيل الفرع تلقائياً:', storeName);
        }
    } catch(e) { console.log('تعذر جلب اسم المحل:', e); }

    SyncManager.start();
    ConnectionIndicator.init();

    RealtimeSync.onDataChange = (table, payload) => {
        try {
            const evt = payload.eventType;
            const record = evt === 'DELETE' ? payload.old : payload.new;

            if (table === 'products') {
                if (evt === 'DELETE' && record?.id) {
                    localProducts = localProducts.filter(p => p.id !== record.id);
                } else if (record) {
                    const idx = localProducts.findIndex(p => p.id === record.id);
                    if (idx >= 0) localProducts[idx] = record; else localProducts.push(record);
                }
                if (typeof renderProductsGrid === 'function') renderProductsGrid(localProducts);
                if (typeof renderInventoryTable === 'function') renderInventoryTable();
                if (typeof updateLowStockBadge === 'function') updateLowStockBadge();
            } else if (table === 'invoices') {
                if (evt === 'DELETE' && record?.id) {
                    allInvoices = allInvoices.filter(i => i.id !== record.id);
                } else if (record) {
                    const idx = allInvoices.findIndex(i => i.id === record.id);
                    if (idx >= 0) allInvoices[idx] = record; else allInvoices.push(record);
                    allInvoices.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
                }
                if (typeof renderInvoicesTable === 'function') renderInvoicesTable();
                if (typeof updateReports === 'function') updateReports();
            } else if (table === 'customers') {
                if (evt === 'DELETE' && record?.id) {
                    allCustomers = allCustomers.filter(c => c.id !== record.id);
                } else if (record) {
                    const idx = allCustomers.findIndex(c => c.id === record.id);
                    if (idx >= 0) allCustomers[idx] = record; else allCustomers.push(record);
                }
                if (typeof updateCustomerSelect === 'function') updateCustomerSelect();
                if (typeof renderCustomersList === 'function') renderCustomersList();
            } else if (table === 'cash_transactions') {
                if (evt === 'DELETE' && record?.id) {
                    cashTransactions = cashTransactions.filter(t => t.id !== record.id);
                } else if (record) {
                    const idx = cashTransactions.findIndex(t => t.id === record.id);
                    if (idx >= 0) cashTransactions[idx] = record; else cashTransactions.push(record);
                }
                if (typeof renderCashWalletTable === 'function') renderCashWalletTable();
                if (typeof updateCashStats === 'function') updateCashStats();
            } else if (table === 'maintenance') {
                if (evt === 'DELETE' && record?.id) {
                    maintenanceTickets = maintenanceTickets.filter(t => t.id !== record.id);
                } else if (record) {
                    const idx = maintenanceTickets.findIndex(t => t.id === record.id);
                    if (idx >= 0) maintenanceTickets[idx] = record; else maintenanceTickets.push(record);
                }
                if (typeof renderMaintenanceTable === 'function') renderMaintenanceTable();
                if (typeof updateMaintenanceStats === 'function') updateMaintenanceStats();
            } else if (table === 'installments' || table === 'installment_payments') {
                if (typeof loadInstallmentsData === 'function') loadInstallmentsData();
            } else if (table === 'finance_transactions') {
                if (typeof loadFinanceData === 'function') loadFinanceData();
            } else if (table === 'shifts') {
                if (typeof loadShiftsData === 'function') loadShiftsData();
            }
            if (typeof updateDashboardKPIs === 'function') updateDashboardKPIs();
        } catch (e) {
            console.warn('Realtime onDataChange error:', e.message);
        }
    };

    await loadAllData();

    RealtimeSync.start(currentStoreId);
    if (typeof checkLowStockAlerts === 'function') checkLowStockAlerts();
    await loadInvoices();
    await loadMaintenanceData();
    await loadSuppliersData();
    await loadSupplierTransactions();
    await loadShiftsData();
    await loadFinanceData();
    await loadUsersData();
    await loadCategories();
    saveHoldedInvoices();
    loadCashTransactions();
    loadInstallmentsData().then(() => checkOverdueInstallments());
    loadAiKeysFromSupabase();
    if (isSuperAdmin) loadBranchesData();
    loadActivityLog();
    setTimeout(() => checkSmartAlertsOnLoad(), 2000);

    if (SyncManager.isOnline) {
        SmartLoader.fullPull(currentStoreId).then(() => {
            ConnectionIndicator.showPending();
        });
    }

    setInterval(async () => {
        if (SyncManager.isOnline) {
            await SyncManager.syncPending();
            const changed = await SyncManager.pullRecent(currentStoreId);
            if (changed && changed.length > 0) {
                refreshTables(changed);
            }
        }
    }, 30000);

    const vatBadge = document.getElementById('vatStatusBadge');
    if (vatBadge) {
        const vatOn = isVatEnabled();
        vatBadge.textContent = vatOn ? getVatRate() + '%' : 'OFF';
        vatBadge.style.background = vatOn ? 'var(--success)' : 'var(--warning)';
    }

    applyPermissions();
    loadQuickSaleItems();
});

function refreshTables(tables) {
    const tableHandlers = {
        products: () => {
            SmartLoader.getLocalData('products').then(data => {
                localProducts = data.filter(p => p.store_id === currentStoreId);
                if (typeof renderProductsGrid === 'function') renderProductsGrid(localProducts);
                if (typeof renderInventoryTable === 'function') renderInventoryTable();
                if (typeof updateLowStockBadge === 'function') updateLowStockBadge();
            });
        },
        invoices: () => {
            SmartLoader.getLocalData('invoices').then(data => {
                allInvoices = data.filter(i => i.store_id === currentStoreId)
                    .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
                if (typeof renderInvoicesTable === 'function') renderInvoicesTable();
            });
        },
        customers: () => {
            SmartLoader.getLocalData('customers').then(data => {
                allCustomers = data.filter(c => c.store_id === currentStoreId);
                if (typeof updateCustomerSelect === 'function') updateCustomerSelect();
                if (typeof renderCustomersList === 'function') renderCustomersList();
            });
        },
        cash_transactions: () => {
            SmartLoader.getLocalData('cash_transactions').then(data => {
                cashTransactions = data.filter(t => t.store_id === currentStoreId);
                if (typeof renderCashWalletTable === 'function') renderCashWalletTable();
                if (typeof updateCashStats === 'function') updateCashStats();
            });
        },
        installments: () => {
            if (typeof loadInstallmentsData === 'function') loadInstallmentsData();
        },
        installment_payments: () => {
            if (typeof loadInstallmentsData === 'function') loadInstallmentsData();
        }
    };

    for (const table of tables) {
        if (tableHandlers[table]) {
            tableHandlers[table]();
        }
    }
    updateDashboardKPIs();
}

function updateDashboardKPIs() {
    const today = new Date().toISOString().split('T')[0];
    const todayInvoices = allInvoices.filter(inv => new Date(inv.created_at || inv.date).toISOString().split('T')[0] === today);
    const todaySales = todayInvoices.reduce((sum, inv) => sum + parseFloat(inv.final_amount || 0), 0);
    const lowStock = localProducts.filter(p => parseInt(p.stock || 0) <= lowStockThreshold).length;

    const kpiSales = document.getElementById('kpiTodaySales');
    const kpiInvoices = document.getElementById('kpiInvoiceCount');
    const kpiProducts = document.getElementById('kpiProductCount');
    const kpiCustomers = document.getElementById('kpiCustomerCount');
    const kpiLowStock = document.getElementById('kpiLowStock');

    if (kpiSales) kpiSales.textContent = todaySales.toFixed(0) + ' ج.م';
    if (kpiInvoices) kpiInvoices.textContent = todayInvoices.length;
    if (kpiProducts) kpiProducts.textContent = localProducts.length;
    if (kpiCustomers) kpiCustomers.textContent = allCustomers.length;
    if (kpiLowStock) {
        kpiLowStock.textContent = lowStock;
        kpiLowStock.style.color = lowStock > 0 ? 'var(--danger)' : 'var(--success)';
    }
}

async function loadAllData() {
    try {
        const grid = document.getElementById('productsGrid');
        if(grid) Skeleton.show('productsGrid', 'cards', { count: 6 });
        const custTbody = document.getElementById('customersListTable');
        if(custTbody) Skeleton.show('customersListTable', 'table', { rows: 5, cols: 5 });

        console.log(`[loadAllData] currentStoreId = "${currentStoreId}"`);

        // Diagnostic: check total products count without store_id filter
        if (SyncManager.isOnline) {
            const { count: totalProducts } = await sb.from('products').select('*', { count: 'exact', head: true });
            console.log(`[loadAllData] Total products in Supabase (all stores): ${totalProducts}`);

            const { count: totalCustomers } = await sb.from('customers').select('*', { count: 'exact', head: true });
            console.log(`[loadAllData] Total customers in Supabase (all stores): ${totalCustomers}`);

            // Check what store_ids exist
            const { data: storeIds } = await sb.from('products').select('store_id').limit(5);
            console.log(`[loadAllData] Sample store_ids in products:`, storeIds);
        }

        const localProds = await SmartLoader.getLocalData('products');
        localProducts = localProds.filter(p => p.store_id === currentStoreId);
        const localCusts = await SmartLoader.getLocalData('customers');
        allCustomers = localCusts.filter(c => c.store_id === currentStoreId);

        if (localProducts.length === 0 && SyncManager.isOnline) {
            await SmartLoader.syncTable('products', currentStoreId, true);
            await SmartLoader.syncTable('customers', currentStoreId, true);
            const freshProds = await SmartLoader.getLocalData('products');
            localProducts = freshProds.filter(p => p.store_id === currentStoreId);
            const freshCusts = await SmartLoader.getLocalData('customers');
            allCustomers = freshCusts.filter(c => c.store_id === currentStoreId);
        }

        if (typeof renderProductsGrid === 'function') renderProductsGrid(localProducts);
        if (typeof updateCustomerSelect === 'function') updateCustomerSelect();
        if (typeof renderCustomersList === 'function') renderCustomersList();
        if (typeof renderInventoryTable === 'function') renderInventoryTable();
        if (typeof renderInvoicesTable === 'function') renderInvoicesTable();
        if (typeof updateLowStockBadge === 'function') updateLowStockBadge();
        if (typeof updateDashboardKPIs === 'function') updateDashboardKPIs();

        if (SyncManager.isOnline) {
            Promise.all([
                SmartLoader.syncTable('products', currentStoreId),
                SmartLoader.syncTable('customers', currentStoreId),
                SmartLoader.syncTable('invoice_items', currentStoreId)
            ]).then(([prods, custs]) => {
                if (prods.length > 0 || custs.length > 0) {
                    SmartLoader.getLocalData('products').then(full => {
                        localProducts = full.filter(p => p.store_id === currentStoreId);
                        if (typeof renderProductsGrid === 'function') renderProductsGrid(localProducts);
                        if (typeof updateLowStockBadge === 'function') updateLowStockBadge();
                        if (typeof updateDashboardKPIs === 'function') updateDashboardKPIs();
                    });
                    SmartLoader.getLocalData('customers').then(full => {
                        allCustomers = full.filter(c => c.store_id === currentStoreId);
                        if (typeof updateCustomerSelect === 'function') updateCustomerSelect();
                        if (typeof renderCustomersList === 'function') renderCustomersList();
                    });
                }
            });
        }
    } catch (err) {
        console.error("خطأ في التحميل:", err.message);
        showToast('❌ خطأ في تحميل البيانات: ' + err.message, 'error');
    }
}

async function loadInvoices() {
    try {
        const tbody = document.getElementById('invoicesTableBody');
        if(tbody) Skeleton.show('invoicesTableBody', 'table', { rows: 8, cols: 5 });

        const localInv = await SmartLoader.getLocalData('invoices');
        allInvoices = localInv.filter(i => i.store_id === currentStoreId)
            .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));

        if (allInvoices.length === 0 && SyncManager.isOnline) {
            await SmartLoader.syncTable('invoices', currentStoreId, true);
            const freshInv = await SmartLoader.getLocalData('invoices');
            allInvoices = freshInv.filter(i => i.store_id === currentStoreId)
                .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
        }

        renderInvoicesTable();
        updateReports();
        updateDashboardKPIs();

        if (SyncManager.isOnline) {
            SmartLoader.syncTable('invoices', currentStoreId).then(synced => {
                if (synced.length > 0) {
                    SmartLoader.getLocalData('invoices').then(full => {
                        allInvoices = full.filter(i => i.store_id === currentStoreId)
                            .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
                        renderInvoicesTable();
                        updateReports();
                        updateDashboardKPIs();
                    });
                }
            });
        }
    } catch(err) {
        console.error("خطأ في تحميل الفواتير:", err);
    }
}

function closeAllTabs() {
    const tabs = ['maintenanceTab','financeTab','reportsTab','invoicesTab','inventoryTab','suppliersTab','usersTab','shiftsTab','customerProfileTab','branchesTab','quotationsTab'];
    tabs.forEach(id => { const el = document.getElementById(id); if (el) el.classList.add('hidden'); });
    document.body.style.overflow = 'auto';
}

let html5QrCode = null;
async function openCameraScanner() {
    await LazyLoader.load('qrcode');
    document.getElementById('cameraScannerModal').classList.remove('hidden');
    document.getElementById('cameraScannerModal').classList.add('flex');
    document.body.style.overflow = 'hidden';
    if(!html5QrCode) html5QrCode = new Html5Qrcode("qr-reader");
    html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 150 } },
        (decodedText) => {
            document.getElementById('barcodeInput').value = decodedText;
            closeCameraScanner();
            handleBarcodeSearch();
        },
        () => {}
    ).catch(err => {
        showToast('❌ فشل فتح الكاميرا: ' + err, 'error');
        closeCameraScanner();
    });
}
function closeCameraScanner() {
    if(html5QrCode && html5QrCode.isScanning) html5QrCode.stop().catch(()=>{});
    document.getElementById('cameraScannerModal').classList.add('hidden');
    document.getElementById('cameraScannerModal').classList.remove('flex');
    document.body.style.overflow = 'auto';
}

window.addEventListener('online', () => {
    showToast('🟢 عاد الاتصال - جاري المزامنة...', 'success');
    SyncManager.syncPending();
    SyncManager.pullRecent(currentStoreId);
    RealtimeSync.start(currentStoreId);
});

window.addEventListener('offline', () => {
    showToast('🔴 انقطع الاتصال - هتسجل أوفلاين', 'warning');
    RealtimeSync.stop();
});

const staffNameObserver = new MutationObserver(() => updateSidebarUser());
const staffNameEl = document.getElementById('currentStaffName');
if (staffNameEl) staffNameObserver.observe(staffNameEl, { childList: true, characterData: true, subtree: true });

document.getElementById('mainSidebar').addEventListener('click', function(e) {
    const item = e.target.closest('.sidebar-item');
    if (item && window.innerWidth < 1024) {
        setTimeout(closeMobileSidebar, 100);
    }
});
