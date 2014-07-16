module.exports = function(grunt) {
    // Sources used to build this:
    // http://www.brianchu.com/blog/2013/07/11/grunt-by-example-a-tutorial-for-javascripts-task-runner/
    // http://gruntjs.com/getting-started

    var src_files = ['lib/*.js', 'src/julia.js', 'src/views/*.js'];
    // All upfront config goes in a massive nested object.
    grunt.initConfig({
        // read package configuration
        pkg: grunt.file.readJSON('package.json'),

        // Grunt tasks are associated with specific properties.
        // these names generally match their npm package name.
        concat: {
            options: {
                separator: ';\n',
            },
            // Concatenate all files in julia and stick them in dist.
            // TODO: eventually, minify these (not now!)
            dist: {
                src: src_files,
                dest: 'dist/julia.js'
            }
        },

        watch: {
            files: src_files,
            tasks: ['default']
        }

    });

    // Load the plugin that provides the 'concat' task
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-watch');

    // register a default task. Runs concat:dist if you just run 'grunt' from command line.

    grunt.registerTask('default', ['concat:dist']);
};
