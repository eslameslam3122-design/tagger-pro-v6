// TAGGER PRO V6 - Settings, VAT & Branches

// ============================================================
// ====== نظام ضريبة القيمة المضافة (VAT) ======
// ============================================================

function isVatEnabled() { return localStorage.getItem('vat_enabled_' + currentStoreId) === 'true'; }
function getVatRate() { return parseFloat(localStorage.getItem('vat_rate_' + currentStoreId) || '15'); }
function setVatEnabled(enabled) { localStorage.setItem('vat_enabled_' + currentStoreId, enabled.toString()); }
function setVatRate(rate) { localStorage.setItem('vat_rate_' + currentStoreId, rate.toString()); }

function openVatSettings() {
    const enabled = isVatEnabled();
    const rate = getVatRate();
    document.getElementById('vatEnabled').checked = enabled;
    document.getElementById('vatRate').value = rate;
    document.getElementById('vatModal').classList.remove('hidden');
}

function saveVatSettings() {
    const enabled = document.getElementById('vatEnabled').checked;
    const rate = parseFloat(document.getElementById('vatRate').value) || 15;
    setVatEnabled(enabled);
    setVatRate(rate);
    calculateInvoiceTotals();
    closeModal('vatModal');
    showToast(enabled ? `✅ تم تفعيل الضريبة ${rate}%` : '✅ تم تعطيل الضريبة', 'success');
}

// ============================================================
// ====== الميزة 9: الدفع الإلكتروني ======
// ============================================================

function getPaymentLinks(amount, invoiceNum) {
    const phone = localStorage.getItem('store_payment_phone') || '';
    const storeName = localStorage.getItem('active_store_name') || 'المحل';
    return {
        instapay: phone ? `https://instapay.com/${phone}?amount=${amount}&note=${encodeURIComponent(storeName + ' - فاتورة ' + invoiceNum)}` : null,
        fawry: `https://www.fawry.com/pay/${amount}`,
        vodafone: phone ? `https://pay.vodafonecash.com/${phone}/${amount}` : null
    };
}

// ============================================================
// ====== إدارة الفروع (Super Admin) ======
// ============================================================

let allStores = [];

async function loadBranchesData() {
    if (!isSuperAdmin) return;
    try {
        if (SyncManager.isOnline) {
            const { data, error } = await sb.from('stores').select('*')
                .or(`parent_store_id.eq.${currentStoreId},parent_store_id.is.null`);
            if (!error && data) {
                allStores = data;
            }
        }
        renderBranchesStats();
        renderBranchesCards();
    } catch(err) {
        console.error('خطأ تحميل الفروع:', err);
    }
}

async function renderBranchesStats() {
    let totalProducts = 0, totalInvoices = 0, totalSales = 0;
    for (const store of allStores) {
        const { data: prods } = await sb.from('products').select('id', { count: 'exact', head: true }).eq('store_id', store.id);
        const { data: invs } = await sb.from('invoices').select('final_amount').eq('store_id', store.id);
            totalProducts += (prods || []).length || 0;
            if (invs) {
                totalInvoices += invs.length;
                totalSales += invs.reduce((s, i) => s + (parseFloat(i.final_amount) || 0), 0);
            }
        }
        document.getElementById('totalBranchesCount').textContent = allStores.length;
        document.getElementById('totalBranchesProducts').textContent = totalProducts;
        document.getElementById('totalBranchesInvoices').textContent = totalInvoices;
        document.getElementById('totalBranchesSales').textContent = totalSales.toFixed(2) + ' ج.م';
}

