import TestRunner from "jest-runner";

declare class GroupRunner extends TestRunner {
    static getGroups(args: string[]): {
        includeGroups: string[],
        mustIncludeGroups: string[],
        excludeGroups: string[],
        includeRegexes: string[],
        excludeRegexes: string[]
    };
    static filterTest(groups: {
        includeGroups: string[],
        mustIncludeGroups: string[],
        excludeGroups: string[],
        includeRegexes: string[],
        excludeRegexes: string[]
    }, test: any): boolean;
    runTests(tests: any, watcher: any, onStart: any, onResult: any, onFailure: any, options: any): Promise<void>;
}

export = GroupRunner;
