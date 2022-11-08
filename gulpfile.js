const gulp = require('gulp');
const mode = require('gulp-mode')({
    modes: ["production", "development"],
    default: "development"
});

const gulpSass = require('gulp-sass');
const sass = require('sass');
const cleanCSS = require('gulp-clean-css');

const sassTask = gulpSass(sass);

// Sass configuration
function buildStyles() {
    return gulp.src('media/*.scss')
        .pipe(sassTask())
        .pipe(cleanCSS())
        .pipe(gulp.dest(f => f.base));
};

function copyNodeAssets() {
    return gulp.src([
        'node_modules/fitty/dist/fitty.min.js',
        'node_modules/dragula/dist/dragula.min.js',
        'node_modules/dom-autoscroller/dist/dom-autoscroller.min.js',
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

exports.default = mode.development()
    ? gulp.parallel(buildStyles, watchStyles, copyWebviewAssets, watchWebviewAssets, copyNodeAssets)
    : gulp.parallel(buildStyles, copyWebviewAssets, copyNodeAssets);