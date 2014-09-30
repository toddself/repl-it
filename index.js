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

    cb(null, packages, data.name);
  });
}

function loadPackages(prefix, packages, cb){
  var loadedPackages = {};
  packages.forEach(function(pkg){
    var pkgPath = path.resolve(prefix, 'node_modules', pkg);
    try {
      if(pkg.indexOf('.') > -1){
        console.log('Naming', pkg, 'as', pkg.replace(/\./g, '-'), 'in repl for ease of use');
        pkg = pkg.replace(/\./g, '-');
      }
      pkg = camelCase(pkg);
      loadedPackages[pkg] = require(pkgPath);
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

var replit = module.exports = function(){
  getPrefix(function (err, prefix) {
    handleError(err);

    readPackage(prefix, function(err, packages, projectName){
      handleError(err);

      loadPackages(prefix, packages, function(err, pkgs){
        handleError(err);

        var r = repl.start({
          prompt: projectName+'> '
        });
        Object.keys(pkgs).forEach(function(p){
          r.context[p] = pkgs[p];
        });
      });
    });
  });
};

if(!module.parent){
  replit();
}