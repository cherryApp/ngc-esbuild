const { option } = require('yargs');
const yargs = require('yargs');
const { hideBin } = require('yargs/helpers');

const schema = {
    "$schema": "http://json-schema.org/draft-07/schema",
    "title": "Webpack browser schema for Build Facade.",
    "description": "Browser target options",
    "type": "object",
    "properties": {
        "assets": {
            "type": "array",
            "description": "List of static application assets.",
            "default": [],
            "items": {
                "$ref": "#/definitions/assetPattern"
            }
        },
        "main": {
            "type": "string",
            "description": "The full path for the main entry point to the app, relative to the current workspace."
        },
        "polyfills": {
            "type": "string",
            "description": "The full path for the polyfills file, relative to the current workspace."
        },
        "tsConfig": {
            "type": "string",
            "description": "The full path for the TypeScript configuration file, relative to the current workspace."
        },
        "scripts": {
            "description": "Global scripts to be included in the build.",
            "type": "array",
            "default": [],
            "items": {
                "$ref": "#/definitions/extraEntryPoint"
            }
        },
        "styles": {
            "description": "Global styles to be included in the build.",
            "type": "array",
            "default": [],
            "items": {
                "$ref": "#/definitions/extraEntryPoint"
            }
        },
        "inlineStyleLanguage": {
            "description": "The stylesheet language to use for the application's inline component styles.",
            "type": "string",
            "default": "css",
            "enum": ["css", "less", "sass", "scss"]
        },
        "stylePreprocessorOptions": {
            "description": "Options to pass to style preprocessors.",
            "type": "object",
            "properties": {
                "includePaths": {
                    "description": "Paths to include. Paths will be resolved to workspace root.",
                    "type": "array",
                    "items": {
                        "type": "string"
                    },
                    "default": []
                }
            },
            "additionalProperties": false
        },
        "optimization": {
            "description": "Enables optimization of the build output. Including minification of scripts and styles, tree-shaking, dead-code elimination, inlining of critical CSS and fonts inlining. For more information, see https://angular.io/guide/workspace-config#optimization-configuration.",
            "x-user-analytics": 16,
            "default": true,
            "oneOf": [
                {
                    "type": "object",
                    "properties": {
                        "scripts": {
                            "type": "boolean",
                            "description": "Enables optimization of the scripts output.",
                            "default": true
                        },
                        "styles": {
                            "description": "Enables optimization of the styles output.",
                            "default": true,
                            "oneOf": [
                                {
                                    "type": "object",
                                    "properties": {
                                        "minify": {
                                            "type": "boolean",
                                            "description": "Minify CSS definitions by removing extraneous whitespace and comments, merging identifiers and minimizing values.",
                                            "default": true
                                        },
                                        "inlineCritical": {
                                            "type": "boolean",
                                            "description": "Extract and inline critical CSS definitions to improve first paint time.",
                                            "default": true
                                        }
                                    },
                                    "additionalProperties": false
                                },
                                {
                                    "type": "boolean"
                                }
                            ]
                        },
                        "fonts": {
                            "description": "Enables optimization for fonts. This option requires internet access. `HTTPS_PROXY` environment variable can be used to specify a proxy server.",
                            "default": true,
                            "oneOf": [
                                {
                                    "type": "object",
                                    "properties": {
                                        "inline": {
                                            "type": "boolean",
                                            "description": "Reduce render blocking requests by inlining external Google Fonts and Adobe Fonts CSS definitions in the application's HTML index file. This option requires internet access. `HTTPS_PROXY` environment variable can be used to specify a proxy server.",
                                            "default": true
                                        }
                                    },
                                    "additionalProperties": false
                                },
                                {
                                    "type": "boolean"
                                }
                            ]
                        }
                    },
                    "additionalProperties": false
                },
                {
                    "type": "boolean"
                }
            ]
        },
        "fileReplacements": {
            "description": "Replace compilation source files with other compilation source files in the build.",
            "type": "array",
            "items": {
                "$ref": "#/definitions/fileReplacement"
            },
            "default": []
        },
        "outputPath": {
            "type": "string",
            "description": "The full path for the new output directory, relative to the current workspace.\n\nBy default, writes output to a folder named dist/ in the current project."
        },
        "resourcesOutputPath": {
            "type": "string",
            "description": "The path where style resources will be placed, relative to outputPath.",
            "default": ""
        },
        "aot": {
            "type": "boolean",
            "description": "Build using Ahead of Time compilation.",
            "x-user-analytics": 13,
            "default": true
        },
        "sourceMap": {
            "description": "Output source maps for scripts and styles. For more information, see https://angular.io/guide/workspace-config#source-map-configuration.",
            "default": false,
            "oneOf": [
                {
                    "type": "object",
                    "properties": {
                        "scripts": {
                            "type": "boolean",
                            "description": "Output source maps for all scripts.",
                            "default": true
                        },
                        "styles": {
                            "type": "boolean",
                            "description": "Output source maps for all styles.",
                            "default": true
                        },
                        "hidden": {
                            "type": "boolean",
                            "description": "Output source maps used for error reporting tools.",
                            "default": false
                        },
                        "vendor": {
                            "type": "boolean",
                            "description": "Resolve vendor packages source maps.",
                            "default": false
                        }
                    },
                    "additionalProperties": false
                },
                {
                    "type": "boolean"
                }
            ]
        },
        "vendorChunk": {
            "type": "boolean",
            "description": "Generate a seperate bundle containing only vendor libraries. This option should only used for development.",
            "default": false
        },
        "commonChunk": {
            "type": "boolean",
            "description": "Generate a seperate bundle containing code used across multiple bundles.",
            "default": true
        },
        "baseHref": {
            "type": "string",
            "description": "Base url for the application being built."
        },
        "deployUrl": {
            "type": "string",
            "description": "URL where files will be deployed.",
            "x-deprecated": "Use \"baseHref\" option, \"APP_BASE_HREF\" DI token or a combination of both instead. For more information, see https://angular.io/guide/deployment#the-deploy-url."
        },
        "verbose": {
            "type": "boolean",
            "description": "Adds more details to output logging.",
            "default": false
        },
        "progress": {
            "type": "boolean",
            "description": "Log progress to the console while building.",
            "default": true
        },
        "i18nMissingTranslation": {
            "type": "string",
            "description": "How to handle missing translations for i18n.",
            "enum": ["warning", "error", "ignore"],
            "default": "warning"
        },
        "i18nDuplicateTranslation": {
            "type": "string",
            "description": "How to handle duplicate translations for i18n.",
            "enum": ["warning", "error", "ignore"],
            "default": "warning"
        },
        "localize": {
            "description": "Translate the bundles in one or more locales.",
            "oneOf": [
                {
                    "type": "boolean",
                    "description": "Translate all locales."
                },
                {
                    "type": "array",
                    "description": "List of locales ID's to translate.",
                    "minItems": 1,
                    "items": {
                        "type": "string",
                        "pattern": "^[a-zA-Z]{2,3}(-[a-zA-Z]{4})?(-([a-zA-Z]{2}|[0-9]{3}))?(-[a-zA-Z]{5,8})?(-x(-[a-zA-Z0-9]{1,8})+)?$"
                    }
                }
            ]
        },
        "watch": {
            "type": "boolean",
            "description": "Run build when files change.",
            "default": false
        },
        "outputHashing": {
            "type": "string",
            "description": "Define the output filename cache-busting hashing mode.",
            "default": "none",
            "enum": ["none", "all", "media", "bundles"]
        },
        "poll": {
            "type": "number",
            "description": "Enable and define the file watching poll time period in milliseconds."
        },
        "deleteOutputPath": {
            "type": "boolean",
            "description": "Delete the output path before building.",
            "default": true
        },
        "preserveSymlinks": {
            "type": "boolean",
            "description": "Do not use the real path when resolving modules. If unset then will default to `true` if NodeJS option --preserve-symlinks is set."
        },
        "extractLicenses": {
            "type": "boolean",
            "description": "Extract all licenses in a separate file.",
            "default": true
        },
        "showCircularDependencies": {
            "type": "boolean",
            "description": "Show circular dependency warnings on builds.",
            "default": false,
            "x-deprecated": "The recommended method to detect circular dependencies in project code is to use either a lint rule or other external tooling."
        },
        "buildOptimizer": {
            "type": "boolean",
            "description": "Enables '@angular-devkit/build-optimizer' optimizations when using the 'aot' option.",
            "default": true
        },
        "namedChunks": {
            "type": "boolean",
            "description": "Use file name for lazy loaded chunks.",
            "default": false
        },
        "subresourceIntegrity": {
            "type": "boolean",
            "description": "Enables the use of subresource integrity validation.",
            "default": false
        },
        "serviceWorker": {
            "type": "boolean",
            "description": "Generates a service worker config for production builds.",
            "default": false
        },
        "ngswConfigPath": {
            "type": "string",
            "description": "Path to ngsw-config.json."
        },
        "index": {
            "description": "Configures the generation of the application's HTML index.",
            "oneOf": [
                {
                    "type": "string",
                    "description": "The path of a file to use for the application's HTML index. The filename of the specified path will be used for the generated file and will be created in the root of the application's configured output path."
                },
                {
                    "type": "object",
                    "description": "",
                    "properties": {
                        "input": {
                            "type": "string",
                            "minLength": 1,
                            "description": "The path of a file to use for the application's generated HTML index."
                        },
                        "output": {
                            "type": "string",
                            "minLength": 1,
                            "default": "index.html",
                            "description": "The output path of the application's generated HTML index file. The full provided path will be used and will be considered relative to the application's configured output path."
                        }
                    },
                    "required": ["input"]
                }
            ]
        },
        "statsJson": {
            "type": "boolean",
            "description": "Generates a 'stats.json' file which can be analyzed using tools such as 'webpack-bundle-analyzer'.",
            "default": false
        },
        "budgets": {
            "description": "Budget thresholds to ensure parts of your application stay within boundaries which you set.",
            "type": "array",
            "items": {
                "$ref": "#/definitions/budget"
            },
            "default": []
        },
        "webWorkerTsConfig": {
            "type": "string",
            "description": "TypeScript configuration for Web Worker modules."
        },
        "crossOrigin": {
            "type": "string",
            "description": "Define the crossorigin attribute setting of elements that provide CORS support.",
            "default": "none",
            "enum": ["none", "anonymous", "use-credentials"]
        },
        "allowedCommonJsDependencies": {
            "description": "A list of CommonJS packages that are allowed to be used without a build time warning.",
            "type": "array",
            "items": {
                "type": "string"
            },
            "default": []
        }
    },
    "additionalProperties": false,
    "required": ["outputPath", "index", "main", "tsConfig"],
    "definitions": {
        "assetPattern": {
            "oneOf": [
                {
                    "type": "object",
                    "properties": {
                        "followSymlinks": {
                            "type": "boolean",
                            "default": false,
                            "description": "Allow glob patterns to follow symlink directories. This allows subdirectories of the symlink to be searched."
                        },
                        "glob": {
                            "type": "string",
                            "description": "The pattern to match."
                        },
                        "input": {
                            "type": "string",
                            "description": "The input directory path in which to apply 'glob'. Defaults to the project root."
                        },
                        "ignore": {
                            "description": "An array of globs to ignore.",
                            "type": "array",
                            "items": {
                                "type": "string"
                            }
                        },
                        "output": {
                            "type": "string",
                            "description": "Absolute path within the output."
                        }
                    },
                    "additionalProperties": false,
                    "required": ["glob", "input", "output"]
                },
                {
                    "type": "string"
                }
            ]
        },
        "fileReplacement": {
            "oneOf": [
                {
                    "type": "object",
                    "properties": {
                        "src": {
                            "type": "string",
                            "pattern": "\\.(([cm]?j|t)sx?|json)$"
                        },
                        "replaceWith": {
                            "type": "string",
                            "pattern": "\\.(([cm]?j|t)sx?|json)$"
                        }
                    },
                    "additionalProperties": false,
                    "required": ["src", "replaceWith"]
                },
                {
                    "type": "object",
                    "properties": {
                        "replace": {
                            "type": "string",
                            "pattern": "\\.(([cm]?j|t)sx?|json)$"
                        },
                        "with": {
                            "type": "string",
                            "pattern": "\\.(([cm]?j|t)sx?|json)$"
                        }
                    },
                    "additionalProperties": false,
                    "required": ["replace", "with"]
                }
            ]
        },
        "extraEntryPoint": {
            "oneOf": [
                {
                    "type": "object",
                    "properties": {
                        "input": {
                            "type": "string",
                            "description": "The file to include."
                        },
                        "bundleName": {
                            "type": "string",
                            "pattern": "^[\\w\\-.]*$",
                            "description": "The bundle name for this extra entry point."
                        },
                        "inject": {
                            "type": "boolean",
                            "description": "If the bundle will be referenced in the HTML file.",
                            "default": true
                        }
                    },
                    "additionalProperties": false,
                    "required": ["input"]
                },
                {
                    "type": "string",
                    "description": "The file to include."
                }
            ]
        },
        "budget": {
            "type": "object",
            "properties": {
                "type": {
                    "type": "string",
                    "description": "The type of budget.",
                    "enum": ["all", "allScript", "any", "anyScript", "anyComponentStyle", "bundle", "initial"]
                },
                "name": {
                    "type": "string",
                    "description": "The name of the bundle."
                },
                "baseline": {
                    "type": "string",
                    "description": "The baseline size for comparison."
                },
                "maximumWarning": {
                    "type": "string",
                    "description": "The maximum threshold for warning relative to the baseline."
                },
                "maximumError": {
                    "type": "string",
                    "description": "The maximum threshold for error relative to the baseline."
                },
                "minimumWarning": {
                    "type": "string",
                    "description": "The minimum threshold for warning relative to the baseline."
                },
                "minimumError": {
                    "type": "string",
                    "description": "The minimum threshold for error relative to the baseline."
                },
                "warning": {
                    "type": "string",
                    "description": "The threshold for warning relative to the baseline (min & max)."
                },
                "error": {
                    "type": "string",
                    "description": "The threshold for error relative to the baseline (min & max)."
                }
            },
            "additionalProperties": false,
            "required": ["type"]
        }
    }
};

