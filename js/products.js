// TAGGER PRO V6 - Products, Inventory & Barcode

let _currentProductItems = [];
function renderProductsGrid(items) {
    const grid = document.getElementById('productsGrid');
    grid.innerHTML = '';
    _currentProductItems = items;
    if(items.length === 0) {
        grid.innerHTML = `<div class='col-span-full text-center py-10 text-slate-600 text-xs'>لا توجد أصناف</div>`;
        return;
    }
    let pagContainer = document.getElementById('productsPagination');
    if(!pagContainer) {
        pagContainer = document.createElement('div');
        pagContainer.id = 'productsPagination';
        pagContainer.className = 'mt-3';
        grid.parentNode.insertBefore(pagContainer, grid.nextSibling);
    }
    if(!Pagination._instances['productsPagination']) {
        Pagination.create('productsPagination', { itemsPerPage: 24, onPageChange: function() { renderProductsGrid(_currentProductItems); } });
    }
    Pagination.update('productsPagination', items.length);
    const pageItems = Pagination.getPageData('productsPagination', items);
    pageItems.forEach(prod => {
        const profit = (parseFloat(prod.sell_price || prod.price) - parseFloat(prod.purchase_price || 0)).toFixed(2);
        const isLowStock = prod.stock <= lowStockThreshold && prod.stock > 0;
        const isOut = prod.stock <= 0;
        const supplier = prod.supplier_id ? suppliers.find(s => s.id === prod.supplier_id) : null;
        const card = document.createElement('div');
        card.onclick = () => addItemToInvoice(prod.id);
        card.className = `bg-[#0f1524] hover:bg-slate-800/80 border p-3 rounded-xl cursor-pointer transition duration-200 flex flex-col justify-between gap-2 group relative overflow-hidden ${isOut ? 'border-red-500/60' : isLowStock ? 'border-amber-500/50' : 'border-slate-800/80 hover:border-blue-500/50'}`;
        card.innerHTML = `
            <div>
                ${isLowStock ? '<div class="absolute top-0 left-0 bg-amber-500/90 text-black text-[8px] font-bold px-1.5 py-0.5 rounded-br-lg">⚠️ كمية قليلة</div>' : ''}
                ${isOut ? '<div class="absolute top-0 left-0 bg-red-500/90 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-br-lg">❌ نفد</div>' : ''}
                <button onclick="event.stopPropagation(); quickViewProduct('${prod.id}')" class="absolute top-1 left-1 w-5 h-5 rounded-full flex items-center justify-center text-[8px] opacity-0 group-hover:opacity-100 transition" style="background: rgba(0,0,0,0.6); color: #fff;"><i class="fa-solid fa-eye"></i></button>
                ${prod.image_url ? '<img src="' + prod.image_url + '" class="w-full h-16 object-cover rounded-lg mb-1.5" onerror="this.style.display=\'none\'">' : '<div class="w-full h-12 rounded-lg mb-1.5 flex items-center justify-center" style="background: var(--bg-elevated);"><i class="fa-solid fa-box text-lg" style="color: var(--text-3); opacity:0.3;"></i></div>'}
                <div class="flex justify-between items-start gap-1">
                    <span class="text-xs font-bold text-slate-200 group-hover:text-blue-400 line-clamp-2 transition">${prod.title || prod.product_name}</span>
                </div>
                <span class="text-[10px] text-slate-500 block mt-1">باركود: ${prod.barcode || 'N/A'}</span>
                ${supplier ? '<span class="text-[9px] text-amber-500/70 block mt-0.5">🏢 ' + supplier.name + '</span>' : ''}
            </div>
            <div class="flex justify-between items-center mt-2">
                <div class="flex flex-col">
                    <span class="text-sm font-black text-emerald-400">${parseFloat(prod.sell_price || prod.price).toFixed(2)} ج.م</span>
                    <span class="text-[9px] text-green-500/60">ربح: ${profit} ج.م</span>
                </div>
                <span class="text-[9px] px-2 py-0.5 rounded-md ${isOut ? 'bg-red-500/20 text-red-400 font-bold' : isLowStock ? 'bg-amber-500/20 text-amber-400 font-bold' : 'bg-slate-800 text-slate-400'}">${prod.stock}</span>
            </div>
        `;
        grid.appendChild(card);
    });
}

const debouncedFilterProducts = debounce(() => {
    const val = document.getElementById('searchItemsInput').value.toLowerCase();
    const filtered = localProducts.filter(p => 
        (p.title && p.title.toLowerCase().includes(val)) || 
        (p.product_name && p.product_name.toLowerCase().includes(val)) || 
        (p.barcode && p.barcode.includes(val))
    );
    Pagination.create('productsPagination', { itemsPerPage: 24 });
    renderProductsGrid(filtered);
}, 250);

function filterItemsByName() {
    debouncedFilterProducts();
}

