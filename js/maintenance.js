// TAGGER PRO V6 - Maintenance
async function loadMaintenanceData() {
    try {
        const tbody = document.getElementById('maintenanceTableBody');
        if(tbody) tbody.innerHTML = '<tr><td colspan="9">' + Skeleton.table(5, 5) + '</td></tr>';
        let local = await SmartLoader.getLocalData('maintenance');
        maintenanceTickets = local.filter(t => t.store_id === currentStoreId)
            .sort((a, b) => (b.maintenance_date || '').localeCompare(a.maintenance_date || ''));
        if (maintenanceTickets.length === 0 && SyncManager.isOnline) {
            await SmartLoader.syncTable('maintenance', currentStoreId, true);
            local = await SmartLoader.getLocalData('maintenance');
            maintenanceTickets = local.filter(t => t.store_id === currentStoreId)
                .sort((a, b) => (b.maintenance_date || '').localeCompare(a.maintenance_date || ''));
        }
        renderMaintenanceTable();
        updateMaintenanceStats();
        updateMaintenanceBadge();
        if (SyncManager.isOnline) {
            SmartLoader.syncTable('maintenance', currentStoreId).then(synced => {
                if (synced.length > 0) {
                    SmartLoader.getLocalData('maintenance').then(full => {
                        maintenanceTickets = full.filter(t => t.store_id === currentStoreId)
                            .sort((a, b) => (b.maintenance_date || '').localeCompare(a.maintenance_date || ''));
                        renderMaintenanceTable();
                        updateMaintenanceStats();
                        updateMaintenanceBadge();
                    });
                }
            });
        }
    } catch(err) {
        console.error('خطأ في تحميل الصيانة:', err);
    }
}

function openMaintenance() {
    if (!canViewMaintenance()) { showToastPermission(); return; }
    document.getElementById('maintenanceTab').classList.remove('hidden');
    try {
        renderMaintenanceTable();
        updateMaintenanceStats();
    } catch(e) {
        ErrorBoundary.show('maintenanceTab', e, () => openMaintenance());
    }
    document.body.style.overflow = 'hidden';
}

function closeMaintenance() {
    document.getElementById('maintenanceTab').classList.add('hidden');
    document.body.style.overflow = 'auto';
}

function openMaintenanceModal() {
    if (!canEditMaintenance()) { showToastPermission(); return; }
    document.getElementById('maintenanceModal').classList.remove('hidden');
    document.getElementById('mCustName').value = '';
    document.getElementById('mCustPhone').value = '';
    document.getElementById('mDeviceModel').value = '';
    document.getElementById('mDeviceFault').value = '';
    document.getElementById('mDeviceSerial').value = '';
    document.getElementById('mCost').value = '0';
    document.getElementById('mDeposit').value = '0';
    document.getElementById('mTechName').value = '';
    document.getElementById('mDevicePass').value = '';
    document.getElementById('mPartsUsed').value = '';
}

