// TAGGER PRO V6 - Invoices, Cart, Quotations & Returns

function addItemToInvoice(productId) {
    const prod = localProducts.find(p => p.id === productId);
    if(!prod) return;
    const existingIndex = currentInvoiceItems.findIndex(item => item.id === productId);
    if(existingIndex > -1) {
        if(currentInvoiceItems[existingIndex].quantity >= prod.stock) {
            showToast('⚠️ الكمية المطلوبة أكبر من المتاحة', 'warning');
            playSound('error');
            return;
        }
        currentInvoiceItems[existingIndex].quantity += 1;
    } else {
        if(prod.stock <= 0) {
            showToast('⚠️ هذا الصنف غير متوفر', 'warning');
            playSound('error');
            return;
        }
        currentInvoiceItems.push({
            id: prod.id,
            title: prod.title || prod.product_name,
            sell_price: parseFloat(prod.sell_price || prod.price),
            purchase_price: parseFloat(prod.purchase_price || 0),
            quantity: 1,
            stock: prod.stock,
            barcode: prod.barcode
        });
    }
    renderInvoiceTable();
    playSound('add');
    showToast(`✅ تم إضافة ${prod.title || prod.product_name}`, 'success');
}

function renderInvoiceTable() {
    const tbody = document.getElementById('invoiceItemsTable');
    const emptyMsg = document.getElementById('emptyCartMessage');
    tbody.innerHTML = '';
    if(currentInvoiceItems.length === 0) {
        emptyMsg.classList.remove('hidden');
        calculateInvoiceTotals();
        return;
    }
    emptyMsg.classList.add('hidden');
    currentInvoiceItems.forEach((item, index) => {
        const profit = (item.sell_price - item.purchase_price) * item.quantity;
        const tr = document.createElement('tr');
        tr.className = "border-b border-slate-800 hover:bg-slate-800/20 transition text-slate-300";
        tr.innerHTML = `
            <td class="p-3"><span class="font-medium text-slate-200">${item.title}</span><span class="text-[9px] text-green-500/60 block">ربح: ${profit.toFixed(2)}</span></td>
            <td class="p-3 text-center"><div class="flex items-center justify-center gap-1.5">
                <button onclick="updateQty(${index}, -1)" class="w-5 h-5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded flex items-center justify-center transition">-</button>
                <span class="font-bold min-w-4 text-white">${item.quantity}</span>
                <button onclick="updateQty(${index}, 1)" class="w-5 h-5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded flex items-center justify-center transition">+</button>
            </div></td>
            <td class="p-3 text-center font-bold">${item.sell_price.toFixed(2)}</td>
            <td class="p-3 text-center font-black text-slate-100">${(item.sell_price * item.quantity).toFixed(2)}</td>
            <td class="p-3 text-center"><button onclick="deleteInvoiceItem(${index})" class="text-slate-500 hover:text-rose-400 transition"><i class="fa-solid fa-xmark"></i></button></td>
        `;
        tbody.appendChild(tr);
    });
    calculateInvoiceTotals();
}

function updateQty(index, change) {
    currentInvoiceItems[index].quantity += change;
    if(currentInvoiceItems[index].quantity <= 0) currentInvoiceItems.splice(index, 1);
    renderInvoiceTable();
}

function deleteInvoiceItem(index) {
    currentInvoiceItems.splice(index, 1);
    renderInvoiceTable();
}

function calculateInvoiceTotals() {
    let subtotal = 0, totalProfit = 0;
    currentInvoiceItems.forEach(item => {
        const itemTotal = item.sell_price * item.quantity;
        const itemPurchase = item.purchase_price * item.quantity;
        subtotal += itemTotal;
        totalProfit += (itemTotal - itemPurchase);
    });
    const discInput = document.getElementById('calcDiscount');
    let discount = parseFloat(discInput.value) || 0;
    if(discount < 0) { discount = 0; discInput.value = 0; }
    if(discount > subtotal) { discount = subtotal; discInput.value = subtotal.toFixed(0); }
    const afterDiscount = subtotal - discount;
    const vatEnabled = localStorage.getItem('vat_enabled_' + currentStoreId) === 'true';
    const vatRate = parseFloat(localStorage.getItem('vat_rate_' + currentStoreId) || '15');
    let vatAmount = 0;
    if (vatEnabled && afterDiscount > 0) {
        vatAmount = afterDiscount * (vatRate / 100);
    }
    const netTotal = afterDiscount + vatAmount;
    const finalProfit = totalProfit - discount;
    document.getElementById('calcSubtotal').innerText = `${subtotal.toFixed(2)} ج.م`;
    document.getElementById('calcNetTotal').innerText = `${netTotal.toFixed(2)} ج.م`;
    document.getElementById('profitMarginDisplay').innerText = `${finalProfit.toFixed(2)} ج.م`;
    const vatRow = document.getElementById('vatRow');
    if (vatEnabled) {
        vatRow.style.display = 'flex';
        document.getElementById('vatRateDisplay').textContent = vatRate;
        document.getElementById('vatAmountDisplay').textContent = `${vatAmount.toFixed(2)} ج.م`;
    } else {
        vatRow.style.display = 'none';
    }
    const profitPercent = subtotal > 0 ? Math.min((finalProfit / subtotal) * 100, 100) : 0;
    const profitBar = document.getElementById('profitBar');
    profitBar.style.width = `${Math.max(0, profitPercent)}%`;
    profitBar.className = `profit-bar ${profitPercent > 30 ? 'bg-emerald-500' : profitPercent > 15 ? 'bg-amber-500' : 'bg-red-500'}`;
}

// ============================================================
// ====== كوبونات الخصم ======
// ============================================================

function applyCoupon(value, el) {
    const subtotal = currentInvoiceItems.reduce((s, i) => s + (i.sell_price * i.quantity), 0);
    const discInput = document.getElementById('calcDiscount');
    if(value === '0') {
        appliedCoupon = null;
        discInput.value = 0;
        showToast('❌ تم إلغاء الكوبون', 'warning');
    } else if(value.endsWith('%')) {
        const percent = parseFloat(value) / 100;
        const discount = subtotal * percent;
        appliedCoupon = { type: 'percent', value: percent, label: value };
        discInput.value = discount.toFixed(0);
        showToast(`🎫 تم تطبيق خصم ${value} = ${discount.toFixed(2)} ج.م`, 'success');
    } else {
        const discount = parseFloat(value);
        if(discount > subtotal) { showToast('⚠️ الخصم أكبر من الإجمالي', 'error'); return; }
        appliedCoupon = { type: 'fixed', value: discount, label: `${discount} ج.م` };
        discInput.value = discount.toFixed(0);
        showToast(`🎫 تم تطبيق خصم ${discount} ج.م`, 'success');
    }
    document.querySelectorAll('.coupon-btn').forEach(btn => btn.classList.remove('active'));
    if(appliedCoupon && el) { el.classList.add('active'); }
    calculateInvoiceTotals();
}

// ============================================================
// ====== طرق الدفع ======
// ============================================================

function setPaymentMethod(method) {
    selectedPaymentMethod = method;
    document.querySelectorAll('.payment-btn').forEach(btn => {
        btn.classList.remove('active', 'border-blue-500');
        btn.className = btn.className.replace(/border-\w+-\d+\/30/g, 'border-transparent');
    });
    const btn = document.getElementById(`pay-${method}`);
    if(btn) btn.classList.add('active', 'border-blue-500');
    showToast(`✅ تم اختيار طريقة الدفع: ${PAYMENT_LABELS[method] || method}`, 'success');
}

