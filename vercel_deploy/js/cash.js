// TAGGER PRO V6 - Cash Wallet & Transactions (Multi-Wallet)

let cashTransactions = [];
let wallets = [];
let selectedWalletId = null; // null = all wallets

// ===== تحميل المحافظ من Supabase =====
async function loadWallets() {
    try {
        const { data, error } = await sb.from('wallets')
            .select('*')
            .eq('store_id', currentStoreId)
            .order('created_at', { ascending: true });
        if (!error && data) {
            wallets = data;
            renderWalletCards();
        }
    } catch(e) {
        console.error("خطأ في تحميل المحافظ:", e);
    }
}

// ===== إضافة محفظة جديدة =====
async function saveNewWallet() {
    if (!canEdit()) { showToastPermission(); return; }
    const name = document.getElementById('wName').value.trim();
    const balance = parseFloat(document.getElementById('wBalance').value) || 0;
    const daily = parseFloat(document.getElementById('wDaily').value) || 0;
    const monthly = parseFloat(document.getElementById('wMonthly').value) || 0;

    if (!name) { showToast('⚠️ برجاء إدخال اسم المحفظة', 'error'); return; }

    try {
        const editingId = document.getElementById('walletEditId')?.value;
        if (editingId) {
            // تعديل محفظة موجودة
            await sb.from('wallets').update({ name, balance, daily_limit: daily, monthly_limit: monthly }).eq('id', editingId);
            const w = wallets.find(w => w.id === editingId);
            if (w) { w.name = name; w.balance = balance; w.daily_limit = daily; w.monthly_limit = monthly; }
            showToast('✅ تم تعديل المحفظة', 'success');
        } else {
            // إضافة محفظة جديدة
            const { data, error } = await sb.from('wallets').insert([{
                store_id: currentStoreId, name, balance,
                daily_limit: daily, monthly_limit: monthly
            }]).select().single();
            if (error) throw error;
            wallets.push(data);
            showToast('✅ تمت إضافة المحفظة', 'success');
        }
        closeWalletModal();
        renderWalletCards();
        updateCashStats();
        populateWalletSelect();
    } catch(e) {
        showToast('❌ خطأ: ' + e.message, 'error');
    }
}

// ===== حذف محفظة =====
async function deleteWallet(id) {
    if (!canEdit()) { showToastPermission(); return; }
    const confirmed = await showConfirm('هل أنت متأكد من حذف هذه المحفظة؟\nالعمليات المرتبطة هتفضل موجودة بس من غير محفظة.', 'حذف المحفظة', { danger: true });
    if (!confirmed) return;
    try {
        await sb.from('wallets').delete().eq('id', id);
        wallets = wallets.filter(w => w.id !== id);
        if (selectedWalletId === id) selectedWalletId = null;
        renderWalletCards();
        updateCashStats();
        populateWalletSelect();
        showToast('✅ تم حذف المحفظة', 'success');
    } catch(e) {
        showToast('❌ خطأ: ' + e.message, 'error');
    }
}

