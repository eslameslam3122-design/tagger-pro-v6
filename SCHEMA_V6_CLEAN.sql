-- ============================================================
-- TAGGER PRO V6 — SQL Schema النظيف
-- شغّل كل ده دفعة واحدة في Supabase SQL Editor
-- ============================================================

-- ===== 1. المتاجر =====
CREATE TABLE IF NOT EXISTS stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_name TEXT NOT NULL DEFAULT 'المحل',
    store_owner TEXT,
    owner_id UUID,
    branch_code TEXT,
    phone TEXT,
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===== 1.5. الأقسام =====
CREATE TABLE IF NOT EXISTS categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID NOT NULL,
    name TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(store_id, name)
);

ALTER TABLE categories DISABLE ROW LEVEL SECURITY;

-- ===== 2. المستخدمين =====
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    full_name TEXT NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'cashier',
    is_active BOOLEAN DEFAULT true,
    is_super_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_store_username') THEN
        ALTER TABLE users ADD CONSTRAINT unique_store_username UNIQUE (store_id, username);
    END IF;
END $$;

-- ===== 3. المنتجات =====
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL DEFAULT '',
    title TEXT,
    barcode TEXT,
    category TEXT,
    purchase_price DECIMAL(10,2) DEFAULT 0,
    sell_price DECIMAL(10,2) DEFAULT 0,
    price DECIMAL(10,2),
    stock INTEGER DEFAULT 0,
    image TEXT,
    image_url TEXT,
    supplier_id UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===== 4. العملاء =====
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    notes TEXT,
    total_debt DECIMAL(10,2) DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0,
    loyalty_points INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===== 5. الفواتير =====
CREATE SEQUENCE IF NOT EXISTS invoice_num_seq;
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
BEGIN
    RETURN 'INV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('invoice_num_seq')::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    invoice_number TEXT UNIQUE DEFAULT generate_invoice_number(),
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    total_amount DECIMAL(10,2) DEFAULT 0,
    discount DECIMAL(10,2) DEFAULT 0,
    vat_amount DECIMAL(10,2) DEFAULT 0,
    vat_rate DECIMAL(10,2) DEFAULT 0,
    final_amount DECIMAL(10,2) DEFAULT 0,
    cost_total DECIMAL(10,2) DEFAULT 0,
    paid_amount DECIMAL(10,2) DEFAULT 0,
    remaining_amount DECIMAL(10,2) DEFAULT 0,
    payment_type TEXT,
    staff_name TEXT,
    warranty TEXT,
    warranty_notes TEXT,
    shift_id UUID,
    date TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===== 6. بنود الفاتورة =====
CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name TEXT,
    name TEXT,
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10,2),
    price DECIMAL(10,2),
    sell_price DECIMAL(10,2),
    purchase_price DECIMAL(10,2),
    total DECIMAL(10,2)
);

-- ===== 7. الموردين =====
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    notes TEXT,
    total_purchases DECIMAL(10,2) DEFAULT 0,
    debt DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===== 8. معاملات الموردين =====
CREATE TABLE IF NOT EXISTS supplier_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE,
    supplier_name TEXT,
    type TEXT,
    product TEXT,
    qty INTEGER,
    unit_price DECIMAL(10,2) DEFAULT 0,
    amount DECIMAL(10,2),
    reason TEXT,
    notes TEXT,
    transaction_date TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ===== 9. الصيانة =====
CREATE TABLE IF NOT EXISTS maintenance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    ticket_number TEXT UNIQUE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    phone TEXT,
    device_model TEXT NOT NULL,
    serial TEXT,
    fault TEXT NOT NULL,
    cost DECIMAL(10,2) DEFAULT 0,
    deposit DECIMAL(10,2) DEFAULT 0,
    tech TEXT,
    pass TEXT,
    parts TEXT,
    status TEXT DEFAULT 'قيد الانتظار',
    date TIMESTAMPTZ DEFAULT now(),
    maintenance_date TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===== 10. الورديات =====
CREATE TABLE IF NOT EXISTS shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    supervisor TEXT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL DEFAULT now(),
    end_time TIMESTAMPTZ,
    status TEXT DEFAULT 'active',
    sales DECIMAL(10,2) DEFAULT 0,
    expenses DECIMAL(10,2) DEFAULT 0,
    net DECIMAL(10,2) DEFAULT 0,
    invoice_count INTEGER DEFAULT 0,
    revenue DECIMAL(10,2) DEFAULT 0,
    cash_ops_count INTEGER DEFAULT 0,
    cash_fees DECIMAL(10,2) DEFAULT 0,
    cash_profit DECIMAL(10,2) DEFAULT 0,
    cash_in DECIMAL(10,2) DEFAULT 0,
    cash_out DECIMAL(10,2) DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===== 11. المعاملات المالية =====
