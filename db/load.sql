INSERT INTO portfolio_manager.portfolio_owner
(owner_id, owner_name)
VALUES('59b880ab-0f59-4d7d-a8f7-515c82f2d8f9'::uuid, 'Jeff');

INSERT INTO portfolio_manager.portfolio
(portfolio_id, owner_id, created_at, portfolio_name, funds_available, target_quantity)
VALUES('ee880ddf-daa8-4eba-8d8e-36a627884b47'::uuid, '59b880ab-0f59-4d7d-a8f7-515c82f2d8f9'::uuid, '2024-01-10 22:44:16.297', 'SepIRA', 100000.00, 0);

INSERT INTO portfolio_manager."position"
(position_id, security_id, quantity, purchase_price, portfolio_id, target_quantity)
VALUES('3f99a0be-0087-4209-a435-847f747760be'::uuid, 'a931668e-e608-40ed-8a9a-1da44a49c41c'::uuid, 10, 300.00, 'ee880ddf-daa8-4eba-8d8e-36a627884b47'::uuid, 0);
INSERT INTO portfolio_manager."position"
(position_id, security_id, quantity, purchase_price, portfolio_id, target_quantity)
VALUES('5d9b4802-b02a-457c-9bb4-acdbf2d09fd9'::uuid, '999cdb7c-eb7a-4927-82b0-8e768021e6bb'::uuid, 10, 150.00, 'ee880ddf-daa8-4eba-8d8e-36a627884b47'::uuid, 0);