function filterByCategory(cat, el) {
    document.querySelectorAll('#categoriesBar button').forEach(b => {
        b.className = "bg-[#0f1524] hover:bg-slate-800 text-slate-400 hover:text-white px-2 py-1.5 lg:px-4 lg:py-2 rounded-xl text-[8px] lg:text-xs font-bold whitespace-nowrap transition-all duration-200";
    });
    if(el) el.className = "active-category px-2 py-1.5 lg:px-4 lg:py-2 rounded-xl text-[8px] lg:text-xs font-bold whitespace-nowrap transition-all duration-200";
    if(cat === 'all') renderProductsGrid(localProducts);
    else renderProductsGrid(localProducts.filter(p => p.category === cat));
}

function openAddProductModal() {
    if (!canEdit()) { showToastPermission(); return; }
    document.getElementById('productModal').classList.remove('hidden');
    document.getElementById('newProductName').focus();
    document.getElementById('newProductBarcode').value = 'TAG-' + Math.floor(10000000 + Math.random() * 90000000);
    populateSupplierSelect('newProductSupplier', '');
}

async function addNewProduct() {
    if (!canEdit()) { showToastPermission(); return; }
    const name = document.getElementById('newProductName').value.trim();
    const price = parseFloat(document.getElementById('newProductPrice').value) || 0;
    const purchase = parseFloat(document.getElementById('newProductPurchase').value) || 0;
    const stock = parseInt(document.getElementById('newProductStock').value) || 0;
    const barcode = document.getElementById('newProductBarcode').value.trim();
    const category = document.getElementById('newProductCategory').value;
    const supplierId = document.getElementById('newProductSupplier').value || null;
    const imagePreview = document.getElementById('productImagePreview');
    const image_data = imagePreview?.dataset?.imageData || null;
    if(!name || price <= 0) { showToast('⚠️ يرجى إدخال اسم الصنف وسعر البيع', 'error'); return; }
    showLoading('جاري حفظ المنتج...');
    try {
        const productData = {
            store_id: currentStoreId,
            product_name: name,
            title: name,
            sell_price: price,
            price: price,
            purchase_price: purchase,
            stock: stock,
            barcode: barcode || null,
            category: category,
            supplier_id: supplierId
        };
        if (image_data) productData.image_url = image_data;
        let data;
        try {
            const result = await sb.from('products').insert([productData]).select().single();
            if(result.error) throw result.error;
            data = result.data;
        } catch(e) {
            const offlineId = 'offline_' + Date.now() + '_' + Math.random().toString(36).slice(2);
            data = { ...productData, id: offlineId };
            await SyncManager.enqueue('products', 'put', data);
            console.warn('📦 حُفظ المنتج محلياً (أوفلاين):', name);
        }
        localProducts.push(data);
        await LocalDB.put('products', data);
        renderProductsGrid(localProducts);
        renderInventoryTable();
        closeModal('productModal');
        hideLoading();
        document.getElementById('newProductName').value = '';
        document.getElementById('newProductPrice').value = '';
        document.getElementById('newProductPurchase').value = '';
        document.getElementById('newProductStock').value = '';
        document.getElementById('newProductBarcode').value = '';
        imagePreview.innerHTML = '<i class="fa-solid fa-image text-xl" style="color: var(--text-3);"></i>';
        delete imagePreview.dataset.imageData;
        document.getElementById('newProductImage').value = '';
        showToast(`✅ تم إضافة الصنف ${name} بنجاح${data.id?.toString().startsWith('offline_') ? ' (محلي - هيتزاين)' : ''}`, 'success');
        logActivity('إضافة منتج', `${name} - ${barcode || 'بدون باركود'} - السعر: ${price}`, 'add');
    } catch(err) {
        hideLoading();
        showToast('❌ خطأ في الحفظ: ' + err.message, 'error');
    }
}

function printBarcodeForNewProduct() {
    const barcode = document.getElementById('newProductBarcode').value.trim();
    if(!barcode) { showToast('⚠️ يرجى إدخال الباركود أولاً', 'warning'); return; }
    const printWindow = window.open('', '_blank', 'width=300,height=200');
    printWindow.document.write(`
        <html><head><title>طباعة باركود</title>
        <style>body{display:flex;justify-content:center;align-items:center;height:100vh;margin:0;font-family:Arial;}
        .barcode{text-align:center;padding:20px;border:1px solid #ddd;border-radius:10px;}
        .code{font-size:18px;font-weight:bold;margin-top:10px;letter-spacing:2px;}
        .name{font-size:14px;color:#666;margin-top:5px;}</style>
        </head><body>
        <div class="barcode">
            <svg width="200" height="80" xmlns="http://www.w3.org/2000/svg">
                <rect width="200" height="80" fill="white"/>
                ${barcode.split('').map((c, i) => {
                    const code = c.charCodeAt(0) % 2 === 0 ? 4 : 2;
                    return `<rect x="${i * 8 + 10}" y="10" width="${code}" height="60" fill="black"/>`;
                }).join('')}
            </svg>
            <div class="code">${barcode}</div>
            <div class="name">${document.getElementById('newProductName').value || 'صنف جديد'}</div>
        </div>
        <script>setTimeout(() => { window.print(); }, 500);<\/script>
        </body></html>
    `);
    printWindow.document.close();
    showToast('🏷️ تم إرسال الباركود للطباعة', 'success');
}

