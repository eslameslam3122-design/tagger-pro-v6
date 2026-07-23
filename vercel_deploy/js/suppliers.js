// TAGGER PRO V6 - Suppliers Management (Complete Rewrite)

// ===== التحميل والتهيئة =====
async function loadSuppliersData() {
    try {
        const tbody = document.getElementById('suppliersTableBody');
        if (tbody) tbody.innerHTML = '<tr><td colspan="8">' + Skeleton.table(5, 5) + '</td></tr>';
        let local = await SmartLoader.getLocalData('suppliers');
        suppliers = local.filter(s => s.store_id === currentStoreId);
        if (suppliers.length === 0 && SyncManager.isOnline) {
            await SmartLoader.syncTable('suppliers', currentStoreId, true);
            local = await SmartLoader.getLocalData('suppliers');
            suppliers = local.filter(s => s.store_id === currentStoreId);
        }
        renderSuppliersTable();
        updateSupplierSelects();
        updateSupplierSummary();
        if (SyncManager.isOnline) {
            SmartLoader.syncTable('suppliers', currentStoreId).then(synced => {
                if (synced.length > 0) {
                    SmartLoader.getLocalData('suppliers').then(full => {
                        suppliers = full.filter(s => s.store_id === currentStoreId);
                        renderSuppliersTable();
                        updateSupplierSelects();
                        updateSupplierSummary();
                    });
                }
            });
        }
    } catch (err) {
        console.error('خطأ في تحميل الموردين:', err);
    }
}

async function loadSupplierTransactions() {
    try {
        const local = await SmartLoader.getLocalData('supplier_transactions');
        supplierTransactions = local.filter(t => t.store_id === currentStoreId)
            .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
        updateSupplierSummary();
        if (SyncManager.isOnline) {
            SmartLoader.syncTable('supplier_transactions', currentStoreId).then(synced => {
                if (synced.length > 0) {
                    SmartLoader.getLocalData('supplier_transactions').then(full => {
                        supplierTransactions = full.filter(t => t.store_id === currentStoreId)
                            .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
                        updateSupplierSummary();
                    });
                }
            });
        }
    } catch (err) {
        console.error('خطأ في تحميل معاملات الموردين:', err);
    }
}

// ===== الملخص المالي =====
function updateSupplierSummary() {
    const totalCount = suppliers.length;
    const totalPurchases = suppliers.reduce((s, sup) => s + parseFloat(sup.total_purchases || 0), 0);
    const totalDebt = suppliers.reduce((s, sup) => s + parseFloat(sup.debt || 0), 0);
    const totalPayments = supplierTransactions.filter(t => t.type === 'payment').reduce((s, t) => s + parseFloat(t.amount || 0), 0);

    const el = (id) => document.getElementById(id);
    if (el('supTotalCount')) el('supTotalCount').textContent = totalCount;
    if (el('supTotalPurchases')) el('supTotalPurchases').textContent = totalPurchases.toFixed(2) + ' ج.م';
    if (el('supTotalDebt')) el('supTotalDebt').textContent = totalDebt.toFixed(2) + ' ج.م';
    if (el('supTotalPayments')) el('supTotalPayments').textContent = totalPayments.toFixed(2) + ' ج.م';
}

// ===== فتح/إغلاق القسم =====
function openSuppliers() {
    if (!canViewSuppliers()) { showToastPermission(); return; }
    document.getElementById('suppliersTab').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    try {
        renderSuppliersTable();
        updateSupplierSummary();
    } catch (e) {
        ErrorBoundary.show('suppliersTab', e, () => openSuppliers());
    }
}

function closeSuppliers() {
    document.getElementById('suppliersTab').classList.add('hidden');
    document.body.style.overflow = 'auto';
}

// ===== البحث والفلاتر =====
function filterSuppliers() {
    const search = (document.getElementById('searchSupplierInput')?.value || '').toLowerCase();
    const debtFilter = document.getElementById('supplierFilterDebt')?.value || 'all';
    const sortBy = document.getElementById('supplierSortBy')?.value || 'name';

    let filtered = suppliers.filter(s => {
        const matchSearch = s.name.toLowerCase().includes(search) || (s.phone && s.phone.includes(search));
        const debt = parseFloat(s.debt || 0);
        const matchDebt = debtFilter === 'all' || (debtFilter === 'debt' && debt > 0) || (debtFilter === 'nodebt' && debt <= 0);
        return matchSearch && matchDebt;
    });

    if (sortBy === 'debt_desc') filtered.sort((a, b) => (b.debt || 0) - (a.debt || 0));
    else if (sortBy === 'purchases_desc') filtered.sort((a, b) => (b.total_purchases || 0) - (a.total_purchases || 0));
    else if (sortBy === 'date_desc') filtered.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    else filtered.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ar'));

    renderSuppliersTableFiltered(filtered);
}

