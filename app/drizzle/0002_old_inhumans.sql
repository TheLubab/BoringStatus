--################
-- Hourly Data
-- For 24-hour dashboard charts, "Last 7 Days" views...
--################
CREATE MATERIALIZED VIEW monitor_stats_hourly
WITH (timescaledb.continuous) AS
SELECT 
    monitor_id,
    time_bucket(INTERVAL '1 hour', time) AS bucket,

    COUNT(*) AS total_checks,

    COUNT(*) FILTER (WHERE status = 'up') AS up_count,
    COUNT(*) FILTER (WHERE status = 'down') AS down_count,
    COUNT(*) FILTER (WHERE status = 'error') AS error_count,
    COUNT(*) FILTER (WHERE status = 'degraded') AS degraded_count,

		-- percentile is prefered if timescaledb-toolkit is installed
		-- percentile_agg(latency) AS latency_percentiles

    AVG(latency)::int AS avg_latency,
    MIN(latency) AS min_latency,
    MAX(latency) AS max_latency
FROM heartbeat
GROUP BY monitor_id, bucket
WITH NO DATA;


-- We may need to enable this if we have too many monitors
ALTER MATERIALIZED VIEW monitor_stats_hourly SET (timescaledb.materialized_only = false);

-- runs every 5 minutes, processes data from 6h ago to almost present
SELECT add_continuous_aggregate_policy('monitor_stats_hourly',
    start_offset => INTERVAL '6 hours',
    end_offset => INTERVAL '2 minutes',
    schedule_interval => INTERVAL '5 minutes'
);

-- enable compression on rows older than 7 days
ALTER MATERIALIZED VIEW monitor_stats_hourly SET (
  timescaledb.compress = true,
  timescaledb.compress_segmentby = 'monitor_id',
  timescaledb.compress_orderby = 'bucket DESC'
);
SELECT add_compression_policy('monitor_stats_hourly', INTERVAL '7 days');

-- keep for 90 days
SELECT add_retention_policy('monitor_stats_hourly', INTERVAL '90 days');

CREATE INDEX idx_monitor_stats_hourly_composite 
ON monitor_stats_hourly (monitor_id, bucket DESC);

--################
-- Daily Data
-- For monthly uptime reports
--################
CREATE MATERIALIZED VIEW monitor_stats_daily
WITH (timescaledb.continuous) AS
SELECT 
    monitor_id,
    time_bucket(INTERVAL '1 day', time) AS bucket,

    COUNT(*) AS total_checks,

    COUNT(*) FILTER (WHERE status = 'up') AS up_count,
    COUNT(*) FILTER (WHERE status = 'down') AS down_count,
    COUNT(*) FILTER (WHERE status = 'error') AS error_count,
    COUNT(*) FILTER (WHERE status = 'degraded') AS degraded_count,

		-- percentile is prefered if timescaledb-toolkit is installed
		-- percentile_agg(latency) AS latency_percentiles

    AVG(latency)::int AS avg_latency,
    MIN(latency) AS min_latency,
    MAX(latency) AS max_latency
FROM heartbeat
GROUP BY monitor_id, bucket
WITH NO DATA;

-- runs every 1 hour, processes data from 10 day ago to today
SELECT add_continuous_aggregate_policy('monitor_stats_daily',
    start_offset => INTERVAL '10 days',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour'
);

-- compress rows older than 30 days
ALTER MATERIALIZED VIEW monitor_stats_daily SET (
  timescaledb.compress = true,
  timescaledb.compress_segmentby = 'monitor_id'
);
SELECT add_compression_policy('monitor_stats_daily', INTERVAL '30 days');

-- retain for 2 years
SELECT add_retention_policy('monitor_stats_daily', INTERVAL '2 years');

CREATE INDEX idx_monitor_stats_daily_composite 
ON monitor_stats_daily (monitor_id, bucket DESC);

--################
-- Yearly Data
-- Kinda useless, so skip
--################
