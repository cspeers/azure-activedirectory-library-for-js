/// <binding AfterBuild='default' />
module.exports = function (grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        clean: {
            build: ['build'],
            lib: ['lib/**/*.*'],
            src: ['src/**/*.js', 'src/**/*.*map']
        },
        ts: {
            default: {
                src: ["src/adal.ts", "src/adal-angular.ts"],
                tsconfig: true
            }
        },
        tslint: {
            options: {
                configuration: "tslint.json"
            },
            files: {
                src:["src/*.ts"]
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
        jshint: {
            src: {
                options: {
                    jshintrc: '.jshintrc'
                },
                src: ['lib/*.js']
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
        },
    });

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-jsdoc');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-ts');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-jasmine-node');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-karma');
    grunt.loadNpmTasks("grunt-tslint");
    // uglify task is producing invalid js file

    // jasmine node directly js api 
    grunt.registerTask('default', ['clean','tslint','ts','jasmine_node']);
    grunt.registerTask('angular', ['clean', 'tslint', 'ts', 'karma']);
    grunt.registerTask('e2e',["clean","ts",'karma','jasmine_node']);
    grunt.registerTask('lint', ['clean',"tslint"]);
    grunt.registerTask('doc', ['tslint','ts','jsdoc']);
    grunt.registerTask('minify', ['uglify']);
    grunt.registerTask('dist',['clean','tslint','ts','jsdoc']);
};