CREATE TABLE IF NOT EXISTS finance_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT '',
    type TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    description TEXT,
    note TEXT,
    created_by TEXT,
    category TEXT,
    shift_id UUID,
    date TIMESTAMPTZ DEFAULT now(),
    transaction_date TIMESTAMPTZ DEFAULT now()
);

-- ===== 12. المحافظ الإلكترونية =====
CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    balance DECIMAL(12,2) DEFAULT 0,
    daily_limit DECIMAL(12,2) DEFAULT 0,
    monthly_limit DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===== 13. عمليات الكاش =====
CREATE TABLE IF NOT EXISTS cash_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    wallet_id UUID REFERENCES wallets(id) ON DELETE SET NULL,
    transaction_type TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    client_phone TEXT,
    fee DECIMAL(10,2) DEFAULT 0,
    profit DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    shift_id UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===== 14. الأقساط =====
CREATE TABLE IF NOT EXISTS installments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    customer_name TEXT DEFAULT '',
    customer_phone TEXT DEFAULT '',
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    invoice_number TEXT DEFAULT '',
    total_amount DECIMAL(10,2) DEFAULT 0,
    paid_amount DECIMAL(10,2) DEFAULT 0,
    months INTEGER DEFAULT 12,
    monthly_payment DECIMAL(10,2) DEFAULT 0,
    start_date DATE,
    next_due_date DATE,
    last_payment_date DATE,
    interest_rate DECIMAL(5,2) DEFAULT 0,
    interest_amount DECIMAL(10,2) DEFAULT 0,
    final_amount DECIMAL(10,2) DEFAULT 0,
    remaining_amount DECIMAL(10,2) DEFAULT 0,
    status TEXT DEFAULT 'active',
    overdue_count INTEGER DEFAULT 0,
    penalty DECIMAL(10,2) DEFAULT 0,
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===== 15. جدول سداد الأقساط =====
CREATE TABLE IF NOT EXISTS installment_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    installment_id UUID REFERENCES installments(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    month_number INTEGER NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    due_date DATE NOT NULL,
    paid_date DATE,
    paid_amount DECIMAL(10,2) DEFAULT 0,
    status TEXT DEFAULT 'pending',
    penalty DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ===== 16. إعدادات الذكاء الاصطناعي =====
CREATE TABLE IF NOT EXISTS ai_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    gemini_key TEXT,
    openai_key TEXT,
    groq_key TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===== 17. بنود البيع السريع =====
CREATE TABLE IF NOT EXISTS quick_sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price DECIMAL(10,2) DEFAULT 0,
    color TEXT DEFAULT '#22c55e',
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ===== 18. ملفات الموظفين =====
CREATE TABLE IF NOT EXISTS staff_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    password TEXT NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'cashier',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_staff_store_username') THEN
        ALTER TABLE staff_profiles ADD CONSTRAINT unique_staff_store_username UNIQUE (store_id, username);
    END IF;
END $$;

-- ============================================================
-- TRIGGER: تحديث updated_at تلقائيًا عند أي UPDATE
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ DECLARE
    t TEXT;
BEGIN
    FOR t IN
        SELECT unnest(ARRAY[
            'stores', 'users', 'products', 'customers', 'invoices',
            'suppliers', 'maintenance', 'shifts', 'wallets',
            'cash_transactions', 'installments', 'staff_profiles'
        ])
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_' || t
        ) THEN
            EXECUTE format(
                'CREATE TRIGGER trigger_update_%I BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
                t, t
            );
        END IF;
    END LOOP;
END $$;

-- ============================================================
-- تعطيل RLS على كل الجداول
-- ============================================================
ALTER TABLE stores DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers DISABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance DISABLE ROW LEVEL SECURITY;
ALTER TABLE shifts DISABLE ROW LEVEL SECURITY;
ALTER TABLE finance_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE wallets DISABLE ROW LEVEL SECURITY;
ALTER TABLE cash_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE installments DISABLE ROW LEVEL SECURITY;
ALTER TABLE installment_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE ai_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE quick_sale_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE staff_profiles DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- تحديث العقود القديمة (لو فيه بيانات موجودة)
-- ============================================================
UPDATE installments
SET final_amount = COALESCE(NULLIF(final_amount, 0), total_amount),
    remaining_amount = COALESCE(NULLIF(remaining_amount, 0), total_amount - COALESCE(paid_amount, 0))
WHERE final_amount = 0 OR final_amount IS NULL;

-- ============================================================
-- reload schema cache
-- ============================================================
SELECT pg_notify('pgrst', 'reload schema');

-- ============================================================
-- التحقق النهائي
-- ============================================================
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;
