-- SQL script to check packages in the database
-- Usage: mysql -u your_user -p your_database < scripts/check-packages.sql

-- List all packages
SELECT 
    id,
    uuid,
    name,
    description,
    priceMonthly,
    priceYearly,
    isActive,
    supportLevel,
    JSON_PRETTY(features) as features,
    createdAt
FROM packages
WHERE isActive = 1
ORDER BY priceMonthly ASC;

-- Count packages
SELECT 
    COUNT(*) as total_packages,
    COUNT(CASE WHEN isActive = 1 THEN 1 END) as active_packages,
    COUNT(CASE WHEN name LIKE '%premium%' OR name LIKE '%Premium%' THEN 1 END) as premium_packages,
    COUNT(CASE WHEN name LIKE '%enterprise%' OR name LIKE '%Enterprise%' THEN 1 END) as enterprise_packages
FROM packages;

-- Show package details with feature summary
SELECT 
    id,
    name,
    priceMonthly,
    priceYearly,
    JSON_EXTRACT(features, '$.modules_enabled') as modules,
    JSON_EXTRACT(features, '$.max_students') as max_students,
    JSON_EXTRACT(features, '$.max_teachers') as max_teachers,
    JSON_EXTRACT(features, '$.max_storage_gb') as max_storage_gb
FROM packages
WHERE isActive = 1
ORDER BY priceMonthly DESC;

