"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleThrottler = void 0;
const logger_1 = require("logger");
const misc_1 = require("misc");
/**
 * Fixed-window throttler. Tracks counts per 60s and/or 3600s windows.
 * Window starts are epoch ms numbers. No Date allocations in the hot path.
 */
class SimpleThrottler {
    clock;
    logger;
    perMinute;
    perHour;
    minuteWindowStartMs;
    minuteCount = 0;
    hourWindowStartMs;
    hourCount = 0;
    constructor(clock, logger = (0, logger_1.createDefaultLogger)('info'), options) {
        this.clock = clock;
        this.logger = logger;
        const { perMinute, perHour } = options;
        const minuteValid = perMinute !== undefined && perMinute >= 1;
        const hourValid = perHour !== undefined && perHour >= 1;
        if (!minuteValid && !hourValid) {
            throw new Error('Throttler must have at least one limit (perMinute or perHour) defined and positive.');
        }
        this.perMinute = perMinute;
        this.perHour = perHour;
        const now = misc_1.Instant.now().epochMs();
        this.minuteWindowStartMs = now;
        this.hourWindowStartMs = now;
    }
    async throttle(_context) {
        const now = misc_1.Instant.now().epochMs();
        if (this.perMinute != null) {
            const elapsed = now - this.minuteWindowStartMs;
            if (elapsed >= 60_000) {
                this.minuteWindowStartMs = now;
                this.minuteCount = 0;
            }
            this.minuteCount += 1;
            if (this.minuteCount > this.perMinute) {
                throw new Error(`Rate limit exceeded: more than ${this.perMinute} requests per minute`);
            }
        }
        if (this.perHour != null) {
            const elapsed = now - this.hourWindowStartMs;
            if (elapsed >= 3_600_000) {
                this.hourWindowStartMs = now;
                this.hourCount = 0;
            }
            this.hourCount += 1;
            if (this.hourCount > this.perHour) {
                throw new Error(`Rate limit exceeded: more than ${this.perHour} requests per hour`);
            }
        }
    }
}
exports.SimpleThrottler = SimpleThrottler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGhyb3R0bGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidGhyb3R0bGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLG1DQUFvRDtBQUNwRCwrQkFBOEI7QUFZOUI7OztHQUdHO0FBQ0gsTUFBYSxlQUFlO0lBVVA7SUFDQTtJQVZGLFNBQVMsQ0FBUztJQUNsQixPQUFPLENBQVM7SUFFekIsbUJBQW1CLENBQVE7SUFDM0IsV0FBVyxHQUFHLENBQUMsQ0FBQTtJQUNmLGlCQUFpQixDQUFRO0lBQ3pCLFNBQVMsR0FBRyxDQUFDLENBQUE7SUFFckIsWUFDbUIsS0FBYyxFQUNkLFNBQWlCLElBQUEsNEJBQW1CLEVBQUMsTUFBTSxDQUFDLEVBQzdELE9BQStCO1FBRmQsVUFBSyxHQUFMLEtBQUssQ0FBUztRQUNkLFdBQU0sR0FBTixNQUFNLENBQXNDO1FBRzdELE1BQU0sRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLEdBQUcsT0FBTyxDQUFBO1FBRXRDLE1BQU0sV0FBVyxHQUFHLFNBQVMsS0FBSyxTQUFTLElBQUksU0FBUyxJQUFJLENBQUMsQ0FBQTtRQUM3RCxNQUFNLFNBQVMsR0FBRyxPQUFPLEtBQUssU0FBUyxJQUFJLE9BQU8sSUFBSSxDQUFDLENBQUE7UUFDdkQsSUFBSSxDQUFDLFdBQVcsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO1lBQy9CLE1BQU0sSUFBSSxLQUFLLENBQUMscUZBQXFGLENBQUMsQ0FBQTtRQUN4RyxDQUFDO1FBRUQsSUFBSSxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUE7UUFDMUIsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUE7UUFFdEIsTUFBTSxHQUFHLEdBQUcsY0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDLE9BQU8sRUFBRSxDQUFBO1FBQ25DLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxHQUFHLENBQUE7UUFDOUIsSUFBSSxDQUFDLGlCQUFpQixHQUFHLEdBQUcsQ0FBQTtJQUM5QixDQUFDO0lBRUQsS0FBSyxDQUFDLFFBQVEsQ0FBQyxRQUF3QjtRQUNyQyxNQUFNLEdBQUcsR0FBRyxjQUFPLENBQUMsR0FBRyxFQUFFLENBQUMsT0FBTyxFQUFFLENBQUE7UUFFbkMsSUFBSSxJQUFJLENBQUMsU0FBUyxJQUFJLElBQUksRUFBRSxDQUFDO1lBQzNCLE1BQU0sT0FBTyxHQUFHLEdBQUcsR0FBRyxJQUFJLENBQUMsbUJBQW1CLENBQUE7WUFDOUMsSUFBSSxPQUFPLElBQUksTUFBTSxFQUFFLENBQUM7Z0JBQ3RCLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxHQUFHLENBQUE7Z0JBQzlCLElBQUksQ0FBQyxXQUFXLEdBQUcsQ0FBQyxDQUFBO1lBQ3RCLENBQUM7WUFDRCxJQUFJLENBQUMsV0FBVyxJQUFJLENBQUMsQ0FBQTtZQUNyQixJQUFJLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUN0QyxNQUFNLElBQUksS0FBSyxDQUFDLGtDQUFrQyxJQUFJLENBQUMsU0FBUyxzQkFBc0IsQ0FBQyxDQUFBO1lBQ3pGLENBQUM7UUFDSCxDQUFDO1FBRUQsSUFBSSxJQUFJLENBQUMsT0FBTyxJQUFJLElBQUksRUFBRSxDQUFDO1lBQ3pCLE1BQU0sT0FBTyxHQUFHLEdBQUcsR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUE7WUFDNUMsSUFBSSxPQUFPLElBQUksU0FBUyxFQUFFLENBQUM7Z0JBQ3pCLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxHQUFHLENBQUE7Z0JBQzVCLElBQUksQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFBO1lBQ3BCLENBQUM7WUFDRCxJQUFJLENBQUMsU0FBUyxJQUFJLENBQUMsQ0FBQTtZQUNuQixJQUFJLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNsQyxNQUFNLElBQUksS0FBSyxDQUFDLGtDQUFrQyxJQUFJLENBQUMsT0FBTyxvQkFBb0IsQ0FBQyxDQUFBO1lBQ3JGLENBQUM7UUFDSCxDQUFDO0lBQ0gsQ0FBQztDQUNGO0FBekRELDBDQXlEQyJ9