DO $$
DECLARE
  history_table text;
BEGIN
  FOR history_table IN
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'envio'
      AND table_name LIKE 'envio_history_%'
      AND table_name <> 'envio_history_dynamic_contract_registry'
  LOOP
    EXECUTE format(
      'ALTER TABLE IF EXISTS "envio".%I ADD COLUMN IF NOT EXISTS "transactionIndex" integer NOT NULL DEFAULT 0',
      history_table
    );
  END LOOP;
END $$;

CREATE TABLE IF NOT EXISTS "envio"."Approval" (
  id text PRIMARY KEY,
  "vaultAddress" text NOT NULL,
  "chainId" integer NOT NULL,
  "blockNumber" integer NOT NULL,
  "blockTimestamp" integer NOT NULL,
  "blockHash" text NOT NULL,
  "transactionHash" text NOT NULL,
  "transactionIndex" integer NOT NULL,
  "transactionFrom" text,
  "logIndex" integer NOT NULL,
  owner text NOT NULL,
  spender text NOT NULL,
  value numeric NOT NULL
);

CREATE TABLE IF NOT EXISTS "envio"."envio_history_Approval" (
  id text NOT NULL,
  "vaultAddress" text NOT NULL,
  "chainId" integer NOT NULL,
  "blockNumber" integer NOT NULL,
  "blockTimestamp" integer NOT NULL,
  "blockHash" text NOT NULL,
  "transactionHash" text NOT NULL,
  "transactionIndex" integer NOT NULL,
  "transactionFrom" text,
  "logIndex" integer NOT NULL,
  owner text NOT NULL,
  spender text NOT NULL,
  value numeric NOT NULL,
  envio_checkpoint_id bigint NOT NULL,
  envio_change "envio"."envio_history_change" NOT NULL,
  PRIMARY KEY (id, envio_checkpoint_id)
);

CREATE TABLE IF NOT EXISTS "envio"."V2Sweep" (
  id text PRIMARY KEY,
  "vaultAddress" text NOT NULL,
  "chainId" integer NOT NULL,
  "blockNumber" integer NOT NULL,
  "blockTimestamp" integer NOT NULL,
  "blockHash" text NOT NULL,
  "transactionHash" text NOT NULL,
  "transactionIndex" integer NOT NULL,
  "transactionFrom" text,
  "logIndex" integer NOT NULL,
  token text NOT NULL,
  amount numeric NOT NULL
);

CREATE TABLE IF NOT EXISTS "envio"."envio_history_V2Sweep" (
  id text NOT NULL,
  "vaultAddress" text NOT NULL,
  "chainId" integer NOT NULL,
  "blockNumber" integer NOT NULL,
  "blockTimestamp" integer NOT NULL,
  "blockHash" text NOT NULL,
  "transactionHash" text NOT NULL,
  "transactionIndex" integer NOT NULL,
  "transactionFrom" text,
  "logIndex" integer NOT NULL,
  token text NOT NULL,
  amount numeric NOT NULL,
  envio_checkpoint_id bigint NOT NULL,
  envio_change "envio"."envio_history_change" NOT NULL,
  PRIMARY KEY (id, envio_checkpoint_id)
);

CREATE TABLE IF NOT EXISTS "envio"."V2LockedProfitDegradationUpdated" (
  id text PRIMARY KEY,
  "vaultAddress" text NOT NULL,
  "chainId" integer NOT NULL,
  "blockNumber" integer NOT NULL,
  "blockTimestamp" integer NOT NULL,
  "blockHash" text NOT NULL,
  "transactionHash" text NOT NULL,
  "transactionIndex" integer NOT NULL,
  "transactionFrom" text,
  "logIndex" integer NOT NULL,
  value numeric NOT NULL
);

CREATE TABLE IF NOT EXISTS "envio"."envio_history_V2LockedProfitDegradationUpdated" (
  id text NOT NULL,
  "vaultAddress" text NOT NULL,
  "chainId" integer NOT NULL,
  "blockNumber" integer NOT NULL,
  "blockTimestamp" integer NOT NULL,
  "blockHash" text NOT NULL,
  "transactionHash" text NOT NULL,
  "transactionIndex" integer NOT NULL,
  "transactionFrom" text,
  "logIndex" integer NOT NULL,
  value numeric NOT NULL,
  envio_checkpoint_id bigint NOT NULL,
  envio_change "envio"."envio_history_change" NOT NULL,
  PRIMARY KEY (id, envio_checkpoint_id)
);