async function loadCategories() {
    try {
        if (SyncManager.isOnline) {
            const { data, error } = await sb.from('categories').select('name').eq('store_id', currentStoreId).order('sort_order');
            if (error) {
                console.error('[Categories] Supabase query error:', error.message);
            }
            if (!error && data && data.length > 0) {
                allCategories = data.map(c => c.name);
                saveCategories();
                renderCategoryFilters();
                renderMainCategoriesBar();
                console.log(`[Categories] Loaded ${allCategories.length} from Supabase`);
                return;
            }
            if (!error && data && data.length === 0) {
                const saved = localStorage.getItem('store_categories');
                if (saved) {
                    try {
                        const localCats = JSON.parse(saved);
                        if (localCats.length > 0) {
                            allCategories = localCats;
                            const rows = allCategories.map((name, i) => ({ store_id: currentStoreId, name, sort_order: i }));
                            const { error: insertErr } = await sb.from('categories').insert(rows);
                            if (insertErr) {
                                console.error('[Categories] Push to Supabase failed:', insertErr.message);
                            } else {
                                console.log(`[Categories] Pushed ${allCategories.length} categories to Supabase`);
                            }
                        }
                    } catch(e) { console.error('[Categories] Parse error:', e.message); }
                }
            }
        }
    } catch(e) { console.error('[Categories] General error:', e.message); }
    if (allCategories.length <= 4) {
        const saved = localStorage.getItem('store_categories');
        if(saved) { try { allCategories = JSON.parse(saved); } catch(e) {} }
    }
    renderCategoryFilters();
    renderMainCategoriesBar();
}

function saveCategories() {
    localStorage.setItem('store_categories', JSON.stringify(allCategories));
    if (SyncManager.isOnline) {
        sb.from('categories').delete().eq('store_id', currentStoreId).then(() => {
            if (allCategories.length > 0) {
                const rows = allCategories.map((name, i) => ({ store_id: currentStoreId, name, sort_order: i }));
                sb.from('categories').insert(rows).then(({ error }) => {
                    if (error) console.warn('Failed to save categories to Supabase:', error.message);
                });
            }
        });
    } else {
        SyncManager.enqueue('categories', 'put', {
            store_id: currentStoreId,
            categories: [...allCategories],
            updated_at: new Date().toISOString()
        });
    }
}

function renderMainCategoriesBar() {
    const bar = document.getElementById('categoriesBar');
    if(!bar) return;
    bar.innerHTML = `<button onclick="filterByCategory('all', this)" class="active-category px-2 py-1.5 lg:px-4 lg:py-2 rounded-xl text-[8px] lg:text-xs font-bold whitespace-nowrap transition-all duration-200">كل الأقسام</button>`;
    allCategories.forEach(cat => {
        bar.innerHTML += `<button onclick="filterByCategory('${cat}', this)" class="bg-[#0f1524] hover:bg-slate-800 text-slate-400 hover:text-white px-2 py-1.5 lg:px-4 lg:py-2 rounded-xl text-[8px] lg:text-xs font-bold whitespace-nowrap transition-all duration-200">${cat}</button>`;
    });
}

function renderCategoryFilters() {
    const container = document.getElementById('inventoryCategoryFilter');
    if(!container) return;
    container.innerHTML = `<button onclick="filterInventoryByCategory('all', this)" class="active-category px-2 py-1.5 lg:px-4 lg:py-2 rounded-xl text-[8px] lg:text-xs font-bold transition-all">كل الأقسام</button>`;
    allCategories.forEach(cat => {
        container.innerHTML += `<button onclick="filterInventoryByCategory('${cat}', this)" class="bg-[#0f1524] hover:bg-slate-800 text-slate-400 hover:text-white px-2 py-1.5 lg:px-4 lg:py-2 rounded-xl text-[8px] lg:text-xs font-bold transition-all">${cat}</button>`;
    });
}

function openInventory() {
    if (!canViewInventory()) { showToastPermission(); return; }
    document.getElementById('inventoryTab').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    renderInventoryTable();
    if (!canEdit()) {
        showToast('👁️ وضع المشاهدة فقط - غير مسموح بالتعديل', 'warning');
    }
}

function closeInventory() {
    document.getElementById('inventoryTab').classList.add('hidden');
    document.body.style.overflow = 'auto';
}

function filterInventoryByCategory(category, el) {
    currentInventoryFilter = category;
    document.querySelectorAll('#inventoryCategoryFilter button').forEach(btn => {
        btn.className = 'bg-[#0f1524] hover:bg-slate-800 text-slate-400 hover:text-white px-2 py-1.5 lg:px-4 lg:py-2 rounded-xl text-[8px] lg:text-xs font-bold transition-all';
    });
    if(el) el.className = 'active-category px-2 py-1.5 lg:px-4 lg:py-2 rounded-xl text-[8px] lg:text-xs font-bold transition-all';
    renderInventoryTable();
}

