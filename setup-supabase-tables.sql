-- Setup Supabase tables for Johnny.2003 
-- Run these statements in your Supabase SQL Editor

-- Create products table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    product_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price INTEGER NOT NULL,  -- Price in cents/paise
    image_url TEXT NOT NULL,
    category TEXT,
    sizes TEXT[] DEFAULT ARRAY['S', 'M', 'L', 'XL'],
    stock INTEGER DEFAULT 10,  -- Default stock is 10 units
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cart table
CREATE TABLE IF NOT EXISTS carts (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    items JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_user_cart UNIQUE (user_id)
);

-- Create orders table for future implementation
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    order_id TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    items JSONB NOT NULL,
    total INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    shipping_address JSONB,
    payment_info JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a stock history table to track stock changes
CREATE TABLE IF NOT EXISTS stock_history (
    id SERIAL PRIMARY KEY,
    product_id TEXT REFERENCES products(product_id) ON DELETE CASCADE,
    order_id TEXT REFERENCES orders(order_id) ON DELETE SET NULL,
    change_amount INTEGER NOT NULL, -- Negative for decreases (sales), positive for increases (restocks)
    previous_stock INTEGER NOT NULL,
    new_stock INTEGER NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies for secure access
-- Allow users to access only their own carts
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own cart" 
    ON carts FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cart" 
    ON carts FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cart" 
    ON carts FOR UPDATE 
    USING (auth.uid() = user_id);

-- Allow all users to view products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view products" 
    ON products FOR SELECT 
    USING (true);

-- Only authenticated users can create/read their own orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own orders" 
    ON orders FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own orders" 
    ON orders FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Create function to get cart for current user
CREATE OR REPLACE FUNCTION get_cart()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    cart_items JSONB;
BEGIN
    SELECT items INTO cart_items FROM carts WHERE user_id = auth.uid();
    IF NOT FOUND THEN
        RETURN '[]'::JSONB;
    END IF;
    RETURN cart_items;
END;
$$;

-- Create function to update cart
CREATE OR REPLACE FUNCTION update_cart(new_items JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    updated_items JSONB;
BEGIN
    INSERT INTO carts (user_id, items, updated_at)
    VALUES (auth.uid(), new_items, NOW())
    ON CONFLICT (user_id)
    DO UPDATE SET items = new_items, updated_at = NOW()
    RETURNING items INTO updated_items;
    
    RETURN updated_items;
END;
$$;

-- Function to check if there's enough stock for an order
CREATE OR REPLACE FUNCTION check_stock_availability(order_items JSONB)
RETURNS TABLE (
    product_id TEXT,
    name TEXT,
    requested_quantity INTEGER,
    available_stock INTEGER,
    has_enough_stock BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH order_products AS (
        SELECT 
            p.id,
            p.product_id,
            p.name,
            p.stock,
            (item->>'quantity')::INTEGER AS requested_quantity
        FROM 
            jsonb_array_elements(order_items) AS item
        JOIN 
            products p ON p.product_id = item->>'id'
    )
    SELECT 
        op.product_id,
        op.name,
        op.requested_quantity,
        op.stock AS available_stock,
        op.stock >= op.requested_quantity AS has_enough_stock
    FROM 
        order_products op;
END;
$$;

-- Function to place an order and adjust stock
CREATE OR REPLACE FUNCTION place_order(
    order_items JSONB, 
    total_amount INTEGER,
    shipping_details JSONB DEFAULT NULL,
    payment_details JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_order_id TEXT;
    stock_check RECORD;
    insufficient_stock BOOLEAN := FALSE;
    error_products JSONB := '[]';
    item RECORD;
    product_record RECORD;
    order_result JSONB;
BEGIN
    -- Check stock availability first
    FOR stock_check IN
        SELECT * FROM check_stock_availability(order_items)
    LOOP
        IF NOT stock_check.has_enough_stock THEN
            insufficient_stock := TRUE;
            error_products := error_products || jsonb_build_object(
                'product_id', stock_check.product_id,
                'name', stock_check.name,
                'requested', stock_check.requested_quantity,
                'available', stock_check.available_stock
            );
        END IF;
    END LOOP;
    
    -- If any product doesn't have enough stock, return error
    IF insufficient_stock THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'Insufficient stock for some products',
            'products', error_products
        );
    END IF;
    
    -- Generate a unique order ID
    new_order_id := 'ORD-' || to_char(NOW(), 'YYYYMMDD') || '-' || FLOOR(RANDOM() * 10000)::TEXT;
    
    -- Create the order
    INSERT INTO orders (
        order_id, 
        user_id, 
        items, 
        total, 
        status,
        shipping_address,
        payment_info
    )
    VALUES (
        new_order_id,
        auth.uid(),
        order_items,
        total_amount,
        'confirmed',
        shipping_details,
        payment_details
    );
    
    -- Update stock for each product
    FOR item IN SELECT * FROM jsonb_array_elements(order_items)
    LOOP
        -- Get product details
        SELECT * INTO product_record 
        FROM products 
        WHERE product_id = (item->>'id');
        
        IF FOUND THEN
            -- Update stock
            UPDATE products
            SET 
                stock = stock - (item->>'quantity')::INTEGER,
                updated_at = NOW()
            WHERE product_id = (item->>'id');
            
            -- Record stock change in history
            INSERT INTO stock_history (
                product_id,
                order_id,
                change_amount,
                previous_stock,
                new_stock,
                reason
            )
            VALUES (
                product_record.product_id,
                new_order_id,
                -(item->>'quantity')::INTEGER,
                product_record.stock,
                product_record.stock - (item->>'quantity')::INTEGER,
                'Order placement'
            );
        END IF;
    END LOOP;
    
    -- Clear the user's cart
    UPDATE carts
    SET items = '[]', updated_at = NOW()
    WHERE user_id = auth.uid();
    
    -- Return success response
    order_result := jsonb_build_object(
        'success', TRUE,
        'order_id', new_order_id,
        'message', 'Order placed successfully and stock updated'
    );
    
    RETURN order_result;
END;
$$;

-- Create function to get order history
CREATE OR REPLACE FUNCTION get_orders()
RETURNS TABLE (
    order_id TEXT,
    items JSONB,
    total INTEGER,
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT o.order_id, o.items, o.total, o.status, o.created_at
    FROM orders o
    WHERE o.user_id = auth.uid()
    ORDER BY o.created_at DESC;
END;
$$;

-- Function to manually adjust stock (for admin use)
CREATE OR REPLACE FUNCTION admin_adjust_stock(product_id_param TEXT, adjustment INTEGER, reason_text TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_stock INTEGER;
    new_stock INTEGER;
BEGIN
    -- Get current stock
    SELECT stock INTO current_stock
    FROM products
    WHERE product_id = product_id_param;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'Product not found');
    END IF;
    
    -- Calculate new stock
    new_stock := current_stock + adjustment;
    
    -- Prevent negative stock
    IF new_stock < 0 THEN
        RETURN jsonb_build_object(
            'success', FALSE, 
            'error', 'Adjustment would result in negative stock', 
            'current_stock', current_stock,
            'requested_adjustment', adjustment
        );
    END IF;
    
    -- Update stock
    UPDATE products
    SET stock = new_stock, updated_at = NOW()
    WHERE product_id = product_id_param;
    
    -- Record the stock change
    INSERT INTO stock_history (
        product_id,
        change_amount,
        previous_stock,
        new_stock,
        reason
    )
    VALUES (
        product_id_param,
        adjustment,
        current_stock,
        new_stock,
        reason_text
    );
    
    RETURN jsonb_build_object(
        'success', TRUE,
        'product_id', product_id_param,
        'previous_stock', current_stock,
        'new_stock', new_stock,
        'adjustment', adjustment
    );
END;
$$;

-- Function to check low stock products (for inventory management)
CREATE OR REPLACE FUNCTION get_low_stock_products(threshold INTEGER DEFAULT 5)
RETURNS TABLE (
    product_id TEXT,
    name TEXT,
    current_stock INTEGER,
    category TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT p.product_id, p.name, p.stock, p.category
    FROM products p
    WHERE p.stock <= threshold
    ORDER BY p.stock ASC;
END;
$$;

-- Function to update order status (for admin use)
CREATE OR REPLACE FUNCTION update_order_status(order_id_param TEXT, new_status TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    updated_order RECORD;
BEGIN
    -- Update the order status
    UPDATE orders
    SET 
        status = new_status,
        updated_at = NOW()
    WHERE 
        order_id = order_id_param
    RETURNING order_id, status, updated_at INTO updated_order;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'Order not found'
        );
    END IF;
    
    -- Log the status change in a clear way
    RAISE NOTICE 'Order % status updated to % at %', 
        updated_order.order_id, 
        updated_order.status, 
        updated_order.updated_at;
    
    -- Return success response
    RETURN jsonb_build_object(
        'success', TRUE,
        'order_id', updated_order.order_id,
        'new_status', updated_order.status,
        'updated_at', updated_order.updated_at
    );
END;
$$;

-- Insert sample products for testing
INSERT INTO products (product_id, name, description, price, image_url, category, stock)
VALUES
    ('tape-tshirt', 'TAPE TSHIRT', 'Stylish tape design t-shirt with premium quality cotton', 150000, '../assets/images/with belt balenci ghani johnny.png', 'tshirts', 10),
    ('j-logo-tee', 'J-LOGO OVERSIZED TEE', 'Oversized t-shirt with Johnny logo print', 100000, '../assets/images/tee1 johnny_1.png', 'tshirts', 15),
    ('basketball-tshirt', 'BASKETBALL TSHIRT', 'Basketball inspired t-shirt design', 200000, '../assets/images/hey johnny.png', 'tshirts', 8),
    ('johnny-vest-black', 'JOHNNY VEST BLACK', 'Stylish black vest with Johnny branding', 60000, '../assets/images/vest black johnny_1.png', 'vests', 12)
ON CONFLICT (product_id) DO UPDATE SET 
    stock = EXCLUDED.stock,
    updated_at = NOW();

-- Create a test user function (for development only)
CREATE OR REPLACE FUNCTION create_test_user(email TEXT, password TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_user_id UUID;
BEGIN
    INSERT INTO auth.users (email, password)
    VALUES (email, password)
    RETURNING id INTO new_user_id;
    
    RETURN new_user_id;
END;
$$;