CREATE TABLE IF NOT EXISTS "envio"."V2FeeReport" (
  id text PRIMARY KEY,
  "vaultAddress" text NOT NULL,
  "chainId" integer NOT NULL,
  "blockNumber" integer NOT NULL,
  "blockTimestamp" integer NOT NULL,
  "blockHash" text NOT NULL,
  "transactionHash" text NOT NULL,
  "transactionIndex" integer NOT NULL,
  "transactionFrom" text,
  "logIndex" integer NOT NULL,
  management_fee numeric NOT NULL,
  performance_fee numeric NOT NULL,
  strategist_fee numeric NOT NULL,
  duration numeric NOT NULL
);

CREATE TABLE IF NOT EXISTS "envio"."envio_history_V2FeeReport" (
  id text NOT NULL,
  "vaultAddress" text NOT NULL,
  "chainId" integer NOT NULL,
  "blockNumber" integer NOT NULL,
  "blockTimestamp" integer NOT NULL,
  "blockHash" text NOT NULL,
  "transactionHash" text NOT NULL,
  "transactionIndex" integer NOT NULL,
  "transactionFrom" text,
  "logIndex" integer NOT NULL,
  management_fee numeric NOT NULL,
  performance_fee numeric NOT NULL,
  strategist_fee numeric NOT NULL,
  duration numeric NOT NULL,
  envio_checkpoint_id bigint NOT NULL,
  envio_change "envio"."envio_history_change" NOT NULL,
  PRIMARY KEY (id, envio_checkpoint_id)
);

CREATE TABLE IF NOT EXISTS "envio"."V2WithdrawFromStrategy" (
  id text PRIMARY KEY,
  "vaultAddress" text NOT NULL,
  "chainId" integer NOT NULL,
  "blockNumber" integer NOT NULL,
  "blockTimestamp" integer NOT NULL,
  "blockHash" text NOT NULL,
  "transactionHash" text NOT NULL,
  "transactionIndex" integer NOT NULL,
  "transactionFrom" text,
  "logIndex" integer NOT NULL,
  strategy text NOT NULL,
  "totalDebt" numeric NOT NULL,
  loss numeric NOT NULL
);

CREATE TABLE IF NOT EXISTS "envio"."envio_history_V2WithdrawFromStrategy" (
  id text NOT NULL,
  "vaultAddress" text NOT NULL,
  "chainId" integer NOT NULL,
  "blockNumber" integer NOT NULL,
  "blockTimestamp" integer NOT NULL,
  "blockHash" text NOT NULL,
  "transactionHash" text NOT NULL,
  "transactionIndex" integer NOT NULL,
  "transactionFrom" text,
  "logIndex" integer NOT NULL,
  strategy text NOT NULL,
  "totalDebt" numeric NOT NULL,
  loss numeric NOT NULL,
  envio_checkpoint_id bigint NOT NULL,
  envio_change "envio"."envio_history_change" NOT NULL,
  PRIMARY KEY (id, envio_checkpoint_id)
);

CREATE TABLE IF NOT EXISTS "envio"."V2StrategyUpdateDebtRatio" (
  id text PRIMARY KEY,
  "vaultAddress" text NOT NULL,
  "chainId" integer NOT NULL,
  "blockNumber" integer NOT NULL,
  "blockTimestamp" integer NOT NULL,
  "blockHash" text NOT NULL,
  "transactionHash" text NOT NULL,
  "transactionIndex" integer NOT NULL,
  "transactionFrom" text,
  "logIndex" integer NOT NULL,
  strategy text NOT NULL,
  "debtRatio" numeric NOT NULL
);

CREATE TABLE IF NOT EXISTS "envio"."envio_history_V2StrategyUpdateDebtRatio" (
  id text NOT NULL,
  "vaultAddress" text NOT NULL,
  "chainId" integer NOT NULL,
  "blockNumber" integer NOT NULL,
  "blockTimestamp" integer NOT NULL,
  "blockHash" text NOT NULL,
  "transactionHash" text NOT NULL,
  "transactionIndex" integer NOT NULL,
  "transactionFrom" text,
  "logIndex" integer NOT NULL,
  strategy text NOT NULL,
  "debtRatio" numeric NOT NULL,
  envio_checkpoint_id bigint NOT NULL,
  envio_change "envio"."envio_history_change" NOT NULL,
  PRIMARY KEY (id, envio_checkpoint_id)
);

