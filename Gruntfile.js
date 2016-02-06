/* jshint camelcase: false */
module.exports = function(grunt) {

    grunt.loadNpmTasks('grunt-eslint');
    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-release');
    grunt.loadNpmTasks('grunt-version-check');

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        eslint: {
            main: {
                src: ['Gruntfile.js','index.js','lib/**/*.js']
            },
            test: {
                src: ['test/**/*.js'],
            }
        },
        mochaTest: {
            options: {
            },
            any: {
                src: ['test/**/*.js']
            }
        },
        versioncheck: {
            options: {
                skip: ['semver', 'npm', 'lodash'],
                hideUpToDate: false
            }
        },
    });

    grunt.registerTask('lint',    ['eslint']);
    grunt.registerTask('test',    ['mochaTest']);
    grunt.registerTask('default', ['eslint','mochaTest']);
};