// ============================================================
// ====== الباركود ======
// ============================================================

function handleBarcodeSearch() {
    const input = document.getElementById('barcodeInput');
    const code = input.value.trim();
    if(!code) return;
    const match = localProducts.find(p => p.barcode === code);
    if(match) {
        addItemToInvoice(match.id);
        input.value = '';
    } else {
        showToast(`⚠️ الباركود [${code}] غير مسجل — اضغط لإضافته`, 'error');
        const toastContainer = document.getElementById('toastContainer');
        if (toastContainer && toastContainer.lastElementChild) {
            toastContainer.lastElementChild.style.cursor = 'pointer';
            toastContainer.lastElementChild.onclick = () => {
                openAddProductModal();
                setTimeout(() => {
                    const barcodeField = document.getElementById('productBarcode') || document.getElementById('barcodeField');
                    if (barcodeField) barcodeField.value = code;
                }, 100);
            };
        }
        playSound('error');
        input.value = '';
    }
}

// ============================================================
// ====== التعليق والاستعادة ======
// ============================================================

function holdCurrentInvoice() {
    if(currentInvoiceItems.length === 0) { showToast('⚠️ السلة فارغة', 'warning'); return; }
    holdedInvoices.push({
        id: Date.now(),
        time: new Date().toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'}),
        items: [...currentInvoiceItems],
        discount: parseFloat(document.getElementById('calcDiscount').value) || 0,
        customer: document.getElementById('invoiceCustomer').value,
        payment: selectedPaymentMethod,
        warranty: document.getElementById('warrantyPeriod').value,
        warrantyNotes: document.getElementById('warrantyNotes').value
    });
    currentInvoiceItems = [];
    document.getElementById('calcDiscount').value = 0;
    document.getElementById('warrantyNotes').value = '';
    document.getElementById('warrantyPeriod').value = 'لا يوجد';
    renderInvoiceTable();
    saveHoldedInvoices();
    showToast(`📥 تم تعليق الفاتورة (${holdedInvoices.length} معلقة)`, 'success');
}

function viewHoldedInvoices() {
    const modal = document.getElementById('holdModal');
    const body = document.getElementById('holdModalBody');
    body.innerHTML = '';
    if(holdedInvoices.length === 0) {
        body.innerHTML = `<div class='text-center py-6 text-slate-500 text-xs'>لا توجد فواتير معلقة</div>`;
    } else {
        holdedInvoices.forEach((inv, index) => {
            const total = inv.items.reduce((s, i) => s + (i.sell_price * i.quantity), 0);
            const div = document.createElement('div');
            div.className = "bg-[#0b101d] border border-slate-800 p-3 rounded-xl flex justify-between items-center";
            div.innerHTML = `
                <div><span class="text-xs font-bold text-slate-200 block">فاتورة #${index + 1}</span>
                <span class="text-[10px] text-slate-500">${inv.time} • ${inv.items.length} صنف • ${total.toFixed(2)} ج.م</span>
                ${inv.warranty !== 'لا يوجد' ? `<span class="text-[9px] text-blue-400 block">🛡️ ${inv.warranty}</span>` : ''}</div>
                <button onclick="resumeInvoice(${index})" class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition">استعادة</button>
            `;
            body.appendChild(div);
        });
    }
    modal.classList.remove('hidden');
}

function resumeInvoice(index) {
    const target = holdedInvoices[index];
    currentInvoiceItems = [...target.items];
    document.getElementById('calcDiscount').value = target.discount || 0;
    if(target.customer) document.getElementById('invoiceCustomer').value = target.customer;
    if(target.payment) setPaymentMethod(target.payment);
    if(target.warranty) document.getElementById('warrantyPeriod').value = target.warranty;
    if(target.warrantyNotes) document.getElementById('warrantyNotes').value = target.warrantyNotes;
    holdedInvoices.splice(index, 1);
    saveHoldedInvoices();
    closeModal('holdModal');
    renderInvoiceTable();
    showToast('🔄 تم استعادة الفاتورة', 'success');
}

function closeHoldModal() { closeModal('holdModal'); }

// ============================================================
// ====== الدفع والطباعة ======
// ============================================================

