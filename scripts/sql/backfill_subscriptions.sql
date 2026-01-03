-- Seed default packages and create starter subscriptions for existing schools
-- Run AFTER the migration has created packages and school_subscriptions tables.

USE school;

START TRANSACTION;

-- 1. Seed packages if none exist
INSERT INTO packages (uuid, name, description, priceMonthly, priceYearly, isActive, features, supportLevel, createdBy)
SELECT * FROM (
  SELECT UUID(), 'Starter', 'Entry plan for small schools', 99.00, 999.00, 1,
   JSON_OBJECT(
     'max_schools', 1,
     'max_branches_per_school', 1,
     'max_students', 500,
     'max_teachers', 50,
     'max_staff', 25,
     'max_storage_gb', 20,
     'modules_enabled', JSON_ARRAY('attendance','grades','finance'),
     'support_level', 'basic',
     'custom_branding', false,
     'api_access', false,
     'reports_retention_days', 90
   ),
   'basic',
   NULL
  UNION ALL
  SELECT UUID(), 'Professional', 'Full-featured plan for growing schools', 249.00, 2499.00, 1,
   JSON_OBJECT(
     'max_schools', 3,
     'max_branches_per_school', 5,
     'max_students', 5000,
     'max_teachers', 300,
     'max_staff', 150,
     'max_storage_gb', 200,
     'modules_enabled', JSON_ARRAY('attendance','grades','finance','library','messaging'),
     'support_level', 'premium',
     'custom_branding', true,
     'api_access', true,
     'reports_retention_days', 365
   ),
   'premium',
   NULL
  UNION ALL
  SELECT UUID(), 'Enterprise', 'Unlimited multi-campus package', 499.00, 4999.00, 1,
   JSON_OBJECT(
     'max_schools', 10,
     'max_branches_per_school', 999,
     'max_students', 50000,
     'max_teachers', 3000,
     'max_staff', 1500,
     'max_storage_gb', 2000,
     'modules_enabled', JSON_ARRAY('attendance','grades','finance','library','messaging','crm','transport','hostel'),
     'support_level', 'enterprise',
     'custom_branding', true,
     'api_access', true,
     'reports_retention_days', 1825
   ),
   'enterprise',
   NULL
) AS new_packages
WHERE NOT EXISTS (
  SELECT 1 FROM packages p WHERE p.name = new_packages.name
);

-- 2. Ensure every existing school has tenantId populated
UPDATE schools
SET tenantId = IFNULL(tenantId, uuid());

-- 3. Create subscriptions for schools without one
INSERT INTO school_subscriptions (
  uuid, schoolId, packageId, status, startedAt, expiresAt, autoRenew, currentUsage, paymentStatus, lastPaymentDate, createdAt, updatedAt
)
SELECT
  UUID(),
  s.id,
  p.id,
  'ACTIVE',
  NOW(),
  DATE_ADD(NOW(), INTERVAL 30 DAY),
  0,
  JSON_OBJECT(
    'schools_count', 1,
    'branches_count', 0,
    'students_count', (SELECT COUNT(*) FROM students st WHERE st.schoolId = s.id),
    'teachers_count', (SELECT COUNT(*) FROM teachers t WHERE t.schoolId = s.id),
    'storage_used_gb', 0
  ),
  'PAID',
  NOW(),
  NOW(),
  NOW()
FROM schools s
LEFT JOIN school_subscriptions ss ON ss.schoolId = s.id
LEFT JOIN packages p ON p.name = 'Starter'
WHERE ss.id IS NULL
  AND p.id IS NOT NULL;

-- 4. Update schools.subscriptionId to point to latest subscription
UPDATE schools s
JOIN (
  SELECT schoolId, id
  FROM school_subscriptions
  WHERE id IN (
    SELECT ss_inner.id
    FROM school_subscriptions ss_inner
    JOIN (
      SELECT schoolId, MAX(createdAt) AS maxCreatedAt
      FROM school_subscriptions
      GROUP BY schoolId
    ) latest_sub ON ss_inner.schoolId = latest_sub.schoolId
                AND ss_inner.createdAt = latest_sub.maxCreatedAt
  )
) latest ON latest.schoolId = s.id
SET s.subscriptionId = latest.id;

COMMIT;

