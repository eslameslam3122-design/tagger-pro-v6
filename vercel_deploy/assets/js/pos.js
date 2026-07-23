// ============================================================
// POS - دوال شاشة البيع السريع
// ============================================================

import { STATE, updateState } from './config.js';
import { 
    supabase,
    insertInvoice,
    insertInvoiceItems,
    insertTransaction,
    updateProductStock,
    updateCustomerDebt
} from './supabase.js';
import { 
    showToast, 
    playAddSound, 
    printInvoice, 
    formatCurrency,
    getElement,
    getValue,
    setValue,
    setText
} from './utils.js';
import { loadProducts, renderProductsGrid } from './products.js';
import { loadCustomers } from './customers.js';
import { updateDashboardStats } from './dashboard.js';

// ============================================================
// إضافة منتج للسلة
// ============================================================
export function addToCart(id) {
    const product = STATE.allProducts.find(p => p.id === id);
    if (!product) {
        showToast('⚠️ المنتج غير موجود', 'error');
        return;
    }
    if (product.stock <= 0) {
        showToast('⚠️ المنتج غير متوفر حالياً', 'error');
        return;
    }
    
    const item = STATE.cart.find(i => i.id === id);
    if (item) {
        if (item.qty >= product.stock) {
            showToast('⚠️ الكمية المطلوبة غير متوفرة', 'error');
            return;
        }
        item.qty += 1;
    } else {
        STATE.cart.push({
            id: product.id,
            name: product.product_name,
            price: parseFloat(product.price),
            qty: 1,
            maxStock: product.stock
        });
    }
    
    updateState({ lastAddedProductId: id });
    updateCartUI();
    playAddSound();
    renderProductsGrid(STATE.allProducts);
}

// ============================================================
// إضافة خدمة سريعة
// ============================================================
export function addQuickService(serviceName, price) {
    STATE.cart.push({
        id: 'srv-' + Date.now(),
        name: serviceName,
        price: price,
        qty: 1,
        maxStock: 9999,
        isService: true
    });
    updateCartUI();
    playAddSound();
}

// ============================================================
// إضافة هدية
// ============================================================
export function addGiftItem() {
    const giftName = prompt('أدخل اسم الهدية:', 'هدية للعميل');
    if (!giftName) return;
    STATE.cart.push({
        id: 'gift-' + Date.now(),
        name: '🎁 ' + giftName,
        price: 0,
        qty: 1,
        maxStock: 9999,
        isService: true
    });
    updateCartUI();
    showToast('🎁 تم إضافة الهدية', 'info');
}

// ============================================================
// تحديث واجهة السلة
// ============================================================
export function updateCartUI() {
    const container = document.getElementById('cartItems');
    if (!container) return;
    
    if (STATE.cart.length === 0) {
        container.innerHTML = `<p class="text-center py-12 text-slate-600 text-xs">السلة فارغة</p>`;
        setText('cartSubtotal', '0.00 ج.م');
        setText('invoiceTotal', '0.00 ج.م');
        setText('cartItemsCount', '0');
        return;
    }
    
    container.innerHTML = STATE.cart.map((item, i) => `
        <div class="cart-item flex flex-col gap-1 text-xs text-white">
            <div class="flex items-center justify-between">
                <div class="font-bold truncate max-w-[150px]">${item.name}</div>
                <div class="flex items-center gap-1">
                    <button onclick="window.updateCartQty(${i}, ${item.qty - 1})" 
                            class="w-5 h-5 bg-slate-800 text-white rounded font-bold hover:bg-slate-700">-</button>
                    <input type="number" value="${item.qty}" min="0" max="${item.maxStock}" 
                           onchange="window.updateCartQtyInput(${i}, this.value)" 
                           class="w-8 bg-[#090d16] text-center text-white font-bold border border-slate-800 rounded outline-none focus:border-blue-500">
                    <button onclick="window.updateCartQty(${i}, ${item.qty + 1})" 
                            class="w-5 h-5 bg-slate-800 text-white rounded font-bold hover:bg-slate-700">+</button>
                </div>
            </div>
            <div class="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                <div class="flex items-center gap-1">
                    <span>سعر:</span>
                    <input type="number" value="${item.price}" 
                           oninput="window.modifyItemPriceInline(${i}, this.value)" 
                           class="w-14 bg-[#090d16] text-center text-emerald-400 font-bold border border-slate-800 rounded px-1 outline-none focus:border-blue-500">
                </div>
                <div class="text-emerald-400 font-bold font-mono">${(item.price * item.qty).toFixed(2)} ج.م</div>
            </div>
        </div>
    `).join('');
    
    calculateInvoiceFinals();
}

