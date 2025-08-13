import { Logger } from 'logger';
import { Instant } from 'misc';
import { RequestContext } from 'service-primitives';
export interface Throttler {
    throttle(context: RequestContext): Promise<void>;
}
export interface SimpleThrottlerOptions {
    perMinute?: number;
    perHour?: number;
}
/**
 * Fixed-window throttler. Tracks counts per 60s and/or 3600s windows.
 * Window starts are epoch ms numbers. No Date allocations in the hot path.
 */
export declare class SimpleThrottler implements Throttler {
    private readonly clock;
    private readonly logger;
    private readonly perMinute?;
    private readonly perHour?;
    private minuteWindowStartMs;
    private minuteCount;
    private hourWindowStartMs;
    private hourCount;
    constructor(clock: Instant, logger: Logger | undefined, options: SimpleThrottlerOptions);
    throttle(_context: RequestContext): Promise<void>;
}