async function checkoutInvoice() {
    if (!requireShift()) return;
    if(currentInvoiceItems.length === 0) { showToast('⚠️ السلة فارغة', 'warning'); return; }
    showLoading('جاري حفظ الفاتورة...');
    const customerId = document.getElementById('invoiceCustomer').value;
    const discount = parseFloat(document.getElementById('calcDiscount').value) || 0;
    const warranty = document.getElementById('warrantyPeriod').value;
    const warrantyNotes = document.getElementById('warrantyNotes').value.trim();
    let subtotal = 0, totalProfit = 0, itemsHtml = '';
    currentInvoiceItems.forEach(item => {
        const total = item.sell_price * item.quantity;
        const profit = (item.sell_price - item.purchase_price) * item.quantity;
        subtotal += total;
        totalProfit += profit;
        itemsHtml += `<tr><td>${item.title}</td><td style="text-align:center;">${item.quantity}</td><td style="text-align:left;">${total.toFixed(2)}</td></tr>`;
    });
    const afterDiscount = subtotal - discount;
    const vatEnabled = localStorage.getItem('vat_enabled_' + currentStoreId) === 'true';
    const vatRate = parseFloat(localStorage.getItem('vat_rate_' + currentStoreId) || '15');
    let vatAmount = 0;
    if (vatEnabled && afterDiscount > 0) { vatAmount = afterDiscount * (vatRate / 100); }
    const netTotal = afterDiscount + vatAmount;
    const finalProfit = totalProfit - discount;

    if (selectedPaymentMethod === 'later' && (!customerId || customerId === 'نقدي')) {
        hideLoading();
        showToast('⚠️ لا يمكن الدفع الآجل للعميل النقدي — اختر عميلاً أولاً', 'error');
        return;
    }

    let invoiceNumber = 'تمت';
    const invoiceData = {
        store_id: currentStoreId,
        customer_id: customerId === 'نقدي' ? null : customerId,
        total_amount: subtotal,
        discount: discount,
        vat_amount: vatAmount,
        vat_rate: vatEnabled ? vatRate : 0,
        final_amount: netTotal,
        cost_total: totalProfit > 0 ? subtotal - totalProfit : 0,
        paid_amount: selectedPaymentMethod === 'later' ? 0 : netTotal,
        remaining_amount: selectedPaymentMethod === 'later' ? netTotal : 0,
        payment_type: selectedPaymentMethod,
        staff_name: localStorage.getItem('active_staff_name') || 'الكاشير',
        warranty: warranty,
        warranty_notes: warrantyNotes,
        shift_id: currentShift ? currentShift.id : null
    };
    try {
        let inv;
        try {
            const result = await sb.from('invoices').insert([invoiceData]).select().single();
            if(result.error) throw result.error;
            inv = result.data;
        } catch(e) {
            inv = { ...invoiceData, id: 'offline_' + Date.now(), invoice_number: 'OFF-' + Date.now().toString().slice(-6) };
            await SyncManager.enqueue('invoices', 'put', inv);
            console.warn('📦 الفاتورة حُفظت محلياً (أوفلاين)');
        }
        invoiceNumber = inv.invoice_number || 'تمت';
        if(selectedPaymentMethod === 'later' && customerId !== 'نقدي') {
            const customer = allCustomers.find(c => c.id === customerId);
            if(customer) {
                const newDebt = parseFloat(customer.total_debt || 0) + netTotal;
                const newTotalSpent = parseFloat(customer.total_spent || 0) + netTotal;
                try { await sb.from('customers').update({ total_debt: newDebt, total_spent: newTotalSpent }).eq('id', customerId); } catch(e) { await SyncManager.enqueue('customers', 'put', { id: customerId, total_debt: newDebt, total_spent: newTotalSpent }); }
                customer.total_debt = newDebt;
                customer.total_spent = newTotalSpent;
            }
        } else if(customerId !== 'نقدي') {
            const customer = allCustomers.find(c => c.id === customerId);
            if(customer) {
                const newTotalSpent = parseFloat(customer.total_spent || 0) + netTotal;
                try { await sb.from('customers').update({ total_spent: newTotalSpent }).eq('id', customerId); } catch(e) { await SyncManager.enqueue('customers', 'put', { id: customerId, total_spent: newTotalSpent }); }
                customer.total_spent = newTotalSpent;
            }
        }
        for(const item of currentInvoiceItems) {
            const prod = localProducts.find(p => p.id === item.id);
            if(prod) {
                const newStock = prod.stock - item.quantity;
                try { await sb.from('products').update({ stock: newStock }).eq('id', item.id); } catch(e) { await SyncManager.enqueue('products', 'put', { id: item.id, stock: newStock }); }
                prod.stock = newStock;
                await LocalDB.put('products', { ...prod, stock: newStock });
            }
        }
        playSound('success');
        hideLoading();
        const itemsToInsert = currentInvoiceItems.map(item => ({
            invoice_id: inv.id,
            product_id: item.id.toString().startsWith('qs_') ? null : item.id,
            product_name: item.title || item.product_name,
            name: item.title || item.product_name,
            quantity: item.quantity,
            unit_price: item.sell_price,
            price: item.sell_price,
            sell_price: item.sell_price,
            purchase_price: item.purchase_price,
            total: item.sell_price * item.quantity
        }));
        try { await sb.from('invoice_items').insert(itemsToInsert); } catch(e) { await SyncManager.enqueueBulk('invoice_items', 'put', itemsToInsert); }
        showToast(`🎉 فاتورة #${invoiceNumber} تمت بنجاح${inv.id?.toString().startsWith('offline_') ? ' (محلي - هيتزاين)' : ''}`, 'success');
        if(customerId && customerId !== 'نقدي') addCustomerPoints(customerId, netTotal);
        updateReports();
        renderInventoryTable();
        renderInvoicesTable();
        updateShiftStats();
        updateShiftUI();
    } catch(err) {
        hideLoading();
        console.error('خطأ في الحفظ:', err);
        showToast('❌ خطأ في حفظ الفاتورة: ' + err.message, 'error');
    }
    const customerName = customerId === 'نقدي' ? 'عميل نقدي' : allCustomers.find(c => c.id === customerId)?.customer_name || 'غير معروف';
    
    // ====== استخدام اسم المتجر من localStorage ======
    const storeName = localStorage.getItem('active_store_name') || 'المحل';
    document.getElementById('pHeaderName').innerText = storeName;
    document.getElementById('pHeaderSub').innerText = `فاتورة #${invoiceNumber}`;
    document.getElementById('pHeaderDate').innerText = new Date().toLocaleString('ar-EG');
    document.getElementById('pHeaderCustomer').innerText = `👤 العميل: ${customerName}`;
    document.getElementById('pHeaderPayment').innerText = `💳 الدفع: ${PAYMENT_LABELS[selectedPaymentMethod] || selectedPaymentMethod}`;
    document.getElementById('pHeaderWarranty').innerHTML = warranty !== 'لا يوجد' ? `🛡️ الضمان: ${warranty} ${warrantyNotes ? '• ' + warrantyNotes : ''}` : '';
    document.getElementById('pContent').innerHTML = `
        <div style="border-bottom:1px dashed black;padding-bottom:5px;margin-bottom:5px;">
            <table style="width:100%;text-align:right;font-size:11px;">
                <thead><tr style="border-bottom:1px solid black;"><th>الصنف</th><th style="text-align:center;">الكمية</th><th style="text-align:left;">الإجمالي</th></tr></thead>
                <tbody>${itemsHtml}</tbody>
            </table>
        </div>
        <div style="font-size:11px;line-height:1.5;">
            <div style="display:flex;justify-content:space-between;"><span>الإجمالي:</span> <span>${subtotal.toFixed(2)} ج.م</span></div>
            ${discount > 0 ? `<div style="display:flex;justify-content:space-between;"><span>الخصم:</span> <span>-${discount.toFixed(2)} ج.م</span></div>` : ''}
            ${vatAmount > 0 ? `<div style="display:flex;justify-content:space-between;"><span>ضريبة ${vatRate}%:</span> <span>+${vatAmount.toFixed(2)} ج.م</span></div>` : ''}
            <div style="display:flex;justify-content:space-between;font-weight:bold;font-size:14px;margin-top:4px;border-top:1px solid black;padding-top:4px;">
                <span>الصافي:</span> <span>${netTotal.toFixed(2)} ج.م</span>
            </div>
            ${finalProfit > 0 ? `<div style="display:flex;justify-content:space-between;color:green;"><span>هامش الربح:</span> <span>${finalProfit.toFixed(2)} ج.م</span></div>` : ''}
            ${warranty !== 'لا يوجد' ? `<div style="display:flex;justify-content:space-between;color:blue;"><span>🛡️ الضمان:</span> <span>${warranty}</span></div>` : ''}
            ${warrantyNotes ? `<div style="display:flex;justify-content:space-between;color:#666;font-size:9px;"><span>📝:</span> <span>${warrantyNotes}</span></div>` : ''}
        </div>
    `;
    window.print();
    currentInvoiceItems = [];
    document.getElementById('calcDiscount').value = 0;
    document.getElementById('warrantyNotes').value = '';
    document.getElementById('warrantyPeriod').value = 'لا يوجد';
    renderInvoiceTable();
    await loadAllData();
}

