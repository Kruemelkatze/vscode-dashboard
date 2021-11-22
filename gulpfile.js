const gulp = require('gulp');

const gulpSass = require('gulp-sass');
const nodeSass = require('node-sass');
const cleanCSS = require('gulp-clean-css');

const sass = gulpSass(nodeSass);

// Sass configuration
function buildStyles() {
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

function watchStyles() {
    return gulp.watch('media/*.scss', buildStyles);
}

function watchWebviewAssets() {
    return gulp.watch('src/webview/*.js', copyWebviewAssets);
}

exports.buildStyles = buildStyles;
exports.watchStyles = watchStyles;
exports.copyWebviewAssets = copyWebviewAssets;
exports.watchWebviewAssets = watchWebviewAssets;
exports.copyNodeAssets = copyNodeAssets;

exports.default = gulp.parallel(buildStyles, watchStyles, copyWebviewAssets, watchWebviewAssets, copyNodeAssets);