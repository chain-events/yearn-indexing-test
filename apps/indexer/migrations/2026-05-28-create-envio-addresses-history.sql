-- envio v3 added the internal entity "envio_addresses" (superseding
-- dynamic_contract_registry). Its reorg-history twin
-- "envio_history_envio_addresses" was never created in this pre-existing DB,
-- so batch writes fail with: relation "envio.envio_history_envio_addresses"
-- does not exist (42P01). Mirror the envio_addresses columns plus the standard
-- envio history bookkeeping, matching envio_history_dynamic_contract_registry.
CREATE TABLE IF NOT EXISTS "envio"."envio_history_envio_addresses" (
  id text NOT NULL,
  chain_id integer,
  registration_block integer,
  registration_log_index integer,
  contract_name text,
  envio_checkpoint_id bigint NOT NULL,
  envio_change "envio"."envio_history_change" NOT NULL,
  PRIMARY KEY (id, envio_checkpoint_id)
);
