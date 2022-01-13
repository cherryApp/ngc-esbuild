<div align="center">
  <br>
  <p>
    <b>Angular Esbuild</b>
  </p>
  <p>
     <i>Esbuild based Angular compiler</i>
  </p>
  <p>

[![NPM version](https://img.shields.io/npm/v/ngc-esbuild?style=flat-square)](https://img.shields.io/npm/v/ngc-esbuild?style=flat-square)
[![Package size](https://img.shields.io/bundlephobia/min/ngc-esbuild)](https://img.shields.io/bundlephobia/min/ngc-esbuild)


  </p>
</div>

---

**Content**

* [Features](##features)
* [Install](##install)
* [Usage](##usage)
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

## Documentation 📄
__WARNING!__  
The package is in the early alpha version!  

This package is based on the esbuild.  
Esbuild is an extremely fast builder for web projects, written in GoLang.  
I extended esbuild with its plugin API and created some internal plugins. These plugins process .ts files, handle dependency injectors, unpack styles, etc.

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
