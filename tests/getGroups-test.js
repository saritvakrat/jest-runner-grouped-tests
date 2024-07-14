const docblock = require( 'jest-docblock' );
const { getGroups, filterTest } = require( '../index' );

jest.mock( 'fs' );
jest.mock( 'jest-docblock' );

describe( 'test getGroups', () => {
    it( 'resolves "includes"', () => {
        const groups = getGroups( ['--group=include/me', '--group=include/me2'] );

        expect( groups.include ).toEqual( ['include/me', 'include/me2'] );
    } );

    it( 'resolves "excludes"', () => {
        const groups = getGroups( ['--group=-exclude/me', '--group=-exclude/me2'] );

        expect( groups.exclude ).toEqual( ['exclude/me', 'exclude/me2'] );
    } );

    it( 'resolves "mustIncludes"', () => {
        const groups = getGroups( ['--group=!mustIncludes/me', '--group=!mustIncludes/me2'] );

        expect( groups.mustInclude ).toEqual( ['mustIncludes/me', 'mustIncludes/me2'] );
    } );
} );

describe( 'test filterTest', () => {
    const testFile = { path: 'test.js' };
    it( 'should include result if all mustInclude are present', () => {
        docblock.parse.mockReturnValue( { group: ['test1', 'test2'] } );

        const groups = { include: [], exclude: [], mustInclude: ['test1', 'test2'] };

        expect( filterTest( groups, testFile ) ).toBeTruthy();
    } );

    it( 'should not include result if only some mustInclude groups are present', () => {
        docblock.parse.mockReturnValue( { group: ['test1'] } );

        const groups = { include: [], exclude: [], mustInclude: ['test1', 'test2'] };

        expect( filterTest( groups, testFile ) ).toBeFalsy();
    } );

    it( 'should include empty if no groups defined', () => {
        docblock.parse.mockReturnValue( { group: [] } );

        const groups = { include: [], exclude: [], mustInclude: [] };

        expect( filterTest( groups, testFile ) ).toBeTruthy();
    } );

    it( 'should include non-empty if no groups defined', () => {
        docblock.parse.mockReturnValue( { group: ['test1'] } );

        const groups = { include: [], exclude: [], mustInclude: [] };

        expect( filterTest( groups, testFile ) ).toBeTruthy();
    } );

    it( 'includes result by "include" rule', () => {
        docblock.parse.mockReturnValue( { group: ['test1'] } );

        const groups = { include: ['test1'], exclude: [], mustInclude: [] };

        expect( filterTest( groups, testFile ) ).toBeTruthy();
    } );

    it( 'removes result by "include" rule', () => {
        docblock.parse.mockReturnValue( { group: ['test1'] } );

        const groups = { include: ['test2'], exclude: [], mustInclude: [] };

        expect( filterTest( groups, testFile ) ).toBeFalsy();
    } );

    it( 'includes result by "exclude" rule', () => {
        docblock.parse.mockReturnValue( { group: ['test1'] } );

        const groups = { include: [], exclude: ['test2'], mustInclude: [] };

        expect( filterTest( groups, testFile ) ).toBeTruthy();
    } );

    it( 'includes result by "exclude" rule', () => {
        docblock.parse.mockReturnValue( { group: ['test1'] } );

        const groups = { include: [], exclude: ['test1'], mustInclude: [] };

        expect( filterTest( groups, testFile ) ).toBeFalsy();
    } );
} );
