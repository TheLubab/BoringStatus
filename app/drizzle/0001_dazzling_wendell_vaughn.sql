-- Custom SQL migration file, put your code below! --
SELECT create_hypertable('heartbeat', 'time', chunk_time_interval => INTERVAL '1 day');

ALTER TABLE heartbeat SET (
  timescaledb.compress = true,
  timescaledb.compress_segmentby = 'monitor_id',
  timescaledb.compress_orderby = 'time DESC'
);

SELECT add_compression_policy('heartbeat', INTERVAL '3 days');

SELECT add_retention_policy('heartbeat', INTERVAL '90 days');
