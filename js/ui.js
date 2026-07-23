// TAGGER PRO V6 - UI, Theme, i18n & Helpers

let currentLang = localStorage.getItem('tagger_lang') || 'ar';

const i18n = {
    ar: {
        users: 'المستخدمين', shifts: 'الورديات', invoices: 'الفواتير', finance: 'المالية', inventory: 'المخزن',
        maintenance: 'الصيانة', reports: 'التقارير', held: 'المعلقة', suppliers: 'الموردين', installments: 'الأقساط',
        cashWallet: 'إدارة كاش', user: 'المستخدم:', loading: 'جاري التحميل...',
        posTitle: 'نقطة البيع', addProduct: 'صنف', search: 'ابحث باسم الصنف...',
        barcode: 'مرر الباركود أو اضغط Enter...', discount: 'الخصم', warranty: 'الضمان', customer: 'العميل',
        total: 'الإجمالي', pay: 'دفع', hold: 'تعليق (F2)', saveOnly: 'حفظ فقط', checkout: 'إنقاذ (F8)',
        cash: 'كاش', card: 'بطاقة', instapay: 'إنستاباي', vodafone: 'فودافون كاش', fawry: 'فوري',
        bank: 'تحويل بنكي', later: 'آجل', stock: 'المخزون', price: 'السعر', category: 'القسم',
        name: 'الاسم', phone: 'الهاتف', address: 'العنوان', notes: 'ملاحظات', save: 'حفظ', cancel: 'إلغاء',
        delete: 'حذف', edit: 'تعديل', add: 'إضافة', close: 'إغلاق', search2: 'بحث...',
        print: 'طباعة', whatsapp: 'واتساب', copy: 'نسخ', export: 'تصدير', import: 'استيراد',
        backup: 'نسخ احتياطي', langToggle: 'EN/عربي',
        shiftActive: '🟢 مفعلة', shiftInactive: '⭕ غير مفعلة', startShift: 'بدء وردية', endShift: 'إنهاء وردية',
        supervisor: 'المشرف', startTime: 'وقت البداية', duration: 'المدة', sales: 'المبيعات',
        expenses: 'المصروفات', revenue: 'الإيرادات', cashOps: 'عمليات الكاش', cashFees: 'عمولات الكاش',
        cashProfit: 'أرباح الكاش', cashIn: 'إيداعات (وارد)', cashOut: 'سحوبات (صادر)', net: 'الصافي الكلي',
        active: 'نشط', completed: 'مكتمل', overdue: 'متأخر', monthlyPayment: 'القسط الشهري',
        remaining: 'المتبقي', paid: 'المدفوع', paidAmount: 'المدفوع مسبقاً',
        invoiceNum: 'رقم الفاتورة', date: 'التاريخ', payment: 'طريقة الدفع', warranty2: 'الضمان',
        subtotal: 'الإجمالي', totalAfterDiscount: 'الصافي', paid2: 'المدفوع', remaining2: 'المتبقي',
        sendWhatsApp: 'إرسال واتساب', reprint: 'إعادة طباعة', confirmDelete: 'هل أنت متأكد من الحذف؟',
        noData: 'لا توجد بيانات', success: 'تم بنجاح', error: 'خطأ', warning: 'تنبيه',
        cameraScanner: 'ماسح الكاميرا', cameraHint: 'وجّه الكاميرا نحو الباركود',
        installmentTitle: 'نظام الأقساط', addInstallment: 'إضافة عقد أقساط', installmentStats: ' إحصائيات',
        noInstallments: 'لا توجد عقود أقساط', payInstallment: 'سداد', sendReminder: 'تذكير',
        thankYou: 'شكراً لزيارتكم', storeName: 'TAGGER PRO', posSubtitle: 'بون مبيعات',
        profit: 'الربح', totalProducts: 'إجمالي المنتجات', totalCustomers: 'إجمالي العملاء',
        totalSales: 'إجمالي المبيعات', todaySales: 'مبيعات اليوم',
        newProduct: 'إضافة منتج جديد', editProduct: 'تعديل المنتج', productName: 'اسم المنتج',
        purchasePrice: 'سعر الشراء', sellPrice: 'سعر البيع', productStock: 'الكمية',
        productBarcode: 'الباركود', productCategory: 'القسم', productImage: 'صورة المنتج',
        newCustomer: 'إضافة عميل جديد', editCustomer: 'تعديل العميل', customerName: 'اسم العميل',
        newInvoice: 'فاتورة جديدة', invoiceDetails: 'تفاصيل الفاتورة', invoiceItems: 'بنود الفاتورة',
        noProducts: 'لا توجد منتجات', scanOrSearch: 'امسح الباركود أو ابحث بالاسم',
        confirmEndShift: 'هل أنت متأكد من إنهاء الوردية؟', noActiveShift: 'لا توجد وردية مفتوحة',
        selectCustomer: 'اختر العميل', noPhone: 'لا يوجد رقم هاتف',
        product: 'الصنف', qty: 'الكمية', priceCol: 'السعر', subtotal: 'الإجمالي',
        emptyCart: 'الفاتورة فارغة', profitMargin: '💰 هامش الربح المتوقع:',
        coupons: '🎫 كوبونات:', itemsTotal: 'إجمالي العناصر:', discount: 'الخصم:',
        warrantyLabel: '🛡️ الضمان:', required: 'المطلوب:', holdKey: 'تعليق', barcodeKey: 'باركود',
        payKey: 'دفع', customerKey: 'عميل', printBtn: 'طباعة', saveBtn: 'حفظ',
        cashLabel: 'كاش', vodafoneLabel: 'فودافون', instaLabel: 'إنستا',
        qrLabel: 'QR', bankLabel: 'تحويل', laterLabel: 'آجل',
        noWarranty: 'بدون ضمان', notesPlaceholder: 'ملاحظات...', subtitle: 'Supabase Edition',
        warranty7: '7 أيام', warranty15: '15 يوم', warrantyM: 'شهر', warranty3: '3 شهور',
        warranty6: '6 شهور', warrantyY: 'سنة', cashCustomer: 'عميل نقدي',
        status: 'الحالة', supervisor: 'المشرف', startTime: 'وقت البداية', duration: 'المدة',
        cashOps: 'عمليات الكاش', cashFees: 'عمولات الكاش', cashProfit: 'أرباح الكاش',
        cashIn: 'إيداعات (وارد)', cashOut: 'سحوبات (صادر)', netTotal: 'الصافي الكلي',
        sales: 'المبيعات', expenses: 'المصروفات', revenue: 'الإيرادات',
        barcode: 'الباركود', generate: 'توليد', category: 'القسم', stockQty: 'الكمية المتاحة',
        supplier: 'المورد', dropImageHint: 'اضغط لاختيار صورة من الكمبيوتر',
        removeImage: 'إزالة الصورة', cancelBtn: 'إلغاء',
        manageShifts: '🕐 إدارة الورديات', trackShifts: 'تسجيل ومتابعة ورديات الموظفين',
        startShift: 'بدء', endShift: 'إنهاء', closeBtn: 'إغلاق',
        addCategory: 'إضافة قسم جديد', categoryName: 'اسم القسم *', addCategoryBtn: 'إضافة القسم',
    },
    en: {
        users: 'Users', shifts: 'Shifts', invoices: 'Invoices', finance: 'Finance', inventory: 'Inventory',
        maintenance: 'Maintenance', reports: 'Reports', held: 'Held', suppliers: 'Suppliers', installments: 'Installments',
        cashWallet: 'Cash Wallet', user: 'User:', loading: 'Loading...',
        posTitle: 'Point of Sale', addProduct: 'Product', search: 'Search by name...',
        barcode: 'Scan barcode or press Enter...', discount: 'Discount', warranty: 'Warranty', customer: 'Customer',
        total: 'Total', pay: 'Pay', hold: 'Hold (F2)', saveOnly: 'Save Only', checkout: 'Checkout (F8)',
        cash: 'Cash', card: 'Card', instapay: 'InstaPay', vodafone: 'Vodafone Cash', fawry: 'Fawry',
        bank: 'Bank Transfer', later: 'Later', stock: 'Stock', price: 'Price', category: 'Category',
        name: 'Name', phone: 'Phone', address: 'Address', notes: 'Notes', save: 'Save', cancel: 'Cancel',
        delete: 'Delete', edit: 'Edit', add: 'Add', close: 'Close', search2: 'Search...',
        print: 'Print', whatsapp: 'WhatsApp', copy: 'Copy', export: 'Export', import: 'Import',
        backup: 'Backup', langToggle: 'عربي/EN',
        shiftActive: '🟢 Active', shiftInactive: '⭕ Inactive', startShift: 'Start Shift', endShift: 'End Shift',
        supervisor: 'Supervisor', startTime: 'Start Time', duration: 'Duration', sales: 'Sales',
        expenses: 'Expenses', revenue: 'Revenue', cashOps: 'Cash Ops', cashFees: 'Cash Fees',
        cashProfit: 'Cash Profit', cashIn: 'Deposits (In)', cashOut: 'Withdrawals (Out)', net: 'Net Total',
        active: 'Active', completed: 'Completed', overdue: 'Overdue', monthlyPayment: 'Monthly Payment',
        remaining: 'Remaining', paid: 'Paid', paidAmount: 'Previously Paid',
        invoiceNum: 'Invoice #', date: 'Date', payment: 'Payment', warranty2: 'Warranty',
        subtotal: 'Subtotal', totalAfterDiscount: 'Total', paid2: 'Paid', remaining2: 'Remaining',
        sendWhatsApp: 'Send WhatsApp', reprint: 'Reprint', confirmDelete: 'Are you sure you want to delete?',
        noData: 'No data available', success: 'Success', error: 'Error', warning: 'Warning',
        cameraScanner: 'Camera Scanner', cameraHint: 'Point camera at barcode',
        installmentTitle: 'Installment System', addInstallment: 'Add Installment Contract', installmentStats: ' Statistics',
        noInstallments: 'No installment contracts', payInstallment: 'Pay', sendReminder: 'Reminder',
        thankYou: 'Thank you for visiting', storeName: 'TAGGER PRO', posSubtitle: 'Sales Receipt',
        profit: 'Profit', totalProducts: 'Total Products', totalCustomers: 'Total Customers',
        totalSales: 'Total Sales', todaySales: 'Today\'s Sales',
        newProduct: 'Add New Product', editProduct: 'Edit Product', productName: 'Product Name',
        purchasePrice: 'Purchase Price', sellPrice: 'Sell Price', productStock: 'Stock',
        productBarcode: 'Barcode', productCategory: 'Category', productImage: 'Product Image',
        newCustomer: 'Add New Customer', editCustomer: 'Edit Customer', customerName: 'Customer Name',
        newInvoice: 'New Invoice', invoiceDetails: 'Invoice Details', invoiceItems: 'Invoice Items',
        noProducts: 'No products found', scanOrSearch: 'Scan barcode or search by name',
        confirmEndShift: 'Are you sure you want to end the shift?', noActiveShift: 'No active shift',
        selectCustomer: 'Select Customer', noPhone: 'No phone number available',
        product: 'Product', qty: 'Qty', priceCol: 'Price', subtotal: 'Subtotal',
        emptyCart: 'Cart is empty', profitMargin: '💰 Expected Profit Margin:',
        coupons: '🎫 Coupons:', itemsTotal: 'Items Total:', discount: 'Discount:',
        warrantyLabel: '🛡️ Warranty:', required: 'Required:', holdKey: 'Hold', barcodeKey: 'Barcode',
        payKey: 'Pay', customerKey: 'Customer', printBtn: 'Print', saveBtn: 'Save',
        cashLabel: 'Cash', vodafoneLabel: 'Vodafone', instaLabel: 'InstaPay',
        qrLabel: 'QR Code', bankLabel: 'Transfer', laterLabel: 'Credit',
        noWarranty: 'No warranty', notesPlaceholder: 'Notes...', subtitle: 'Supabase Edition',
        warranty7: '7 Days', warranty15: '15 Days', warrantyM: '1 Month', warranty3: '3 Months',
        warranty6: '6 Months', warrantyY: '1 Year', cashCustomer: 'Cash Customer',
        status: 'Status', supervisor: 'Supervisor', startTime: 'Start Time', duration: 'Duration',
        cashOps: 'Cash Ops', cashFees: 'Cash Fees', cashProfit: 'Cash Profit',
        cashIn: 'Cash In', cashOut: 'Cash Out', netTotal: 'Net Total',
        sales: 'Sales', expenses: 'Expenses', revenue: 'Revenue',
        barcode: 'Barcode', generate: 'Generate', category: 'Category', stockQty: 'Stock Qty',
        supplier: 'Supplier', dropImageHint: 'Click to select image from computer',
        removeImage: 'Remove Image', cancelBtn: 'Cancel',
        manageShifts: '🕐 Shift Management', trackShifts: 'Track and manage employee shifts',
        startShift: 'Start', endShift: 'End', closeBtn: 'Close',
        addCategory: 'Add New Category', categoryName: 'Category Name *', addCategoryBtn: 'Add Category',
    }
};

