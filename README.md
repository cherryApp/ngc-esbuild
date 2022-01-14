<div align="center">
  <br>
  <p>
    <h1>Angular Esbuild</h1>
  </p>
  <p>
     <i>Extremely Fast & Esbuild based Angular compiler</i>
  </p>
  <p>

[![NPM version](https://img.shields.io/npm/v/ngc-esbuild?style=flat-square)](https://img.shields.io/npm/v/ngc-esbuild?style=flat-square)


  </p>
</div>

---

**Content**

* [Features](##features)
* [Installation](##install)
* [Usage](##usage)
* [Arguments](##arguments)
* [Documentation](##documentation)
* [Contributing](##contributing)
* [Maintainers](##maintainers)

## Features ✨
* Build Angular projects
* Process SCSS
* Process 3rc styles and scripts
* Handle loadChildren

## Install 🐙
```powershell
# globally
npm i -g ngc-esbuild
# or locally
npm i ngc-esbuild
```

## Usage 💡
* Add a new script to the package.json:
```json
"scripts": {
  "esbuild": "ngc-esbuild"
}
```
* Start esbuild:
```powershell
npm run esbuild
```
* With arguments:
```powershell
"scripts": {
  "esbuild": "ngc-esbuild --minify true --sourcemap false --port 6500 --open"
}
```

## Arguments:  
| name | values | |
| --- | --- | --- |
| `minify` | `true/false` | minify the output |
| `sourcemap` | `true/false` | generate sourcemaps |
| `port` | `<number>` | the port of the live-server |
| `open` | no value | the default browser will be automatically open |

## Documentation 📄
__WARNING!__  
The package is in the early alpha version!  

This package is based on the esbuild.  
Esbuild is an extremely fast builder for web projects, written in GoLang.  
I extended esbuild with its plugin API and created some internal plugins.  
These plugins process .ts files, handle dependency injectors, unpack styles, etc.

## Limitations
| build part | supported | notice |
| --- | --- | --- |
| `templateUrl` | `Yes` | move to import statement |
| `styleUrls` | Partial | only one styleUrl |
| `angular.json:styles` | `Yes` | move to main.css |
| `angular.json:scripts` | `Yes` | move to vendor.js |
| `dependency injection` | Partial | constructor must contain only injectable objects |
| `loadChildren` | `Yes` | move to a separated file |
| `assets` | `Yes` | copy to the output folder |


## Contributing 🍰

Thank you to all the people who contributed to this project!
You feel free to send pull requests.

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
