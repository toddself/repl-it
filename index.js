#!/usr/bin/env node
'use strict';

var repl = require('repl');
var fs = require('fs');
var path = require('path');
var xtend = require('xtend');
var camelCase = require('camel-case');
var pkginfo = require('pkginfo');

function getPrefix(cb){
  try {
    var prefix = path.resolve(pkginfo.find(null, process.cwd()), '..');
    return cb(null, prefix);
  }
  catch (err) {
    return cb(err);
  }
}

function readPackage(prefix, cb){
  var pkg = path.join(prefix, 'package.json');
  fs.readFile(pkg, 'utf8', function(err, data){
    if(err){
      return cb(err);
    }
    var packages;
    
    try {
      data = JSON.parse(data);
      packages = Object.keys(xtend(data.devDependencies, data.dependencies));
    } catch (e) {
      return cb(e);
    }

    cb(null, packages, data.name, data.main || 'index.js');
  });
}

function getPackageDisplayName(pkg, verbose){
  var newPkg;
  if(pkg.indexOf('.') > -1){
    newPkg = pkg.replace(/\./g, '-');
  } 
  newPkg = camelCase(pkg);

  if(verbose && pkg !== newPkg){
    console.log('Naming', pkg, 'as', newPkg.replace(/\./g, '-'), 'in repl');
  }
  
  return newPkg;
}

function loadPackages(prefix, packages, verbose, cb){
  var loadedPackages = {};
  packages.forEach(function(pkg){
    var pkgPath = path.resolve(prefix, 'node_modules', pkg);
    var pkgName;
    try {
      pkgName = getPackageDisplayName(pkg, verbose);
      if(loadedPackages[pkgName]){
        console.log(pkgName, 'is already defined. Current definition being overwritten by', pkg);
      }
      loadedPackages[pkgName] = require(pkgPath);
    } catch(e) {
      return cb(e);
    }
  });
  cb(null, loadedPackages);
}

function handleError(err){
  if (err) {
    console.log(err);
    process.exit(1);
  }
}

function usage(){
  console.log('Usage:  repl-it [--verbose | -v] [--load-main]');
  process.exit(1);
}

function parseOptions(){
  var options = {};

  process.argv.slice(2).forEach(function (arg) {
    if (arg === '-v' || arg === '--verbose') {
      if (options.verbose) {
        usage();
      }
      options.verbose = true;
    }
    else if (arg === '--load-main') {
      if (options.loadMain) {
        usage();
      }
      options.loadMain = true;
    }
    else {
      usage();
    }
  });

  return options;
}

var replit = module.exports = function(){
  var options = parseOptions();

  getPrefix(function (err, prefix) {
    handleError(err);

    readPackage(prefix, function(err, packages, projectName, projectMain){
      handleError(err);

      loadPackages(prefix, packages, options.verbose, function(err, pkgs){
        handleError(err);

        var mainPackageLoaded = false;

        var loadMain = function (context) {
          var displayName = getPackageDisplayName(projectName);
          var pkgPath = path.resolve(prefix, projectMain);
          context[displayName] = require(pkgPath);

          if (options.verbose) {
            console.log('Main package loaded as ' + displayName);
          }
          mainPackageLoaded = true;
        };

        if (options.loadMain) {
          loadMain(pkgs);
        }

        var r = repl.start({
          prompt: projectName+'> '
        });

        Object.keys(pkgs).forEach(function(p){
          r.context[p] = pkgs[p];
        });

        r.defineCommand('loadmain', {
          help: 'Load the main entry from your package.json into the repl context',
          action: function() {
            if (mainPackageLoaded) {
              console.log('Main package already loaded!');
            }
            else {
              loadMain(r.context);
            }
            this.displayPrompt();
          }
        });
      });
    });
  });
};

if(!module.parent){
  replit();
}