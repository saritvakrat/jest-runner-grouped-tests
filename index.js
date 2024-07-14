const fs = require( 'fs' );

const JestRunner = require( 'jest-runner' );
const { parse } = require( 'jest-docblock' );

const TestRunner = Object.prototype.hasOwnProperty.call( JestRunner, 'default' ) ? JestRunner.default : JestRunner;

const ARG_PREFIX = '--group=';

class GroupsRunner extends TestRunner {

	/**
	 * Parses command line arguments to identify groups to include and exclude
	 * @param args
	 * @return {{include: *[], exclude: *[]}}
	 */
	static getGroups( args ) {
		const include = [];
		const exclude = [];

		args.forEach( ( arg ) => {
			if ( arg.startsWith( ARG_PREFIX ) ) {
				const group = arg.substring( ARG_PREFIX.length );
				if ( group.startsWith( '-' ) ) {
					exclude.push( group.substring( 1 ) );
				} else {
					include.push( group );
				}
			}
		} );

		return {
			include,
			exclude,
		};
	}

	/**
	 * Filters tests based on the specified groups.
	 * @param include
	 * @param exclude
	 * @param test
	 * @return {boolean}
	 */
	static filterTest( { include, exclude }, test ) {
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
		}

		return found;
	}

	/**
	 * Overrides the default runTests method to filter tests based on groups before running them.
	 * @param tests
	 * @param watcher
	 * @param onStart
	 * @param onResult
	 * @param onFailure
	 * @param options
	 * @return {Promise<void>}
	 */
	runTests( tests, watcher, onStart, onResult, onFailure, options ) {
		const groups = GroupsRunner.getGroups( process.argv );

		groups.include.forEach( ( group ) => {
			if ( groups.exclude.includes( group ) ) {
				return;
			}

			const name = group.replace( /\W/g, '_' ).toUpperCase();
			process.env[`JEST_GROUP_${ name }`] = '1';
		} );

		return super.runTests(
			groups.include.length > 0 || groups.exclude.length > 0
				? tests.filter( ( test ) => GroupsRunner.filterTest( groups, test ) )
				: tests,
			watcher,
			onStart,
			onResult,
			onFailure,
			options,
		);
	}

}

module.exports = GroupsRunner;