async function saveInvoiceOnly() {
    if (!requireShift()) return;
    if(currentInvoiceItems.length === 0) { showToast('⚠️ السلة فارغة', 'warning'); return; }
    const customerId = document.getElementById('invoiceCustomer').value;
    const discount = parseFloat(document.getElementById('calcDiscount').value) || 0;
    const warranty = document.getElementById('warrantyPeriod').value;
    const warrantyNotes = document.getElementById('warrantyNotes').value.trim();
    let subtotal = 0, totalProfit = 0;
    currentInvoiceItems.forEach(item => {
        subtotal += item.sell_price * item.quantity;
        totalProfit += (item.sell_price - item.purchase_price) * item.quantity;
    });
    const afterDiscount = subtotal - discount;
    const vatEnabled = localStorage.getItem('vat_enabled_' + currentStoreId) === 'true';
    const vatRate = parseFloat(localStorage.getItem('vat_rate_' + currentStoreId) || '15');
    let vatAmount = 0;
    if (vatEnabled && afterDiscount > 0) { vatAmount = afterDiscount * (vatRate / 100); }
    const netTotal = afterDiscount + vatAmount;

    if (selectedPaymentMethod === 'later' && (!customerId || customerId === 'نقدي')) {
        showToast('⚠️ لا يمكن الدفع الآجل للعميل النقدي — اختر عميلاً أولاً', 'error');
        return;
    }

    try {
        const invoiceData = {
            store_id: currentStoreId,
            customer_id: customerId === 'نقدي' ? null : customerId,
            total_amount: subtotal,
            discount: discount,
            vat_amount: vatAmount,
            vat_rate: vatEnabled ? vatRate : 0,
            final_amount: netTotal,
            cost_total: totalProfit > 0 ? subtotal - totalProfit : 0,
            paid_amount: selectedPaymentMethod === 'later' ? 0 : netTotal,
            remaining_amount: selectedPaymentMethod === 'later' ? netTotal : 0,
            payment_type: selectedPaymentMethod,
            staff_name: localStorage.getItem('active_staff_name') || 'الكاشير',
            warranty: warranty,
            warranty_notes: warrantyNotes,
            shift_id: currentShift ? currentShift.id : null
        };
        let inv;
        try {
            const result = await sb.from('invoices').insert([invoiceData]).select().single();
            if(result.error) throw result.error;
            inv = result.data;
        } catch(e) {
            inv = { ...invoiceData, id: 'offline_' + Date.now(), invoice_number: 'OFF-' + Date.now().toString().slice(-6) };
            await SyncManager.enqueue('invoices', 'put', inv);
            console.warn('📦 الفاتورة حُفظت محلياً (أوفلاين)');
        }
        if(selectedPaymentMethod === 'later' && customerId !== 'نقدي') {
            const customer = allCustomers.find(c => c.id === customerId);
            if(customer) {
                const newDebt = parseFloat(customer.total_debt || 0) + netTotal;
                const newTotalSpent = parseFloat(customer.total_spent || 0) + netTotal;
                try { await sb.from('customers').update({ total_debt: newDebt, total_spent: newTotalSpent }).eq('id', customerId); } catch(e) { await SyncManager.enqueue('customers', 'put', { id: customerId, total_debt: newDebt, total_spent: newTotalSpent }); }
                customer.total_debt = newDebt;
                customer.total_spent = newTotalSpent;
            }
        } else if(customerId !== 'نقدي') {
            const customer = allCustomers.find(c => c.id === customerId);
            if(customer) {
                const newTotalSpent = parseFloat(customer.total_spent || 0) + netTotal;
                try { await sb.from('customers').update({ total_spent: newTotalSpent }).eq('id', customerId); } catch(e) { await SyncManager.enqueue('customers', 'put', { id: customerId, total_spent: newTotalSpent }); }
                customer.total_spent = newTotalSpent;
            }
        }
        for(const item of currentInvoiceItems) {
            const prod = localProducts.find(p => p.id === item.id);
            if(prod) {
                const newStock = prod.stock - item.quantity;
                try { await sb.from('products').update({ stock: newStock }).eq('id', item.id); } catch(e) { await SyncManager.enqueue('products', 'put', { id: item.id, stock: newStock }); }
                prod.stock = newStock;
                await LocalDB.put('products', { ...prod, stock: newStock });
            }
        }
        const itemsToInsert = currentInvoiceItems.map(item => ({
            invoice_id: inv.id,
            product_id: item.id.toString().startsWith('qs_') ? null : item.id,
            product_name: item.title || item.product_name,
            name: item.title || item.product_name,
            quantity: item.quantity,
            unit_price: item.sell_price,
            price: item.sell_price,
            sell_price: item.sell_price,
            purchase_price: item.purchase_price,
            total: item.sell_price * item.quantity
        }));
        try { await sb.from('invoice_items').insert(itemsToInsert); } catch(e) { await SyncManager.enqueueBulk('invoice_items', 'put', itemsToInsert); }
        showToast(`💾 تم حفظ الفاتورة #${inv.invoice_number || 'تمت'} بنجاح${inv.id?.toString().startsWith('offline_') ? ' (محلي)' : ''}`, 'success');
        logActivity('فاتورة مبيعات', `#${inv.invoice_number || 'offline'} - الإجمالي: ${netTotal.toFixed(2)} ج.م - ${currentInvoiceItems.length} منتج`, 'sale');
        currentInvoiceItems = [];
        document.getElementById('calcDiscount').value = 0;
        document.getElementById('warrantyNotes').value = '';
        document.getElementById('warrantyPeriod').value = 'لا يوجد';
        renderInvoiceTable();
        await loadAllData();
        updateReports();
        updateShiftStats();
        updateShiftUI();
    } catch(err) {
        showToast('❌ خطأ في الحفظ: ' + err.message, 'error');
    }
}

function openInvoices() {
    if (!canViewInvoices()) { showToastPermission(); return; }
    document.getElementById('invoicesTab').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    renderInvoicesTable();
}

function closeInvoices() {
    document.getElementById('invoicesTab').classList.add('hidden');
    document.body.style.overflow = 'auto';
}

