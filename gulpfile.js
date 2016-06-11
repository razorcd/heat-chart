'use strict';

var gulp = require('gulp'),
    uglify = require('gulp-uglify'),
    clean = require('gulp-clean'),
    concat = require('gulp-concat'),
    sass = require('gulp-sass'),
    minifyCss = require('gulp-minify-css'),
    rename = require('gulp-rename');

gulp.task('clean', function () {
  return gulp.src('dist', {read: false})
    .pipe(clean());
});

gulp.task('build_css', function () {
  return gulp.src('scss/**/*.scss')
             // .pipe(sourcemaps.init())
             .pipe(sass())
             .pipe(concat('heatChart.css'))
             .pipe(minifyCss())
             .pipe(rename('heatChart.min.css'))
             // .pipe(sourcemaps.write())
             .pipe(gulp.dest('dist/stylesheets'));
});

gulp.task('build_js', function() {
  return gulp.src('src/**/*.js')
    .pipe(uglify({mangle: false}))
    .pipe(rename('heatChart.min.js'))
    .pipe(gulp.dest('./dist/scripts/'));
});

gulp.task('build', ['clean', 'build_js', 'build_css']);
