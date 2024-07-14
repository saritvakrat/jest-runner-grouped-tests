const fs = require('fs');
const JestRunner = require('jest-runner');
const { parse } = require('jest-docblock');

const TestRunner = Object.prototype.hasOwnProperty.call(JestRunner, 'default') ? JestRunner.default : JestRunner;

const ARG_PREFIX = '--group=';
const REGEX_PREFIX = '--regex=';

class GroupRunner extends TestRunner {

	/**
	 * Parses command line arguments to identify groups and regexes to include and exclude.
	 *
	 * @param {string[]} args - The command line arguments.
	 * @returns {Object} An object containing includeGroups, mustIncludeGroups, excludeGroups, includeRegexes, and excludeRegexes arrays.
	 */
	static getGroups(args) {
		const includeGroups = [];
		const mustIncludeGroups = [];
		const excludeGroups = [];
		const includeRegexes = [];
		const excludeRegexes = [];

		args.forEach((arg) => {
			if (arg.startsWith(ARG_PREFIX)) {
				const group = arg.substring(ARG_PREFIX.length);
				if (group.startsWith('-')) {
					excludeGroups.push(group.substring(1));
				} else if (group.startsWith('!')) {
					mustIncludeGroups.push(group.substring(1));
				} else {
					includeGroups.push(group);
				}
			} else if (arg.startsWith(REGEX_PREFIX)) {
				const regex = arg.substring(REGEX_PREFIX.length);
				if (regex.startsWith('-')) {
					excludeRegexes.push(regex.substring(1));
				} else {
					includeRegexes.push(regex);
				}
			}
		});

		return {
			includeGroups,
			mustIncludeGroups,
			excludeGroups,
			includeRegexes,
			excludeRegexes,
		};
	}

	/**
	 * Filters tests based on specified groups and regexes.
	 *
	 * @param {Object} params - The parameters object.
	 * @param {string[]} params.includeGroups - Groups to include.
	 * @param {string[]} params.mustIncludeGroups - Groups that must be included.
	 * @param {string[]} params.excludeGroups - Groups to exclude.
	 * @param {string[]} params.includeRegexes - Regexes to include.
	 * @param {string[]} params.excludeRegexes - Regexes to exclude.
	 * @param {Object} test - The test object.
	 * @returns {boolean} True if the test should be included, false otherwise.
	 */
	static filterTest({
						  includeGroups, mustIncludeGroups, excludeGroups, includeRegexes, excludeRegexes,
					  }, test) {
		let found = includeGroups.length === 0;

		const parsed = parse(fs.readFileSync(test.path, 'utf8'));
		if (parsed.group) {
			const parsedGroup = Array.isArray(parsed.group) ? parsed.group : [parsed.group];

			for (let i = 0; i < parsedGroup.length; i++) {
				const group = parsedGroup[i];
				if (typeof group === 'string') {
					if (excludeGroups.some((g) => group.startsWith(g))) {
						found = false;
						break;
					}
					if (excludeRegexes.some((regex) => new RegExp(regex).test(group))) {
						found = false;
						break;
					}
					if (includeGroups.some((g) => group.startsWith(g))) {
						found = true;
					} else if (includeRegexes.some((regex) => new RegExp(regex).test(group))) {
						found = true;
					}
				}
			}

			if (mustIncludeGroups.some((entry) => !parsedGroup.includes(entry))) {
				found = false;
			}
		} else if (mustIncludeGroups.length > 0) {
			found = false;
		}

		return found;
	}

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
	runTests(tests, watcher, onStart, onResult, onFailure, options) {
		const groups = GroupRunner.getGroups(process.argv);

		groups.includeGroups.forEach((group) => {
			if (!groups.excludeGroups.includes(group)) {
				const name = group.replace(/\W/g, '_').toUpperCase();
				process.env[`JEST_GROUP_${name}`] = '1';
			}
		});

		return super.runTests(
			groups.includeGroups.length > 0 || groups.mustIncludeGroups.length > 0 || groups.excludeGroups.length > 0
			|| groups.includeRegexes.length > 0 || groups.excludeRegexes.length > 0
				? tests.filter((test) => GroupRunner.filterTest(groups, test))
				: tests,
			watcher,
			onStart,
			onResult,
			onFailure,
			options,
		);
	}
}

module.exports = GroupRunner;