function t(key) {
    return (i18n[currentLang] && i18n[currentLang][key]) || (i18n['ar'][key]) || key;
}

const autoTranslateMap = {
    ar: {
        '🕐 إدارة الورديات': '🕐 Shift Management', 'تسجيل ومتابعة ورديات الموظفين': 'Track employee shifts',
        'إدارة الصيانة': 'Maintenance', 'نظام الصيانة': 'Maintenance System',
        'نظام الأقساط': 'Installment System', 'إدارة الموردين': 'Supplier Management',
        'إدارة الكاش': 'Cash Management', 'التقارير': 'Reports', 'المالية': 'Finance',
        'الفواتير': 'Invoices', 'المخزن': 'Inventory', 'المستخدمين': 'Users',
        'الكوبونات': 'Coupons', 'العملاء': 'Customers',
        'بدء': 'Start', 'إنهاء': 'End', 'إغلاق': 'Close', 'حفظ': 'Save',
        'إضافة': 'Add', 'تعديل': 'Edit', 'حذف': 'Delete', 'إلغاء': 'Cancel',
        'بحث': 'Search', 'تأكيد': 'Confirm', 'رجوع': 'Back',
        'طباعة': 'Print', 'إرسال': 'Send', 'تحميل': 'Download',
        'مكتملة': 'Completed', 'معلقة': 'Pending', 'ملغاة': 'Cancelled',
        'نشطة': 'Active', 'مدفوعة': 'Paid', 'غير مدفوعة': 'Unpaid',
        'مكتمل': 'Completed', 'قيد التنفيذ': 'In Progress',
        'إجمالي': 'Total', 'المجموع': 'Sum', 'الإجمالي': 'Total',
        'الكمية': 'Qty', 'السعر': 'Price', 'الاسم': 'Name',
        'الهاتف': 'Phone', 'العنوان': 'Address', 'ملاحظات': 'Notes',
        'الحالة': 'Status', 'التاريخ': 'Date', 'الوقت': 'Time',
        'المشرف': 'Supervisor', 'وقت البداية': 'Start Time', 'المدة': 'Duration',
        'المبيعات': 'Sales', 'المصروفات': 'Expenses', 'الإيرادات': 'Revenue',
        'الصافي': 'Net', 'الصافي الكلي': 'Net Total',
        'عمليات الكاش': 'Cash Ops', 'عمولات الكاش': 'Cash Fees', 'أرباح الكاش': 'Cash Profit',
        'إيداعات (وارد)': 'Cash In', 'سحوبات (صادر)': 'Cash Out',
        'لا توجد وردية مفتوحة': 'No active shift',
        'إضافة منتج جديد': 'Add New Product', 'تعديل المنتج': 'Edit Product',
        'إضافة عميل جديد': 'Add New Customer', 'تعديل العميل': 'Edit Customer',
        'إضافة قسم جديد': 'Add New Category',
        'اسم المنتج *': 'Product Name *', 'الباركود': 'Barcode', 'القسم': 'Category',
        'سعر الشراء': 'Purchase Price', 'سعر البيع *': 'Sell Price *',
        'الكمية المتاحة': 'Stock Qty', 'المورد': 'Supplier', 'صورة المنتج': 'Product Image',
        'بدون مورد': 'No Supplier',
        'إضافة عملية كاش': 'Add Cash Operation', 'نوع العملية': 'Operation Type',
        'إيداع (وارد)': 'Deposit (In)', 'سحب (صادر)': 'Withdraw (Out)',
        'عمولة': 'Fee', 'مبلغ': 'Amount', 'سبب': 'Reason',
        'التقرير اليومي': 'Daily Report', 'التقرير الشهري': 'Monthly Report',
        'تقرير المبيعات': 'Sales Report', 'تقرير الأرباح': 'Profit Report',
        'تقرير المنتجات': 'Products Report',
        'إضافة عقد أقساط': 'Add Installment Contract', 'سداد': 'Pay', 'تذكير': 'Reminder',
        'الدخل': 'Income', 'المصروف': 'Expense', 'إضافة معاملة مالية': 'Add Transaction',
        'فاتورة جديدة': 'New Invoice', 'تفاصيل الفاتورة': 'Invoice Details',
        'بنود الفاتورة': 'Invoice Items', 'لا توجد فواتير': 'No invoices',
        'رقم الفاتورة': 'Invoice #', 'العميل': 'Customer', 'طريقة الدفع': 'Payment Method',
        'اسم العميل': 'Customer Name', 'رقم الهاتف': 'Phone Number',
        'اسم الجوال': 'Mobile Name',
        'إضافة مورد': 'Add Supplier', 'اسم المورد': 'Supplier Name',
        'أرصدة المورد': 'Supplier Balance',
        'جهاز جديد': 'New Device', 'نوع الجهاز': 'Device Type', 'عطل': 'Fault',
        'العميل': 'Customer', 'التكلفة': 'Cost',
        'إضافة مستخدم': 'Add User', 'اسم المستخدم': 'Username',
        'كلمة المرور': 'Password', 'الدور': 'Role', 'المخازن': 'Stores',
        'السلة فارغة': 'Cart is empty', 'لا توجد عناصر': 'No items',
        'الخصم': 'Discount', 'نسبة الخصم': 'Discount %',
        'عرض الكل': 'Show All', 'تصدير': 'Export', 'استيراد': 'Import',
        'إعادة تعيين': 'Reset', 'تحديث': 'Refresh',
        'لا توجد بيانات': 'No data', 'جاري التحميل': 'Loading...',
        'تم الحفظ بنجاح': 'Saved successfully', 'خطأ': 'Error',
        'تم': 'Done', 'نعم': 'Yes', 'لا': 'No',
        'الغاء': 'Cancel', 'رجوع': 'Back',
        'هل أنت متأكد من إنهاء الوردية؟': 'Are you sure you want to end the shift?',
        'إضافة القسم': 'Add Category', 'اسم القسم *': 'Category Name *',
        'توليد': 'Generate',
    },
    en: {}
};
Object.keys(autoTranslateMap.ar).forEach(k => { autoTranslateMap.en[autoTranslateMap.ar[k]] = k; });

