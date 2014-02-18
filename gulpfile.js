/////////////////////////////////////////////////////////////////////////
// I N C L U D E S
var gulp = require('gulp');
var rimraf = require('gulp-rimraf');
var jade = require('gulp-jade'); // templates processing
var html_prettify = require('gulp-html-prettify');
var replace = require('gulp-replace');
var htmlhint = require('gulp-htmlhint');
var jshint = require('gulp-jshint'); // code validation
var sass = require('gulp-sass'); // css processing and formating
var prefix = require('gulp-autoprefixer');
var bless = require('gulp-bless');
var cssbeautify = require('gulp-cssbeautify');
var minifyCSS = require('gulp-minify-css');
var concat = require('gulp-concat'); // js formating
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var notify = require('gulp-notify'); // notification using osx native notification center

/////////////////////////////////////////////////////////////////////////
// T A S K S
// Cleaning
gulp.task('cleaning', function() {
    gulp.src('./_build/dev/_assets/_js', {read: false})
        .pipe(rimraf());

    gulp.src('./_build/dev/_assets/_css', {read: false})
        .pipe(rimraf());

    gulp.src('./_build/dev/*.html')
        .pipe(rimraf());

    gulp.src('./_build/stage/_assets/_js', {read: false})
        .pipe(rimraf());

    gulp.src('./_build/stage/_assets/_css', {read: false})
        .pipe(rimraf());

    gulp.src('./_build/stage/*.html')
        .pipe(rimraf())
        // .pipe(rimraf.reporter('default'))
        .pipe(notify({ message: 'Cleaned!' }));
});

// Template processing
gulp.task('templates', function() {
    var YOUR_LOCALS = {
        pretty: true
        // pretty: true,
        // path: './_source/*.jade'
    };

    gulp.src('./_source/*.jade')
        .pipe(jade({
            locals: YOUR_LOCALS
        }))
        .pipe(gulp.dest('./_build/stage')) // save minified to stage
        .pipe(replace(/javascript\.js/, 'javascript.min.js')) // find and replace external js file name reference
        .pipe(gulp.dest('./_build/stage'))
        .pipe(html_prettify({
            indent_char: ' ',  indent_size: 4
        }))
        .pipe(gulp.dest('./_build/dev')) // save expanded to dev
        .pipe(notify({ message: 'Templates processed!' }));

});

// Code lint
gulp.task('code_hint', function() {
    gulp.src('./_source/_js/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'));

    gulp.src('./_build/dev/*.html')
        .pipe(htmlhint())
        .pipe(htmlhint.reporter())
        .pipe(notify({ message: 'Javascript hinted!' }));
});

// css processing
gulp.task('processing', function() {
    gulp.src('./_source/_sass/*.scss')
        .pipe(sass({ // preprocessing sass files
        // noCache: true, style: 'expanded', precision: 7, debugInfo: true, lineNumbers: true
        }))
        .pipe(rename('1-preprocessed.css'))
        .pipe(gulp.dest('./_build/dev/__tmp')) // save a copy for step-by-step debugging
        .pipe(prefix())
        .pipe(rename('2-prefixed.css'))
        .pipe(gulp.dest('./_build/dev/__tmp')) // new copy for step-by-step debugging
        .pipe(rename('stylesheet.css'))
        .pipe(bless('stylesheet.css')) // good timing to bless files and prefix
        .pipe(cssbeautify({
            indent: '    ',
            openbrace: 'separate-line',
            autosemicolon: false
        }))
        .pipe(gulp.dest('./_build/dev/_assets/_css')) // saving file to dev
        .pipe(minifyCSS({
            keepSpecialComments: 1, removeEmpty: true
        }))
        .pipe(rename('stylesheet.min.css'))
        .pipe(gulp.dest('./_build/stage/_assets/_css')) // finaly we save for stage
        .pipe(notify({ message: 'CSS Sassified and post-processed!' }));
});

// Concatenate & Minify JS
gulp.task('scripts', function() {
    gulp.src('./_source/_js/*.js')
        .pipe(gulp.dest('./_build/dev/_assets/_js')) // simple copy of js files to dev
        .pipe(concat('all.js')) // concatenation, minification and save to stage
        .pipe(gulp.dest('./_build/dev/__tmp'))
        .pipe(uglify())
        .pipe(rename('javascript.min.js'))
        .pipe(gulp.dest('./_build/stage/_assets/_js'))
        .pipe(notify({ message: 'Javascript post-processed!' }));
});

// Watch files for changes
gulp.task('watch', function() {
    gulp.watch('./_source/_js/*.js', ['lint', 'scripts']);
    gulp.watch('./_source/_sass/*.scss', ['sass']);
});

// Final notification
gulp.task('notification', function() {
    gulp.src('./dev/__tmp')
        .pipe(notify({ message: 'Gulped!' }));
});

/////////////////////////////////////////////////////////////////////////
// D E F A U L T   T A S K
gulp.task('default', ['cleaning', 'templates', 'code_hint', 'processing', 'scripts', 'notification']);