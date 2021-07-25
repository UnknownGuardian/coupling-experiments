/**
 * In traditional Quartermaster simulations, 1 tick can be considered 1ms. 
 * In this case, our services respond in low double digit ticks. Quartermaster
 * occasionally adds some tick delay as events move between stages, and this
 * behavior can contribute to a significant amount of error with our low tick
 * response times. To combat this, we use TICK_DILATION to let 100 ticks be 
 * considered 1 ms. Any error induced by Quartermaster will be negligible now
 * since stage response time has moved from ~10-40 ticks to 1000 to 4000 ticks.
 * 
 * TICK_DILATION is not used internally by Quartermaster. Our custom stages 
 * and scenarios use this.
 */
export const TICK_DILATION = 10;

/**
 * The frequency of statistic sampling from the simulation. 500 ticks can be
 * considered to be 0.5 seconds. We include TICK_DILATION to be agnostic of
 * the actual resolution (how much time a tick represents).
 */
export const SAMPLE_DURATION = 500 * TICK_DILATION;