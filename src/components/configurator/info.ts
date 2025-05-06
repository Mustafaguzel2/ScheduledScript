// Default value for the cron expression
export const DEFAULT_CRON = "0 0 * * *";
// Description for cron expression field
export const CRON_DESCRIPTION =
  "Cron expressions are used to schedule recurring tasks.";
// Accordion titles
export const CRON_REFERENCE_TITLE = "Cron Format Reference";
// Cron format explanation
export const CRON_FORMAT_INTRO = "The cron format consists of:";
export const CRON_FORMAT_DIAGRAM = `*    *    *    *    *    *
┬    ┬    ┬    ┬    ┬    ┬
│    │    │    │    │    └── day of week (0 - 7) (0 or 7 is Sun)
│    │    │    │    └────── month (1 - 12)
│    │    │    └────────── day of month (1 - 31)
│    │    └────────────── hour (0 - 23)
│    └────────────────── minute (0 - 59)
└────────────────────── second (0 - 59, OPTIONAL)`;
// Cron examples
export const CRON_EXAMPLES = [
  {
    expression: "0 0 * * *",
    description: "Runs at midnight every day",
  },
  {
    expression: "*/15 * * * *",
    description: "Runs every 15 minutes",
  },
];
