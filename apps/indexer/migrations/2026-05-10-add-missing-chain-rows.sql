INSERT INTO "envio"."envio_chains" (
  id,
  start_block,
  end_block,
  max_reorg_depth,
  buffer_block,
  source_block,
  first_event_block,
  ready_at,
  events_processed,
  _is_hyper_sync,
  progress_block
)
VALUES
  (100, 0, NULL, 200, 0, 0, NULL, NULL, 0, false, -1),
  (146, 0, NULL, 200, 0, 0, NULL, NULL, 0, false, -1),
  (80094, 0, NULL, 200, 0, 0, NULL, NULL, 0, false, -1)
ON CONFLICT (id) DO NOTHING;
