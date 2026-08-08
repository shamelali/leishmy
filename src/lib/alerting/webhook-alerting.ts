import { WebhookRetryService } from "@/lib/webhook-retry";

/**
 * Alerting service for webhook retry system
 */
export class WebhookAlertingService {
  /**
   * Check if dead letter queue exceeds threshold and send alert if needed
   * 
   * @param threshold The number of dead letter items that triggers an alert
   * @returns Object with alert status and details
   */
  static async checkDeadLetterQueueThreshold(threshold: number = 10) {
    try {
      const deadLetterCount = await WebhookRetryService.getDeadLetterCount();
      
      if (deadLetterCount >= threshold) {
        // In a real implementation, this would send an email, Slack message, etc.
        // For now, we'll just log it and return the alert information
        console.warn(`[Webhook Alert] Dead letter queue threshold exceeded: ${deadLetterCount} items (threshold: ${threshold})`);
        
        return {
          alertTriggered: true,
          deadLetterCount,
          threshold,
          message: `Dead letter queue threshold exceeded: ${deadLetterCount} items`,
          timestamp: new Date().toISOString()
        };
      } else {
        return {
          alertTriggered: false,
          deadLetterCount,
          threshold,
          message: `Dead letter queue within normal limits: ${deadLetterCount} items`,
          timestamp: new Date().toISOString()
        };
      }
    } catch (error) {
      console.error("Error checking dead letter queue threshold:", error);
      return {
        alertTriggered: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Check if retry scheduled queue exceeds threshold and send alert if needed
   * 
   * @param threshold The number of retry scheduled items that triggers an alert
   * @returns Object with alert status and details
   */
  static async checkRetryScheduledQueueThreshold(threshold: number = 100) {
    try {
      const retryScheduledCount = await WebhookRetryService.getRetryScheduledCount();
      
      if (retryScheduledCount >= threshold) {
        // In a real implementation, this would send an email, Slack message, etc.
        // For now, we'll just log it and return the alert information
        console.warn(`[Webhook Alert] Retry scheduled queue threshold exceeded: ${retryScheduledCount} items (threshold: ${threshold})`);
        
        return {
          alertTriggered: true,
          retryScheduledCount,
          threshold,
          message: `Retry scheduled queue threshold exceeded: ${retryScheduledCount} items`,
          timestamp: new Date().toISOString()
        };
      } else {
        return {
          alertTriggered: false,
          retryScheduledCount,
          threshold,
          message: `Retry scheduled queue within normal limits: ${retryScheduledCount} items`,
          timestamp: new Date().toISOString()
        };
      }
    } catch (error) {
      console.error("Error checking retry scheduled queue threshold:", error);
      return {
        alertTriggered: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get current dead letter queue status
   */
  static async getDeadLetterQueueStatus() {
    try {
      const [deadLetterCount, retryScheduledCount] = await Promise.all([
        WebhookRetryService.getDeadLetterCount(),
        WebhookRetryService.getRetryScheduledCount()
      ]);
      
      return {
        deadLetterCount,
        retryScheduledCount,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error("Error getting dead letter queue status:", error);
      return {
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Check overall webhook retry system health
   * 
   * @param deadLetterThreshold Threshold for dead letter queue alerts
   * @param retryScheduledThreshold Threshold for retry scheduled queue alerts
   * @returns Object with health status and details
   */
  static async checkSystemHealth(
    deadLetterThreshold: number = 10,
    retryScheduledThreshold: number = 100
  ) {
    try {
      const [deadLetterCount, retryScheduledCount] = await Promise.all([
        WebhookRetryService.getDeadLetterCount(),
        WebhookRetryService.getRetryScheduledCount()
      ]);
      
      let status: "healthy" | "degraded" | "unhealthy" = "healthy";
      let message = "Webhook retry system is operating normally";
      const alerts: Array<{
        type: string;
        message: string;
        count: number;
        threshold: number;
      }> = [];
      
      // Check dead letter queue
      if (deadLetterCount >= deadLetterThreshold) {
        status = "degraded";
        alerts.push({
          type: "dead_letter_queue",
          message: `Dead letter queue threshold exceeded: ${deadLetterCount} items`,
          count: deadLetterCount,
          threshold: deadLetterThreshold
        });
      }
      
      // Check retry scheduled queue
      if (retryScheduledCount >= retryScheduledThreshold) {
        if (status === "healthy") status = "degraded";
        alerts.push({
          type: "retry_scheduled_queue",
          message: `Retry scheduled queue threshold exceeded: ${retryScheduledCount} items`,
          count: retryScheduledCount,
          threshold: retryScheduledThreshold
        });
      }
      
      // If we have alerts but haven't degraded status yet, set to degraded
      if (alerts.length > 0 && status === "healthy") {
        status = "degraded";
      }
      
      if (alerts.length > 0 && status === "degraded") {
        message = `Webhook retry system has ${alerts.length} issue(s) requiring attention`;
      }
      
      return {
        status,
        message,
        deadLetterCount,
        retryScheduledCount,
        alerts,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error("Error checking webhook retry system health:", error);
      return {
        status: "unhealthy",
        message: "Failed to check webhook retry system health",
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      };
    }
  }
}