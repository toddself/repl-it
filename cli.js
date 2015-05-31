#!/usr/bin/env node
'use strict';

var fs = require('fs');
var path = require('path');

var opts = {
  alias: {
    h: 'help',
    l: 'loadmain',
    v: 'verbose',
    m: 'magic'
  },
  default: {
    history: true,
    magic: true,
    loadmain: false,
    verbose: false
  },
  boolean: ['history', 'magic']
};

var minimist = require('minimist');
var replit = require('./');

var argv = minimist(process.argv.slice(2), opts);

if(argv.h){
	return fs.createReadStream(path.join(__dirname, 'usage.txt')).pipe(process.stdout);
}

replit(argv);