function renderInventoryTable() {
    const tbody = document.getElementById('inventoryTableBody');
    const emptyMsg = document.getElementById('emptyInventory');
    if(!tbody) return;
    let filtered = localProducts;
    if(currentInventoryFilter !== 'all') filtered = localProducts.filter(p => p.category === currentInventoryFilter);
    if(filtered.length === 0) { tbody.innerHTML = ''; emptyMsg.classList.remove('hidden'); return; }
    emptyMsg.classList.add('hidden');
    let pagContainer = document.getElementById('inventoryPagination');
    if(!pagContainer) {
        pagContainer = document.createElement('div');
        pagContainer.id = 'inventoryPagination';
        pagContainer.className = 'mt-3';
        tbody.closest('table').parentNode.insertBefore(pagContainer, tbody.closest('table').nextSibling);
    }
    if(!Pagination._instances['inventoryPagination']) {
        Pagination.create('inventoryPagination', { itemsPerPage: 15, onPageChange: function() { renderInventoryTable(); } });
    }
    Pagination.update('inventoryPagination', filtered.length);
    const pageItems = Pagination.getPageData('inventoryPagination', filtered);
    const canEditProduct = canEdit();
    tbody.innerHTML = pageItems.map((p, index) => {
        const profit = (parseFloat(p.sell_price || p.price) - parseFloat(p.purchase_price || 0)).toFixed(2);
        const imageHtml = p.image ? `<img src="${p.image}" class="inventory-img">` : '<i class="fa-solid fa-image text-slate-600 text-xl"></i>';
        
        let actionsHtml = '';
        if (canEditProduct) {
            actionsHtml = `
                <div class="flex items-center justify-center gap-1.5">
                    <button onclick="editProduct('${p.id}')" class="bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 px-2 py-1 rounded-lg text-[10px] transition"><i class="fa-solid fa-pen"></i></button>
                    <button onclick="deleteProduct('${p.id}')" class="bg-red-600/20 hover:bg-red-600/30 text-red-400 px-2 py-1 rounded-lg text-[10px] transition"><i class="fa-solid fa-trash"></i></button>
                </div>
            `;
        } else {
            actionsHtml = `<span class="text-[10px] text-slate-500">🔒 مشاهدة</span>`;
        }
        
        return `
            <tr class="border-b border-slate-800/60 hover:bg-slate-800/20 transition">
                <td class="p-3">${imageHtml}</td>
                <td class="p-3 font-bold text-slate-200">${p.title || p.product_name}</td>
                <td class="p-3 text-slate-400 font-mono text-[10px]">${p.barcode || '—'}</td>
                <td class="p-3 text-slate-400">${p.category || 'عام'}</td>
                <td class="p-3 text-center text-red-400">${parseFloat(p.purchase_price || 0).toFixed(2)}</td>
                <td class="p-3 text-center text-emerald-400 font-bold">${parseFloat(p.sell_price || p.price).toFixed(2)}</td>
                <td class="p-3 text-center ${p.stock <= 5 ? 'text-red-400 font-bold' : 'text-white'}">${p.stock}</td>
                <td class="p-3 text-center text-green-500">${profit} ج.م</td>
                <td class="p-3 text-center">${actionsHtml}</td>
            </tr>
        `;
    }).join('');
}

function openAddProductFullModal() {
    if (!canEdit()) { showToastPermission(); return; }
    document.getElementById('productModalTitle').innerText = t('newProduct');
    document.getElementById('editProductId').value = '';
    document.getElementById('fpName').value = '';
    document.getElementById('fpBarcode').value = 'TAG-' + Math.floor(10000000 + Math.random() * 90000000);
    document.getElementById('fpPurchasePrice').value = '';
    document.getElementById('fpSellPrice').value = '';
    document.getElementById('fpStock').value = '';
    document.getElementById('fpImagePreview').classList.add('hidden');
    document.getElementById('fpImageInput').value = '';
    selectedProductImage = null;
    const select = document.getElementById('fpCategory');
    select.innerHTML = '';
    allCategories.forEach(cat => { select.innerHTML += `<option value="${cat}">${cat}</option>`; });
    populateSupplierSelect('fpSupplier', '');
    document.getElementById('productFullModal').classList.remove('hidden');
}

