-- ============================================================
-- إضافة updated_at للجداول الموجودة
-- شغّل ده في Supabase SQL Editor بعد الـ Schema الأساسي
-- ============================================================

-- إضافة updated_at لكل الجداول اللي محتاجينها
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
            SELECT 1 FROM information_schema.columns
            WHERE table_name = t AND column_name = 'updated_at'
        ) THEN
            EXECUTE format(
                'ALTER TABLE %I ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now()',
                t
            );
            EXECUTE format(
                'UPDATE %I SET updated_at = created_at WHERE updated_at IS NULL',
                t
            );
            RAISE NOTICE 'Added updated_at to %', t;
        ELSE
            RAISE NOTICE '% already has updated_at', t;
        END IF;
    END LOOP;
END $$;

-- تأكد من وجود الـ triggers
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
            RAISE NOTICE 'Created trigger for %', t;
        END IF;
    END LOOP;
END $$;

-- reload schema
SELECT pg_notify('pgrst', 'reload schema');
