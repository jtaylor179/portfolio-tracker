-- Drop Functions
DROP FUNCTION IF EXISTS public.clear_transactions;
DROP FUNCTION IF EXISTS public.remove_position_and_transactions;
DROP FUNCTION IF EXISTS public.add_record_transaction;
DROP FUNCTION IF EXISTS public.get_positions_by_portfolio;
DROP FUNCTION IF EXISTS public.get_portfolios_by_owner;
DROP FUNCTION IF EXISTS public.update_security_price;
DROP FUNCTION IF EXISTS public.update_portfolio;
DROP FUNCTION IF EXISTS public.add_portfolio;

-- Drop Tables
DROP TABLE IF EXISTS public.transaction; 
DROP TABLE IF EXISTS public.security_transaction;
DROP TABLE IF EXISTS public.security_metric;
DROP TABLE IF EXISTS public.position;
DROP TABLE IF EXISTS public.security;
DROP TABLE IF EXISTS public.portfolio;
DROP TABLE IF EXISTS public.portfolio_owner;

-- Drop Tables
DROP TABLE IF EXISTS portfolio_manager.security_transaction;
DROP TABLE IF EXISTS portfolio_manager.security_metric;
DROP TABLE IF EXISTS portfolio_manager.position;
DROP TABLE IF EXISTS portfolio_manager.security;
DROP TABLE IF EXISTS portfolio_manager.portfolio;
DROP TABLE IF EXISTS portfolio_manager.portfolio_owner;


CREATE TABLE portfolio_manager.portfolio_owner (
    owner_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_name varchar NOT NULL
);

CREATE TABLE portfolio_manager.portfolio (
    portfolio_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id uuid NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    portfolio_name varchar not NULL,
    funds_available numeric(15, 2) NOT NULL DEFAULT 0,
    target_quantity int2 NOT NULL DEFAULT 0,
    CONSTRAINT portfolio_portfolio_name_key UNIQUE (portfolio_name),
    CONSTRAINT portfolio_owner_id_fk FOREIGN KEY (owner_id) REFERENCES portfolio_manager.portfolio_owner(owner_id)
);

CREATE TABLE portfolio_manager."security" (
	security_id uuid NOT NULL DEFAULT uuid_generate_v4(),
	secondary_id int4 NULL,
	symbol varchar(10) NOT NULL,
	security_name varchar(60) NULL,
	weekly_flag int2 NOT NULL DEFAULT 0,
	daily_flag int2 NOT NULL DEFAULT 0,
	four_hour_flag int2 NOT NULL DEFAULT '0'::smallint,
	current_price numeric(10, 2) NULL,
	security_type varchar(15) NOT NULL DEFAULT 'stock'::character varying,
	management_company varchar(100) NULL,
	CONSTRAINT security_pkey PRIMARY KEY (security_id),
	CONSTRAINT ticker_unique UNIQUE (symbol)
);

CREATE TABLE portfolio_manager.position (
    position_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    security_id uuid NOT NULL,
    quantity int NOT NULL,
    purchase_price numeric(10, 2) NOT NULL,
    portfolio_id uuid NOT NULL,
    target_quantity int2 NOT NULL DEFAULT 0,
    CONSTRAINT position_stock_id_fkey FOREIGN KEY (security_id) REFERENCES portfolio_manager.security(security_id),
    CONSTRAINT position_portfolio_id_fk FOREIGN KEY (portfolio_id) REFERENCES portfolio_manager.portfolio(portfolio_id)
);


CREATE TABLE portfolio_manager.security_metric (
    security_metrics_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    security_id uuid NOT NULL,
    last_updated timestamptz NOT NULL DEFAULT now(),
    metrics json NOT NULL DEFAULT '{}'::json,
    timeframe varchar(2) NULL,
    CONSTRAINT security_metric_security_id_fkey FOREIGN KEY (security_id) REFERENCES portfolio_manager.security(security_id)
);