// ============================================================
// حساب الإجماليات
// ============================================================
export function calculateInvoiceFinals() {
    let subtotal = STATE.cart.reduce((acc, i) => acc + (i.price * i.qty), 0);
    let discount = parseFloat(getValue('invoiceDiscount')) || 0;
    let final = Math.max(0, subtotal - discount);
    
    setText('cartSubtotal', formatCurrency(subtotal));
    setText('invoiceTotal', formatCurrency(final));
    setText('cartItemsCount', STATE.cart.reduce((s, i) => s + i.qty, 0));
    
    const payType = getValue('invoicePaymentType');
    const paidInput = document.getElementById('invoicePaidAmount');
    
    if (payType !== 'later' && parseFloat(paidInput.value) === 0) {
        paidInput.value = final.toFixed(2);
    }
    
    let paid = parseFloat(paidInput.value) || 0;
    setText('invoiceChangeAmount', formatCurrency(Math.max(0, paid - final)));
}

// ============================================================
// تحديث كمية المنتج في السلة
// ============================================================
export function updateCartQty(index, qty) {
    if (qty <= 0) {
        STATE.cart.splice(index, 1);
    } else if (qty > STATE.cart[index].maxStock) {
        showToast('⚠️ الكمية غير متوفرة', 'error');
        return;
    } else {
        STATE.cart[index].qty = parseInt(qty);
    }
    updateCartUI();
}

export function updateCartQtyInput(index, value) {
    const qty = parseInt(value);
    if (isNaN(qty) || qty < 0) return;
    if (qty > STATE.cart[index].maxStock) {
        showToast('⚠️ الكمية غير متوفرة', 'error');
        return;
    }
    if (qty === 0) {
        STATE.cart.splice(index, 1);
    } else {
        STATE.cart[index].qty = qty;
    }
    updateCartUI();
}

// ============================================================
// تعديل سعر المنتج في السلة
// ============================================================
export function modifyItemPriceInline(index, newPrice) {
    const parsed = parseFloat(newPrice);
    if (!isNaN(parsed) && parsed >= 0) {
        STATE.cart[index].price = parsed;
        calculateInvoiceFinals();
    }
}

// ============================================================
// تغيير نوع الدفع
// ============================================================
export function updatePaymentTypeUI() {
    const type = getValue('invoicePaymentType');
    document.getElementById('paidRow').style.display = type === 'later' ? 'none' : 'flex';
    document.getElementById('changeRow').style.display = type === 'later' ? 'none' : 'flex';
    if (type === 'later') {
        setValue('invoicePaidAmount', '0');
    }
    calculateInvoiceFinals();
}

// ============================================================
// تعليق واستعادة الفاتورة
// ============================================================
export function holdCurrentInvoice() {
    if (STATE.cart.length === 0) {
        showToast('⚠️ السلة فارغة', 'error');
        return;
    }
    updateState({ heldInvoice: [...STATE.cart] });
    STATE.cart = [];
    updateCartUI();
    document.getElementById('btnRestoreHold').classList.remove('hidden');
    showToast('📥 تم تعليق الفاتورة بنجاح', 'success');
}

export function restoreOnHoldInvoice() {
    if (!STATE.heldInvoice) {
        showToast('⚠️ لا توجد فاتورة معلقة', 'error');
        return;
    }
    STATE.cart = [...STATE.heldInvoice];
    updateState({ heldInvoice: null });
    updateCartUI();
    document.getElementById('btnRestoreHold').classList.add('hidden');
    showToast('📤 تم استعادة الفاتورة المعلقة', 'info');
}

// ============================================================
// مسح السلة
// ============================================================
export function clearCartWithConfirm() {
    if (STATE.cart.length === 0) {
        showToast('⚠️ السلة فارغة بالفعل', 'info');
        return;
    }
    if (confirm('هل أنت متأكد من مسح كافة محتويات الفاتورة النشطة؟')) {
        STATE.cart = [];
        updateCartUI();
        showToast('🗑️ تم مسح السلة', 'info');
    }
}