// ===== عرض الجدول =====
function renderSuppliersTable() { filterSuppliers(); }

function renderSuppliersTableFiltered(list) {
    const tbody = document.getElementById('suppliersTableBody');
    const emptyMsg = document.getElementById('emptySuppliers');
    if (!tbody) return;

    if (list.length === 0) {
        tbody.innerHTML = '';
        emptyMsg.classList.remove('hidden');
        const searchText = document.getElementById('searchSupplierInput')?.value;
        document.getElementById('emptySuppliersText').textContent = searchText ? 'لا توجد نتائج مطابقة' : 'لا يوجد موردين مسجلين';
        return;
    }
    emptyMsg.classList.add('hidden');

    tbody.innerHTML = list.map((s, i) => {
        const debt = parseFloat(s.debt || 0);
        const purchases = parseFloat(s.total_purchases || 0);
        const txCount = supplierTransactions.filter(t => t.supplier_id === s.id).length;
        const debtColor = debt > 0 ? 'text-red-400' : 'text-emerald-400';
        const debtBadge = debt > 0
            ? `<span class="inline-flex items-center gap-1 bg-red-500/10 text-red-400 px-2 py-0.5 rounded-lg font-bold">${debt.toFixed(2)} ج.م</span>`
            : `<span class="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-lg font-bold">0.00</span>`;
        const phoneHtml = s.phone
            ? `<a href="https://wa.me/2${s.phone}" target="_blank" onclick="event.stopPropagation()" class="text-blue-400 hover:text-blue-300 underline decoration-dotted" title="فتح واتساب">${s.phone}</a>`
            : '<span class="text-slate-600">—</span>';

        return `
            <tr class="border-b border-slate-800/60 hover:bg-slate-800/20 transition cursor-pointer" onclick="openSupplierDetail('${s.id}')">
                <td class="p-1 lg:p-3 text-slate-500">${i + 1}</td>
                <td class="p-1 lg:p-3">
                    <div class="font-bold text-slate-200 text-[10px] lg:text-sm">${s.name}</div>
                    ${s.notes ? '<div class="text-[8px] text-slate-600 truncate max-w-[120px]">' + s.notes + '</div>' : ''}
                </td>
                <td class="p-1 lg:p-3 hidden sm:table-cell">${phoneHtml}</td>
                <td class="p-1 lg:p-3 text-slate-500 hidden md:table-cell text-[8px] lg:text-xs">${s.address || '—'}</td>
                <td class="p-1 lg:p-3 text-center">
                    <span class="text-emerald-400 font-bold">${purchases.toFixed(2)}</span>
                </td>
                <td class="p-1 lg:p-3 text-center">${debtBadge}</td>
                <td class="p-1 lg:p-3 text-center text-slate-500 hidden lg:table-cell">${txCount}</td>
                <td class="p-1 lg:p-3 text-center" onclick="event.stopPropagation()">
                    <div class="flex items-center justify-center gap-1">
                        ${s.phone ? `<button onclick="window.open('https://wa.me/2${s.phone}','_blank')" class="bg-green-600/20 hover:bg-green-600/30 text-green-400 px-1.5 py-1 rounded-lg text-[10px] transition" title="واتساب"><i class="fa-brands fa-whatsapp"></i></button>` : ''}
                        <button onclick="openSupplierDetail('${s.id}')" class="bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 px-1.5 py-1 rounded-lg text-[10px] transition" title="التفاصيل"><i class="fa-solid fa-eye"></i></button>
                        <button onclick="editSupplier('${s.id}')" class="bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 px-1.5 py-1 rounded-lg text-[10px] transition" title="تعديل"><i class="fa-solid fa-pen"></i></button>
                        <button onclick="deleteSupplier('${s.id}')" class="bg-red-600/20 hover:bg-red-600/30 text-red-400 px-1.5 py-1 rounded-lg text-[10px] transition" title="حذف"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// ===== قائمة الموردين في الـ Selects =====
function populateSupplierSelect(selectId, selectedValue) {
    const select = document.getElementById(selectId);
    if (!select) return;
    select.innerHTML = '<option value="">بدون مورد</option>';
    suppliers.forEach(s => {
        select.innerHTML += `<option value="${s.id}" ${s.id === selectedValue ? 'selected' : ''}>${s.name}</option>`;
    });
}

function updateSupplierSelects() {
    ['supplierPaymentSelect', 'supplierReturnSelect'].forEach(id => {
        const select = document.getElementById(id);
        if (!select) return;
        select.innerHTML = suppliers.map(s => `<option value="${s.id}">${s.name}${parseFloat(s.debt || 0) > 0 ? ' — مديونية: ' + parseFloat(s.debt).toFixed(2) + ' ج.م' : ''}</option>`).join('');
    });
}

function updatePaymentDebtHint() {
    const select = document.getElementById('supplierPaymentSelect');
    const hint = document.getElementById('paymentDebtHint');
    if (!select || !hint) return;
    const sup = suppliers.find(s => s.id === select.value);
    if (sup && parseFloat(sup.debt || 0) > 0) {
        hint.textContent = `المديونية الحالية: ${parseFloat(sup.debt).toFixed(2)} ج.م`;
        hint.classList.remove('hidden');
    } else {
        hint.classList.add('hidden');
    }
}

// ===== إضافة/تعديل مورد =====
function openAddSupplierModal() {
    if (!canEdit()) { showToastPermission(); return; }
    document.getElementById('supplierModalTitle').innerText = 'إضافة مورد جديد';
    document.getElementById('editSupplierId').value = '';
    document.getElementById('supplierName').value = '';
    document.getElementById('supplierPhone').value = '';
    document.getElementById('supplierAddress').value = '';
    document.getElementById('supplierNotes').value = '';
    document.getElementById('supplierModal').classList.remove('hidden');
    setTimeout(() => document.getElementById('supplierName')?.focus(), 100);
}

function editSupplier(id) {
    if (!canEdit()) { showToastPermission(); return; }
    const supplier = suppliers.find(s => s.id === id);
    if (!supplier) return;
    document.getElementById('supplierModalTitle').innerText = 'تعديل المورد';
    document.getElementById('editSupplierId').value = id;
    document.getElementById('supplierName').value = supplier.name;
    document.getElementById('supplierPhone').value = supplier.phone || '';
    document.getElementById('supplierAddress').value = supplier.address || '';
    document.getElementById('supplierNotes').value = supplier.notes || '';
    document.getElementById('supplierModal').classList.remove('hidden');
    setTimeout(() => document.getElementById('supplierName')?.focus(), 100);
}

async function saveSupplier() {
    if (!canEdit()) { showToastPermission(); return; }
    const name = document.getElementById('supplierName').value.trim();
    const phone = document.getElementById('supplierPhone').value.trim();
    const address = document.getElementById('supplierAddress').value.trim();
    const notes = document.getElementById('supplierNotes').value.trim();
    const editId = document.getElementById('editSupplierId').value;
    if (!name) { showToast('⚠️ يرجى إدخال اسم المورد', 'error'); return; }
    try {
        if (editId) {
            const updateData = { name, phone: phone || null, address: address || null, notes: notes || null };
            try {
                const { error } = await sb.from('suppliers').update(updateData).eq('id', editId);
                if (error) throw error;
            } catch (e) {
                await SyncManager.enqueue('suppliers', 'put', { id: editId, ...updateData });
            }
            const sup = suppliers.find(s => s.id === editId);
            if (sup) { sup.name = name; sup.phone = phone; sup.address = address; sup.notes = notes; }
        } else {
            const supData = { store_id: currentStoreId, name, phone: phone || null, address: address || null, notes: notes || null, total_purchases: 0, debt: 0 };
            let data;
            try {
                const result = await sb.from('suppliers').insert([supData]).select().single();
                if (result.error) throw result.error;
                data = result.data;
            } catch (e) {
                data = { ...supData, id: 'offline_' + Date.now(), created_at: new Date().toISOString() };
                await SyncManager.enqueue('suppliers', 'put', data);
                console.warn('📦 المورد حُفظ محلياً (أوفلاين)');
            }
            suppliers.push(data);
        }
        closeModal('supplierModal');
        renderSuppliersTable();
        updateSupplierSelects();
        updateSupplierSummary();
        showToast(editId ? '✅ تم تحديث المورد بنجاح' : '✅ تم إضافة المورد بنجاح', 'success');
    } catch (err) {
        showToast('❌ خطأ: ' + err.message, 'error');
    }
}

async function deleteSupplier(id) {
    if (!canEdit()) { showToastPermission(); return; }
    const supplier = suppliers.find(s => s.id === id);
    const name = supplier?.name || 'هذا المورد';
    const confirmed = await showConfirm(`هل أنت متأكد من حذف "${name}"؟\n سيتم حذف كل معاملاته أيضاً.`, 'حذف المورد', { danger: true });
    if (!confirmed) return;
    try {
        await sb.from('suppliers').delete().eq('id', id);
        suppliers = suppliers.filter(s => s.id !== id);
        supplierTransactions = supplierTransactions.filter(t => t.supplier_id !== id);
        renderSuppliersTable();
        updateSupplierSelects();
        updateSupplierSummary();
        showToast('🗑️ تم حذف المورد بنجاح', 'success');
    } catch (err) {
        showToast('❌ خطأ: ' + err.message, 'error');
    }
}

// ===== تسديد مديونية =====
function openSupplierPaymentModal() {
    if (!canEdit()) { showToastPermission(); return; }
    const debtSuppliers = suppliers.filter(s => parseFloat(s.debt || 0) > 0);
    if (debtSuppliers.length === 0) { showToast('⚠️ لا يوجد موردين لديهم مديونية', 'warning'); return; }
    updateSupplierSelects();
    document.getElementById('supplierPaymentAmount').value = '';
    document.getElementById('supplierPaymentNotes').value = '';
    document.getElementById('paymentDebtHint').classList.add('hidden');
    document.getElementById('supplierPaymentModal').classList.remove('hidden');
    setTimeout(() => document.getElementById('supplierPaymentAmount')?.focus(), 100);
}

async function saveSupplierPayment() {
    if (!canEdit()) { showToastPermission(); return; }
    const supplierId = document.getElementById('supplierPaymentSelect').value;
    const amount = parseFloat(document.getElementById('supplierPaymentAmount').value);
    const notes = document.getElementById('supplierPaymentNotes').value.trim();
    if (!supplierId) { showToast('⚠️ يرجى اختيار المورد', 'error'); return; }
    if (!amount || amount <= 0) { showToast('⚠️ يرجى إدخال مبلغ صحيح أكبر من صفر', 'error'); return; }
    const supplier = suppliers.find(s => s.id === supplierId);
    if (!supplier) { showToast('⚠️ المورد غير موجود', 'error'); return; }
    const currentDebt = parseFloat(supplier.debt || 0);
    if (amount > currentDebt) { showToast(`⚠️ المبلغ (${amount.toFixed(2)}) أكبر من المديونية (${currentDebt.toFixed(2)})`, 'error'); return; }
    try {
        const newDebt = currentDebt - amount;
        supplier.debt = newDebt;
        try {
            const { error } = await sb.from('suppliers').update({ debt: newDebt }).eq('id', supplierId);
            if (error) throw error;
        } catch (e) {
            await SyncManager.enqueue('suppliers', 'put', { id: supplierId, debt: newDebt });
        }
        try {
            await sb.from('supplier_transactions').insert([{
                supplier_id: supplierId, supplier_name: supplier.name, type: 'payment',
                amount, notes: notes || 'تسديد مديونية', store_id: currentStoreId
            }]);
        } catch (e) {
            await SyncManager.enqueue('supplier_transactions', 'put', {
                id: 'offline_' + Date.now(), supplier_id: supplierId, supplier_name: supplier.name,
                type: 'payment', amount, notes: notes || 'تسديد مديونية', store_id: currentStoreId
            });
        }
        supplierTransactions.push({
            id: 'local_' + Date.now(), supplier_id: supplierId, supplier_name: supplier.name,
            type: 'payment', amount, notes: notes || 'تسديد مديونية', store_id: currentStoreId, created_at: new Date().toISOString()
        });
        closeModal('supplierPaymentModal');
        renderSuppliersTable();
        updateSupplierSelects();
        updateSupplierSummary();
        showToast(`✅ تم تسديد ${amount.toFixed(2)} ج.م للمورد "${supplier.name}" — المتبقي: ${newDebt.toFixed(2)} ج.م`, 'success');
    } catch (err) {
        showToast('❌ خطأ: ' + err.message, 'error');
    }
}

// ===== مرتجع مورد =====
function openSupplierReturnModal() {
    if (!canEdit()) { showToastPermission(); return; }
    updateSupplierSelects();
    document.getElementById('supplierReturnProduct').value = '';
    document.getElementById('supplierReturnQty').value = '1';
    document.getElementById('supplierReturnAmount').value = '';
    document.getElementById('supplierReturnReason').value = '';
    populateProductDatalist('returnProductList');
    document.getElementById('supplierReturnModal').classList.remove('hidden');
    setTimeout(() => document.getElementById('supplierReturnProduct')?.focus(), 100);
}

async function saveSupplierReturn() {
    if (!requireShift()) return;
    if (!canEdit()) { showToastPermission(); return; }
    const supplierId = document.getElementById('supplierReturnSelect').value;
    const productName = document.getElementById('supplierReturnProduct').value.trim();
    const qty = parseInt(document.getElementById('supplierReturnQty').value) || 1;
    const amount = parseFloat(document.getElementById('supplierReturnAmount').value);
    const reason = document.getElementById('supplierReturnReason').value.trim();
    if (!supplierId) { showToast('⚠️ يرجى اختيار المورد', 'error'); return; }
    if (!productName) { showToast('⚠️ يرجى إدخال اسم المنتج المرتجع', 'error'); return; }
    if (!amount || amount <= 0) { showToast('⚠️ يرجى إدخال قيمة المرتجع', 'error'); return; }
    const supplier = suppliers.find(s => s.id === supplierId);
    if (!supplier) { showToast('⚠️ المورد غير موجود', 'error'); return; }
    try {
        const newDebt = parseFloat(supplier.debt || 0) + amount;
        supplier.debt = newDebt;
        try {
            const { error } = await sb.from('suppliers').update({ debt: newDebt }).eq('id', supplierId);
            if (error) throw error;
        } catch (e) {
            await SyncManager.enqueue('suppliers', 'put', { id: supplierId, debt: newDebt });
        }
        try {
            await sb.from('supplier_transactions').insert([{
                supplier_id: supplierId, supplier_name: supplier.name, type: 'return',
                product: productName, qty, amount, reason: reason || 'مرتجع', store_id: currentStoreId
            }]);
        } catch (e) {
            await SyncManager.enqueue('supplier_transactions', 'put', {
                id: 'offline_' + Date.now(), supplier_id: supplierId, supplier_name: supplier.name,
                type: 'return', product: productName, qty, amount, reason: reason || 'مرتجع', store_id: currentStoreId
            });
        }

        // ===== خصم الكمية من المخزن =====
        const existingProd = localProducts.find(p =>
            (p.title || p.product_name || '').toLowerCase() === productName.toLowerCase() && p.store_id === currentStoreId
        );
        let stockMsg = '';
        if (existingProd) {
            const oldStock = parseInt(existingProd.stock) || 0;
            const newStock = Math.max(0, oldStock - qty);
            try {
                const { error } = await sb.from('products').update({ stock: newStock }).eq('id', existingProd.id);
                if (error) throw error;
            } catch (e) {
                await SyncManager.enqueue('products', 'put', { id: existingProd.id, stock: newStock });
            }
            existingProd.stock = newStock;
            await LocalDB.put('products', { ...existingProd, stock: newStock });
            stockMsg = ` | تم خصم ${qty} من "${productName}" (${oldStock} → ${newStock})`;
        } else {
            stockMsg = ` | ⚠️ المنتج "${productName}" غير موجود في المخزن`;
        }

        supplierTransactions.push({
            id: 'local_' + Date.now(), supplier_id: supplierId, supplier_name: supplier.name,
            type: 'return', product: productName, qty, amount, reason: reason || 'مرتجع', store_id: currentStoreId, created_at: new Date().toISOString()
        });
        closeModal('supplierReturnModal');
        renderSuppliersTable();
        updateSupplierSelects();
        updateSupplierSummary();
        showToast(`✅ تم تسجيل مرتجع "${productName}" × ${qty} بقيمة ${amount.toFixed(2)} ج.م${stockMsg}`, 'success');
    } catch (err) {
        showToast('❌ خطأ: ' + err.message, 'error');
    }
}

// ===== تفاصيل المورد =====
function openSupplierDetail(supplierId) {
    const supplier = suppliers.find(s => s.id === supplierId);
    if (!supplier) return;
    const supTx = supplierTransactions.filter(t => t.supplier_id === supplierId).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    const supProducts = localProducts.filter(p => p.supplier_id === supplierId);
    const totalPurchases = supTx.filter(t => t.type === 'purchase').reduce((s, t) => s + parseFloat(t.amount || 0), 0);
    const totalPayments = supTx.filter(t => t.type === 'payment').reduce((s, t) => s + parseFloat(t.amount || 0), 0);
    const totalReturns = supTx.filter(t => t.type === 'return').reduce((s, t) => s + parseFloat(t.amount || 0), 0);
    const debt = parseFloat(supplier.debt || 0);

    document.getElementById('supplierDetailTitle').textContent = supplier.name;

    let html = `
        <div class="bg-[#090d16] rounded-xl p-4 border border-slate-800">
            <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                    <h4 class="text-base font-bold text-white">${supplier.name}</h4>
                    <p class="text-[10px] text-slate-400 mt-1">
                        ${supplier.phone ? '📞 ' + supplier.phone : ''}
                        ${supplier.address ? ' | 📍 ' + supplier.address : ''}
                    </p>
                    ${supplier.notes ? '<p class="text-[10px] text-slate-500 mt-1">📝 ' + supplier.notes + '</p>' : ''}
                </div>
                <div class="flex gap-2">
                    ${supplier.phone ? `<a href="https://wa.me/2${supplier.phone}" target="_blank" class="bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-500/30 px-3 py-1.5 rounded-xl text-[10px] font-bold transition"><i class="fa-brands fa-whatsapp ml-1"></i> واتساب</a>` : ''}
                    <button onclick="openSupplierPurchaseModal('${supplier.id}')" class="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-[10px] font-bold transition">
                        <i class="fa-solid fa-cart-plus ml-1"></i> مشتريات
                    </button>
                </div>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div class="bg-[#0f1524] rounded-lg p-3 text-center">
                    <p class="text-[8px] text-slate-500 mb-1">إجمالي المشتريات</p>
                    <p class="text-sm font-bold text-emerald-400">${totalPurchases.toFixed(2)} ج.م</p>
                </div>
                <div class="bg-[#0f1524] rounded-lg p-3 text-center">
                    <p class="text-[8px] text-slate-500 mb-1">التسديدات</p>
                    <p class="text-sm font-bold text-blue-400">${totalPayments.toFixed(2)} ج.م</p>
                </div>
                <div class="bg-[#0f1524] rounded-lg p-3 text-center">
                    <p class="text-[8px] text-slate-500 mb-1">المرتجعات</p>
                    <p class="text-sm font-bold text-red-400">${totalReturns.toFixed(2)} ج.م</p>
                </div>
                <div class="bg-[#0f1524] rounded-lg p-3 text-center">
                    <p class="text-[8px] text-slate-500 mb-1">المديونية الحالية</p>
                    <p class="text-sm font-bold ${debt > 0 ? 'text-red-400' : 'text-emerald-400'}">${debt.toFixed(2)} ج.م</p>
                </div>
            </div>
        </div>

        <div class="flex gap-2 mb-3">
            <button onclick="switchSupplierDetailTab('tx', this)" class="supplier-detail-tab bg-amber-600/30 text-amber-400 border border-amber-500/30 px-3 py-1.5 rounded-xl text-[10px] font-bold transition" data-tab="tx">المعاملات (${supTx.length})</button>
            <button onclick="switchSupplierDetailTab('products', this)" class="supplier-detail-tab bg-slate-800/40 text-slate-400 px-3 py-1.5 rounded-xl text-[10px] font-bold transition" data-tab="products">المنتجات المرتبطة (${supProducts.length})</button>
        </div>

        <div id="supplierDetailTxTab" class="supplier-detail-content">
    `;

    if (supTx.length === 0) {
        html += '<div class="text-center py-8 text-slate-500 text-[10px]">لا توجد معاملات مسجلة لهذا المورد</div>';
    } else {
        html += '<div class="space-y-1">';
        supTx.forEach(tx => {
            const date = new Date(tx.created_at || tx.date || Date.now()).toLocaleString('ar-EG');
            let typeIcon = '📝', typeColor = 'text-slate-400', typeLabel = tx.type, bgColor = 'bg-slate-500/10';
            if (tx.type === 'purchase') { typeIcon = '🛒'; typeColor = 'text-emerald-400'; typeLabel = 'مشتريات'; bgColor = 'bg-emerald-500/10'; }
            else if (tx.type === 'payment') { typeIcon = '💰'; typeColor = 'text-blue-400'; typeLabel = 'تسديد'; bgColor = 'bg-blue-500/10'; }
            else if (tx.type === 'return') { typeIcon = '↩️'; typeColor = 'text-red-400'; typeLabel = 'مرتجع'; bgColor = 'bg-red-500/10'; }
            html += `
                <div class="bg-[#090d16] rounded-lg p-3 flex flex-wrap justify-between items-center text-[10px] gap-2 border border-slate-800/50">
                    <div class="flex items-center gap-2">
                        <span class="w-7 h-7 ${bgColor} rounded-lg flex items-center justify-center text-xs">${typeIcon}</span>
                        <div>
                            <span class="${typeColor} font-bold block">${typeLabel}</span>
                            ${tx.product ? '<span class="text-slate-500 text-[8px]">' + tx.product + (tx.qty ? ' × ' + tx.qty : '') + '</span>' : ''}
                        </div>
                    </div>
                    <div class="text-left">
                        <span class="text-white font-bold block">${parseFloat(tx.amount || 0).toFixed(2)} ج.م</span>
                        ${tx.notes ? '<span class="text-slate-500 text-[8px]">' + tx.notes + '</span>' : ''}
                        <span class="text-slate-600 text-[8px] block">${date}</span>
                    </div>
                </div>
            `;
        });
        html += '</div>';
    }
    html += '</div>';

    html += '<div id="supplierDetailProductsTab" class="supplier-detail-content hidden">';
    if (supProducts.length === 0) {
        html += '<div class="text-center py-8 text-slate-500 text-[10px]">لا توجد منتجات مسجلة من هذا المورد</div>';
    } else {
        html += '<div class="space-y-1">';
        supProducts.forEach(p => {
            const name = p.title || p.product_name;
            const stockClass = p.stock <= 0 ? 'text-red-400' : p.stock <= 5 ? 'text-amber-400' : 'text-emerald-400';
            html += `
                <div class="bg-[#090d16] rounded-lg p-3 flex flex-wrap justify-between items-center text-[10px] gap-2 border border-slate-800/50">
                    <span class="text-white font-bold">${name}</span>
                    <div class="flex items-center gap-3">
                        <span class="text-slate-400">شراء: ${parseFloat(p.purchase_price || 0).toFixed(2)} | بيع: ${parseFloat(p.sell_price || p.price || 0).toFixed(2)}</span>
                        <span class="${stockClass} font-bold">الكمية: ${p.stock}</span>
                    </div>
                </div>
            `;
        });
        html += '</div>';
    }
    html += '</div>';

    document.getElementById('supplierDetailContent').innerHTML = html;
    document.getElementById('supplierDetailModal').classList.remove('hidden');
}

function switchSupplierDetailTab(tab, btn) {
    document.querySelectorAll('.supplier-detail-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.supplier-detail-tab').forEach(el => { el.classList.remove('bg-amber-600/30', 'text-amber-400', 'border', 'border-amber-500/30'); el.classList.add('bg-slate-800/40', 'text-slate-400'); });
    if (btn) { btn.classList.remove('bg-slate-800/40', 'text-slate-400'); btn.classList.add('bg-amber-600/30', 'text-amber-400', 'border', 'border-amber-500/30'); }
    if (tab === 'tx') document.getElementById('supplierDetailTxTab').classList.remove('hidden');
    if (tab === 'products') document.getElementById('supplierDetailProductsTab').classList.remove('hidden');
}

// ===== توليد قوائم المنتجات للـ Datalist =====
function populateProductDatalist(datalistId) {
    const dl = document.getElementById(datalistId);
    if (!dl) return;
    dl.innerHTML = localProducts.map(p => `<option value="${p.title || p.product_name}">`).join('');
}

// ===== تسجيل مشتريات =====
function openSupplierPurchaseModal(supplierId) {
    if (!canEdit()) { showToastPermission(); return; }
    document.getElementById('purchaseSupplierId').value = supplierId || '';
    document.getElementById('purchaseProduct').value = '';
    document.getElementById('purchaseQty').value = '1';
    document.getElementById('purchaseUnitPrice').value = '';
    document.getElementById('purchaseSellPrice').value = '';
    document.getElementById('purchaseTotal').value = '';
    document.getElementById('purchaseNotes').value = '';
    populateProductDatalist('purchaseProductList');
    document.getElementById('supplierPurchaseModal').classList.remove('hidden');
    setTimeout(() => document.getElementById('purchaseProduct')?.focus(), 100);
}

async function saveSupplierPurchase() {
    if (!requireShift()) return;
    if (!canEdit()) { showToastPermission(); return; }
    const supplierId = document.getElementById('purchaseSupplierId').value;
    const productName = document.getElementById('purchaseProduct').value.trim();
    const qty = parseInt(document.getElementById('purchaseQty').value) || 1;
    const unitPrice = parseFloat(document.getElementById('purchaseUnitPrice').value) || 0;
    const sellPrice = parseFloat(document.getElementById('purchaseSellPrice').value) || 0;
    const total = parseFloat(document.getElementById('purchaseTotal').value) || (qty * unitPrice);
    const notes = document.getElementById('purchaseNotes').value.trim();
    if (!productName) { showToast('⚠️ يرجى إدخال اسم المنتج', 'error'); return; }
    if (!total || total <= 0) { showToast('⚠️ يرجى إدخال قيمة المشتريات', 'error'); return; }
    const supplier = suppliers.find(s => s.id === supplierId);
    if (!supplier) { showToast('⚠️ المورد غير موجود', 'error'); return; }
    try {
        const newTotalPurchases = (parseFloat(supplier.total_purchases || 0)) + total;
        const newDebt = (parseFloat(supplier.debt || 0)) + total;
        supplier.total_purchases = newTotalPurchases;
        supplier.debt = newDebt;
        try {
            const { error } = await sb.from('suppliers').update({ total_purchases: newTotalPurchases, debt: newDebt }).eq('id', supplierId);
            if (error) throw error;
        } catch (e) {
            await SyncManager.enqueue('suppliers', 'put', { id: supplierId, total_purchases: newTotalPurchases, debt: newDebt });
        }
        try {
            await sb.from('supplier_transactions').insert([{
                store_id: currentStoreId, supplier_id: supplierId, supplier_name: supplier.name,
                type: 'purchase', product: productName, qty, amount: total, unit_price: unitPrice,
                notes: notes || 'مشتريات'
            }]);
        } catch (e) {
            await SyncManager.enqueue('supplier_transactions', 'put', {
                id: 'offline_' + Date.now(), store_id: currentStoreId, supplier_id: supplierId,
                supplier_name: supplier.name, type: 'purchase', product: productName, qty, amount: total,
                unit_price: unitPrice, notes: notes || 'مشتريات'
            });
        }

        // ===== تحديث/إضافة المنتج في المخزن =====
        const existingProd = localProducts.find(p =>
            (p.title || p.product_name || '').toLowerCase() === productName.toLowerCase() && p.store_id === currentStoreId
        );
        if (existingProd) {
            const newStock = (parseInt(existingProd.stock) || 0) + qty;
            const updateData = { stock: newStock, supplier_id: supplierId };
            if (unitPrice > 0) updateData.purchase_price = unitPrice;
            if (sellPrice > 0) { updateData.sell_price = sellPrice; updateData.price = sellPrice; }
            try {
                const { error } = await sb.from('products').update(updateData).eq('id', existingProd.id);
                if (error) throw error;
            } catch (e) {
                await SyncManager.enqueue('products', 'put', { id: existingProd.id, ...updateData });
            }
            existingProd.stock = newStock;
            if (unitPrice > 0) existingProd.purchase_price = unitPrice;
            if (sellPrice > 0) { existingProd.sell_price = sellPrice; existingProd.price = sellPrice; }
            existingProd.supplier_id = supplierId;
            await LocalDB.put('products', { ...existingProd });
        } else {
            const finalSellPrice = sellPrice > 0 ? sellPrice : (unitPrice > 0 ? unitPrice * 1.3 : 0);
            const newProd = {
                store_id: currentStoreId, product_name: productName, title: productName,
                stock: qty, purchase_price: unitPrice, sell_price: finalSellPrice,
                price: finalSellPrice, supplier_id: supplierId, barcode: ''
            };
            let createdProd;
            try {
                const result = await sb.from('products').insert([newProd]).select().single();
                if (result.error) throw result.error;
                createdProd = result.data;
            } catch (e) {
                createdProd = { ...newProd, id: 'offline_' + Date.now() };
                await SyncManager.enqueue('products', 'put', createdProd);
            }
            localProducts.push(createdProd);
            await LocalDB.put('products', createdProd);
        }

        supplierTransactions.push({
            id: 'local_' + Date.now(), store_id: currentStoreId, supplier_id: supplierId,
            supplier_name: supplier.name, type: 'purchase', product: productName, qty, amount: total,
            unit_price: unitPrice, notes: notes || 'مشتريات', created_at: new Date().toISOString()
        });
        closeModal('supplierPurchaseModal');
        renderSuppliersTable();
        updateSupplierSelects();
        updateSupplierSummary();
        if (document.getElementById('supplierDetailModal').classList.contains('hidden') === false) {
            openSupplierDetail(supplierId);
        }
        const actionText = existingProd ? `تم تحديث "${productName}" في المخزن (+${qty} = ${existingProd.stock})` : `تمت إضافة "${productName}" للمخزن (${qty})`;
        showToast(`✅ ${actionText}`, 'success');
    } catch (err) {
        showToast('❌ خطأ: ' + err.message, 'error');
    }
}

// ===== تصدير CSV =====
function exportSuppliers() {
    if (suppliers.length === 0) { showToast('⚠️ لا يوجد بيانات للتصدير', 'warning'); return; }
    const headers = ['#', 'اسم المورد', 'التليفون', 'العنوان', 'إجمالي المشتريات', 'المديونية', 'ملاحظات'];
    const rows = suppliers.map((s, i) => [
        i + 1, s.name, s.phone || '', s.address || '',
        s.total_purchases || 0, s.debt || 0, s.notes || ''
    ]);
    let csv = '\uFEFF' + headers.join(',') + '\n';
    rows.forEach(r => { csv += r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(',') + '\n'; });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `suppliers_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    showToast('✅ تم تصدير البيانات بنجاح', 'success');
}
