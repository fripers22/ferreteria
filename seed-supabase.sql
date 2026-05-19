-- Seed SQL para Supabase (PostgreSQL)
-- Basado en backend/prisma/seed.js
-- Nota: asume que el esquema Prisma ya fue aplicado previamente.

BEGIN;

-- 1) Usuarios
INSERT INTO public."User" ("username", "password", "fullName", "role", "active", "updatedAt")
VALUES
  ('admin', '$2a$10$XL6Zr7VlvXHLflU8kTvu2O8d71wicHUl/.VoPC6Axx6AkPOPTo2yq', 'Administrador', 'ADMIN'::"Role", true, NOW()),
  ('vendedor1', '$2a$10$nujf4ccOS3o00.xdfvGHZOvnIULHWKvUMaBQ3DuWnokq.VpSAOrBS', 'Juan Pérez', 'VENDEDOR'::"Role", true, NOW())
ON CONFLICT ("username") DO NOTHING;

-- 2) Categorías
INSERT INTO public."Category" ("name")
VALUES
  ('Herramientas Manuales'),
  ('Herramientas Eléctricas'),
  ('Tornillería'),
  ('Plomería'),
  ('Electricidad'),
  ('Pinturas'),
  ('Ferretería General'),
  ('Seguridad')
ON CONFLICT ("name") DO NOTHING;

-- 3) Productos
INSERT INTO public."Product"
  ("sku", "barcode", "name", "categoryId", "unit", "costPrice", "salePrice", "stock", "minStock", "active", "updatedAt")
VALUES
  ('HM-001', '7501234567001', 'Martillo de uña 16oz', (SELECT "id" FROM public."Category" WHERE "name" = 'Herramientas Manuales'), 'pza', 85.00, 149.00, 25, 5, true, NOW()),
  ('HM-002', '7501234567002', 'Destornillador plano 1/4"', (SELECT "id" FROM public."Category" WHERE "name" = 'Herramientas Manuales'), 'pza', 25.00, 45.00, 50, 10, true, NOW()),
  ('HM-003', '7501234567003', 'Pinzas de electricista', (SELECT "id" FROM public."Category" WHERE "name" = 'Herramientas Manuales'), 'pza', 65.00, 115.00, 30, 8, true, NOW()),
  ('HM-004', '7501234567004', 'Llave ajustable 10"', (SELECT "id" FROM public."Category" WHERE "name" = 'Herramientas Manuales'), 'pza', 95.00, 169.00, 20, 5, true, NOW()),
  ('HM-005', '7501234567005', 'Flexómetro 5m', (SELECT "id" FROM public."Category" WHERE "name" = 'Herramientas Manuales'), 'pza', 35.00, 65.00, 40, 10, true, NOW()),
  ('TN-001', '7501234567010', 'Tornillo para madera 2" (100pz)', (SELECT "id" FROM public."Category" WHERE "name" = 'Tornillería'), 'bolsa', 45.00, 79.00, 100, 20, true, NOW()),
  ('TN-002', '7501234567011', 'Clavo 2.5" (1kg)', (SELECT "id" FROM public."Category" WHERE "name" = 'Tornillería'), 'kg', 28.00, 49.00, 80, 15, true, NOW()),
  ('TN-003', '7501234567012', 'Tornillo tablaroca 1" (100pz)', (SELECT "id" FROM public."Category" WHERE "name" = 'Tornillería'), 'bolsa', 35.00, 59.00, 120, 25, true, NOW()),
  ('PL-001', '7501234567020', 'Tubo PVC 4" x 6m', (SELECT "id" FROM public."Category" WHERE "name" = 'Plomería'), 'pza', 180.00, 299.00, 15, 5, true, NOW()),
  ('PL-002', '7501234567021', 'Codo PVC 4" 90°', (SELECT "id" FROM public."Category" WHERE "name" = 'Plomería'), 'pza', 25.00, 45.00, 50, 10, true, NOW()),
  ('PL-003', '7501234567022', 'Llave de paso 1/2"', (SELECT "id" FROM public."Category" WHERE "name" = 'Plomería'), 'pza', 55.00, 95.00, 25, 8, true, NOW()),
  ('EL-001', '7501234567030', 'Cable THW 12 (100m)', (SELECT "id" FROM public."Category" WHERE "name" = 'Electricidad'), 'rollo', 850.00, 1299.00, 10, 3, true, NOW()),
  ('EL-002', '7501234567031', 'Interruptor sencillo', (SELECT "id" FROM public."Category" WHERE "name" = 'Electricidad'), 'pza', 18.00, 35.00, 60, 15, true, NOW()),
  ('EL-003', '7501234567032', 'Foco LED 9W', (SELECT "id" FROM public."Category" WHERE "name" = 'Electricidad'), 'pza', 28.00, 49.00, 80, 20, true, NOW()),
  ('PT-001', '7501234567040', 'Pintura vinílica blanca 4L', (SELECT "id" FROM public."Category" WHERE "name" = 'Pinturas'), 'cubeta', 180.00, 299.00, 20, 5, true, NOW()),
  ('PT-002', '7501234567041', 'Brocha 4"', (SELECT "id" FROM public."Category" WHERE "name" = 'Pinturas'), 'pza', 35.00, 65.00, 30, 8, true, NOW()),
  ('PT-003', '7501234567042', 'Rodillo 9"', (SELECT "id" FROM public."Category" WHERE "name" = 'Pinturas'), 'pza', 45.00, 85.00, 25, 8, true, NOW()),
  ('PT-004', '7501234567043', 'Lija de agua grano 120', (SELECT "id" FROM public."Category" WHERE "name" = 'Pinturas'), 'pza', 8.00, 15.00, 120, 20, true, NOW()),
  ('PT-005', '7501234567044', 'Lijadora orbital 1/4 hoja', (SELECT "id" FROM public."Category" WHERE "name" = 'Pinturas'), 'pza', 650.00, 999.00, 8, 2, true, NOW()),
  ('FG-001', '7501234567050', 'Cinta adhesiva de enmascarar 48mm', (SELECT "id" FROM public."Category" WHERE "name" = 'Ferretería General'), 'pza', 28.00, 49.00, 60, 10, true, NOW()),
  ('SG-001', '7501234567060', 'Guantes de seguridad talla L', (SELECT "id" FROM public."Category" WHERE "name" = 'Seguridad'), 'par', 22.00, 39.00, 50, 10, true, NOW()),
  ('SG-002', '7501234567061', 'Gafas de seguridad transparentes', (SELECT "id" FROM public."Category" WHERE "name" = 'Seguridad'), 'pza', 35.00, 69.00, 40, 8, true, NOW())
