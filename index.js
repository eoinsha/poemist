'use strict';

const fs = require('fs');
const path = require('path');

const Async = require('async');
const Gibberfish = require('gibberfish');
const Mkdirp = require('mkdirp');
const Request = require('request');
const Sanitize = require('sanitize-filename');
const VttPdf = require('vtt-pdf');

module.exports = function(poetName, done) {
  Async.waterfall([
    getPoems,
    Async.asyncify(sortBiggestFirst),
    Async.asyncify(takeSubset),
    createPoetDir,
    makePoemVideos
  ], done);

  function getPoems(done) {
    const poemsUri = `http://poetrydb.org/author/${poetName}`;
    Request(poemsUri, (error, response, body) => done(error, body && JSON.parse(body)));
  }

  function sortBiggestFirst(poems) {
    return poems.sort((a, b) => b.linecount - a.linecount);
  }

  function takeSubset(poems) {
    return poems.slice(0, 20);
  }

  function createPoetDir(poems, done) {
    const poetDir = path.join(process.cwd(), Sanitize(poetName));
    Mkdirp(poetDir, err => done(err, poetDir, poems));
  }

  function makePoemVideos(poetDir, poems, vidsDone) {
    Async.eachSeries(poems, makePoemVideo, vidsDone);

    function makePoemVideo (poem, poemDone) {
      const poemDir = path.join(poetDir, Sanitize(poem.title));
      Async.series([
        cb => Mkdirp(poemDir, cb),
        writePoemJson,
        cb => Gibberfish({
          'in': poem.lines.join('\n').replace(/--/g, '\u2014'), // emdash
          'out': path.join(poemDir, 'poem.mp4')
        }, cb),
        makePoemPdf
      ], poemDone);

      function writePoemJson(jsonDone) {
        fs.writeFile(path.join(poemDir, 'poem.json'), JSON.stringify(poem, null, '  '), jsonDone);
      }

      function makePoemPdf(pdfDone) {
        const vttPath = path.join(poemDir, 'poem.vtt');
        const pdfPath = path.join(poemDir, 'poem.pdf');
        VttPdf(vttPath, pdfPath, { cuesPerPage: 4 }, pdfDone);
      }
    }
  }
};
