function loadReceiptSettings() {
    try {
        const saved = localStorage.getItem('receipt_settings_' + currentStoreId);
        if (saved) return JSON.parse(saved);
    } catch(e) {}
    return {
        storeName: localStorage.getItem('active_store_name') || 'TAGGER PRO',
        thankYou: 'شكراً لتعاملكم معنا',
        phone: '',
        color: '#000000'
    };
}

function openReceiptCustomization() {
    const s = loadReceiptSettings();
    document.getElementById('rcStoreName').value = s.storeName || '';
    document.getElementById('rcThankYou').value = s.thankYou || '';
    document.getElementById('rcPhone').value = s.phone || '';
    setReceiptColor(s.color || '#000000');
    openModal('receiptCustomModal');
}

function setReceiptColor(color) {
    document.querySelectorAll('#receiptCustomModal .w-8.h-8').forEach(b => {
        b.style.outline = b.style.background === color ? '3px solid var(--accent)' : 'none';
    });
    window._receiptColor = color;
}

function saveReceiptSettings() {
    const settings = {
        storeName: document.getElementById('rcStoreName')?.value || 'TAGGER PRO',
        thankYou: document.getElementById('rcThankYou')?.value || 'شكراً لتعاملكم معنا',
        phone: document.getElementById('rcPhone')?.value || '',
        color: window._receiptColor || '#000000'
    };
    localStorage.setItem('receipt_settings_' + currentStoreId, JSON.stringify(settings));
    showToast('✅ تم حفظ إعدادات الإيصال', 'success');
    closeModal('receiptCustomModal');
}
