/////////////////////////////////////////////////////////////////////////
// I N C L U D E S
var gulp = require('gulp');
var rimraf = require('gulp-rimraf');
var jade = require('gulp-jade'); // templates processing
var html_prettify = require('gulp-html-prettify');
var replace = require('gulp-replace');
var htmlhint = require('gulp-htmlhint');
var jshint = require('gulp-jshint'); // code validation
var sass = require('gulp-ruby-sass'); // css processing and formating
var prefix = require('gulp-autoprefixer');
var bless = require('gulp-bless');
var cssbeautify = require('gulp-cssbeautify');
var minifyCSS = require('gulp-minify-css');
var concat = require('gulp-concat'); // js formating
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');

/////////////////////////////////////////////////////////////////////////
// T A S K S
// Templates cleaning
gulp.task('tpl-cleaning', function() {
    var tmpl_cleaning = gulp.src(['./_build/dev/*.html', './_build/stage/*.html'], {read: false})
        .pipe(rimraf());
    return tmpl_cleaning;
});
// JS cleaning
gulp.task('js-cleaning', function() {
    var js_cleaning = gulp.src(['./_build/dev/_assets/_js', './_build/stage/_assets/_js'], {read: false})
        .pipe(rimraf());
    return js_cleaning;
});
// CSS cleaning
gulp.task('css-cleaning', function() {
    var css_cleaning = gulp.src(['./_build/dev/_assets/_css', './_build/stage/_assets/_css'], {read: false})
        .pipe(rimraf());
    return css_cleaning;
});

// Template processing
gulp.task('templates', ['tpl-cleaning'], function() {
    var YOUR_LOCALS = { pretty: true };

    gulp.src('./_source/*.jade')
        .pipe(jade({
            locals: YOUR_LOCALS
        }))
        .pipe(gulp.dest('./_build/stage'))
        .pipe(rimraf())
        .pipe(gulp.dest('./_build/stage'))
        .pipe(html_prettify({
            indent_char: ' ',  indent_size: 4
        }))
        .pipe(replace(/stylesheet\.min\.css/, 'stylesheet.css')) // find and replace external css file name reference to match minified version
        .pipe(replace(/javascript\.min\.js/, 'javascript.js')) // find and replace external js file name reference to match minified version
        .pipe(gulp.dest('./_build/dev')); // save expanded to dev
});

// Code linting
gulp.task('code_hint', ['js-cleaning'], function() {
    gulp.src('./_source/_js/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
    gulp.src('./_build/dev/*.html')
        .pipe(htmlhint())
        .pipe(htmlhint.reporter());
});

// CSS processing
gulp.task('css-sass', ['css-cleaning'], function() {
    var cleaned = gulp.src('./_source/_sass/stylesheet.scss')
        .pipe(sass({ // preprocessing sass files, check and debugInfo can't be used because of bugs
            style: 'expanded', precision: 7, lineNumbers: true// debugInfo currently misrender nested @media queries (only in gulp plugin)
        }))
        .pipe(rename('1-preprocessed.css'))
        .pipe(gulp.dest('./_build/dev/__tmp')); // save a copy for step-by-step debugging
});
gulp.task('css-prefix', ['css-sass'], function() {
    var prefixed = gulp.src('./_build/dev/__tmp/1-preprocessed.css')
        .pipe(prefix())
        .pipe(rename('2-prefixed.css'))
        .pipe(gulp.dest('./_build/dev/__tmp')); // save a copy for step-by-step debugging
});
gulp.task('css-pixrem', ['css-prefix'], function() {
    'use strict';
    var fs = require('fs');
    var pixrem = require('pixrem');
    var css = fs.readFileSync('./_build/dev/__tmp/2-prefixed.css', 'utf8');
    var processedCss = pixrem(css, '10');

    var pixremed = fs.writeFile('./_build/dev/__tmp/3-pixremed.css', processedCss, function (err) {
      if (err) {
        throw err;
      }
      console.log('IE8, you\'re welcome.');
    });
});
gulp.task('css-post', ['css-pixrem'], function() {
    gulp.src('./_build/dev/__tmp/3-pixremed.css')
        .pipe(rename('stylesheet.css'))
        .pipe(bless('stylesheet.css')) // good timing to bless files and prefix
        .pipe(cssbeautify({
            indent: '    ', openbrace: 'separate-line', autosemicolon: false
        }))
        .pipe(gulp.dest('./_build/dev/_assets/_css')) // saving file to dev
        .pipe(minifyCSS({
            keepSpecialComments: 1, removeEmpty: true
        }))
        .pipe(rename('stylesheet.min.css'))
        .pipe(gulp.dest('./_build/stage/_assets/_css')); // finaly we save for stage
});

// Concatenate & Minify JS
gulp.task('scripts', function() {
    gulp.src('./_source/_js/*.js')
        .pipe(gulp.dest('./_build/dev/_assets/_js')) // simple copy of js files to dev
        .pipe(concat('all.js')) // concatenation, minification and save to stage
        .pipe(gulp.dest('./_build/dev/__tmp'))
        .pipe(uglify())
        .pipe(rename('javascript.min.js'))
        .pipe(gulp.dest('./_build/stage/_assets/_js'));
});

// Watch files for changes
gulp.task('watch', function() {
    gulp.watch('./_source/_js/*.js', ['code_hint', 'scripts']);
    gulp.watch('./_source/_sass/*.scss', ['css-sass', 'css-prefix', 'css-pixrem', 'css-post']);
    gulp.watch('./_source/*.jade', ['templates']);
});

/////////////////////////////////////////////////////////////////////////
// D E F A U L T   T A S K
gulp.task('default', ['tpl-cleaning', 'js-cleaning', 'css-cleaning', 'templates', 'code_hint', 'css-sass', 'css-prefix', 'css-pixrem', 'css-post', 'scripts', 'watch']);
