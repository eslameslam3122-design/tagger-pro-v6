// ============================================================
// UTILITIES - دوال مساعدة
// ============================================================

// ============================================================
// Toast Notifications
// ============================================================
export function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = message;
    container.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 3500);
}

// ============================================================
// Sound Effects
// ============================================================
export function playAddSound() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.value = 0.1;
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.1);
    } catch (e) { /* تجاهل */ }
}

// ============================================================
// Formatting
// ============================================================
export function formatCurrency(amount) {
    return amount.toFixed(2) + ' ج.م';
}

export function formatDate(date) {
    return new Date(date).toLocaleDateString('ar-EG');
}

export function formatDateTime(date) {
    return new Date(date).toLocaleString('ar-EG');
}

// ============================================================
// DOM Helpers
// ============================================================
export function getElement(id) {
    return document.getElementById(id);
}

export function getValue(id) {
    return document.getElementById(id)?.value || '';
}

export function setValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value;
}

export function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.innerText = text;
}

export function showModal(id) {
    document.getElementById(id)?.classList.remove('hidden');
}

export function hideModal(id) {
    document.getElementById(id)?.classList.add('hidden');
}

// ============================================================
// Export to CSV
// ============================================================
export function exportToCSV(data, headers, filename) {
    const BOM = '\uFEFF';
    let csv = BOM + headers.join(',') + '\n';
    data.forEach(row => {
        csv += row.map(cell => `"${cell}"`).join(',') + '\n';
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
}

// ============================================================
// Thermal Printer
// ============================================================
export function printInvoice(data) {
    document.getElementById('printStoreName').innerText = data.storeName;
    document.getElementById('printInvoiceDate').innerText = `تاريخ: ${data.date} | رقم: #${data.invoiceNum}`;
    document.getElementById('printCashierName').innerText = `البائع: ${data.cashier}`;
    const tbody = document.getElementById('printInvoiceItems');
    tbody.innerHTML = data.items.map(i => 
        `<tr><td>${i.name}</td><td class="text-center">${i.qty}</td><td class="text-left">${i.price.toFixed(2)}</td></tr>`
    ).join('');
    document.getElementById('printSubtotal').innerText = data.sub.toFixed(2);
    document.getElementById('printDiscount').innerText = data.discount.toFixed(2);
    document.getElementById('printTotal').innerText = data.final.toFixed(2);
    document.getElementById('printPaid').innerText = data.paid.toFixed(2);
    document.getElementById('printChange').innerText = Math.max(0, data.change).toFixed(2);
    window.print();
}

// ============================================================
// Generate Invoice Number
// ============================================================
export function generateInvoiceNumber() {
    const now = new Date();
    const date = now.getFullYear().toString().slice(-2) + 
                 String(now.getMonth() + 1).padStart(2, '0') + 
                 String(now.getDate()).padStart(2, '0');
    const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
    return `INV-${date}-${random}`;
}

// ============================================================
// Debounce
// ============================================================
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}