# repl-it

Creates a repl in the current directory with all the packages listed in `devDependencies` and `dependencies` loaded into the local context.

# Usage

```
~/src/awesome-node-project> cat package.json
{
  "name": "repl-it",
  "version": "1.0.1",
  "description": "Loads all the packages in your package.json and creates a repl for you",
  "main": "index.js",
  "scripts": {
    "test": "tap test/*spec.js"
  },
  "bin": {
    "repl-it": "./index.js"
  },
  "repository": {
    "type": "git",
    "url": "git://github.com/toddself/repl-it"
  },
  "keywords": [
    "repl"
  ],
  "author": "Todd Kennedy <todd@selfassembled.org>",
  "license": "MIT",
  "bugs": {
    "url": "https://github.com/toddself/repl-it/issues"
  },
  "homepage": "https://github.com/toddself/repl-it",
  "dependencies": {
    "camel-case": "^1.0.2",
    "xtend": "^4.0.0"
  }
}
~/src/awesome-node-project> repl-it
repl-it> typeof xtend
'function'
repl-it>
```

Packages are automatically camelcased for you.
```
~/src/awesome-node-project> repl-it
repl-it> typeof camelCase
'function'
repl-it>
```

# Installation

`npm i -g repl-it`

# Tests

None yet.  Probably not ever.  Eh.

# License

MIT. © 2014 Todd Kennedy