function applyTranslations() {
    document.querySelectorAll('[data-t]').forEach(el => {
        const key = el.getAttribute('data-t');
        if(i18n[currentLang] && i18n[currentLang][key]) {
            el.textContent = i18n[currentLang][key];
        }
    });
    document.querySelectorAll('[data-t-placeholder]').forEach(el => {
        const key = el.getAttribute('data-t-placeholder');
        if(i18n[currentLang] && i18n[currentLang][key]) {
            el.placeholder = i18n[currentLang][key];
        }
    });
    const wp = document.getElementById('warrantyPeriod');
    if(wp) {
        const wOpts = currentLang === 'ar'
            ? [{v:'لا يوجد',t:'بدون ضمان'},{v:'7 أيام',t:'7 أيام'},{v:'15 يوم',t:'15 يوم'},{v:'شهر',t:'شهر'},{v:'3 شهور',t:'3 شهور'},{v:'6 شهور',t:'6 شهور'},{v:'سنة',t:'سنة'}]
            : [{v:'لا يوجد',t:'No warranty'},{v:'7 أيام',t:'7 Days'},{v:'15 يوم',t:'15 Days'},{v:'شهر',t:'1 Month'},{v:'3 شهور',t:'3 Months'},{v:'6 شهور',t:'6 Months'},{v:'سنة',t:'1 Year'}];
        wp.innerHTML = wOpts.map(o => `<option value="${o.v}">${o.t}</option>`).join('');
    }
    const cs = document.getElementById('invoiceCustomer');
    if(cs && cs.options[0]) {
        cs.options[0].textContent = currentLang === 'ar' ? '👤 عميل نقدي' : '👤 Cash Customer';
    }
    const cartMsg = document.getElementById('emptyCartMessage');
    if(cartMsg) {
        const span = cartMsg.querySelector('span[data-t]');
        if(span) span.textContent = t('emptyCart');
    }
    document.querySelectorAll('[data-t-shift]').forEach(el => {
        const key = el.getAttribute('data-t-shift');
        if(i18n[currentLang] && i18n[currentLang][key]) el.textContent = i18n[currentLang][key];
    });
    if(currentLang === 'en') {
        const map = autoTranslateMap.ar;
        const textNodes = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
        const nodes = [];
        while(textNodes.nextNode()) nodes.push(textNodes.currentNode);
        nodes.forEach(node => {
            const txt = node.textContent.trim();
            if(txt && map[txt] && node.parentElement && !node.parentElement.closest('script,style,textarea,input')) {
                node._origAr = txt;
                node.textContent = node.textContent.replace(txt, map[txt]);
            }
        });
    } else {
        const map = autoTranslateMap.en;
        const textNodes = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
        const nodes = [];
        while(textNodes.nextNode()) nodes.push(textNodes.currentNode);
        nodes.forEach(node => {
            const txt = node.textContent.trim();
            if(txt && map[txt] && node.parentElement && !node.parentElement.closest('script,style,textarea,input')) {
                node.textContent = node.textContent.replace(txt, map[txt]);
            }
        });
    }
}

