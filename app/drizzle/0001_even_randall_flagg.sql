SELECT create_hypertable('heartbeat', 'time');

ALTER TABLE heartbeat SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'monitor_id'
  timescaledb.compress_orderby = 'time DESC'
);

SELECT add_compression_policy('heartbeat', INTERVAL '3 days');

SELECT add_retention_policy('heartbeats', INTERVAL '30 days');
