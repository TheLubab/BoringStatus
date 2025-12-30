-- Custom SQL migration file, put your code below! --

-- This pre-computes uptime and latency stats for fast dashboard queries
CREATE MATERIALIZED VIEW IF NOT EXISTS monitor_stats_hourly
WITH (timescaledb.continuous) AS
SELECT 
    monitor_id,
    time_bucket('1 hour', time) AS bucket,
    COUNT(*) AS total_checks,
    COUNT(*) FILTER (WHERE status = 'up') AS up_count,
    COUNT(*) FILTER (WHERE status = 'down') AS down_count,
    COUNT(*) FILTER (WHERE status = 'error') AS error_count,
    COUNT(*) FILTER (WHERE status = 'degraded') AS degraded_count,
    AVG(latency)::int AS avg_latency,
    MIN(latency) AS min_latency,
    MAX(latency) AS max_latency
FROM heartbeat
GROUP BY monitor_id, time_bucket('1 hour', time)
WITH NO DATA;

-- auto-refresh policy: runs every hour, processes data from 3h ago to 1h ago
SELECT add_continuous_aggregate_policy('monitor_stats_hourly',
    start_offset => INTERVAL '3 hours',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour'
);

SELECT add_retention_policy('monitor_stats_hourly', INTERVAL '2 years');

-- Index on the continuous aggregate 
CREATE INDEX IF NOT EXISTS idx_monitor_stats_hourly_monitor_bucket 
ON monitor_stats_hourly (monitor_id, bucket DESC);
