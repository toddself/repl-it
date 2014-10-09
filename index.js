'use strict';

var repl = require('repl');
var fs = require('fs');
var path = require('path');
var xtend = require('xtend');
var camelCase = require('camel-case');
var pkginfo = require('pkginfo');

var Replit = module.exports = function(opts){
  if (!(this instanceof Replit)) {
    return new Replit(opts);
  }  
  
  this.opts = opts;
  var replInstance = this;

  replInstance.getPrefix(function (err, prefix) {
    replInstance.handleError(err);

    replInstance.readPackage(prefix, function(err, packages, projectName, projectMain){
      replInstance.handleError(err);

      replInstance.loadPackages(prefix, packages, function(err, pkgs){
        replInstance.handleError(err);

        var mainPackageLoaded = false;

        var loadMain = function (context) {
          var displayName = replInstance.getPackageDisplayName(projectName);
          var pkgPath = path.resolve(prefix, projectMain);
          context[displayName] = require(pkgPath);

          console.log('Main package loaded as ' + displayName);
          mainPackageLoaded = true;
        };

        if (this.opts.loadmain) {
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

Replit.prototype.getPrefix = function(cb){
  try {
    var prefix = path.resolve(pkginfo.find(null, process.cwd()), '..');
    return cb.call(this, null, prefix);
  }
  catch (err) {
    return cb(err);
  }
};

Replit.prototype.readPackage = function(prefix, cb){
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

    cb.call(this, null, packages, data.name, data.main || 'index.js');
  });
};

Replit.prototype.getPackageDisplayName = function(pkg){
  var newPkg;
  newPkg = camelCase(pkg);

  if(pkg !== newPkg && this.opts.verbose){
    console.log('Naming', pkg, 'as', newPkg, 'in repl');
  }

  return newPkg;
};

Replit.prototype.loadPackages = function(prefix, packages, cb){
  var that = this;
  var loadedPackages = {};
  packages.forEach(function(pkg){
    var pkgPath = path.resolve(prefix, 'node_modules', pkg);
    var pkgName;
    try {
      pkgName = that.getPackageDisplayName(pkg);
      if(loadedPackages[pkgName]){
        console.log(pkgName, 'is already defined. Current definition being overwritten by', pkg);
      }
      loadedPackages[pkgName] = require(pkgPath);
    } catch(e) {
      return cb(e);
    }
  });
  cb.call(this, null, loadedPackages);
};

Replit.prototype.handleError = function(err){
  if (err) {
    console.log(err);
    process.exit(1);
  }
};
