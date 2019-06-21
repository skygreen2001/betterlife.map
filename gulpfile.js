/* jshint node: true, strict: true */
'use strict';

/*=====================================
=        Default Configuration        =
=====================================*/

// Please use config.js to override these selectively:

var config = {
  isDev  : true,
  isImage: true,
  src    : 'src',
  dest   : 'www',
  server : {
    host : '127.0.0.1',
    port : '8080'
  }
};

/*-----  End of Configuration  ------*/

/*========================================
=            Requiring stuffs            =
========================================*/
var gulp = require('gulp'),
    $    = require('gulp-load-plugins')(),
    path = require('path'),
    seq  = require('run-sequence');

/*================================================
=            Report Errors to Console            =
================================================*/

gulp.on('error', function(e) {
  throw(e);
});


/*==========================================
=            Start a web server            =
==========================================*/

gulp.task('connect', function() {
  if (typeof config.server === 'object') {
    $.connect.server({
      root: config.dest,
      host: config.server.host,
      port: config.server.port,
      debug: true,
      livereload: true
    });
  } else {
    throw new Error('Connect is not configured');
  }
});


/*==============================================================
=            Setup live reloading on source changes            =
==============================================================*/

gulp.task('livereload', function () {
  gulp.src(path.join(config.dest, '*.html'))
    .pipe($.connect.reload());
});


/*=========================================
=            Clean dest folder            =
=========================================*/

gulp.task('clean', function (cb) {
    return gulp.src(config.dest)
              .pipe($.clean({force: true}));
});

/*====================================================================
=                             Copy html                              =
====================================================================*/

gulp.task('html', function() {
  gulp.src("src/*")
  .pipe(gulp.dest(path.join(config.dest)))
  .pipe($.connect.reload());
  gulp.src('src/html/**/*')
  .pipe(gulp.dest(path.join(config.dest, 'html')))
  .pipe($.connect.reload());
});

/*======================================================================
=                                  copy css                            =
======================================================================*/

gulp.task('css', function () {
  gulp.src('src/css/**/*')
  .pipe(gulp.dest(path.join(config.dest, 'css')))
  .pipe($.connect.reload());
});


/*====================================================================
=                              Copy js                               =
====================================================================*/

gulp.task('js', function() {
  gulp.src('src/js/**/*')
  .pipe(gulp.dest(path.join(config.dest, 'js')))
  .pipe($.connect.reload());

});


/*======================================================================
=                                copy image                            =
======================================================================*/

gulp.task('image', function () {
  gulp.src('src/img/**/*')
  .pipe(gulp.dest(path.join(config.dest, 'img')))
  .pipe($.connect.reload());
});

/*===================================================================
=            Watch for source changes and rebuild/reload            =
===================================================================*/

gulp.task('watch', function () {
  if (typeof config.server === 'object') {
    gulp.watch([config.dest + '/**/*'], ['livereload']);
  }
  gulp.watch(['./src/index.html'], ['html']);
  gulp.watch(['./src/html/**/*'], ['html']);
  gulp.watch(['./src/css/**/*'], ['css', 'html']);
  gulp.watch(['./src/js/**/*'], ['js', 'html']);
  if (config.isImage) gulp.watch(['./src/img/**/*'], ['image', 'html']);
});

/*======================================
=            Build Sequence            =
======================================*/
gulp.task('build', function(done) {
  var tasks = ['css', 'js'];
  if (config.isImage) tasks.push('image');
  seq('html', tasks, done);
});

/*====================================
=            Default Task            =
====================================*/
gulp.task('default', ['clean'], function(done){
  var tasks = [];
  tasks.push('build');

  if (typeof config.server === 'object') {
    tasks.push('connect');
  }

  tasks.push('watch');

  seq(tasks, done);
});
