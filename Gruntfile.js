module.exports = function (grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        clean: ['build/'],        
        typescript: {
            base: {
            src: ['ts/**/*.ts'],
            dest: 'lib',
            options: {
                    module: 'commonjs', 
                    target: 'es5',
                    sourceMap: true,
                    declaration: true
                }
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
                specNameMatcher: 'spec'
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
        },
    });

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-jsdoc');
    // grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-typescript');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-jasmine-node');
    // uglify task is producing invalid js file

    // jasmine node directly js api 
    grunt.registerTask('default', ['typescript', 'jasmine_node']);
    grunt.registerTask('doc', ['jsdoc']);
    grunt.registerTask('minify', ['uglify']);
    
};