function renderInvoicesTable() {
    const tbody = document.getElementById('invoicesTableBody');
    const emptyMsg = document.getElementById('emptyInvoices');
    if(!tbody) return;
    if(allInvoices.length === 0) {
        tbody.innerHTML = '';
        emptyMsg.classList.remove('hidden');
        return;
    }
    emptyMsg.classList.add('hidden');
    let pagContainer = document.getElementById('invoicesPagination');
    if(!pagContainer) {
        pagContainer = document.createElement('div');
        pagContainer.id = 'invoicesPagination';
        pagContainer.className = 'mt-3';
        const table = tbody.closest('table');
        if(table && table.parentNode) table.parentNode.insertBefore(pagContainer, table.nextSibling);
    }
    if(!Pagination._instances['invoicesPagination']) {
        Pagination.create('invoicesPagination', { itemsPerPage: 20 });
    }
    Pagination.update('invoicesPagination', allInvoices.length);
    const pageItems = Pagination.getPageData('invoicesPagination', allInvoices);
    tbody.innerHTML = pageItems.map((inv, index) => {
        const customer = allCustomers.find(c => c.id === inv.customer_id);
        const customerName = customer ? customer.customer_name : 'عميل نقدي';
        return `
            <tr class="border-b border-slate-800/60 hover:bg-slate-800/20 transition cursor-pointer" onclick="viewInvoiceDetail('${inv.id}')">
                <td class="p-3">${index + 1}</td>
                <td class="p-3 font-mono text-blue-400">${inv.invoice_number || 'N/A'}</td>
                <td class="p-3 font-bold text-slate-200">${customerName}</td>
                <td class="p-3 text-center text-slate-400">${parseFloat(inv.total_amount || 0).toFixed(2)}</td>
                <td class="p-3 text-center text-amber-400">${parseFloat(inv.discount || 0).toFixed(2)}</td>
                <td class="p-3 text-center text-emerald-400 font-bold">${parseFloat(inv.final_amount || 0).toFixed(2)}</td>
                <td class="p-3 text-center">${PAYMENT_LABELS[inv.payment_type] || inv.payment_type}</td>
                <td class="p-3 text-center text-slate-400 text-[10px]">${new Date(inv.created_at || inv.date).toLocaleString('ar-EG')}</td>
                <td class="p-3 text-center text-slate-500 text-[10px]">${inv.staff_name || '—'}</td>
                <td class="p-3 text-center" onclick="event.stopPropagation()">
                    <button onclick="reprintInvoice('${inv.id}')" class="bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 px-2 py-1 rounded-lg text-[10px] transition">
                        <i class="fa-solid fa-print"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

async function viewInvoiceDetail(invId) {
    const inv = allInvoices.find(i => i.id === invId);
    if(!inv) return;
    const customer = allCustomers.find(c => c.id === inv.customer_id);
    const customerName = customer ? customer.customer_name : 'عميل نقدي';
    const { data: items } = await sb.from('invoice_items').select('*').eq('invoice_id', invId);
    const el = document.getElementById('invoiceDetailContent');
    if(!el) return;
    el.innerHTML = `
        <div class="space-y-3">
            <div class="flex justify-between items-center pb-3" style="border-bottom: 1px solid var(--border);">
                <div>
                    <div class="font-mono text-sm font-bold" style="color: var(--info);">${inv.invoice_number || 'N/A'}</div>
                    <div class="text-[10px] mt-1" style="color: var(--text-3);">${new Date(inv.created_at || inv.date).toLocaleString('ar-EG')}</div>
                </div>
                <div class="text-left">
                    <div class="text-xs font-bold" style="color: var(--text-1);">${customerName}</div>
                    <div class="text-[10px]" style="color: var(--text-3);">${PAYMENT_LABELS[inv.payment_type] || inv.payment_type}</div>
                </div>
            </div>
            <div class="text-[10px] font-bold" style="color: var(--text-2);">بنود الفاتورة</div>
            <div class="space-y-1.5">
                ${(items || []).map(item => `
                    <div class="flex justify-between items-center p-2 rounded-lg" style="background: var(--bg-body);">
                        <div>
                            <div class="text-[10px] font-bold" style="color: var(--text-1);">${item.product_name || item.name || 'منتج'}</div>
                            <div class="text-[9px]" style="color: var(--text-3);">${item.quantity} × ${parseFloat(item.sell_price || item.unit_price || 0).toFixed(2)} ج.م</div>
                        </div>
                        <div class="text-[10px] font-bold" style="color: var(--success);">${parseFloat(item.total || (item.quantity * (item.sell_price || item.unit_price || 0))).toFixed(2)} ج.م</div>
                    </div>
                `).join('') || '<div class="text-center p-3 text-[10px]" style="color: var(--text-3);">لا توجد بنود</div>'}
            </div>
            <div class="pt-2 space-y-1" style="border-top: 1px solid var(--border);">
                <div class="flex justify-between text-[10px]" style="color: var(--text-3);"><span>الإجمالي</span><span>${parseFloat(inv.total_amount || 0).toFixed(2)} ج.م</span></div>
                ${parseFloat(inv.discount || 0) > 0 ? `<div class="flex justify-between text-[10px]" style="color: var(--danger);"><span>الخصم</span><span>-${parseFloat(inv.discount || 0).toFixed(2)} ج.م</span></div>` : ''}
                <div class="flex justify-between text-[10px] font-bold" style="color: var(--text-1);"><span>الصافي</span><span>${parseFloat(inv.final_amount || 0).toFixed(2)} ج.م</span></div>
                <div class="flex justify-between text-[10px]" style="color: var(--success);"><span>المدفوع</span><span>${parseFloat(inv.paid_amount || 0).toFixed(2)} ج.م</span></div>
                ${parseFloat(inv.remaining_amount || 0) > 0 ? `<div class="flex justify-between text-[10px]" style="color: var(--danger);"><span>المتبقي</span><span>${parseFloat(inv.remaining_amount || 0).toFixed(2)} ج.م</span></div>` : ''}
            </div>
            ${inv.warranty && inv.warranty !== 'لا يوجد' ? `<div class="flex justify-between text-[10px]" style="color: var(--text-3);"><span>🛡️ الضمان</span><span>${inv.warranty}</span></div>` : ''}
            ${inv.warranty_notes ? `<div class="text-[9px] p-2 rounded-lg" style="background: var(--bg-body); color: var(--text-3);">📝 ${inv.warranty_notes}</div>` : ''}
            <div class="flex justify-between text-[10px]" style="color: var(--text-3);"><span>كاشير</span><span>${inv.staff_name || '—'}</span></div>
            <div class="flex gap-2 pt-2" style="border-top: 1px solid var(--border);">
                <button onclick="reprintInvoice('${inv.id}')" class="flex-1 py-2 rounded-xl text-[10px] font-bold transition" style="background: var(--accent-soft); color: var(--accent); border: 1px solid var(--border);">
                    <i class="fa-solid fa-print ml-1"></i> طباعة
                </button>
                <button onclick="exportInvoicePDF('${inv.id}')" class="flex-1 py-2 rounded-xl text-[10px] font-bold transition" style="background: rgba(239,168,0,0.1); color: #eab308; border: 1px solid rgba(239,168,0,0.3);">
                    <i class="fa-solid fa-file-pdf ml-1"></i> PDF
                </button>
                <button onclick="deleteInvoice('${inv.id}')" class="flex-1 py-2 rounded-xl text-[10px] font-bold transition" style="background: rgba(239,68,68,0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.3);">
                    <i class="fa-solid fa-trash ml-1"></i> حذف
                </button>
            </div>
        </div>
    `;
    document.getElementById('invoiceDetailModal').classList.remove('hidden');
}

async function deleteInvoice(invId) {
    if(!canEdit()) { showToastPermission(); return; }
    const confirmed = await showConfirm('هل أنت متأكد من حذف هذه الفاتورة؟', 'حذف الفاتورة', { danger: true });
    if(!confirmed) return;
    try {
        const { data: items } = await sb.from('invoice_items').select('product_id, quantity').eq('invoice_id', invId);
        if (items && items.length > 0) {
            for (const item of items) {
                if (!item.product_id) continue;
                const prod = localProducts.find(p => p.id === item.product_id);
                if (prod) {
                    const newStock = (parseInt(prod.stock) || 0) + (item.quantity || 1);
                    try { await sb.from('products').update({ stock: newStock }).eq('id', item.product_id); } catch(e) { await SyncManager.enqueue('products', 'put', { id: item.product_id, stock: newStock }); }
                    prod.stock = newStock;
                    await LocalDB.put('products', { ...prod, stock: newStock });
                } else {
                    const { data: dbProd } = await sb.from('products').select('*').eq('id', item.product_id).single();
                    if (dbProd) {
                        const newStock = (parseInt(dbProd.stock) || 0) + (item.quantity || 1);
                        try { await sb.from('products').update({ stock: newStock }).eq('id', item.product_id); } catch(e) { await SyncManager.enqueue('products', 'put', { id: item.product_id, stock: newStock }); }
                        await LocalDB.put('products', { ...dbProd, stock: newStock });
                    }
                }
            }
        }
        await sb.from('invoice_items').delete().eq('invoice_id', invId);
        await sb.from('invoices').delete().eq('id', invId);
        allInvoices = allInvoices.filter(i => i.id !== invId);
        try {
            const dbItems = await LocalDB.getAll('invoice_items');
            const toDelete = dbItems.filter(i => i.invoice_id === invId);
            for (const item of toDelete) { await LocalDB.delete('invoice_items', item.id); }
            await LocalDB.delete('invoices', invId);
        } catch(e) {}
        renderInvoicesTable();
        renderProductsGrid(localProducts);
        renderInventoryTable();
        closeModal('invoiceDetailModal');
        showToast('🗑️ تم حذف الفاتورة واستعادة المخزون', 'success');
        updateReports();
        updateShiftStats();
    } catch(err) { showToast('❌ خطأ: ' + err.message, 'error'); }
}

const debouncedFilterInvoices = debounce(() => {
    Pagination.create('invoicesPagination', { itemsPerPage: 20 });
    filterInvoices();
}, 250);

function filterInvoices() {
    const search = document.getElementById('searchInvoiceInput').value.toLowerCase();
    const type = document.getElementById('invoiceFilterType').value;
    const dateFrom = document.getElementById('invoiceDateFrom')?.value;
    const dateTo = document.getElementById('invoiceDateTo')?.value;
    const amountMin = parseFloat(document.getElementById('invoiceAmountMin')?.value) || 0;
    const amountMax = parseFloat(document.getElementById('invoiceAmountMax')?.value) || Infinity;
    const staffFilter = (document.getElementById('invoiceStaffFilter')?.value || '').toLowerCase();
    let filtered = allInvoices;
    if(type !== 'all') filtered = filtered.filter(inv => inv.payment_type === type);
    if(search) filtered = filtered.filter(inv => {
        const customer = allCustomers.find(c => c.id === inv.customer_id);
        const customerName = customer ? customer.customer_name : 'عميل نقدي';
        return (inv.invoice_number && inv.invoice_number.toString().includes(search)) || customerName.includes(search);
    });
    if(dateFrom) filtered = filtered.filter(inv => {
        const invDate = new Date(inv.created_at || inv.date).toISOString().split('T')[0];
        return invDate >= dateFrom;
    });
    if(dateTo) filtered = filtered.filter(inv => {
        const invDate = new Date(inv.created_at || inv.date).toISOString().split('T')[0];
        return invDate <= dateTo;
    });
    if(amountMin > 0) filtered = filtered.filter(inv => parseFloat(inv.final_amount || 0) >= amountMin);
    if(amountMax < Infinity) filtered = filtered.filter(inv => parseFloat(inv.final_amount || 0) <= amountMax);
    if(staffFilter) filtered = filtered.filter(inv => (inv.staff_name || '').toLowerCase().includes(staffFilter));
    const tbody = document.getElementById('invoicesTableBody');
    const emptyMsg = document.getElementById('emptyInvoices');
    if(filtered.length === 0) { tbody.innerHTML = ''; emptyMsg.classList.remove('hidden'); return; }
    emptyMsg.classList.add('hidden');
    let pagContainer = document.getElementById('invoicesPagination');
    if(!pagContainer) {
        pagContainer = document.createElement('div');
        pagContainer.id = 'invoicesPagination';
        pagContainer.className = 'mt-3';
        const table = tbody.closest('table');
        if(table && table.parentNode) table.parentNode.insertBefore(pagContainer, table.nextSibling);
    }
    if(!Pagination._instances['invoicesPagination']) {
        Pagination.create('invoicesPagination', { itemsPerPage: 20 });
    }
    Pagination.update('invoicesPagination', filtered.length);
    const pageItems = Pagination.getPageData('invoicesPagination', filtered);
    tbody.innerHTML = pageItems.map((inv, index) => {
        const customer = allCustomers.find(c => c.id === inv.customer_id);
        const customerName = customer ? customer.customer_name : 'عميل نقدي';
        return `
            <tr class="border-b border-slate-800/60 hover:bg-slate-800/20 transition">
                <td class="p-3">${index + 1}</td>
                <td class="p-3 font-mono text-blue-400">${inv.invoice_number || 'N/A'}</td>
                <td class="p-3 font-bold text-slate-200">${customerName}</td>
                <td class="p-3 text-center text-slate-400">${parseFloat(inv.total_amount || 0).toFixed(2)}</td>
                <td class="p-3 text-center text-amber-400">${parseFloat(inv.discount || 0).toFixed(2)}</td>
                <td class="p-3 text-center text-emerald-400 font-bold">${parseFloat(inv.final_amount || 0).toFixed(2)}</td>
                <td class="p-3 text-center">${PAYMENT_LABELS[inv.payment_type] || inv.payment_type}</td>
                <td class="p-3 text-center text-slate-400 text-[10px]">${new Date(inv.created_at || inv.date).toLocaleString('ar-EG')}</td>
                <td class="p-3 text-center text-slate-500 text-[10px]">${inv.staff_name || '—'}</td>
                <td class="p-3 text-center">
                    <button onclick="reprintInvoice('${inv.id}')" class="bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 px-2 py-1 rounded-lg text-[10px] transition">
                        <i class="fa-solid fa-print"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function toggleAdvancedSearch() {
    const panel = document.getElementById('advancedSearchPanel');
    if(panel) panel.classList.toggle('hidden');
}

function clearAdvancedSearch() {
    const ids = ['invoiceDateFrom', 'invoiceDateTo', 'invoiceAmountMin', 'invoiceAmountMax', 'invoiceStaffFilter'];
    ids.forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; });
    document.getElementById('searchInvoiceInput').value = '';
    document.getElementById('invoiceFilterType').value = 'all';
    filterInvoices();
}

async function reprintInvoice(invoiceId) {
    const inv = allInvoices.find(i => i.id === invoiceId);
    if(!inv) { showToast('⚠️ الفاتورة غير موجودة', 'error'); return; }
    const customer = allCustomers.find(c => c.id === inv.customer_id);
    const customerName = customer ? customer.customer_name : 'عميل نقدي';
    const storeName = localStorage.getItem('active_store_name') || 'المحل';

    let itemsHtml = '';
    try {
        const { data: items } = await sb.from('invoice_items').select('*').eq('invoice_id', invoiceId);
        if(items && items.length > 0) {
            itemsHtml = items.map(item => `
                <tr style="border-bottom:1px solid #eee;">
                    <td style="padding:3px 0;font-size:11px;">${item.product_name || 'منتج'}</td>
                    <td style="text-align:center;padding:3px 0;font-size:11px;">${item.quantity}</td>
                    <td style="text-align:left;padding:3px 0;font-size:11px;">${parseFloat(item.total || 0).toFixed(2)}</td>
                </tr>
            `).join('');
        } else {
            itemsHtml = '<tr><td colspan="3" style="text-align:center;color:#999;font-size:10px;padding:5px;">لا توجد تفاصيل</td></tr>';
        }
    } catch(e) { itemsHtml = '<tr><td colspan="3" style="text-align:center;color:#999;">خطأ في تحميل البنود</td></tr>'; }

    document.getElementById('pHeaderName').innerText = storeName;
    document.getElementById('pHeaderSub').innerText = `فاتورة #${inv.invoice_number || 'N/A'}`;
    document.getElementById('pHeaderDate').innerText = new Date(inv.created_at || inv.date).toLocaleString('ar-EG');
    document.getElementById('pHeaderCustomer').innerText = `👤 العميل: ${customerName}`;
    document.getElementById('pHeaderPayment').innerText = `💳 الدفع: ${PAYMENT_LABELS[inv.payment_type] || inv.payment_type}`;
    document.getElementById('pHeaderWarranty').innerHTML = inv.warranty && inv.warranty !== 'لا يوجد' ? `🛡️ الضمان: ${inv.warranty} ${inv.warranty_notes ? '• ' + inv.warranty_notes : ''}` : '';
    document.getElementById('pContent').innerHTML = `
        <div style="border-bottom:1px dashed black;padding-bottom:5px;margin-bottom:5px;">
            <table style="width:100%;text-align:right;font-size:11px;">
                <thead><tr style="border-bottom:1px solid black;"><th>الصنف</th><th style="text-align:center;">الكمية</th><th style="text-align:left;">الإجمالي</th></tr></thead>
                <tbody>${itemsHtml}</tbody>
            </table>
        </div>
        <div style="font-size:11px;line-height:1.5;">
            <div style="display:flex;justify-content:space-between;"><span>الإجمالي:</span> <span>${parseFloat(inv.total_amount || 0).toFixed(2)} ج.م</span></div>
            ${parseFloat(inv.discount || 0) > 0 ? `<div style="display:flex;justify-content:space-between;"><span>الخصم:</span> <span>-${parseFloat(inv.discount || 0).toFixed(2)} ج.م</span></div>` : ''}
            <div style="display:flex;justify-content:space-between;font-weight:bold;font-size:14px;margin-top:4px;border-top:1px solid black;padding-top:4px;">
                <span>الصافي:</span> <span>${parseFloat(inv.final_amount || 0).toFixed(2)} ج.م</span>
            </div>
            ${inv.paid_amount ? `<div style="display:flex;justify-content:space-between;font-size:10px;"><span>المدفوع:</span> <span>${parseFloat(inv.paid_amount || 0).toFixed(2)} ج.م</span></div>` : ''}
            ${inv.remaining_amount ? `<div style="display:flex;justify-content:space-between;font-size:10px;color:red;"><span>المتبقي:</span> <span>${parseFloat(inv.remaining_amount || 0).toFixed(2)} ج.م</span></div>` : ''}
            ${inv.warranty && inv.warranty !== 'لا يوجد' ? `<div style="display:flex;justify-content:space-between;color:blue;"><span>🛡️ الضمان:</span> <span>${inv.warranty}</span></div>` : ''}
            ${inv.warranty_notes ? `<div style="display:flex;justify-content:space-between;color:#666;font-size:9px;"><span>📝:</span> <span>${inv.warranty_notes}</span></div>` : ''}
        </div>
    `;
    window.print();
    showToast('🖨️ تم إرسال الفاتورة للطباعة', 'success');
}

// ============================================================
// ====== عروض الأسعار ======
// ============================================================

function getSavedQuotations() {
    return JSON.parse(localStorage.getItem('quotations_' + currentStoreId) || '[]');
}

function saveQuotationsLocal(quotations) {
    localStorage.setItem('quotations_' + currentStoreId, JSON.stringify(quotations));
}

async function createQuotation() {
    if(currentInvoiceItems.length === 0) { showToast('⚠️ أضف منتجات أولاً لعمل عرض سعر', 'warning'); return; }
    const customerId = document.getElementById('invoiceCustomer').value;
    const customerName = customerId === 'نقدي' ? 'عميل نقدي' : allCustomers.find(c => c.id === customerId)?.customer_name || 'غير معروف';
    const discount = parseFloat(document.getElementById('calcDiscount').value) || 0;
    let subtotal = 0;
    currentInvoiceItems.forEach(item => { subtotal += item.sell_price * item.quantity; });
    const afterDiscount = subtotal - discount;
    const vatEnabled = isVatEnabled();
    const vatRate = getVatRate();
    let vatAmount = 0;
    if (vatEnabled && afterDiscount > 0) { vatAmount = afterDiscount * (vatRate / 100); }
    const netTotal = afterDiscount + vatAmount;
    
    const quotationNumber = 'Q-' + Date.now().toString(36).toUpperCase();
    const quotation = {
        id: crypto.randomUUID(),
        number: quotationNumber,
        date: new Date().toISOString(),
        customer_name: customerName,
        customer_id: customerId === 'نقدي' ? null : customerId,
        items: currentInvoiceItems.map(i => ({ title: i.title, sell_price: i.sell_price, quantity: i.quantity, total: i.sell_price * i.quantity })),
        subtotal,
        discount,
        vat_amount: vatAmount,
        vat_rate: vatEnabled ? vatRate : 0,
        net_total: netTotal,
        store_name: localStorage.getItem('active_store_name') || 'المحل',
        staff_name: localStorage.getItem('active_staff_name') || 'الكاشير'
    };
    
    const quotations = getSavedQuotations();
    quotations.unshift(quotation);
    saveQuotationsLocal(quotations);
    
    // إنشاء نص عرض السعر للواتساب
    let itemsText = '';
    quotation.items.forEach((item, i) => {
        itemsText += `${i+1}. ${item.title} × ${item.quantity} = ${item.total.toFixed(2)} ج.م\n`;
    });
    const validUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('ar-EG');
    
    const waText = `📋 *عرض سعر ${quotationNumber}*
📅 ${new Date().toLocaleString('ar-EG')}
🏪 ${quotation.store_name}
👤 العميل: ${customerName}
━━━━━━━━━━━━━━
${itemsText}━━━━━━━━━━━━━━
💰 الإجمالي: ${subtotal.toFixed(2)} ج.م
${discount > 0 ? `🎫 الخصم: -${discount.toFixed(2)} ج.م\n` : ''}${vatAmount > 0 ? `📊 الضريبة ${vatRate}%: +${vatAmount.toFixed(2)} ج.م\n` : ''}✨ *الصافي: ${netTotal.toFixed(2)} ج.م*
⏰ صالح حتى: ${validUntil}
━━━━━━━━━━━━━━
شكراً لتعاملكم معنا 🙏`;
    
    const waUrl = `https://wa.me/?text=${encodeURIComponent(waText)}`;
    window.open(waUrl, '_blank');
    showToast(`📋 تم إنشاء عرض السعر ${quotationNumber}`, 'success');
}

function openSavedQuotations() {
    const quotations = getSavedQuotations();
    let html = '';
    if (quotations.length === 0) {
        html = '<div class="text-center py-10 text-slate-500"><i class="fa-solid fa-file-invoice text-3xl opacity-30 mb-2"></i><p class="text-[10px]">لا توجد عروض أسعار محفوظة</p></div>';
    } else {
        quotations.forEach((q, i) => {
            html += `
            <div class="bg-[#0a1020] border border-slate-800 rounded-xl p-3 mb-2">
                <div class="flex justify-between items-center mb-2">
                    <div>
                        <span class="text-xs font-bold text-blue-400">${q.number}</span>
                        <span class="text-[8px] text-slate-500 mr-2">${new Date(q.date).toLocaleDateString('ar-EG')}</span>
                    </div>
                    <button onclick="deleteQuotation(${i})" class="text-red-400 hover:text-red-300 text-[10px]"><i class="fa-solid fa-trash"></i></button>
                </div>
                <p class="text-[9px] text-slate-400">👤 ${q.customer_name}</p>
                <p class="text-[9px] text-slate-400">📦 ${q.items.length} منتج</p>
                <p class="text-xs font-bold text-emerald-400">${q.net_total.toFixed(2)} ج.م</p>
                <button onclick="resendQuotation(${i})" class="mt-2 w-full bg-green-600/20 text-green-400 border border-green-500/30 py-1 rounded-lg text-[9px] font-bold">
                    <i class="fa-brands fa-whatsapp"></i> إعادة إرسال
                </button>
            </div>`;
        });
    }
    document.getElementById('quotationsList').innerHTML = html;
    document.getElementById('quotationsTab').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeQuotations() {
    document.getElementById('quotationsTab').classList.add('hidden');
    document.body.style.overflow = 'auto';
}

async function deleteQuotation(index) {
    const confirmed = await showConfirm('حذف عرض السعر؟', 'حذف', { danger: true });
    if (!confirmed) return;
    const quotations = getSavedQuotations();
    quotations.splice(index, 1);
    saveQuotationsLocal(quotations);
    openSavedQuotations();
    showToast('✅ تم الحذف', 'success');
}

function resendQuotation(index) {
    const q = getSavedQuotations()[index];
    if (!q) return;
    let itemsText = '';
    q.items.forEach((item, i) => {
        itemsText += `${i+1}. ${item.title} × ${item.quantity} = ${item.total.toFixed(2)} ج.م\n`;
    });
    const waText = `📋 *عرض سعر ${q.number}*
📅 ${new Date(q.date).toLocaleString('ar-EG')}
🏪 ${q.store_name}
👤 العميل: ${q.customer_name}
━━━━━━━━━━━━━━
${itemsText}━━━━━━━━━━━━━━
💰 الإجمالي: ${q.subtotal.toFixed(2)} ج.م
${q.discount > 0 ? `🎫 الخصم: -${q.discount.toFixed(2)} ج.م\n` : ''}${q.vat_amount > 0 ? `📊 الضريبة ${q.vat_rate}%: +${q.vat_amount.toFixed(2)} ج.م\n` : ''}✨ *الصافي: ${q.net_total.toFixed(2)} ج.م*
⏰ صالح حتى: 7 أيام
━━━━━━━━━━━━━━
شكراً لتعاملكم معنا 🙏`;
    window.open(`https://wa.me/?text=${encodeURIComponent(waText)}`, '_blank');
}

// ============================================================
// ====== المرتجعات ======
// ============================================================

async function openReturnModal() {
    document.getElementById('returnModal').classList.remove('hidden');
    document.getElementById('returnModal').classList.add('flex');
    document.getElementById('returnInvoiceId').value = '';
    document.getElementById('returnItemsList').innerHTML = '<p class="text-center text-xs" style="color: var(--text-3);">أدخل رقم الفاتورة ثم اضغط بحث</p>';
    document.getElementById('returnTotal').textContent = '0.00 ج.م';
}

document.getElementById('returnInvoiceId').addEventListener('blur', async function() {
    const invNum = this.value.trim();
    if (!invNum) return;
    const list = document.getElementById('returnItemsList');
    list.innerHTML = '<div class="text-center"><i class="fa-solid fa-spinner fa-spin"></i></div>';

    try {
        let invoice = allInvoices.find(i => String(i.invoice_number) === invNum);
        let items = null;

        if (invoice) {
            items = await LocalDB.getAll('invoice_items').then(all => all.filter(i => i.invoice_id === invoice.id));
            if (!items || items.length === 0) {
                const supabaseResult = await sb.from('invoice_items').select('*').eq('invoice_id', invoice.id);
                items = supabaseResult.data || [];
            }
        } else {
            const { data: supInvoice } = await sb.from('invoices').select('*').eq('invoice_number', invNum).eq('store_id', currentStoreId).single();
            invoice = supInvoice;
            if (invoice) {
                const { data: supItems } = await sb.from('invoice_items').select('*').eq('invoice_id', invoice.id);
                items = supItems || [];
            }
        }

        if (!invoice) { list.innerHTML = '<p class="text-center text-xs" style="color: var(--danger);">فاتورة غير موجودة</p>'; return; }
        if (!items || items.length === 0) { list.innerHTML = '<p class="text-center text-xs" style="color: var(--danger);">لا توجد عناصر</p>'; return; }

        list.innerHTML = items.map(item => `
            <div class="flex items-center gap-2 p-2 rounded-lg" style="background: var(--bg-card); border: 1px solid var(--border);">
                <input type="checkbox" class="return-check" data-id="${item.id}" data-price="${item.unit_price || item.price}" data-name="${item.product_name || item.name || 'منتج'}" onchange="updateReturnTotal()">
                <div class="flex-1">
                    <p class="text-xs font-bold" style="color: var(--text-1);">${item.product_name || item.name || 'منتج'}</p>
                    <p class="text-[9px]" style="color: var(--text-3);">الكمية: ${item.quantity || 1} × ${parseFloat(item.unit_price || item.price || 0).toFixed(2)} ج.م</p>
                </div>
            </div>
        `).join('');
        list.dataset.invoiceId = invoice.id;
    } catch(e) {
        list.innerHTML = `<p class="text-center text-xs" style="color: var(--danger);">خطأ: ${e.message}</p>`;
    }
});

function updateReturnTotal() {
    let total = 0;
    document.querySelectorAll('.return-check:checked').forEach(cb => {
        total += parseFloat(cb.dataset.price || 0);
    });
    document.getElementById('returnTotal').textContent = total.toFixed(2) + ' ج.م';
}

async function processReturn() {
    const checkboxes = document.querySelectorAll('.return-check:checked');
    if (checkboxes.length === 0) { showToast('اختر منتج واحد على الأقل', 'warning'); return; }

    const reason = document.getElementById('returnReason').value;
    const notes = document.getElementById('returnNotes').value;
    const invoiceId = document.getElementById('returnItemsList').dataset.invoiceId;

    let totalRefund = 0;
    for (const cb of checkboxes) {
        const price = parseFloat(cb.dataset.price || 0);
        totalRefund += price;

        const { data: item } = await sb.from('invoice_items').select('product_id, quantity').eq('id', cb.dataset.id).single();
        if (item && item.product_id) {
            const prod = localProducts.find(p => p.id === item.product_id);
            if (prod) {
                const newStock = (parseInt(prod.stock) || 0) + (item.quantity || 1);
                try { await sb.from('products').update({ stock: newStock }).eq('id', item.product_id); } catch(e) { await SyncManager.enqueue('products', 'put', { id: item.product_id, stock: newStock }); }
                prod.stock = newStock;
                await LocalDB.put('products', { ...prod, stock: newStock });
            } else {
                const { data: dbProd } = await sb.from('products').select('*').eq('id', item.product_id).single();
                if (dbProd) {
                    const newStock = (parseInt(dbProd.stock) || 0) + (item.quantity || 1);
                    try { await sb.from('products').update({ stock: newStock }).eq('id', item.product_id); } catch(e) { await SyncManager.enqueue('products', 'put', { id: item.product_id, stock: newStock }); }
                    await LocalDB.put('products', { ...dbProd, stock: newStock });
                }
            }
        }
    }

    await sb.from('finance_transactions').insert({
        store_id: currentStoreId,
        type: 'expense',
        amount: totalRefund,
        description: `مرتجع فاتورة ${invoiceId || ''} - ${reason} - ${notes}`,
        category: 'مرتجعات'
    });

    showToast(`تم رجوع ${totalRefund.toFixed(2)} ج.م بنجاح`, 'success');
    closeModal('returnModal');
    loadAllData();
}