CREATE TABLE IF NOT EXISTS "envio"."V2StrategyUpdateMinDebtPerHarvest" (
  id text PRIMARY KEY,
  "vaultAddress" text NOT NULL,
  "chainId" integer NOT NULL,
  "blockNumber" integer NOT NULL,
  "blockTimestamp" integer NOT NULL,
  "blockHash" text NOT NULL,
  "transactionHash" text NOT NULL,
  "transactionIndex" integer NOT NULL,
  "transactionFrom" text,
  "logIndex" integer NOT NULL,
  strategy text NOT NULL,
  "minDebtPerHarvest" numeric NOT NULL
);

CREATE TABLE IF NOT EXISTS "envio"."envio_history_V2StrategyUpdateMinDebtPerHarvest" (
  id text NOT NULL,
  "vaultAddress" text NOT NULL,
  "chainId" integer NOT NULL,
  "blockNumber" integer NOT NULL,
  "blockTimestamp" integer NOT NULL,
  "blockHash" text NOT NULL,
  "transactionHash" text NOT NULL,
  "transactionIndex" integer NOT NULL,
  "transactionFrom" text,
  "logIndex" integer NOT NULL,
  strategy text NOT NULL,
  "minDebtPerHarvest" numeric NOT NULL,
  envio_checkpoint_id bigint NOT NULL,
  envio_change "envio"."envio_history_change" NOT NULL,
  PRIMARY KEY (id, envio_checkpoint_id)
);

CREATE TABLE IF NOT EXISTS "envio"."V2StrategyUpdateMaxDebtPerHarvest" (
  id text PRIMARY KEY,
  "vaultAddress" text NOT NULL,
  "chainId" integer NOT NULL,
  "blockNumber" integer NOT NULL,
  "blockTimestamp" integer NOT NULL,
  "blockHash" text NOT NULL,
  "transactionHash" text NOT NULL,
  "transactionIndex" integer NOT NULL,
  "transactionFrom" text,
  "logIndex" integer NOT NULL,
  strategy text NOT NULL,
  "maxDebtPerHarvest" numeric NOT NULL
);

CREATE TABLE IF NOT EXISTS "envio"."envio_history_V2StrategyUpdateMaxDebtPerHarvest" (
  id text NOT NULL,
  "vaultAddress" text NOT NULL,
  "chainId" integer NOT NULL,
  "blockNumber" integer NOT NULL,
  "blockTimestamp" integer NOT NULL,
  "blockHash" text NOT NULL,
  "transactionHash" text NOT NULL,
  "transactionIndex" integer NOT NULL,
  "transactionFrom" text,
  "logIndex" integer NOT NULL,
  strategy text NOT NULL,
  "maxDebtPerHarvest" numeric NOT NULL,
  envio_checkpoint_id bigint NOT NULL,
  envio_change "envio"."envio_history_change" NOT NULL,
  PRIMARY KEY (id, envio_checkpoint_id)
);

CREATE TABLE IF NOT EXISTS "envio"."V2StrategyUpdatePerformanceFee" (
  id text PRIMARY KEY,
  "vaultAddress" text NOT NULL,
  "chainId" integer NOT NULL,
  "blockNumber" integer NOT NULL,
  "blockTimestamp" integer NOT NULL,
  "blockHash" text NOT NULL,
  "transactionHash" text NOT NULL,
  "transactionIndex" integer NOT NULL,
  "transactionFrom" text,
  "logIndex" integer NOT NULL,
  strategy text NOT NULL,
  "performanceFee" numeric NOT NULL
);

CREATE TABLE IF NOT EXISTS "envio"."envio_history_V2StrategyUpdatePerformanceFee" (
  id text NOT NULL,
  "vaultAddress" text NOT NULL,
  "chainId" integer NOT NULL,
  "blockNumber" integer NOT NULL,
  "blockTimestamp" integer NOT NULL,
  "blockHash" text NOT NULL,
  "transactionHash" text NOT NULL,
  "transactionIndex" integer NOT NULL,
  "transactionFrom" text,
  "logIndex" integer NOT NULL,
  strategy text NOT NULL,
  "performanceFee" numeric NOT NULL,
  envio_checkpoint_id bigint NOT NULL,
  envio_change "envio"."envio_history_change" NOT NULL,
  PRIMARY KEY (id, envio_checkpoint_id)
);

