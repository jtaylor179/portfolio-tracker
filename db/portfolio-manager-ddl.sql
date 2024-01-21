-- DROP SCHEMA portfolio_manager;

CREATE SCHEMA portfolio_manager AUTHORIZATION postgres;
-- portfolio_manager.portfolio_owner definition

-- Drop table

-- DROP TABLE portfolio_manager.portfolio_owner;

CREATE TABLE portfolio_manager.portfolio_owner (
	owner_id uuid NOT NULL DEFAULT uuid_generate_v4(),
	owner_name varchar NOT NULL,
	CONSTRAINT portfolio_owner_pkey PRIMARY KEY (owner_id)
);


-- portfolio_manager."security" definition

-- Drop table

-- DROP TABLE portfolio_manager."security";

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


-- portfolio_manager.portfolio definition

-- Drop table

-- DROP TABLE portfolio_manager.portfolio;

CREATE TABLE portfolio_manager.portfolio (
	portfolio_id uuid NOT NULL DEFAULT uuid_generate_v4(),
	owner_id uuid NOT NULL,
	created_at timestamptz NOT NULL DEFAULT now(),
	portfolio_name varchar NOT NULL,
	funds_available numeric(15, 2) NOT NULL DEFAULT 0,
	target_quantity int2 NOT NULL DEFAULT 0,
	CONSTRAINT portfolio_pkey PRIMARY KEY (portfolio_id),
	CONSTRAINT portfolio_portfolio_name_key UNIQUE (portfolio_name),
	CONSTRAINT portfolio_owner_id_fk FOREIGN KEY (owner_id) REFERENCES portfolio_manager.portfolio_owner(owner_id)
);


-- portfolio_manager."position" definition

-- Drop table

-- DROP TABLE portfolio_manager."position";

CREATE TABLE portfolio_manager."position" (
	position_id uuid NOT NULL DEFAULT uuid_generate_v4(),
	security_id uuid NOT NULL,
	quantity int4 NOT NULL DEFAULT 0,
	purchase_price numeric(10, 2) NOT NULL,
	portfolio_id uuid NOT NULL,
	target_quantity int2 NOT NULL DEFAULT 0,
	CONSTRAINT portfolio_security_unq UNIQUE (security_id, portfolio_id),
	CONSTRAINT position_pkey PRIMARY KEY (position_id),
	CONSTRAINT position_portfolio_id_fk FOREIGN KEY (portfolio_id) REFERENCES portfolio_manager.portfolio(portfolio_id),
	CONSTRAINT position_stock_id_fkey FOREIGN KEY (security_id) REFERENCES portfolio_manager."security"(security_id)
);


-- portfolio_manager.security_metric definition

-- Drop table

-- DROP TABLE portfolio_manager.security_metric;

CREATE TABLE portfolio_manager.security_metric (
	security_metrics_id uuid NOT NULL DEFAULT uuid_generate_v4(),
	security_id uuid NOT NULL,
	last_updated timestamptz NOT NULL DEFAULT now(),
	metrics json NOT NULL DEFAULT '{}'::json,
	timeframe varchar(2) NULL,
	CONSTRAINT security_metric_pkey PRIMARY KEY (security_metrics_id),
	CONSTRAINT security_metric_security_id_fkey FOREIGN KEY (security_id) REFERENCES portfolio_manager."security"(security_id)
);


-- portfolio_manager.security_transaction definition

-- Drop table

-- DROP TABLE portfolio_manager.security_transaction;

CREATE TABLE portfolio_manager.security_transaction (
	transaction_id uuid NOT NULL DEFAULT uuid_generate_v4(),
	transaction_type varchar(4) NULL,
	security_id uuid NOT NULL,
	position_id uuid NOT NULL,
	execute_date timestamp NOT NULL,
	number_of_shares int4 NOT NULL,
	share_price numeric(10, 2) NOT NULL,
	market_value numeric(15, 2) NOT NULL,
	CONSTRAINT security_transaction_pkey PRIMARY KEY (transaction_id),
	CONSTRAINT security_transaction_transaction_type_check CHECK (((transaction_type)::text = ANY (ARRAY[('buy'::character varying)::text, ('sell'::character varying)::text]))),
	CONSTRAINT security_transaction_position_fk FOREIGN KEY (position_id) REFERENCES portfolio_manager."position"(position_id),
	CONSTRAINT security_transaction_security_fk FOREIGN KEY (security_id) REFERENCES portfolio_manager."security"(security_id)
);