const esbuildOptions = {
    entryPoints: ['src/main.ts'], // main
    bundle: true, // true|false
    outfile: '', // string
    outdir: 'dist/esbuild', // outpath
    external: [], // eg: ['fsevents']
    format: 'esm', // iife, cjs, or esm
    inject: [], // eg: ['./process-shim.js']
    loader: {
        '.html': 'text',
        '.css': 'text',
        '.svg': 'text',
    },
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
    tsconfigRaw: ``,
    absWorkingDir: process.cwd(), // string: a file-system path

    // Currently not used:
    // assetNames: 'assets/[name]-[hash]', 
    // require('esbuild').serve ...
    // banner: { js: '//comment', css: '/*comment*/', },
    // charset: 'utf8',
    // chunkNames: 'chunks/[name]-[hash]',
    // color: true,
    // conditions: ['custom1', 'custom2'],
    // drop: ['debugger'],
    // entryNames: '[dir]/[name]-[hash]',
    // footer: { js: '//comment', css: '/*comment*/', },
    // globalName: 'xyz',
    // ignoreAnnotations: true,
    // incremental: true,
    // legalComments: 'eof',
    // logLevel: 'error',
    // logLimit: 0,
    // nodePaths: ['someDir'],
    // outExtension: { '.js': '.mjs' },
    // outbase: 'src',
    // preserveSymlinks: true,
    // publicPath: 'https://www.example.com/v1',
    // pure: ['console.log'],
    // resolveExtensions: ['.ts', '.js'],
    // sourceRoot: 'https://raw.githubusercontent.com/some/repo/v1.2.3/',
    // sourcefile: 'example.js',
    // "sourcesContent": ["bar()", "foo()\nimport './bar'"],
    // !!! stdin: {}
};