function toggleTheme() {
    const html = document.documentElement;
    const current = html.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('tagger_theme', next);
    const icon = next === 'dark' ? '🌙' : '☀️';
    if (document.getElementById('themeIcon')) document.getElementById('themeIcon').textContent = icon;
    if (document.getElementById('sidebarThemeIcon')) document.getElementById('sidebarThemeIcon').textContent = icon;
    if (document.getElementById('mobileThemeIcon')) document.getElementById('mobileThemeIcon').textContent = icon;
    showToast(next === 'dark' ? '🌙 الموضع الليلي' : '☀️ الموضع النهاري', 'success');
}

function toggleLanguage() {
    currentLang = currentLang === 'ar' ? 'en' : 'ar';
    localStorage.setItem('tagger_lang', currentLang);
    const html = document.documentElement;
    html.lang = currentLang;
    html.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
    const langEl = document.getElementById('langToggle');
    if (langEl) langEl.textContent = currentLang === 'ar' ? 'EN/عربي' : 'عربي/EN';
    renderInventoryTable();
    renderInvoicesTable();
    renderShiftsTable();
    renderMainCategoriesBar();
    if(typeof renderInstallmentsTable === 'function') renderInstallmentsTable();
    if(typeof renderCashTransactions === 'function') renderCashTransactions();
    if(typeof renderCustomersTable === 'function') renderCustomersTable();
    if(typeof renderSuppliersTable === 'function') renderSuppliersTable();
    if(typeof renderUsersTable === 'function') renderUsersTable();
    applyTranslations();
    showToast(currentLang === 'ar' ? '🌐 تم تغيير اللغة إلى العربية' : '🌐 Language changed to English', 'success');
}

