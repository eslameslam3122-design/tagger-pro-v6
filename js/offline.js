// ============================================================
// TAGGER PRO V6 — Offline-First Layer
// IndexedDB + Sync Queue + Realtime + Connection Manager
// ============================================================

// تأكد من تحميل Dexie.js قبل هذا الملف
// <script src="https://unpkg.com/dexie@3/dist/dexie.js"></script>

// ============================================================
// 1. قاعدة البيانات المحلية (Dexie/IndexedDB)
// ============================================================

const localDB = new Dexie('TaggerProDB');

localDB.version(1).stores({
    products:          'id, store_id, barcode, category',
    customers:         'id, store_id, phone',
    invoices:          'id, store_id, created_at, customer_id',
    invoice_items:     'id, invoice_id, product_id',
    cash_transactions: 'id, store_id, wallet_id, created_at',
    maintenance:       'id, store_id, status, created_at',
    suppliers:         'id, store_id',
    supplier_transactions: 'id, store_id, supplier_id',
    shifts:            'id, store_id, start_time',
    wallets:           'id, store_id',
    users:             'id, store_id, username',
    settings:          'key',
    sync_queue:        '++qid, table, op, record_id, created_at'
});

localDB.version(2).stores({
    syncMeta:              'key',
    installments:          'id, store_id, customer_id, status',
    installment_payments:  'id, installment_id, store_id, status',
    quick_sale_items:      'id, store_id',
    finance_transactions:  'id, store_id, category'
});

// ============================================================
// 2. LocalDB — واجهة القراءة والكتابة المحلية
// ============================================================

class LocalDB {

    // ---- حفظ مجموعة كاملة (bulk put) ----
    static async bulkPut(table, records) {
        if (!records || records.length === 0) return;
        try {
            await localDB[table].bulkPut(records);
        } catch (e) {
            console.warn(`bulkPut error on ${table}:`, e);
        }
    }

    // ---- جلب كل سجلات جدول ----
    static async getAll(table) {
        try {
            return await localDB[table].toArray();
        } catch (e) {
            console.warn(`getAll error on ${table}:`, e);
            return [];
        }
    }

    // ---- جلب سجل واحد بالـ ID ----
    static async getById(table, id) {
        try {
            return await localDB[table].get(id);
        } catch (e) {
            return null;
        }
    }

    // ---- حفظ سجل واحد ----
    static async put(table, record) {
        try {
            await localDB[table].put(record);
        } catch (e) {
            console.warn(`put error on ${table}:`, e);
        }
    }

    // ---- حذف سجل ----
    static async delete(table, id) {
        try {
            await localDB[table].delete(id);
        } catch (e) {
            console.warn(`delete error on ${table}:`, e);
        }
    }

    // ---- مسح كل جدول ----
    static async clear(table) {
        try {
            await localDB[table].clear();
        } catch (e) {
            console.warn(`clear error on ${table}:`, e);
        }
    }

    // ---- حفظ إعدادات (key-value) ----
    static async setSetting(key, value) {
        await localDB.settings.put({ key, value });
    }

    static async getSetting(key) {
        const row = await localDB.settings.get(key);
        return row ? row.value : null;
    }
}

// ============================================================
// 2b. SmartLoader — Offline-First Data Loading
// ============================================================

const SYNC_TABLES = {
    products:              { storeFilter: true,  timeCol: 'updated_at' },
    customers:             { storeFilter: true,  timeCol: 'created_at' },
    invoices:              { storeFilter: true,  timeCol: 'created_at' },
    invoice_items:         { storeFilter: false, timeCol: null },
    cash_transactions:     { storeFilter: true,  timeCol: 'created_at' },
    maintenance:           { storeFilter: true,  timeCol: 'created_at' },
    suppliers:             { storeFilter: true,  timeCol: 'created_at' },
    supplier_transactions: { storeFilter: true,  timeCol: null },
    shifts:                { storeFilter: true,  timeCol: 'start_time' },
    wallets:               { storeFilter: true,  timeCol: 'created_at' },
    users:                 { storeFilter: true,  timeCol: 'created_at' },
    finance_transactions:  { storeFilter: true,  timeCol: 'created_at' },
    installments:          { storeFilter: true,  timeCol: 'created_at' },
    installment_payments:  { storeFilter: true,  timeCol: 'created_at' },
    quick_sale_items:      { storeFilter: true,  timeCol: null }
};

