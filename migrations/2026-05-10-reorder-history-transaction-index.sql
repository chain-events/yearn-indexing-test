DO $$
DECLARE
  entity_table text;
  history_table text;
  temp_table text;
  entity_columns text;
  history_columns text;
  select_columns text;
BEGIN
  FOR history_table IN
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'envio'
      AND table_name LIKE 'envio_history_%'
      AND table_name <> 'envio_history_dynamic_contract_registry'
  LOOP
    entity_table := substring(history_table FROM length('envio_history_') + 1);

    IF to_regclass(format('envio.%I', entity_table)) IS NULL THEN
      CONTINUE;
    END IF;

    SELECT string_agg(
      format(
        '%I %s%s',
        a.attname,
        format_type(a.atttypid, a.atttypmod),
        CASE WHEN a.attname = 'id' THEN ' NOT NULL' ELSE '' END
      ),
      ', '
      ORDER BY a.attnum
    )
    INTO entity_columns
    FROM pg_attribute a
    WHERE a.attrelid = format('envio.%I', entity_table)::regclass
      AND a.attnum > 0
      AND NOT a.attisdropped;

    SELECT string_agg(format('%I', a.attname), ', ' ORDER BY a.attnum)
    INTO history_columns
    FROM pg_attribute a
    WHERE a.attrelid = format('envio.%I', entity_table)::regclass
      AND a.attnum > 0
      AND NOT a.attisdropped;

    SELECT string_agg(format('old.%I', a.attname), ', ' ORDER BY a.attnum)
    INTO select_columns
    FROM pg_attribute a
    WHERE a.attrelid = format('envio.%I', entity_table)::regclass
      AND a.attnum > 0
      AND NOT a.attisdropped;

    temp_table := history_table || '__reordered';

    EXECUTE format('DROP TABLE IF EXISTS "envio".%I', temp_table);
    EXECUTE format(
      'CREATE TABLE "envio".%I (%s, envio_checkpoint_id bigint NOT NULL, envio_change "envio"."envio_history_change" NOT NULL, PRIMARY KEY (id, envio_checkpoint_id))',
      temp_table,
      entity_columns
    );

    EXECUTE format(
      'INSERT INTO "envio".%I (%s, envio_checkpoint_id, envio_change) SELECT %s, old.envio_checkpoint_id, old.envio_change FROM "envio".%I old',
      temp_table,
      history_columns,
      select_columns,
      history_table
    );

    EXECUTE format('DROP TABLE "envio".%I', history_table);
    EXECUTE format('ALTER TABLE "envio".%I RENAME TO %I', temp_table, history_table);
  END LOOP;
END $$;
