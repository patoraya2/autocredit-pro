-- Agrega el campo NSS (Número de Seguro Social) a la tabla clientes
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS nss TEXT;