CREATE TABLE portfolio_manager.security_transaction (
    transaction_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_type varchar(4) NULL,
    security_id uuid NOT NULL,
    position_id uuid NOT NULL,
    execute_date timestamp NOT NULL,
    number_of_shares int4 NOT NULL,
    share_price numeric(10, 2) NOT NULL,
    market_value numeric(15, 2) NOT NULL,
    CONSTRAINT security_transaction_transaction_type_check CHECK (((transaction_type)::text = ANY ((ARRAY['buy'::character varying, 'sell'::character varying])::text[]))),
    CONSTRAINT security_transaction_security_fk FOREIGN KEY (security_id) REFERENCES portfolio_manager.security(security_id),
    CONSTRAINT security_transaction_position_fk FOREIGN KEY (position_id) REFERENCES portfolio_manager.position(position_id)
);

GRANT USAGE ON SCHEMA portfolio_manager TO public;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA portfolio_manager TO public;

GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA portfolio_manager TO public;

-- GRANT EXECUTE ON ALL TABLES IN SCHEMA public TO portfolio_manager;


CREATE OR REPLACE FUNCTION public.add_portfolio(
    p_owner_id uuid,
    p_portfolio_name varchar,
    p_funds_available numeric
)
RETURNS uuid
LANGUAGE plpgsql
AS $function$
DECLARE
    v_new_portfolio_id uuid;
BEGIN
    INSERT INTO portfolio_manager.portfolio (owner_id, portfolio_name, funds_available) 
    VALUES (p_owner_id, p_portfolio_name, p_funds_available)
    RETURNING portfolio_id INTO v_new_portfolio_id;

    RETURN v_new_portfolio_id;
END;
$function$;


CREATE OR REPLACE FUNCTION public.update_portfolio(
    p_portfolio_id uuid,
    p_funds_available numeric
)
RETURNS void
LANGUAGE plpgsql
AS $function$
BEGIN
    UPDATE portfolio_manager.portfolio 
    SET 
        funds_available = p_funds_available
    WHERE portfolio_id = p_portfolio_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_portfolios_by_owner(p_owner_id uuid)
RETURNS TABLE(
    portfolio_id uuid,
    portfolio_name varchar,
    total_securities_value numeric
) 
LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY 
    SELECT 
        pt.portfolio_id, 
        pt.portfolio_name, 
        SUM(p.quantity * s.current_price) AS total_securities_value
    FROM 
        portfolio_manager.portfolio pt
    LEFT JOIN 
        portfolio_manager.position p ON pt.portfolio_id = p.portfolio_id
    LEFT JOIN 
        portfolio_manager.security s ON p.security_id = s.security_id
    WHERE 
        pt.owner_id = p_owner_id
    GROUP BY 
        pt.portfolio_id, pt.portfolio_name
    ORDER BY 
        pt.portfolio_name;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_positions_by_portfolio(p_portfolio_id uuid)
 RETURNS TABLE(position_id uuid, security_id uuid, quantity integer, 
 purchase_price numeric, calculated_market_value numeric
 , symbol varchar, security_name varchar)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY 
    SELECT 
        p.position_id, 
        p.security_id, 
        p.quantity, 
        p.purchase_price, 
        (p.quantity * s.current_price) as calculated_market_value,
        s.symbol,
        s.security_name
    FROM 
        portfolio_manager.position p
    JOIN 
        portfolio_manager.security s ON p.security_id = s.security_id
    WHERE 
        p.portfolio_id = p_portfolio_id;
END;
$function$

