#!/usr/bin/env node
"use strict";

var repl      = require("repl");
var fs        = require("fs");
var path      = require("path");
var xtend     = require("xtend");
var camelCase = require("camel-case");
var pkginfo   = require("pkginfo");

var Replit = exports = module.exports = function Replit() {
  if (!(this instanceof Replit)) {
    return new Replit();
  }
  
  var replInstance = this;
  
  replInstance.getPrefix(function (err, prefix) {
    replInstance.handleError(err);

    replInstance.readPackage(prefix, function(err, packages, projectName) {
      replInstance.handleError(err);

      replInstance.loadPackages(prefix, packages, function(err, pkgs) {
        replInstance.handleError(err);

        var r = repl.start({
          prompt: projectName+"> "
        });

        Object.keys(pkgs).forEach(function(p) {
          r.context[p] = pkgs[p];
        });
      });
    });
  });
};

Replit.prototype.getPrefix = function(cb) {
  try {
    var prefix = path.resolve(pkginfo.find(null, process.cwd()), '..');
    return cb.call(this, null, prefix);
  }
  catch (err) {
    return cb(err);
  }
}

Replit.prototype.readPackage = function(prefix, cb) {
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

    cb.call(this, null, packages, data.name);
  });
}

Replit.prototype.loadPackages = function(prefix, packages, cb) {
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
  cb.call(this, null, loadedPackages);
}

Replit.prototype.handleError = function(err) {
  if (err) {
    console.log(err);
    process.exit(1);
  }
}

if (!module.parent) {
  Replit();
}