let isSoundOn = true;

function playSound(type) {
    if(!isSoundOn) return;
    try {
        const audio = new Audio('data:audio/wav;base64,UklGRlAAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YVoAAACAgICAf39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f38=');
        audio.play().catch(() => {});
    } catch(e) {}
}

function toggleSound() {
    isSoundOn = !isSoundOn;
    const el = document.getElementById('soundToggle') || document.getElementById('sidebarSoundBtn');
    if (el) el.innerHTML = isSoundOn ? '<i class="fa-solid fa-volume-high"></i>' : '<i class="fa-solid fa-volume-xmark"></i>';
    showToast(isSoundOn ? '🔊 الصوت مفعل' : '🔇 الصوت معطل', 'success');
}

function openModal(id) {
    const el = document.getElementById(id);
    if (el) {
        el.classList.remove('hidden');
        el.style.display = '';
    }
}

function closeModal(id) {
    const el = document.getElementById(id);
    if (el) {
        el.classList.add('hidden');
    }
}

function toggleMobileSidebar() {
    const sidebar = document.getElementById('mainSidebar');
    const overlay = document.getElementById('mobileSidebarOverlay');
    if (sidebar.classList.contains('mobile-open')) {
        closeMobileSidebar();
    } else {
        sidebar.classList.add('mobile-open');
        overlay.classList.add('active');
    }
}

