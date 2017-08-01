var gulp = require('gulp');
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var cssnano = require('gulp-cssnano');
var rename = require('gulp-rename');
var jsonminify = require('gulp-jsonminify');
var uglify = require('gulp-uglify');
var output = 'dist';

gulp.task('sass', function () {
    gulp
        .src('src/iDisqus.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(autoprefixer('last 2 version'))
        .pipe(cssnano())
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest(output));
});

gulp.task('jsonminify', function () {
    gulp
        .src('src/eac.json')
        .pipe(jsonminify())
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest(output));
});

gulp.task('jsminify', function () {
    gulp
        .src('src/iDisqus.js')
        .pipe(uglify())
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest(output));
});

gulp.task('default', ['sass','jsonminify','jsminify'], function() {
    gulp.watch('src/iDisqus.scss', ['sass']);
    gulp.watch('src/iDisqus.js', ['jsminify']);
});