async function renderBranchesCards() {
    const grid = document.getElementById('branchesGrid');
    const emptyMsg = document.getElementById('emptyBranches');
    if (!grid) return;
    if (allStores.length === 0) { grid.innerHTML = ''; emptyMsg.classList.remove('hidden'); return; }
    emptyMsg.classList.add('hidden');
    
    let html = '';
    for (let i = 0; i < allStores.length; i++) {
        const store = allStores[i];
        const isCurrent = store.id === currentStoreId;
        
        // تحميل إحصائيات كل فرع
        const { count: prodCount } = await sb.from('products').select('id', { count: 'exact', head: true }).eq('store_id', store.id);
        const { data: invs } = await sb.from('invoices').select('final_amount').eq('store_id', store.id);
        const { count: userCount } = await sb.from('users').select('id', { count: 'exact', head: true }).eq('store_id', store.id);
        const invCount = (invs || []).length;
        const salesSum = (invs || []).reduce((s, x) => s + (parseFloat(x.final_amount) || 0), 0);
        
        html += `
        <div class="bg-[#0f1524] border ${isCurrent ? 'border-amber-500/50 shadow-lg shadow-amber-500/10' : 'border-slate-800'} rounded-2xl p-3 lg:p-4 transition-all hover:border-amber-500/30">
            <div class="flex items-center justify-between mb-2 lg:mb-3">
                <div class="flex items-center gap-2">
                    <div class="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-tr from-amber-500 to-orange-600 rounded-xl flex items-center justify-center text-white text-sm lg:text-base font-bold">
                        ${store.store_name ? store.store_name.charAt(0) : '🏢'}
                    </div>
                    <div>
                        <p class="text-xs lg:text-sm font-bold text-white">${store.store_name || 'بدون اسم'}</p>
                        <p class="text-[8px] lg:text-[10px] text-slate-500">${store.branch_code || 'بدون كود'}</p>
                    </div>
                </div>
                ${isCurrent ? '<span class="text-[8px] lg:text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">📍 الحالي</span>' : ''}
            </div>
            ${store.address ? `<p class="text-[8px] lg:text-[10px] text-slate-400 mb-2 flex items-center gap-1"><i class="fa-solid fa-location-dot"></i> ${store.address}</p>` : ''}
            ${store.phone ? `<p class="text-[8px] lg:text-[10px] text-slate-400 mb-2 flex items-center gap-1"><i class="fa-solid fa-phone"></i> ${store.phone}</p>` : ''}
            <div class="grid grid-cols-3 gap-1 lg:gap-2 mb-2 lg:mb-3">
                <div class="bg-slate-800/40 rounded-lg p-1.5 text-center">
                    <p class="text-xs lg:text-sm font-bold text-blue-400">${prodCount || 0}</p>
                    <p class="text-[7px] lg:text-[9px] text-slate-500">منتج</p>
                </div>
                <div class="bg-slate-800/40 rounded-lg p-1.5 text-center">
                    <p class="text-xs lg:text-sm font-bold text-emerald-400">${invCount}</p>
                    <p class="text-[7px] lg:text-[9px] text-slate-500">فاتورة</p>
                </div>
                <div class="bg-slate-800/40 rounded-lg p-1.5 text-center">
                    <p class="text-xs lg:text-sm font-bold text-purple-400">${userCount || 0}</p>
                    <p class="text-[7px] lg:text-[9px] text-slate-500">موظف</p>
                </div>
            </div>
            <div class="bg-slate-800/30 rounded-lg p-1.5 lg:p-2 mb-2 lg:mb-3">
                <p class="text-[8px] lg:text-[10px] text-slate-500 text-center">إجمالي المبيعات</p>
                <p class="text-sm lg:text-base font-bold text-emerald-400 text-center">${salesSum.toFixed(2)} ج.م</p>
            </div>
            <div class="flex gap-1 lg:gap-2">
                ${!isCurrent ? `<button onclick="switchBranch('${store.id}', '${(store.store_name || '').replace(/'/g, "\\'")}')" class="flex-1 bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-500/30 px-2 py-1 lg:py-1.5 rounded-lg text-[8px] lg:text-[10px] font-bold transition"><i class="fa-solid fa-right-left"></i> تبديل</button>` : ''}
                <button onclick="editBranch('${store.id}')" class="bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 px-2 py-1 lg:py-1.5 rounded-lg text-[8px] lg:text-[10px] font-bold transition"><i class="fa-solid fa-pen"></i></button>
                ${!isCurrent ? `<button onclick="deleteBranch('${store.id}')" class="bg-red-600/20 hover:bg-red-600/30 text-red-400 px-2 py-1 lg:py-1.5 rounded-lg text-[8px] lg:text-[10px] font-bold transition"><i class="fa-solid fa-trash"></i></button>` : ''}
            </div>
        </div>`;
    }
    grid.innerHTML = html;
}

function openBranches() {
    if (!isSuperAdmin) { showToastPermission(); return; }
    document.getElementById('branchesTab').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    loadBranchesData();
}

function closeBranches() {
    document.getElementById('branchesTab').classList.add('hidden');
    document.body.style.overflow = 'auto';
}

function openAddBranchModal() {
    document.getElementById('branchModalTitle').innerText = '🏢 فرع جديد';
    document.getElementById('editBranchId').value = '';
    document.getElementById('branchName').value = '';
    document.getElementById('branchCode').value = '';
    document.getElementById('branchAddress').value = '';
    document.getElementById('branchPhone').value = '';
    document.getElementById('branchModal').classList.remove('hidden');
}

async function editBranch(storeId) {
    const store = allStores.find(s => s.id === storeId);
    if (!store) return;
    document.getElementById('branchModalTitle').innerText = '✏️ تعديل الفرع';
    document.getElementById('editBranchId').value = storeId;
    document.getElementById('branchName').value = store.store_name || '';
    document.getElementById('branchCode').value = store.branch_code || '';
    document.getElementById('branchAddress').value = store.address || '';
    document.getElementById('branchPhone').value = store.phone || '';
    document.getElementById('branchModal').classList.remove('hidden');
}

async function saveBranch() {
    const editId = document.getElementById('editBranchId').value;
    const name = document.getElementById('branchName').value.trim();
    const code = document.getElementById('branchCode').value.trim();
    const address = document.getElementById('branchAddress').value.trim();
    const phone = document.getElementById('branchPhone').value.trim();
    if (!name) { showToast('⚠️ يرجى إدخال اسم الفرع', 'error'); return; }
    
    try {
        if (editId) {
            await sb.from('stores').update({ store_name: name, branch_code: code, address, phone }).eq('id', editId);
            if (editId === currentStoreId) {
                localStorage.setItem('active_store_name', name);
            }
            showToast('✅ تم تحديث الفرع', 'success');
        } else {
            const { data: { user }, error: authErr } = await sb.auth.getUser();
            if (authErr || !user) { showToast('❌ خطأ في المصادقة', 'error'); return; }
            const newStoreId = crypto.randomUUID();
            const { error } = await sb.from('stores').insert([{
                id: newStoreId,
                store_name: name,
                branch_code: code,
                address,
                phone,
                owner_id: user.id,
                parent_store_id: currentStoreId,
                is_active: true,
                created_at: new Date().toISOString()
            }]);
            if (error) {
                if (error.code === '23505') { showToast('⚠️ يوجد فرع بنفس الكود، غيّر الكود وحاول مرة أخرى', 'error'); }
                else { showToast('❌ خطأ: ' + error.message, 'error'); }
                return;
            }
            // إنشاء مستخدم admin للفرع الجديد
            await sb.from('users').insert([{
                store_id: newStoreId,
                username: 'admin',
                full_name: 'مدير الفرع',
                password: 'admin123',
                role: 'admin',
                is_active: true,
                is_super_admin: false
            }]);
            showToast(`✅ تم إنشاء الفرع "${name}" — تسجيل الدخول: admin / admin123`, 'success');
        }
        closeModal('branchModal');
        await loadBranchesData();
    } catch(err) {
        showToast('❌ خطأ: ' + err.message, 'error');
    }
}

async function deleteBranch(storeId) {
    if (storeId === currentStoreId) { showToast('⚠️ لا يمكن حذف الفرع الحالي', 'error'); return; }
    const store = allStores.find(s => s.id === storeId);
    const confirmed = await showConfirm(`هل أنت متأكد من حذف فرع "${store?.store_name || ''}"؟\nسيتم حذف جميع المنتجات والفواتير والمبيعات الخاصة بهذا الفرع!`, 'حذف الفرع', { danger: true });
    if (!confirmed) return;
    
    try {
        // حذف جميع البيانات المرتبطة بالفرع
        const tables = ['products', 'customers', 'invoices', 'maintenance', 'finance_transactions', 'cash_transactions', 'shifts', 'suppliers', 'supplier_transactions', 'installments', 'installment_payments', 'quick_sale_items', 'users', 'ai_settings'];
        for (const table of tables) {
            await sb.from(table).delete().eq('store_id', storeId);
        }
        // حذف invoice_items المرتبطة بفواتير هذا الفرع
        const { data: storeInvoices } = await sb.from('invoices').select('id').eq('store_id', storeId);
        if (storeInvoices && storeInvoices.length > 0) {
            const invIds = storeInvoices.map(i => i.id);
            await sb.from('invoice_items').delete().in('invoice_id', invIds);
        }
        // حذف الفرع
        await sb.from('stores').delete().eq('id', storeId);
        showToast('✅ تم حذف الفرع', 'success');
        await loadBranchesData();
    } catch(err) {
        showToast('❌ خطأ: ' + err.message, 'error');
    }
}

async function switchBranch(storeId, storeName) {
    const confirmed = await showConfirm(`التبديل إلى فرع "${storeName}"؟`, 'تبديل الفرع', { info: true });
    if (!confirmed) return;
    // التحقق من وجود المستخدم الحالي في الفرع الجديد
    const currentUsername = localStorage.getItem('active_username');
    const { data: branchUser } = await sb.from('users')
        .select('role, full_name')
        .eq('store_id', storeId)
        .eq('username', currentUsername)
        .single();
    
    if (branchUser) {
        // المستخدم موجود في الفرع الجديد — دوره بيتغير حسب الفرع
        localStorage.setItem('active_staff_role', branchUser.role);
        localStorage.setItem('active_staff_name', branchUser.full_name);
    } else {
        // المستخدم مش موجود في الفرع — هيكون Super Admin
        localStorage.setItem('active_staff_role', 'admin');
    }
    localStorage.setItem('active_store_id', storeId);
    localStorage.setItem('active_store_name', storeName);
    location.reload();
}