const customOptions = {
    port: 4200, // live-server port
    open: false, // open in default browser
    serve: true, // start the live-server
    project: '', // project name from the angular.json file
    mode: 'build', // angular.json architect->[mode], build|test|serve ...
};

const cleanOptions = (options = {}) => {
    const output = {};
    for (const k in options) {
        if (
            typeof options[k] !== 'undefined' 
            && options[k] !== '') {
            output[k] = options[k];
        }
    }

    return output;
}

const arrayUnique = (value, index, self) => {
    return self.indexOf(value) === index;
};

const checkType = (key, value, type) => {
    switch (type) {
        case 'boolean':
            return (value === 'true' || value === true);
            break;
        case 'number':
            const v = parseInt(value)
            return isNaN(v) ? 'undefined' : v;
            break;
        case 'string':
            return String(value);
            break;
        default:
            return value;
    }
}

const normalizeArguments = (options = {}) => {
    options = { ...esbuildOptions, ...customOptions, ...options };

    // Parsing arguments.
    const args = yargs(hideBin(process.argv)).argv;
    const argsKeys = Object.keys(args).filter( k => !/^[\_\$]/.test(k) );
    if (argsKeys.length) {
        const keys = [...Object.keys({ ...schema.properties }), ...argsKeys];
        for (const key of keys) {
            const prop = schema.properties[key];
            if (prop) {
                options[key] = checkType( key, 
                    args[key] || prop.default,
                    prop.type
                );
            } else if (!/^[\_\$]/.test(key)) {
                options[key] = checkType( key, args[key], typeof options[key]);
            }
        }
    }

    options = cleanOptions(options);

    const buildOptions = {};
    const buildKeys = Object.keys(esbuildOptions);
    Object.keys(options).forEach(k => {
        if (
            typeof options[k] !== undefined
            && buildKeys.includes(k)
        ) {
            buildOptions[k] = options[k];
        }
    });

    return { options, buildOptions };
};

module.exports = {
    schema,
    esbuildOptions,
    normalizeArguments,
};