function closeMobileSidebar() {
    const sidebar = document.getElementById('mainSidebar');
    const overlay = document.getElementById('mobileSidebarOverlay');
    sidebar.classList.remove('mobile-open');
    overlay.classList.remove('active');
}

function showToast(message, type = 'success') {
    const MAX_VISIBLE = 3;
    const container = document.getElementById('toastContainer') || (() => {
        const div = document.createElement('div');
        div.id = 'toastContainer';
        div.className = 'fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2';
        document.body.appendChild(div);
        return div;
    })();
    const colors = { success: 'bg-emerald-600', error: 'bg-red-600', warning: 'bg-amber-600' };
    const toast = document.createElement('div');
    toast.className = `${colors[type] || colors.success} text-white px-6 py-3 rounded-xl text-sm font-bold shadow-2xl animate-slideDown`;
    toast.innerText = message;
    container.appendChild(toast);
    while (container.children.length > MAX_VISIBLE) {
        container.firstChild.remove();
    }
    setTimeout(() => toast.remove(), 3000);
}

function updateSidebarUser() {
    const name = document.getElementById('currentStaffName')?.textContent;
    const sidebarName = document.getElementById('sidebarStaffName');
    if (name && sidebarName) sidebarName.textContent = name;
}

function openCardScanner() {
    if(!('mediaDevices' in navigator)) { showToast('❌ الكاميرا غير مدعومة', 'error'); return; }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if(!file) return;
        showToast('📷 جاري تحليل الصورة... (يحتاج Tesseract.js)', 'warning');
    };
    input.click();
}