CREATE TABLE IF NOT EXISTS "envio"."V2StrategyRemovedFromQueue" (
  id text PRIMARY KEY,
  "vaultAddress" text NOT NULL,
  "chainId" integer NOT NULL,
  "blockNumber" integer NOT NULL,
  "blockTimestamp" integer NOT NULL,
  "blockHash" text NOT NULL,
  "transactionHash" text NOT NULL,
  "transactionIndex" integer NOT NULL,
  "transactionFrom" text,
  "logIndex" integer NOT NULL,
  strategy text NOT NULL
);

CREATE TABLE IF NOT EXISTS "envio"."envio_history_V2StrategyRemovedFromQueue" (
  id text NOT NULL,
  "vaultAddress" text NOT NULL,
  "chainId" integer NOT NULL,
  "blockNumber" integer NOT NULL,
  "blockTimestamp" integer NOT NULL,
  "blockHash" text NOT NULL,
  "transactionHash" text NOT NULL,
  "transactionIndex" integer NOT NULL,
  "transactionFrom" text,
  "logIndex" integer NOT NULL,
  strategy text NOT NULL,
  envio_checkpoint_id bigint NOT NULL,
  envio_change "envio"."envio_history_change" NOT NULL,
  PRIMARY KEY (id, envio_checkpoint_id)
);

CREATE TABLE IF NOT EXISTS "envio"."V2StrategyAddedToQueue" (
  id text PRIMARY KEY,
  "vaultAddress" text NOT NULL,
  "chainId" integer NOT NULL,
  "blockNumber" integer NOT NULL,
  "blockTimestamp" integer NOT NULL,
  "blockHash" text NOT NULL,
  "transactionHash" text NOT NULL,
  "transactionIndex" integer NOT NULL,
  "transactionFrom" text,
  "logIndex" integer NOT NULL,
  strategy text NOT NULL
);

CREATE TABLE IF NOT EXISTS "envio"."envio_history_V2StrategyAddedToQueue" (
  id text NOT NULL,
  "vaultAddress" text NOT NULL,
  "chainId" integer NOT NULL,
  "blockNumber" integer NOT NULL,
  "blockTimestamp" integer NOT NULL,
  "blockHash" text NOT NULL,
  "transactionHash" text NOT NULL,
  "transactionIndex" integer NOT NULL,
  "transactionFrom" text,
  "logIndex" integer NOT NULL,
  strategy text NOT NULL,
  envio_checkpoint_id bigint NOT NULL,
  envio_change "envio"."envio_history_change" NOT NULL,
  PRIMARY KEY (id, envio_checkpoint_id)
);

CREATE TABLE IF NOT EXISTS "envio"."V2NewPendingGovernance" (
  id text PRIMARY KEY,
  "vaultAddress" text NOT NULL,
  "chainId" integer NOT NULL,
  "blockNumber" integer NOT NULL,
  "blockTimestamp" integer NOT NULL,
  "blockHash" text NOT NULL,
  "transactionHash" text NOT NULL,
  "transactionIndex" integer NOT NULL,
  "transactionFrom" text,
  "logIndex" integer NOT NULL,
  "pendingGovernance" text NOT NULL
);

CREATE TABLE IF NOT EXISTS "envio"."envio_history_V2NewPendingGovernance" (
  id text NOT NULL,
  "vaultAddress" text NOT NULL,
  "chainId" integer NOT NULL,
  "blockNumber" integer NOT NULL,
  "blockTimestamp" integer NOT NULL,
  "blockHash" text NOT NULL,
  "transactionHash" text NOT NULL,
  "transactionIndex" integer NOT NULL,
  "transactionFrom" text,
  "logIndex" integer NOT NULL,
  "pendingGovernance" text NOT NULL,
  envio_checkpoint_id bigint NOT NULL,
  envio_change "envio"."envio_history_change" NOT NULL,
  PRIMARY KEY (id, envio_checkpoint_id)
);

