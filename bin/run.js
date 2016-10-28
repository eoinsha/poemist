#!/usr/bin/env node

const poetName = process.argv.slice(2).join(' ');

if (poetName === '') {
  console.error('No poet specified');
  process.exit(-1);
}

require('..')(poetName, err => {
  if (err) {
    console.error('ERROR', err);
  }
  else {
    console.info('DONE');
  }
});