async function saveMaintenanceTicket() {
    if (!requireShift()) return;
    if (!canEditMaintenance()) { showToastPermission(); return; }
    const name = document.getElementById('mCustName').value.trim();
    const phone = document.getElementById('mCustPhone').value.trim();
    const model = document.getElementById('mDeviceModel').value.trim();
    const fault = document.getElementById('mDeviceFault').value.trim();
    if(!name || !model || !fault) { showToast('⚠️ يرجى ملء الحقول الإلزامية', 'error'); return; }
    const matchedCustomer = allCustomers.find(c => c.customer_name === name || c.phone === phone);
    try {
        const mtData = {
            store_id: currentStoreId,
            ticket_number: 'MT-' + Date.now().toString().slice(-8),
            customer_name: name,
            customer_id: matchedCustomer ? matchedCustomer.id : null,
            phone: phone,
            device_model: model,
            serial: document.getElementById('mDeviceSerial').value || '—',
            fault: fault,
            cost: parseFloat(document.getElementById('mCost').value) || 0,
            deposit: parseFloat(document.getElementById('mDeposit').value) || 0,
            tech: document.getElementById('mTechName').value || localStorage.getItem('active_staff_name') || 'الكاشير',
            pass: document.getElementById('mDevicePass').value || '—',
            parts: document.getElementById('mPartsUsed').value || '—',
            status: 'قيد الانتظار',
            maintenance_date: new Date().toISOString()
        };
        let data;
        try {
            const result = await sb.from('maintenance').insert([mtData]).select().single();
            if(result.error) throw result.error;
            data = result.data;
        } catch(e) {
            data = { ...mtData, id: 'offline_' + Date.now() };
            await SyncManager.enqueue('maintenance', 'put', data);
            console.warn('📦 التذكرة حُفظت محلياً (أوفلاين)');
        }
        maintenanceTickets.unshift(data);
        closeModal('maintenanceModal');
        renderMaintenanceTable();
        updateMaintenanceStats();
        updateMaintenanceBadge();
        showToast('✅ تم استلام جهاز الصيانة بنجاح', 'success');
        const printWindow = window.open('', '_blank', 'width=300,height=400');
        printWindow.document.write(`
            <html><head><title>إيصال صيانة</title>
            <style>body{font-family:'Cairo',sans-serif;direction:rtl;text-align:right;padding:20px;font-size:12px;}
            .header{text-align:center;border-bottom:2px solid #000;padding-bottom:10px;margin-bottom:10px;}
            .header h1{font-size:18px;margin:0;}
            .info{line-height:1.8;}
            .info b{display:inline-block;width:100px;}
            .footer{text-align:center;border-top:1px dashed #999;padding-top:10px;margin-top:10px;font-size:10px;}
            .status{color:#f59e0b;font-weight:bold;}</style>
            </head><body>
            <div class="header"><h1>🔧 TAGGER PRO</h1><p>إيصال استلام صيانة</p><p>${new Date().toLocaleString('ar-EG')}</p></div>
            <div class="info">
                <div><b>العميل:</b> ${data.customer_name}</div>
                <div><b>الهاتف:</b> ${data.phone}</div>
                <div><b>الجهاز:</b> ${data.device_model}</div>
                <div><b>السيريال:</b> ${data.serial}</div>
                <div><b>العطل:</b> ${data.fault}</div>
                <div><b>الرقم السري:</b> ${data.pass}</div>
                <div><b>التكلفة:</b> ${data.cost} ج.م</div>
                <div><b>المقدم:</b> ${data.deposit} ج.م</div>
                <div><b>الفني:</b> ${data.tech}</div>
                <div><b>الحالة:</b> <span class="status">${data.status}</span></div>
            </div>
            <div class="footer"><p>شكراً لثقتكم بنا ❤️</p><p style="font-size:8px;color:#999;">رقم التذكرة: ${data.ticket_number}</p></div>
            <script>window.print();<\/script>
            </body></html>
        `);
        printWindow.document.close();
    } catch(err) {
        showToast('❌ خطأ في الحفظ: ' + err.message, 'error');
    }
}

