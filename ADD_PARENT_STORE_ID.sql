ALTER TABLE stores ADD COLUMN IF NOT EXISTS parent_store_id UUID REFERENCES stores(id);
CREATE INDEX IF NOT EXISTS idx_stores_parent ON stores(parent_store_id);

-- المتجر الأصلي يبقى parent_store_id = null (مستقل)
-- الفروع الحقيقية يبقى parent_store_id = المتجر الأصلي
