// ============================================================
// PRODUCTS - دوال إدارة المنتجات
// ============================================================

import { STATE, updateState } from './config.js';
import { 
    loadProducts as loadProductsFromDB,
    insertProduct as insertProductDB,
    updateProduct as updateProductDB,
    updateProductStock
} from './supabase.js';
import { 
    showToast, 
    showModal, 
    hideModal, 
    getValue, 
    setValue,
    exportToCSV 
} from './utils.js';
import { updateDashboardStats } from './dashboard.js';

// ============================================================
// تحميل المنتجات
// ============================================================
export async function loadProducts() {
    const products = await loadProductsFromDB();
    updateState({ allProducts: products });
    renderProductsGrid(products);
    renderProductsTable(products);
    return products;
}

// ============================================================
// عرض المنتجات في شبكة البيع
// ============================================================
export function renderProductsGrid(list) {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    
    if (!list || list.length === 0) {
        grid.innerHTML = `<p class="col-span-full text-center text-slate-500 py-8">لا توجد منتجات مسجلة</p>`;
        return;
    }
    
    const emojiMap = {
        'خدمات': '🛠️',
        'اكسسوارات': '🎧',
        'الكترونيات': '📱',
        'عام': '📦'
    };
    
    grid.innerHTML = list.map(p => `
        <div onclick="window.addToCart('${p.id}')" 
             class="product-card p-4 rounded-xl text-center ${STATE.lastAddedProductId === p.id ? 'last-added' : ''}">
            <div class="text-2xl mb-1">${emojiMap[p.category] || '📦'}</div>
            <div class="font-bold text-xs text-white truncate">${p.product_name}</div>
            <div class="price-tag font-black text-sm mt-1 text-emerald-400">${parseFloat(p.price).toFixed(2)} ج.م</div>
            <div class="text-[10px] text-slate-500 mt-1">المتاح: ${p.stock}</div>
            ${p.category && p.category !== 'عام' ? `<div class="text-[8px] text-slate-600 mt-1">${p.category}</div>` : ''}
        </div>
    `).join('');
}

// ============================================================
// عرض المنتجات في جدول المخزن
// ============================================================
export function renderProductsTable(list) {
    const tbody = document.getElementById('productsTableBody');
    if (!tbody) return;
    
    if (!list || list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center p-4 text-slate-500">لا توجد منتجات</td></tr>`;
        return;
    }
    
    tbody.innerHTML = list.map(p => `
        <tr class="border-b border-slate-800/60 text-white">
            <td class="p-4 font-bold">${p.product_name}</td>
            <td class="p-4 font-mono text-xs text-slate-400">${p.barcode || '—'}</td>
            <td class="p-4 text-amber-500">${parseFloat(p.purchase_price || 0).toFixed(2)} ج.م</td>
            <td class="p-4 text-emerald-400 font-bold">${parseFloat(p.price).toFixed(2)} ج.م</td>
            <td class="p-4">${p.stock}</td>
            <td class="p-4 text-xs text-slate-400">${p.category || 'عام'}</td>
            <td class="p-4 text-xs text-slate-500">${p.updated_at ? new Date(p.updated_at).toLocaleDateString('ar-EG') : '—'}</td>
            <td class="p-4 text-center">
                <button onclick="window.openEditProductModal('${p.id}')" class="bg-amber-950/40 text-amber-400 border border-amber-900/40 px-2 py-1 rounded-lg text-xs font-bold hover:bg-amber-900/30">✏️ تعديل</button>
                <button onclick="window.restockProduct('${p.id}')" class="bg-blue-950/40 text-blue-400 border border-blue-900/40 px-2 py-1 rounded-lg text-xs font-bold hover:bg-blue-900/30">📦 إعادة تعبئة</button>
            </td>
        </tr>
    `).join('');
}

// ============================================================
// فلتر المنتجات
// ============================================================
export function applyProductFilters() {
    const searchQuery = document.getElementById('productFilter').value.trim().toLowerCase();
    const category = document.getElementById('categoryFilter').value;
    
    let filtered = [...STATE.allProducts];
    
    if (searchQuery) {
        filtered = filtered.filter(p => 
            p.product_name.toLowerCase().includes(searchQuery) || 
            (p.barcode && p.barcode.toLowerCase().includes(searchQuery))
        );
    }
    
    if (category !== 'all') {
        filtered = filtered.filter(p => (p.category || 'عام') === category);
    }
    
    renderProductsGrid(filtered);
    
    const resultCount = document.getElementById('filterResultCount');
    if (resultCount) {
        resultCount.innerText = filtered.length !== STATE.allProducts.length ? ` (${filtered.length} نتيجة)` : '';
    }
}