class SmartLoader {
    static _syncing = false;

    static async getLastSyncTime(table) {
        const row = await localDB.syncMeta.get(table);
        return row ? row.ts : 0;
    }

    static async setLastSyncTime(table, ts) {
        await localDB.syncMeta.put({ key: table, ts });
    }

    static async shouldUseLocal(table, storeId) {
        const count = await localDB[table].where('store_id').equals(storeId).count().catch(() => 0);
        return count > 0;
    }

    static async getLocalData(table) {
        try {
            return await localDB[table].toArray();
        } catch (e) {
            return [];
        }
    }

    static async syncTable(table, storeId, forceFull = false) {
        const cfg = SYNC_TABLES[table];
        if (!cfg) return [];

        const PAGE_SIZE = 500;
        let allData = [];
        let offset = 0;
        let hasMore = true;

        try {
            while (hasMore) {
                let query = sb.from(table).select('*');

                if (cfg.storeFilter) {
                    query = query.eq('store_id', storeId);
                }

                if (!forceFull && cfg.timeCol && offset === 0) {
                    const lastSync = await SmartLoader.getLastSyncTime(table + '_' + storeId);
                    if (lastSync > 0) {
                        const since = new Date(lastSync).toISOString();
                        query = query.gte(cfg.timeCol, since);
                    }
                }

                query = query.range(offset, offset + PAGE_SIZE - 1);
                const { data, error } = await query;

                if (error) {
                    console.error(`Supabase error on ${table}:`, error.message);
                    return allData;
                }

                if (!data || data.length === 0) { hasMore = false; break; }

                allData = allData.concat(data);
                if (data.length < PAGE_SIZE) { hasMore = false; }
                offset += PAGE_SIZE;
            }

            if (allData.length === 0) {
                console.log(`[SmartLoader] ${table}: 0 records`);
                return [];
            }

            console.log(`[SmartLoader] ${table}: ${allData.length} records synced`);
            await LocalDB.bulkPut(table, allData);
            await SmartLoader.setLastSyncTime(table + '_' + storeId, Date.now());

            return allData;
        } catch (e) {
            console.warn(`SmartLoader sync failed for ${table}:`, e.message);
            return allData;
        }
    }

    static async load(table, storeId, renderFn) {
        const hasLocal = await SmartLoader.shouldUseLocal(table, storeId);

        if (hasLocal) {
            const local = await SmartLoader.getLocalData(table);
            if (renderFn) renderFn(local);
        }

        if (SyncManager.isOnline) {
            SmartLoader.syncTable(table, storeId).then(synced => {
                if (synced.length > 0 && renderFn) {
                    SmartLoader.getLocalData(table).then(full => renderFn(full));
                }
            });
        }
    }

    static async fullPull(storeId) {
        const tables = Object.keys(SYNC_TABLES);
        const results = {};

        await Promise.allSettled(
            tables.map(async table => {
                const data = await SmartLoader.syncTable(table, storeId, false);
                results[table] = data;
            })
        );

        await SmartLoader.setLastSyncTime('fullPull_' + storeId, Date.now());
        return results;
    }

