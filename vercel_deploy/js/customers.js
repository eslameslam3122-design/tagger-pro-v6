// TAGGER PRO V6 - Customers & Loyalty

function updateCustomerSelect() {
    const select = document.getElementById('invoiceCustomer');
    select.innerHTML = `<option value="نقدي">👤 عميل نقدي</option>`;
    allCustomers.forEach(c => {
        const debt = parseFloat(c.total_debt || 0);
        select.innerHTML += `<option value="${c.id}">👤 ${c.customer_name} ${debt > 0 ? '🔴 ' + debt.toFixed(2) : ''}</option>`;
    });
}

function openAddCustomerModal() {
    document.getElementById('customerModal').classList.remove('hidden');
    document.getElementById('newCustomerName').focus();
}

async function addNewCustomer() {
    const name = document.getElementById('newCustomerName').value.trim();
    const phone = document.getElementById('newCustomerPhone').value.trim();
    const address = document.getElementById('newCustomerAddress').value.trim();

    if(!name) {
        showToast('⚠️ يرجى إدخال اسم العميل', 'error');
        return;
    }

    try {
        const custData = {
            store_id: currentStoreId,
            customer_name: name,
            phone: phone || null,
            address: address || null,
            total_debt: 0
        };
        let data;
        try {
            const result = await sb.from('customers').insert([custData]).select().single();
            if(result.error) throw result.error;
            data = result.data;
        } catch(e) {
            data = { ...custData, id: 'offline_' + Date.now() };
            await SyncManager.enqueue('customers', 'put', data);
            console.warn('📦 العميل حُفظ محلياً (أوفلاين)');
        }

        allCustomers.push(data);
        updateCustomerSelect();
        document.getElementById('invoiceCustomer').value = data.id;
        renderCustomersList();
        
        closeModal('customerModal');
        document.getElementById('newCustomerName').value = '';
        document.getElementById('newCustomerPhone').value = '';
        document.getElementById('newCustomerAddress').value = '';
        
        showToast(`✅ تم إضافة العميل ${name} بنجاح${data.id?.toString().startsWith('offline_') ? ' (محلي)' : ''}`, 'success');
        logActivity('إضافة عميل', `${name} - ${phone || 'بدون هاتف'}`, 'add');
    } catch(err) {
        showToast('❌ خطأ في الحفظ: ' + err.message, 'error');
    }
}

function openCustomersList() {
    document.getElementById('customersListModal').classList.remove('hidden');
    renderCustomersList();
}

const debouncedFilterCustomers = debounce(() => {
    Pagination.create('customersPagination', { itemsPerPage: 15 });
    filterCustomersList();
}, 250);