function editProduct(productId) {
    if (!canEdit()) { showToastPermission(); return; }
    const prod = localProducts.find(p => p.id === productId);
    if(!prod) return;
    document.getElementById('productModalTitle').innerText = t('editProduct');
    document.getElementById('editProductId').value = productId;
    document.getElementById('fpName').value = prod.title || prod.product_name;
    document.getElementById('fpBarcode').value = prod.barcode || '';
    document.getElementById('fpPurchasePrice').value = prod.purchase_price || 0;
    document.getElementById('fpSellPrice').value = prod.sell_price || prod.price || 0;
    document.getElementById('fpStock').value = prod.stock || 0;
    const select = document.getElementById('fpCategory');
    select.innerHTML = '';
    allCategories.forEach(cat => { select.innerHTML += `<option value="${cat}" ${cat === prod.category ? 'selected' : ''}>${cat}</option>`; });
    populateSupplierSelect('fpSupplier', prod.supplier_id || '');
    if(prod.image) {
        document.getElementById('fpImagePreview').classList.remove('hidden');
        document.getElementById('fpImagePreviewImg').src = prod.image;
        selectedProductImage = prod.image;
    } else {
        document.getElementById('fpImagePreview').classList.add('hidden');
        selectedProductImage = null;
    }
    document.getElementById('productFullModal').classList.remove('hidden');
}

function previewProductImage(arg) {
    const file = arg.target ? arg.target.files[0] : (arg.files ? arg.files[0] : null);
    if(!file) return;
    if(file.size > 2 * 1024 * 1024) { showToast('الصورة كبيرة جداً (حد أقصى 2MB)', 'warning'); return; }
    const reader = new FileReader();
    reader.onload = function(e) {
        selectedProductImage = e.target.result;
        // Full Product modal preview
        const fpPreview = document.getElementById('fpImagePreview');
        if(fpPreview) {
            fpPreview.classList.remove('hidden');
            document.getElementById('fpImagePreviewImg').src = e.target.result;
        }
        // Quick add product preview
        const quickPreview = document.getElementById('productImagePreview');
        if(quickPreview) {
            quickPreview.innerHTML = `<img src="${e.target.result}" class="w-full h-full object-cover rounded-xl">`;
            quickPreview.dataset.imageData = e.target.result;
        }
    };
    reader.readAsDataURL(file);
}

function removeProductImage() {
    selectedProductImage = null;
    document.getElementById('fpImagePreview').classList.add('hidden');
    document.getElementById('fpImageInput').value = '';
}

function generateBarcodeForProduct() {
    document.getElementById('fpBarcode').value = 'TAG-' + Math.floor(10000000 + Math.random() * 90000000);
}

async function saveFullProduct() {
    if (!canEdit()) { showToastPermission(); return; }
    const name = document.getElementById('fpName').value.trim();
    const barcode = document.getElementById('fpBarcode').value.trim();
    const category = document.getElementById('fpCategory').value;
    const purchasePrice = parseFloat(document.getElementById('fpPurchasePrice').value) || 0;
    const sellPrice = parseFloat(document.getElementById('fpSellPrice').value) || 0;
    const stock = parseInt(document.getElementById('fpStock').value) || 0;
    const editId = document.getElementById('editProductId').value;
    if(!name || sellPrice <= 0) { showToast('⚠️ يرجى إدخال اسم المنتج وسعر البيع', 'error'); return; }
    const productData = {
        product_name: name,
        title: name,
        barcode: barcode || null,
        category: category,
        purchase_price: purchasePrice,
        sell_price: sellPrice,
        price: sellPrice,
        stock: stock,
        image: selectedProductImage || null,
        supplier_id: document.getElementById('fpSupplier').value || null,
        updated_at: new Date().toISOString()
    };
    try {
        let result;
        if(editId) {
            try {
                result = await sb.from('products').update(productData).eq('id', editId).eq('store_id', currentStoreId);
                if(result.error) throw result.error;
                if(!result.data || result.data.length === 0) {
                    await sb.from('products').update(productData).eq('id', editId);
                }
            } catch(e) {
                await SyncManager.enqueue('products', 'put', { id: editId, ...productData, store_id: currentStoreId });
            }
            const idx = localProducts.findIndex(p => p.id === editId);
            if (idx >= 0) { localProducts[idx] = { ...localProducts[idx], ...productData }; }
            await LocalDB.put('products', { id: editId, ...productData, store_id: currentStoreId });
        } else {
            try {
                const insertResult = await sb.from('products').insert([{ ...productData, store_id: currentStoreId }]).select().single();
                if(insertResult.error) throw insertResult.error;
                localProducts.push(insertResult.data);
                await LocalDB.put('products', insertResult.data);
            } catch(e) {
                const offlineProd = { ...productData, store_id: currentStoreId, id: 'offline_' + Date.now() + '_' + Math.random().toString(36).slice(2) };
                await SyncManager.enqueue('products', 'put', offlineProd);
                localProducts.push(offlineProd);
                await LocalDB.put('products', offlineProd);
            }
        }
        renderProductsGrid(localProducts);
        closeModal('productFullModal');
        showToast(editId ? '✅ تم تحديث المنتج بنجاح' : '✅ تم إضافة المنتج بنجاح', 'success');
        logActivity(editId ? 'تعديل منتج' : 'إضافة منتج', `${name} - ${barcode || ''}`, editId ? 'edit' : 'add');
        renderInventoryTable();
    } catch(err) {
        showToast('❌ خطأ في الحفظ: ' + err.message, 'error');
    }
}