    static async pushLocalProducts(storeId) {
        try {
            const local = await localDB.products.where('store_id').equals(storeId).toArray();
            if (local.length === 0) {
                console.log('[PushLocal] No local products to push');
                return { pushed: 0, errors: 0 };
            }

            const remoteCheck = await sb.from('products').select('id').eq('store_id', storeId).limit(1);
            if (remoteCheck.data && remoteCheck.data.length > 0) {
                console.log('[PushLocal] Products already exist in Supabase, skipping push');
                return { pushed: 0, skipped: true };
            }

            let pushed = 0, errors = 0;
            for (const prod of local) {
                try {
                    const cleanProd = {
                        id: prod.id,
                        name: prod.name,
                        barcode: prod.barcode || '',
                        sell_price: prod.sell_price || 0,
                        buy_price: prod.buy_price || 0,
                        stock: prod.stock || 0,
                        category: prod.category || '',
                        image_url: prod.image_url || '',
                        unit: prod.unit || '',
                        min_stock: prod.min_stock || 0,
                        store_id: storeId,
                        created_at: prod.created_at || new Date().toISOString()
                    };
                    const { error } = await sb.from('products').upsert(cleanProd, { onConflict: 'id' });
                    if (error) {
                        console.warn(`[PushLocal] Failed: ${prod.name}`, error.message);
                        errors++;
                    } else {
                        pushed++;
                    }
                } catch(e) { errors++; }
            }
            console.log(`[PushLocal] Done: ${pushed} pushed, ${errors} errors`);
            return { pushed, errors };
        } catch(e) {
            console.error('[PushLocal] Error:', e.message);
            return { pushed: 0, errors: 1 };
        }
    }
}

// ============================================================
// 3. SyncManager — إدارة المزامنة مع Supabase
// ============================================================

class SyncManager {
    static isOnline = navigator.onLine;
    static isSyncing = false;
    static listeners = [];

    // ---- بدء المراقبة ----
    static start() {
        window.addEventListener('online', () => {
            SyncManager.isOnline = true;
            SyncManager.notify();
            SyncManager.syncPending();
            SyncManager.pullRecent(typeof currentStoreId !== 'undefined' ? currentStoreId : null);
            RealtimeSync.start(typeof currentStoreId !== 'undefined' ? currentStoreId : null);
        });
        window.addEventListener('offline', () => {
            SyncManager.isOnline = false;
            SyncManager.notify();
        });
        if (SyncManager.isOnline) {
            setTimeout(() => SyncManager.syncPending(), 3000);
        }
    }

    // ---- تسجيل listener لتغيير حالة الاتصال ----
    static onStatusChange(fn) {
        SyncManager.listeners.push(fn);
    }

    static notify() {
        SyncManager.listeners.forEach(fn => fn(SyncManager.isOnline));
    }

    // ---- إضافة عملية للقائمة المعلقة ----
    static async enqueue(table, op, record) {
        await localDB.sync_queue.add({
            table,
            op,
            record,
            record_id: record.id || null,
            retry_count: 0,
            created_at: Date.now()
        });
    }

    static async enqueueBulk(table, op, records) {
        for (const record of (Array.isArray(records) ? records : [records])) {
            await SyncManager.enqueue(table, op, record);
        }
    }

    // ---- رفع العمليات المعلقة بالدفعات ----
    static async syncPending() {
        if (SyncManager.isSyncing || !SyncManager.isOnline) return;
        SyncManager.isSyncing = true;

        const BATCH_SIZE = 20;
        const MAX_RETRIES = 3;

        try {
            const pending = await localDB.sync_queue.orderBy('qid').toArray();
            if (pending.length === 0) { SyncManager.isSyncing = false; return; }

            let synced = 0;
            let failed = 0;

            for (let i = 0; i < pending.length; i += BATCH_SIZE) {
                const batch = pending.slice(i, i + BATCH_SIZE);
                const results = await Promise.allSettled(batch.map(item => SyncManager._processItem(item)));

                for (let j = 0; j < batch.length; j++) {
                    const item = batch[j];
                    if (results[j].status === 'fulfilled') {
                        await localDB.sync_queue.delete(item.qid);
                        synced++;
                    } else {
                        const retries = (item.retry_count || 0) + 1;
                        if (retries >= MAX_RETRIES) {
                            console.error(`❌ Giving up on ${item.table}/${item.op} after ${MAX_RETRIES} retries`);
                            await localDB.sync_queue.delete(item.qid);
                            failed++;
                        } else {
                            await localDB.sync_queue.update(item.qid, { retry_count: retries });
                            failed++;
                        }
                    }
                }
            }

            if (synced > 0) console.log(`✅ Synced ${synced} pending operations`);
            if (failed > 0) console.warn(`⚠️ ${failed} operations failed/will retry`);
            const remaining = await localDB.sync_queue.count();
            if (remaining > 0) console.warn(`⚠️ ${remaining} operations still pending`);
        } catch (e) {
            console.error('Sync error:', e);
        }

        SyncManager.isSyncing = false;
    }