function filterCustomersList() {
    const search = (document.getElementById('searchCustomerInput')?.value || '').toLowerCase();
    const debtOnly = document.getElementById('debtOnlyFilter')?.checked;
    const tbody = document.getElementById('customersListTable');
    const emptyMsg = document.getElementById('emptyCustomersList');
    tbody.innerHTML = '';
    let filtered = allCustomers;
    if(debtOnly) filtered = filtered.filter(c => parseFloat(c.total_debt || 0) > 0);
    if(search) filtered = filtered.filter(c => (c.customer_name || '').toLowerCase().includes(search) || (c.phone || '').includes(search));
    if(filtered.length === 0) { emptyMsg.classList.remove('hidden'); return; }
    emptyMsg.classList.add('hidden');
    let pagContainer = document.getElementById('customersPagination');
    if(!pagContainer) {
        pagContainer = document.createElement('div');
        pagContainer.id = 'customersPagination';
        pagContainer.className = 'mt-3';
        const table = tbody.closest('table');
        if(table && table.parentNode) table.parentNode.insertBefore(pagContainer, table.nextSibling);
    }
    if(!Pagination._instances['customersPagination']) {
        Pagination.create('customersPagination', { itemsPerPage: 15 });
    }
    Pagination.update('customersPagination', filtered.length);
    const pageItems = Pagination.getPageData('customersPagination', filtered);
    pageItems.forEach((c, index) => {
        const totalSpent = allInvoices
            .filter(inv => inv.customer_id === c.id)
            .reduce((sum, inv) => sum + parseFloat(inv.final_amount || 0), 0);
        const debt = parseFloat(c.total_debt || 0);
        const tr = document.createElement('tr');
        tr.className = 'cursor-pointer hover:bg-slate-800/50 transition';
        tr.onclick = () => openCustomerProfile(c.id);
        tr.innerHTML = `
            <td class="p-3">${index + 1}</td>
            <td class="p-3 font-bold text-slate-200">${c.customer_name}</td>
            <td class="p-3 text-slate-400">${c.phone || '—'}</td>
            <td class="p-3 text-slate-500">${c.address || '—'}</td>
            <td class="p-3 text-center text-emerald-400">${totalSpent.toFixed(2)} ج.م</td>
            <td class="p-3 text-center ${debt > 0 ? 'text-red-400 font-bold' : 'text-green-400'}">${debt.toFixed(2)} ج.م</td>
            <td class="p-3 text-center">
                ${debt > 0 ? `<button onclick="event.stopPropagation(); openPaymentModal('${c.id}')" class="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-lg text-[10px] font-bold transition">
                    <i class="fa-solid fa-hand-holding-dollar"></i> تسديد
                </button>` : '<span class="text-slate-500 text-[10px]">✓</span>'}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderCustomersList() {
    const tbody = document.getElementById('customersListTable');
    const emptyMsg = document.getElementById('emptyCustomersList');
    tbody.innerHTML = '';

    if(allCustomers.length === 0) {
        emptyMsg.classList.remove('hidden');
        return;
    }
    emptyMsg.classList.add('hidden');

    let pagContainer = document.getElementById('customersPagination');
    if(!pagContainer) {
        pagContainer = document.createElement('div');
        pagContainer.id = 'customersPagination';
        pagContainer.className = 'mt-3';
        const table = tbody.closest('table');
        if(table && table.parentNode) table.parentNode.insertBefore(pagContainer, table.nextSibling);
    }
    if(!Pagination._instances['customersPagination']) {
        Pagination.create('customersPagination', { itemsPerPage: 15 });
    }
    Pagination.update('customersPagination', allCustomers.length);
    const pageItems = Pagination.getPageData('customersPagination', allCustomers);

    pageItems.forEach((c, index) => {
        const totalSpent = allInvoices
            .filter(inv => inv.customer_id === c.id)
            .reduce((sum, inv) => sum + parseFloat(inv.final_amount || 0), 0);
        
        const debt = parseFloat(c.total_debt || 0);
        const tr = document.createElement('tr');
        tr.className = 'cursor-pointer hover:bg-slate-800/50 transition';
        tr.onclick = () => openCustomerProfile(c.id);
        tr.innerHTML = `
            <td class="p-3">${index + 1}</td>
            <td class="p-3 font-bold text-slate-200">${c.customer_name}</td>
            <td class="p-3 text-slate-400">${c.phone || '—'}</td>
            <td class="p-3 text-slate-500">${c.address || '—'}</td>
            <td class="p-3 text-center text-emerald-400">${totalSpent.toFixed(2)} ج.م</td>
            <td class="p-3 text-center ${debt > 0 ? 'text-red-400 font-bold' : 'text-green-400'}">${debt.toFixed(2)} ج.م</td>
            <td class="p-3 text-center">
                ${debt > 0 ? `<button onclick="event.stopPropagation(); openPaymentModal('${c.id}')" class="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-lg text-[10px] font-bold transition">
                    <i class="fa-solid fa-hand-holding-dollar"></i> تسديد
                </button>` : '<span class="text-slate-500 text-[10px]">✓</span>'}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

let currentProfileCustomerId = null;

function openCustomerProfile(customerId) {
    const customer = allCustomers.find(c => c.id === customerId);
    if (!customer) return;
    currentProfileCustomerId = customerId;

    document.getElementById('customerProfileTab').classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    const invoices = allInvoices.filter(inv => inv.customer_id === customerId);
    const maintenance = maintenanceTickets.filter(t => t.customer_name === customer.customer_name);
    const totalSpent = invoices.reduce((s, inv) => s + parseFloat(inv.final_amount || 0), 0);
    const debt = parseFloat(customer.total_debt || 0);
    const loyalty = parseInt(customer.loyalty_points || 0);

    document.getElementById('cpTitle').textContent = '👤 ' + customer.customer_name;
    document.getElementById('cpSubtitle').textContent = customer.phone || 'لا يوجد هاتف';
    document.getElementById('cpAvatar').textContent = (customer.customer_name || '?')[0];
    document.getElementById('cpName').textContent = customer.customer_name;
    document.getElementById('cpPhone').textContent = '📱 ' + (customer.phone || 'لا يوجد هاتف');
    document.getElementById('cpAddress').textContent = '📍 ' + (customer.address || 'لا يوجد عنوان');
    document.getElementById('cpTotalSpent').textContent = totalSpent.toFixed(2) + ' ج.م';
    document.getElementById('cpInvoiceCount').textContent = invoices.length;
    document.getElementById('cpMaintCount').textContent = maintenance.length;
    document.getElementById('cpDebt').textContent = debt > 0 ? debt.toFixed(2) + ' ج.م' : '✓';

    renderCpInvoices(invoices);
    renderCpMaintenance(maintenance);
    switchCpTab('invoices');
}

function closeCustomerProfile() {
    document.getElementById('customerProfileTab').classList.add('hidden');
    document.body.style.overflow = 'auto';
    currentProfileCustomerId = null;
}

function switchCpTab(tab) {
    document.querySelectorAll('.cp-tab').forEach(btn => {
        btn.style.background = 'var(--bg-card)';
        btn.style.color = 'var(--text-2)';
        btn.style.border = '1px solid var(--border)';
    });
    const activeBtn = document.getElementById('cpTab' + tab.charAt(0).toUpperCase() + tab.slice(1));
    if (activeBtn) {
        activeBtn.style.background = 'var(--accent)';
        activeBtn.style.color = '#fff';
        activeBtn.style.border = 'none';
    }
    document.getElementById('cpInvoicesSection').classList.toggle('hidden', tab !== 'invoices');
    document.getElementById('cpMaintSection').classList.toggle('hidden', tab !== 'maintenance');
}

function renderCpInvoices(invoices) {
    const tbody = document.getElementById('cpInvoicesBody');
    const empty = document.getElementById('cpNoInvoices');
    tbody.innerHTML = '';
    if (invoices.length === 0) { empty.classList.remove('hidden'); return; }
    empty.classList.add('hidden');
    invoices.forEach((inv, i) => {
        const date = new Date(inv.created_at || inv.date).toLocaleDateString('ar-EG');
        const paid = parseFloat(inv.paid_amount || 0);
        const remaining = parseFloat(inv.remaining_amount || 0);
        const paymentLabels = { cash: 'كاش', card: 'بطاقة', vodafone: 'فودافون', instapay: 'إنستاباي', bank: 'تحويل', later: 'آجل' };
        const tr = document.createElement('tr');
        tr.className = 'border-t hover:bg-slate-800/30 transition';
        tr.innerHTML = `
            <td class="p-2">${i + 1}</td>
            <td class="p-2" style="color: var(--text-2);">${date}</td>
            <td class="p-2 text-center font-bold text-emerald-400">${parseFloat(inv.final_amount || 0).toFixed(2)}</td>
            <td class="p-2 text-center text-blue-400">${paid.toFixed(2)}</td>
            <td class="p-2 text-center ${remaining > 0 ? 'text-red-400' : 'text-emerald-400'}">${remaining > 0 ? remaining.toFixed(2) : '✓'}</td>
            <td class="p-2 text-center text-[9px]">${paymentLabels[inv.payment_type] || inv.payment_type || '-'}</td>
            <td class="p-2 text-center">
                <button onclick="event.stopPropagation(); sendWhatsAppInvoice('${inv.id}')" class="text-green-400 hover:text-green-300 text-[10px]" title="واتساب"><i class="fa-brands fa-whatsapp"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderCpMaintenance(maintenance) {
    const tbody = document.getElementById('cpMaintBody');
    const empty = document.getElementById('cpNoMaint');
    tbody.innerHTML = '';
    if (maintenance.length === 0) { empty.classList.remove('hidden'); return; }
    empty.classList.add('hidden');
    maintenance.forEach((t, i) => {
        const date = new Date(t.maintenance_date).toLocaleDateString('ar-EG');
        const statusColors = { 'قيد الانتظار': 'text-amber-400', 'قيد الإصلاح': 'text-blue-400', 'تم الإصلاح': 'text-emerald-400', 'تم التسليم': 'text-slate-500' };
        const tr = document.createElement('tr');
        tr.className = 'border-t hover:bg-slate-800/30 transition';
        tr.innerHTML = `
            <td class="p-2">${i + 1}</td>
            <td class="p-2" style="color: var(--text-2);">${date}</td>
            <td class="p-2 font-bold" style="color: var(--text-1);">${t.device_model || '-'}</td>
            <td class="p-2" style="color: var(--text-2);">${t.fault || '-'}</td>
            <td class="p-2 text-center text-amber-400 font-bold">${parseFloat(t.cost || 0).toFixed(2)}</td>
            <td class="p-2 text-center ${statusColors[t.status] || 'text-slate-400'} font-bold text-[9px]">${t.status || '-'}</td>
        `;
        tbody.appendChild(tr);
    });
}

function cleanPhoneForWA(phone) {
    if (!phone) return '';
    let cleaned = phone.replace(/[\s\-\+\(\)]/g, '');
    if (cleaned.startsWith('00')) cleaned = cleaned.substring(2);
    if (cleaned.startsWith('0')) cleaned = '20' + cleaned;
    if (!cleaned.startsWith('20') && cleaned.length <= 11) cleaned = '20' + cleaned;
    return cleaned;
}

function sendWhatsAppToCustomer() {
    if (!currentProfileCustomerId) return;
    const customer = allCustomers.find(c => c.id === currentProfileCustomerId);
    if (!customer || !customer.phone) {
        showToast('⚠️ لا يوجد رقم هاتف لهذا العميل', 'error');
        return;
    }
    const storeName = localStorage.getItem('active_store_name') || 'المحل';
    const msg = encodeURIComponent(`مرحباً ${customer.customer_name} 👋\nمن ${storeName}\n\nنتمنى لك يوماً سعيداً! 😊`);
    window.open(`https://wa.me/${cleanPhoneForWA(customer.phone)}?text=${msg}`, '_blank');
}

function openPaymentModal(customerId) {
    const customer = allCustomers.find(c => c.id === customerId);
    if(!customer) return;
    selectedCustomerForPayment = customer;
    document.getElementById('paymentCustomerName').innerText = customer.customer_name;
    document.getElementById('paymentCurrentDebt').innerText = parseFloat(customer.total_debt || 0).toFixed(2) + ' ج.م';
    document.getElementById('paymentAmount').value = '';
    document.getElementById('paymentNotes').value = '';
    document.getElementById('paymentModal').classList.remove('hidden');
}

async function processPayment() {
    if(!selectedCustomerForPayment) return;
    const amount = parseFloat(document.getElementById('paymentAmount').value);
    const notes = document.getElementById('paymentNotes').value.trim();
    if(!amount || amount <= 0) { showToast('⚠️ يرجى إدخال مبلغ صحيح', 'error'); return; }
    const currentDebt = parseFloat(selectedCustomerForPayment.total_debt || 0);
    if(amount > currentDebt) { showToast('⚠️ المبلغ أكبر من المديونية', 'error'); return; }
    try {
        const newDebt = currentDebt - amount;
        await sb.from('customers').update({ total_debt: newDebt }).eq('id', selectedCustomerForPayment.id);
        selectedCustomerForPayment.total_debt = newDebt;
        closeModal('paymentModal');
        renderCustomersList();
        updateCustomerSelect();
        showToast(`✅ تم تسديد ${amount.toFixed(2)} ج.م`, 'success');
    } catch(err) {
        showToast('❌ خطأ في التسديد: ' + err.message, 'error');
    }
}

function getCustomerPoints(customerId) {
    const customer = allCustomers.find(c => c.id === customerId);
    return parseInt(customer?.loyalty_points || 0);
}

async function addCustomerPoints(customerId, amount) {
    const pointsPerPound = getLoyaltyRate();
    const earnedPoints = Math.floor(amount / 100 * pointsPerPound);
    if(earnedPoints <= 0) return;
    const customer = allCustomers.find(c => c.id === customerId);
    if(!customer) return;
    const current = parseInt(customer.loyalty_points || 0);
    const newPoints = current + earnedPoints;
    customer.loyalty_points = newPoints;
    await sb.from('customers').update({ loyalty_points: newPoints }).eq('id', customerId);
    showToast(`🎯 ${earnedPoints} نقطة ولاء مضافة للعميل`, 'success');
}

async function redeemCustomerPoints(customerId, points) {
    const customer = allCustomers.find(c => c.id === customerId);
    if(!customer) return false;
    const current = parseInt(customer.loyalty_points || 0);
    if(current < points) { showToast('⚠️ النقاط غير كافية', 'error'); return false; }
    const newPoints = current - points;
    customer.loyalty_points = newPoints;
    await sb.from('customers').update({ loyalty_points: newPoints }).eq('id', customerId);
    return true;
}

function getLoyaltyRate() { return parseFloat(localStorage.getItem('loyalty_rate_' + currentStoreId) || '1'); }
function setLoyaltyRate(rate) { localStorage.setItem('loyalty_rate_' + currentStoreId, rate.toString()); }