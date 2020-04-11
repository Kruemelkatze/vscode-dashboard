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

function copyWebviewAssets() {
    return gulp.src([
        'src/webview/*.js'
    ]).pipe(gulp.dest('media'));
}

function watchSass() {
    return gulp.watch('media/*.scss', sassTask);
}

function watchJs() {
    return gulp.watch('src/webview/*.js', copyWebviewAssets);
}

var build = gulp.parallel(copyNodeAssets, copyWebviewAssets, sassTask, watchSass, watchJs);
gulp.task('default', build);