CREATE TABLE IF NOT EXISTS "envio"."V2UpdateRewards" (
  id text PRIMARY KEY,
  "vaultAddress" text NOT NULL,
  "chainId" integer NOT NULL,
  "blockNumber" integer NOT NULL,
  "blockTimestamp" integer NOT NULL,
  "blockHash" text NOT NULL,
  "transactionHash" text NOT NULL,
  "transactionIndex" integer NOT NULL,
  "transactionFrom" text,
  "logIndex" integer NOT NULL,
  rewards text NOT NULL
);

CREATE TABLE IF NOT EXISTS "envio"."envio_history_V2UpdateRewards" (
  id text NOT NULL,
  "vaultAddress" text NOT NULL,
  "chainId" integer NOT NULL,
  "blockNumber" integer NOT NULL,
  "blockTimestamp" integer NOT NULL,
  "blockHash" text NOT NULL,
  "transactionHash" text NOT NULL,
  "transactionIndex" integer NOT NULL,
  "transactionFrom" text,
  "logIndex" integer NOT NULL,
  rewards text NOT NULL,
  envio_checkpoint_id bigint NOT NULL,
  envio_change "envio"."envio_history_change" NOT NULL,
  PRIMARY KEY (id, envio_checkpoint_id)
);

CREATE TABLE IF NOT EXISTS "envio"."V2UpdateWithdrawalQueue" (
  id text PRIMARY KEY,
  "vaultAddress" text NOT NULL,
  "chainId" integer NOT NULL,
  "blockNumber" integer NOT NULL,
  "blockTimestamp" integer NOT NULL,
  "blockHash" text NOT NULL,
  "transactionHash" text NOT NULL,
  "transactionIndex" integer NOT NULL,
  "transactionFrom" text,
  "logIndex" integer NOT NULL,
  queue text[] NOT NULL
);

CREATE TABLE IF NOT EXISTS "envio"."envio_history_V2UpdateWithdrawalQueue" (
  id text NOT NULL,
  "vaultAddress" text NOT NULL,
  "chainId" integer NOT NULL,
  "blockNumber" integer NOT NULL,
  "blockTimestamp" integer NOT NULL,
  "blockHash" text NOT NULL,
  "transactionHash" text NOT NULL,
  "transactionIndex" integer NOT NULL,
  "transactionFrom" text,
  "logIndex" integer NOT NULL,
  queue text[] NOT NULL,
  envio_checkpoint_id bigint NOT NULL,
  envio_change "envio"."envio_history_change" NOT NULL,
  PRIMARY KEY (id, envio_checkpoint_id)
);

CREATE TABLE IF NOT EXISTS "envio"."V2TradeAddressEvent" (
  id text PRIMARY KEY,
  "tradeHandlerAddress" text NOT NULL,
  "eventName" text NOT NULL,
  "chainId" integer NOT NULL,
  "blockNumber" integer NOT NULL,
  "blockTimestamp" integer NOT NULL,
  "blockHash" text NOT NULL,
  "transactionHash" text NOT NULL,
  "transactionIndex" integer NOT NULL,
  "transactionFrom" text,
  "logIndex" integer NOT NULL,
  account text NOT NULL
);

CREATE TABLE IF NOT EXISTS "envio"."envio_history_V2TradeAddressEvent" (
  id text NOT NULL,
  "tradeHandlerAddress" text NOT NULL,
  "eventName" text NOT NULL,
  "chainId" integer NOT NULL,
  "blockNumber" integer NOT NULL,
  "blockTimestamp" integer NOT NULL,
  "blockHash" text NOT NULL,
  "transactionHash" text NOT NULL,
  "transactionIndex" integer NOT NULL,
  "transactionFrom" text,
  "logIndex" integer NOT NULL,
  account text NOT NULL,
  envio_checkpoint_id bigint NOT NULL,
  envio_change "envio"."envio_history_change" NOT NULL,
  PRIMARY KEY (id, envio_checkpoint_id)
);

DO $$
DECLARE
  history_table text;
  payload_column text;
BEGIN
  FOR history_table IN
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'envio'
      AND table_name LIKE 'envio_history_%'
      AND table_name <> 'envio_history_dynamic_contract_registry'
  LOOP
    FOR payload_column IN
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'envio'
        AND table_name = history_table
        AND column_name NOT IN ('id', 'envio_checkpoint_id', 'envio_change')
    LOOP
      EXECUTE format(
        'ALTER TABLE "envio".%I ALTER COLUMN %I DROP NOT NULL',
        history_table,
        payload_column
      );
    END LOOP;
  END LOOP;
END $$;
