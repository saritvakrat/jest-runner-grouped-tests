// jest-runner-groups.d.ts
import TestRunner from 'jest-runner';

declare class GroupRunner extends TestRunner {
    /**
     * Parses command line arguments to identify groups and regexes to include and exclude.
     *
     * @param {string[]} args - The command line arguments.
     * @returns {Object} An object containing includeGroups, mustIncludeGroups, excludeGroups, includeRegexes, and excludeRegexes arrays.
     */
    static getGroups(args: string[]): { include: string[], mustInclude: string[], exclude: string[] };

    /**
     * Filters tests based on specified groups and regexes.
     *
     * @param {Object} params - The parameters object.
     * @param {string[]} params.include - Groups to include.
     * @param {string[]} params.mustInclude - Groups that must be included.
     * @param {string[]} params.exclude - Groups to exclude.
     * @param {Object} test - The test object.
     * @returns {boolean} True if the test should be included, false otherwise.
     */
    static filterTest(params: { include: string[], mustInclude: string[], exclude: string[] }, test: any): boolean;

    /**
     * Runs all Jest tests after modifying process arguments with groups.
     *
     * @param {Object[]} tests - The list of tests to run.
     * @param {Object} watcher - Jest's test watcher.
     * @param {Function} onStart - Callback for when a test starts.
     * @param {Function} onResult - Callback for when a test result is received.
     * @param {Function} onFailure - Callback for when a test fails.
     * @param {Object} options - Additional options for running the tests.
     * @returns {Promise<void>} A promise that resolves when tests have completed running.
     */
    runTests(tests: any[], watcher: any, onStart: (test: any) => void, onResult: (test: any, result: any) => void, onFailure: (test: any, error: any) => void, options: any): Promise<void>;
}

export = GroupRunner;
