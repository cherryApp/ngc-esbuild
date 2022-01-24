<div align="center">
  <br>
  <p>
    <h1>Angular Esbuild</h1>
  </p>
  <p>
     <i>Blazing Fast & Esbuild based Angular compiler</i>
  </p>
  <p>

[![NPM version](https://img.shields.io/npm/v/ngc-esbuild?style=flat-square)](https://img.shields.io/npm/v/ngc-esbuild?style=flat-square)

  </p>
</div>

---

**Content**

- [Comparision](#comparison)
- [Features](#features)
- [Installation](#install)
- [Usage](#usage)
- [Arguments](#arguments)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [Maintainers](#maintainers)

## Comparison ⏱

**50x faster builds with esbuild, production build within 200ms instead of 10s**

`ngc-esbuild`:

![image description](https://raw.githubusercontent.com/marcellkiss/angular-esbuild-example/master/src/assets/ngc-esbuild.gif)

`ng build`:

![image description](https://raw.githubusercontent.com/marcellkiss/angular-esbuild-example/master/src/assets/ng-build.gif)

## Features ✨

- Build Angular projects
- Process SCSS
- Process 3rc styles and scripts
- Handle loadChildren

## Install 🐙

```powershell
# globally
npm i -g ngc-esbuild
# or locally
npm i ngc-esbuild
```

## Usage 💡

- Add a new script to the package.json:

```json
"scripts": {
  "esbuild": "ngc-esbuild"
}
```

- Start esbuild:

```powershell
npm run esbuild
```

- With arguments:

```powershell
"scripts": {
  "esbuild": "ngc-esbuild --minify true --sourcemap false --port 6500 --open"
}
```

- From nodejs:
```javascript
const NgcEsbuild = require('ngc-esbuild');

new NgcEsbuild({
  main: 'src/main.ts',
  outpath: 'dist/es2',
  minify: true,
  open: false,
  port: 9855,
  sourcemap: true,
  serve: true,
}).resolve.then(
  (result) => console.log(result)
);
```

## Arguments:
- These arguments are supported both from cmd and the nodejs call:
```json
{
    // specific options for this package:
    port: 4200, // live-server port
    open: false, // open in default browser
    serve: true, // start the live-server
    project: '', // project name from the angular.json file
    
    // esbuild options:
    entryPoints: ['src/main.ts'], // main
    bundle: true, // true|false
    outfile: '', // string
    outdir: 'dist/esbuild', // outpath
    external: [], // eg: ['fsevents']
    format: 'esm', // iife, cjs, or esm
    inject: [], // eg: ['./process-shim.js']
    minify: true, // true|false
    platform: 'browser', // node|browser|neutral
    sourcemap: true, // true|false|'external'|'inline'|'both'
    splitting: true, // true|false
    target: ['es2020'], // ['es2020', 'chrome58', 'firefox57',  'safari11',  'edge16',  'node12',],
    watch: true, // true|false|object
    write: true, // true|false
    allowOverwrite: true, // true|false
    metafile: false, // true|false - for the analyze feature
    treeShaking: true, // true|false
    tsconfig: 'tsconfig.json', // string
    tsconfigRaw: '',
    absWorkingDir: process.cwd(), // string: a file-system path
}
```

## Documentation 📄

**WARNING!**  
The package is in the early alpha version!

This package is based on the esbuild.  
Esbuild is an extremely fast builder for web projects, written in GoLang.  
I extended esbuild with its plugin API and created some internal plugins.  
These plugins process .ts files, handle dependency injectors, unpack styles, etc.

## Limitations

| build part             | supported | notice                                           |
| ---------------------- | --------- | ------------------------------------------------ |
| `templateUrl`          | `Yes`     | move to import statement                         |
| `styleUrls`            | Partial   | only one styleUrl                                |
| `angular.json:styles`  | `Yes`     | move to main.css                                 |
| `angular.json:scripts` | `Yes`     | move to vendor.js                                |
| `dependency injection` | Partial   | constructor must contain only injectable objects |
| `loadChildren`         | `Yes`     | move to a separated file                         |
| `assets`               | `Yes`     | copy to the output folder                        |
| `scss :root`           | `No`      | angular pseudo-selectors are not supported yet   |
| `less`                 | `No`      | less stylesheets are not supported yet           |
| `style encapsulation`  | `No`      | work in progress                                 |

## Contributing 🍰

Thank you to all the people who contributed to this project!
You feel free to send pull requests.  
[Contributing Guide](CONTRIBUTING.md)

## Maintainers 👷

<table>
  <tr>
    <td align="center">
        <sub><b>Joe Cserko</b></sub>
        <br>
        <a href="#" title="Code">💻</a>
    </td>
  </tr>
</table>

## License ⚖️

MIT
