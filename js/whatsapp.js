// TAGGER PRO V6 - WhatsApp Integration

const waTemplates = {
    debt: '💰 تذكير بالديون\n\nمرحباً {الاسم} 👋\nنتذكر أن لديك مديونية مستحقة.\nيرجى المراجعة والسداد في أقرب وقت.\n\nشكراً لتعاونك 🙏',
    offer: '🎉 عرض خاص!\n\nمرحباً {الاسم} 👋\nلدينا عروض حصرية لك!\nاستفسر عن أحدث المنتجات والأسعار 💡',
    welcome: '👋 أهلاً وسهلاً!\n\nمرحباً {الاسم} 🌟\nيسعدنا انضمامك لعملائنا.\nنتمنى لك تجربة تسوق رائعة! 😊',
    warranty: '🛡️ تذكير بالضمان\n\nمرحباً {الاسم} 👋\nنذكرك بضمان منتجك.\nللاستفسار عن الضمان أو الصيانة، تواصل معنا.',
    birthday: '🎂 عيد ميلاد سعيد!\n\nمرحباً {الاسم} 🎉\nكل سنة وأنت بألف خير!\nنتمنى لك عاماً مليئاً بالسعادة والنجاح 🌟'
};

function useWATemplate(key) {
    document.getElementById('bulkWhatsAppMsg').value = waTemplates[key] || '';
    updateBulkWAPreview();
    updateBulkWACount();
}

function updateBulkWAPreview() {
    const msg = document.getElementById('bulkWhatsAppMsg').value;
    const preview = document.getElementById('bulkWAPreview');
    const previewText = document.getElementById('bulkWAPreviewText');
    if (msg.trim()) {
        preview.classList.remove('hidden');
        previewText.textContent = msg.replace('{الاسم}', 'أحمد محمد');
    } else {
        preview.classList.add('hidden');
    }
}

document.addEventListener('input', function(e) {
    if (e.target.id === 'bulkWhatsAppMsg') updateBulkWAPreview();
});

function updateBulkWACount() {
    const onlyDebt = document.getElementById('bulkWAOnlyDebt')?.checked;
    let list = allCustomers.filter(c => c.phone && c.phone.trim());
    if (onlyDebt) list = list.filter(c => c.total_debt > 0);
    document.getElementById('bulkWACount').textContent = list.length + ' عميل لديهم رقم هاتف';
}

function openBulkWhatsApp() {
    document.getElementById('bulkWAOnlyDebt').checked = false;
    updateBulkWACount();
    document.getElementById('bulkWhatsAppMsg').value = '';
    document.getElementById('bulkWAProgress').classList.add('hidden');
    document.getElementById('bulkWAPreview').classList.add('hidden');
    document.getElementById('bulkWASendBtn').disabled = false;
    document.getElementById('bulkWASendBtn').innerHTML = '<i class="fa-solid fa-paper-plane ml-2"></i> إرسال للجميع';
    document.getElementById('bulkWhatsAppModal').classList.remove('hidden');
}

function sendBulkWhatsApp() {
    const msg = document.getElementById('bulkWhatsAppMsg').value.trim();
    if (!msg) { showToast('⚠️ اكتب رسالتك أولاً', 'error'); return; }
    const onlyDebt = document.getElementById('bulkWAOnlyDebt')?.checked;
    let customersWithPhone = allCustomers.filter(c => c.phone && c.phone.trim());
    if (onlyDebt) customersWithPhone = customersWithPhone.filter(c => c.total_debt > 0);
    if (customersWithPhone.length === 0) { showToast('⚠️ لا يوجد عملاء بأرقام هواتف', 'error'); return; }

    document.getElementById('bulkWASendBtn').disabled = true;
    document.getElementById('bulkWASendBtn').innerHTML = '<i class="fa-solid fa-spinner fa-spin ml-2"></i> جاري الإرسال...';
    document.getElementById('bulkWAProgress').classList.remove('hidden');

    let sent = 0;
    const total = customersWithPhone.length;

    function openNext() {
        if (sent >= total) {
            document.getElementById('bulkWAProgressBar').style.width = '100%';
            document.getElementById('bulkWAProgressPct').textContent = '100%';
            document.getElementById('bulkWAProgressText').textContent = `${total} / ${total}`;
            showToast(`✅ تم فتح واتساب لـ ${total} عميل بنجاح!`, 'success');
            document.getElementById('bulkWASendBtn').innerHTML = '<i class="fa-solid fa-check ml-2"></i> تم بنجاح!';
            setTimeout(() => closeModal('bulkWhatsAppModal'), 1500);
            return;
        }
        const c = customersWithPhone[sent];
        const personalizedMsg = msg.replace('{الاسم}', c.customer_name || '').replace('{المبلغ}', (c.total_debt || 0).toLocaleString('ar-EG'));
        const url = `https://wa.me/${cleanPhoneForWA(c.phone)}?text=${encodeURIComponent(personalizedMsg)}`;
        window.open(url, '_blank');
        sent++;
        const pct = Math.round((sent / total) * 100);
        document.getElementById('bulkWAProgressBar').style.width = pct + '%';
        document.getElementById('bulkWAProgressPct').textContent = pct + '%';
        document.getElementById('bulkWAProgressText').textContent = `${sent} / ${total}`;
        setTimeout(openNext, 600);
    }
    openNext();
}