// ===== فتح مودال إضافة/تعديل محفظة =====
function openWalletModal(editId) {
    const modal = document.getElementById('walletModal');
    const titleEl = document.getElementById('walletModalTitle');
    const editIdInput = document.getElementById('walletEditId');

    document.getElementById('wName').value = '';
    document.getElementById('wBalance').value = '';
    document.getElementById('wDaily').value = '';
    document.getElementById('wMonthly').value = '';
    if (editIdInput) editIdInput.value = '';

    if (editId) {
        const w = wallets.find(w => w.id === editId);
        if (w) {
            document.getElementById('wName').value = w.name;
            document.getElementById('wBalance').value = w.balance;
            document.getElementById('wDaily').value = w.daily_limit;
            document.getElementById('wMonthly').value = w.monthly_limit;
            if (editIdInput) editIdInput.value = editId;
            if (titleEl) titleEl.textContent = '✏️ تعديل المحفظة';
        }
    } else {
        if (titleEl) titleEl.textContent = '➕ إضافة محفظة جديدة';
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeWalletModal() {
    const modal = document.getElementById('walletModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

// ===== عرض كروت المحافظ =====
function renderWalletCards() {
    const container = document.getElementById('walletCardsContainer');
    if (!container) return;

    if (wallets.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-8 text-slate-500">
                <i class="fa-solid fa-wallet text-3xl mb-3 block opacity-30"></i>
                <p class="text-sm">مفيش محافظ مضافة بعد</p>
                <button onclick="openWalletModal()" class="mt-3 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 px-4 py-2 rounded-xl text-xs font-bold transition">
                    <i class="fa-solid fa-plus"></i> أضف أول محفظة
                </button>
            </div>`;
        return;
    }

    container.innerHTML = wallets.map(w => {
        const isSelected = selectedWalletId === w.id;
        const todayTrans = cashTransactions.filter(t => t.wallet_id === w.id && new Date(t.created_at) >= new Date(new Date().setHours(0,0,0,0)));
        const todayCount = todayTrans.length;
        return `
        <div class="relative bg-gradient-to-br from-slate-900 to-slate-950 border ${isSelected ? 'border-emerald-500 ring-2 ring-emerald-500/30' : 'border-slate-800'} p-4 rounded-2xl cursor-pointer transition hover:border-accent shadow-xl min-h-[120px]"
             onclick="selectWallet('${w.id}')">
            <div class="flex justify-between items-start mb-2">
                <div>
                    <span class="text-[10px] text-slate-400 block">${w.name}</span>
                    <div class="text-xl font-black text-white">${parseFloat(w.balance || 0).toFixed(2)} <span class="text-xs">ج.م</span></div>
                </div>
                <div class="flex gap-1">
                    <button onclick="event.stopPropagation(); openWalletModal('${w.id}')" class="bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 px-2 py-1 rounded-lg text-[10px] transition" title="تعديل">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button onclick="event.stopPropagation(); deleteWallet('${w.id}')" class="bg-red-600/20 hover:bg-red-600/30 text-red-400 px-2 py-1 rounded-lg text-[10px] transition" title="حذف">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="space-y-1 border-t border-slate-800/60 pt-2 mt-2">
                <div class="text-[10px] text-amber-400 font-bold flex justify-between">
                    <span>ليميت يومي:</span><span>${parseFloat(w.daily_limit || 0).toFixed(0)} ج.م</span>
                </div>
                <div class="text-[10px] text-purple-400 font-bold flex justify-between">
                    <span>ليميت شهري:</span><span>${parseFloat(w.monthly_limit || 0).toFixed(0)} ج.م</span>
                </div>
            </div>
            ${todayCount > 0 ? `<span class="absolute top-2 left-2 bg-emerald-600 text-white text-[8px] px-1.5 py-0.5 rounded-full font-bold">${todayCount} عملية اليوم</span>` : ''}
            ${isSelected ? '<span class="absolute bottom-2 left-2 text-emerald-400 text-[8px] font-bold"><i class="fa-solid fa-check-circle"></i> محددة</span>' : ''}
        </div>`;
    }).join('');
}

// ===== تحديد محفظة =====
function selectWallet(id) {
    selectedWalletId = selectedWalletId === id ? null : id;
    renderWalletCards();
    renderCashWalletTable();
    updateCashStats();
}

// ===== قائمة منسدلة للمحافظ في فورم العملية =====
function populateWalletSelect() {
    const sel = document.getElementById('tcWalletId');
    if (!sel) return;
    sel.innerHTML = '<option value="">— اختر محفظة —</option>' +
        wallets.map(w => `<option value="${w.id}">${w.name}</option>`).join('');
    if (selectedWalletId) sel.value = selectedWalletId;
}

// ===== تحميل العمليات =====
async function loadCashTransactions() {
    try {
        let local = await SmartLoader.getLocalData('cash_transactions');
        cashTransactions = local.filter(t => t.store_id === currentStoreId)
            .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
        if (cashTransactions.length === 0 && SyncManager.isOnline) {
            await SmartLoader.syncTable('cash_transactions', currentStoreId, true);
            local = await SmartLoader.getLocalData('cash_transactions');
            cashTransactions = local.filter(t => t.store_id === currentStoreId)
                .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
        }
        await persistAutoCalculatedFees();
        renderCashWalletTable();
        updateCashStats();
        if (SyncManager.isOnline) {
            SmartLoader.syncTable('cash_transactions', currentStoreId).then(async synced => {
                if (synced.length > 0) {
                    const full = await SmartLoader.getLocalData('cash_transactions');
                    cashTransactions = full.filter(t => t.store_id === currentStoreId)
                        .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
                    await persistAutoCalculatedFees();
                    renderCashWalletTable();
                    updateCashStats();
                }
            });
        }
    } catch(e) {
        console.error("خطأ في تحميل كاش:", e);
    }
}

// ===== حفظ العمولات التلقائية =====
async function persistAutoCalculatedFees() {
    for (const t of cashTransactions) {
        let amount = parseFloat(t.amount || 0);
        if (amount === 0 && t.notes) {
            const m = t.notes.match(/(?:مبلغ|تحويل)\s+([\d\.]+)/);
            if (m) amount = parseFloat(m[1]);
        }
        if ((parseFloat(t.fee || 0) === 0) && amount > 0) {
            const fee = Math.max(10, amount * 0.01);
            const profit = fee * 0.6;
            t.fee = fee;
            t.profit = profit;
            sb.from('cash_transactions').update({ fee, profit }).eq('id', t.id).then(() => {});
        }
    }
}

// ===== فتح/إغلاق لوحة الكاش =====
function openCashWallet() {
    document.getElementById('cashWalletTab').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    Promise.all([loadWallets(), loadCashTransactions()]).then(() => {
        populateWalletSelect();
        renderWalletCards();
    });
}

function closeCashWallet() {
    document.getElementById('cashWalletTab').classList.add('hidden');
    document.body.style.overflow = 'auto';
}

// ===== فتح مودال عملية جديدة =====
function openNewCashTransactionModal() {
    if (!canEdit()) { showToastPermission(); return; }
    populateWalletSelect();
    document.getElementById('tcType').value = 'deposit';
    document.getElementById('tcAmount').value = '';
    document.getElementById('tcClientPhone').value = '';
    document.getElementById('tcFee').value = '5';
    document.getElementById('tcProfit').value = '3';
    document.getElementById('tcNotes').value = '';
    document.getElementById('newCashTransactionModal').classList.remove('hidden');
}

// ===== حفظ عملية يدوية =====
async function saveManualCashTransaction() {
    if (!requireShift()) return;
    if (!canEdit()) { showToastPermission(); return; }
    const type = document.getElementById('tcType').value;
    const amount = parseFloat(document.getElementById('tcAmount').value);
    const phone = document.getElementById('tcClientPhone').value.trim();
    const fee = parseFloat(document.getElementById('tcFee').value) || 0;
    const profit = parseFloat(document.getElementById('tcProfit').value) || 0;
    const notes = document.getElementById('tcNotes').value.trim();
    const walletId = document.getElementById('tcWalletId')?.value || null;

    if (!amount || amount <= 0 || !phone) {
        showToast('⚠️ برجاء إدخال المبلغ ورقم العميل', 'error');
        return;
    }

    if (!walletId) {
        showToast('⚠️ برجاء اختيار المحافظة', 'error');
        return;
    }

    try {
        const txData = {
            store_id: currentStoreId,
            wallet_id: walletId,
            transaction_type: type,
            amount, client_phone: phone, fee, profit,
            notes: notes || 'عملية يدوية',
            shift_id: currentShift ? currentShift.id : null
        };
        let data;
        try {
            const result = await sb.from('cash_transactions').insert([txData]).select().single();
            if (result.error) throw result.error;
            data = result.data;
        } catch(e) {
            data = { ...txData, id: 'offline_' + Date.now() };
            await SyncManager.enqueue('cash_transactions', 'put', data);
            console.warn('📦 العملية حُفظت محلياً (أوفلاين)');
        }

        cashTransactions.unshift(data);
        closeModal('newCashTransactionModal');
        renderCashWalletTable();
        updateCashStats();
        renderWalletCards();
        updateShiftStats();
        updateShiftUI();
        showToast('✅ تم تسجيل العملية' + (data.id?.toString().startsWith('offline_') ? ' (محلي)' : ''), 'success');
        logActivity('عملية مالية', `${type === 'income' ? 'إيداع' : 'سحب'} - ${amount} ج.م - ${category || ''} - ${note || ''}`, 'payment');
    } catch(e) {
        showToast('❌ خطأ: ' + e.message, 'error');
    }
}

// ===== حذف عملية =====
async function deleteCashTransaction(id) {
    if (!canEdit()) { showToastPermission(); return; }
    const confirmed = await showConfirm('هل أنت متأكد من حذف هذه العملية؟', 'حذف العملية', { danger: true });
    if (!confirmed) return;
    try {
        await sb.from('cash_transactions').delete().eq('id', id);
        cashTransactions = cashTransactions.filter(t => t.id !== id);
        renderCashWalletTable();
        updateCashStats();
        renderWalletCards();
        updateShiftStats();
        updateShiftUI();
        showToast('✅ تم حذف العملية', 'success');
    } catch(e) {
        showToast('❌ خطأ: ' + e.message, 'error');
    }
}

// ===== جدول العمليات =====
function renderCashWalletTable() {
    const tbody = document.getElementById('cashWalletTableBody');
    if (!tbody) return;

    const filtered = selectedWalletId
        ? cashTransactions.filter(t => t.wallet_id === selectedWalletId)
        : cashTransactions;

    tbody.innerHTML = filtered.map((t, index) => {
        let amount = parseFloat(t.amount || 0);
        let phone = t.client_phone || '—';
        let isDeposit = t.transaction_type === 'deposit' || t.transaction_type === 'استلام';
        let fee = parseFloat(t.fee || 0);
        let profit = parseFloat(t.profit || 0);
        const wallet = wallets.find(w => w.id === t.wallet_id);

        if (amount === 0 && t.notes) {
            if (t.notes.includes('استلام') || t.notes.includes('إيداع')) isDeposit = true;
            else if (t.notes.includes('تحويل') || t.notes.includes('سحب')) isDeposit = false;
            const amountMatch = t.notes.match(/(?:مبلغ|تحويل)\s+([\d\.]+)/);
            if (amountMatch) amount = parseFloat(amountMatch[1]);
            const phoneMatch = t.notes.match(/(?:رقم|لرقم)\s+(\d+)/);
            if (phoneMatch) phone = phoneMatch[1];
        }

        if (fee === 0 && amount > 0) {
            fee = Math.max(10, amount * 0.01);
            profit = fee * 0.6;
        }

        return `
            <tr class="border-b border-slate-800/60 hover:bg-slate-800/20 transition text-slate-300">
                <td class="p-3">${index + 1}</td>
                <td class="p-3">
                    <span class="font-bold ${isDeposit ? 'text-emerald-400' : 'text-blue-400'}">
                        ${isDeposit ? '📈 إيداع' : '📉 سحب'}
                    </span>
                    ${wallet ? `<span class="text-[9px] text-slate-500 block">${wallet.name}</span>` : ''}
                </td>
                <td class="p-3 font-black">${amount.toFixed(2)} ج.م</td>
                <td class="p-3 text-center text-slate-400 font-mono">${phone}</td>
                <td class="p-3 text-center text-amber-400 font-bold">${fee.toFixed(2)} ج.م</td>
                <td class="p-3 text-center text-purple-400 font-bold">${profit.toFixed(2)} ج.م</td>
                <td class="p-3 text-slate-400 text-[10px]">${new Date(t.created_at).toLocaleString('ar-EG')}</td>
                <td class="p-3 text-slate-500 text-[10px] max-w-[200px] truncate" title="${t.notes || ''}">${t.notes || '—'}</td>
                <td class="p-3 text-center">
                    <button onclick="deleteCashTransaction('${t.id}')" class="bg-red-600/20 hover:bg-red-600/30 text-red-400 px-2 py-1 rounded-lg text-[10px] transition">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>`;
    }).join('');

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="p-8 text-center text-slate-500 text-sm">مفيش عمليات ${selectedWalletId ? 'لهذه المحفظة' : ''}</td></tr>`;
    }
}

// ===== تحديث الإحصائيات =====
function updateCashStats() {
    let totalDeposits = 0, totalWithdraws = 0, totalFees = 0, totalProfit = 0;

    const txList = selectedWalletId
        ? cashTransactions.filter(t => t.wallet_id === selectedWalletId)
        : cashTransactions;

    txList.forEach(t => {
        let amount = parseFloat(t.amount || 0);
        let fee = parseFloat(t.fee || 0);
        let profit = parseFloat(t.profit || 0);
        let isDeposit = t.transaction_type === 'deposit' || t.transaction_type === 'استلام';

        if (amount === 0 && t.notes) {
            if (t.notes.includes('استلام') || t.notes.includes('إيداع')) isDeposit = true;
            else if (t.notes.includes('تحويل') || t.notes.includes('سحب')) isDeposit = false;
            const m = t.notes.match(/(?:مبلغ|تحويل)\s+([\d\.]+)/);
            if (m) amount = parseFloat(m[1]);
        }
        if (fee === 0 && amount > 0) { fee = Math.max(10, amount * 0.01); profit = fee * 0.6; }

        if (isDeposit) totalDeposits += amount; else totalWithdraws += amount;
        totalFees += fee;
        totalProfit += profit;
    });

    // ملخص المحافظة المحددة
    const walletInfo = selectedWalletId ? wallets.find(w => w.id === selectedWalletId) : null;
    const walletBalance = walletInfo ? parseFloat(walletInfo.balance || 0) : 0;
    const walletDaily = walletInfo ? parseFloat(walletInfo.daily_limit || 0) : 0;
    const walletMonthly = walletInfo ? parseFloat(walletInfo.monthly_limit || 0) : 0;

    // حساب رصيد المحفظة من العمليات
    let computedBalance = walletBalance;
    if (walletInfo) {
        txList.forEach(t => {
            let amount = parseFloat(t.amount || 0);
            let isDeposit = t.transaction_type === 'deposit' || t.transaction_type === 'استلام';
            if (amount === 0 && t.notes) {
                if (t.notes.includes('استلام') || t.notes.includes('إيداع')) isDeposit = true;
                else if (t.notes.includes('تحويل') || t.notes.includes('سحب')) isDeposit = false;
                const m = t.notes.match(/(?:مبلغ|تحويل)\s+([\d\.]+)/);
                if (m) amount = parseFloat(m[1]);
            }
            computedBalance += isDeposit ? amount : -amount;
        });
    }

    const el = id => document.getElementById(id);

    if (el('cashTotalDeposit')) el('cashTotalDeposit').innerText = totalDeposits.toFixed(2) + ' ج.م';
    if (el('cashTotalWithdraw')) el('cashTotalWithdraw').innerText = totalWithdraws.toFixed(2) + ' ج.م';
    if (el('cashTotalFees')) el('cashTotalFees').innerText = totalFees.toFixed(2) + ' ج.م';
    if (el('cashTotalProfit')) el('cashTotalProfit').innerText = totalProfit.toFixed(2) + ' ج.م';

    if (el('walletBalance')) el('walletBalance').innerText = selectedWalletId ? computedBalance.toFixed(2) + ' ج.م' : '—';
    if (el('dailyLimitText')) el('dailyLimitText').innerHTML = `<span>المتبقي اليوم:</span><span>${selectedWalletId ? walletDaily.toFixed(0) + ' ج.م' : '—'}</span>`;
    if (el('monthlyLimitText')) el('monthlyLimitText').innerHTML = `<span>المتبقي الشهري:</span><span>${selectedWalletId ? walletMonthly.toFixed(0) + ' ج.م' : '—'}</span>`;

    // تحديث الشارة
    const cashBadgeEl = el('cashBadge');
    if (cashBadgeEl) {
        const todayCount = cashTransactions.filter(t => new Date(t.created_at) >= new Date(new Date().setHours(0,0,0,0))).length;
        cashBadgeEl.textContent = todayCount;
        cashBadgeEl.style.display = todayCount > 0 ? '' : 'none';
    }
}

// ===== تحميل أولي =====
loadWallets();
loadCashTransactions();
