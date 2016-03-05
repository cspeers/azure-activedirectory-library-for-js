module.exports = function (grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        clean: {
            build: ['build'],
            lib: ['lib/**/*.js', 'lib/**/*.d.ts', 'lib/**/*.*map'],
            src: ['src/**/*.js', 'src/**/*.d.ts', 'src/**/*.*map']
        },
        ts: {
            default: {
                src: ["src/**/*.ts"],
                tsconfig: true
            }
        },
        karma: {
            unit: {
                configFile: 'karma.conf.js'
            }
        },
        jsdoc: {
            dist: {
                src: ['lib/*.js'],
                options: {
                    destination: 'doc'
                }
            }
        },
        jasmine_node: {
            options: {
                forceExit: true,
                match: '.',
                matchall: false,
                extensions: 'js',
                specNameMatcher: 'spec',
                jUnit: {
                    report: true,
                    savePath: "./build/reports/jasmine/",
                    useDotNotation: true,
                    consolidate: true
                }
            },
            all: ['tests/unit/spec/']
        },
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> v<%= pkg.version %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            static_mappings: {
                // Because these src-dest file mappings are manually specified, every
                // time a new file is added or removed, the Gruntfile has to be updated.
                files: [
                    { src: 'lib/adal.js', dest: 'build/adal.min.js' },
                    { src: 'lib/adal-angular.js', dest: 'build/adal-angular.min.js' }
                ]
            }
        }
    });

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-jsdoc');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-ts');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-jasmine-node');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-karma');
    // uglify task is producing invalid js file

    // jasmine node directly js api 
    grunt.registerTask('default', ['clean', 'ts', 'jasmine_node']);
    grunt.registerTask('angular', ['clean', 'ts', 'karma']);
    grunt.registerTask('doc', ['clean', 'ts', 'jsdoc']);
    grunt.registerTask('minify', ['uglify']);

};