async function deleteProduct(productId) {
    if (!canEdit()) { showToastPermission(); return; }
    const confirmed = await showConfirm('هل أنت متأكد من حذف هذا المنتج؟', 'حذف المنتج', { danger: true });
    if(!confirmed) return;
    try {
        try {
            const { error } = await sb.from('products').delete().eq('id', productId).eq('store_id', currentStoreId);
            if(error) throw error;
        } catch(e) {
            await SyncManager.enqueue('products', 'delete', { id: productId });
        }
        localProducts = localProducts.filter(p => p.id !== productId);
        await LocalDB.delete('products', productId);
        renderProductsGrid(localProducts);
        renderInventoryTable();
        closeModal('productFullModal');
        showToast('🗑️ تم حذف المنتج بنجاح', 'success');
        logActivity('حذف منتج', `Product ID: ${productId}`, 'delete');
    } catch(err) {
        showToast('❌ خطأ في الحذف: ' + err.message, 'error');
    }
}

function openAddCategoryModal() {
    if (!canEdit()) { showToastPermission(); return; }
    document.getElementById('newCategoryName').value = '';
    renderCategoryList();
    document.getElementById('categoryModal').classList.remove('hidden');
}

function renderCategoryList() {
    const container = document.getElementById('categoryListContainer');
    if (!container) return;
    if (allCategories.length === 0) {
        container.innerHTML = '<p class="text-xs text-slate-500">لا يوجد أقسام</p>';
        return;
    }
    container.innerHTML = allCategories.map(cat => `
        <div class="flex items-center justify-between p-2 rounded-lg" style="background: var(--bg-body); border: 1px solid var(--border);">
            <span class="text-sm font-bold" style="color: var(--text-2);">${cat}</span>
            <div class="flex items-center gap-1">
                <button onclick="openEditCategory('${cat.replace(/'/g, "\\'")}')" class="bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 px-2 py-1 rounded-lg text-[10px] transition"><i class="fa-solid fa-pen"></i></button>
                <button onclick="deleteCategory('${cat.replace(/'/g, "\\'")}')" class="bg-red-600/20 hover:bg-red-600/30 text-red-400 px-2 py-1 rounded-lg text-[10px] transition"><i class="fa-solid fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}

function openEditCategory(oldName) {
    document.getElementById('editCategoryOldName').value = oldName;
    document.getElementById('editCategoryNewName').value = oldName;
    document.getElementById('editCategoryModal').classList.remove('hidden');
}

function saveEditCategory() {
    if (!canEdit()) { showToastPermission(); return; }
    const oldName = document.getElementById('editCategoryOldName').value;
    const newName = document.getElementById('editCategoryNewName').value.trim();
    if (!newName) { showToast('⚠️ يرجى إدخال اسم القسم', 'error'); return; }
    if (newName === oldName) { closeModal('editCategoryModal'); return; }
    if (allCategories.includes(newName)) { showToast('⚠️ هذا القسم موجود بالفعل', 'warning'); return; }
    const idx = allCategories.indexOf(oldName);
    if (idx === -1) return;
    allCategories[idx] = newName;
    saveCategories();
    localProducts.forEach(p => { if (p.category === oldName) p.category = newName; });
    renderCategoryFilters();
    renderMainCategoriesBar();
    renderInventoryTable();
    closeModal('editCategoryModal');
    renderCategoryList();
    showToast(`✅ تم تعديل القسم من "${oldName}" إلى "${newName}"`, 'success');
}

function deleteCategory(name) {
    if (!canEdit()) { showToastPermission(); return; }
    const count = localProducts.filter(p => p.category === name).length;
    const msg = count > 0
        ? `هل تريد حذف القسم "${name}"؟ يوجد ${count} منتج في هذا القسم.`
        : `هل تريد حذف القسم "${name}"؟`;
    showConfirm(msg, 'حذف القسم', { danger: true }).then(confirmed => {
        if (!confirmed) return;
        allCategories = allCategories.filter(c => c !== name);
        saveCategories();
        renderCategoryFilters();
        renderMainCategoriesBar();
        renderCategoryList();
        showToast(`✅ تم حذف القسم "${name}"`, 'success');
    });
}

function saveNewCategory() {
    if (!canEdit()) { showToastPermission(); return; }
    const name = document.getElementById('newCategoryName').value.trim();
    if(!name) { showToast('⚠️ يرجى إدخال اسم القسم', 'error'); return; }
    if(allCategories.includes(name)) { showToast('⚠️ هذا القسم موجود بالفعل', 'warning'); return; }
    allCategories.push(name);
    saveCategories();
    renderCategoryFilters();
    renderMainCategoriesBar();
    closeModal('categoryModal');
    showToast(`✅ تم إضافة القسم ${name} بنجاح`, 'success');
}

function openBarcodePrintModal() {
    document.getElementById('barcodePrintModal').classList.remove('hidden');
    document.getElementById('barcodePrintModal').classList.add('flex');
    const select = document.getElementById('barcodeProductSelect');
    select.innerHTML = localProducts.map(p => `<option value="${p.id}">${p.title || p.product_name} (${p.barcode || 'بدون'})</option>`).join('');
    select.onchange = function() {
        const prod = localProducts.find(p => p.id === this.value);
        if (prod) {
            document.getElementById('barcodePreviewArea').innerHTML = `
                <div class="p-3 rounded-lg inline-block" style="background: white;">
                    <div style="font-size:10px;color:#000;font-weight:bold;">${prod.title || prod.product_name}</div>
                    <div style="font-size:12px;color:#000;margin:4px 0;">║║│║║║│║║║│║║║</div>
                    <div style="font-size:8px;color:#333;">${prod.barcode || 'N/A'}</div>
                    <div style="font-size:10px;color:#000;font-weight:bold;">${parseFloat(prod.sell_price || prod.price || 0).toFixed(2)} ج.م</div>
                </div>`;
        }
    };
    select.onchange();
}

function generateAndPrintBarcode() {
    const select = document.getElementById('barcodeProductSelect');
    const count = parseInt(document.getElementById('barcodeCount').value) || 1;
    const prod = localProducts.find(p => p.id === select.value);
    if (!prod) return;

    const printWin = window.open('', '_blank', 'width=400,height=600');
    let labels = '';
    for (let i = 0; i < count; i++) {
        labels += `
            <div style="text-align:center;border:1px solid #000;padding:8px;margin:4px;display:inline-block;width:45%;page-break-inside:avoid;">
                <div style="font-size:11px;font-weight:900;">${prod.title || prod.product_name}</div>
                <div style="font-size:14px;margin:6px 0;">║║│║║║│║║║│║║║</div>
                <div style="font-size:9px;color:#333;">${prod.barcode || 'N/A'}</div>
                <div style="font-size:12px;font-weight:900;">${parseFloat(prod.sell_price || prod.price || 0).toFixed(2)} ج.م</div>
            </div>`;
    }
    printWin.document.write(`<html><head><title>Barcodes</title><meta charset="utf-8"><style>body{font-family:monospace;text-align:center;}</style></head><body>${labels}</body></html>`);
    printWin.document.close();
    printWin.print();
}

let quickSaleItems = [];
let quickSaleLoaded = false;

async function loadQuickSaleItems() {
    const defaultItems = [
        { name: 'شحن رصيد', price: 10, color: '#22c55e' },
        { name: 'شحن رصيد', price: 20, color: '#22c55e' },
        { name: 'شحن رصيد', price: 50, color: '#22c55e' },
        { name: 'صيانة عامة', price: 50, color: '#a855f7' },
        { name: 'استشارة', price: 25, color: '#3b82f6' }
    ];
    try {
        const local = await SmartLoader.getLocalData('quick_sale_items');
        const localQS = local.filter(i => i.store_id === currentStoreId).sort((a,b) => (a.sort_order||0)-(b.sort_order||0));
        if (localQS.length > 0) {
            quickSaleItems = localQS;
        } else {
            const saved = JSON.parse(localStorage.getItem('quickSaleItems_' + currentStoreId) || 'null');
            quickSaleItems = saved && Array.isArray(saved) && saved.length > 0 ? saved : defaultItems;
        }
        quickSaleLoaded = true;
        if (SyncManager.isOnline) {
            SmartLoader.syncTable('quick_sale_items', currentStoreId).then(synced => {
                SmartLoader.getLocalData('quick_sale_items').then(full => {
                    const items = full.filter(i => i.store_id === currentStoreId).sort((a,b) => (a.sort_order||0)-(b.sort_order||0));
                    if (items.length > 0) quickSaleItems = items;
                    refreshQuickSaleBar();
                });
            });
        }
    } catch (e) {
        console.error('loadQuickSaleItems error:', e);
        quickSaleItems = defaultItems;
        quickSaleLoaded = true;
    }
    refreshQuickSaleBar();
}

function quickSale(name, price) {
    const exists = localProducts.find(p => (p.title || p.product_name) === name && parseFloat(p.sell_price || p.price) === price);
    if (exists) { addItemToInvoice(exists.id); return; }

    const tempId = 'qs_' + Date.now();
    const item = { id: tempId, title: name, product_name: name, sell_price: price, price: price, purchase_price: 0, stock: 999, barcode: '', category: 'بيع سريع', isQuickSale: true };
    localProducts.push(item);
    addItemToInvoice(tempId);

    if (SyncManager.isOnline) {
        sb.from('products').insert({ title: name, product_name: name, sell_price: price, price: price, purchase_price: 0, stock: 999, category: 'بيع سريع', store_id: currentStoreId }).select().single().then(({ data, error }) => {
            if (!error && data) {
                const idx = localProducts.findIndex(p => p.id === tempId);
                if (idx >= 0) { localProducts[idx] = { ...localProducts[idx], id: data.id, stock: data.stock }; }
                LocalDB.put('products', data);
            }
        }).catch(() => {});
    }
}

function openQuickSaleSettings() {
    document.getElementById('quickSaleSettingsModal').classList.remove('hidden');
    document.getElementById('quickSaleSettingsModal').classList.add('flex');
    renderQuickSaleSettings();
}

function renderQuickSaleSettings() {
    const list = document.getElementById('quickSaleItemsList');
    list.innerHTML = quickSaleItems.map((item, i) => `
        <div class="flex items-center gap-2 p-2 rounded-lg" style="background: var(--bg-elevated); border: 1px solid var(--border);">
            <div class="w-3 h-3 rounded-full" style="background: ${item.color};"></div>
            <span class="flex-1 text-xs font-bold" style="color: var(--text-1);">${item.name} - ${item.price} ج.م</span>
            <button onclick="removeQuickSaleItem(${i})" class="text-xs px-2 py-1 rounded-lg transition" style="background: var(--accent-soft); color: var(--danger);"><i class="fa-solid fa-trash"></i></button>
        </div>
    `).join('');
}

async function addQuickSaleItem() {
    const name = document.getElementById('qsName').value.trim();
    const price = parseFloat(document.getElementById('qsPrice').value) || 0;
    const color = document.getElementById('qsColor').value;
    if (!name || price <= 0) { showToast('أدخل اسم وسعر صحيح', 'warning'); return; }
    try {
        const { data, error } = await sb.from('quick_sale_items').insert({ store_id: currentStoreId, name, price, color, sort_order: quickSaleItems.length }).select().single();
        if (error) throw error;
        quickSaleItems.push(data);
    } catch (e) {
        console.error('addQuickSaleItem Supabase error:', e);
        quickSaleItems.push({ name, price, color });
    }
    localStorage.setItem('quickSaleItems_' + currentStoreId, JSON.stringify(quickSaleItems));
    document.getElementById('qsName').value = '';
    document.getElementById('qsPrice').value = '';
    renderQuickSaleSettings();
    refreshQuickSaleBar();
    showToast('تمت الإضافة', 'success');
}

async function removeQuickSaleItem(index) {
    const item = quickSaleItems[index];
    if (item && item.id) {
        try { await sb.from('quick_sale_items').delete().eq('id', item.id); } catch (e) { console.error('removeQuickSaleItem Supabase error:', e); }
    }
    quickSaleItems.splice(index, 1);
    localStorage.setItem('quickSaleItems_' + currentStoreId, JSON.stringify(quickSaleItems));
    renderQuickSaleSettings();
    refreshQuickSaleBar();
}

function refreshQuickSaleBar() {
    const bar = document.getElementById('quickSaleBar');
    if (!bar) return;
    bar.innerHTML = quickSaleItems.map(item => `<button onclick="quickSale('${(item.name || '').replace(/'/g, "\\'")}', ${item.price})" class="flex-shrink-0 px-2 py-1 lg:px-3 lg:py-1.5 rounded-xl text-[7px] lg:text-[10px] font-bold transition whitespace-nowrap" style="background: ${item.color}; color: #fff;">⚡ ${item.name} ${item.price}ج</button>`).join('') + '<button onclick="openQuickSaleSettings()" class="flex-shrink-0 px-2 py-1 lg:px-3 lg:py-1.5 rounded-xl text-[7px] lg:text-[10px] font-bold transition whitespace-nowrap" style="background: var(--bg-elevated); color: var(--text-2); border: 1px solid var(--border);">⚙️</button>';
    setTimeout(() => { bar.scrollLeft = bar.scrollWidth; }, 50);
}

function updateLowStockBadge() {
    const lowCount = localProducts.filter(p => p.stock <= lowStockThreshold).length;
    const badge = document.getElementById('lowStockBadge');
    const sidebarBadge = document.getElementById('lowStockBadgeSidebar');
    if(lowCount > 0) {
        if (badge) { badge.innerText = lowCount; badge.classList.remove('hidden'); }
        if (sidebarBadge) { sidebarBadge.textContent = lowCount; sidebarBadge.style.display = 'block'; }
    } else {
        if (badge) badge.classList.add('hidden');
        if (sidebarBadge) sidebarBadge.style.display = 'none';
    }
}

function checkLowStockAlerts() {
    const lowItems = localProducts.filter(p => p.stock <= lowStockThreshold && p.stock > 0);
    const outItems = localProducts.filter(p => p.stock <= 0);
    if(outItems.length > 0) {
        setTimeout(() => showToast(`🔴 ${outItems.length} منتج نفد من المخزن!`, 'error'), 1500);
    }
    if(lowItems.length > 0) {
        setTimeout(() => showToast(`⚠️ ${lowItems.length} منتج كميته قليلة (${lowStockThreshold} أو أقل)`, 'warning'), 2500);
    }
}