    static async _processItem(item) {
        if (item.op === 'delete' && item.record_id) {
            if (!String(item.record_id).startsWith('offline_')) {
                const { error } = await sb.from(item.table).delete().eq('id', item.record_id);
                if (error) throw error;
            }
        } else if (item.op === 'put' && item.record) {
            if (item.table === 'categories' && item.record.categories) {
                const { store_id, categories } = item.record;
                await sb.from('categories').delete().eq('store_id', store_id);
                if (categories.length > 0) {
                    const rows = categories.map((name, i) => ({ store_id, name, sort_order: i }));
                    const { error } = await sb.from('categories').insert(rows);
                    if (error) throw error;
                }
                return;
            }
            const isOfflineId = String(item.record.id || '').startsWith('offline_');
            if (isOfflineId) {
                const { id, ...rest } = item.record;
                const { data: inserted, error } = await sb.from(item.table).insert(rest).select().single();
                if (error) throw error;
                if (inserted && inserted.id) {
                    await LocalDB.put(item.table, { ...rest, id: inserted.id });
                    if (item.table === 'products') {
                        const idx = localProducts.findIndex(p => p.id === item.record.id);
                        if (idx >= 0) { localProducts[idx].id = inserted.id; }
                    }
                }
            } else {
                const { id, ...rest } = item.record;
                const { error } = await sb.from(item.table).upsert({ id, ...rest }, { onConflict: 'id' });
                if (error) throw error;
            }
        }
    }

    // ---- سحب البيانات الأخيرة (آخر 5 دقائق) ----
    static async pullRecent(storeId) {
        if (!SyncManager.isOnline || !storeId) return [];

        const recentTables = ['products', 'customers', 'invoices', 'cash_transactions', 'installments', 'installment_payments'];
        const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        const changed = [];

        for (const table of recentTables) {
            try {
                const cfg = SYNC_TABLES[table];
                let query = sb.from(table).select('*');
                if (cfg.storeFilter) query = query.eq('store_id', storeId);
                if (cfg.timeCol) query = query.gte(cfg.timeCol, fiveMinAgo);
                const { data } = await query;
                if (data && data.length > 0) {
                    await LocalDB.bulkPut(table, data);
                    changed.push(table);
                }
            } catch (e) {
                console.warn(`pullRecent failed for ${table}:`, e.message);
            }
        }

        return changed;
    }

    // ---- مزامنة كاملة من Supabase (download) ----
    static async pullAll(storeId) {
        if (!SyncManager.isOnline) return;

        const tables = [
            'products', 'customers', 'invoices', 'invoice_items',
            'cash_transactions', 'maintenance', 'suppliers',
            'supplier_transactions', 'shifts', 'wallets', 'users',
            'finance_transactions', 'installments',
            'installment_payments', 'quick_sale_items'
        ];

        for (const table of tables) {
            try {
                let query = sb.from(table).select('*');
                if (table !== 'invoice_items') {
                    query = query.eq('store_id', storeId);
                }
                const { data, error } = await query;
                if (!error && data) {
                    await LocalDB.bulkPut(table, data);
                }
            } catch (e) {
                console.warn(`Pull failed for ${table}:`, e);
            }
        }

        await LocalDB.setSetting('lastSync_' + storeId, Date.now());
    }

    // ---- عدد العمليات المعلقة ----
    static async pendingCount() {
        return await localDB.sync_queue.count();
    }
}