CREATE OR REPLACE FUNCTION public.add_position(
    p_portfolio_id uuid,
    p_security_id uuid,
    p_initial_quantity int,
    p_purchase_price numeric,
    p_target_quantity int
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Insert a new position into the position table
    INSERT INTO portfolio_manager.position (portfolio_id, security_id, quantity, purchase_price, target_quantity)
    VALUES (p_portfolio_id, p_security_id, p_initial_quantity, p_purchase_price, p_target_quantity);
END;
$$;

CREATE OR REPLACE FUNCTION public.update_position(
    p_position_id uuid,
    p_new_quantity int,
    p_new_purchase_price numeric,
    p_new_target_quantity int
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE portfolio_manager.position
    SET quantity = p_new_quantity,
        purchase_price = p_new_purchase_price,
        target_quantity = p_new_target_quantity
    WHERE position_id = p_position_id;
END;
$$;



CREATE OR REPLACE FUNCTION public.add_transaction(
    p_portfolio_id uuid,
    p_security_id uuid,
    p_quantity_change int,
    p_purchase_price numeric,
    p_target_quantity int DEFAULT NULL  -- Optional parameter for target quantity
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    v_position_id uuid;
BEGIN
    -- Check if the position exists
    SELECT position_id INTO v_position_id 
    FROM portfolio_manager.position
    WHERE portfolio_id = p_portfolio_id AND security_id = p_security_id;

    -- If the position does not exist, create it
    IF v_position_id IS NULL THEN
        INSERT INTO portfolio_manager.position (portfolio_id, security_id, quantity, purchase_price, target_quantity)
        VALUES (p_portfolio_id, p_security_id, p_quantity_change, p_purchase_price, COALESCE(p_target_quantity, 0))
        RETURNING position_id INTO v_position_id;
    ELSE
        -- Update the existing position
        UPDATE portfolio_manager.position
        SET quantity = quantity + p_quantity_change,
            target_quantity = COALESCE(p_target_quantity, target_quantity)  -- Update target quantity if provided
        WHERE position_id = v_position_id;
    END IF;

    -- Record the transaction
    INSERT INTO portfolio_manager.security_transaction (
        transaction_type, 
        security_id, 
        execute_date, 
        number_of_shares, 
        share_price, 
        market_value, 
        position_id
    ) 
    VALUES (
        CASE 
            WHEN p_quantity_change > 0 THEN 'buy' 
            ELSE 'sell' 
        END, 
        p_security_id, 
        now(), 
        ABS(p_quantity_change), 
        p_purchase_price, 
        ABS(p_quantity_change) * p_purchase_price, 
        v_position_id
    );
END;
$$;


CREATE OR REPLACE FUNCTION public.remove_position_and_transactions(
    p_position_id uuid
)
RETURNS void
LANGUAGE plpgsql
AS $function$
BEGIN
    -- Delete transactions associated with the position
    DELETE FROM portfolio_manager.transaction
    WHERE position_id = p_position_id;

    -- Delete the position
    DELETE FROM portfolio_manager.position
    WHERE position_id = p_position_id;
END;
$function$;


CREATE OR REPLACE FUNCTION public.remove_position_and_transactions(
    p_position_id uuid
)
RETURNS void
LANGUAGE plpgsql
AS $function$
BEGIN
    -- Delete transactions associated with the position
    DELETE FROM portfolio_manager.transaction
    WHERE position_id = p_position_id;

    -- Delete the position
    DELETE FROM portfolio_manager.position
    WHERE position_id = p_position_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.clear_transactions(
    p_portfolio_id uuid,
    p_security_id uuid
)
RETURNS void
LANGUAGE plpgsql
AS $function$
BEGIN
    -- Delete transactions associated with the given security_id and portfolio_id
    DELETE FROM portfolio_manager.transaction
    WHERE security_id = p_security_id AND position_id IN (
        SELECT position_id FROM portfolio_manager.position
        WHERE portfolio_id = p_portfolio_id AND security_id = p_security_id
    );

    -- Update the position's quantity to zero
    UPDATE portfolio_manager.position
    SET quantity = 0
    WHERE portfolio_id = p_portfolio_id AND security_id = p_security_id;
END;
$function$;

-- create a function to add a new security to the portfolio

CREATE OR REPLACE FUNCTION public.add_security(
    _security_id uuid,
    _secondary_id int4,
    _symbol varchar(10),
    _security_name varchar(60),
    _weekly_flag int2 = 0,
    _daily_flag int2 = 0,
    _four_hour_flag int2 = 0,
    _current_price numeric(10, 2) = 0.00,
    _security_type varchar(15) = 'stock',
    _management_company varchar(100) = NULL
)
RETURNS uuid AS
$$
DECLARE
    _result uuid;
BEGIN
    INSERT INTO portfolio_manager."security" (
        security_id,
        secondary_id,
        symbol,
        security_name,
        weekly_flag,
        daily_flag,
        four_hour_flag,
        current_price,
        security_type,
        management_company
    )
    VALUES (
        _security_id,
        _secondary_id,
        _symbol,
        _security_name,
        _weekly_flag,
        _daily_flag,
        _four_hour_flag,
        _current_price,
        _security_type,
        _management_company
    )
    ON CONFLICT (symbol)
    DO UPDATE SET
        security_id = excluded.security_id,
        secondary_id = excluded.secondary_id,
        security_name = excluded.security_name,
        weekly_flag = excluded.weekly_flag,
        daily_flag = excluded.daily_flag,
        four_hour_flag = excluded.four_hour_flag,
        current_price = excluded.current_price,
        security_type = excluded.security_type,
        management_company = excluded.management_company
    RETURNING security_id INTO _result;

    RETURN _result;
END;
$$
LANGUAGE 'plpgsql';


CREATE OR REPLACE FUNCTION public.update_security_price(p_security_id uuid, p_new_price numeric)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE portfolio_manager.security 
    SET current_price = p_new_price 
    WHERE security_id = p_security_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.add_portfolio_owner(
    p_owner_name varchar
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
    v_new_owner_id uuid;
BEGIN
    INSERT INTO portfolio_manager.portfolio_owner (owner_name)
    VALUES (p_owner_name)
    RETURNING owner_id INTO v_new_owner_id;

    RETURN v_new_owner_id;
END;
$$;


DO $$
DECLARE
    v_owner_id uuid;
    v_portfolio_id uuid;
    v_msft_id uuid;
    v_appl_id uuid;
    v_msft_position_id uuid;
    v_appl_position_id uuid;
BEGIN
    -- Create an owner named 'Jeff'
    SELECT portfolio_manager.add_portfolio_owner('Jeff') INTO v_owner_id;

    -- Add a portfolio named 'SepIRA' for Jeff
    SELECT portfolio_manager.add_portfolio(v_owner_id, 'SepIRA', 100000) INTO v_portfolio_id;

    -- Add securities for MSFT and APPL
    INSERT INTO portfolio_manager.security (symbol, name, current_price, secondary_id)
    VALUES ('MSFT', 'Microsoft Corporation', 300.00, 6408),  -- Example current price for MSFT
           ('AAPL', 'Apple Inc.', 150.00, 252)             -- Example current price for AAPL
    ON CONFLICT (symbol) DO NOTHING;

    -- Retrieve the security IDs for MSFT and AAPL
    SELECT security_id INTO v_msft_id FROM portfolio_manager.security WHERE symbol = 'MSFT';
    SELECT security_id INTO v_appl_id FROM portfolio_manager.security WHERE symbol = 'AAPL';

    -- Add positions for MSFT and AAPL in the SepIRA portfolio and record the transactions
    -- For MSFT
    PERFORM portfolio_manager.add_transaction(v_portfolio_id, v_msft_id, 10, 300.00);

    -- For AAPL
    PERFORM portfolio_manager.add_transaction(v_portfolio_id, v_appl_id, 10, 150.00);
END;
$$;



-- Add a function to add a posiiton to a portfolio returns new position_id
-- default target_quantity to 0
-- default initial_quantity to 0
CREATE OR REPLACE FUNCTION public.add_position(
    p_portfolio_id uuid,
    p_security_id uuid,
    p_initial_quantity int,
    p_purchase_price numeric,
    p_target_quantity int
)   
RETURNS uuid
LANGUAGE plpgsql
AS $function$
DECLARE
    v_new_position_id uuid;
BEGIN
    INSERT INTO portfolio_manager.position (portfolio_id, security_id, quantity, purchase_price, target_quantity)
    VALUES (p_portfolio_id, p_security_id, p_initial_quantity, p_purchase_price, p_target_quantity)
    RETURNING position_id INTO v_new_position_id;

    RETURN v_new_position_id;
END;
$function$;




/*
 Modify the existing 'security' table
ALTER TABLE portfolio_manager."security"
ADD COLUMN security_type varchar(15) NOT NULL DEFAULT 'stock', -- 'stock', 'mutual fund', etc.
ADD COLUMN management_company varchar(100), -- Specific to mutual funds
ADD COLUMN nav numeric(10, 2); -- Net Asset Value, specific to mutual funds
*/