ON CONFLICT ("sku") DO NOTHING;

-- 4) Clientes
INSERT INTO public."Customer" ("name", "phone", "email", "address", "rfc", "updatedAt")
SELECT 'Cliente General', NULL, NULL, NULL, NULL, NOW()
WHERE NOT EXISTS (SELECT 1 FROM public."Customer" WHERE "name" = 'Cliente General');

INSERT INTO public."Customer" ("name", "phone", "email", "address", "rfc", "updatedAt")
SELECT 'Juan García López', '555-1234567', 'juan.garcia@email.com', 'Calle Principal 123', NULL, NOW()
WHERE NOT EXISTS (SELECT 1 FROM public."Customer" WHERE "name" = 'Juan García López');

INSERT INTO public."Customer" ("name", "phone", "email", "address", "rfc", "updatedAt")
SELECT 'Construcciones MX S.A.', '555-9876543', 'contacto@construccionesmx.com', 'Av. Industrial 456', 'CMX201015ABC', NOW()
WHERE NOT EXISTS (SELECT 1 FROM public."Customer" WHERE "name" = 'Construcciones MX S.A.');

INSERT INTO public."Customer" ("name", "phone", "email", "address", "rfc", "updatedAt")
SELECT 'María Hernández', '555-4567890', 'maria.h@email.com', NULL, NULL, NOW()
WHERE NOT EXISTS (SELECT 1 FROM public."Customer" WHERE "name" = 'María Hernández');

-- 5) Cuenta por cobrar para Construcciones MX S.A.
INSERT INTO public."Account" ("customerId", "balance", "creditLimit", "updatedAt")
SELECT c."id", 2500.00, 10000.00, NOW()
FROM public."Customer" c
WHERE c."name" = 'Construcciones MX S.A.'
  AND NOT EXISTS (
    SELECT 1
    FROM public."Account" a
    WHERE a."customerId" = c."id"
  );

COMMIT;
