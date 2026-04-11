-- Step 1: Fix existing negative stock
UPDATE products SET stock_deposit = 0 WHERE stock_deposit < 0;
UPDATE seller_inventory SET stock = 0 WHERE stock < 0;

-- Step 2: Add constraints
ALTER TABLE products ADD CONSTRAINT stock_deposit_check CHECK (stock_deposit >= 0);
ALTER TABLE seller_inventory ADD CONSTRAINT stock_check CHECK (stock >= 0);
