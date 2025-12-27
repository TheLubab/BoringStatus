-- Custom SQL migration file, put your code below! --
SELECT create_hypertable('heartbeat', 'time');

ALTER TABLE heartbeat SET (
  timescaledb.compress = true,
  timescaledb.compress_segmentby = 'monitor_id',
  timescaledb.compress_orderby = 'time DESC'
);

SELECT add_compression_policy('heartbeat', INTERVAL '3 days');

SELECT add_retention_policy('heartbeat', INTERVAL '30 days');