// ============================================================
// ====== واتساب ======
// ============================================================

function sendWhatsApp() {
    if(currentInvoiceItems.length === 0) { showToast('⚠️ السلة فارغة', 'warning'); return; }
    const customerSelect = document.getElementById('invoiceCustomer');
    const customerId = customerSelect.value;
    let phone = '';
    if(customerId !== 'نقدي') {
        const customer = allCustomers.find(c => c.id === customerId);
        if(customer && customer.phone) phone = customer.phone;
    }
    if(!phone) {
        const inputPhone = prompt('📱 أدخل رقم هاتف العميل (لإرسال الفاتورة عبر واتساب):');
        if(!inputPhone) return;
        phone = inputPhone;
    }
    phone = cleanPhoneForWA(phone);
    let message = '🛍️ *فاتورة TAGGER PRO*\n';
    message += `📅 ${new Date().toLocaleString('ar-EG')}\n`;
    message += '─'.repeat(30) + '\n';
    let total = 0;
    currentInvoiceItems.forEach(item => {
        const itemTotal = item.sell_price * item.quantity;
        total += itemTotal;
        message += `• ${item.title} × ${item.quantity} = ${itemTotal.toFixed(2)} ج.م\n`;
    });
    message += '─'.repeat(30) + '\n';
    const discount = parseFloat(document.getElementById('calcDiscount').value) || 0;
    const netTotal = total - discount;
    if(discount > 0) message += `💰 الخصم: -${discount.toFixed(2)} ج.م\n`;
    message += `💵 *الإجمالي: ${netTotal.toFixed(2)} ج.م*\n`;
    const warranty = document.getElementById('warrantyPeriod').value;
    if(warranty !== 'لا يوجد') message += `🛡️ الضمان: ${warranty}\n`;
    const warrantyNotes = document.getElementById('warrantyNotes').value.trim();
    if(warrantyNotes) message += `📝 ملاحظات: ${warrantyNotes}\n`;
    message += '\nشكراً لثقتكم بنا! ❤️';
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
    showToast(`📱 تم إرسال الفاتورة للرقم ${phone}`, 'success');
}

// ============================================================
// ====== الميزة 7: ربط واتساب متقدم ======
// ============================================================

function sendWhatsAppInvoice(invId) {
    const inv = allInvoices.find(i => i.id === invId);
    if(!inv) return;
    const customer = allCustomers.find(c => c.id === inv.customer_id);
    const phone = customer?.phone;
    if(!phone) { showToast('⚠️ لا يوجد رقم هاتف للعميل', 'error'); return; }
    const storeName = localStorage.getItem('active_store_name') || 'المحل';
    let msg = `🏪 *${storeName}*\n`;
    msg += `📋 فاتورة #${inv.invoice_number || ''}\n`;
    msg += `📅 ${new Date(inv.created_at).toLocaleDateString('ar-EG')}\n`;
    msg += `━━━━━━━━━━━━━━━━\n`;
    msg += `💰 الإجمالي: ${parseFloat(inv.total_amount || 0).toFixed(2)} ج.م\n`;
    if(parseFloat(inv.discount || 0) > 0) msg += `🔖 الخصم: -${parseFloat(inv.discount || 0).toFixed(2)} ج.م\n`;
    msg += `✅ الصافي: ${parseFloat(inv.final_amount || 0).toFixed(2)} ج.م\n`;
    msg += `💵 المدفوع: ${parseFloat(inv.paid_amount || 0).toFixed(2)} ج.م\n`;
    if(parseFloat(inv.remaining_amount || 0) > 0) msg += `⏳ المتبقي: ${parseFloat(inv.remaining_amount || 0).toFixed(2)} ج.م\n`;
    if(inv.warranty && inv.warranty !== 'لا يوجد') msg += `🛡️ الضمان: ${inv.warranty}\n`;
    msg += `━━━━━━━━━━━━━━━━\nشكراً لثقتكم ❤️`;
    window.open(`https://wa.me/${cleanPhoneForWA(phone)}?text=${encodeURIComponent(msg)}`, '_blank');
}

function sendDebtReminder(customerId) {
    const customer = allCustomers.find(c => c.id === customerId);
    if(!customer || !customer.phone) { showToast('⚠️ لا يوجد رقم هاتف', 'error'); return; }
    const debt = parseFloat(customer.total_debt || 0);
    if(debt <= 0) { showToast('✅ العميل ليس لديهم ديون', 'success'); return; }
    const storeName = localStorage.getItem('active_store_name') || 'المحل';
    const msg = encodeURIComponent(`مرحباً ${customer.customer_name} 👋\من ${storeName}\nلديك مبلغ مستحق: ${debt.toFixed(2)} ج.م\nيرجى السداد في أقرب وقت\nشكراً لتعاونكم ❤️`);
    window.open(`https://wa.me/${cleanPhoneForWA(customer.phone)}?text=${msg}`, '_blank');
}