function renderMaintenanceTable() {
    const tbody = document.getElementById('maintenanceTableBody');
    const emptyMsg = document.getElementById('emptyMaintenance');
    let filtered = maintenanceTickets;
    if(currentMaintenanceFilter !== 'all') filtered = maintenanceTickets.filter(t => t.status === currentMaintenanceFilter);
    if(filtered.length === 0) { tbody.innerHTML = ''; emptyMsg.classList.remove('hidden'); return; }
    emptyMsg.classList.add('hidden');
    let pagContainer = document.getElementById('maintenancePagination');
    if(!pagContainer) {
        pagContainer = document.createElement('div');
        pagContainer.id = 'maintenancePagination';
        pagContainer.className = 'mt-3';
        const table = tbody.closest('table');
        if(table && table.parentNode) table.parentNode.insertBefore(pagContainer, table.nextSibling);
    }
    if(!Pagination._instances['maintenancePagination']) {
        Pagination.create('maintenancePagination', { itemsPerPage: 10 });
    }
    Pagination.update('maintenancePagination', filtered.length);
    const pageItems = Pagination.getPageData('maintenancePagination', filtered);
    const colors = {
        'قيد الانتظار': 'bg-amber-500/20 text-amber-400',
        'قيد الإصلاح': 'bg-blue-500/20 text-blue-400',
        'تم الإصلاح': 'bg-emerald-500/20 text-emerald-400',
        'تم التسليم': 'bg-rose-500/20 text-rose-400'
    };
    const icons = {
        'قيد الانتظار': '⏳',
        'قيد الإصلاح': '🛠️',
        'تم الإصلاح': '✅',
        'تم التسليم': '📦'
    };
    tbody.innerHTML = pageItems.map((t) => `
        <tr class="border-b border-slate-800/60 hover:bg-slate-800/20 transition">
            <td class="p-3 text-slate-500 font-mono text-[10px]">${t.ticket_number || t.id}</td>
            <td class="p-3"><div class="font-bold text-slate-200">${t.customer_name}</div><div class="text-[10px] text-slate-500">${t.phone}</div></td>
            <td class="p-3"><div class="text-blue-400 font-bold">${t.device_model}</div><div class="text-[9px] text-slate-500">${t.serial}</div></td>
            <td class="p-3 text-slate-400 max-w-[150px] truncate">${t.fault}</td>
            <td class="p-3 font-bold text-emerald-400">${t.cost} ج.م</td>
            <td class="p-3 text-amber-400">${t.deposit} ج.م</td>
            <td class="p-3 text-slate-400">${t.tech}</td>
            <td class="p-3"><span class="px-2 py-1 rounded-lg text-[10px] font-bold ${colors[t.status] || 'bg-slate-500/20 text-slate-400'}">${icons[t.status] || '❓'} ${t.status}</span></td>
            <td class="p-3 text-center">
                <div class="flex items-center justify-center gap-1.5">
                    <button onclick="viewDeviceDetails('${t.id}')" class="bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 px-2 py-1 rounded-lg text-[10px] transition"><i class="fa-solid fa-eye"></i></button>
                    <select onchange="changeTicketStatus('${t.id}', this.value)" class="bg-[#090d16] border border-slate-800 rounded-lg px-2 py-1 text-[10px] text-white outline-none focus:border-purple-500">
                        <option value="">تغيير</option>
                        <option value="قيد الانتظار">⏳ قيد الانتظار</option>
                        <option value="قيد الإصلاح">🛠️ قيد الإصلاح</option>
                        <option value="تم الإصلاح">✅ تم الإصلاح</option>
                        <option value="تم التسليم">📦 تم التسليم</option>
                    </select>
                </div>
            </td>
        </tr>
    `).join('');
}

async function changeTicketStatus(id, newStatus) {
    if(!newStatus) return;
    try {
        await sb.from('maintenance').update({ status: newStatus }).eq('id', id);
        const ticket = maintenanceTickets.find(t => t.id === id);
        if(ticket) ticket.status = newStatus;
        renderMaintenanceTable();
        updateMaintenanceStats();
        updateMaintenanceBadge();
        showToast(`🔄 تم تحديث حالة الجهاز إلى: ${newStatus}`, 'success');
    } catch(err) {
        showToast('❌ خطأ: ' + err.message, 'error');
    }
}