const styleTag = document.createElement('style');
styleTag.textContent = `
    @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
    .animate-slideDown { animation: slideDown 0.3s ease; }
    @keyframes modalIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
    .animate-modalIn { animation: modalIn 0.25s ease; }
`;
document.head.appendChild(styleTag);

// ===== Custom Confirm Modal =====
function showConfirm(message, title, options = {}) {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirmModal');
        const titleEl = document.getElementById('confirmTitle');
        const msgEl = document.getElementById('confirmMessage');
        const iconEl = document.getElementById('confirmIcon');
        const okBtn = document.getElementById('confirmOkBtn');
        const cancelBtn = document.getElementById('confirmCancelBtn');
        
        titleEl.textContent = title || 'تأكيد';
        msgEl.textContent = message;
        
        if (options.danger) {
            iconEl.innerHTML = '<i class="fa-solid fa-trash"></i>';
            iconEl.style.background = 'rgba(239,68,68,0.15)';
            iconEl.style.color = '#ef4444';
            okBtn.style.background = 'var(--danger)';
        } else if (options.warning) {
            iconEl.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>';
            iconEl.style.background = 'rgba(234,179,8,0.15)';
            iconEl.style.color = '#eab308';
            okBtn.style.background = 'var(--warning)';
        } else if (options.info) {
            iconEl.innerHTML = '<i class="fa-solid fa-circle-info"></i>';
            iconEl.style.background = 'rgba(59,130,246,0.15)';
            iconEl.style.color = '#3b82f6';
            okBtn.style.background = 'var(--info)';
        } else {
            iconEl.innerHTML = '<i class="fa-solid fa-circle-question"></i>';
            iconEl.style.background = 'rgba(168,85,247,0.15)';
            iconEl.style.color = '#a855f7';
            okBtn.style.background = 'var(--accent)';
        }
        
        okBtn.textContent = options.okText || 'تأكيد';
        cancelBtn.textContent = options.cancelText || 'إلغاء';
        
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        
        const cleanup = (result) => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            okBtn.onclick = null;
            cancelBtn.onclick = null;
            resolve(result);
        };
        
        okBtn.onclick = () => cleanup(true);
        cancelBtn.onclick = () => cleanup(false);
    });
}

