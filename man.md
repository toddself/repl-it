# REPL-IT(1) -- create a custom node repl for your project

## SYNOPSIS
```sh
repl-it [-v] [-l] [-s] [-h] [--no-magic] [--no-history]
```

## DESCRIPTION
Starts a node REPL which loads all the dependencies and devDependencies listed
in your package.json and injects them, properly camelCase'ed, into the global
scope for the REPL.

## OPTIONS
  -v, --verbose           Explain the camelCase name changes
  -l, --loadmain          Load the main file referenced by package.json by default
  -s, --strict            Enable strict mode (and turn off magic mode)
  -h, --help              Show this message
  --no-history            Disable history (history support only works in
                          io.js/node 1.0 or higher)
  --no-magic              Disable "magic" mode. You will have to specify strict
                          mode if you want to use strict mode features.
                          Enabled only in node/iojs 2.0 and higher.

## ENVIRONMENT VARIABLES
  NODE_REPL_HISTORY_FILE  Controls what file the history is stored in.
                          The default file is local to your project, allowing for
                          a per-project history. You can override this file by
                          setting this variable. This is the same variable the
                          default REPL uses in io.js.
