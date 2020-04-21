const { src, dest, series, watch, task, parallel } = require('gulp')
const del = require('del')
const sass = require('gulp-sass')
const browserSync = require('browser-sync').create()
const uglify = require('gulp-uglify')
const { pipeline } = require('readable-stream')
const imagemin = require('gulp-imagemin')
const autoprefixer = require('autoprefixer')
const htmlmin = require('gulp-htmlmin')
const rename = require('gulp-rename')
const sourcemaps = require('gulp-sourcemaps')
const plumber = require('gulp-plumber')
const postcss = require('gulp-postcss')
const cssnano = require('cssnano')
const cache = require('gulp-cache')

// compile SASS Explicit
sass.compiler = require('node-sass')

// paths
const path = {
    root: '/',
    source: 'src/',
    all: 'src/**/*.*',
    html: 'src/*.html',
    sass: 'src/sass/**/*.scss',
    public: 'public/',
    port: 4000
}

/** FUNCTIONS --------*/
// serve files
const serve = (source = path.source ? path.source : path.public, port = path.port) => {
    browserSync.init({
        browser: 'Google Chrome',
        watch: true,
        server: {
            baseDir: source
        },
        port: port
    })
    watch(path.sass).on('change', series(buildCss, reloadBrowser))
    watch(path.html).on('change', series(buildHtml, reloadBrowser))
}

// function that reloads browsers
const reloadBrowser = () => {
    console.log('Clearing cache and reloading browsers')
    clearCache()
    browserSync.reload()
}

// clear the cache browser
const clearCache = () => {
    cache.clearAll()
}

// Minimize JS
const buildJs = () => {
    return pipeline(
        src(`${path.source}assets/js/*`),
        uglify({
            warnings: true,
            compress: true
        }),
        dest(`${path.public}assets/js/`)
    )
}

// Minify CSS and ADD vendor prefix
const buildCss = () => {
    let postcssPlugins = [
        autoprefixer({
            grid: true
            // browsers: ['last 3 versions', 'ie 6-8', 'Firefox > 20']
        }),
        cssnano()
    ]
    return pipeline(
        src(path.sass),
        sourcemaps.init(),
        plumber(),
        sass({
            outputStyle: 'expanded'
        }).on('error', sass.logError),
        dest(`${path.source}assets/css/`),
        postcss(postcssPlugins),
        rename({
            suffix: '.min'
        }),
        sourcemaps.write('./maps'),
        dest(`${path.source}assets/css/`)
    )
}

// Minify HTML
const buildHtml = () => {
    return pipeline(
        src(path.html),
        htmlmin({
            removeComments: true,
            collapseWhitespace: true
        }),
        dest(path.public)
    )
}

// Copy files to public
const buildCopy = () => {
    let sourceFiles = [
        path.all,
        `!${path.sass}`,
        `!${path.source}assets/img/*`,
        `!${path.source}assets/js/*`,
        `!${path.source}assets/css/maps/main.min.css.map`,
        `!${path.source}assets/css/main.css`,
        `!${path.html}`
    ]
    return src(sourceFiles).pipe(dest(path.public))
}

// Optimize images
const buildImg = () => {
    return pipeline(
        src('src/assets/img/*'),
        imagemin({
            optimizationLevel: 3,
            progressive: true,
            interlaced: true
        }),
        dest('public/assets/img')
    )
}

// Clean public and tmp
const buildClean = () => {
    return del([`${path.public}`, 'tmp/**/*'])
}

// del only css files
const delCss = () => {
    return del(['src/assets/css/*.min.css'])
}

/** TASKS --------*/
exports.serve = () => serve(path.source, 5000)
exports.clearCache = clearCache
exports.buildHtml = buildHtml
exports.buildJs = buildJs
exports.buildCss = buildCss
exports.buildImg = buildImg
exports.buildCopy = buildCopy
exports.buildClean = buildClean
exports.delCss = delCss
exports.buildAll = series(buildClean, buildCss, buildJs, buildHtml, buildCopy, buildImg)
