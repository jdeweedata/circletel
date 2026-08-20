-- OP19627 Uncapped 20 Mbps (CC-OP-UNC-20) was active but had a null
-- product_category, so /api/coverage/packages dropped it on the mapped path
-- after a coverage check. It is an LTE SKU and must appear on the LTE tab
-- (and the 5G deals grid, which already fetches it by SKU).

UPDATE public.service_packages
SET product_category = 'lte'
WHERE sku = 'CC-OP-UNC-20'
  AND (product_category IS NULL OR product_category <> 'lte');
