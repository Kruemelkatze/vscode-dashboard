// Sass configuration
var gulp = require('gulp');
var sass = require('gulp-sass');
var cleanCSS = require('gulp-clean-css');

function sassTask() {
    return gulp.src('media/*.scss')
        .pipe(sass())
        .pipe(cleanCSS())
        .pipe(gulp.dest(f => f.base));
};

function copyNodeAssets() {
    return gulp.src([
        'node_modules/fitty/dist/fitty.min.js',
        'node_modules/dragula/dist/dragula.min.js',
    ]).pipe(gulp.dest('media'));
}

function watch() {
    return gulp.watch('media/*.scss', sassTask);
}

var build = gulp.parallel(copyNodeAssets, sassTask, watch);
gulp.task('default', build);