export function resetProductFilters() {
    document.getElementById('productFilter').value = '';
    document.getElementById('categoryFilter').value = 'all';
    document.getElementById('filterResultCount').innerText = '';
    renderProductsGrid(STATE.allProducts);
}

// ============================================================
// إضافة منتج جديد
// ============================================================
export async function saveNewProduct() {
    const name = getValue('modalProductName').trim();
    const barcode = getValue('modalProductBarcode').trim();
    const purchase_price = parseFloat(getValue('modalProductPurchasePrice')) || 0;
    const price = parseFloat(getValue('modalProductPrice')) || 0;
    const stock = parseInt(getValue('modalProductStock')) || 0;
    const category = getValue('modalProductCategory') || 'عام';
    
    if (!name) { showToast('⚠️ اسم المنتج مطلوب', 'error'); return; }
    if (price <= 0) { showToast('⚠️ سعر البيع يجب أن يكون أكبر من صفر', 'error'); return; }
    
    try {
        await insertProductDB({
            product_name: name,
            barcode: barcode || null,
            purchase_price: purchase_price,
            price: price,
            stock: stock,
            category: category
        });
        
        hideModal('productModal');
        // تنظيف الحقول
        ['modalProductName', 'modalProductBarcode', 'modalProductPurchasePrice', 'modalProductPrice', 'modalProductStock']
            .forEach(id => setValue(id, ''));
        
        showToast('🎉 تم حفظ الصنف بنجاح', 'success');
        await loadProducts();
        await updateDashboardStats();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// ============================================================
// تعديل منتج
// ============================================================
export function openEditProductModal(id) {
    const product = STATE.allProducts.find(p => p.id === id);
    if (!product) return;
    
    setValue('editProductId', product.id);
    setValue('editProductName', product.product_name);
    setValue('editProductBarcode', product.barcode || '');
    setValue('editProductPurchasePrice', product.purchase_price || 0);
    setValue('editProductPrice', product.price);
    setValue('editProductStock', product.stock);
    setValue('editProductCategory', product.category || 'عام');
    showModal('editProductModal');
}

export async function updateProduct() {
    const id = getValue('editProductId');
    const name = getValue('editProductName').trim();
    const barcode = getValue('editProductBarcode').trim();
    const purchase_price = parseFloat(getValue('editProductPurchasePrice')) || 0;
    const price = parseFloat(getValue('editProductPrice')) || 0;
    const stock = parseInt(getValue('editProductStock')) || 0;
    const category = getValue('editProductCategory');
    
    if (!name) { showToast('⚠️ اسم المنتج مطلوب', 'error'); return; }
    if (price <= 0) { showToast('⚠️ سعر البيع يجب أن يكون أكبر من صفر', 'error'); return; }
    
    try {
        await updateProductDB(id, {
            product_name: name,
            barcode: barcode || null,
            purchase_price: purchase_price,
            price: price,
            stock: stock,
            category: category
        });
        
        hideModal('editProductModal');
        showToast('✅ تم تحديث المنتج بنجاح', 'success');
        await loadProducts();
        await updateDashboardStats();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// ============================================================
// إعادة تعبئة المخزون
// ============================================================
export async function restockProduct(id) {
    const product = STATE.allProducts.find(p => p.id === id);
    if (!product) return;
    
    const newStock = prompt(
        `أدخل الكمية الجديدة للمنتج "${product.product_name}" (الحالية: ${product.stock})`,
        product.stock + 10
    );
    if (newStock === null) return;
    
    const qty = parseInt(newStock);
    if (isNaN(qty) || qty < 0) {
        showToast('⚠️ يرجى إدخال كمية صحيحة', 'error');
        return;
    }
    
    try {
        await updateProductStock(id, qty);
        showToast('✅ تم تحديث الكمية بنجاح', 'success');
        await loadProducts();
        await updateDashboardStats();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// ============================================================
// تصدير المخزن إلى Excel
// ============================================================
export function exportProductsToExcel() {
    if (!STATE.allProducts || STATE.allProducts.length === 0) {
        showToast('⚠️ لا توجد منتجات للتصدير', 'error');
        return;
    }
    
    const headers = ['الاسم', 'الباركود', 'سعر الشراء', 'سعر البيع', 'الكمية', 'الفئة'];
    const data = STATE.allProducts.map(p => [
        p.product_name,
        p.barcode || '',
        p.purchase_price || 0,
        p.price,
        p.stock,
        p.category || 'عام'
    ]);
    
    const filename = `جرد_المخزن_${new Date().toLocaleDateString('ar-EG').replace(/\//g, '-')}.csv`;
    exportToCSV(data, headers, filename);
    showToast('📊 تم تصدير الجرد بنجاح', 'success');
}