// ===== Loading Overlay =====
function showLoading(text) {
    const overlay = document.getElementById('loadingOverlay');
    const textEl = document.getElementById('loadingText');
    if (textEl) textEl.textContent = text || 'جاري التحميل...';
    overlay.classList.remove('hidden');
    overlay.classList.add('flex');
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    overlay.classList.add('hidden');
    overlay.classList.remove('flex');
}

// ===== Product Quick View =====
function quickViewProduct(productId) {
    const prod = localProducts.find(p => p.id === productId);
    if (!prod) return;
    
    const modal = document.getElementById('productQuickViewModal');
    const imgEl = document.getElementById('pqvImage');
    const nameEl = document.getElementById('pqvName');
    const barcodeEl = document.getElementById('pqvBarcode');
    const stockEl = document.getElementById('pqvStock');
    const sellEl = document.getElementById('pqvSellPrice');
    const purchaseEl = document.getElementById('pqvPurchasePrice');
    const categoryEl = document.getElementById('pqvCategory');
    const supplierEl = document.getElementById('pqvSupplier');
    const profitEl = document.getElementById('pqvProfit');
    const addBtn = document.getElementById('pqvAddBtn');
    
    const sellPrice = parseFloat(prod.sell_price || prod.price || 0);
    const purchasePrice = parseFloat(prod.purchase_price || 0);
    const profit = (sellPrice - purchasePrice).toFixed(2);
    const stock = parseInt(prod.stock || 0);
    
    if (prod.image_url) {
        imgEl.innerHTML = `<img src="${prod.image_url}" class="w-full h-48 object-cover" onerror="this.parentElement.innerHTML='<i class=\\'fa-solid fa-image text-4xl\\' style=\\'color:var(--text-3);opacity:0.3;\\'></i>'">`;
    } else {
        imgEl.innerHTML = '<i class="fa-solid fa-image text-4xl" style="color: var(--text-3); opacity: 0.3;"></i>';
    }
    
    nameEl.textContent = prod.title || prod.product_name || 'منتج';
    barcodeEl.textContent = 'باركود: ' + (prod.barcode || 'N/A');
    
    stockEl.textContent = stock + ' وحدة';
    stockEl.style.background = stock === 0 ? 'rgba(239,68,68,0.15)' : stock <= 5 ? 'rgba(234,179,8,0.15)' : 'rgba(34,197,94,0.15)';
    stockEl.style.color = stock === 0 ? '#ef4444' : stock <= 5 ? '#eab308' : '#22c55e';
    
    sellEl.textContent = sellPrice.toFixed(2) + ' ج.م';
    purchaseEl.textContent = purchasePrice.toFixed(2) + ' ج.م';
    categoryEl.textContent = prod.category || 'عام';
    
    const supplier = prod.supplier_id ? suppliers.find(s => s.id === prod.supplier_id) : null;
    supplierEl.textContent = supplier ? supplier.name : 'بدون مورد';
    
    profitEl.textContent = profit + ' ج.م';
    profitEl.style.color = parseFloat(profit) > 0 ? 'var(--success)' : 'var(--danger)';
    
    addBtn.onclick = () => {
        addItemToInvoice(prod.id);
        closeModal('productQuickViewModal');
    };
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}