// ============================================================
// 3b. RealtimeSync — مزامنة فورية بين الأجهزة عبر Supabase Realtime
// ============================================================

class RealtimeSync {
    static channels = [];
    static onDataChange = null;

    static start(storeId) {
        if (!storeId || !SyncManager.isOnline) return;
        RealtimeSync.stop();

        const tables = [
            'products', 'customers', 'invoices', 'cash_transactions',
            'maintenance', 'finance_transactions', 'installments',
            'installment_payments', 'shifts', 'wallets',
            'suppliers', 'supplier_transactions'
        ];

        tables.forEach(table => {
            try {
                const ch = sb.channel(`realtime-${table}-${storeId}`)
                    .on('postgres_changes', {
                        event: '*',
                        schema: 'public',
                        table: table
                    }, async (payload) => {
                        await RealtimeSync.handleChange(table, payload, storeId);
                    })
                    .subscribe((status) => {
                        if (status === 'SUBSCRIBED') {
                            console.log(`🟢 Realtime connected: ${table}`);
                        }
                    });
                RealtimeSync.channels.push(ch);
            } catch (e) {
                console.warn(`Realtime subscribe failed for ${table}:`, e.message);
            }
        });
    }

    static async handleChange(table, payload, storeId) {
        try {
            if (payload.eventType === 'DELETE') {
                const oldId = payload.old?.id;
                if (oldId) await LocalDB.delete(table, oldId);
            } else {
                const record = payload.new;
                if (!record) return;
                if (record.store_id && record.store_id !== storeId) return;
                await LocalDB.put(table, record);
            }

            if (RealtimeSync.onDataChange) {
                RealtimeSync.onDataChange(table, payload);
            }
        } catch (e) {
            console.warn(`Realtime handleChange error for ${table}:`, e.message);
        }
    }

    static stop() {
        RealtimeSync.channels.forEach(ch => {
            try { sb.removeChannel(ch); } catch (e) {}
        });
        RealtimeSync.channels = [];
    }
}

// ============================================================
// 4. ConnectionIndicator — شريط حالة الاتصال
// ============================================================

class ConnectionIndicator {
    static el = null;

    static init() {
        const bar = document.createElement('div');
        bar.id = 'connectionBar';
        bar.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; z-index: 99999;
            text-align: center; padding: 4px; font-size: 11px; font-weight: bold;
            transition: all 0.3s ease; display: none;
        `;
        document.body.appendChild(bar);
        ConnectionIndicator.el = bar;

        SyncManager.onStatusChange((online) => {
            ConnectionIndicator.update(online);
        });

        ConnectionIndicator.update(SyncManager.isOnline);
    }

    static update(online) {
        const el = ConnectionIndicator.el;
        if (!el) return;

        if (online) {
            el.style.background = 'linear-gradient(90deg, #059669, #10b981)';
            el.style.color = '#fff';
            el.innerHTML = '<i class="fa-solid fa-wifi"></i> متصل بالإنترنت — البيانات بتتمزامن تلقائياً';
            el.style.display = 'block';
            setTimeout(() => { el.style.display = 'none'; }, 3000);
        } else {
            el.style.background = 'linear-gradient(90deg, #dc2626, #ef4444)';
            el.style.color = '#fff';
            el.innerHTML = '<i class="fa-solid fa-wifi-slash"></i> غير متصل — البيانات محفوظة محلياً وهتتمزامن لما النت يرجع';
            el.style.display = 'block';
        }
    }

    static async showPending() {
        const count = await SyncManager.pendingCount();
        if (count > 0 && SyncManager.isOnline) {
            const el = ConnectionIndicator.el;
            if (el) {
                el.style.background = 'linear-gradient(90deg, #d97706, #f59e0b)';
                el.style.color = '#fff';
                el.innerHTML = `<i class="fa-solid fa-sync fa-spin"></i> جاري مزامنة ${count} عملية معلقة...`;
                el.style.display = 'block';
            }
        }
    }
}
