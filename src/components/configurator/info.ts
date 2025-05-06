// Default value for the cron expression
export const DEFAULT_CRON = "0 0 * * *";

// Description for cron expression field
export const CRON_DESCRIPTION =
  "Cron expressions are used to schedule recurring tasks. The format consists of 5 fields: minute, hour, day of month, month, day of week.";

// Description for date field
export const DATE_DESCRIPTION =
  "Specify when the job should first run. The format is [year, month, day, hour, minute, second] as comma-separated values.";

// Guide for date format
export const DATE_FORMAT_GUIDE =
  "Example: 2023, 12, 25, 8, 30, 0 for December 25, 2023 at 8:30 AM. Note: Months are zero-indexed (January = 0).";

// Accordion titles
export const CRON_REFERENCE_TITLE = "Cron Format Reference";
export const DATE_REFERENCE_TITLE = "Date Format Reference";

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
    description: "Runs at midnight every day"
  },
  {
    expression: "*/15 * * * *",
    description: "Runs every 15 minutes"
  }
];

// Date format explanation
export const DATE_FORMAT_INTRO = "The date format follows JavaScript's Date constructor parameters:";
export const DATE_FORMAT_CODE = {
  format: "// Format:",
  syntax: "new Date(year, month, day, hour, minute, second)",
  example: "// Example:",
  exampleCode: "new Date(2012, 11, 21, 5, 30, 0)",
  exampleResult: "// December 21, 2012 at 5:30:00 AM",
  note: "Note: Month is 0-indexed (0 = January, 11 = December)"
};

// Date examples
export const DATE_EXAMPLES = [
  {
    expression: "2023, 0, 1, 0, 0, 0",
    description: "January 1, 2023 at midnight"
  },
  {
    expression: "2023, 11, 31, 23, 59, 59",
    description: "December 31, 2023 at 11:59:59 PM"
  }
];
