const gulp = require('gulp');
const babel = require('gulp-babel');
const inlinesource = require('gulp-inline-source');
const watch = require('gulp-watch');
const clean = require('gulp-clean');

gulp.task('copy', function(){
  return gulp.src(['src/index.html', 'src/script.js', 'src/style.css'])
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

gulp.task('inline', function(){
  return gulp.src('temp/index.html')
    .pipe(inlinesource())
    .pipe(gulp.dest('./'));
});

gulp.task('clean', function(){
  return gulp.src('temp', {read: false})
    .pipe(clean());
});

gulp.task('build', gulp.series('copy', 'script', 'inline', 'clean'));

gulp.task('default', function () {
  return watch('src/**/*', gulp.series('build'));
});