function viewDeviceDetails(id) {
    const ticket = maintenanceTickets.find(t => t.id === id);
    if(!ticket) return;
    const colors = {
        'قيد الانتظار': 'bg-amber-500/20 text-amber-400',
        'قيد الإصلاح': 'bg-blue-500/20 text-blue-400',
        'تم الإصلاح': 'bg-emerald-500/20 text-emerald-400',
        'تم التسليم': 'bg-rose-500/20 text-rose-400'
    };
    const icons = {
        'قيد الانتظار': '⏳',
        'قيد الإصلاح': '🛠️',
        'تم الإصلاح': '✅',
        'تم التسليم': '📦'
    };
    document.getElementById('deviceDetailsContent').innerHTML = `
        <div class="grid grid-cols-2 gap-2">
            <div><span class="text-slate-500">العميل:</span> <span class="text-white font-bold">${ticket.customer_name}</span></div>
            <div><span class="text-slate-500">الهاتف:</span> <span class="text-white">${ticket.phone}</span></div>
            <div><span class="text-slate-500">الجهاز:</span> <span class="text-blue-400 font-bold">${ticket.device_model}</span></div>
            <div><span class="text-slate-500">السيريال:</span> <span class="text-white">${ticket.serial}</span></div>
            <div class="col-span-2"><span class="text-slate-500">العطل:</span> <span class="text-white">${ticket.fault}</span></div>
            <div><span class="text-slate-500">التكلفة:</span> <span class="text-emerald-400 font-bold">${ticket.cost} ج.م</span></div>
            <div><span class="text-slate-500">المقدم:</span> <span class="text-amber-400 font-bold">${ticket.deposit} ج.م</span></div>
            <div><span class="text-slate-500">الفني:</span> <span class="text-white">${ticket.tech}</span></div>
            <div><span class="text-slate-500">الرقم السري:</span> <span class="text-white">${ticket.pass}</span></div>
            <div class="col-span-2"><span class="text-slate-500">قطع الغيار:</span> <span class="text-white">${ticket.parts}</span></div>
            <div class="col-span-2"><span class="text-slate-500">الحالة:</span> <span class="${colors[ticket.status]} font-bold">${icons[ticket.status]} ${ticket.status}</span></div>
            <div class="col-span-2"><span class="text-slate-500">تاريخ الاستلام:</span> <span class="text-white">${new Date(ticket.date).toLocaleString('ar-EG')}</span></div>
        </div>
    `;
    document.getElementById('deviceDetailsModal').classList.remove('hidden');
}

function updateMaintenanceStats() {
    const waiting = maintenanceTickets.filter(t => t.status === 'قيد الانتظار').length;
    const repair = maintenanceTickets.filter(t => t.status === 'قيد الإصلاح').length;
    const done = maintenanceTickets.filter(t => t.status === 'تم الإصلاح').length;
    const delivered = maintenanceTickets.filter(t => t.status === 'تم التسليم').length;
    document.getElementById('statWaiting').innerText = waiting;
    document.getElementById('statRepair').innerText = repair;
    document.getElementById('statDone').innerText = done;
    document.getElementById('statDelivered').innerText = delivered;
}

function updateMaintenanceBadge() {
    const count = maintenanceTickets.filter(t => t.status !== 'تم التسليم').length;
    if (document.getElementById('maintenanceCount')) document.getElementById('maintenanceCount').innerText = count;
    if (document.getElementById('maintenanceBadge')) document.getElementById('maintenanceBadge').textContent = count;
}

function filterMaintenance(status, el) {
    currentMaintenanceFilter = status;
    document.querySelectorAll('.filter-mbtn').forEach(btn => {
        btn.className = 'filter-mbtn bg-slate-800/40 text-slate-400 hover:text-white px-2 py-1 lg:px-4 lg:py-1.5 rounded-lg text-[8px] lg:text-xs font-bold transition';
    });
    if(el) {
        if(status === 'all') {
            el.className = 'filter-mbtn active bg-blue-600/20 text-blue-400 border border-blue-500/30 px-2 py-1 lg:px-4 lg:py-1.5 rounded-lg text-[8px] lg:text-xs font-bold transition';
        } else {
            el.className = 'filter-mbtn active bg-purple-600/20 text-purple-400 border border-purple-500/30 px-2 py-1 lg:px-4 lg:py-1.5 rounded-lg text-[8px] lg:text-xs font-bold transition';
        }
    }
    renderMaintenanceTable();
}