// ============================================================
// ترحيل الفاتورة
// ============================================================
export async function processInvoiceCheckout() {
    if (STATE.cart.length === 0) {
        showToast('⚠️ عذراً، السلة فارغة!', 'error');
        return;
    }
    
    const cust = getValue('invoiceCustomer');
    const payType = getValue('invoicePaymentType');
    const discount = parseFloat(getValue('invoiceDiscount')) || 0;
    const notes = getValue('invoiceNotes').trim();
    const phone = getValue('customerPhone').trim();
    
    let sub = STATE.cart.reduce((acc, i) => acc + (i.price * i.qty), 0);
    let final = Math.max(0, sub - discount);
    let paid = payType === 'later' ? 0 : (parseFloat(getValue('invoicePaidAmount')) || final);
    let rem = payType === 'later' ? final : 0;
    
    if (payType === 'later' && cust === 'cash_customer') {
        showToast('⚠️ لا يمكن عمل بيع آجل لزبون نقدي!', 'error');
        return;
    }
    
    try {
        // إنشاء الفاتورة
        const invoice = await insertInvoice({
            customer_id: cust === 'cash_customer' ? null : cust,
            total_amount: sub,
            discount: discount,
            final_amount: final,
            paid_amount: paid,
            remaining_amount: rem,
            payment_type: payType,
            notes: notes + (phone ? ` | تليفون: ${phone}` : '')
        });
        
        // تحديث دين العميل إذا كان آجل
        if (payType === 'later') {
            const activeCust = STATE.allCustomers.find(c => c.id === cust);
            if (activeCust) {
                const currentDebt = parseFloat(activeCust.total_debt || 0);
                await updateCustomerDebt(cust, currentDebt + final);
            }
        }
        
        // إضافة عناصر الفاتورة
        const realItems = STATE.cart.filter(i => !i.isService);
        if (realItems.length > 0) {
            await insertInvoiceItems(realItems.map(i => ({
                invoice_id: invoice.id,
                product_id: i.id,
                quantity: i.qty,
                unit_price: i.price
            })));
            
            // تحديث المخزون
            for (const item of realItems) {
                const product = STATE.allProducts.find(p => p.id === item.id);
                if (product) {
                    await updateProductStock(item.id, product.stock - item.qty);
                }
            }
        }
        
        // إضافة المعاملة المالية
        await insertTransaction({
            type: 'sale',
            amount: paid,
            description: `فاتورة مبيعات رقم #${invoice.invoice_number} | ${notes}`
        });
        
        // تحديث العداد
        STATE.sessionInvoicesCounter++;
        setText('sessionInvoicesCount', STATE.sessionInvoicesCounter);
        
        const todayItems = STATE.cart.reduce((s, i) => s + i.qty, 0);
        STATE.dailyItemsSoldCount += todayItems;
        setText('dailyItemsSold', STATE.dailyItemsSoldCount);
        
        // حفظ بيانات الطباعة
        const printData = {
            storeName: document.getElementById('storeName').innerText,
            invoiceNum: invoice.invoice_number,
            cashier: STATE.staffName,
            date: new Date().toLocaleString('ar-EG'),
            items: [...STATE.cart],
            sub: sub,
            discount: discount,
            final: final,
            paid: paid,
            change: paid - final
        };
        updateState({ lastPrintedInvoiceData: printData });
        document.getElementById('btnReprintLast').classList.remove('hidden');
        
        // طباعة الفاتورة
        printInvoice(printData);
        showToast(`🎉 تم حفظ وترحيل الفاتورة رقم #${invoice.invoice_number}`, 'success');
        
        // تنظيف السلة
        STATE.cart = [];
        setValue('invoiceDiscount', '0');
        setValue('invoicePaidAmount', '0');
        setValue('invoiceNotes', '');
        setValue('customerPhone', '');
        updateCartUI();
        
        // تحديث البيانات
        await loadProducts();
        await loadCustomers();
        await updateDashboardStats();
        
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// ============================================================
// إعادة طباعة آخر فاتورة
// ============================================================
export function reprintLastInvoice() {
    if (STATE.lastPrintedInvoiceData) {
        printInvoice(STATE.lastPrintedInvoiceData);
    }
}

// ============================================================
// واتساب
// ============================================================
export function openWhatsAppModal() {
    if (STATE.cart.length === 0) {
        showToast('⚠️ السلة فارغة، أضف منتجات أولاً', 'error');
        return;
    }
    let msg = '🛒 فاتورة TAGGER PRO V2\n';
    STATE.cart.forEach(i => {
        msg += `- ${i.name} × ${i.qty} = ${(i.price * i.qty).toFixed(2)} ج.م\n`;
    });
    msg += `\n💰 الإجمالي: ${document.getElementById('invoiceTotal').innerText}`;
    document.getElementById('whatsappMessage').value = msg;
    document.getElementById('whatsappPhone').value = '';
    document.getElementById('whatsappModal').classList.remove('hidden');
}

export function sendWhatsApp() {
    const phone = getValue('whatsappPhone').trim();
    const message = getValue('whatsappMessage');
    if (!phone) { showToast('⚠️ يرجى إدخال رقم الهاتف', 'error'); return; }
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    document.getElementById('whatsappModal').classList.add('hidden');
    showToast('📱 تم فتح واتساب', 'success');
}

// ============================================================
// البحث بالباركود
// ============================================================
export function initSearchAndBarcode() {
    document.getElementById('barcodeSearch').addEventListener('input', (e) => {
        const query = e.target.value.trim();
        if (!query) {
            renderProductsGrid(STATE.allProducts);
            return;
        }
        const matched = STATE.allProducts.find(p => p.barcode === query);
        if (matched) {
            addToCart(matched.id);
            e.target.value = '';
            renderProductsGrid(STATE.allProducts);
            return;
        }
        const filtered = STATE.allProducts.filter(p =>
            p.product_name.toLowerCase().includes(query.toLowerCase())
        );
        renderProductsGrid(filtered);
    });
}