module.exports = function (grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        clean: ['build/'],
        typescript: {
            base: {
                src: ['src/**/*.ts'],
                dest: 'lib',
                options: {
                    module: 'commonjs',
                    target: 'es5',
                    declaration: true
                }
            }
        },
        copy: {
            main: {
                files: [
                    {
                        src: ["build/**/*.js*", "build/**/*.d.ts"],
                        dest: "lib/",
                        flatten: true,
                        expand: true
                    }
                ]
            }
        },
        typescript_export: {
            your_target: {
                src: ['build/*.d.ts'],
                dest: 'build/index.d.ts'
            },
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
                    { src: 'lib/adal-angular.js', dest: 'build/adal-angular.min.js' },
                ],
            }
        }
    });

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-jsdoc');
    // grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-typescript');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-jasmine-node');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-typescript-export');
    // uglify task is producing invalid js file

    // jasmine node directly js api 
    grunt.registerTask('default', ['typescript', 'copy' ,'jasmine_node']);
    grunt.registerTask('doc', ['typescript', 'copy', 'jsdoc']);
    grunt.registerTask('minify', ['uglify']);

};