// ============================================================
// ====== تقرير يومي واتساب ======
// ============================================================

async function sendDailyWhatsAppReport() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    
    // تحميل فواتير اليوم
    const { data: todayInvoices } = await sb.from('invoices')
        .select('*')
        .eq('store_id', currentStoreId)
        .gte('created_at', todayStr);
    
    const invoices = todayInvoices || [];
    let totalSales = 0, totalPaid = 0, totalRemaining = 0, totalDiscount = 0, totalVat = 0;
    let cashCount = 0, laterCount = 0, mobileCount = 0;
    
    invoices.forEach(inv => {
        totalSales += parseFloat(inv.final_amount) || 0;
        totalPaid += parseFloat(inv.paid_amount) || 0;
        totalRemaining += parseFloat(inv.remaining_amount) || 0;
        totalDiscount += parseFloat(inv.discount) || 0;
        totalVat += parseFloat(inv.vat_amount) || 0;
        if (inv.payment_type === 'later') laterCount++;
        else if (['vodafone', 'instapay', 'qrcode', 'bank'].includes(inv.payment_type)) mobileCount++;
        else cashCount++;
    });
    
    // تحميل المصروفات
    const { data: todayExpenses } = await sb.from('finance_transactions')
        .select('amount')
        .eq('store_id', currentStoreId)
        .eq('type', 'expense')
        .gte('created_at', todayStr);
    
    const totalExpenses = (todayExpenses || []).reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
    
    // كاش المحفظة
    const { data: todayCash } = await sb.from('cash_transactions')
        .select('*')
        .eq('store_id', currentStoreId)
        .gte('created_at', todayStr);
    let cashDeposits = 0, cashWithdraws = 0, cashFees = 0;
    (todayCash || []).forEach(t => {
        const amt = parseFloat(t.amount) || 0;
        let fee = parseFloat(t.fee) || 0;
        let amount = amt;
        if (amount === 0 && t.notes) {
            const m = t.notes.match(/(?:مبلغ|تحويل)\s+([\d\.]+)/);
            if (m) amount = parseFloat(m[1]);
        }
        if (fee === 0 && amount > 0) {
            fee = Math.max(10, amount * 0.01);
        }
        const isDep = t.transaction_type === 'deposit' || t.transaction_type === 'استلام';
        if (isDep) cashDeposits += amount; else cashWithdraws += amount;
        cashFees += fee;
    });
    
    // الصيانة
    const { data: todayMaintenance } = await sb.from('maintenance')
        .select('id')
        .eq('store_id', currentStoreId)
        .gte('created_at', todayStr);
    const maintenanceCount = (todayMaintenance || []).length;
    
    const storeName = localStorage.getItem('active_store_name') || 'المحل';
    const reportText = `📊 *تقرير يومي — ${storeName}*
📅 ${today.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
━━━━━━━━━━━━━━━━━━━━

🧾 *الفواتير:* ${invoices.length} فاتورة
💵 كاش: ${cashCount} | 📱 إلكتروني: ${mobileCount} | 📝 آجل: ${laterCount}

💰 *المبيعات:* ${totalSales.toFixed(2)} ج.م
💵 المدفوع: ${totalPaid.toFixed(2)} ج.م
📝 المتبقي: ${totalRemaining.toFixed(2)} ج.م
🎫 الخصومات: ${totalDiscount.toFixed(2)} ج.م
${totalVat > 0 ? `📊 الضريبة: ${totalVat.toFixed(2)} ج.م\n` : ''}
📌 *صافي المبيعات:* ${totalSales.toFixed(2)} ج.م

🔧 *الصيانة:* ${maintenanceCount} جهاز اليوم
💸 *المصروفات:* ${totalExpenses.toFixed(2)} ج.م

${(todayCash || []).length > 0 ? `📱 *محفظة الكاش:*
   📈 إيداعات: ${cashDeposits.toFixed(2)} ج.م
   📉 سحوبات: ${cashWithdraws.toFixed(2)} ج.م
   💰 عمولات: ${cashFees.toFixed(2)} ج.م
   📊 صافي: ${(cashDeposits - cashWithdraws).toFixed(2)} ج.م

` : ''}📈 *النتيجة:* ${(totalPaid - totalExpenses).toFixed(2)} ج.م

━━━━━━━━━━━━━━━━━━━━
📋 TAGGER PRO V6 — تلقائي`;
    
    window.open(`https://wa.me/?text=${encodeURIComponent(reportText)}`, '_blank');
    showToast('📊 تم إنشاء التقرير اليومي', 'success');
}