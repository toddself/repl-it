#!/usr/bin/env node
'use strict';

var repl = require('repl');
var fs = require('fs');
var path = require('path');
var xtend = require('xtend');

function readPackage(cb){
  var pkg = path.join(process.cwd(), 'package.json');
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

function loadPackages(packages, cb){
  var loadedPackages = {};
  packages.forEach(function(pkg){
    var pkgPath = path.resolve(process.cwd(), 'node_modules', pkg);
    try {
      if(pkg.indexOf('.') > -1){
        console.log('Naming', pkg,' as', pkg.replace(/\./g, '-'), 'in repl for ease of use');
        pkg = pkg.replace(/\./g, '-');
      }
      loadedPackages[pkg] = require(pkgPath);
    } catch(e) {
      return cb(e);
    }
    
  });
  cb(null, loadedPackages);
}

var replit = module.exports = function(){
  readPackage(function(err, packages, projectName){
    if(err){
      console.log(err);
      process.exit(1);
    }
    loadPackages(packages, function(err, pkgs){
      if(err){
        console.log(err);
        process.exit(1);
      } 

      var r = repl.start({
        prompt: projectName+'> '
      });
      Object.keys(pkgs).forEach(function(p){
        r.context[p] = pkgs[p];
      });
    });
  });
};

if(!module.parent){
  replit();
}