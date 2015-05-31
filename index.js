'use strict';

var repl = require('repl');
var fs = require('fs');
var path = require('path');
var xtend = require('xtend');
var camelCase = require('camel-case');
var pkginfo = require('pkginfo');

var historyFile = path.join(__dirname, '.repl-it.history');

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
        var mainPackagePath = path.resolve(prefix, projectMain);

        var loadMain = function (context) {
          var displayName = replInstance.getPackageDisplayName(projectName);
          context[displayName] = require(mainPackagePath);

          if(opts.verbose){
            console.log('Main package loaded as ' + displayName);
          }

          mainPackageLoaded = true;
        };

        if(this.opts.loadmain){
          loadMain(pkgs);
        }

        var replOpts = {
          prompt: projectName+'> ',
          useGlobal: true
        };

        if(process.versions.node > 2){
          if(this.opts.magic){
            replOpts.replMode = repl.REPL_MODE_MAGIC;
            if(opts.verbose){
              console.log('Magic mode enabled');
            }
          }

          if(this.opts.strict){
            replOpts.replMode =repl.REPL_MODE_STRICT
            if(opts.verbose){
              console.log('Strict mode enabled');
            }
          }
        }

        var r = repl.start(replOpts);

        if(this.opts.history) {
          setupHistory(r, process.env.NODE_REPL_HISTORY_FILE || historyFile, function(){});
        }

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

        r.defineCommand('reload', {
          help: 'Reload the main package',
          action: function() {
            if (!mainPackageLoaded) {
              console.log('Main package is not loaded. You need to load it first.');
            }
            else {
              delete require.cache[mainPackagePath];
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

  if (!/^[a-z_$]/i.exec(newPkg)) {
    newPkg = '_' + newPkg;
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
      if(pkg !== pkgName && that.opts.verbose){
        console.log('Naming', pkg, 'as', pkgName, 'in repl');
      }
    } catch(e) {
      console.log('Failed to load', pkg);
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


// copy & paste from node's internal repl...
function setupHistory(repl, historyPath, ready) {
  var timer = null;
  var writing = false;
  var pending = false;
  repl.pause && repl.pause();
  fs.open(historyPath, 'a+', oninit);

  function oninit(err, hnd) {
    if (err) {
      return ready(err);
    }
    fs.close(hnd, onclose);
  }

  function onclose(err) {
    if (err) {
      return ready(err);
    }
    fs.readFile(historyPath, 'utf8', onread);
  }

  function onread(err, data) {
    if (err) {
      return ready(err);
    }

    if (data) {
      try {
        repl.history = JSON.parse(data);
        if (!Array.isArray(repl.history)) {
          throw new Error('Expected array, got ' + typeof repl.history);
        }
        repl.history.slice(-repl.historySize);
      } catch (err) {
        return ready(
            new Error('Could not parse history data in ' + historyPath));
      }
    }

    fs.open(historyPath, 'w', onhandle);
  }

  function onhandle(err, hnd) {
    if (err) {
      return ready(err);
    }
    repl._historyHandle = hnd;
    repl.on('line', online);

    // reading the file data out erases it
    repl.once('flushHistory', function() {
      repl.resume && repl.resume();
      ready(null, repl);
    });
    flushHistory();
  }

  // ------ history listeners ------
  function online() {
    repl._flushing = true;

    if (timer) {
      clearTimeout(timer);
    }

    timer = setTimeout(flushHistory, 15);
  }

  function flushHistory() {
    timer = null;
    if (writing) {
      pending = true;
      return;
    }
    writing = true;
    var historyData = JSON.stringify(repl.history, null, 2);
    fs.write(repl._historyHandle, historyData, 0, 'utf8', onwritten);
  }

  function onwritten(err, data) {
    writing = false;
    if (pending) {
      pending = false;
      online();
    } else {
      repl._flushing = Boolean(timer);
      if (!repl._flushing) {
        repl.emit('flushHistory');
      }
    }
  }
}


function _replHistoryMessage() {
  if (this.history.length === 0) {
    this._refreshLine();
  }
  this._historyPrev = Interface.prototype._historyPrev;
  return this._historyPrev();
}
