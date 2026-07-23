function openStockTransfer() {
    const sel = document.getElementById('stProduct');
    if (!sel) return;
    sel.innerHTML = '<option value="">اختر المنتج...</option>' +
        localProducts.filter(p => p.stock > 0).map(p => `<option value="${p.id}" data-stock="${p.stock}">${p.title || p.product_name} (متوفر: ${p.stock})</option>`).join('');
    document.getElementById('stQuantity').value = '';
    document.getElementById('stCurrentStock').textContent = '';
    document.getElementById('stNotes').value = '';

    sel.onchange = function() {
        const opt = this.options[this.selectedIndex];
        const stock = opt.dataset.stock || 0;
        document.getElementById('stCurrentStock').textContent = `المخزون الحالي: ${stock} وحدة`;
    };

    openModal('stockTransferTab');
}

async function processStockTransfer() {
    const productId = document.getElementById('stProduct')?.value;
    const qty = parseInt(document.getElementById('stQuantity')?.value);
    const notes = document.getElementById('stNotes')?.value || '';

    if (!productId) { showToast('اختر المنتج', 'error'); return; }
    if (!qty || qty <= 0) { showToast('أدخل كمية صحيحة', 'error'); return; }

    const product = localProducts.find(p => p.id == productId);
    if (!product) { showToast('المنتج غير موجود', 'error'); return; }
    if (product.stock < qty) { showToast('الكمية غير متوفرة', 'error'); return; }

    try {
        const newStock = product.stock - qty;
        await sb.from('products').update({ stock: newStock }).eq('id', product.id);

        product.stock = newStock;
        await LocalDB.put('products', { ...product, stock: newStock });

        const fromStore = localStorage.getItem('active_store_name') || 'الفرع الرئيسي';

        await sb.from('finance_transactions').insert({
            store_id: currentStoreId,
            type: 'expense',
            amount: 0,
            category: 'نقل مخزون',
            note: `نقل ${qty} ${product.unit || 'وحدة'} من "${product.title || product.product_name}" من ${fromStore} ${notes ? '- ' + notes : ''}`,
            created_by: localStorage.getItem('active_staff_name') || 'النظام'
        });

        logActivity('نقل مخزون', `نقل ${qty} ${product.title || product.product_name} من ${fromStore}`, 'edit');
        showToast(`✅ تم نقل ${qty} ${product.title || product.product_name} بنجاح`, 'success');
        closeModal('stockTransferTab');
        renderProductsGrid(localProducts);
        renderInventoryTable();
    } catch(e) {
        showToast('حدث خطأ أثناء النقل', 'error');
    }
}
