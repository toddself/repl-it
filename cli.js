#!/usr/bin/env node
'use strict';

var fs = require('fs');
var minimist = require('minimist');
var replit = require('./');

var argv = minimist(process.argv.slice(2));

if(argv.help || argv.h){
	return fs.createReadStream('usage.txt').pipe(process.stdout);
}

var opts = {
	loadmain: (argv.loadmain || argv.l) || false,
	verbose : (argv.verbose || argv.v) || false
};

replit(opts);