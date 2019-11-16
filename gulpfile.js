const gulp = require('gulp');
const data = require('gulp-data');
const twig = require('gulp-twig');
const plumber = require('gulp-plumber');
const babel = require('gulp-babel');
const inlineSource = require('gulp-inline-source');
const watch = require('gulp-watch');
const clean = require('gulp-clean');
const htmlMin = require('gulp-htmlmin');
const fs = require('fs');

gulp.task('copy', function(){
  return gulp.src(['src/script.js', 'src/style.css'])
    .pipe(gulp.dest('temp'));
});

gulp.task('twig_nl', function () {
  return gulp.src(['src/index.twig'])
   .pipe(plumber({
       handleError: function (err) {
          console.log(err);
          this.emit('end');
       }})
    )
    .pipe(data(function (file) {
      return JSON.parse(fs.readFileSync('data/nl.json'));  
    }))
    .pipe(
      twig().on('error', function (err) {
        process.stderr.write(err.message + '\n');
        this.emit('end');
      })
     )
    .pipe(gulp.dest('temp/nl'));
});

gulp.task('twig_en', function () {
  return gulp.src(['src/index.twig'])
   .pipe(plumber({
       handleError: function (err) {
          console.log(err);
          this.emit('end');
       }})
    )
    .pipe(data(function (file) {
      return JSON.parse(fs.readFileSync('data/en.json'));  
    }))
    .pipe(
      twig().on('error', function (err) {
        process.stderr.write(err.message + '\n');
        this.emit('end');
      })
     )
    .pipe(gulp.dest('temp'));
});

gulp.task('script', function(){
  return gulp.src('temp/script.js')
    .pipe(babel({
      presets: [
        [
          '@babel/preset-env',
          {
            targets: {
              "chrome": "58",
              "ie": "11"
            }
          }
        ]
      ]
    }))
    .pipe(gulp.dest('temp'));
});

gulp.task('inline_nl', function(){
  return gulp.src('temp/nl/index.html')
    .pipe(inlineSource({
      "compress": false
    }))
    .pipe(gulp.dest('temp/nl'));
});

gulp.task('inline_en', function(){
  return gulp.src('temp/index.html')
    .pipe(inlineSource({
      "compress": false
    }))
    .pipe(gulp.dest('temp'));
});

gulp.task('minify_nl', function(){
  return gulp.src('temp/nl/index.html')
    .pipe(htmlMin({
      collapseWhitespace: true,
      removeComments: true,
      minifyCSS: true,
      minifyJS: true
    }))
    .pipe(gulp.dest('./nl/'));
});

gulp.task('minify_en', function(){
  return gulp.src('temp/index.html')
    .pipe(htmlMin({
      collapseWhitespace: true,
      removeComments: true,
      minifyCSS: true,
      minifyJS: true
    }))
    .pipe(gulp.dest('./'));
});

gulp.task('clean', function(){
  return gulp.src('temp', {read: false})
    .pipe(clean());
});

gulp.task('build', gulp.series('copy', 'twig_nl', 'twig_en', 'script', 'inline_nl', 'inline_en', 'minify_nl', 'minify_en', 'clean'));

gulp.task('default', function () {
  return watch(['src/**/*', 'data/**/*'], gulp.series('build'));
});