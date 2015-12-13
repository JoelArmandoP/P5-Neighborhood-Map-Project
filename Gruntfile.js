module.exports = function(grunt) {

grunt.initConfig({
	inline: {
	    dist: {
		options:{
		    cssmin: true
		},
		src: 'src/index.html',
		dest: 'dist/index.html'
		}
	},
	uglify: {
        dist: {
			files: [{
			    expand: true,
			    src: ['*.js'],
			    cwd: 'src/js/',
			    dest: 'dist/js/'
			}, {
			    expand: true,
			    src: ['*.js'],
			    cwd: 'src/js/',
			    dest: 'dist/js/'
			}]
        }
	},
	cssmin: {
        dist: {
			files: [{
			    expand: true,
			    src: ['*.css'],
			    cwd: 'src/css/',
			    dest: 'dist/css/'
			}, {
			    expand: true,
			    src: ['*.css'],
			    cwd: 'src/css/',
				dest: 'dist/css/'
			}]
        }
	},
	htmlmin: {                                      
    	dist: {                                       
      		options: {                                  
        		removeComments: true,
        		collapseWhitespace: true
      		},
      		files: {                                    
        		'dist/index.html': 'src/index.html'
      		}
    	}
  	}
});


    grunt.loadNpmTasks('grunt-inline');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-htmlmin');
    grunt.registerTask('default', ['inline', 'uglify', 'cssmin','htmlmin']);
}
 
