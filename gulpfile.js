var gulp        = require('gulp');
var browserSync = require('browser-sync');
var sass        = require('gulp-sass');
var cleanCss    = require('gulp-clean-css');
var prefix      = require('gulp-autoprefixer');
var cp          = require('child_process');
var del         = require('del');
var argv        = require('yargs').argv;

var jekyll    = process.platform === 'win32' ? 'jekyll.bat' : 'jekyll';
var incDrafts = (argv.drafts === undefined) ? false : true;

var messages  = {
    jekyllBuild: 'DEV MODE: Building Jekyll Site\n<span style="color: grey">Running:</span> $ bundle exec jekyll build'
};

/**
 * Build the Jekyll Site
 */
gulp.task('jekyll-build', function (done) {
    browserSync.notify(messages.jekyllBuild);

    if(incDrafts){
        return cp.spawn( jekyll , ['build', '--drafts'], {stdio: 'inherit'})
            .on('close', done);
    } else {
        return cp.spawn( jekyll , ['build'], {stdio: 'inherit'})
            .on('close', done);
    }

});

/**
 * Rebuild Jekyll & do page reload
 */
gulp.task('jekyll-rebuild', ['jekyll-build'], function () {
    browserSync.reload();
});

/**
 * Wait for jekyll-build, then launch the Server
 */
gulp.task('browser-sync', ['sass', 'jekyll-build'], function() {
    browserSync({
        server: {
            baseDir: '_site'
        },
        notify: false,
        open: false
    });
});

/**
 * Compile files from assets/css/main.scss into both _site/css (for live injecting) and site (for future jekyll builds)
 */
gulp.task('sass', function () {
    return gulp.src('assets/css/main.scss')
        .pipe(sass({
            //includePaths: ['scss'],
            //onError: browserSync.notify
        }))
        .pipe(cleanCss({compatibility: 'ie8'})) //minify main.css
        .pipe(prefix(['last 15 versions', '> 1%', 'ie 8', 'ie 7'], { cascade: true }))
        .pipe(gulp.dest('_site/assets/css'))
        .pipe(browserSync.reload({stream:true}))
        .pipe(gulp.dest('assets/css'));

});

/**
 * Grab data from Contentful in YAML format and place in _data folder
 */
gulp.task('contentful', function(done){
    return cp.spawn(jekyll , ['contentful'], {stdio: 'inherit'})
        .on('close', done);
});

/**
 * Watch scss files for changes & recompile
 * Watch html/md files, run jekyll & reload BrowserSync
 */
gulp.task('watch', function () {
    gulp.watch('assets/css/**', ['sass']);
    gulp.watch(['*.html', '_layouts/**', '_posts/*', 'assets/scripts/**'], ['jekyll-rebuild']);
});

/**
 * Default task, running just `gulp` will compile the sass,
 * compile the jekyll site, launch BrowserSync & watch files.
 */
gulp.task('default', ['browser-sync', 'watch']);

/**
 * task to run when building on Netlify (runs all tasks
 * appart from browser-sync)
 */
 gulp.task('netlify-deploy', ['clean-site', 'sass'], function(done){
     return cp.spawn(jekyll , ['build', '--config', '_liveConfig.yml'], {stdio: 'inherit'})
         .on('close', done);
 });

/**
 * delete the _site folder
 */
gulp.task('clean-site', function() {
  return del.sync('_site', '_data/contentful/**');
});
