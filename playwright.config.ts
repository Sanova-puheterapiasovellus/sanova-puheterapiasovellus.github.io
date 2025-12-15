import { devices, type PlaywrightTestConfig } from "@playwright/test";

const ci = Boolean(process.env.CI);
const url = `http://localhost:${ci ? 4173 : 5173}`;

// These are essentially the defaults adapted for our use, no idea if all of the CI specific options
// actually make sense, but surely they're that way for a reason.
export default {
    // Base configuration of the test runner.
    testDir: "tests",
    fullyParallel: true,
    forbidOnly: ci,
    retries: ci ? 2 : 0,
    workers: ci ? 1 : undefined,
    reporter: ci ? "github" : "line",
    timeout: 60_000,

    // Common options for projects below.
    use: {
        baseURL: url,
        trace: "on-first-retry",
    },

    // Test on the one browser engine we install.
    // (attempting to save devcontainer and CI initialization time)
    projects: [
        {
            name: "firefox",
            use: devices["Desktop Firefox"],
        },
    ],

    // Use the preview of full release build on CI.
    webServer: {
        command: `npx vite ${ci ? "preview" : "dev"}`,
        url,
        reuseExistingServer: !ci,
    },
} satisfies PlaywrightTestConfig;
