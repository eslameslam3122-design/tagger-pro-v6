// TAGGER PRO V6 - AI Assistant (Agentic Edition with Tool Calling)

const AI_SUPABASE_URL = 'https://kxavxmgjqximpuouzejr.supabase.co';
const AI_SUPABASE_KEY = 'sb_publishable_wU-5h54z8dnIrASa3h4t8g_ZXo0fYnk';
const AI_MAX_HISTORY = 12;
const AI_MAX_TOOL_ROUNDS = 8;

let aiConversationHistory = [];
let aiIsProcessing = false;

// ============================================================
// فتح/إغلاق المساعد
// ============================================================
function openAiAssistant() {
    const modal = document.getElementById('aiAssistantModal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    initAiAssistant();
    document.getElementById('aiInput').focus();
}

function initAiAssistant() {
    const welcomeEl = document.getElementById('aiChatMessages');
    if (welcomeEl && welcomeEl.children.length === 0) {
        addAiBotMessage('أهلاً يا صاحبي! 👋 أنا تاجر، مساعدك الذكي.<br><br>أقدر أساعدك في:<br>• 📦 إضافة/حذف/تعديل منتجات<br>• 🏆 تحليل المنافسين في أي منطقة<br>• 📍 البحث في خرائط جوجل عن محلات<br>• 💲 مقارنة الأسعار وأحسن مواقع شراء<br>• 🔍 بحث في الإنترنت<br>• 📊 تقارير مبيعات وأرباح<br>• 👥 إدارة عملاء<br>• 💰 تسجيل مصروفات<br><br>اسألني أو اطلب مني أي حاجة!');
    }
    renderQuickPrompts();
    updateAiProviderLabel();
    loadSavedKeys();
}

// ============================================================
// تعريف الأدوات (Tools)
// ============================================================
const AI_TOOLS = [
    {
        type: 'function',
        function: {
            name: 'add_product',
            description: 'إضافة منتج جديد في المخزن. استخدمها لما المستخدم يطلب إضافة منتج.',
            parameters: {
                type: 'object',
                properties: {
                    name: { type: 'string', description: 'اسم المنتج' },
                    sell_price: { type: 'number', description: 'سعر البيع بالجنيه' },
                    purchase_price: { type: 'number', description: 'سعر الشراء بالجنيه' },
                    stock: { type: 'integer', description: 'الكمية في المخزن', default: 1 },
                    category: { type: 'string', description: 'التصنيف', default: 'عام' },
                    barcode: { type: 'string', description: 'الباركود', default: '' }
                },
                required: ['name', 'sell_price']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'add_products_bulk',
            description: 'إضافة عدة منتجات دفعة واحدة. استخدمها لما المستخدم يطلب إضافة أكتر من منتج.',
            parameters: {
                type: 'object',
                properties: {
                    products: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                name: { type: 'string' },
                                sell_price: { type: 'number' },
                                purchase_price: { type: 'number' },
                                stock: { type: 'integer' },
                                category: { type: 'string' }
                            },
                            required: ['name', 'sell_price']
                        },
                        description: 'قائمة المنتجات'
                    }
                },
                required: ['products']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'update_stock',
            description: 'تحديث كمية المخزون لمنتج معين. ممكن تزود أو تنقص.',
            parameters: {
                type: 'object',
                properties: {
                    product_name: { type: 'string', description: 'اسم المنتج' },
                    new_stock: { type: 'integer', description: 'الكمية الجديدة' },
                    operation: { type: 'string', enum: ['set', 'add', 'subtract'], description: 'نوع العملية: set=تعيين، add=إضافة، subtract=خصم', default: 'set' }
                },
                required: ['product_name', 'new_stock']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'update_price',
            description: 'تحديث سعر بيع منتج.',
            parameters: {
                type: 'object',
                properties: {
                    product_name: { type: 'string', description: 'اسم المنتج' },
                    new_price: { type: 'number', description: 'السعر الجديد' }
                },
                required: ['product_name', 'new_price']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'delete_product',
            description: 'حذف منتج من المخزن.',
            parameters: {
                type: 'object',
                properties: {
                    product_name: { type: 'string', description: 'اسم المنتج المراد حذفه' }
                },
                required: ['product_name']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'search_products',
            description: 'البحث عن منتجات في المخزن بالاسم.',
            parameters: {
                type: 'object',
                properties: {
                    query: { type: 'string', description: 'كلمة البحث' }
                },
                required: ['query']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_products',
            description: 'جلب قائمة كل المنتجات في المخزن.',
            parameters: {
                type: 'object',
                properties: {
                    category: { type: 'string', description: 'تصنيف معين (اختياري)' },
                    limit: { type: 'integer', description: 'عدد النتائج', default: 50 }
                }
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'add_customer',
            description: 'إضافة عميل جديد.',
            parameters: {
                type: 'object',
                properties: {
                    name: { type: 'string', description: 'اسم العميل' },
                    phone: { type: 'string', description: 'رقم التليفون' },
                    email: { type: 'string', description: 'الإيميل' }
                },
                required: ['name']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'search_web',
            description: 'البحث في الإنترنت عن أي موضوع - أسعار، منافسين، منتجات، معلومات.',
            parameters: {
                type: 'object',
                properties: {
                    query: { type: 'string', description: 'كلمة البحث' }
                },
                required: ['query']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_invoices',
            description: 'جلب الفواتير. ممكن تجيب فواتير النهارده أو فترة معينة.',
            parameters: {
                type: 'object',
                properties: {
                    period: { type: 'string', enum: ['today', 'yesterday', 'week', 'month', 'all'], description: 'الفترة الزمنية', default: 'today' }
                }
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'add_expense',
            description: 'تسجيل مصروف أو إيراد في المالية.',
            parameters: {
                type: 'object',
                properties: {
                    type: { type: 'string', enum: ['expense', 'revenue'], description: 'نوع العملية: expense=مصروف، revenue=إيراد' },
                    amount: { type: 'number', description: 'المبلغ' },
                    category: { type: 'string', description: 'التصنيف مثل إيجار، رواتب، فواتير' },
                    note: { type: 'string', description: 'ملاحظة' }
                },
                required: ['type', 'amount', 'category']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'search_competitors',
            description: 'البحث عن المنافسين في منطقة معينة على الإنترنت. بيجيب أسماء المحلات والمتاجر المنافسة في المنطقة.',
            parameters: {
                type: 'object',
                properties: {
                    area: { type: 'string', description: 'المنطقة أو المدينة (مثل: المعادي، الشيخ زايد، الإسكندرية)' },
                    business_type: { type: 'string', description: 'نوع النشاط التجاري (مثل: موبايلات، إلكترونيات، إكسسوارات، لاب توب)' }
                },
                required: ['area']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'search_best_price',
            description: 'البحث عن أفضل سعر لمنتج معين في مواقع البيع المختلفة (أمازون، جوميا، eBay، مواقع مصرية). بيجيب أحسن سعر وأحسن موقع.',
            parameters: {
                type: 'object',
                properties: {
                    product_name: { type: 'string', description: 'اسم المنتج المطلوب' },
                    country: { type: 'string', description: 'الدولة للبحث فيها', default: 'مصر' }
                },
                required: ['product_name']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'search_google_maps',
            description: 'البحث في خرائط جوجل عن متاجر أو محلات في منطقة معينة. بيجيب أسماء المحلات وعناوينها وتقييماتها.',
            parameters: {
                type: 'object',
                properties: {
                    query: { type: 'string', description: 'البحث (مثل: "متاجر موبايلات المعادي" أو "أفضل محل لابتوب الشيخ زايد")' },
                    area: { type: 'string', description: 'المنطقة' }
                },
                required: ['query']
            }
        }
    }
];

// ============================================================
// تنفيذ الأدوات
// ============================================================
async function executeAiTool(name, args) {
    console.log('🔧 AI Tool:', name, args);
    addAiToolIndicator(name, args);

    switch (name) {
        case 'add_product': {
            const product = {
                title: args.name,
                product_name: args.name,
                sell_price: args.sell_price,
                purchase_price: args.purchase_price || 0,
                stock: args.stock || 1,
                category: args.category || 'عام',
                barcode: args.barcode || '',
                store_id: currentStoreId
            };
            try {
                const { data, error } = await sb.from('products').insert(product).select().single();
                if (error) throw error;
                await loadAllData();
                return { success: true, message: `تمت إضافة "${args.name}" بسعر ${args.sell_price} ج.م والكمية ${product.stock}`, product: data };
            } catch (e) {
                return { success: false, message: 'خطأ في إضافة المنتج: ' + e.message };
            }
        }

        case 'add_products_bulk': {
            const results = [];
            for (const p of args.products) {
                const product = {
                    title: p.name,
                    product_name: p.name,
                    sell_price: p.sell_price,
                    purchase_price: p.purchase_price || 0,
                    stock: p.stock || 1,
                    category: p.category || 'عام',
                    store_id: currentStoreId
                };
                try {
                    const { error } = await sb.from('products').insert(product);
                    if (error) throw error;
                    results.push({ name: p.name, status: 'ok' });
                } catch (e) {
                    results.push({ name: p.name, status: 'error', error: e.message });
                }
            }
            await loadAllData();
            const ok = results.filter(r => r.status === 'ok').length;
            const fail = results.filter(r => r.status === 'error').length;
            return { success: ok > 0, message: `تمت إضافة ${ok} منتج${fail > 0 ? ` وفشل ${fail}` : ''}`, results };
        }

        case 'update_stock': {
            const prod = localProducts.find(p => (p.title || p.product_name || '').toLowerCase().includes(args.product_name.toLowerCase()));
            if (!prod) return { success: false, message: `مش لاقي المنتج "${args.product_name}"` };
            let newStock = args.new_stock;
            if (args.operation === 'add') newStock = (prod.stock || 0) + args.new_stock;
            else if (args.operation === 'subtract') newStock = Math.max(0, (prod.stock || 0) - args.new_stock);
            try {
                await sb.from('products').update({ stock: newStock }).eq('id', prod.id);
                prod.stock = newStock;
                await LocalDB.put('products', { ...prod, stock: newStock });
                return { success: true, message: `تم تحديث مخزون "${prod.title || prod.product_name}" إلى ${newStock}` };
            } catch (e) {
                return { success: false, message: 'خطأ في تحديث المخزون: ' + e.message };
            }
        }

        case 'update_price': {
            const prod = localProducts.find(p => (p.title || p.product_name || '').toLowerCase().includes(args.product_name.toLowerCase()));
            if (!prod) return { success: false, message: `مش لاقي المنتج "${args.product_name}"` };
            try {
                await sb.from('products').update({ sell_price: args.new_price }).eq('id', prod.id);
                prod.sell_price = args.new_price;
                prod.price = args.new_price;
                await LocalDB.put('products', { ...prod });
                return { success: true, message: `تم تحديث سعر "${prod.title || prod.product_name}" إلى ${args.new_price} ج.م` };
            } catch (e) {
                return { success: false, message: 'خطأ في تحديث السعر: ' + e.message };
            }
        }

        case 'delete_product': {
            const prod = localProducts.find(p => (p.title || p.product_name || '').toLowerCase().includes(args.product_name.toLowerCase()));
            if (!prod) return { success: false, message: `مش لاقي المنتج "${args.product_name}"` };
            try {
                await sb.from('products').delete().eq('id', prod.id);
                await loadAllData();
                return { success: true, message: `تم حذف "${prod.title || prod.product_name}" من المخزن` };
            } catch (e) {
                return { success: false, message: 'خطأ في حذف المنتج: ' + e.message };
            }
        }

        case 'search_products': {
            const q = args.query.toLowerCase();
            const results = localProducts.filter(p =>
                (p.title || p.product_name || '').toLowerCase().includes(q) ||
                (p.category || '').toLowerCase().includes(q) ||
                (p.barcode || '').includes(q)
            ).slice(0, 20);
            return {
                success: true,
                count: results.length,
                products: results.map(p => ({
                    name: p.title || p.product_name,
                    price: parseFloat(p.sell_price || p.price || 0),
                    stock: p.stock,
                    category: p.category
                }))
            };
        }

        case 'get_products': {
            let prods = [...localProducts];
            if (args.category) prods = prods.filter(p => (p.category || '').toLowerCase().includes(args.category.toLowerCase()));
            prods = prods.slice(0, args.limit || 50);
            return {
                success: true,
                total: localProducts.length,
                shown: prods.length,
                products: prods.map(p => ({
                    name: p.title || p.product_name,
                    price: parseFloat(p.sell_price || p.price || 0),
                    purchase: parseFloat(p.purchase_price || 0),
                    stock: p.stock,
                    category: p.category
                }))
            };
        }

        case 'add_customer': {
            const customer = {
                name: args.name,
                customer_name: args.name,
                phone: args.phone || '',
                email: args.email || '',
                store_id: currentStoreId,
                total_spent: 0,
                total_debt: 0,
                points: 0
            };
            try {
                const { data, error } = await sb.from('customers').insert(customer).select().single();
                if (error) throw error;
                await loadAllData();
                return { success: true, message: `تمت إضافة العميل "${args.name}"`, customer: data };
            } catch (e) {
                return { success: false, message: 'خطأ في إضافة العميل: ' + e.message };
            }
        }

        case 'search_web': {
            const webResults = await searchWeb(args.query);
            if (webResults && webResults.results && webResults.results.length > 0) {
                return {
                    success: true,
                    results: webResults.results.slice(0, 5).map(r => ({
                        title: r.title,
                        snippet: r.snippet,
                        url: r.url
                    }))
                };
            }
            return { success: false, message: 'مش لاقي نتائج للبحث ده' };
        }

        case 'get_invoices': {
            const now = new Date();
            let filtered = [...allInvoices];
            if (args.period === 'today') {
                filtered = filtered.filter(i => new Date(i.created_at).toDateString() === now.toDateString());
            } else if (args.period === 'yesterday') {
                const y = new Date(); y.setDate(y.getDate() - 1);
                filtered = filtered.filter(i => new Date(i.created_at).toDateString() === y.toDateString());
            } else if (args.period === 'week') {
                const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
                filtered = filtered.filter(i => new Date(i.created_at) >= weekAgo);
            } else if (args.period === 'month') {
                const monthAgo = new Date(); monthAgo.setMonth(monthAgo.getMonth() - 1);
                filtered = filtered.filter(i => new Date(i.created_at) >= monthAgo);
            }
            const totalSales = filtered.reduce((s, i) => s + parseFloat(i.final_amount || i.total_amount || 0), 0);
            const totalProfit = filtered.reduce((s, i) => s + parseFloat((i.final_amount || i.total_amount || 0) - (i.cost_total || 0)), 0);
            return {
                success: true,
                period: args.period || 'today',
                count: filtered.length,
                total_sales: totalSales.toFixed(2),
                total_profit: totalProfit.toFixed(2),
                invoices: filtered.slice(0, 10).map(i => ({
                    number: i.invoice_number,
                    amount: parseFloat(i.final_amount || i.total_amount || 0),
                    customer: i.customer_name || 'نقدي',
                    date: i.created_at
                }))
            };
        }

        case 'add_expense': {
            const tx = {
                store_id: currentStoreId,
                type: args.type,
                amount: args.amount,
                category: args.category,
                note: args.note || '',
                description: args.note || args.category,
                created_by: localStorage.getItem('active_staff_name') || 'الكاشير',
                created_at: new Date().toISOString()
            };
            try {
                const { error } = await sb.from('finance_transactions').insert(tx);
                if (error) throw error;
                return { success: true, message: `تم تسجيل ${args.type === 'expense' ? 'مصروف' : 'إيراد'} ${args.amount} ج.م (${args.category})` };
            } catch (e) {
                return { success: false, message: 'خطأ في التسجيل: ' + e.message };
            }
        }

        case 'search_competitors': {
            const area = args.area;
            const bizType = args.business_type || 'متاجر';
            const queries = [
                `mobile phones stores ${area} Egypt`,
                `${bizType} في ${area} مصر`,
                `محلات موبايلات ${area} مصر خرائط`,
                `${area} Egypt shops stores phone`,
                `${bizType} near ${area} Egypt google maps`
            ];
            let allResults = [];
            for (const q of queries) {
                const res = await searchWeb(q, 'competitor');
                if (res && res.results) allResults.push(...res.results);
            }
            const unique = [];
            const seen = new Set();
            for (const r of allResults) {
                const key = (r.title || '').toLowerCase();
                if (!seen.has(key) && key) { seen.add(key); unique.push(r); }
            }
            if (unique.length === 0) {
                return {
                    success: false,
                    area,
                    business_type: bizType,
                    message: `مش لاقي منافسين في "${area}". جرّب البحث على Google Maps.`,
                    competitors: [],
                    google_maps_link: `https://www.google.com/maps/search/${encodeURIComponent(bizType + ' ' + area + ' Egypt')}`
                };
            }
            return {
                success: true,
                area,
                business_type: bizType,
                count: unique.length,
                competitors: unique.slice(0, 10).map(r => ({
                    name: r.title,
                    details: r.snippet,
                    url: r.url
                })),
                google_maps_link: `https://www.google.com/maps/search/${encodeURIComponent(bizType + ' ' + area + ' Egypt')}`
            };
        }

        case 'search_best_price': {
            const productName = args.product_name;
            const country = args.country || 'مصر';
            const queries = [
                `${productName} ${country} أفضل سعر`,
                `${productName} site:amazon.com OR site:jumia.com OR site:noon.com OR site:ebay.com`,
                `شراء ${productName} ${country} أرخص سعر`,
                `${productName} price Egypt cheap`
            ];
            let allResults = [];
            for (const q of queries) {
                const res = await searchWeb(q, 'price');
                if (res && res.results) allResults.push(...res.results);
            }
            const unique = [];
            const seen = new Set();
            for (const r of allResults) {
                const key = (r.title || '').toLowerCase().substring(0, 40);
                if (!seen.has(key) && key) { seen.add(key); unique.push(r); }
            }
            return {
                success: true,
                product: productName,
                country,
                count: unique.length,
                results: unique.slice(0, 8).map(r => ({
                    title: r.title,
                    snippet: r.snippet,
                    url: r.url
                }))
            };
        }

        case 'search_google_maps': {
            const query = args.query;
            const mapsQueries = [
                `${query} Egypt google maps`,
                `${query} location address phone`,
                `${query} مصر خرائط جوجل`,
                `${query} nearby stores shops`,
                `${query} منظور الشارع عنوان`
            ];
            let allResults = [];
            for (const q of mapsQueries) {
                const res = await searchWeb(q, 'search');
                if (res && res.results) allResults.push(...res.results);
            }
            const unique = [];
            const seen = new Set();
            for (const r of allResults) {
                const key = (r.title || '').toLowerCase().substring(0, 40);
                if (!seen.has(key) && key) { seen.add(key); unique.push(r); }
            }
            if (unique.length === 0) {
                return {
                    success: false,
                    message: `مش لاقي نتائج عن "${query}". جرّب: ابحث على Google Maps مباشرة أو استخدم اسم أدق للمنطقة.`,
                    google_maps_link: `https://www.google.com/maps/search/${encodeURIComponent(query + ' Egypt')}`
                };
            }
            return {
                success: true,
                query,
                count: unique.length,
                locations: unique.slice(0, 8).map(r => ({
                    name: r.title,
                    details: r.snippet,
                    url: r.url
                })),
                google_maps_link: `https://www.google.com/maps/search/${encodeURIComponent(query + ' Egypt')}`
            };
        }

        default:
            return { success: false, message: 'الأداة غير معروفة: ' + name };
    }
}

// ============================================================
// بحث في الإنترنت
// ============================================================
async function searchWeb(query, type = 'general') {
    try {
        const { data, error } = await sb.functions.invoke('search-web', {
            body: { query, type, country: 'EG' }
        });
        if (error) throw error;
        return data;
    } catch (e) {
        console.warn('Web search failed:', e);
        try {
            const response = await fetch(`${AI_SUPABASE_URL}/functions/v1/search-web`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${AI_SUPABASE_KEY}` },
                body: JSON.stringify({ query, type, country: 'EG' })
            });
            if (!response.ok) return null;
            return await response.json();
        } catch (e2) {
            console.warn('Web search fallback also failed:', e2);
            return null;
        }
    }
}

// ============================================================
// System Prompt
// ============================================================
function getAiSystemContext() {
    const todaySales = allInvoices.filter(i => { const d = new Date(i.created_at); return d.toDateString() === new Date().toDateString(); });
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    const yesterdaySales = allInvoices.filter(i => new Date(i.created_at).toDateString() === yesterday.toDateString());
    const totalSalesToday = todaySales.reduce((s, i) => s + parseFloat(i.final_amount || i.total_amount || 0), 0);
    const totalSalesYesterday = yesterdaySales.reduce((s, i) => s + parseFloat(i.final_amount || i.total_amount || 0), 0);
    const totalProfitToday = todaySales.reduce((s, i) => s + parseFloat((i.final_amount || i.total_amount || 0) - (i.cost_total || 0)), 0);
    const totalProducts = localProducts.length;
    const lowStockProducts = localProducts.filter(p => p.stock > 0 && p.stock <= lowStockThreshold);
    const outOfStock = localProducts.filter(p => p.stock <= 0);
    const topByPrice = [...localProducts].sort((a, b) => parseFloat(b.sell_price || b.price || 0) - parseFloat(a.sell_price || a.price || 0)).slice(0, 5);
    const totalCustomers = allCustomers.length;

    function diffLabel(a, b) {
        if (b === 0) return a > 0 ? '(جديد!)' : '(ثابت)';
        const pct = (((a - b) / b) * 100).toFixed(1);
        if (pct > 0) return '(↑' + pct + '%)';
        if (pct < 0) return '(↓' + Math.abs(pct) + '%)';
        return '(ثابت)';
    }

    return `أنت "تاجر"، مساعد ذكي ودود ومتفهم. صاحبك صاحب متجر في مصر وانت مساعده.

شخصيتك:
- بتتكلم عربي عامي مصري زى الشباب
- ودود ومرح وبتحب تساعد
- ذكي جداً وبتفهم في البيزنس والمتاجر
- لما حد يسألك عن حاجة في المتجر، استخدم البيانات اللي تحت
- لما حد يتكلم معاك عادي، رد بشكل طبيعي وودود

=== قدراتك (مهم جداً) ===
أنت عندك صلاحيات كاملة على المتجر. تقدر تنفذ الأوامر مباشرة:

📦 إدارة المخزون:
- "ضيف منتج [اسم] بسعر [سعر]" → استخدم add_product
- "ضيف منتجات كتير" → استخدم add_products_bulk
- "غيّر كمية [منتج] إلى [كمية]" → استخدم update_stock
- "زود/نقص [كمية] من [منتج]" → استخدم update_stock مع add/subtract
- "غيّر سعر [منتج] إلى [سعر]" → استخدم update_price
- "امسح [منتج]" → استخدم delete_product
- "دور على [اسم/كلمة]" → استخدم search_products
- "وريني كل المنتجات" → استخدم get_products

👥 إدارة العملاء:
- "ضيف عميل [اسم]" → استخدم add_customer

💰 الإدارة المالية:
- "سجّل مصروف [مبلغ] [ تصنيف]" → استخدم add_expense مع expense
- "سجّل إيراد [مبلغ]" → استخدم add_expense مع revenue

🔍 البحث:
- "دور على [حاجة] في النت" → استخدم search_web

🏆 تحليل المنافسين:
- "دور على منافسين في [المنطقة]" → استخدم search_competitors
- "اعمل تقرير عن المنافسين في [المنطقة]([نوع النشاط])" → استخدم search_competitors
- "ايه محلات [النشاط] في [المنطقة]؟" → استخدم search_competitors

💲 مقارنة الأسعار وأفضل مواقع الشراء:
- "إيه أحسن سعر لـ [المنتج]؟" → استخدم search_best_price
- "قارن أسعار [المنتج] في المواقع" → استخدم search_best_price
- "أرخص مكان أشتري [المنتج] منين؟" → استخدم search_best_price
- "اعمللي مقارنة أسعار [المنتج] على أمازون وجوميا ونون" → استخدم search_best_price

📍 البحث في خرائط جوجل:
- "دور على [محلات/متاجر] في [المنطقة] على الخريطة" → استخدم search_google_maps
- "ايه أقرب محل [النشاط] مني؟" → استخدم search_google_maps
- "وريني عنوان وتليفون [محل معين]" → استخدم search_google_maps
- "اعمللي تقرير عن [المنطقة] فيها الأسماء والعناوين والتقييمات" → استخدم search_google_maps + search_competitors

مهم: لما المستخدم يطلب أمر، نفذه فوراً بالـ tool المناسب وارد بنتيجة العملية. متسألش "متأكد؟" - نفذ وبعدين قول اتعمل إيه.
لو الأداة مرجعتش نتائج، قول للمستخدم إن المنطقة دي ممكن ما يكونش فيها نتائج كتير في البحث، واعطيه رابط Google Maps عشان يدور بنفسه.

=== بيانات المتجر الحالية ===
📦 المنتجات: ${totalProducts} | قليل: ${lowStockProducts.length} | نفد: ${outOfStock.length}
👥 العملاء: ${totalCustomers}
📄 فواتير النهارده: ${todaySales.length} فاتورة ${diffLabel(todaySales.length, yesterdaySales.length)}
💰 مبيعات النهارده: ${totalSalesToday.toFixed(2)} ج.م ${diffLabel(totalSalesToday, totalSalesYesterday)}
💵 أرباح النهارده: ${totalProfitToday.toFixed(2)} ج.م
${topByPrice.length > 0 ? '🔝 أغلى: ' + topByPrice.slice(0,3).map(p => (p.title||p.product_name) + ' ' + parseFloat(p.sell_price||p.price||0).toFixed(0) + 'ج').join(' | ') : ''}`;
}

// ============================================================
// Chat UI
// ============================================================
function addAiUserMessage(text) {
    const chatBox = document.getElementById('aiChatMessages');
    chatBox.innerHTML += `<div class="flex gap-2 items-start justify-end"><div class="p-2.5 rounded-2xl rounded-tr-sm text-[11px] max-w-[85%] leading-relaxed" style="background: linear-gradient(135deg, var(--accent), var(--accent-2)); color: #fff;">${escapeAiHtml(text)}</div></div>`;
    chatBox.scrollTop = chatBox.scrollHeight;
}

function addAiBotMessage(text, provider) {
    const chatBox = document.getElementById('aiChatMessages');
    let label = '';
    if (provider === 'Gemini') label = '🟢 Gemini';
    else if (provider === 'Groq') label = '🟢 Groq';
    else if (provider === 'OpenAI') label = '🔵 OpenAI';
    else if (provider === 'محلي') label = '🟡 محلي';
    else if (provider === 'خطأ+محلي') label = '🔴 خطأ + محلي';
    const providerLabel = label ? `<div style="font-size:8px;opacity:0.5;margin-top:2px;padding-right:36px;" dir="rtl">${label}</div>` : '';
    chatBox.innerHTML += `<div class="flex gap-2 items-start"><div class="w-7 h-7 rounded-xl flex-shrink-0 flex items-center justify-center" style="background: linear-gradient(135deg, var(--accent), var(--info)); box-shadow: 0 2px 8px rgba(59,130,246,0.3);"><i class="fa-solid fa-robot text-white text-[9px]"></i></div><div class="p-2.5 rounded-2xl rounded-tl-sm text-[11px] max-w-[85%] leading-relaxed" style="background: var(--bg-elevated); color: var(--text-1); border: 1px solid var(--border);">${text}</div></div>${providerLabel}`;
    chatBox.scrollTop = chatBox.scrollHeight;
}

function addAiToolIndicator(name, args) {
    const chatBox = document.getElementById('aiChatMessages');
    const toolLabels = {
        add_product: '📦 إضافة منتج',
        add_products_bulk: '📦 إضافة منتجات',
        update_stock: '📊 تحديث مخزون',
        update_price: '💲 تحديث سعر',
        delete_product: '🗑️ حذف منتج',
        search_products: '🔍 بحث في المخزن',
        get_products: '📦 جلب المنتجات',
        add_customer: '👥 إضافة عميل',
        search_web: '🌐 بحث في الإنترنت',
        search_competitors: '🏆 بحث عن المنافسين',
        search_best_price: '💲 أفضل سعر',
        search_google_maps: '📍 بحث في خرائط جوجل',
        get_invoices: '📊 جلب الفواتير',
        add_expense: '💰 تسجيل مالي'
    };
    const label = toolLabels[name] || '🔧 ' + name;
    const argsStr = Object.entries(args).filter(([k,v]) => v !== undefined).map(([k,v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`).join(', ');
    chatBox.innerHTML += `<div class="flex gap-2 items-start"><div class="w-7 h-7 rounded-xl flex-shrink-0 flex items-center justify-center" style="background: linear-gradient(135deg, #8b5cf6, #6d28d9);"><i class="fa-solid fa-wrench text-white text-[9px]"></i></div><div class="p-2 rounded-xl text-[10px]" style="background: rgba(139,92,246,0.1); color: #a78bfa; border: 1px solid rgba(139,92,246,0.2);"><i class="fa-solid fa-spinner fa-spin ml-1"></i> ${label}<br><span style="font-size:9px;opacity:0.7;">${escapeAiHtml(argsStr.substring(0, 120))}</span></div></div>`;
    chatBox.scrollTop = chatBox.scrollHeight;
}

function addAiTypingIndicator() {
    const chatBox = document.getElementById('aiChatMessages');
    chatBox.innerHTML += `<div id="aiTyping" class="flex gap-2 items-start"><div class="w-7 h-7 rounded-xl flex-shrink-0 flex items-center justify-center" style="background: linear-gradient(135deg, var(--accent), var(--info));"><i class="fa-solid fa-robot text-white text-[9px]"></i></div><div class="p-3 rounded-2xl rounded-tl-sm" style="background: var(--bg-elevated); border: 1px solid var(--border);"><div class="flex gap-1"><span class="w-1.5 h-1.5 rounded-full animate-bounce" style="background:var(--accent);animation-delay:0s;"></span><span class="w-1.5 h-1.5 rounded-full animate-bounce" style="background:var(--accent);animation-delay:0.15s;"></span><span class="w-1.5 h-1.5 rounded-full animate-bounce" style="background:var(--accent);animation-delay:0.3s;"></span></div></div></div>`;
    document.getElementById('aiChatMessages').scrollTop = document.getElementById('aiChatMessages').scrollHeight;
}

function removeAiTyping() {
    ['aiTyping', 'aiSearchIndicator'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.remove();
    });
}

function addAiSearchIndicator(query) {
    const chatBox = document.getElementById('aiChatMessages');
    chatBox.innerHTML += `<div id="aiSearchIndicator" class="flex gap-2 items-start"><div class="w-7 h-7 rounded-xl flex-shrink-0 flex items-center justify-center" style="background: linear-gradient(135deg, #f59e0b, #d97706);"><i class="fa-solid fa-search text-white text-[9px]"></i></div><div class="p-2 rounded-xl text-[10px]" style="background: rgba(245,158,11,0.1); color: #f59e0b; border: 1px solid rgba(245,158,11,0.2);"><i class="fa-solid fa-spinner fa-spin ml-1"></i> جاري البحث: ${escapeAiHtml(query)}</div></div>`;
    chatBox.scrollTop = chatBox.scrollHeight;
}

function escapeAiHtml(str) { return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// ============================================================
// Quick Prompts
// ============================================================
function renderQuickPrompts() {
    const bar = document.getElementById('aiQuickPrompts');
    if (!bar) return;
    const lowCount = localProducts.filter(p => p.stock > 0 && p.stock <= lowStockThreshold).length;
    const outCount = localProducts.filter(p => p.stock <= 0).length;
    const prompts = [
        { icon: '📊', text: 'ملخص اليوم', msg: 'عمل ملخص كامل لمبيعات اليوم' },
        { icon: '📦', text: 'المخزون', msg: 'ايه وضع المخزون؟ في منتجات ناقصة؟' },
        { icon: '🏆', text: 'المنافسين', msg: 'اعمل تقرير عن المنافسين في منطقتنا على خرائط جوجل' },
        { icon: '💲', text: 'مقارنة أسعار', msg: 'قارن أسعار منتجاتي بالسوق والمنافسين' },
        { icon: '➕', text: 'إضافة منتج', msg: 'ضيف منتج جديد في المخزن' },
        { icon: '👥', text: 'العملاء', msg: 'كم عميل وأفضلهم مين؟' },
    ];
    if (lowCount > 0) prompts.push({ icon: '⚠️', text: `${lowCount} قليل`, msg: `قولي على المنتجات القليلة (${lowCount})` });
    if (outCount > 0) prompts.push({ icon: '🚫', text: `${outCount} نفدت`, msg: `المنتجات اللي نفدت (${outCount})` });
    bar.innerHTML = prompts.map(p => `<button onclick="sendQuickPrompt('${p.msg.replace(/'/g, "\\'")}')" class="flex-shrink-0 px-2.5 py-1.5 rounded-xl text-[9px] lg:text-[10px] font-bold transition whitespace-nowrap" style="background: var(--bg-elevated); color: var(--text-2); border: 1px solid var(--border);">${p.icon} ${p.text}</button>`).join('');
}

function sendQuickPrompt(msg) {
    document.getElementById('aiInput').value = msg;
    sendAiMessage();
}

// ============================================================
// Key Management
// ============================================================
function saveGeminiKey() {
    const key = document.getElementById('geminiKeyInput').value.trim();
    if (key) { localStorage.setItem('gemini_api_key', key); saveAiKeyToSupabase('gemini_key', key); showToast('✅ تم حفظ مفتاح Gemini', 'success'); }
    updateAiProviderLabel();
}
function saveOpenaiKey() {
    const key = document.getElementById('openaiKeyInput').value.trim();
    if (key) { localStorage.setItem('openai_api_key', key); saveAiKeyToSupabase('openai_key', key); showToast('✅ تم حفظ مفتاح OpenAI', 'success'); }
    updateAiProviderLabel();
}
function saveGroqKey() {
    const key = document.getElementById('groqKeyInput').value.trim();
    if (key) { localStorage.setItem('groq_api_key', key); saveAiKeyToSupabase('groq_key', key); showToast('✅ تم حفظ مفتاح Groq', 'success'); }
    updateAiProviderLabel();
}

async function saveAiKeyToSupabase(field, value) {
    try {
        const { data: existing } = await sb.from('ai_settings').select('id').eq('store_id', currentStoreId).limit(1);
        if (existing && existing.length > 0) {
            await sb.from('ai_settings').update({ [field]: value, updated_at: new Date().toISOString() }).eq('id', existing[0].id);
        } else {
            await sb.from('ai_settings').insert([{ store_id: currentStoreId, [field]: value }]);
        }
    } catch(e) { console.error('خطأ حفظ AI key:', e); }
}

async function loadAiKeysFromSupabase() {
    try {
        const { data } = await sb.from('ai_settings').select('*').eq('store_id', currentStoreId).limit(1);
        if (data && data.length > 0) {
            const s = data[0];
            if (s.gemini_key) localStorage.setItem('gemini_api_key', s.gemini_key);
            if (s.openai_key) localStorage.setItem('openai_api_key', s.openai_key);
            if (s.groq_key) localStorage.setItem('groq_api_key', s.groq_key);
        }
    } catch(e) { console.error('خطأ تحميل AI keys:', e); }
}

function loadSavedKeys() {
    const gi = document.getElementById('geminiKeyInput');
    const oi = document.getElementById('openaiKeyInput');
    const gqi = document.getElementById('groqKeyInput');
    if (gi) gi.value = localStorage.getItem('gemini_api_key') || '';
    if (oi) oi.value = localStorage.getItem('openai_api_key') || '';
    if (gqi) gqi.value = localStorage.getItem('groq_api_key') || '';
}

function updateAiProviderLabel() {
    const label = document.getElementById('aiProviderLabel');
    const dot = document.getElementById('aiStatusDot');
    const gk = localStorage.getItem('gemini_api_key');
    const ok = localStorage.getItem('openai_api_key');
    const gq = localStorage.getItem('groq_api_key');
    if (gk) { if(label) label.textContent = 'Gemini'; if(dot) dot.style.background = 'var(--success)'; }
    else if (gq) { if(label) label.textContent = 'Groq'; if(dot) dot.style.background = 'var(--success)'; }
    else if (ok) { if(label) label.textContent = 'OpenAI'; if(dot) dot.style.background = 'var(--success)'; }
    else { if(label) label.textContent = 'محلي'; if(dot) dot.style.background = 'var(--warning)'; }
}

function toggleAiSettings() {
    const panel = document.getElementById('aiSettingsPanel');
    panel.classList.toggle('hidden');
    if (!panel.classList.contains('hidden')) loadSavedKeys();
}

function clearAiChat() {
    aiConversationHistory = [];
    const box = document.getElementById('aiChatMessages');
    box.innerHTML = '';
    addAiBotMessage('يلا نبدأ من الأول! 😊 اسألني أو اطلب مني أي حاجة!');
    renderQuickPrompts();
}

// ============================================================
// إرسال الرسالة (مع Tool Calling)
// ============================================================
async function sendAiMessage() {
    if (aiIsProcessing) return;
    const input = document.getElementById('aiInput');
    const msg = input.value.trim();
    if (!msg) return;
    input.value = '';
    aiIsProcessing = true;

    addAiUserMessage(msg);
    aiConversationHistory.push({ role: 'user', content: msg });
    if (aiConversationHistory.length > AI_MAX_HISTORY) aiConversationHistory = aiConversationHistory.slice(-AI_MAX_HISTORY);

    addAiTypingIndicator();

    const groqKey = localStorage.getItem('groq_api_key');
    const geminiKey = localStorage.getItem('gemini_api_key');
    const openaiKey = localStorage.getItem('openai_api_key');

    let reply = null;
    let usedProvider = '';

    // Groq = primary (supports tool calling)
    if (groqKey && groqKey.length > 10) {
        console.log('🔑 Groq key exists, length:', groqKey.length);
        const result = await sendToGroqWithTools(msg, groqKey);
        if (result) { reply = result; usedProvider = 'Groq'; }
    } else {
        console.warn('⚠️ No Groq key found in localStorage');
    }
    // Fallback to Gemini (no tool calling, just text)
    if (!reply && geminiKey) {
        const r = await sendToGemini(msg, geminiKey);
        if (r && !r.startsWith('⚠️')) { reply = r; usedProvider = 'Gemini'; }
    }
    // Fallback to OpenAI (no tool calling, just text)
    if (!reply && openaiKey) {
        const r = await sendToOpenAI(msg, openaiKey);
        if (r && !r.startsWith('⚠️')) { reply = r; usedProvider = 'OpenAI'; }
    }
    // Local fallback
    if (!reply) {
        reply = generateLocalAiResponse(msg);
        usedProvider = 'محلي';
    }

    removeAiTyping();
    addAiBotMessage(reply, usedProvider);
    aiConversationHistory.push({ role: 'assistant', content: reply });
    if (aiConversationHistory.length > AI_MAX_HISTORY) aiConversationHistory = aiConversationHistory.slice(-AI_MAX_HISTORY);

    renderQuickPrompts();
    loadAllData();
    aiIsProcessing = false;
}

// ============================================================
// Groq مع Tool Calling Loop
// ============================================================
async function sendToGroqWithTools(msg, apiKey) {
    const models = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'meta-llama/llama-4-scout-17b-16e-instruct'];

    for (const model of models) {
        try {
            console.log('📤 Groq trying model:', model);

            let systemCtx = getAiSystemContext();
            if (systemCtx.length > 3000) systemCtx = systemCtx.substring(0, 3000);

            const messages = [{ role: 'system', content: systemCtx }];
            const recentHistory = aiConversationHistory.slice(-6);
            recentHistory.forEach(h => {
                let cleanText = h.content.replace(/<[^>]*>/g, '').replace(/\n{3,}/g, '\n\n').trim();
                if (!cleanText) return;
                if (cleanText.length > 500) cleanText = cleanText.substring(0, 500) + '...';
                messages.push({ role: h.role, content: cleanText });
            });
            messages.push({ role: 'user', content: msg });

            let rounds = 0;
            let finalReply = null;

            while (rounds < AI_MAX_TOOL_ROUNDS) {
                rounds++;
                console.log(`🔄 Groq ${model} round ${rounds}`);

                const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
                    body: JSON.stringify({
                        model: model,
                        messages,
                        tools: rounds === 1 ? AI_TOOLS : undefined,
                        tool_choice: rounds === 1 ? 'auto' : undefined,
                        max_tokens: 2048,
                        temperature: 0.5
                    })
                });

                if (!response.ok) {
                    const err = await response.json().catch(() => ({}));
                    const status = response.status;
                    const errMsg = err.error?.message || `HTTP ${status}`;
                    console.warn(`⚠️ Groq ${model} error ${status}:`, errMsg);

                    if (status === 429) {
                        console.warn(`⏳ Rate limited on ${model}, trying next model...`);
                        break;
                    }
                    return null;
                }

                const data = await response.json();
                const choice = data.choices?.[0];
                if (!choice) break;

                const assistantMsg = choice.message;
                messages.push(assistantMsg);

                if (!assistantMsg.tool_calls || assistantMsg.tool_calls.length === 0) {
                    finalReply = assistantMsg.content;
                    break;
                }

                for (const toolCall of assistantMsg.tool_calls) {
                    const fnName = toolCall.function.name;
                    let fnArgs = {};
                    try { fnArgs = JSON.parse(toolCall.function.arguments); } catch(e) {}

                    const toolResult = await executeAiTool(fnName, fnArgs);
                    let resultStr = JSON.stringify(toolResult);
                    if (resultStr.length > 2000) resultStr = resultStr.substring(0, 2000) + '...';

                    messages.push({ role: 'tool', tool_call_id: toolCall.id, content: resultStr });
                }
            }

            if (finalReply) return finalReply;

            for (let i = messages.length - 1; i >= 0; i--) {
                if (messages[i].role === 'assistant' && messages[i].content) return messages[i].content;
            }

        } catch(e) {
            console.error(`Groq ${model} error:`, e);
            continue;
        }
    }
    console.warn('⚠️ All Groq models failed');
    return null;
}

// ============================================================
// Gemini (بدون tool calling)
// ============================================================
async function sendToGemini(msg, apiKey) {
    const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
    const contents = [];
    aiConversationHistory.forEach(h => {
        const cleanText = h.content.replace(/<[^>]*>/g, '').replace(/\n{3,}/g, '\n\n').trim();
        if (!cleanText) return;
        contents.push({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: cleanText }] });
    });
    contents.push({ role: 'user', parts: [{ text: msg }] });

    const body = {
        contents,
        systemInstruction: { parts: [{ text: getAiSystemContext() }] },
        generationConfig: { maxOutputTokens: 2048, temperature: 0.7 }
    };

    for (const model of models) {
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
            });
            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                if (err.error?.message?.includes('not found')) continue;
                return `⚠️ Gemini: ${err.error?.message || response.status}`;
            }
            const data = await response.json();
            return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
        } catch(e) { continue; }
    }
    return null;
}

// ============================================================
// OpenAI (بدون tool calling)
// ============================================================
async function sendToOpenAI(msg, apiKey) {
    try {
        const messages = [{ role: 'system', content: getAiSystemContext() }];
        aiConversationHistory.forEach(h => {
            const cleanText = h.content.replace(/<[^>]*>/g, '').replace(/\n{3,}/g, '\n\n').trim();
            if (!cleanText) return;
            messages.push({ role: h.role, content: cleanText });
        });
        messages.push({ role: 'user', content: msg });
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
            body: JSON.stringify({ model: 'gpt-4o-mini', messages, max_tokens: 2048, temperature: 0.7 })
        });
        if (!response.ok) return null;
        const data = await response.json();
        return data.choices?.[0]?.message?.content || null;
    } catch(e) { return null; }
}

// ============================================================
// Local Fallback
// ============================================================
function generateLocalAiResponse(msg) {
    const lower = msg.toLowerCase();
    const todaySales = allInvoices.filter(i => new Date(i.created_at).toDateString() === new Date().toDateString());
    const totalSalesToday = todaySales.reduce((s, i) => s + parseFloat(i.final_amount || i.total_amount || 0), 0);
    const totalProfitToday = todaySales.reduce((s, i) => s + parseFloat((i.final_amount || i.total_amount || 0) - (i.cost_total || 0)), 0);
    const totalProducts = localProducts.length;
    const outOfStock = localProducts.filter(p => p.stock <= 0);
    const lowStock = localProducts.filter(p => p.stock > 0 && p.stock <= lowStockThreshold);

    if (lower.includes('ضيف') || lower.includes('اضيف') || lower.includes('إضافة') || lower.includes('add')) {
        return `📦 <b>إضافة منتج</b><br><br>عشان أضيفلك منتج، اكتبلي:<br>• "ضيف [اسم المنتج] بسعر [السعر]<br>• مثال: "ضيف سماعة بلوتوث بسعر 250"<br><br>أو ممكن أضيف أكتر من منتج مرة واحدة!`;
    }

    if (lower.includes('مبيعات') || lower.includes('ملخص') || lower.includes('اليوم')) {
        let r = `📊 <b>ملخص اليوم</b><br><br>`;
        r += `📄 الفواتير: <b>${todaySales.length}</b><br>`;
        r += `💰 المبيعات: <b>${totalSalesToday.toFixed(2)} ج.م</b><br>`;
        r += `💵 الأرباح: <b>${totalProfitToday.toFixed(2)} ج.م</b><br>`;
        return r;
    }

    if (lower.includes('مخزون') || lower.includes('نفدت') || lower.includes('ناقص')) {
        let r = `📦 <b>المخزون</b><br><br>المنتجات: ${totalProducts} | قليل: ${lowStock.length} | نفد: ${outOfStock.length}`;
        if (outOfStock.length > 0) r += `<br><br>🚫 نفدت: ${outOfStock.slice(0,5).map(p => p.title || p.product_name).join(', ')}`;
        return r;
    }

    if (lower.includes('مرحبا') || lower.includes('ازيك') || lower.includes('اهلا') || lower.includes('hi') || lower.includes('hello')) {
        return `أهلاً يا صاحبي! 😊 أنا تاجر، مساعدك الذكي. عندك ${totalProducts} منتج و ${todaySales.length} فاتورة النهارده. اسألني أو اطلب مني أي حاجة!`;
    }

    return `معلش يا صاحبي، مش فاهم قصدك 😅<br><br>ممكن أساعدك في:<br>• 📦 "ضيف منتج [اسم] بسعر [سعر]"<br>• 🏆 "دور على منافسين في [المنطقة]"<br>• 📍 "دور على محلات [النشاط] في [المنطقة] على الخريطة"<br>• 💲 "إيه أحسن سعر لـ [المنتج]؟"<br>• 📊 "ملخص مبيعات"<br>• 🔍 "دور على [حاجة]"<br>• 👥 "ضيف عميل [اسم]"<br>• 💰 "سجّل مصروف [مبلغ]"<br><br>جرّب تكتبلي أي حاجة وأنا هنفذهالك! 💪`;
}
