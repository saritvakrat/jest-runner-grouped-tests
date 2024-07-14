const fs = require( 'fs' );

const JestRunner = require( 'jest-runner' );
const { parse } = require( 'jest-docblock' );

const TestRunner = Object.prototype.hasOwnProperty.call( JestRunner, 'default' ) ? JestRunner.default : JestRunner;

const ARG_PREFIX = '--group=';

class GroupRunner extends TestRunner {

	/**
	 * Parses command line arguments to identify groups and regexes to include and exclude.
	 *
	 * @param {string[]} args - The command line arguments.
	 * @returns {Object} An object containing includeGroups, mustIncludeGroups, excludeGroups, includeRegexes, and excludeRegexes arrays.
	 */
	static getGroups( args ) {
		const include = [];
		const mustInclude = [];
		const exclude = [];

		args.forEach( ( arg ) => {
			if ( arg.startsWith( ARG_PREFIX ) ) {
				const group = arg.substring( ARG_PREFIX.length );
				if ( group.startsWith( '-' ) ) {
					exclude.push( group.substring( 1 ) );
				} else if ( group.startsWith( '!' ) ) {
					mustInclude.push( group.substring( 1 ) );
				} else {
					include.push( group );
				}
			}
		} );

		return {
			include,
			exclude,
			mustInclude,
		};
	}

	/**
	 * Filters tests based on specified groups and regexes.
	 *
	 * @param {Object} params - The parameters object.
	 * @param {string[]} params.includeGroups - Groups to include.
	 * @param {string[]} params.mustIncludeGroups - Groups that must be included.
	 * @param {string[]} params.excludeGroups - Groups to exclude.
	 * @param {Object} test - The test object.
	 * @returns {boolean} True if the test should be included, false otherwise.
	 */
	static filterTest( { include, exclude, mustInclude }, test ) {
		let found = include.length === 0;

		const parsed = parse( fs.readFileSync( test.path, 'utf8' ) );
		if ( parsed.group ) {
			const parsedGroup = Array.isArray( parsed.group ) ? parsed.group : [parsed.group];
			for ( let i = 0, len = parsedGroup.length; i < len; i++ ) {
				if ( typeof parsedGroup[i] === 'string' ) {
					if ( exclude.find( ( group ) => parsedGroup[i].startsWith( group ) ) ) {
						found = false;
						break;
					}

					if ( include.find( ( group ) => parsedGroup[i].startsWith( group ) ) ) {
						found = true;
					}
				}
			}

			if ( mustInclude.some( ( entry ) => !parsedGroup.includes( entry ) ) ) {
				found = false;
			}
		} else if ( mustInclude.length > 0 ) {
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
	runTests( tests, watcher, onStart, onResult, onFailure, options ) {
		const groups = GroupRunner.getGroups( process.argv );

		groups.include.forEach( ( group ) => {
			if ( groups.exclude.includes( group ) ) {
				return;
			}

			const name = group.replace( /\W/g, '_' ).toUpperCase();
			process.env[`JEST_GROUP_${ name }`] = '1';
		} );

		return super.runTests(
			groups.include.length > 0 || groups.exclude.length > 0 || groups.mustInclude.length > 0
				? tests.filter( ( test ) => GroupRunner.filterTest( groups, test ) )
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
