-- ===== تطوير نظام الأقساط =====
-- شغّل ده في Supabase SQL Editor

-- 1. إضافة أعمدة جديدة لجدول installments
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'installments' AND column_name = 'interest_rate'
    ) THEN
        ALTER TABLE installments
            ADD COLUMN interest_rate DECIMAL(5,2) DEFAULT 0,
            ADD COLUMN interest_amount DECIMAL(10,2) DEFAULT 0,
            ADD COLUMN final_amount DECIMAL(10,2) DEFAULT 0,
            ADD COLUMN remaining_amount DECIMAL(10,2) DEFAULT 0,
            ADD COLUMN next_due_date DATE,
            ADD COLUMN last_payment_date DATE,
            ADD COLUMN overdue_count INTEGER DEFAULT 0,
            ADD COLUMN penalty DECIMAL(10,2) DEFAULT 0;
    END IF;
END $$;

-- 2. تحديث final_amount و remaining_amount للعقود القديمة
UPDATE installments
SET final_amount = total_amount,
    remaining_amount = total_amount - COALESCE(paid_amount, 0)
WHERE final_amount = 0 OR final_amount IS NULL;

-- 3. إنشاء جدول سداد الأقساط
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

ALTER TABLE installment_payments DISABLE ROW LEVEL SECURITY;

-- 4. تعطيل RLS على installment_payments
ALTER TABLE installment_payments DISABLE ROW LEVEL SECURITY;
