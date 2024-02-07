-- DROP SCHEMA public;

CREATE SCHEMA public AUTHORIZATION postgres;

-- DROP FUNCTION public.add_portfolio(uuid, varchar, numeric);

CREATE OR REPLACE FUNCTION public.add_portfolio(p_owner_id uuid, p_portfolio_name character varying, p_funds_available numeric)
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
$function$
;

-- DROP FUNCTION public.add_portfolio_owner(varchar);

CREATE OR REPLACE FUNCTION public.add_portfolio_owner(p_owner_name character varying)
 RETURNS uuid
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_new_owner_id uuid;
BEGIN
    INSERT INTO portfolio_manager.portfolio_owner (owner_name)
    VALUES (p_owner_name)
    RETURNING owner_id INTO v_new_owner_id;

    RETURN v_new_owner_id;
END;
$function$
;

-- DROP FUNCTION public.add_position(uuid, uuid, int4, numeric, int4);

CREATE OR REPLACE FUNCTION public.add_position(p_portfolio_id uuid, p_security_id uuid, p_initial_quantity integer, p_purchase_price numeric, p_target_quantity integer)
 RETURNS uuid
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_new_position_id uuid;
BEGIN
    INSERT INTO portfolio_manager.position (portfolio_id, security_id, quantity, purchase_price, target_quantity)
    VALUES (p_portfolio_id, p_security_id, p_initial_quantity, p_purchase_price, p_target_quantity)
    on conflict do nothing
    RETURNING position_id INTO v_new_position_id;

    RETURN v_new_position_id;
END;
$function$
;

-- DROP FUNCTION public.add_security(int4, varchar, varchar, int2, int2, int2, numeric, varchar, varchar);

CREATE OR REPLACE FUNCTION public.add_security(_secondary_id integer, _symbol character varying, _security_name character varying, _weekly_flag smallint DEFAULT 0, _daily_flag smallint DEFAULT 0, _four_hour_flag smallint DEFAULT 0, _current_price numeric DEFAULT 0.00, _security_type character varying DEFAULT 'stock'::character varying, _management_company character varying DEFAULT NULL::character varying)
 RETURNS uuid
 LANGUAGE plpgsql
AS $function$
DECLARE
    _result uuid;
BEGIN
    INSERT INTO portfolio_manager."security" (
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
        _secondary_id,
        upper(_symbol),
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
        secondary_id = excluded.secondary_id,
        security_name = excluded.security_name,
        ---weekly_flag = excluded.weekly_flag,
        ---daily_flag = excluded.daily_flag,
        ---four_hour_flag = excluded.four_hour_flag,
        -- current_price = excluded.current_price,
        security_type = excluded.security_type,
        management_company = excluded.management_company
    RETURNING security_id INTO _result;

    RETURN _result;
END;
$function$
;

-- DROP FUNCTION public.add_security_price_history(uuid, varchar, json);

CREATE OR REPLACE FUNCTION public.add_security_price_history(p_security_id uuid, p_timeframe character varying, p_history json)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    INSERT INTO portfolio_manager.security_price_history (security_id, timeframe, metrics)
    VALUES (p_security_id, p_timeframe, p_history)
    ON CONFLICT (security_id, timeframe) 
    DO UPDATE SET metrics = EXCLUDED.metrics;
END;
$function$
;

-- DROP FUNCTION public.add_transaction(uuid, uuid, int4, numeric, int4);

CREATE OR REPLACE FUNCTION public.add_transaction(p_portfolio_id uuid, p_security_id uuid, p_quantity_change integer, p_purchase_price numeric, p_target_quantity integer DEFAULT NULL::integer)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
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
$function$
;

-- DROP FUNCTION public.clear_transactions(uuid, uuid);

CREATE OR REPLACE FUNCTION public.clear_transactions(p_portfolio_id uuid, p_security_id uuid)
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
$function$
;

-- DROP FUNCTION public.get_portfolios_by_owner(uuid);

CREATE OR REPLACE FUNCTION public.get_portfolios_by_owner(p_owner_id uuid)
 RETURNS TABLE(portfolio_id uuid, portfolio_name character varying, total_securities_value numeric)
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
$function$
;

-- DROP FUNCTION public.get_positions_by_portfolio(uuid);

CREATE OR REPLACE FUNCTION public.get_positions_by_portfolio(p_portfolio_id uuid)
 RETURNS TABLE(position_id uuid, security_id uuid, quantity integer, purchase_price numeric, calculated_market_value numeric, symbol character varying, security_name character varying, secondary_id integer, daily_flag smallint, weekly_flag smallint, four_hour_flag smallint)
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
        s.security_name,
        s.secondary_id,
        s.daily_flag,
        s.weekly_flag,
        s.four_hour_flag
    FROM 
        portfolio_manager.position p
    JOIN 
        portfolio_manager.security s ON p.security_id = s.security_id
    WHERE 
        p.portfolio_id = p_portfolio_id
    order by s.symbol;
END;
$function$
;

-- DROP FUNCTION public.get_security_positions();

CREATE OR REPLACE FUNCTION public.get_security_positions()
 RETURNS TABLE(stock_id bigint, ticker character varying, quantity integer, market_value numeric)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY 
  SELECT s.stock_id, s.ticker, p.quantity, p.market_value
  FROM stock s 
  INNER JOIN position p ON s.stock_id = p.stock_id
  ORDER BY s.ticker;
END;
$function$
;

-- DROP FUNCTION public.get_stock_positions();

CREATE OR REPLACE FUNCTION public.get_stock_positions()
 RETURNS TABLE(stock_id bigint, ticker character varying, quantity integer, market_value numeric)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY 
  SELECT s.stock_id, s.ticker, p.quantity, p.market_value
  FROM stock s 
  INNER JOIN position p ON s.stock_id = p.stock_id;
END;
$function$
;

-- DROP FUNCTION public.remove_position_and_transactions(uuid);

CREATE OR REPLACE FUNCTION public.remove_position_and_transactions(p_position_id uuid)
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
$function$
;

-- DROP FUNCTION public.testinsert(varchar);

CREATE OR REPLACE FUNCTION public.testinsert(p_symbol character varying)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN 
  INSERT INTO portfolio_manager.tablea(content) VALUES (p_symbol);
END;
$function$
;

-- DROP FUNCTION public.update_portfolio(uuid, numeric);

CREATE OR REPLACE FUNCTION public.update_portfolio(p_portfolio_id uuid, p_funds_available numeric)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
    UPDATE portfolio_manager.portfolio 
    SET 
        funds_available = p_funds_available
    WHERE portfolio_id = p_portfolio_id;
END;
$function$
;

-- DROP FUNCTION public.update_position(uuid, int4, numeric, int4);

CREATE OR REPLACE FUNCTION public.update_position(p_position_id uuid, p_new_quantity integer, p_new_purchase_price numeric, p_new_target_quantity integer)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
    UPDATE portfolio_manager.position
    SET quantity = p_new_quantity,
        purchase_price = p_new_purchase_price,
        target_quantity = p_new_target_quantity
    WHERE position_id = p_position_id;
END;
$function$
;

-- DROP FUNCTION public.update_security_price(uuid, numeric);

CREATE OR REPLACE FUNCTION public.update_security_price(p_security_id uuid, p_new_price numeric)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
    UPDATE portfolio_manager.security 
    SET current_price = p_new_price 
    WHERE security_id = p_security_id;
END;
$function$
;