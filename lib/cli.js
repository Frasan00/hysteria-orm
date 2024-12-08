#!/usr/bin/env node
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// node_modules/tsup/assets/cjs_shims.js
var init_cjs_shims = __esm({
  "node_modules/tsup/assets/cjs_shims.js"() {
    "use strict";
  }
});

// node_modules/make-error/index.js
var require_make_error = __commonJS({
  "node_modules/make-error/index.js"(exports2, module2) {
    "use strict";
    init_cjs_shims();
    var construct = typeof Reflect !== "undefined" ? Reflect.construct : void 0;
    var defineProperty = Object.defineProperty;
    var captureStackTrace = Error.captureStackTrace;
    if (captureStackTrace === void 0) {
      captureStackTrace = function captureStackTrace2(error) {
        var container = new Error();
        defineProperty(error, "stack", {
          configurable: true,
          get: function getStack() {
            var stack = container.stack;
            defineProperty(this, "stack", {
              configurable: true,
              value: stack,
              writable: true
            });
            return stack;
          },
          set: function setStack(stack) {
            defineProperty(error, "stack", {
              configurable: true,
              value: stack,
              writable: true
            });
          }
        });
      };
    }
    function BaseError(message) {
      if (message !== void 0) {
        defineProperty(this, "message", {
          configurable: true,
          value: message,
          writable: true
        });
      }
      var cname = this.constructor.name;
      if (cname !== void 0 && cname !== this.name) {
        defineProperty(this, "name", {
          configurable: true,
          value: cname,
          writable: true
        });
      }
      captureStackTrace(this, this.constructor);
    }
    BaseError.prototype = Object.create(Error.prototype, {
      // See: https://github.com/JsCommunity/make-error/issues/4
      constructor: {
        configurable: true,
        value: BaseError,
        writable: true
      }
    });
    var setFunctionName = function() {
      function setFunctionName2(fn, name) {
        return defineProperty(fn, "name", {
          configurable: true,
          value: name
        });
      }
      try {
        var f = function() {
        };
        setFunctionName2(f, "foo");
        if (f.name === "foo") {
          return setFunctionName2;
        }
      } catch (_) {
      }
    }();
    function makeError(constructor, super_) {
      if (super_ == null || super_ === Error) {
        super_ = BaseError;
      } else if (typeof super_ !== "function") {
        throw new TypeError("super_ should be a function");
      }
      var name;
      if (typeof constructor === "string") {
        name = constructor;
        constructor = construct !== void 0 ? function() {
          return construct(super_, arguments, this.constructor);
        } : function() {
          super_.apply(this, arguments);
        };
        if (setFunctionName !== void 0) {
          setFunctionName(constructor, name);
          name = void 0;
        }
      } else if (typeof constructor !== "function") {
        throw new TypeError("constructor should be either a string or a function");
      }
      constructor.super_ = constructor["super"] = super_;
      var properties = {
        constructor: {
          configurable: true,
          value: constructor,
          writable: true
        }
      };
      if (name !== void 0) {
        properties.name = {
          configurable: true,
          value: name,
          writable: true
        };
      }
      constructor.prototype = Object.create(super_.prototype, properties);
      return constructor;
    }
    exports2 = module2.exports = makeError;
    exports2.BaseError = BaseError;
  }
});

// node_modules/yn/lenient.js
var require_lenient = __commonJS({
  "node_modules/yn/lenient.js"(exports2, module2) {
    "use strict";
    init_cjs_shims();
    var YES_MATCH_SCORE_THRESHOLD = 2;
    var NO_MATCH_SCORE_THRESHOLD = 1.25;
    var yMatch = /* @__PURE__ */ new Map([
      [5, 0.25],
      [6, 0.25],
      [7, 0.25],
      ["t", 0.75],
      ["y", 1],
      ["u", 0.75],
      ["g", 0.25],
      ["h", 0.25],
      ["j", 0.25]
    ]);
    var eMatch = /* @__PURE__ */ new Map([
      [2, 0.25],
      [3, 0.25],
      [4, 0.25],
      ["w", 0.75],
      ["e", 1],
      ["r", 0.75],
      ["s", 0.25],
      ["d", 0.25],
      ["f", 0.25]
    ]);
    var sMatch = /* @__PURE__ */ new Map([
      ["q", 0.25],
      ["w", 0.25],
      ["e", 0.25],
      ["a", 0.75],
      ["s", 1],
      ["d", 0.75],
      ["z", 0.25],
      ["x", 0.25],
      ["c", 0.25]
    ]);
    var nMatch = /* @__PURE__ */ new Map([
      ["h", 0.25],
      ["j", 0.25],
      ["k", 0.25],
      ["b", 0.75],
      ["n", 1],
      ["m", 0.75]
    ]);
    var oMatch = /* @__PURE__ */ new Map([
      [9, 0.25],
      [0, 0.25],
      ["i", 0.75],
      ["o", 1],
      ["p", 0.75],
      ["k", 0.25],
      ["l", 0.25]
    ]);
    function getYesMatchScore(value2) {
      const [y, e, s] = value2;
      let score = 0;
      if (yMatch.has(y)) {
        score += yMatch.get(y);
      }
      if (eMatch.has(e)) {
        score += eMatch.get(e);
      }
      if (sMatch.has(s)) {
        score += sMatch.get(s);
      }
      return score;
    }
    function getNoMatchScore(value2) {
      const [n, o] = value2;
      let score = 0;
      if (nMatch.has(n)) {
        score += nMatch.get(n);
      }
      if (oMatch.has(o)) {
        score += oMatch.get(o);
      }
      return score;
    }
    module2.exports = (input, options) => {
      if (getYesMatchScore(input) >= YES_MATCH_SCORE_THRESHOLD) {
        return true;
      }
      if (getNoMatchScore(input) >= NO_MATCH_SCORE_THRESHOLD) {
        return false;
      }
      return options.default;
    };
  }
});

// node_modules/yn/index.js
var require_yn = __commonJS({
  "node_modules/yn/index.js"(exports2, module2) {
    "use strict";
    init_cjs_shims();
    var lenient = require_lenient();
    var yn = (input, options) => {
      input = String(input).trim();
      options = Object.assign({
        lenient: false,
        default: null
      }, options);
      if (options.default !== null && typeof options.default !== "boolean") {
        throw new TypeError(`Expected the \`default\` option to be of type \`boolean\`, got \`${typeof options.default}\``);
      }
      if (/^(?:y|yes|true|1)$/i.test(input)) {
        return true;
      }
      if (/^(?:n|no|false|0)$/i.test(input)) {
        return false;
      }
      if (options.lenient === true) {
        return lenient(input, options);
      }
      return options.default;
    };
    module2.exports = yn;
    module2.exports.default = yn;
  }
});

// node_modules/create-require/create-require.js
var require_create_require = __commonJS({
  "node_modules/create-require/create-require.js"(exports2, module2) {
    "use strict";
    init_cjs_shims();
    var nativeModule = require("module");
    var path3 = require("path");
    var fs3 = require("fs");
    function createRequire(filename) {
      if (!filename) {
        filename = process.cwd();
      }
      if (isDir(filename)) {
        filename = path3.join(filename, "index.js");
      }
      if (nativeModule.createRequire) {
        return nativeModule.createRequire(filename);
      }
      if (nativeModule.createRequireFromPath) {
        return nativeModule.createRequireFromPath(filename);
      }
      return _createRequire(filename);
    }
    function _createRequire(filename) {
      const mod = new nativeModule.Module(filename, null);
      mod.filename = filename;
      mod.paths = nativeModule.Module._nodeModulePaths(path3.dirname(filename));
      mod._compile("module.exports = require;", filename);
      return mod.exports;
    }
    function isDir(path4) {
      try {
        const stat = fs3.lstatSync(path4);
        return stat.isDirectory();
      } catch (e) {
        return false;
      }
    }
    module2.exports = createRequire;
  }
});

// node_modules/v8-compile-cache-lib/v8-compile-cache.js
var require_v8_compile_cache = __commonJS({
  "node_modules/v8-compile-cache-lib/v8-compile-cache.js"(exports2, module2) {
    "use strict";
    init_cjs_shims();
    var Module = require("module");
    var crypto = require("crypto");
    var fs3 = require("fs");
    var path3 = require("path");
    var vm = require("vm");
    var os = require("os");
    var hasOwnProperty = Object.prototype.hasOwnProperty;
    var FileSystemBlobStore = class {
      constructor(directory, prefix) {
        const name = prefix ? slashEscape(prefix + ".") : "";
        this._blobFilename = path3.join(directory, name + "BLOB");
        this._mapFilename = path3.join(directory, name + "MAP");
        this._lockFilename = path3.join(directory, name + "LOCK");
        this._directory = directory;
        this._load();
      }
      has(key, invalidationKey) {
        if (hasOwnProperty.call(this._memoryBlobs, key)) {
          return this._invalidationKeys[key] === invalidationKey;
        } else if (hasOwnProperty.call(this._storedMap, key)) {
          return this._storedMap[key][0] === invalidationKey;
        }
        return false;
      }
      get(key, invalidationKey) {
        if (hasOwnProperty.call(this._memoryBlobs, key)) {
          if (this._invalidationKeys[key] === invalidationKey) {
            return this._memoryBlobs[key];
          }
        } else if (hasOwnProperty.call(this._storedMap, key)) {
          const mapping = this._storedMap[key];
          if (mapping[0] === invalidationKey) {
            return this._storedBlob.slice(mapping[1], mapping[2]);
          }
        }
      }
      set(key, invalidationKey, buffer) {
        this._invalidationKeys[key] = invalidationKey;
        this._memoryBlobs[key] = buffer;
        this._dirty = true;
      }
      delete(key) {
        if (hasOwnProperty.call(this._memoryBlobs, key)) {
          this._dirty = true;
          delete this._memoryBlobs[key];
        }
        if (hasOwnProperty.call(this._invalidationKeys, key)) {
          this._dirty = true;
          delete this._invalidationKeys[key];
        }
        if (hasOwnProperty.call(this._storedMap, key)) {
          this._dirty = true;
          delete this._storedMap[key];
        }
      }
      isDirty() {
        return this._dirty;
      }
      save() {
        const dump = this._getDump();
        const blobToStore = Buffer.concat(dump[0]);
        const mapToStore = JSON.stringify(dump[1]);
        try {
          mkdirpSync(this._directory);
          fs3.writeFileSync(this._lockFilename, "LOCK", { flag: "wx" });
        } catch (error) {
          return false;
        }
        try {
          fs3.writeFileSync(this._blobFilename, blobToStore);
          fs3.writeFileSync(this._mapFilename, mapToStore);
        } finally {
          fs3.unlinkSync(this._lockFilename);
        }
        return true;
      }
      _load() {
        try {
          this._storedBlob = fs3.readFileSync(this._blobFilename);
          this._storedMap = JSON.parse(fs3.readFileSync(this._mapFilename));
        } catch (e) {
          this._storedBlob = Buffer.alloc(0);
          this._storedMap = {};
        }
        this._dirty = false;
        this._memoryBlobs = {};
        this._invalidationKeys = {};
      }
      _getDump() {
        const buffers = [];
        const newMap = {};
        let offset = 0;
        function push(key, invalidationKey, buffer) {
          buffers.push(buffer);
          newMap[key] = [invalidationKey, offset, offset + buffer.length];
          offset += buffer.length;
        }
        for (const key of Object.keys(this._memoryBlobs)) {
          const buffer = this._memoryBlobs[key];
          const invalidationKey = this._invalidationKeys[key];
          push(key, invalidationKey, buffer);
        }
        for (const key of Object.keys(this._storedMap)) {
          if (hasOwnProperty.call(newMap, key)) continue;
          const mapping = this._storedMap[key];
          const buffer = this._storedBlob.slice(mapping[1], mapping[2]);
          push(key, mapping[0], buffer);
        }
        return [buffers, newMap];
      }
    };
    var NativeCompileCache = class {
      constructor() {
        this._cacheStore = null;
        this._previousModuleCompile = null;
      }
      setCacheStore(cacheStore) {
        this._cacheStore = cacheStore;
      }
      install() {
        const self2 = this;
        const hasRequireResolvePaths = typeof require.resolve.paths === "function";
        this._previousModuleCompile = Module.prototype._compile;
        Module.prototype._compile = this._ownModuleCompile = _ownModuleCompile;
        self2.enabled = true;
        function _ownModuleCompile(content, filename) {
          if (!self2.enabled) return this._previousModuleCompile.apply(this, arguments);
          const mod = this;
          function require2(id) {
            return mod.require(id);
          }
          function resolve(request, options) {
            return Module._resolveFilename(request, mod, false, options);
          }
          require2.resolve = resolve;
          if (hasRequireResolvePaths) {
            resolve.paths = function paths(request) {
              return Module._resolveLookupPaths(request, mod, true);
            };
          }
          require2.main = process.mainModule;
          require2.extensions = Module._extensions;
          require2.cache = Module._cache;
          const dirname = path3.dirname(filename);
          const compiledWrapper = self2._moduleCompile(filename, content);
          const args = [mod.exports, require2, mod, filename, dirname, process, global, Buffer];
          return compiledWrapper.apply(mod.exports, args);
        }
      }
      uninstall() {
        this.enabled = false;
        if (Module.prototype._compile === this._ownModuleCompile) {
          Module.prototype._compile = this._previousModuleCompile;
        }
      }
      _moduleCompile(filename, content) {
        var contLen = content.length;
        if (contLen >= 2) {
          if (content.charCodeAt(0) === 35 && content.charCodeAt(1) === 33) {
            if (contLen === 2) {
              content = "";
            } else {
              var i = 2;
              for (; i < contLen; ++i) {
                var code = content.charCodeAt(i);
                if (code === 10 || code === 13) break;
              }
              if (i === contLen) {
                content = "";
              } else {
                content = content.slice(i);
              }
            }
          }
        }
        var wrapper = Module.wrap(content);
        var invalidationKey = crypto.createHash("sha1").update(content, "utf8").digest("hex");
        var buffer = this._cacheStore.get(filename, invalidationKey);
        var script = new vm.Script(wrapper, {
          filename,
          lineOffset: 0,
          displayErrors: true,
          cachedData: buffer,
          produceCachedData: true
        });
        if (script.cachedDataProduced) {
          this._cacheStore.set(filename, invalidationKey, script.cachedData);
        } else if (script.cachedDataRejected) {
          this._cacheStore.delete(filename);
        }
        var compiledWrapper = script.runInThisContext({
          filename,
          lineOffset: 0,
          columnOffset: 0,
          displayErrors: true
        });
        return compiledWrapper;
      }
    };
    function mkdirpSync(p_) {
      _mkdirpSync(path3.resolve(p_), 511);
    }
    function _mkdirpSync(p, mode) {
      try {
        fs3.mkdirSync(p, mode);
      } catch (err0) {
        if (err0.code === "ENOENT") {
          _mkdirpSync(path3.dirname(p));
          _mkdirpSync(p);
        } else {
          try {
            const stat = fs3.statSync(p);
            if (!stat.isDirectory()) {
              throw err0;
            }
          } catch (err1) {
            throw err0;
          }
        }
      }
    }
    function slashEscape(str) {
      const ESCAPE_LOOKUP = {
        "\\": "zB",
        ":": "zC",
        "/": "zS",
        "\0": "z0",
        "z": "zZ"
      };
      const ESCAPE_REGEX = /[\\:/\x00z]/g;
      return str.replace(ESCAPE_REGEX, (match) => ESCAPE_LOOKUP[match]);
    }
    function supportsCachedData() {
      const script = new vm.Script('""', { produceCachedData: true });
      return script.cachedDataProduced === true;
    }
    function getCacheDir() {
      const v8_compile_cache_cache_dir = process.env.V8_COMPILE_CACHE_CACHE_DIR;
      if (v8_compile_cache_cache_dir) {
        return v8_compile_cache_cache_dir;
      }
      const dirname = typeof process.getuid === "function" ? "v8-compile-cache-" + process.getuid() : "v8-compile-cache";
      const version = typeof process.versions.v8 === "string" ? process.versions.v8 : typeof process.versions.chakracore === "string" ? "chakracore-" + process.versions.chakracore : "node-" + process.version;
      const cacheDir = path3.join(os.tmpdir(), dirname, version);
      return cacheDir;
    }
    function getMainName() {
      const mainName = require.main && typeof require.main.filename === "string" ? require.main.filename : process.cwd();
      return mainName;
    }
    function install(opts) {
      if (!process.env.DISABLE_V8_COMPILE_CACHE && supportsCachedData()) {
        if (typeof opts === "undefined") opts = {};
        let cacheDir = opts.cacheDir;
        if (typeof cacheDir === "undefined") cacheDir = getCacheDir();
        let prefix = opts.prefix;
        if (typeof prefix === "undefined") prefix = getMainName();
        const blobStore = new FileSystemBlobStore(cacheDir, prefix);
        const nativeCompileCache = new NativeCompileCache();
        nativeCompileCache.setCacheStore(blobStore);
        nativeCompileCache.install();
        let uninstalled = false;
        const uninstall = () => {
          if (uninstalled) return;
          uninstalled = true;
          process.removeListener("exit", uninstall);
          if (blobStore.isDirty()) {
            blobStore.save();
          }
          nativeCompileCache.uninstall();
        };
        process.once("exit", uninstall);
        return { uninstall };
      }
    }
    module2.exports.install = install;
    module2.exports.__TEST__ = {
      FileSystemBlobStore,
      NativeCompileCache,
      mkdirpSync,
      slashEscape,
      supportsCachedData,
      getCacheDir,
      getMainName
    };
  }
});

// node_modules/ts-node/dist/util.js
var require_util = __commonJS({
  "node_modules/ts-node/dist/util.js"(exports2) {
    "use strict";
    init_cjs_shims();
    var _a;
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.versionGteLt = exports2.once = exports2.getBasePathForProjectLocalDependencyResolution = exports2.createProjectLocalResolveHelper = exports2.attemptRequireWithV8CompileCache = exports2.cachedLookup = exports2.hasOwnProperty = exports2.normalizeSlashes = exports2.parse = exports2.split = exports2.assign = exports2.yn = exports2.createRequire = void 0;
    var module_1 = require("module");
    var ynModule = require_yn();
    var path_1 = require("path");
    exports2.createRequire = (_a = module_1.createRequire !== null && module_1.createRequire !== void 0 ? module_1.createRequire : module_1.createRequireFromPath) !== null && _a !== void 0 ? _a : require_create_require();
    function yn(value2) {
      var _a2;
      return (_a2 = ynModule(value2)) !== null && _a2 !== void 0 ? _a2 : void 0;
    }
    exports2.yn = yn;
    function assign(initialValue, ...sources) {
      for (const source of sources) {
        for (const key of Object.keys(source)) {
          const value2 = source[key];
          if (value2 !== void 0)
            initialValue[key] = value2;
        }
      }
      return initialValue;
    }
    exports2.assign = assign;
    function split(value2) {
      return typeof value2 === "string" ? value2.split(/ *, */g).filter((v) => v !== "") : void 0;
    }
    exports2.split = split;
    function parse(value2) {
      return typeof value2 === "string" ? JSON.parse(value2) : void 0;
    }
    exports2.parse = parse;
    var directorySeparator = "/";
    var backslashRegExp = /\\/g;
    function normalizeSlashes(value2) {
      return value2.replace(backslashRegExp, directorySeparator);
    }
    exports2.normalizeSlashes = normalizeSlashes;
    function hasOwnProperty(object, property) {
      return Object.prototype.hasOwnProperty.call(object, property);
    }
    exports2.hasOwnProperty = hasOwnProperty;
    function cachedLookup(fn) {
      const cache = /* @__PURE__ */ new Map();
      return (arg) => {
        if (!cache.has(arg)) {
          const v = fn(arg);
          cache.set(arg, v);
          return v;
        }
        return cache.get(arg);
      };
    }
    exports2.cachedLookup = cachedLookup;
    function attemptRequireWithV8CompileCache(requireFn, specifier) {
      try {
        const v8CC = require_v8_compile_cache().install();
        try {
          return requireFn(specifier);
        } finally {
          v8CC === null || v8CC === void 0 ? void 0 : v8CC.uninstall();
        }
      } catch (e) {
        return requireFn(specifier);
      }
    }
    exports2.attemptRequireWithV8CompileCache = attemptRequireWithV8CompileCache;
    function createProjectLocalResolveHelper(localDirectory) {
      return function projectLocalResolveHelper(specifier, fallbackToTsNodeRelative) {
        return require.resolve(specifier, {
          paths: fallbackToTsNodeRelative ? [localDirectory, __dirname] : [localDirectory]
        });
      };
    }
    exports2.createProjectLocalResolveHelper = createProjectLocalResolveHelper;
    function getBasePathForProjectLocalDependencyResolution(configFilePath, projectSearchDirOption, projectOption, cwdOption) {
      var _a2;
      if (configFilePath != null)
        return (0, path_1.dirname)(configFilePath);
      return (_a2 = projectSearchDirOption !== null && projectSearchDirOption !== void 0 ? projectSearchDirOption : projectOption) !== null && _a2 !== void 0 ? _a2 : cwdOption;
    }
    exports2.getBasePathForProjectLocalDependencyResolution = getBasePathForProjectLocalDependencyResolution;
    function once(fn) {
      let value2;
      let ran = false;
      function onceFn(...args) {
        if (ran)
          return value2;
        value2 = fn(...args);
        ran = true;
        return value2;
      }
      return onceFn;
    }
    exports2.once = once;
    function versionGteLt(version, gteRequirement, ltRequirement) {
      const [major, minor, patch, extra] = parse2(version);
      const [gteMajor, gteMinor, gtePatch] = parse2(gteRequirement);
      const isGte = major > gteMajor || major === gteMajor && (minor > gteMinor || minor === gteMinor && patch >= gtePatch);
      let isLt = true;
      if (ltRequirement) {
        const [ltMajor, ltMinor, ltPatch] = parse2(ltRequirement);
        isLt = major < ltMajor || major === ltMajor && (minor < ltMinor || minor === ltMinor && patch < ltPatch);
      }
      return isGte && isLt;
      function parse2(requirement) {
        return requirement.split(/[\.-]/).map((s) => parseInt(s, 10));
      }
    }
    exports2.versionGteLt = versionGteLt;
  }
});

// node_modules/ts-node/dist/ts-internals.js
var require_ts_internals = __commonJS({
  "node_modules/ts-node/dist/ts-internals.js"(exports2) {
    "use strict";
    init_cjs_shims();
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getEmitScriptTarget = exports2.getUseDefineForClassFields = exports2.getPatternFromSpec = exports2.createTsInternals = void 0;
    var path_1 = require("path");
    var util_1 = require_util();
    exports2.createTsInternals = (0, util_1.cachedLookup)(createTsInternalsUncached);
    function createTsInternalsUncached(_ts) {
      const ts = _ts;
      function getExtendsConfigPath(extendedConfig, host, basePath, errors, createDiagnostic) {
        extendedConfig = (0, util_1.normalizeSlashes)(extendedConfig);
        if (isRootedDiskPath(extendedConfig) || startsWith(extendedConfig, "./") || startsWith(extendedConfig, "../")) {
          let extendedConfigPath = getNormalizedAbsolutePath(extendedConfig, basePath);
          if (!host.fileExists(extendedConfigPath) && !endsWith(extendedConfigPath, ts.Extension.Json)) {
            extendedConfigPath = `${extendedConfigPath}.json`;
            if (!host.fileExists(extendedConfigPath)) {
              errors.push(createDiagnostic(ts.Diagnostics.File_0_not_found, extendedConfig));
              return void 0;
            }
          }
          return extendedConfigPath;
        }
        const tsGte5_3_0 = (0, util_1.versionGteLt)(ts.version, "5.3.0");
        const resolved = ts.nodeModuleNameResolver(
          extendedConfig,
          combinePaths(basePath, "tsconfig.json"),
          { moduleResolution: ts.ModuleResolutionKind.NodeJs },
          host,
          /*cache*/
          void 0,
          /*projectRefs*/
          void 0,
          /*conditionsOrIsConfigLookup*/
          tsGte5_3_0 ? void 0 : true,
          /*isConfigLookup*/
          tsGte5_3_0 ? true : void 0
        );
        if (resolved.resolvedModule) {
          return resolved.resolvedModule.resolvedFileName;
        }
        errors.push(createDiagnostic(ts.Diagnostics.File_0_not_found, extendedConfig));
        return void 0;
      }
      return { getExtendsConfigPath };
    }
    function isRootedDiskPath(path3) {
      return (0, path_1.isAbsolute)(path3);
    }
    function combinePaths(path3, ...paths) {
      return (0, util_1.normalizeSlashes)((0, path_1.resolve)(path3, ...paths.filter((path4) => path4)));
    }
    function getNormalizedAbsolutePath(fileName, currentDirectory) {
      return (0, util_1.normalizeSlashes)(currentDirectory != null ? (0, path_1.resolve)(currentDirectory, fileName) : (0, path_1.resolve)(fileName));
    }
    function startsWith(str, prefix) {
      return str.lastIndexOf(prefix, 0) === 0;
    }
    function endsWith(str, suffix) {
      const expectedPos = str.length - suffix.length;
      return expectedPos >= 0 && str.indexOf(suffix, expectedPos) === expectedPos;
    }
    var reservedCharacterPattern = /[^\w\s\/]/g;
    function getPatternFromSpec(spec, basePath) {
      const pattern = spec && getSubPatternFromSpec(spec, basePath, excludeMatcher);
      return pattern && `^(${pattern})${"($|/)"}`;
    }
    exports2.getPatternFromSpec = getPatternFromSpec;
    function getSubPatternFromSpec(spec, basePath, { singleAsteriskRegexFragment, doubleAsteriskRegexFragment, replaceWildcardCharacter: replaceWildcardCharacter2 }) {
      let subpattern = "";
      let hasWrittenComponent = false;
      const components = getNormalizedPathComponents(spec, basePath);
      const lastComponent = last(components);
      components[0] = removeTrailingDirectorySeparator(components[0]);
      if (isImplicitGlob(lastComponent)) {
        components.push("**", "*");
      }
      let optionalCount = 0;
      for (let component of components) {
        if (component === "**") {
          subpattern += doubleAsteriskRegexFragment;
        } else {
          if (hasWrittenComponent) {
            subpattern += directorySeparator;
          }
          subpattern += component.replace(reservedCharacterPattern, replaceWildcardCharacter2);
        }
        hasWrittenComponent = true;
      }
      while (optionalCount > 0) {
        subpattern += ")?";
        optionalCount--;
      }
      return subpattern;
    }
    var excludeMatcher = {
      singleAsteriskRegexFragment: "[^/]*",
      doubleAsteriskRegexFragment: "(/.+?)?",
      replaceWildcardCharacter: (match) => replaceWildcardCharacter(match, excludeMatcher.singleAsteriskRegexFragment)
    };
    function getNormalizedPathComponents(path3, currentDirectory) {
      return reducePathComponents(getPathComponents(path3, currentDirectory));
    }
    function getPathComponents(path3, currentDirectory = "") {
      path3 = combinePaths(currentDirectory, path3);
      return pathComponents(path3, getRootLength(path3));
    }
    function reducePathComponents(components) {
      if (!some(components))
        return [];
      const reduced = [components[0]];
      for (let i = 1; i < components.length; i++) {
        const component = components[i];
        if (!component)
          continue;
        if (component === ".")
          continue;
        if (component === "..") {
          if (reduced.length > 1) {
            if (reduced[reduced.length - 1] !== "..") {
              reduced.pop();
              continue;
            }
          } else if (reduced[0])
            continue;
        }
        reduced.push(component);
      }
      return reduced;
    }
    function getRootLength(path3) {
      const rootLength = getEncodedRootLength(path3);
      return rootLength < 0 ? ~rootLength : rootLength;
    }
    function getEncodedRootLength(path3) {
      if (!path3)
        return 0;
      const ch0 = path3.charCodeAt(0);
      if (ch0 === 47 || ch0 === 92) {
        if (path3.charCodeAt(1) !== ch0)
          return 1;
        const p1 = path3.indexOf(ch0 === 47 ? directorySeparator : altDirectorySeparator, 2);
        if (p1 < 0)
          return path3.length;
        return p1 + 1;
      }
      if (isVolumeCharacter(ch0) && path3.charCodeAt(1) === 58) {
        const ch2 = path3.charCodeAt(2);
        if (ch2 === 47 || ch2 === 92)
          return 3;
        if (path3.length === 2)
          return 2;
      }
      const schemeEnd = path3.indexOf(urlSchemeSeparator);
      if (schemeEnd !== -1) {
        const authorityStart = schemeEnd + urlSchemeSeparator.length;
        const authorityEnd = path3.indexOf(directorySeparator, authorityStart);
        if (authorityEnd !== -1) {
          const scheme = path3.slice(0, schemeEnd);
          const authority = path3.slice(authorityStart, authorityEnd);
          if (scheme === "file" && (authority === "" || authority === "localhost") && isVolumeCharacter(path3.charCodeAt(authorityEnd + 1))) {
            const volumeSeparatorEnd = getFileUrlVolumeSeparatorEnd(path3, authorityEnd + 2);
            if (volumeSeparatorEnd !== -1) {
              if (path3.charCodeAt(volumeSeparatorEnd) === 47) {
                return ~(volumeSeparatorEnd + 1);
              }
              if (volumeSeparatorEnd === path3.length) {
                return ~volumeSeparatorEnd;
              }
            }
          }
          return ~(authorityEnd + 1);
        }
        return ~path3.length;
      }
      return 0;
    }
    function hasTrailingDirectorySeparator(path3) {
      return path3.length > 0 && isAnyDirectorySeparator(path3.charCodeAt(path3.length - 1));
    }
    function isAnyDirectorySeparator(charCode) {
      return charCode === 47 || charCode === 92;
    }
    function removeTrailingDirectorySeparator(path3) {
      if (hasTrailingDirectorySeparator(path3)) {
        return path3.substr(0, path3.length - 1);
      }
      return path3;
    }
    var directorySeparator = "/";
    var altDirectorySeparator = "\\";
    var urlSchemeSeparator = "://";
    function isVolumeCharacter(charCode) {
      return charCode >= 97 && charCode <= 122 || charCode >= 65 && charCode <= 90;
    }
    function getFileUrlVolumeSeparatorEnd(url, start) {
      const ch0 = url.charCodeAt(start);
      if (ch0 === 58)
        return start + 1;
      if (ch0 === 37 && url.charCodeAt(start + 1) === 51) {
        const ch2 = url.charCodeAt(start + 2);
        if (ch2 === 97 || ch2 === 65)
          return start + 3;
      }
      return -1;
    }
    function some(array, predicate) {
      if (array) {
        if (predicate) {
          for (const v of array) {
            if (predicate(v)) {
              return true;
            }
          }
        } else {
          return array.length > 0;
        }
      }
      return false;
    }
    function pathComponents(path3, rootLength) {
      const root = path3.substring(0, rootLength);
      const rest = path3.substring(rootLength).split(directorySeparator);
      if (rest.length && !lastOrUndefined(rest))
        rest.pop();
      return [root, ...rest];
    }
    function lastOrUndefined(array) {
      return array.length === 0 ? void 0 : array[array.length - 1];
    }
    function last(array) {
      return array[array.length - 1];
    }
    function replaceWildcardCharacter(match, singleAsteriskRegexFragment) {
      return match === "*" ? singleAsteriskRegexFragment : match === "?" ? "[^/]" : "\\" + match;
    }
    function isImplicitGlob(lastPathComponent) {
      return !/[.*?]/.test(lastPathComponent);
    }
    var ts_ScriptTarget_ES5 = 1;
    var ts_ScriptTarget_ES2022 = 9;
    var ts_ScriptTarget_ESNext = 99;
    var ts_ModuleKind_Node16 = 100;
    var ts_ModuleKind_NodeNext = 199;
    function getUseDefineForClassFields(compilerOptions) {
      return compilerOptions.useDefineForClassFields === void 0 ? getEmitScriptTarget(compilerOptions) >= ts_ScriptTarget_ES2022 : compilerOptions.useDefineForClassFields;
    }
    exports2.getUseDefineForClassFields = getUseDefineForClassFields;
    function getEmitScriptTarget(compilerOptions) {
      var _a;
      return (_a = compilerOptions.target) !== null && _a !== void 0 ? _a : compilerOptions.module === ts_ModuleKind_Node16 && ts_ScriptTarget_ES2022 || compilerOptions.module === ts_ModuleKind_NodeNext && ts_ScriptTarget_ESNext || ts_ScriptTarget_ES5;
    }
    exports2.getEmitScriptTarget = getEmitScriptTarget;
  }
});

// node_modules/@tsconfig/node16/tsconfig.json
var require_tsconfig = __commonJS({
  "node_modules/@tsconfig/node16/tsconfig.json"(exports2, module2) {
    module2.exports = {
      $schema: "https://json.schemastore.org/tsconfig",
      display: "Node 16",
      compilerOptions: {
        lib: ["es2021"],
        module: "Node16",
        target: "es2021",
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        moduleResolution: "node"
      }
    };
  }
});

// node_modules/@tsconfig/node14/tsconfig.json
var require_tsconfig2 = __commonJS({
  "node_modules/@tsconfig/node14/tsconfig.json"(exports2, module2) {
    module2.exports = {
      $schema: "https://json.schemastore.org/tsconfig",
      display: "Node 14",
      compilerOptions: {
        lib: ["es2020"],
        module: "commonjs",
        target: "es2020",
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        moduleResolution: "node"
      }
    };
  }
});

// node_modules/@tsconfig/node12/tsconfig.json
var require_tsconfig3 = __commonJS({
  "node_modules/@tsconfig/node12/tsconfig.json"(exports2, module2) {
    module2.exports = {
      $schema: "https://json.schemastore.org/tsconfig",
      display: "Node 12",
      compilerOptions: {
        lib: ["es2019", "es2020.promise", "es2020.bigint", "es2020.string"],
        module: "commonjs",
        target: "es2019",
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        moduleResolution: "node"
      }
    };
  }
});

// node_modules/@tsconfig/node10/tsconfig.json
var require_tsconfig4 = __commonJS({
  "node_modules/@tsconfig/node10/tsconfig.json"(exports2, module2) {
    module2.exports = {
      $schema: "https://json.schemastore.org/tsconfig",
      compilerOptions: {
        lib: ["es2018"],
        module: "commonjs",
        target: "es2018",
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        moduleResolution: "node"
      }
    };
  }
});

// node_modules/ts-node/dist/tsconfigs.js
var require_tsconfigs = __commonJS({
  "node_modules/ts-node/dist/tsconfigs.js"(exports2) {
    "use strict";
    init_cjs_shims();
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getDefaultTsconfigJsonForNodeVersion = void 0;
    var nodeMajor = parseInt(process.versions.node.split(".")[0], 10);
    function getDefaultTsconfigJsonForNodeVersion(ts) {
      const tsInternal = ts;
      if (nodeMajor >= 16) {
        const config = require_tsconfig();
        if (configCompatible(config))
          return config;
      }
      if (nodeMajor >= 14) {
        const config = require_tsconfig2();
        if (configCompatible(config))
          return config;
      }
      if (nodeMajor >= 12) {
        const config = require_tsconfig3();
        if (configCompatible(config))
          return config;
      }
      return require_tsconfig4();
      function configCompatible(config) {
        return typeof ts.ScriptTarget[config.compilerOptions.target.toUpperCase()] === "number" && tsInternal.libs && config.compilerOptions.lib.every((lib) => tsInternal.libs.includes(lib));
      }
    }
    exports2.getDefaultTsconfigJsonForNodeVersion = getDefaultTsconfigJsonForNodeVersion;
  }
});

// node_modules/ts-node/dist/configuration.js
var require_configuration = __commonJS({
  "node_modules/ts-node/dist/configuration.js"(exports2) {
    "use strict";
    init_cjs_shims();
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getTsConfigDefaults = exports2.ComputeAsCommonRootOfFiles = exports2.loadCompiler = exports2.resolveAndLoadCompiler = exports2.readConfig = exports2.findAndReadConfig = void 0;
    var path_1 = require("path");
    var index_1 = require_dist();
    var ts_internals_1 = require_ts_internals();
    var tsconfigs_1 = require_tsconfigs();
    var util_1 = require_util();
    var TS_NODE_COMPILER_OPTIONS = {
      sourceMap: true,
      inlineSourceMap: false,
      inlineSources: true,
      declaration: false,
      noEmit: false,
      outDir: ".ts-node"
    };
    function fixConfig(ts, config) {
      delete config.options.out;
      delete config.options.outFile;
      delete config.options.composite;
      delete config.options.declarationDir;
      delete config.options.declarationMap;
      delete config.options.emitDeclarationOnly;
      if (config.options.target === void 0) {
        config.options.target = ts.ScriptTarget.ES5;
      }
      if (config.options.module === void 0) {
        config.options.module = ts.ModuleKind.CommonJS;
      }
      return config;
    }
    function findAndReadConfig(rawOptions) {
      var _a, _b, _c, _d, _e;
      const cwd = (0, path_1.resolve)((_c = (_b = (_a = rawOptions.cwd) !== null && _a !== void 0 ? _a : rawOptions.dir) !== null && _b !== void 0 ? _b : index_1.DEFAULTS.cwd) !== null && _c !== void 0 ? _c : process.cwd());
      const compilerName = (_d = rawOptions.compiler) !== null && _d !== void 0 ? _d : index_1.DEFAULTS.compiler;
      let projectLocalResolveDir = (0, util_1.getBasePathForProjectLocalDependencyResolution)(void 0, rawOptions.projectSearchDir, rawOptions.project, cwd);
      let { compiler, ts } = resolveAndLoadCompiler(compilerName, projectLocalResolveDir);
      const { configFilePath, config, tsNodeOptionsFromTsconfig, optionBasePaths } = readConfig(cwd, ts, rawOptions);
      const options = (0, util_1.assign)({}, index_1.DEFAULTS, tsNodeOptionsFromTsconfig || {}, { optionBasePaths }, rawOptions);
      options.require = [
        ...tsNodeOptionsFromTsconfig.require || [],
        ...rawOptions.require || []
      ];
      if (configFilePath) {
        projectLocalResolveDir = (0, util_1.getBasePathForProjectLocalDependencyResolution)(configFilePath, rawOptions.projectSearchDir, rawOptions.project, cwd);
        ({ compiler } = resolveCompiler(options.compiler, (_e = optionBasePaths.compiler) !== null && _e !== void 0 ? _e : projectLocalResolveDir));
      }
      return {
        options,
        config,
        projectLocalResolveDir,
        optionBasePaths,
        configFilePath,
        cwd,
        compiler
      };
    }
    exports2.findAndReadConfig = findAndReadConfig;
    function readConfig(cwd, ts, rawApiOptions) {
      var _a, _b, _c;
      const configChain = [];
      let config = { compilerOptions: {} };
      let basePath = cwd;
      let configFilePath = void 0;
      const projectSearchDir = (0, path_1.resolve)(cwd, (_a = rawApiOptions.projectSearchDir) !== null && _a !== void 0 ? _a : cwd);
      const { fileExists = ts.sys.fileExists, readFile = ts.sys.readFile, skipProject = index_1.DEFAULTS.skipProject, project = index_1.DEFAULTS.project, tsTrace = index_1.DEFAULTS.tsTrace } = rawApiOptions;
      if (!skipProject) {
        if (project) {
          const resolved = (0, path_1.resolve)(cwd, project);
          const nested = (0, path_1.join)(resolved, "tsconfig.json");
          configFilePath = fileExists(nested) ? nested : resolved;
        } else {
          configFilePath = ts.findConfigFile(projectSearchDir, fileExists);
        }
        if (configFilePath) {
          let pathToNextConfigInChain = configFilePath;
          const tsInternals = (0, ts_internals_1.createTsInternals)(ts);
          const errors = [];
          while (true) {
            const result = ts.readConfigFile(pathToNextConfigInChain, readFile);
            if (result.error) {
              return {
                configFilePath,
                config: { errors: [result.error], fileNames: [], options: {} },
                tsNodeOptionsFromTsconfig: {},
                optionBasePaths: {}
              };
            }
            const c = result.config;
            const bp = (0, path_1.dirname)(pathToNextConfigInChain);
            configChain.push({
              config: c,
              basePath: bp,
              configPath: pathToNextConfigInChain
            });
            if (c.extends == null)
              break;
            const resolvedExtendedConfigPath = tsInternals.getExtendsConfigPath(c.extends, {
              fileExists,
              readDirectory: ts.sys.readDirectory,
              readFile,
              useCaseSensitiveFileNames: ts.sys.useCaseSensitiveFileNames,
              trace: tsTrace
            }, bp, errors, ts.createCompilerDiagnostic);
            if (errors.length) {
              return {
                configFilePath,
                config: { errors, fileNames: [], options: {} },
                tsNodeOptionsFromTsconfig: {},
                optionBasePaths: {}
              };
            }
            if (resolvedExtendedConfigPath == null)
              break;
            pathToNextConfigInChain = resolvedExtendedConfigPath;
          }
          ({ config, basePath } = configChain[0]);
        }
      }
      const tsNodeOptionsFromTsconfig = {};
      const optionBasePaths = {};
      for (let i = configChain.length - 1; i >= 0; i--) {
        const { config: config2, basePath: basePath2, configPath } = configChain[i];
        const options = filterRecognizedTsConfigTsNodeOptions(config2["ts-node"]).recognized;
        if (options.require) {
          const tsconfigRelativeResolver = (0, util_1.createProjectLocalResolveHelper)((0, path_1.dirname)(configPath));
          options.require = options.require.map((path3) => tsconfigRelativeResolver(path3, false));
        }
        if (options.scopeDir) {
          options.scopeDir = (0, path_1.resolve)(basePath2, options.scopeDir);
        }
        if (options.moduleTypes) {
          optionBasePaths.moduleTypes = basePath2;
        }
        if (options.transpiler != null) {
          optionBasePaths.transpiler = basePath2;
        }
        if (options.compiler != null) {
          optionBasePaths.compiler = basePath2;
        }
        if (options.swc != null) {
          optionBasePaths.swc = basePath2;
        }
        (0, util_1.assign)(tsNodeOptionsFromTsconfig, options);
      }
      const files = (_c = (_b = rawApiOptions.files) !== null && _b !== void 0 ? _b : tsNodeOptionsFromTsconfig.files) !== null && _c !== void 0 ? _c : index_1.DEFAULTS.files;
      const skipDefaultCompilerOptions = configFilePath != null;
      const defaultCompilerOptionsForNodeVersion = skipDefaultCompilerOptions ? void 0 : {
        ...(0, tsconfigs_1.getDefaultTsconfigJsonForNodeVersion)(ts).compilerOptions,
        types: ["node"]
      };
      config.compilerOptions = Object.assign(
        {},
        // automatically-applied options from @tsconfig/bases
        defaultCompilerOptionsForNodeVersion,
        // tsconfig.json "compilerOptions"
        config.compilerOptions,
        // from env var
        index_1.DEFAULTS.compilerOptions,
        // tsconfig.json "ts-node": "compilerOptions"
        tsNodeOptionsFromTsconfig.compilerOptions,
        // passed programmatically
        rawApiOptions.compilerOptions,
        // overrides required by ts-node, cannot be changed
        TS_NODE_COMPILER_OPTIONS
      );
      const fixedConfig = fixConfig(ts, ts.parseJsonConfigFileContent(config, {
        fileExists,
        readFile,
        // Only used for globbing "files", "include", "exclude"
        // When `files` option disabled, we want to avoid the fs calls
        readDirectory: files ? ts.sys.readDirectory : () => [],
        useCaseSensitiveFileNames: ts.sys.useCaseSensitiveFileNames
      }, basePath, void 0, configFilePath));
      return {
        configFilePath,
        config: fixedConfig,
        tsNodeOptionsFromTsconfig,
        optionBasePaths
      };
    }
    exports2.readConfig = readConfig;
    function resolveAndLoadCompiler(name, relativeToPath) {
      const { compiler } = resolveCompiler(name, relativeToPath);
      const ts = loadCompiler(compiler);
      return { compiler, ts };
    }
    exports2.resolveAndLoadCompiler = resolveAndLoadCompiler;
    function resolveCompiler(name, relativeToPath) {
      const projectLocalResolveHelper = (0, util_1.createProjectLocalResolveHelper)(relativeToPath);
      const compiler = projectLocalResolveHelper(name || "typescript", true);
      return { compiler };
    }
    function loadCompiler(compiler) {
      return (0, util_1.attemptRequireWithV8CompileCache)(require, compiler);
    }
    exports2.loadCompiler = loadCompiler;
    function filterRecognizedTsConfigTsNodeOptions(jsonObject) {
      if (jsonObject == null)
        return { recognized: {}, unrecognized: {} };
      const { compiler, compilerHost, compilerOptions, emit, files, ignore, ignoreDiagnostics, logError, preferTsExts, pretty, require: require2, skipIgnore, transpileOnly, typeCheck, transpiler, scope, scopeDir, moduleTypes, experimentalReplAwait, swc, experimentalResolver, esm, experimentalSpecifierResolution, experimentalTsImportSpecifiers, ...unrecognized } = jsonObject;
      const filteredTsConfigOptions = {
        compiler,
        compilerHost,
        compilerOptions,
        emit,
        experimentalReplAwait,
        files,
        ignore,
        ignoreDiagnostics,
        logError,
        preferTsExts,
        pretty,
        require: require2,
        skipIgnore,
        transpileOnly,
        typeCheck,
        transpiler,
        scope,
        scopeDir,
        moduleTypes,
        swc,
        experimentalResolver,
        esm,
        experimentalSpecifierResolution,
        experimentalTsImportSpecifiers
      };
      const catchExtraneousProps = null;
      const catchMissingProps = null;
      return { recognized: filteredTsConfigOptions, unrecognized };
    }
    exports2.ComputeAsCommonRootOfFiles = Symbol();
    function getTsConfigDefaults(config, basePath, _files, _include, _exclude) {
      const { composite = false } = config.options;
      let rootDir = config.options.rootDir;
      if (rootDir == null) {
        if (composite)
          rootDir = basePath;
        else
          rootDir = exports2.ComputeAsCommonRootOfFiles;
      }
      const { outDir = rootDir } = config.options;
      const include = _files ? [] : ["**/*"];
      const files = _files !== null && _files !== void 0 ? _files : [];
      const exclude = _exclude !== null && _exclude !== void 0 ? _exclude : [outDir];
      return { rootDir, outDir, include, files, exclude, composite };
    }
    exports2.getTsConfigDefaults = getTsConfigDefaults;
  }
});

// node_modules/ts-node/dist/module-type-classifier.js
var require_module_type_classifier = __commonJS({
  "node_modules/ts-node/dist/module-type-classifier.js"(exports2) {
    "use strict";
    init_cjs_shims();
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.createModuleTypeClassifier = void 0;
    var ts_internals_1 = require_ts_internals();
    var util_1 = require_util();
    function createModuleTypeClassifier(options) {
      const { patterns, basePath: _basePath } = options;
      const basePath = _basePath !== void 0 ? (0, util_1.normalizeSlashes)(_basePath).replace(/\/$/, "") : void 0;
      const patternTypePairs = Object.entries(patterns !== null && patterns !== void 0 ? patterns : []).map(([_pattern, type]) => {
        const pattern = (0, util_1.normalizeSlashes)(_pattern);
        return { pattern: parsePattern(basePath, pattern), type };
      });
      const classifications = {
        package: {
          moduleType: "auto"
        },
        cjs: {
          moduleType: "cjs"
        },
        esm: {
          moduleType: "esm"
        }
      };
      const auto = classifications.package;
      function classifyModuleNonCached(path3) {
        const matched = matchPatterns(patternTypePairs, (_) => _.pattern, path3);
        if (matched)
          return classifications[matched.type];
        return auto;
      }
      const classifyModule = (0, util_1.cachedLookup)(classifyModuleNonCached);
      function classifyModuleAuto(path3) {
        return auto;
      }
      return {
        classifyModuleByModuleTypeOverrides: patternTypePairs.length ? classifyModule : classifyModuleAuto
      };
    }
    exports2.createModuleTypeClassifier = createModuleTypeClassifier;
    function parsePattern(basePath, patternString) {
      const pattern = (0, ts_internals_1.getPatternFromSpec)(patternString, basePath);
      return pattern !== void 0 ? new RegExp(pattern) : /(?:)/;
    }
    function matchPatterns(objects, getPattern, candidate) {
      for (let i = objects.length - 1; i >= 0; i--) {
        const object = objects[i];
        const pattern = getPattern(object);
        if (pattern === null || pattern === void 0 ? void 0 : pattern.test(candidate)) {
          return object;
        }
      }
    }
  }
});

// node_modules/ts-node/dist/resolver-functions.js
var require_resolver_functions = __commonJS({
  "node_modules/ts-node/dist/resolver-functions.js"(exports2) {
    "use strict";
    init_cjs_shims();
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.createResolverFunctions = void 0;
    var path_1 = require("path");
    function createResolverFunctions(kwargs) {
      const { host, ts, config, cwd, getCanonicalFileName, projectLocalResolveHelper, options, extensions } = kwargs;
      const moduleResolutionCache = ts.createModuleResolutionCache(cwd, getCanonicalFileName, config.options);
      const knownInternalFilenames = /* @__PURE__ */ new Set();
      const internalBuckets = /* @__PURE__ */ new Set();
      const moduleBucketRe = /.*\/node_modules\/(?:@[^\/]+\/)?[^\/]+\//;
      function getModuleBucket(filename) {
        const find = moduleBucketRe.exec(filename);
        if (find)
          return find[0];
        return "";
      }
      function markBucketOfFilenameInternal(filename) {
        internalBuckets.add(getModuleBucket(filename));
      }
      function isFileInInternalBucket(filename) {
        return internalBuckets.has(getModuleBucket(filename));
      }
      function isFileKnownToBeInternal(filename) {
        return knownInternalFilenames.has(filename);
      }
      const fixupResolvedModule = (resolvedModule) => {
        const { resolvedFileName } = resolvedModule;
        if (resolvedFileName === void 0)
          return;
        if (resolvedModule.isExternalLibraryImport && (resolvedFileName.endsWith(".ts") && !resolvedFileName.endsWith(".d.ts") || resolvedFileName.endsWith(".cts") && !resolvedFileName.endsWith(".d.cts") || resolvedFileName.endsWith(".mts") && !resolvedFileName.endsWith(".d.mts") || isFileKnownToBeInternal(resolvedFileName) || isFileInInternalBucket(resolvedFileName))) {
          resolvedModule.isExternalLibraryImport = false;
        }
        if (!resolvedModule.isExternalLibraryImport) {
          knownInternalFilenames.add(resolvedFileName);
        }
      };
      const resolveModuleNames = (moduleNames, containingFile, reusedNames, redirectedReference, optionsOnlyWithNewerTsVersions, containingSourceFile) => {
        return moduleNames.map((moduleName, i) => {
          var _a, _b;
          const mode = containingSourceFile ? (_b = (_a = ts).getModeForResolutionAtIndex) === null || _b === void 0 ? void 0 : _b.call(_a, containingSourceFile, i) : void 0;
          let { resolvedModule } = ts.resolveModuleName(moduleName, containingFile, config.options, host, moduleResolutionCache, redirectedReference, mode);
          if (!resolvedModule && options.experimentalTsImportSpecifiers) {
            const lastDotIndex = moduleName.lastIndexOf(".");
            const ext = lastDotIndex >= 0 ? moduleName.slice(lastDotIndex) : "";
            if (ext) {
              const replacements = extensions.tsResolverEquivalents.get(ext);
              for (const replacementExt of replacements !== null && replacements !== void 0 ? replacements : []) {
                ({ resolvedModule } = ts.resolveModuleName(moduleName.slice(0, -ext.length) + replacementExt, containingFile, config.options, host, moduleResolutionCache, redirectedReference, mode));
                if (resolvedModule)
                  break;
              }
            }
          }
          if (resolvedModule) {
            fixupResolvedModule(resolvedModule);
          }
          return resolvedModule;
        });
      };
      const getResolvedModuleWithFailedLookupLocationsFromCache = (moduleName, containingFile, resolutionMode) => {
        const ret = ts.resolveModuleNameFromCache(moduleName, containingFile, moduleResolutionCache, resolutionMode);
        if (ret && ret.resolvedModule) {
          fixupResolvedModule(ret.resolvedModule);
        }
        return ret;
      };
      const resolveTypeReferenceDirectives = (typeDirectiveNames, containingFile, redirectedReference, options2, containingFileMode) => {
        return typeDirectiveNames.map((typeDirectiveName) => {
          const nameIsString = typeof typeDirectiveName === "string";
          const mode = nameIsString ? void 0 : ts.getModeForFileReference(typeDirectiveName, containingFileMode);
          const strName = nameIsString ? typeDirectiveName : typeDirectiveName.fileName.toLowerCase();
          let { resolvedTypeReferenceDirective } = ts.resolveTypeReferenceDirective(strName, containingFile, config.options, host, redirectedReference, void 0, mode);
          if (typeDirectiveName === "node" && !resolvedTypeReferenceDirective) {
            let typesNodePackageJsonPath;
            try {
              typesNodePackageJsonPath = projectLocalResolveHelper("@types/node/package.json", true);
            } catch {
            }
            if (typesNodePackageJsonPath) {
              const typeRoots = [(0, path_1.resolve)(typesNodePackageJsonPath, "../..")];
              ({ resolvedTypeReferenceDirective } = ts.resolveTypeReferenceDirective(typeDirectiveName, containingFile, {
                ...config.options,
                typeRoots
              }, host, redirectedReference));
            }
          }
          if (resolvedTypeReferenceDirective) {
            fixupResolvedModule(resolvedTypeReferenceDirective);
          }
          return resolvedTypeReferenceDirective;
        });
      };
      return {
        resolveModuleNames,
        getResolvedModuleWithFailedLookupLocationsFromCache,
        resolveTypeReferenceDirectives,
        isFileKnownToBeInternal,
        markBucketOfFilenameInternal
      };
    }
    exports2.createResolverFunctions = createResolverFunctions;
  }
});

// node_modules/ts-node/dist/cjs-resolve-hooks.js
var require_cjs_resolve_hooks = __commonJS({
  "node_modules/ts-node/dist/cjs-resolve-hooks.js"(exports2) {
    "use strict";
    init_cjs_shims();
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.installCommonjsResolveHooksIfNecessary = void 0;
    function installCommonjsResolveHooksIfNecessary(tsNodeService) {
      const Module = require("module");
      const originalResolveFilename = Module._resolveFilename;
      const originalFindPath = Module._findPath;
      const shouldInstallHook = tsNodeService.options.experimentalResolver;
      if (shouldInstallHook) {
        let _resolveFilename = function(request, parent, isMain, options, ...rest) {
          if (!tsNodeService.enabled())
            return originalResolveFilename.call(this, request, parent, isMain, options, ...rest);
          return Module_resolveFilename.call(this, request, parent, isMain, options, ...rest);
        }, _findPath = function() {
          if (!tsNodeService.enabled())
            return originalFindPath.apply(this, arguments);
          return Module_findPath.apply(this, arguments);
        };
        const { Module_findPath, Module_resolveFilename } = tsNodeService.getNodeCjsLoader();
        Module._resolveFilename = _resolveFilename;
        Module._findPath = _findPath;
      }
    }
    exports2.installCommonjsResolveHooksIfNecessary = installCommonjsResolveHooksIfNecessary;
  }
});

// node_modules/ts-node/dist-raw/node-primordials.js
var require_node_primordials = __commonJS({
  "node_modules/ts-node/dist-raw/node-primordials.js"(exports2, module2) {
    "use strict";
    init_cjs_shims();
    module2.exports = {
      ArrayFrom: Array.from,
      ArrayIsArray: Array.isArray,
      ArrayPrototypeShift: (obj) => Array.prototype.shift.call(obj),
      ArrayPrototypeForEach: (arr, ...rest) => Array.prototype.forEach.apply(arr, rest),
      ArrayPrototypeIncludes: (arr, ...rest) => Array.prototype.includes.apply(arr, rest),
      ArrayPrototypeJoin: (arr, ...rest) => Array.prototype.join.apply(arr, rest),
      ArrayPrototypePop: (arr, ...rest) => Array.prototype.pop.apply(arr, rest),
      ArrayPrototypePush: (arr, ...rest) => Array.prototype.push.apply(arr, rest),
      FunctionPrototype: Function.prototype,
      JSONParse: JSON.parse,
      JSONStringify: JSON.stringify,
      ObjectFreeze: Object.freeze,
      ObjectKeys: Object.keys,
      ObjectGetOwnPropertyNames: Object.getOwnPropertyNames,
      ObjectDefineProperty: Object.defineProperty,
      ObjectPrototypeHasOwnProperty: (obj, prop) => Object.prototype.hasOwnProperty.call(obj, prop),
      RegExpPrototypeExec: (obj, string) => RegExp.prototype.exec.call(obj, string),
      RegExpPrototypeTest: (obj, string) => RegExp.prototype.test.call(obj, string),
      RegExpPrototypeSymbolReplace: (obj, ...rest) => RegExp.prototype[Symbol.replace].apply(obj, rest),
      SafeMap: Map,
      SafeSet: Set,
      SafeWeakMap: WeakMap,
      StringPrototypeEndsWith: (str, ...rest) => String.prototype.endsWith.apply(str, rest),
      StringPrototypeIncludes: (str, ...rest) => String.prototype.includes.apply(str, rest),
      StringPrototypeLastIndexOf: (str, ...rest) => String.prototype.lastIndexOf.apply(str, rest),
      StringPrototypeIndexOf: (str, ...rest) => String.prototype.indexOf.apply(str, rest),
      StringPrototypeRepeat: (str, ...rest) => String.prototype.repeat.apply(str, rest),
      StringPrototypeReplace: (str, ...rest) => String.prototype.replace.apply(str, rest),
      StringPrototypeSlice: (str, ...rest) => String.prototype.slice.apply(str, rest),
      StringPrototypeSplit: (str, ...rest) => String.prototype.split.apply(str, rest),
      StringPrototypeStartsWith: (str, ...rest) => String.prototype.startsWith.apply(str, rest),
      StringPrototypeSubstr: (str, ...rest) => String.prototype.substr.apply(str, rest),
      StringPrototypeCharCodeAt: (str, ...rest) => String.prototype.charCodeAt.apply(str, rest),
      StringPrototypeMatch: (str, ...rest) => String.prototype.match.apply(str, rest),
      SyntaxError
    };
  }
});

// node_modules/ts-node/dist-raw/node-nativemodule.js
var require_node_nativemodule = __commonJS({
  "node_modules/ts-node/dist-raw/node-nativemodule.js"(exports2) {
    "use strict";
    init_cjs_shims();
    var Module = require("module");
    var NativeModule = {
      canBeRequiredByUsers(specifier) {
        return Module.builtinModules.includes(specifier);
      }
    };
    exports2.NativeModule = NativeModule;
  }
});

// node_modules/ts-node/dist-raw/node-internalBinding-fs.js
var require_node_internalBinding_fs = __commonJS({
  "node_modules/ts-node/dist-raw/node-internalBinding-fs.js"(exports2, module2) {
    "use strict";
    init_cjs_shims();
    var fs3 = require("fs");
    var { versionGteLt } = require_util();
    function internalModuleReadJSON(path3) {
      let string;
      try {
        string = fs3.readFileSync(path3, "utf8");
      } catch (e) {
        if (e.code === "ENOENT") return [];
        throw e;
      }
      const containsKeys = true;
      return [string, containsKeys];
    }
    function internalModuleStat(path3) {
      const stat = fs3.statSync(path3, { throwIfNoEntry: false });
      if (!stat) return -1;
      if (stat.isFile()) return 0;
      if (stat.isDirectory()) return 1;
    }
    function internalModuleStatInefficient(path3) {
      try {
        const stat = fs3.statSync(path3);
        if (stat.isFile()) return 0;
        if (stat.isDirectory()) return 1;
      } catch (e) {
        return -e.errno || -1;
      }
    }
    var statSupportsThrowIfNoEntry = versionGteLt(process.versions.node, "15.3.0") || versionGteLt(process.versions.node, "14.17.0", "15.0.0");
    module2.exports = {
      internalModuleReadJSON,
      internalModuleStat: statSupportsThrowIfNoEntry ? internalModuleStat : internalModuleStatInefficient
    };
  }
});

// node_modules/ts-node/dist-raw/node-internal-modules-package_json_reader.js
var require_node_internal_modules_package_json_reader = __commonJS({
  "node_modules/ts-node/dist-raw/node-internal-modules-package_json_reader.js"(exports2, module2) {
    "use strict";
    init_cjs_shims();
    var { SafeMap } = require_node_primordials();
    var { internalModuleReadJSON } = require_node_internalBinding_fs();
    var { pathToFileURL } = require("url");
    var { toNamespacedPath } = require("path");
    var cache = new SafeMap();
    var manifest;
    function read(jsonPath) {
      if (cache.has(jsonPath)) {
        return cache.get(jsonPath);
      }
      const [string, containsKeys] = internalModuleReadJSON(
        toNamespacedPath(jsonPath)
      );
      const result = { string, containsKeys };
      if (string !== void 0) {
        if (manifest === void 0) {
          manifest = null;
        }
        if (manifest !== null) {
          const jsonURL = pathToFileURL(jsonPath);
          manifest.assertIntegrity(jsonURL, string);
        }
      }
      cache.set(jsonPath, result);
      return result;
    }
    module2.exports = { read };
  }
});

// node_modules/arg/index.js
var require_arg = __commonJS({
  "node_modules/arg/index.js"(exports2, module2) {
    "use strict";
    init_cjs_shims();
    var flagSymbol = Symbol("arg flag");
    function arg(opts, { argv = process.argv.slice(2), permissive = false, stopAtPositional = false } = {}) {
      if (!opts) {
        throw new Error("Argument specification object is required");
      }
      const result = { _: [] };
      const aliases = {};
      const handlers = {};
      for (const key of Object.keys(opts)) {
        if (!key) {
          throw new TypeError("Argument key cannot be an empty string");
        }
        if (key[0] !== "-") {
          throw new TypeError(`Argument key must start with '-' but found: '${key}'`);
        }
        if (key.length === 1) {
          throw new TypeError(`Argument key must have a name; singular '-' keys are not allowed: ${key}`);
        }
        if (typeof opts[key] === "string") {
          aliases[key] = opts[key];
          continue;
        }
        let type = opts[key];
        let isFlag = false;
        if (Array.isArray(type) && type.length === 1 && typeof type[0] === "function") {
          const [fn] = type;
          type = (value2, name, prev = []) => {
            prev.push(fn(value2, name, prev[prev.length - 1]));
            return prev;
          };
          isFlag = fn === Boolean || fn[flagSymbol] === true;
        } else if (typeof type === "function") {
          isFlag = type === Boolean || type[flagSymbol] === true;
        } else {
          throw new TypeError(`Type missing or not a function or valid array type: ${key}`);
        }
        if (key[1] !== "-" && key.length > 2) {
          throw new TypeError(`Short argument keys (with a single hyphen) must have only one character: ${key}`);
        }
        handlers[key] = [type, isFlag];
      }
      for (let i = 0, len = argv.length; i < len; i++) {
        const wholeArg = argv[i];
        if (stopAtPositional && result._.length > 0) {
          result._ = result._.concat(argv.slice(i));
          break;
        }
        if (wholeArg === "--") {
          result._ = result._.concat(argv.slice(i + 1));
          break;
        }
        if (wholeArg.length > 1 && wholeArg[0] === "-") {
          const separatedArguments = wholeArg[1] === "-" || wholeArg.length === 2 ? [wholeArg] : wholeArg.slice(1).split("").map((a) => `-${a}`);
          for (let j = 0; j < separatedArguments.length; j++) {
            const arg2 = separatedArguments[j];
            const [originalArgName, argStr] = arg2[1] === "-" ? arg2.split(/=(.*)/, 2) : [arg2, void 0];
            let argName = originalArgName;
            while (argName in aliases) {
              argName = aliases[argName];
            }
            if (!(argName in handlers)) {
              if (permissive) {
                result._.push(arg2);
                continue;
              } else {
                const err = new Error(`Unknown or unexpected option: ${originalArgName}`);
                err.code = "ARG_UNKNOWN_OPTION";
                throw err;
              }
            }
            const [type, isFlag] = handlers[argName];
            if (!isFlag && j + 1 < separatedArguments.length) {
              throw new TypeError(`Option requires argument (but was followed by another short argument): ${originalArgName}`);
            }
            if (isFlag) {
              result[argName] = type(true, argName, result[argName]);
            } else if (argStr === void 0) {
              if (argv.length < i + 2 || argv[i + 1].length > 1 && argv[i + 1][0] === "-" && !(argv[i + 1].match(/^-?\d*(\.(?=\d))?\d*$/) && (type === Number || // eslint-disable-next-line no-undef
              typeof BigInt !== "undefined" && type === BigInt))) {
                const extended = originalArgName === argName ? "" : ` (alias for ${argName})`;
                throw new Error(`Option requires argument: ${originalArgName}${extended}`);
              }
              result[argName] = type(argv[i + 1], argName, result[argName]);
              ++i;
            } else {
              result[argName] = type(argStr, argName, result[argName]);
            }
          }
        } else {
          result._.push(wholeArg);
        }
      }
      return result;
    }
    arg.flag = (fn) => {
      fn[flagSymbol] = true;
      return fn;
    };
    arg.COUNT = arg.flag((v, name, existingCount) => (existingCount || 0) + 1);
    module2.exports = arg;
  }
});

// node_modules/ts-node/dist-raw/node-options.js
var require_node_options = __commonJS({
  "node_modules/ts-node/dist-raw/node-options.js"(exports2) {
    "use strict";
    init_cjs_shims();
    exports2.getOptionValue = getOptionValue;
    function getOptionValue(opt) {
      parseOptions();
      return options[opt];
    }
    var options;
    function parseOptions() {
      if (!options) {
        options = {
          "--preserve-symlinks": false,
          "--preserve-symlinks-main": false,
          "--input-type": void 0,
          "--experimental-specifier-resolution": "explicit",
          "--experimental-policy": void 0,
          "--conditions": [],
          "--pending-deprecation": false,
          ...parseArgv(getNodeOptionsEnvArgv()),
          ...parseArgv(process.execArgv),
          ...getOptionValuesFromOtherEnvVars()
        };
      }
    }
    function parseArgv(argv) {
      return require_arg()({
        "--preserve-symlinks": Boolean,
        "--preserve-symlinks-main": Boolean,
        "--input-type": String,
        "--experimental-specifier-resolution": String,
        // Legacy alias for node versions prior to 12.16
        "--es-module-specifier-resolution": "--experimental-specifier-resolution",
        "--experimental-policy": String,
        "--conditions": [String],
        "--pending-deprecation": Boolean,
        "--experimental-json-modules": Boolean,
        "--experimental-wasm-modules": Boolean
      }, {
        argv,
        permissive: true
      });
    }
    function getNodeOptionsEnvArgv() {
      const errors = [];
      const envArgv = ParseNodeOptionsEnvVar(process.env.NODE_OPTIONS || "", errors);
      if (errors.length !== 0) {
      }
      return envArgv;
    }
    function ParseNodeOptionsEnvVar(node_options, errors) {
      const env_argv = [];
      let is_in_string = false;
      let will_start_new_arg = true;
      for (let index = 0; index < node_options.length; ++index) {
        let c = node_options[index];
        if (c === "\\" && is_in_string) {
          if (index + 1 === node_options.length) {
            errors.push("invalid value for NODE_OPTIONS (invalid escape)\n");
            return env_argv;
          } else {
            c = node_options[++index];
          }
        } else if (c === " " && !is_in_string) {
          will_start_new_arg = true;
          continue;
        } else if (c === '"') {
          is_in_string = !is_in_string;
          continue;
        }
        if (will_start_new_arg) {
          env_argv.push(c);
          will_start_new_arg = false;
        } else {
          env_argv[env_argv.length - 1] += c;
        }
      }
      if (is_in_string) {
        errors.push("invalid value for NODE_OPTIONS (unterminated string)\n");
      }
      return env_argv;
    }
    function getOptionValuesFromOtherEnvVars() {
      const options2 = {};
      if (process.env.NODE_PENDING_DEPRECATION === "1") {
        options2["--pending-deprecation"] = true;
      }
      return options2;
    }
  }
});

// node_modules/ts-node/dist-raw/node-internal-modules-cjs-helpers.js
var require_node_internal_modules_cjs_helpers = __commonJS({
  "node_modules/ts-node/dist-raw/node-internal-modules-cjs-helpers.js"(exports2) {
    "use strict";
    init_cjs_shims();
    var {
      ArrayPrototypeForEach,
      ObjectDefineProperty,
      ObjectPrototypeHasOwnProperty,
      SafeSet,
      StringPrototypeIncludes,
      StringPrototypeStartsWith
    } = require_node_primordials();
    var { getOptionValue } = require_node_options();
    var userConditions = getOptionValue("--conditions");
    var noAddons = getOptionValue("--no-addons");
    var addonConditions = noAddons ? [] : ["node-addons"];
    var cjsConditions = new SafeSet([
      "require",
      "node",
      ...addonConditions,
      ...userConditions
    ]);
    function addBuiltinLibsToObject(object, dummyModuleName) {
      const Module = require("module").Module;
      const { builtinModules } = Module;
      const dummyModule = new Module(dummyModuleName);
      ArrayPrototypeForEach(builtinModules, (name) => {
        if (StringPrototypeStartsWith(name, "_") || StringPrototypeIncludes(name, "/") || ObjectPrototypeHasOwnProperty(object, name)) {
          return;
        }
        const setReal = (val) => {
          delete object[name];
          object[name] = val;
        };
        ObjectDefineProperty(object, name, {
          get: () => {
            const lib = (dummyModule.require || require)(name);
            delete object[name];
            ObjectDefineProperty(object, name, {
              get: () => lib,
              set: setReal,
              configurable: true,
              enumerable: false
            });
            return lib;
          },
          set: setReal,
          configurable: true,
          enumerable: false
        });
      });
    }
    exports2.addBuiltinLibsToObject = addBuiltinLibsToObject;
    exports2.cjsConditions = cjsConditions;
  }
});

// node_modules/ts-node/dist-raw/node-internal-errors.js
var require_node_internal_errors = __commonJS({
  "node_modules/ts-node/dist-raw/node-internal-errors.js"(exports2) {
    "use strict";
    init_cjs_shims();
    var path3 = require("path");
    exports2.codes = {
      ERR_INPUT_TYPE_NOT_ALLOWED: createErrorCtor(joinArgs("ERR_INPUT_TYPE_NOT_ALLOWED")),
      ERR_INVALID_ARG_VALUE: createErrorCtor(joinArgs("ERR_INVALID_ARG_VALUE")),
      ERR_INVALID_MODULE_SPECIFIER: createErrorCtor(joinArgs("ERR_INVALID_MODULE_SPECIFIER")),
      ERR_INVALID_PACKAGE_CONFIG: createErrorCtor(joinArgs("ERR_INVALID_PACKAGE_CONFIG")),
      ERR_INVALID_PACKAGE_TARGET: createErrorCtor(joinArgs("ERR_INVALID_PACKAGE_TARGET")),
      ERR_MANIFEST_DEPENDENCY_MISSING: createErrorCtor(joinArgs("ERR_MANIFEST_DEPENDENCY_MISSING")),
      ERR_MODULE_NOT_FOUND: createErrorCtor((path4, base, type = "package") => {
        return `Cannot find ${type} '${path4}' imported from ${base}`;
      }),
      ERR_PACKAGE_IMPORT_NOT_DEFINED: createErrorCtor(joinArgs("ERR_PACKAGE_IMPORT_NOT_DEFINED")),
      ERR_PACKAGE_PATH_NOT_EXPORTED: createErrorCtor(joinArgs("ERR_PACKAGE_PATH_NOT_EXPORTED")),
      ERR_UNSUPPORTED_DIR_IMPORT: createErrorCtor(joinArgs("ERR_UNSUPPORTED_DIR_IMPORT")),
      ERR_UNSUPPORTED_ESM_URL_SCHEME: createErrorCtor(joinArgs("ERR_UNSUPPORTED_ESM_URL_SCHEME")),
      ERR_UNKNOWN_FILE_EXTENSION: createErrorCtor(joinArgs("ERR_UNKNOWN_FILE_EXTENSION"))
    };
    function joinArgs(name) {
      return (...args) => {
        return [name, ...args].join(" ");
      };
    }
    function createErrorCtor(errorMessageCreator) {
      return class CustomError extends Error {
        constructor(...args) {
          super(errorMessageCreator(...args));
        }
      };
    }
    exports2.createErrRequireEsm = createErrRequireEsm;
    function createErrRequireEsm(filename, parentPath, packageJsonPath) {
      const code = "ERR_REQUIRE_ESM";
      const err = new Error(getErrRequireEsmMessage(filename, parentPath, packageJsonPath));
      err.name = `Error [${code}]`;
      err.stack;
      Object.defineProperty(err, "name", {
        value: "Error",
        enumerable: false,
        writable: true,
        configurable: true
      });
      err.code = code;
      return err;
    }
    function getErrRequireEsmMessage(filename, parentPath = null, packageJsonPath = null) {
      const ext = path3.extname(filename);
      let msg = `Must use import to load ES Module: ${filename}`;
      if (parentPath && packageJsonPath) {
        const path4 = require("path");
        const basename = path4.basename(filename) === path4.basename(parentPath) ? filename : path4.basename(filename);
        msg += `
require() of ES modules is not supported.
require() of ${filename} ${parentPath ? `from ${parentPath} ` : ""}is an ES module file as it is a ${ext} file whose nearest parent package.json contains "type": "module" which defines all ${ext} files in that package scope as ES modules.
Instead change the requiring code to use import(), or remove "type": "module" from ${packageJsonPath}.
`;
        return msg;
      }
      return msg;
    }
  }
});

// node_modules/ts-node/dist-raw/node-internal-constants.js
var require_node_internal_constants = __commonJS({
  "node_modules/ts-node/dist-raw/node-internal-constants.js"(exports2, module2) {
    "use strict";
    init_cjs_shims();
    module2.exports = {
      CHAR_FORWARD_SLASH: 47
      /* / */
    };
  }
});

// node_modules/ts-node/dist-raw/node-internal-modules-cjs-loader.js
var require_node_internal_modules_cjs_loader = __commonJS({
  "node_modules/ts-node/dist-raw/node-internal-modules-cjs-loader.js"(exports2, module2) {
    "use strict";
    init_cjs_shims();
    var {
      ArrayIsArray,
      ArrayPrototypeIncludes,
      ArrayPrototypeJoin,
      ArrayPrototypePush,
      JSONParse,
      ObjectKeys,
      RegExpPrototypeTest,
      SafeMap,
      SafeWeakMap,
      StringPrototypeCharCodeAt,
      StringPrototypeEndsWith,
      StringPrototypeLastIndexOf,
      StringPrototypeIndexOf,
      StringPrototypeMatch,
      StringPrototypeSlice,
      StringPrototypeStartsWith
    } = require_node_primordials();
    var { NativeModule } = require_node_nativemodule();
    var { pathToFileURL, fileURLToPath } = require("url");
    var fs3 = require("fs");
    var path3 = require("path");
    var { sep } = path3;
    var { internalModuleStat } = require_node_internalBinding_fs();
    var packageJsonReader = require_node_internal_modules_package_json_reader();
    var {
      cjsConditions
    } = require_node_internal_modules_cjs_helpers();
    var { getOptionValue } = require_node_options();
    var preserveSymlinks = getOptionValue("--preserve-symlinks");
    var preserveSymlinksMain = getOptionValue("--preserve-symlinks-main");
    var { normalizeSlashes } = require_util();
    var { createErrRequireEsm } = require_node_internal_errors();
    var {
      codes: {
        ERR_INVALID_MODULE_SPECIFIER
      }
    } = require_node_internal_errors();
    var {
      CHAR_FORWARD_SLASH
    } = require_node_internal_constants();
    var Module = require("module");
    var isWindows = process.platform === "win32";
    var statCache = null;
    function stat(filename) {
      filename = path3.toNamespacedPath(filename);
      if (statCache !== null) {
        const result2 = statCache.get(filename);
        if (result2 !== void 0) return result2;
      }
      const result = internalModuleStat(filename);
      if (statCache !== null && result >= 0) {
        statCache.set(filename, result);
      }
      return result;
    }
    var moduleParentCache = new SafeWeakMap();
    var packageJsonCache = new SafeMap();
    function readPackage(requestPath) {
      const jsonPath = path3.resolve(requestPath, "package.json");
      const existing = packageJsonCache.get(jsonPath);
      if (existing !== void 0) return existing;
      const result = packageJsonReader.read(jsonPath);
      const json = result.containsKeys === false ? "{}" : result.string;
      if (json === void 0) {
        packageJsonCache.set(jsonPath, false);
        return false;
      }
      try {
        const parsed = JSONParse(json);
        const filtered = {
          name: parsed.name,
          main: parsed.main,
          exports: parsed.exports,
          imports: parsed.imports,
          type: parsed.type
        };
        packageJsonCache.set(jsonPath, filtered);
        return filtered;
      } catch (e) {
        e.path = jsonPath;
        e.message = "Error parsing " + jsonPath + ": " + e.message;
        throw e;
      }
    }
    function readPackageScope(checkPath) {
      const rootSeparatorIndex = StringPrototypeIndexOf(checkPath, sep);
      let separatorIndex;
      do {
        separatorIndex = StringPrototypeLastIndexOf(checkPath, sep);
        checkPath = StringPrototypeSlice(checkPath, 0, separatorIndex);
        if (StringPrototypeEndsWith(checkPath, sep + "node_modules"))
          return false;
        const pjson = readPackage(checkPath + sep);
        if (pjson) return {
          data: pjson,
          path: checkPath
        };
      } while (separatorIndex > rootSeparatorIndex);
      return false;
    }
    function createCjsLoader(opts) {
      const { nodeEsmResolver, preferTsExts } = opts;
      const { replacementsForCjs, replacementsForJs, replacementsForMjs, replacementsForJsx } = opts.extensions;
      const {
        encodedSepRegEx,
        packageExportsResolve,
        packageImportsResolve
      } = nodeEsmResolver;
      function tryPackage(requestPath, exts, isMain, originalPath) {
        const tmp = readPackage(requestPath);
        const pkg = tmp != null ? tmp.main : void 0;
        if (!pkg) {
          return tryExtensions(path3.resolve(requestPath, "index"), exts, isMain);
        }
        const filename = path3.resolve(requestPath, pkg);
        let actual = tryReplacementExtensions(filename, isMain) || tryFile(filename, isMain) || tryExtensions(filename, exts, isMain) || tryExtensions(path3.resolve(filename, "index"), exts, isMain);
        if (actual === false) {
          actual = tryExtensions(path3.resolve(requestPath, "index"), exts, isMain);
          if (!actual) {
            const err = new Error(
              `Cannot find module '${filename}'. Please verify that the package.json has a valid "main" entry`
            );
            err.code = "MODULE_NOT_FOUND";
            err.path = path3.resolve(requestPath, "package.json");
            err.requestPath = originalPath;
            throw err;
          } else {
            const jsonPath = path3.resolve(requestPath, "package.json");
            process.emitWarning(
              `Invalid 'main' field in '${jsonPath}' of '${pkg}'. Please either fix that or report it to the module author`,
              "DeprecationWarning",
              "DEP0128"
            );
          }
        }
        return actual;
      }
      const realpathCache = new SafeMap();
      function tryFile(requestPath, isMain) {
        const rc = stat(requestPath);
        if (rc !== 0) return;
        if (preserveSymlinks && !isMain) {
          return path3.resolve(requestPath);
        }
        return toRealPath(requestPath);
      }
      function toRealPath(requestPath) {
        return fs3.realpathSync(requestPath, {
          // [internalFS.realpathCacheKey]: realpathCache
        });
      }
      function statReplacementExtensions(p) {
        const lastDotIndex = p.lastIndexOf(".");
        if (lastDotIndex >= 0) {
          const ext = p.slice(lastDotIndex);
          if (ext === ".js" || ext === ".jsx" || ext === ".mjs" || ext === ".cjs") {
            const pathnameWithoutExtension = p.slice(0, lastDotIndex);
            const replacementExts = ext === ".js" ? replacementsForJs : ext === ".jsx" ? replacementsForJsx : ext === ".mjs" ? replacementsForMjs : replacementsForCjs;
            for (let i = 0; i < replacementExts.length; i++) {
              const filename = pathnameWithoutExtension + replacementExts[i];
              const rc = stat(filename);
              if (rc === 0) {
                return [rc, filename];
              }
            }
          }
        }
        return [stat(p), p];
      }
      function tryReplacementExtensions(p, isMain) {
        const lastDotIndex = p.lastIndexOf(".");
        if (lastDotIndex >= 0) {
          const ext = p.slice(lastDotIndex);
          if (ext === ".js" || ext === ".jsx" || ext === ".mjs" || ext === ".cjs") {
            const pathnameWithoutExtension = p.slice(0, lastDotIndex);
            const replacementExts = ext === ".js" ? replacementsForJs : ext === ".jsx" ? replacementsForJsx : ext === ".mjs" ? replacementsForMjs : replacementsForCjs;
            for (let i = 0; i < replacementExts.length; i++) {
              const filename = tryFile(pathnameWithoutExtension + replacementExts[i], isMain);
              if (filename) {
                return filename;
              }
            }
          }
        }
        return false;
      }
      function tryExtensions(p, exts, isMain) {
        for (let i = 0; i < exts.length; i++) {
          const filename = tryFile(p + exts[i], isMain);
          if (filename) {
            return filename;
          }
        }
        return false;
      }
      function trySelfParentPath(parent) {
        if (!parent) return false;
        if (parent.filename) {
          return parent.filename;
        } else if (parent.id === "<repl>" || parent.id === "internal/preload") {
          try {
            return process.cwd() + path3.sep;
          } catch {
            return false;
          }
        }
      }
      function trySelf(parentPath, request) {
        if (!parentPath) return false;
        const { data: pkg, path: pkgPath } = readPackageScope(parentPath) || {};
        if (!pkg || pkg.exports === void 0) return false;
        if (typeof pkg.name !== "string") return false;
        let expansion;
        if (request === pkg.name) {
          expansion = ".";
        } else if (StringPrototypeStartsWith(request, `${pkg.name}/`)) {
          expansion = "." + StringPrototypeSlice(request, pkg.name.length);
        } else {
          return false;
        }
        try {
          return finalizeEsmResolution(packageExportsResolve(
            pathToFileURL(pkgPath + "/package.json"),
            expansion,
            pkg,
            pathToFileURL(parentPath),
            cjsConditions
          ).resolved, parentPath, pkgPath);
        } catch (e) {
          if (e.code === "ERR_MODULE_NOT_FOUND")
            throw createEsmNotFoundErr(request, pkgPath + "/package.json");
          throw e;
        }
      }
      const EXPORTS_PATTERN = /^((?:@[^/\\%]+\/)?[^./\\%][^/\\%]*)(\/.*)?$/;
      function resolveExports(nmPath, request) {
        const { 1: name, 2: expansion = "" } = StringPrototypeMatch(request, EXPORTS_PATTERN) || [];
        if (!name)
          return;
        const pkgPath = path3.resolve(nmPath, name);
        const pkg = readPackage(pkgPath);
        if (pkg != null && pkg.exports != null) {
          try {
            return finalizeEsmResolution(packageExportsResolve(
              pathToFileURL(pkgPath + "/package.json"),
              "." + expansion,
              pkg,
              null,
              cjsConditions
            ).resolved, null, pkgPath);
          } catch (e) {
            if (e.code === "ERR_MODULE_NOT_FOUND")
              throw createEsmNotFoundErr(request, pkgPath + "/package.json");
            throw e;
          }
        }
      }
      const hasModulePathCache = !!require("module")._pathCache;
      const Module_pathCache = /* @__PURE__ */ Object.create(null);
      const Module_pathCache_get = hasModulePathCache ? (cacheKey) => Module._pathCache[cacheKey] : (cacheKey) => Module_pathCache[cacheKey];
      const Module_pathCache_set = hasModulePathCache ? (cacheKey, value2) => Module._pathCache[cacheKey] = value2 : (cacheKey) => Module_pathCache[cacheKey] = value;
      const trailingSlashRegex = /(?:^|\/)\.?\.$/;
      const Module_findPath = function _findPath(request, paths, isMain) {
        const absoluteRequest = path3.isAbsolute(request);
        if (absoluteRequest) {
          paths = [""];
        } else if (!paths || paths.length === 0) {
          return false;
        }
        const cacheKey = request + "\0" + ArrayPrototypeJoin(paths, "\0");
        const entry = Module_pathCache_get(cacheKey);
        if (entry)
          return entry;
        let exts;
        let trailingSlash = request.length > 0 && StringPrototypeCharCodeAt(request, request.length - 1) === CHAR_FORWARD_SLASH;
        if (!trailingSlash) {
          trailingSlash = RegExpPrototypeTest(trailingSlashRegex, request);
        }
        for (let i = 0; i < paths.length; i++) {
          const curPath = paths[i];
          if (curPath && stat(curPath) < 1) continue;
          if (!absoluteRequest) {
            const exportsResolved = resolveExports(curPath, request);
            if (exportsResolved)
              return exportsResolved;
          }
          const _basePath = path3.resolve(curPath, request);
          let filename;
          const [rc, basePath] = statReplacementExtensions(_basePath);
          if (!trailingSlash) {
            if (rc === 0) {
              if (!isMain) {
                if (preserveSymlinks) {
                  filename = path3.resolve(basePath);
                } else {
                  filename = toRealPath(basePath);
                }
              } else if (preserveSymlinksMain) {
                filename = path3.resolve(basePath);
              } else {
                filename = toRealPath(basePath);
              }
            }
            if (!filename) {
              if (exts === void 0)
                exts = ObjectKeys(Module._extensions);
              filename = tryExtensions(basePath, exts, isMain);
            }
          }
          if (!filename && rc === 1) {
            if (exts === void 0)
              exts = ObjectKeys(Module._extensions);
            filename = tryPackage(basePath, exts, isMain, request);
          }
          if (filename) {
            Module_pathCache_set(cacheKey, filename);
            return filename;
          }
        }
        return false;
      };
      const Module_resolveFilename = function _resolveFilename(request, parent, isMain, options) {
        if (StringPrototypeStartsWith(request, "node:") || NativeModule.canBeRequiredByUsers(request)) {
          return request;
        }
        let paths;
        if (typeof options === "object" && options !== null) {
          if (ArrayIsArray(options.paths)) {
            const isRelative = StringPrototypeStartsWith(request, "./") || StringPrototypeStartsWith(request, "../") || (isWindows && StringPrototypeStartsWith(request, ".\\") || StringPrototypeStartsWith(request, "..\\"));
            if (isRelative) {
              paths = options.paths;
            } else {
              const fakeParent = new Module("", null);
              paths = [];
              for (let i = 0; i < options.paths.length; i++) {
                const path4 = options.paths[i];
                fakeParent.paths = Module._nodeModulePaths(path4);
                const lookupPaths = Module._resolveLookupPaths(request, fakeParent);
                for (let j = 0; j < lookupPaths.length; j++) {
                  if (!ArrayPrototypeIncludes(paths, lookupPaths[j]))
                    ArrayPrototypePush(paths, lookupPaths[j]);
                }
              }
            }
          } else if (options.paths === void 0) {
            paths = Module._resolveLookupPaths(request, parent);
          } else {
            throw new ERR_INVALID_ARG_VALUE("options.paths", options.paths);
          }
        } else {
          paths = Module._resolveLookupPaths(request, parent);
        }
        if (parent != null && parent.filename) {
          if (request[0] === "#") {
            const pkg = readPackageScope(parent.filename) || {};
            if (pkg.data != null && pkg.data.imports != null) {
              try {
                return finalizeEsmResolution(
                  packageImportsResolve(
                    request,
                    pathToFileURL(parent.filename),
                    cjsConditions
                  ),
                  parent.filename,
                  pkg.path
                );
              } catch (e) {
                if (e.code === "ERR_MODULE_NOT_FOUND")
                  throw createEsmNotFoundErr(request);
                throw e;
              }
            }
          }
        }
        const parentPath = trySelfParentPath(parent);
        const selfResolved = trySelf(parentPath, request);
        if (selfResolved) {
          const cacheKey = request + "\0" + (paths.length === 1 ? paths[0] : ArrayPrototypeJoin(paths, "\0"));
          Module._pathCache[cacheKey] = selfResolved;
          return selfResolved;
        }
        const filename = Module._findPath(request, paths, isMain, false);
        if (filename) return filename;
        const requireStack = [];
        for (let cursor = parent; cursor; cursor = moduleParentCache.get(cursor)) {
          ArrayPrototypePush(requireStack, cursor.filename || cursor.id);
        }
        let message = `Cannot find module '${request}'`;
        if (requireStack.length > 0) {
          message = message + "\nRequire stack:\n- " + ArrayPrototypeJoin(requireStack, "\n- ");
        }
        const err = new Error(message);
        err.code = "MODULE_NOT_FOUND";
        err.requireStack = requireStack;
        throw err;
      };
      function finalizeEsmResolution(resolved, parentPath, pkgPath) {
        if (RegExpPrototypeTest(encodedSepRegEx, resolved))
          throw new ERR_INVALID_MODULE_SPECIFIER(
            resolved,
            'must not include encoded "/" or "\\" characters',
            parentPath
          );
        const filename = fileURLToPath(resolved);
        const actual = tryReplacementExtensions(filename) || tryFile(filename);
        if (actual)
          return actual;
        const err = createEsmNotFoundErr(
          filename,
          path3.resolve(pkgPath, "package.json")
        );
        throw err;
      }
      function createEsmNotFoundErr(request, path4) {
        const err = new Error(`Cannot find module '${request}'`);
        err.code = "MODULE_NOT_FOUND";
        if (path4)
          err.path = path4;
        return err;
      }
      return {
        Module_findPath,
        Module_resolveFilename
      };
    }
    function assertScriptCanLoadAsCJSImpl(service, module3, filename) {
      const pkg = readPackageScope(filename);
      const tsNodeClassification = service.moduleTypeClassifier.classifyModuleByModuleTypeOverrides(normalizeSlashes(filename));
      if (tsNodeClassification.moduleType === "cjs") return;
      const lastDotIndex = filename.lastIndexOf(".");
      const ext = lastDotIndex >= 0 ? filename.slice(lastDotIndex) : "";
      if ((ext === ".cts" || ext === ".cjs") && tsNodeClassification.moduleType === "auto") return;
      if (ext === ".mts" || ext === ".mjs" || tsNodeClassification.moduleType === "esm" || pkg && pkg.data && pkg.data.type === "module") {
        const parentPath = module3.parent && module3.parent.filename;
        const packageJsonPath = pkg ? path3.resolve(pkg.path, "package.json") : null;
        throw createErrRequireEsm(filename, parentPath, packageJsonPath);
      }
    }
    module2.exports = {
      createCjsLoader,
      assertScriptCanLoadAsCJSImpl,
      readPackageScope
    };
  }
});

// node_modules/ts-node/dist/node-module-type-classifier.js
var require_node_module_type_classifier = __commonJS({
  "node_modules/ts-node/dist/node-module-type-classifier.js"(exports2) {
    "use strict";
    init_cjs_shims();
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.classifyModule = void 0;
    var node_internal_modules_cjs_loader_1 = require_node_internal_modules_cjs_loader();
    function classifyModule(nativeFilename, isNodeModuleType) {
      const lastDotIndex = nativeFilename.lastIndexOf(".");
      const ext = lastDotIndex >= 0 ? nativeFilename.slice(lastDotIndex) : "";
      switch (ext) {
        case ".cjs":
        case ".cts":
          return isNodeModuleType ? "nodecjs" : "cjs";
        case ".mjs":
        case ".mts":
          return isNodeModuleType ? "nodeesm" : "esm";
      }
      if (isNodeModuleType) {
        const packageScope = (0, node_internal_modules_cjs_loader_1.readPackageScope)(nativeFilename);
        if (packageScope && packageScope.data.type === "module")
          return "nodeesm";
        return "nodecjs";
      }
      return void 0;
    }
    exports2.classifyModule = classifyModule;
  }
});

// node_modules/ts-node/dist/file-extensions.js
var require_file_extensions = __commonJS({
  "node_modules/ts-node/dist/file-extensions.js"(exports2) {
    "use strict";
    init_cjs_shims();
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getExtensions = void 0;
    var util_1 = require_util();
    var nodeEquivalents = /* @__PURE__ */ new Map([
      [".ts", ".js"],
      [".tsx", ".js"],
      [".jsx", ".js"],
      [".mts", ".mjs"],
      [".cts", ".cjs"]
    ]);
    var tsResolverEquivalents = /* @__PURE__ */ new Map([
      [".ts", [".js"]],
      [".tsx", [".js", ".jsx"]],
      [".mts", [".mjs"]],
      [".cts", [".cjs"]]
    ]);
    var vanillaNodeExtensions = [
      ".js",
      ".json",
      ".node",
      ".mjs",
      ".cjs"
    ];
    var nodeDoesNotUnderstand = [
      ".ts",
      ".tsx",
      ".jsx",
      ".cts",
      ".mts"
    ];
    function getExtensions(config, options, tsVersion) {
      const tsSupportsMtsCtsExts = (0, util_1.versionGteLt)(tsVersion, "4.5.0");
      const requiresHigherTypescriptVersion = [];
      if (!tsSupportsMtsCtsExts)
        requiresHigherTypescriptVersion.push(".cts", ".cjs", ".mts", ".mjs");
      const allPossibleExtensionsSortedByPreference = Array.from(/* @__PURE__ */ new Set([
        ...options.preferTsExts ? nodeDoesNotUnderstand : [],
        ...vanillaNodeExtensions,
        ...nodeDoesNotUnderstand
      ]));
      const compiledJsUnsorted = [".ts"];
      const compiledJsxUnsorted = [];
      if (config.options.jsx)
        compiledJsxUnsorted.push(".tsx");
      if (tsSupportsMtsCtsExts)
        compiledJsUnsorted.push(".mts", ".cts");
      if (config.options.allowJs) {
        compiledJsUnsorted.push(".js");
        if (config.options.jsx)
          compiledJsxUnsorted.push(".jsx");
        if (tsSupportsMtsCtsExts)
          compiledJsUnsorted.push(".mjs", ".cjs");
      }
      const compiledUnsorted = [...compiledJsUnsorted, ...compiledJsxUnsorted];
      const compiled = allPossibleExtensionsSortedByPreference.filter((ext) => compiledUnsorted.includes(ext));
      const compiledNodeDoesNotUnderstand = nodeDoesNotUnderstand.filter((ext) => compiled.includes(ext));
      const r = allPossibleExtensionsSortedByPreference.filter((ext) => [...compiledUnsorted, ".js", ".mjs", ".cjs", ".mts", ".cts"].includes(ext));
      const replacementsForJs = r.filter((ext) => [".js", ".jsx", ".ts", ".tsx"].includes(ext));
      const replacementsForJsx = r.filter((ext) => [".jsx", ".tsx"].includes(ext));
      const replacementsForMjs = r.filter((ext) => [".mjs", ".mts"].includes(ext));
      const replacementsForCjs = r.filter((ext) => [".cjs", ".cts"].includes(ext));
      const replacementsForJsOrMjs = r.filter((ext) => [".js", ".jsx", ".ts", ".tsx", ".mjs", ".mts"].includes(ext));
      const experimentalSpecifierResolutionAddsIfOmitted = Array.from(/* @__PURE__ */ new Set([...replacementsForJsOrMjs, ".json", ".node"]));
      const legacyMainResolveAddsIfOmitted = Array.from(/* @__PURE__ */ new Set([...replacementsForJs, ".json", ".node"]));
      return {
        /** All file extensions we transform, ordered by resolution preference according to preferTsExts */
        compiled,
        /** Resolved extensions that vanilla node will not understand; we should handle them */
        nodeDoesNotUnderstand,
        /** Like the above, but only the ones we're compiling */
        compiledNodeDoesNotUnderstand,
        /**
         * Mapping from extensions understood by tsc to the equivalent for node,
         * as far as getFormat is concerned.
         */
        nodeEquivalents,
        /**
         * Mapping from extensions rejected by TSC in import specifiers, to the
         * possible alternatives that TS's resolver will accept.
         *
         * When we allow users to opt-in to .ts extensions in import specifiers, TS's
         * resolver requires us to replace the .ts extensions with .js alternatives.
         * Otherwise, resolution fails.
         *
         * Note TS's resolver is only used by, and only required for, typechecking.
         * This is separate from node's resolver, which we hook separately and which
         * does not require this mapping.
         */
        tsResolverEquivalents,
        /**
         * Extensions that we can support if the user upgrades their typescript version.
         * Used when raising hints.
         */
        requiresHigherTypescriptVersion,
        /**
         * --experimental-specifier-resolution=node will add these extensions.
         */
        experimentalSpecifierResolutionAddsIfOmitted,
        /**
         * ESM loader will add these extensions to package.json "main" field
         */
        legacyMainResolveAddsIfOmitted,
        replacementsForMjs,
        replacementsForCjs,
        replacementsForJsx,
        replacementsForJs
      };
    }
    exports2.getExtensions = getExtensions;
  }
});

// node_modules/ts-node/dist/ts-transpile-module.js
var require_ts_transpile_module = __commonJS({
  "node_modules/ts-node/dist/ts-transpile-module.js"(exports2) {
    "use strict";
    init_cjs_shims();
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.createTsTranspileModule = void 0;
    function createTsTranspileModule(ts, transpileOptions) {
      const { createProgram, createSourceFile, getDefaultCompilerOptions, getImpliedNodeFormatForFile, fixupCompilerOptions, transpileOptionValueCompilerOptions, getNewLineCharacter, fileExtensionIs, normalizePath, Debug, toPath, getSetExternalModuleIndicator, getEntries, addRange, hasProperty, getEmitScriptTarget, getDirectoryPath } = ts;
      const compilerOptionsDiagnostics = [];
      const options = transpileOptions.compilerOptions ? fixupCompilerOptions(transpileOptions.compilerOptions, compilerOptionsDiagnostics) : {};
      const defaultOptions = getDefaultCompilerOptions();
      for (const key in defaultOptions) {
        if (hasProperty(defaultOptions, key) && options[key] === void 0) {
          options[key] = defaultOptions[key];
        }
      }
      for (const option of transpileOptionValueCompilerOptions) {
        options[option.name] = option.transpileOptionValue;
      }
      options.suppressOutputPathCheck = true;
      options.allowNonTsExtensions = true;
      const newLine = getNewLineCharacter(options);
      const compilerHost = {
        getSourceFile: (fileName) => fileName === normalizePath(inputFileName) ? sourceFile : void 0,
        writeFile: (name, text) => {
          if (fileExtensionIs(name, ".map")) {
            Debug.assertEqual(sourceMapText, void 0, "Unexpected multiple source map outputs, file:", name);
            sourceMapText = text;
          } else {
            Debug.assertEqual(outputText, void 0, "Unexpected multiple outputs, file:", name);
            outputText = text;
          }
        },
        getDefaultLibFileName: () => "lib.d.ts",
        useCaseSensitiveFileNames: () => true,
        getCanonicalFileName: (fileName) => fileName,
        getCurrentDirectory: () => "",
        getNewLine: () => newLine,
        fileExists: (fileName) => fileName === inputFileName || fileName === packageJsonFileName,
        readFile: (fileName) => fileName === packageJsonFileName ? `{"type": "${_packageJsonType}"}` : "",
        directoryExists: () => true,
        getDirectories: () => []
      };
      let inputFileName;
      let packageJsonFileName;
      let _packageJsonType;
      let sourceFile;
      let outputText;
      let sourceMapText;
      return transpileModule;
      function transpileModule(input, transpileOptions2, packageJsonType = "commonjs") {
        inputFileName = transpileOptions2.fileName || (transpileOptions.compilerOptions && transpileOptions.compilerOptions.jsx ? "module.tsx" : "module.ts");
        packageJsonFileName = getDirectoryPath(inputFileName) + "/package.json";
        _packageJsonType = packageJsonType;
        sourceFile = createSourceFile(inputFileName, input, {
          languageVersion: getEmitScriptTarget(options),
          impliedNodeFormat: getImpliedNodeFormatForFile(
            toPath(inputFileName, "", compilerHost.getCanonicalFileName),
            /*cache*/
            void 0,
            compilerHost,
            options
          ),
          setExternalModuleIndicator: getSetExternalModuleIndicator(options)
        });
        if (transpileOptions2.moduleName) {
          sourceFile.moduleName = transpileOptions2.moduleName;
        }
        if (transpileOptions2.renamedDependencies) {
          sourceFile.renamedDependencies = new Map(getEntries(transpileOptions2.renamedDependencies));
        }
        outputText = void 0;
        sourceMapText = void 0;
        const program2 = createProgram([inputFileName], options, compilerHost);
        const diagnostics = compilerOptionsDiagnostics.slice();
        if (transpileOptions.reportDiagnostics) {
          addRange(
            /*to*/
            diagnostics,
            /*from*/
            program2.getSyntacticDiagnostics(sourceFile)
          );
          addRange(
            /*to*/
            diagnostics,
            /*from*/
            program2.getOptionsDiagnostics()
          );
        }
        program2.emit(
          /*targetSourceFile*/
          void 0,
          /*writeFile*/
          void 0,
          /*cancellationToken*/
          void 0,
          /*emitOnlyDtsFiles*/
          void 0,
          transpileOptions.transformers
        );
        if (outputText === void 0)
          return Debug.fail("Output generation failed");
        return { outputText, diagnostics, sourceMapText };
      }
    }
    exports2.createTsTranspileModule = createTsTranspileModule;
  }
});

// node_modules/ts-node/node_modules/acorn/dist/acorn.js
var require_acorn = __commonJS({
  "node_modules/ts-node/node_modules/acorn/dist/acorn.js"(exports2, module2) {
    "use strict";
    init_cjs_shims();
    (function(global2, factory) {
      typeof exports2 === "object" && typeof module2 !== "undefined" ? factory(exports2) : typeof define === "function" && define.amd ? define(["exports"], factory) : (global2 = typeof globalThis !== "undefined" ? globalThis : global2 || self, factory(global2.acorn = {}));
    })(exports2, function(exports3) {
      "use strict";
      var astralIdentifierCodes = [509, 0, 227, 0, 150, 4, 294, 9, 1368, 2, 2, 1, 6, 3, 41, 2, 5, 0, 166, 1, 574, 3, 9, 9, 7, 9, 32, 4, 318, 1, 80, 3, 71, 10, 50, 3, 123, 2, 54, 14, 32, 10, 3, 1, 11, 3, 46, 10, 8, 0, 46, 9, 7, 2, 37, 13, 2, 9, 6, 1, 45, 0, 13, 2, 49, 13, 9, 3, 2, 11, 83, 11, 7, 0, 3, 0, 158, 11, 6, 9, 7, 3, 56, 1, 2, 6, 3, 1, 3, 2, 10, 0, 11, 1, 3, 6, 4, 4, 68, 8, 2, 0, 3, 0, 2, 3, 2, 4, 2, 0, 15, 1, 83, 17, 10, 9, 5, 0, 82, 19, 13, 9, 214, 6, 3, 8, 28, 1, 83, 16, 16, 9, 82, 12, 9, 9, 7, 19, 58, 14, 5, 9, 243, 14, 166, 9, 71, 5, 2, 1, 3, 3, 2, 0, 2, 1, 13, 9, 120, 6, 3, 6, 4, 0, 29, 9, 41, 6, 2, 3, 9, 0, 10, 10, 47, 15, 343, 9, 54, 7, 2, 7, 17, 9, 57, 21, 2, 13, 123, 5, 4, 0, 2, 1, 2, 6, 2, 0, 9, 9, 49, 4, 2, 1, 2, 4, 9, 9, 330, 3, 10, 1, 2, 0, 49, 6, 4, 4, 14, 10, 5350, 0, 7, 14, 11465, 27, 2343, 9, 87, 9, 39, 4, 60, 6, 26, 9, 535, 9, 470, 0, 2, 54, 8, 3, 82, 0, 12, 1, 19628, 1, 4178, 9, 519, 45, 3, 22, 543, 4, 4, 5, 9, 7, 3, 6, 31, 3, 149, 2, 1418, 49, 513, 54, 5, 49, 9, 0, 15, 0, 23, 4, 2, 14, 1361, 6, 2, 16, 3, 6, 2, 1, 2, 4, 101, 0, 161, 6, 10, 9, 357, 0, 62, 13, 499, 13, 245, 1, 2, 9, 726, 6, 110, 6, 6, 9, 4759, 9, 787719, 239];
      var astralIdentifierStartCodes = [0, 11, 2, 25, 2, 18, 2, 1, 2, 14, 3, 13, 35, 122, 70, 52, 268, 28, 4, 48, 48, 31, 14, 29, 6, 37, 11, 29, 3, 35, 5, 7, 2, 4, 43, 157, 19, 35, 5, 35, 5, 39, 9, 51, 13, 10, 2, 14, 2, 6, 2, 1, 2, 10, 2, 14, 2, 6, 2, 1, 4, 51, 13, 310, 10, 21, 11, 7, 25, 5, 2, 41, 2, 8, 70, 5, 3, 0, 2, 43, 2, 1, 4, 0, 3, 22, 11, 22, 10, 30, 66, 18, 2, 1, 11, 21, 11, 25, 71, 55, 7, 1, 65, 0, 16, 3, 2, 2, 2, 28, 43, 28, 4, 28, 36, 7, 2, 27, 28, 53, 11, 21, 11, 18, 14, 17, 111, 72, 56, 50, 14, 50, 14, 35, 39, 27, 10, 22, 251, 41, 7, 1, 17, 2, 60, 28, 11, 0, 9, 21, 43, 17, 47, 20, 28, 22, 13, 52, 58, 1, 3, 0, 14, 44, 33, 24, 27, 35, 30, 0, 3, 0, 9, 34, 4, 0, 13, 47, 15, 3, 22, 0, 2, 0, 36, 17, 2, 24, 20, 1, 64, 6, 2, 0, 2, 3, 2, 14, 2, 9, 8, 46, 39, 7, 3, 1, 3, 21, 2, 6, 2, 1, 2, 4, 4, 0, 19, 0, 13, 4, 31, 9, 2, 0, 3, 0, 2, 37, 2, 0, 26, 0, 2, 0, 45, 52, 19, 3, 21, 2, 31, 47, 21, 1, 2, 0, 185, 46, 42, 3, 37, 47, 21, 0, 60, 42, 14, 0, 72, 26, 38, 6, 186, 43, 117, 63, 32, 7, 3, 0, 3, 7, 2, 1, 2, 23, 16, 0, 2, 0, 95, 7, 3, 38, 17, 0, 2, 0, 29, 0, 11, 39, 8, 0, 22, 0, 12, 45, 20, 0, 19, 72, 200, 32, 32, 8, 2, 36, 18, 0, 50, 29, 113, 6, 2, 1, 2, 37, 22, 0, 26, 5, 2, 1, 2, 31, 15, 0, 328, 18, 16, 0, 2, 12, 2, 33, 125, 0, 80, 921, 103, 110, 18, 195, 2637, 96, 16, 1071, 18, 5, 26, 3994, 6, 582, 6842, 29, 1763, 568, 8, 30, 18, 78, 18, 29, 19, 47, 17, 3, 32, 20, 6, 18, 433, 44, 212, 63, 129, 74, 6, 0, 67, 12, 65, 1, 2, 0, 29, 6135, 9, 1237, 42, 9, 8936, 3, 2, 6, 2, 1, 2, 290, 16, 0, 30, 2, 3, 0, 15, 3, 9, 395, 2309, 106, 6, 12, 4, 8, 8, 9, 5991, 84, 2, 70, 2, 1, 3, 0, 3, 1, 3, 3, 2, 11, 2, 0, 2, 6, 2, 64, 2, 3, 3, 7, 2, 6, 2, 27, 2, 3, 2, 4, 2, 0, 4, 6, 2, 339, 3, 24, 2, 24, 2, 30, 2, 24, 2, 30, 2, 24, 2, 30, 2, 24, 2, 30, 2, 24, 2, 7, 1845, 30, 7, 5, 262, 61, 147, 44, 11, 6, 17, 0, 322, 29, 19, 43, 485, 27, 229, 29, 3, 0, 496, 6, 2, 3, 2, 1, 2, 14, 2, 196, 60, 67, 8, 0, 1205, 3, 2, 26, 2, 1, 2, 0, 3, 0, 2, 9, 2, 3, 2, 0, 2, 0, 7, 0, 5, 0, 2, 0, 2, 0, 2, 2, 2, 1, 2, 0, 3, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 1, 2, 0, 3, 3, 2, 6, 2, 3, 2, 3, 2, 0, 2, 9, 2, 16, 6, 2, 2, 4, 2, 16, 4421, 42719, 33, 4153, 7, 221, 3, 5761, 15, 7472, 16, 621, 2467, 541, 1507, 4938, 6, 4191];
      var nonASCIIidentifierChars = "\u200C\u200D\xB7\u0300-\u036F\u0387\u0483-\u0487\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u0610-\u061A\u064B-\u0669\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED\u06F0-\u06F9\u0711\u0730-\u074A\u07A6-\u07B0\u07C0-\u07C9\u07EB-\u07F3\u07FD\u0816-\u0819\u081B-\u0823\u0825-\u0827\u0829-\u082D\u0859-\u085B\u0897-\u089F\u08CA-\u08E1\u08E3-\u0903\u093A-\u093C\u093E-\u094F\u0951-\u0957\u0962\u0963\u0966-\u096F\u0981-\u0983\u09BC\u09BE-\u09C4\u09C7\u09C8\u09CB-\u09CD\u09D7\u09E2\u09E3\u09E6-\u09EF\u09FE\u0A01-\u0A03\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A66-\u0A71\u0A75\u0A81-\u0A83\u0ABC\u0ABE-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AE2\u0AE3\u0AE6-\u0AEF\u0AFA-\u0AFF\u0B01-\u0B03\u0B3C\u0B3E-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B55-\u0B57\u0B62\u0B63\u0B66-\u0B6F\u0B82\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD7\u0BE6-\u0BEF\u0C00-\u0C04\u0C3C\u0C3E-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C62\u0C63\u0C66-\u0C6F\u0C81-\u0C83\u0CBC\u0CBE-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CE2\u0CE3\u0CE6-\u0CEF\u0CF3\u0D00-\u0D03\u0D3B\u0D3C\u0D3E-\u0D44\u0D46-\u0D48\u0D4A-\u0D4D\u0D57\u0D62\u0D63\u0D66-\u0D6F\u0D81-\u0D83\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2\u0DF3\u0E31\u0E34-\u0E3A\u0E47-\u0E4E\u0E50-\u0E59\u0EB1\u0EB4-\u0EBC\u0EC8-\u0ECE\u0ED0-\u0ED9\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E\u0F3F\u0F71-\u0F84\u0F86\u0F87\u0F8D-\u0F97\u0F99-\u0FBC\u0FC6\u102B-\u103E\u1040-\u1049\u1056-\u1059\u105E-\u1060\u1062-\u1064\u1067-\u106D\u1071-\u1074\u1082-\u108D\u108F-\u109D\u135D-\u135F\u1369-\u1371\u1712-\u1715\u1732-\u1734\u1752\u1753\u1772\u1773\u17B4-\u17D3\u17DD\u17E0-\u17E9\u180B-\u180D\u180F-\u1819\u18A9\u1920-\u192B\u1930-\u193B\u1946-\u194F\u19D0-\u19DA\u1A17-\u1A1B\u1A55-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AB0-\u1ABD\u1ABF-\u1ACE\u1B00-\u1B04\u1B34-\u1B44\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1B82\u1BA1-\u1BAD\u1BB0-\u1BB9\u1BE6-\u1BF3\u1C24-\u1C37\u1C40-\u1C49\u1C50-\u1C59\u1CD0-\u1CD2\u1CD4-\u1CE8\u1CED\u1CF4\u1CF7-\u1CF9\u1DC0-\u1DFF\u200C\u200D\u203F\u2040\u2054\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2CEF-\u2CF1\u2D7F\u2DE0-\u2DFF\u302A-\u302F\u3099\u309A\u30FB\uA620-\uA629\uA66F\uA674-\uA67D\uA69E\uA69F\uA6F0\uA6F1\uA802\uA806\uA80B\uA823-\uA827\uA82C\uA880\uA881\uA8B4-\uA8C5\uA8D0-\uA8D9\uA8E0-\uA8F1\uA8FF-\uA909\uA926-\uA92D\uA947-\uA953\uA980-\uA983\uA9B3-\uA9C0\uA9D0-\uA9D9\uA9E5\uA9F0-\uA9F9\uAA29-\uAA36\uAA43\uAA4C\uAA4D\uAA50-\uAA59\uAA7B-\uAA7D\uAAB0\uAAB2-\uAAB4\uAAB7\uAAB8\uAABE\uAABF\uAAC1\uAAEB-\uAAEF\uAAF5\uAAF6\uABE3-\uABEA\uABEC\uABED\uABF0-\uABF9\uFB1E\uFE00-\uFE0F\uFE20-\uFE2F\uFE33\uFE34\uFE4D-\uFE4F\uFF10-\uFF19\uFF3F\uFF65";
      var nonASCIIidentifierStartChars = "\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0560-\u0588\u05D0-\u05EA\u05EF-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u0860-\u086A\u0870-\u0887\u0889-\u088E\u08A0-\u08C9\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u09FC\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0AF9\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58-\u0C5A\u0C5D\u0C60\u0C61\u0C80\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D04-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D54-\u0D56\u0D5F-\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E86-\u0E8A\u0E8C-\u0EA3\u0EA5\u0EA7-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u1711\u171F-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1878\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4C\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1C80-\u1C8A\u1C90-\u1CBA\u1CBD-\u1CBF\u1CE9-\u1CEC\u1CEE-\u1CF3\u1CF5\u1CF6\u1CFA\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2118-\u211D\u2124\u2126\u2128\u212A-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309B-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312F\u3131-\u318E\u31A0-\u31BF\u31F0-\u31FF\u3400-\u4DBF\u4E00-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA7CD\uA7D0\uA7D1\uA7D3\uA7D5-\uA7DC\uA7F2-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA8FD\uA8FE\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB69\uAB70-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC";
      var reservedWords = {
        3: "abstract boolean byte char class double enum export extends final float goto implements import int interface long native package private protected public short static super synchronized throws transient volatile",
        5: "class enum extends super const export import",
        6: "enum",
        strict: "implements interface let package private protected public static yield",
        strictBind: "eval arguments"
      };
      var ecma5AndLessKeywords = "break case catch continue debugger default do else finally for function if return switch throw try var while with null true false instanceof typeof void delete new in this";
      var keywords$1 = {
        5: ecma5AndLessKeywords,
        "5module": ecma5AndLessKeywords + " export import",
        6: ecma5AndLessKeywords + " const class extends export import super"
      };
      var keywordRelationalOperator = /^in(stanceof)?$/;
      var nonASCIIidentifierStart = new RegExp("[" + nonASCIIidentifierStartChars + "]");
      var nonASCIIidentifier = new RegExp("[" + nonASCIIidentifierStartChars + nonASCIIidentifierChars + "]");
      function isInAstralSet(code, set) {
        var pos = 65536;
        for (var i2 = 0; i2 < set.length; i2 += 2) {
          pos += set[i2];
          if (pos > code) {
            return false;
          }
          pos += set[i2 + 1];
          if (pos >= code) {
            return true;
          }
        }
        return false;
      }
      function isIdentifierStart(code, astral) {
        if (code < 65) {
          return code === 36;
        }
        if (code < 91) {
          return true;
        }
        if (code < 97) {
          return code === 95;
        }
        if (code < 123) {
          return true;
        }
        if (code <= 65535) {
          return code >= 170 && nonASCIIidentifierStart.test(String.fromCharCode(code));
        }
        if (astral === false) {
          return false;
        }
        return isInAstralSet(code, astralIdentifierStartCodes);
      }
      function isIdentifierChar(code, astral) {
        if (code < 48) {
          return code === 36;
        }
        if (code < 58) {
          return true;
        }
        if (code < 65) {
          return false;
        }
        if (code < 91) {
          return true;
        }
        if (code < 97) {
          return code === 95;
        }
        if (code < 123) {
          return true;
        }
        if (code <= 65535) {
          return code >= 170 && nonASCIIidentifier.test(String.fromCharCode(code));
        }
        if (astral === false) {
          return false;
        }
        return isInAstralSet(code, astralIdentifierStartCodes) || isInAstralSet(code, astralIdentifierCodes);
      }
      var TokenType = function TokenType2(label, conf) {
        if (conf === void 0) conf = {};
        this.label = label;
        this.keyword = conf.keyword;
        this.beforeExpr = !!conf.beforeExpr;
        this.startsExpr = !!conf.startsExpr;
        this.isLoop = !!conf.isLoop;
        this.isAssign = !!conf.isAssign;
        this.prefix = !!conf.prefix;
        this.postfix = !!conf.postfix;
        this.binop = conf.binop || null;
        this.updateContext = null;
      };
      function binop(name, prec) {
        return new TokenType(name, { beforeExpr: true, binop: prec });
      }
      var beforeExpr = { beforeExpr: true }, startsExpr = { startsExpr: true };
      var keywords = {};
      function kw(name, options) {
        if (options === void 0) options = {};
        options.keyword = name;
        return keywords[name] = new TokenType(name, options);
      }
      var types$1 = {
        num: new TokenType("num", startsExpr),
        regexp: new TokenType("regexp", startsExpr),
        string: new TokenType("string", startsExpr),
        name: new TokenType("name", startsExpr),
        privateId: new TokenType("privateId", startsExpr),
        eof: new TokenType("eof"),
        // Punctuation token types.
        bracketL: new TokenType("[", { beforeExpr: true, startsExpr: true }),
        bracketR: new TokenType("]"),
        braceL: new TokenType("{", { beforeExpr: true, startsExpr: true }),
        braceR: new TokenType("}"),
        parenL: new TokenType("(", { beforeExpr: true, startsExpr: true }),
        parenR: new TokenType(")"),
        comma: new TokenType(",", beforeExpr),
        semi: new TokenType(";", beforeExpr),
        colon: new TokenType(":", beforeExpr),
        dot: new TokenType("."),
        question: new TokenType("?", beforeExpr),
        questionDot: new TokenType("?."),
        arrow: new TokenType("=>", beforeExpr),
        template: new TokenType("template"),
        invalidTemplate: new TokenType("invalidTemplate"),
        ellipsis: new TokenType("...", beforeExpr),
        backQuote: new TokenType("`", startsExpr),
        dollarBraceL: new TokenType("${", { beforeExpr: true, startsExpr: true }),
        // Operators. These carry several kinds of properties to help the
        // parser use them properly (the presence of these properties is
        // what categorizes them as operators).
        //
        // `binop`, when present, specifies that this operator is a binary
        // operator, and will refer to its precedence.
        //
        // `prefix` and `postfix` mark the operator as a prefix or postfix
        // unary operator.
        //
        // `isAssign` marks all of `=`, `+=`, `-=` etcetera, which act as
        // binary operators with a very low precedence, that should result
        // in AssignmentExpression nodes.
        eq: new TokenType("=", { beforeExpr: true, isAssign: true }),
        assign: new TokenType("_=", { beforeExpr: true, isAssign: true }),
        incDec: new TokenType("++/--", { prefix: true, postfix: true, startsExpr: true }),
        prefix: new TokenType("!/~", { beforeExpr: true, prefix: true, startsExpr: true }),
        logicalOR: binop("||", 1),
        logicalAND: binop("&&", 2),
        bitwiseOR: binop("|", 3),
        bitwiseXOR: binop("^", 4),
        bitwiseAND: binop("&", 5),
        equality: binop("==/!=/===/!==", 6),
        relational: binop("</>/<=/>=", 7),
        bitShift: binop("<</>>/>>>", 8),
        plusMin: new TokenType("+/-", { beforeExpr: true, binop: 9, prefix: true, startsExpr: true }),
        modulo: binop("%", 10),
        star: binop("*", 10),
        slash: binop("/", 10),
        starstar: new TokenType("**", { beforeExpr: true }),
        coalesce: binop("??", 1),
        // Keyword token types.
        _break: kw("break"),
        _case: kw("case", beforeExpr),
        _catch: kw("catch"),
        _continue: kw("continue"),
        _debugger: kw("debugger"),
        _default: kw("default", beforeExpr),
        _do: kw("do", { isLoop: true, beforeExpr: true }),
        _else: kw("else", beforeExpr),
        _finally: kw("finally"),
        _for: kw("for", { isLoop: true }),
        _function: kw("function", startsExpr),
        _if: kw("if"),
        _return: kw("return", beforeExpr),
        _switch: kw("switch"),
        _throw: kw("throw", beforeExpr),
        _try: kw("try"),
        _var: kw("var"),
        _const: kw("const"),
        _while: kw("while", { isLoop: true }),
        _with: kw("with"),
        _new: kw("new", { beforeExpr: true, startsExpr: true }),
        _this: kw("this", startsExpr),
        _super: kw("super", startsExpr),
        _class: kw("class", startsExpr),
        _extends: kw("extends", beforeExpr),
        _export: kw("export"),
        _import: kw("import", startsExpr),
        _null: kw("null", startsExpr),
        _true: kw("true", startsExpr),
        _false: kw("false", startsExpr),
        _in: kw("in", { beforeExpr: true, binop: 7 }),
        _instanceof: kw("instanceof", { beforeExpr: true, binop: 7 }),
        _typeof: kw("typeof", { beforeExpr: true, prefix: true, startsExpr: true }),
        _void: kw("void", { beforeExpr: true, prefix: true, startsExpr: true }),
        _delete: kw("delete", { beforeExpr: true, prefix: true, startsExpr: true })
      };
      var lineBreak = /\r\n?|\n|\u2028|\u2029/;
      var lineBreakG = new RegExp(lineBreak.source, "g");
      function isNewLine(code) {
        return code === 10 || code === 13 || code === 8232 || code === 8233;
      }
      function nextLineBreak(code, from, end) {
        if (end === void 0) end = code.length;
        for (var i2 = from; i2 < end; i2++) {
          var next = code.charCodeAt(i2);
          if (isNewLine(next)) {
            return i2 < end - 1 && next === 13 && code.charCodeAt(i2 + 1) === 10 ? i2 + 2 : i2 + 1;
          }
        }
        return -1;
      }
      var nonASCIIwhitespace = /[\u1680\u2000-\u200a\u202f\u205f\u3000\ufeff]/;
      var skipWhiteSpace = /(?:\s|\/\/.*|\/\*[^]*?\*\/)*/g;
      var ref = Object.prototype;
      var hasOwnProperty = ref.hasOwnProperty;
      var toString = ref.toString;
      var hasOwn = Object.hasOwn || function(obj, propName) {
        return hasOwnProperty.call(obj, propName);
      };
      var isArray = Array.isArray || function(obj) {
        return toString.call(obj) === "[object Array]";
      };
      var regexpCache = /* @__PURE__ */ Object.create(null);
      function wordsRegexp(words) {
        return regexpCache[words] || (regexpCache[words] = new RegExp("^(?:" + words.replace(/ /g, "|") + ")$"));
      }
      function codePointToString(code) {
        if (code <= 65535) {
          return String.fromCharCode(code);
        }
        code -= 65536;
        return String.fromCharCode((code >> 10) + 55296, (code & 1023) + 56320);
      }
      var loneSurrogate = /(?:[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])/;
      var Position = function Position2(line, col) {
        this.line = line;
        this.column = col;
      };
      Position.prototype.offset = function offset(n) {
        return new Position(this.line, this.column + n);
      };
      var SourceLocation = function SourceLocation2(p, start, end) {
        this.start = start;
        this.end = end;
        if (p.sourceFile !== null) {
          this.source = p.sourceFile;
        }
      };
      function getLineInfo(input, offset) {
        for (var line = 1, cur = 0; ; ) {
          var nextBreak = nextLineBreak(input, cur, offset);
          if (nextBreak < 0) {
            return new Position(line, offset - cur);
          }
          ++line;
          cur = nextBreak;
        }
      }
      var defaultOptions = {
        // `ecmaVersion` indicates the ECMAScript version to parse. Must be
        // either 3, 5, 6 (or 2015), 7 (2016), 8 (2017), 9 (2018), 10
        // (2019), 11 (2020), 12 (2021), 13 (2022), 14 (2023), or `"latest"`
        // (the latest version the library supports). This influences
        // support for strict mode, the set of reserved words, and support
        // for new syntax features.
        ecmaVersion: null,
        // `sourceType` indicates the mode the code should be parsed in.
        // Can be either `"script"` or `"module"`. This influences global
        // strict mode and parsing of `import` and `export` declarations.
        sourceType: "script",
        // `onInsertedSemicolon` can be a callback that will be called when
        // a semicolon is automatically inserted. It will be passed the
        // position of the inserted semicolon as an offset, and if
        // `locations` is enabled, it is given the location as a `{line,
        // column}` object as second argument.
        onInsertedSemicolon: null,
        // `onTrailingComma` is similar to `onInsertedSemicolon`, but for
        // trailing commas.
        onTrailingComma: null,
        // By default, reserved words are only enforced if ecmaVersion >= 5.
        // Set `allowReserved` to a boolean value to explicitly turn this on
        // an off. When this option has the value "never", reserved words
        // and keywords can also not be used as property names.
        allowReserved: null,
        // When enabled, a return at the top level is not considered an
        // error.
        allowReturnOutsideFunction: false,
        // When enabled, import/export statements are not constrained to
        // appearing at the top of the program, and an import.meta expression
        // in a script isn't considered an error.
        allowImportExportEverywhere: false,
        // By default, await identifiers are allowed to appear at the top-level scope only if ecmaVersion >= 2022.
        // When enabled, await identifiers are allowed to appear at the top-level scope,
        // but they are still not allowed in non-async functions.
        allowAwaitOutsideFunction: null,
        // When enabled, super identifiers are not constrained to
        // appearing in methods and do not raise an error when they appear elsewhere.
        allowSuperOutsideMethod: null,
        // When enabled, hashbang directive in the beginning of file is
        // allowed and treated as a line comment. Enabled by default when
        // `ecmaVersion` >= 2023.
        allowHashBang: false,
        // By default, the parser will verify that private properties are
        // only used in places where they are valid and have been declared.
        // Set this to false to turn such checks off.
        checkPrivateFields: true,
        // When `locations` is on, `loc` properties holding objects with
        // `start` and `end` properties in `{line, column}` form (with
        // line being 1-based and column 0-based) will be attached to the
        // nodes.
        locations: false,
        // A function can be passed as `onToken` option, which will
        // cause Acorn to call that function with object in the same
        // format as tokens returned from `tokenizer().getToken()`. Note
        // that you are not allowed to call the parser from the
        // callback—that will corrupt its internal state.
        onToken: null,
        // A function can be passed as `onComment` option, which will
        // cause Acorn to call that function with `(block, text, start,
        // end)` parameters whenever a comment is skipped. `block` is a
        // boolean indicating whether this is a block (`/* */`) comment,
        // `text` is the content of the comment, and `start` and `end` are
        // character offsets that denote the start and end of the comment.
        // When the `locations` option is on, two more parameters are
        // passed, the full `{line, column}` locations of the start and
        // end of the comments. Note that you are not allowed to call the
        // parser from the callback—that will corrupt its internal state.
        // When this option has an array as value, objects representing the
        // comments are pushed to it.
        onComment: null,
        // Nodes have their start and end characters offsets recorded in
        // `start` and `end` properties (directly on the node, rather than
        // the `loc` object, which holds line/column data. To also add a
        // [semi-standardized][range] `range` property holding a `[start,
        // end]` array with the same numbers, set the `ranges` option to
        // `true`.
        //
        // [range]: https://bugzilla.mozilla.org/show_bug.cgi?id=745678
        ranges: false,
        // It is possible to parse multiple files into a single AST by
        // passing the tree produced by parsing the first file as
        // `program` option in subsequent parses. This will add the
        // toplevel forms of the parsed file to the `Program` (top) node
        // of an existing parse tree.
        program: null,
        // When `locations` is on, you can pass this to record the source
        // file in every node's `loc` object.
        sourceFile: null,
        // This value, if given, is stored in every node, whether
        // `locations` is on or off.
        directSourceFile: null,
        // When enabled, parenthesized expressions are represented by
        // (non-standard) ParenthesizedExpression nodes
        preserveParens: false
      };
      var warnedAboutEcmaVersion = false;
      function getOptions(opts) {
        var options = {};
        for (var opt in defaultOptions) {
          options[opt] = opts && hasOwn(opts, opt) ? opts[opt] : defaultOptions[opt];
        }
        if (options.ecmaVersion === "latest") {
          options.ecmaVersion = 1e8;
        } else if (options.ecmaVersion == null) {
          if (!warnedAboutEcmaVersion && typeof console === "object" && console.warn) {
            warnedAboutEcmaVersion = true;
            console.warn("Since Acorn 8.0.0, options.ecmaVersion is required.\nDefaulting to 2020, but this will stop working in the future.");
          }
          options.ecmaVersion = 11;
        } else if (options.ecmaVersion >= 2015) {
          options.ecmaVersion -= 2009;
        }
        if (options.allowReserved == null) {
          options.allowReserved = options.ecmaVersion < 5;
        }
        if (!opts || opts.allowHashBang == null) {
          options.allowHashBang = options.ecmaVersion >= 14;
        }
        if (isArray(options.onToken)) {
          var tokens = options.onToken;
          options.onToken = function(token) {
            return tokens.push(token);
          };
        }
        if (isArray(options.onComment)) {
          options.onComment = pushComment(options, options.onComment);
        }
        return options;
      }
      function pushComment(options, array) {
        return function(block, text, start, end, startLoc, endLoc) {
          var comment = {
            type: block ? "Block" : "Line",
            value: text,
            start,
            end
          };
          if (options.locations) {
            comment.loc = new SourceLocation(this, startLoc, endLoc);
          }
          if (options.ranges) {
            comment.range = [start, end];
          }
          array.push(comment);
        };
      }
      var SCOPE_TOP = 1, SCOPE_FUNCTION = 2, SCOPE_ASYNC = 4, SCOPE_GENERATOR = 8, SCOPE_ARROW = 16, SCOPE_SIMPLE_CATCH = 32, SCOPE_SUPER = 64, SCOPE_DIRECT_SUPER = 128, SCOPE_CLASS_STATIC_BLOCK = 256, SCOPE_VAR = SCOPE_TOP | SCOPE_FUNCTION | SCOPE_CLASS_STATIC_BLOCK;
      function functionFlags(async, generator) {
        return SCOPE_FUNCTION | (async ? SCOPE_ASYNC : 0) | (generator ? SCOPE_GENERATOR : 0);
      }
      var BIND_NONE = 0, BIND_VAR = 1, BIND_LEXICAL = 2, BIND_FUNCTION = 3, BIND_SIMPLE_CATCH = 4, BIND_OUTSIDE = 5;
      var Parser = function Parser2(options, input, startPos) {
        this.options = options = getOptions(options);
        this.sourceFile = options.sourceFile;
        this.keywords = wordsRegexp(keywords$1[options.ecmaVersion >= 6 ? 6 : options.sourceType === "module" ? "5module" : 5]);
        var reserved = "";
        if (options.allowReserved !== true) {
          reserved = reservedWords[options.ecmaVersion >= 6 ? 6 : options.ecmaVersion === 5 ? 5 : 3];
          if (options.sourceType === "module") {
            reserved += " await";
          }
        }
        this.reservedWords = wordsRegexp(reserved);
        var reservedStrict = (reserved ? reserved + " " : "") + reservedWords.strict;
        this.reservedWordsStrict = wordsRegexp(reservedStrict);
        this.reservedWordsStrictBind = wordsRegexp(reservedStrict + " " + reservedWords.strictBind);
        this.input = String(input);
        this.containsEsc = false;
        if (startPos) {
          this.pos = startPos;
          this.lineStart = this.input.lastIndexOf("\n", startPos - 1) + 1;
          this.curLine = this.input.slice(0, this.lineStart).split(lineBreak).length;
        } else {
          this.pos = this.lineStart = 0;
          this.curLine = 1;
        }
        this.type = types$1.eof;
        this.value = null;
        this.start = this.end = this.pos;
        this.startLoc = this.endLoc = this.curPosition();
        this.lastTokEndLoc = this.lastTokStartLoc = null;
        this.lastTokStart = this.lastTokEnd = this.pos;
        this.context = this.initialContext();
        this.exprAllowed = true;
        this.inModule = options.sourceType === "module";
        this.strict = this.inModule || this.strictDirective(this.pos);
        this.potentialArrowAt = -1;
        this.potentialArrowInForAwait = false;
        this.yieldPos = this.awaitPos = this.awaitIdentPos = 0;
        this.labels = [];
        this.undefinedExports = /* @__PURE__ */ Object.create(null);
        if (this.pos === 0 && options.allowHashBang && this.input.slice(0, 2) === "#!") {
          this.skipLineComment(2);
        }
        this.scopeStack = [];
        this.enterScope(SCOPE_TOP);
        this.regexpState = null;
        this.privateNameStack = [];
      };
      var prototypeAccessors = { inFunction: { configurable: true }, inGenerator: { configurable: true }, inAsync: { configurable: true }, canAwait: { configurable: true }, allowSuper: { configurable: true }, allowDirectSuper: { configurable: true }, treatFunctionsAsVar: { configurable: true }, allowNewDotTarget: { configurable: true }, inClassStaticBlock: { configurable: true } };
      Parser.prototype.parse = function parse2() {
        var node = this.options.program || this.startNode();
        this.nextToken();
        return this.parseTopLevel(node);
      };
      prototypeAccessors.inFunction.get = function() {
        return (this.currentVarScope().flags & SCOPE_FUNCTION) > 0;
      };
      prototypeAccessors.inGenerator.get = function() {
        return (this.currentVarScope().flags & SCOPE_GENERATOR) > 0 && !this.currentVarScope().inClassFieldInit;
      };
      prototypeAccessors.inAsync.get = function() {
        return (this.currentVarScope().flags & SCOPE_ASYNC) > 0 && !this.currentVarScope().inClassFieldInit;
      };
      prototypeAccessors.canAwait.get = function() {
        for (var i2 = this.scopeStack.length - 1; i2 >= 0; i2--) {
          var scope = this.scopeStack[i2];
          if (scope.inClassFieldInit || scope.flags & SCOPE_CLASS_STATIC_BLOCK) {
            return false;
          }
          if (scope.flags & SCOPE_FUNCTION) {
            return (scope.flags & SCOPE_ASYNC) > 0;
          }
        }
        return this.inModule && this.options.ecmaVersion >= 13 || this.options.allowAwaitOutsideFunction;
      };
      prototypeAccessors.allowSuper.get = function() {
        var ref2 = this.currentThisScope();
        var flags = ref2.flags;
        var inClassFieldInit = ref2.inClassFieldInit;
        return (flags & SCOPE_SUPER) > 0 || inClassFieldInit || this.options.allowSuperOutsideMethod;
      };
      prototypeAccessors.allowDirectSuper.get = function() {
        return (this.currentThisScope().flags & SCOPE_DIRECT_SUPER) > 0;
      };
      prototypeAccessors.treatFunctionsAsVar.get = function() {
        return this.treatFunctionsAsVarInScope(this.currentScope());
      };
      prototypeAccessors.allowNewDotTarget.get = function() {
        var ref2 = this.currentThisScope();
        var flags = ref2.flags;
        var inClassFieldInit = ref2.inClassFieldInit;
        return (flags & (SCOPE_FUNCTION | SCOPE_CLASS_STATIC_BLOCK)) > 0 || inClassFieldInit;
      };
      prototypeAccessors.inClassStaticBlock.get = function() {
        return (this.currentVarScope().flags & SCOPE_CLASS_STATIC_BLOCK) > 0;
      };
      Parser.extend = function extend() {
        var plugins = [], len = arguments.length;
        while (len--) plugins[len] = arguments[len];
        var cls = this;
        for (var i2 = 0; i2 < plugins.length; i2++) {
          cls = plugins[i2](cls);
        }
        return cls;
      };
      Parser.parse = function parse2(input, options) {
        return new this(options, input).parse();
      };
      Parser.parseExpressionAt = function parseExpressionAt2(input, pos, options) {
        var parser = new this(options, input, pos);
        parser.nextToken();
        return parser.parseExpression();
      };
      Parser.tokenizer = function tokenizer2(input, options) {
        return new this(options, input);
      };
      Object.defineProperties(Parser.prototype, prototypeAccessors);
      var pp$9 = Parser.prototype;
      var literal = /^(?:'((?:\\[^]|[^'\\])*?)'|"((?:\\[^]|[^"\\])*?)")/;
      pp$9.strictDirective = function(start) {
        if (this.options.ecmaVersion < 5) {
          return false;
        }
        for (; ; ) {
          skipWhiteSpace.lastIndex = start;
          start += skipWhiteSpace.exec(this.input)[0].length;
          var match = literal.exec(this.input.slice(start));
          if (!match) {
            return false;
          }
          if ((match[1] || match[2]) === "use strict") {
            skipWhiteSpace.lastIndex = start + match[0].length;
            var spaceAfter = skipWhiteSpace.exec(this.input), end = spaceAfter.index + spaceAfter[0].length;
            var next = this.input.charAt(end);
            return next === ";" || next === "}" || lineBreak.test(spaceAfter[0]) && !(/[(`.[+\-/*%<>=,?^&]/.test(next) || next === "!" && this.input.charAt(end + 1) === "=");
          }
          start += match[0].length;
          skipWhiteSpace.lastIndex = start;
          start += skipWhiteSpace.exec(this.input)[0].length;
          if (this.input[start] === ";") {
            start++;
          }
        }
      };
      pp$9.eat = function(type) {
        if (this.type === type) {
          this.next();
          return true;
        } else {
          return false;
        }
      };
      pp$9.isContextual = function(name) {
        return this.type === types$1.name && this.value === name && !this.containsEsc;
      };
      pp$9.eatContextual = function(name) {
        if (!this.isContextual(name)) {
          return false;
        }
        this.next();
        return true;
      };
      pp$9.expectContextual = function(name) {
        if (!this.eatContextual(name)) {
          this.unexpected();
        }
      };
      pp$9.canInsertSemicolon = function() {
        return this.type === types$1.eof || this.type === types$1.braceR || lineBreak.test(this.input.slice(this.lastTokEnd, this.start));
      };
      pp$9.insertSemicolon = function() {
        if (this.canInsertSemicolon()) {
          if (this.options.onInsertedSemicolon) {
            this.options.onInsertedSemicolon(this.lastTokEnd, this.lastTokEndLoc);
          }
          return true;
        }
      };
      pp$9.semicolon = function() {
        if (!this.eat(types$1.semi) && !this.insertSemicolon()) {
          this.unexpected();
        }
      };
      pp$9.afterTrailingComma = function(tokType, notNext) {
        if (this.type === tokType) {
          if (this.options.onTrailingComma) {
            this.options.onTrailingComma(this.lastTokStart, this.lastTokStartLoc);
          }
          if (!notNext) {
            this.next();
          }
          return true;
        }
      };
      pp$9.expect = function(type) {
        this.eat(type) || this.unexpected();
      };
      pp$9.unexpected = function(pos) {
        this.raise(pos != null ? pos : this.start, "Unexpected token");
      };
      var DestructuringErrors = function DestructuringErrors2() {
        this.shorthandAssign = this.trailingComma = this.parenthesizedAssign = this.parenthesizedBind = this.doubleProto = -1;
      };
      pp$9.checkPatternErrors = function(refDestructuringErrors, isAssign) {
        if (!refDestructuringErrors) {
          return;
        }
        if (refDestructuringErrors.trailingComma > -1) {
          this.raiseRecoverable(refDestructuringErrors.trailingComma, "Comma is not permitted after the rest element");
        }
        var parens = isAssign ? refDestructuringErrors.parenthesizedAssign : refDestructuringErrors.parenthesizedBind;
        if (parens > -1) {
          this.raiseRecoverable(parens, isAssign ? "Assigning to rvalue" : "Parenthesized pattern");
        }
      };
      pp$9.checkExpressionErrors = function(refDestructuringErrors, andThrow) {
        if (!refDestructuringErrors) {
          return false;
        }
        var shorthandAssign = refDestructuringErrors.shorthandAssign;
        var doubleProto = refDestructuringErrors.doubleProto;
        if (!andThrow) {
          return shorthandAssign >= 0 || doubleProto >= 0;
        }
        if (shorthandAssign >= 0) {
          this.raise(shorthandAssign, "Shorthand property assignments are valid only in destructuring patterns");
        }
        if (doubleProto >= 0) {
          this.raiseRecoverable(doubleProto, "Redefinition of __proto__ property");
        }
      };
      pp$9.checkYieldAwaitInDefaultParams = function() {
        if (this.yieldPos && (!this.awaitPos || this.yieldPos < this.awaitPos)) {
          this.raise(this.yieldPos, "Yield expression cannot be a default value");
        }
        if (this.awaitPos) {
          this.raise(this.awaitPos, "Await expression cannot be a default value");
        }
      };
      pp$9.isSimpleAssignTarget = function(expr) {
        if (expr.type === "ParenthesizedExpression") {
          return this.isSimpleAssignTarget(expr.expression);
        }
        return expr.type === "Identifier" || expr.type === "MemberExpression";
      };
      var pp$8 = Parser.prototype;
      pp$8.parseTopLevel = function(node) {
        var exports4 = /* @__PURE__ */ Object.create(null);
        if (!node.body) {
          node.body = [];
        }
        while (this.type !== types$1.eof) {
          var stmt = this.parseStatement(null, true, exports4);
          node.body.push(stmt);
        }
        if (this.inModule) {
          for (var i2 = 0, list2 = Object.keys(this.undefinedExports); i2 < list2.length; i2 += 1) {
            var name = list2[i2];
            this.raiseRecoverable(this.undefinedExports[name].start, "Export '" + name + "' is not defined");
          }
        }
        this.adaptDirectivePrologue(node.body);
        this.next();
        node.sourceType = this.options.sourceType;
        return this.finishNode(node, "Program");
      };
      var loopLabel = { kind: "loop" }, switchLabel = { kind: "switch" };
      pp$8.isLet = function(context) {
        if (this.options.ecmaVersion < 6 || !this.isContextual("let")) {
          return false;
        }
        skipWhiteSpace.lastIndex = this.pos;
        var skip = skipWhiteSpace.exec(this.input);
        var next = this.pos + skip[0].length, nextCh = this.input.charCodeAt(next);
        if (nextCh === 91 || nextCh === 92) {
          return true;
        }
        if (context) {
          return false;
        }
        if (nextCh === 123 || nextCh > 55295 && nextCh < 56320) {
          return true;
        }
        if (isIdentifierStart(nextCh, true)) {
          var pos = next + 1;
          while (isIdentifierChar(nextCh = this.input.charCodeAt(pos), true)) {
            ++pos;
          }
          if (nextCh === 92 || nextCh > 55295 && nextCh < 56320) {
            return true;
          }
          var ident = this.input.slice(next, pos);
          if (!keywordRelationalOperator.test(ident)) {
            return true;
          }
        }
        return false;
      };
      pp$8.isAsyncFunction = function() {
        if (this.options.ecmaVersion < 8 || !this.isContextual("async")) {
          return false;
        }
        skipWhiteSpace.lastIndex = this.pos;
        var skip = skipWhiteSpace.exec(this.input);
        var next = this.pos + skip[0].length, after;
        return !lineBreak.test(this.input.slice(this.pos, next)) && this.input.slice(next, next + 8) === "function" && (next + 8 === this.input.length || !(isIdentifierChar(after = this.input.charCodeAt(next + 8)) || after > 55295 && after < 56320));
      };
      pp$8.parseStatement = function(context, topLevel, exports4) {
        var starttype = this.type, node = this.startNode(), kind;
        if (this.isLet(context)) {
          starttype = types$1._var;
          kind = "let";
        }
        switch (starttype) {
          case types$1._break:
          case types$1._continue:
            return this.parseBreakContinueStatement(node, starttype.keyword);
          case types$1._debugger:
            return this.parseDebuggerStatement(node);
          case types$1._do:
            return this.parseDoStatement(node);
          case types$1._for:
            return this.parseForStatement(node);
          case types$1._function:
            if (context && (this.strict || context !== "if" && context !== "label") && this.options.ecmaVersion >= 6) {
              this.unexpected();
            }
            return this.parseFunctionStatement(node, false, !context);
          case types$1._class:
            if (context) {
              this.unexpected();
            }
            return this.parseClass(node, true);
          case types$1._if:
            return this.parseIfStatement(node);
          case types$1._return:
            return this.parseReturnStatement(node);
          case types$1._switch:
            return this.parseSwitchStatement(node);
          case types$1._throw:
            return this.parseThrowStatement(node);
          case types$1._try:
            return this.parseTryStatement(node);
          case types$1._const:
          case types$1._var:
            kind = kind || this.value;
            if (context && kind !== "var") {
              this.unexpected();
            }
            return this.parseVarStatement(node, kind);
          case types$1._while:
            return this.parseWhileStatement(node);
          case types$1._with:
            return this.parseWithStatement(node);
          case types$1.braceL:
            return this.parseBlock(true, node);
          case types$1.semi:
            return this.parseEmptyStatement(node);
          case types$1._export:
          case types$1._import:
            if (this.options.ecmaVersion > 10 && starttype === types$1._import) {
              skipWhiteSpace.lastIndex = this.pos;
              var skip = skipWhiteSpace.exec(this.input);
              var next = this.pos + skip[0].length, nextCh = this.input.charCodeAt(next);
              if (nextCh === 40 || nextCh === 46) {
                return this.parseExpressionStatement(node, this.parseExpression());
              }
            }
            if (!this.options.allowImportExportEverywhere) {
              if (!topLevel) {
                this.raise(this.start, "'import' and 'export' may only appear at the top level");
              }
              if (!this.inModule) {
                this.raise(this.start, "'import' and 'export' may appear only with 'sourceType: module'");
              }
            }
            return starttype === types$1._import ? this.parseImport(node) : this.parseExport(node, exports4);
          // If the statement does not start with a statement keyword or a
          // brace, it's an ExpressionStatement or LabeledStatement. We
          // simply start parsing an expression, and afterwards, if the
          // next token is a colon and the expression was a simple
          // Identifier node, we switch to interpreting it as a label.
          default:
            if (this.isAsyncFunction()) {
              if (context) {
                this.unexpected();
              }
              this.next();
              return this.parseFunctionStatement(node, true, !context);
            }
            var maybeName = this.value, expr = this.parseExpression();
            if (starttype === types$1.name && expr.type === "Identifier" && this.eat(types$1.colon)) {
              return this.parseLabeledStatement(node, maybeName, expr, context);
            } else {
              return this.parseExpressionStatement(node, expr);
            }
        }
      };
      pp$8.parseBreakContinueStatement = function(node, keyword) {
        var isBreak = keyword === "break";
        this.next();
        if (this.eat(types$1.semi) || this.insertSemicolon()) {
          node.label = null;
        } else if (this.type !== types$1.name) {
          this.unexpected();
        } else {
          node.label = this.parseIdent();
          this.semicolon();
        }
        var i2 = 0;
        for (; i2 < this.labels.length; ++i2) {
          var lab = this.labels[i2];
          if (node.label == null || lab.name === node.label.name) {
            if (lab.kind != null && (isBreak || lab.kind === "loop")) {
              break;
            }
            if (node.label && isBreak) {
              break;
            }
          }
        }
        if (i2 === this.labels.length) {
          this.raise(node.start, "Unsyntactic " + keyword);
        }
        return this.finishNode(node, isBreak ? "BreakStatement" : "ContinueStatement");
      };
      pp$8.parseDebuggerStatement = function(node) {
        this.next();
        this.semicolon();
        return this.finishNode(node, "DebuggerStatement");
      };
      pp$8.parseDoStatement = function(node) {
        this.next();
        this.labels.push(loopLabel);
        node.body = this.parseStatement("do");
        this.labels.pop();
        this.expect(types$1._while);
        node.test = this.parseParenExpression();
        if (this.options.ecmaVersion >= 6) {
          this.eat(types$1.semi);
        } else {
          this.semicolon();
        }
        return this.finishNode(node, "DoWhileStatement");
      };
      pp$8.parseForStatement = function(node) {
        this.next();
        var awaitAt = this.options.ecmaVersion >= 9 && this.canAwait && this.eatContextual("await") ? this.lastTokStart : -1;
        this.labels.push(loopLabel);
        this.enterScope(0);
        this.expect(types$1.parenL);
        if (this.type === types$1.semi) {
          if (awaitAt > -1) {
            this.unexpected(awaitAt);
          }
          return this.parseFor(node, null);
        }
        var isLet = this.isLet();
        if (this.type === types$1._var || this.type === types$1._const || isLet) {
          var init$1 = this.startNode(), kind = isLet ? "let" : this.value;
          this.next();
          this.parseVar(init$1, true, kind);
          this.finishNode(init$1, "VariableDeclaration");
          if ((this.type === types$1._in || this.options.ecmaVersion >= 6 && this.isContextual("of")) && init$1.declarations.length === 1) {
            if (this.options.ecmaVersion >= 9) {
              if (this.type === types$1._in) {
                if (awaitAt > -1) {
                  this.unexpected(awaitAt);
                }
              } else {
                node.await = awaitAt > -1;
              }
            }
            return this.parseForIn(node, init$1);
          }
          if (awaitAt > -1) {
            this.unexpected(awaitAt);
          }
          return this.parseFor(node, init$1);
        }
        var startsWithLet = this.isContextual("let"), isForOf = false;
        var containsEsc = this.containsEsc;
        var refDestructuringErrors = new DestructuringErrors();
        var initPos = this.start;
        var init = awaitAt > -1 ? this.parseExprSubscripts(refDestructuringErrors, "await") : this.parseExpression(true, refDestructuringErrors);
        if (this.type === types$1._in || (isForOf = this.options.ecmaVersion >= 6 && this.isContextual("of"))) {
          if (awaitAt > -1) {
            if (this.type === types$1._in) {
              this.unexpected(awaitAt);
            }
            node.await = true;
          } else if (isForOf && this.options.ecmaVersion >= 8) {
            if (init.start === initPos && !containsEsc && init.type === "Identifier" && init.name === "async") {
              this.unexpected();
            } else if (this.options.ecmaVersion >= 9) {
              node.await = false;
            }
          }
          if (startsWithLet && isForOf) {
            this.raise(init.start, "The left-hand side of a for-of loop may not start with 'let'.");
          }
          this.toAssignable(init, false, refDestructuringErrors);
          this.checkLValPattern(init);
          return this.parseForIn(node, init);
        } else {
          this.checkExpressionErrors(refDestructuringErrors, true);
        }
        if (awaitAt > -1) {
          this.unexpected(awaitAt);
        }
        return this.parseFor(node, init);
      };
      pp$8.parseFunctionStatement = function(node, isAsync, declarationPosition) {
        this.next();
        return this.parseFunction(node, FUNC_STATEMENT | (declarationPosition ? 0 : FUNC_HANGING_STATEMENT), false, isAsync);
      };
      pp$8.parseIfStatement = function(node) {
        this.next();
        node.test = this.parseParenExpression();
        node.consequent = this.parseStatement("if");
        node.alternate = this.eat(types$1._else) ? this.parseStatement("if") : null;
        return this.finishNode(node, "IfStatement");
      };
      pp$8.parseReturnStatement = function(node) {
        if (!this.inFunction && !this.options.allowReturnOutsideFunction) {
          this.raise(this.start, "'return' outside of function");
        }
        this.next();
        if (this.eat(types$1.semi) || this.insertSemicolon()) {
          node.argument = null;
        } else {
          node.argument = this.parseExpression();
          this.semicolon();
        }
        return this.finishNode(node, "ReturnStatement");
      };
      pp$8.parseSwitchStatement = function(node) {
        this.next();
        node.discriminant = this.parseParenExpression();
        node.cases = [];
        this.expect(types$1.braceL);
        this.labels.push(switchLabel);
        this.enterScope(0);
        var cur;
        for (var sawDefault = false; this.type !== types$1.braceR; ) {
          if (this.type === types$1._case || this.type === types$1._default) {
            var isCase = this.type === types$1._case;
            if (cur) {
              this.finishNode(cur, "SwitchCase");
            }
            node.cases.push(cur = this.startNode());
            cur.consequent = [];
            this.next();
            if (isCase) {
              cur.test = this.parseExpression();
            } else {
              if (sawDefault) {
                this.raiseRecoverable(this.lastTokStart, "Multiple default clauses");
              }
              sawDefault = true;
              cur.test = null;
            }
            this.expect(types$1.colon);
          } else {
            if (!cur) {
              this.unexpected();
            }
            cur.consequent.push(this.parseStatement(null));
          }
        }
        this.exitScope();
        if (cur) {
          this.finishNode(cur, "SwitchCase");
        }
        this.next();
        this.labels.pop();
        return this.finishNode(node, "SwitchStatement");
      };
      pp$8.parseThrowStatement = function(node) {
        this.next();
        if (lineBreak.test(this.input.slice(this.lastTokEnd, this.start))) {
          this.raise(this.lastTokEnd, "Illegal newline after throw");
        }
        node.argument = this.parseExpression();
        this.semicolon();
        return this.finishNode(node, "ThrowStatement");
      };
      var empty$1 = [];
      pp$8.parseCatchClauseParam = function() {
        var param = this.parseBindingAtom();
        var simple = param.type === "Identifier";
        this.enterScope(simple ? SCOPE_SIMPLE_CATCH : 0);
        this.checkLValPattern(param, simple ? BIND_SIMPLE_CATCH : BIND_LEXICAL);
        this.expect(types$1.parenR);
        return param;
      };
      pp$8.parseTryStatement = function(node) {
        this.next();
        node.block = this.parseBlock();
        node.handler = null;
        if (this.type === types$1._catch) {
          var clause = this.startNode();
          this.next();
          if (this.eat(types$1.parenL)) {
            clause.param = this.parseCatchClauseParam();
          } else {
            if (this.options.ecmaVersion < 10) {
              this.unexpected();
            }
            clause.param = null;
            this.enterScope(0);
          }
          clause.body = this.parseBlock(false);
          this.exitScope();
          node.handler = this.finishNode(clause, "CatchClause");
        }
        node.finalizer = this.eat(types$1._finally) ? this.parseBlock() : null;
        if (!node.handler && !node.finalizer) {
          this.raise(node.start, "Missing catch or finally clause");
        }
        return this.finishNode(node, "TryStatement");
      };
      pp$8.parseVarStatement = function(node, kind, allowMissingInitializer) {
        this.next();
        this.parseVar(node, false, kind, allowMissingInitializer);
        this.semicolon();
        return this.finishNode(node, "VariableDeclaration");
      };
      pp$8.parseWhileStatement = function(node) {
        this.next();
        node.test = this.parseParenExpression();
        this.labels.push(loopLabel);
        node.body = this.parseStatement("while");
        this.labels.pop();
        return this.finishNode(node, "WhileStatement");
      };
      pp$8.parseWithStatement = function(node) {
        if (this.strict) {
          this.raise(this.start, "'with' in strict mode");
        }
        this.next();
        node.object = this.parseParenExpression();
        node.body = this.parseStatement("with");
        return this.finishNode(node, "WithStatement");
      };
      pp$8.parseEmptyStatement = function(node) {
        this.next();
        return this.finishNode(node, "EmptyStatement");
      };
      pp$8.parseLabeledStatement = function(node, maybeName, expr, context) {
        for (var i$1 = 0, list2 = this.labels; i$1 < list2.length; i$1 += 1) {
          var label = list2[i$1];
          if (label.name === maybeName) {
            this.raise(expr.start, "Label '" + maybeName + "' is already declared");
          }
        }
        var kind = this.type.isLoop ? "loop" : this.type === types$1._switch ? "switch" : null;
        for (var i2 = this.labels.length - 1; i2 >= 0; i2--) {
          var label$1 = this.labels[i2];
          if (label$1.statementStart === node.start) {
            label$1.statementStart = this.start;
            label$1.kind = kind;
          } else {
            break;
          }
        }
        this.labels.push({ name: maybeName, kind, statementStart: this.start });
        node.body = this.parseStatement(context ? context.indexOf("label") === -1 ? context + "label" : context : "label");
        this.labels.pop();
        node.label = expr;
        return this.finishNode(node, "LabeledStatement");
      };
      pp$8.parseExpressionStatement = function(node, expr) {
        node.expression = expr;
        this.semicolon();
        return this.finishNode(node, "ExpressionStatement");
      };
      pp$8.parseBlock = function(createNewLexicalScope, node, exitStrict) {
        if (createNewLexicalScope === void 0) createNewLexicalScope = true;
        if (node === void 0) node = this.startNode();
        node.body = [];
        this.expect(types$1.braceL);
        if (createNewLexicalScope) {
          this.enterScope(0);
        }
        while (this.type !== types$1.braceR) {
          var stmt = this.parseStatement(null);
          node.body.push(stmt);
        }
        if (exitStrict) {
          this.strict = false;
        }
        this.next();
        if (createNewLexicalScope) {
          this.exitScope();
        }
        return this.finishNode(node, "BlockStatement");
      };
      pp$8.parseFor = function(node, init) {
        node.init = init;
        this.expect(types$1.semi);
        node.test = this.type === types$1.semi ? null : this.parseExpression();
        this.expect(types$1.semi);
        node.update = this.type === types$1.parenR ? null : this.parseExpression();
        this.expect(types$1.parenR);
        node.body = this.parseStatement("for");
        this.exitScope();
        this.labels.pop();
        return this.finishNode(node, "ForStatement");
      };
      pp$8.parseForIn = function(node, init) {
        var isForIn = this.type === types$1._in;
        this.next();
        if (init.type === "VariableDeclaration" && init.declarations[0].init != null && (!isForIn || this.options.ecmaVersion < 8 || this.strict || init.kind !== "var" || init.declarations[0].id.type !== "Identifier")) {
          this.raise(
            init.start,
            (isForIn ? "for-in" : "for-of") + " loop variable declaration may not have an initializer"
          );
        }
        node.left = init;
        node.right = isForIn ? this.parseExpression() : this.parseMaybeAssign();
        this.expect(types$1.parenR);
        node.body = this.parseStatement("for");
        this.exitScope();
        this.labels.pop();
        return this.finishNode(node, isForIn ? "ForInStatement" : "ForOfStatement");
      };
      pp$8.parseVar = function(node, isFor, kind, allowMissingInitializer) {
        node.declarations = [];
        node.kind = kind;
        for (; ; ) {
          var decl = this.startNode();
          this.parseVarId(decl, kind);
          if (this.eat(types$1.eq)) {
            decl.init = this.parseMaybeAssign(isFor);
          } else if (!allowMissingInitializer && kind === "const" && !(this.type === types$1._in || this.options.ecmaVersion >= 6 && this.isContextual("of"))) {
            this.unexpected();
          } else if (!allowMissingInitializer && decl.id.type !== "Identifier" && !(isFor && (this.type === types$1._in || this.isContextual("of")))) {
            this.raise(this.lastTokEnd, "Complex binding patterns require an initialization value");
          } else {
            decl.init = null;
          }
          node.declarations.push(this.finishNode(decl, "VariableDeclarator"));
          if (!this.eat(types$1.comma)) {
            break;
          }
        }
        return node;
      };
      pp$8.parseVarId = function(decl, kind) {
        decl.id = this.parseBindingAtom();
        this.checkLValPattern(decl.id, kind === "var" ? BIND_VAR : BIND_LEXICAL, false);
      };
      var FUNC_STATEMENT = 1, FUNC_HANGING_STATEMENT = 2, FUNC_NULLABLE_ID = 4;
      pp$8.parseFunction = function(node, statement, allowExpressionBody, isAsync, forInit) {
        this.initFunction(node);
        if (this.options.ecmaVersion >= 9 || this.options.ecmaVersion >= 6 && !isAsync) {
          if (this.type === types$1.star && statement & FUNC_HANGING_STATEMENT) {
            this.unexpected();
          }
          node.generator = this.eat(types$1.star);
        }
        if (this.options.ecmaVersion >= 8) {
          node.async = !!isAsync;
        }
        if (statement & FUNC_STATEMENT) {
          node.id = statement & FUNC_NULLABLE_ID && this.type !== types$1.name ? null : this.parseIdent();
          if (node.id && !(statement & FUNC_HANGING_STATEMENT)) {
            this.checkLValSimple(node.id, this.strict || node.generator || node.async ? this.treatFunctionsAsVar ? BIND_VAR : BIND_LEXICAL : BIND_FUNCTION);
          }
        }
        var oldYieldPos = this.yieldPos, oldAwaitPos = this.awaitPos, oldAwaitIdentPos = this.awaitIdentPos;
        this.yieldPos = 0;
        this.awaitPos = 0;
        this.awaitIdentPos = 0;
        this.enterScope(functionFlags(node.async, node.generator));
        if (!(statement & FUNC_STATEMENT)) {
          node.id = this.type === types$1.name ? this.parseIdent() : null;
        }
        this.parseFunctionParams(node);
        this.parseFunctionBody(node, allowExpressionBody, false, forInit);
        this.yieldPos = oldYieldPos;
        this.awaitPos = oldAwaitPos;
        this.awaitIdentPos = oldAwaitIdentPos;
        return this.finishNode(node, statement & FUNC_STATEMENT ? "FunctionDeclaration" : "FunctionExpression");
      };
      pp$8.parseFunctionParams = function(node) {
        this.expect(types$1.parenL);
        node.params = this.parseBindingList(types$1.parenR, false, this.options.ecmaVersion >= 8);
        this.checkYieldAwaitInDefaultParams();
      };
      pp$8.parseClass = function(node, isStatement) {
        this.next();
        var oldStrict = this.strict;
        this.strict = true;
        this.parseClassId(node, isStatement);
        this.parseClassSuper(node);
        var privateNameMap = this.enterClassBody();
        var classBody = this.startNode();
        var hadConstructor = false;
        classBody.body = [];
        this.expect(types$1.braceL);
        while (this.type !== types$1.braceR) {
          var element = this.parseClassElement(node.superClass !== null);
          if (element) {
            classBody.body.push(element);
            if (element.type === "MethodDefinition" && element.kind === "constructor") {
              if (hadConstructor) {
                this.raiseRecoverable(element.start, "Duplicate constructor in the same class");
              }
              hadConstructor = true;
            } else if (element.key && element.key.type === "PrivateIdentifier" && isPrivateNameConflicted(privateNameMap, element)) {
              this.raiseRecoverable(element.key.start, "Identifier '#" + element.key.name + "' has already been declared");
            }
          }
        }
        this.strict = oldStrict;
        this.next();
        node.body = this.finishNode(classBody, "ClassBody");
        this.exitClassBody();
        return this.finishNode(node, isStatement ? "ClassDeclaration" : "ClassExpression");
      };
      pp$8.parseClassElement = function(constructorAllowsSuper) {
        if (this.eat(types$1.semi)) {
          return null;
        }
        var ecmaVersion2 = this.options.ecmaVersion;
        var node = this.startNode();
        var keyName = "";
        var isGenerator = false;
        var isAsync = false;
        var kind = "method";
        var isStatic = false;
        if (this.eatContextual("static")) {
          if (ecmaVersion2 >= 13 && this.eat(types$1.braceL)) {
            this.parseClassStaticBlock(node);
            return node;
          }
          if (this.isClassElementNameStart() || this.type === types$1.star) {
            isStatic = true;
          } else {
            keyName = "static";
          }
        }
        node.static = isStatic;
        if (!keyName && ecmaVersion2 >= 8 && this.eatContextual("async")) {
          if ((this.isClassElementNameStart() || this.type === types$1.star) && !this.canInsertSemicolon()) {
            isAsync = true;
          } else {
            keyName = "async";
          }
        }
        if (!keyName && (ecmaVersion2 >= 9 || !isAsync) && this.eat(types$1.star)) {
          isGenerator = true;
        }
        if (!keyName && !isAsync && !isGenerator) {
          var lastValue = this.value;
          if (this.eatContextual("get") || this.eatContextual("set")) {
            if (this.isClassElementNameStart()) {
              kind = lastValue;
            } else {
              keyName = lastValue;
            }
          }
        }
        if (keyName) {
          node.computed = false;
          node.key = this.startNodeAt(this.lastTokStart, this.lastTokStartLoc);
          node.key.name = keyName;
          this.finishNode(node.key, "Identifier");
        } else {
          this.parseClassElementName(node);
        }
        if (ecmaVersion2 < 13 || this.type === types$1.parenL || kind !== "method" || isGenerator || isAsync) {
          var isConstructor = !node.static && checkKeyName(node, "constructor");
          var allowsDirectSuper = isConstructor && constructorAllowsSuper;
          if (isConstructor && kind !== "method") {
            this.raise(node.key.start, "Constructor can't have get/set modifier");
          }
          node.kind = isConstructor ? "constructor" : kind;
          this.parseClassMethod(node, isGenerator, isAsync, allowsDirectSuper);
        } else {
          this.parseClassField(node);
        }
        return node;
      };
      pp$8.isClassElementNameStart = function() {
        return this.type === types$1.name || this.type === types$1.privateId || this.type === types$1.num || this.type === types$1.string || this.type === types$1.bracketL || this.type.keyword;
      };
      pp$8.parseClassElementName = function(element) {
        if (this.type === types$1.privateId) {
          if (this.value === "constructor") {
            this.raise(this.start, "Classes can't have an element named '#constructor'");
          }
          element.computed = false;
          element.key = this.parsePrivateIdent();
        } else {
          this.parsePropertyName(element);
        }
      };
      pp$8.parseClassMethod = function(method, isGenerator, isAsync, allowsDirectSuper) {
        var key = method.key;
        if (method.kind === "constructor") {
          if (isGenerator) {
            this.raise(key.start, "Constructor can't be a generator");
          }
          if (isAsync) {
            this.raise(key.start, "Constructor can't be an async method");
          }
        } else if (method.static && checkKeyName(method, "prototype")) {
          this.raise(key.start, "Classes may not have a static property named prototype");
        }
        var value2 = method.value = this.parseMethod(isGenerator, isAsync, allowsDirectSuper);
        if (method.kind === "get" && value2.params.length !== 0) {
          this.raiseRecoverable(value2.start, "getter should have no params");
        }
        if (method.kind === "set" && value2.params.length !== 1) {
          this.raiseRecoverable(value2.start, "setter should have exactly one param");
        }
        if (method.kind === "set" && value2.params[0].type === "RestElement") {
          this.raiseRecoverable(value2.params[0].start, "Setter cannot use rest params");
        }
        return this.finishNode(method, "MethodDefinition");
      };
      pp$8.parseClassField = function(field) {
        if (checkKeyName(field, "constructor")) {
          this.raise(field.key.start, "Classes can't have a field named 'constructor'");
        } else if (field.static && checkKeyName(field, "prototype")) {
          this.raise(field.key.start, "Classes can't have a static field named 'prototype'");
        }
        if (this.eat(types$1.eq)) {
          var scope = this.currentThisScope();
          var inClassFieldInit = scope.inClassFieldInit;
          scope.inClassFieldInit = true;
          field.value = this.parseMaybeAssign();
          scope.inClassFieldInit = inClassFieldInit;
        } else {
          field.value = null;
        }
        this.semicolon();
        return this.finishNode(field, "PropertyDefinition");
      };
      pp$8.parseClassStaticBlock = function(node) {
        node.body = [];
        var oldLabels = this.labels;
        this.labels = [];
        this.enterScope(SCOPE_CLASS_STATIC_BLOCK | SCOPE_SUPER);
        while (this.type !== types$1.braceR) {
          var stmt = this.parseStatement(null);
          node.body.push(stmt);
        }
        this.next();
        this.exitScope();
        this.labels = oldLabels;
        return this.finishNode(node, "StaticBlock");
      };
      pp$8.parseClassId = function(node, isStatement) {
        if (this.type === types$1.name) {
          node.id = this.parseIdent();
          if (isStatement) {
            this.checkLValSimple(node.id, BIND_LEXICAL, false);
          }
        } else {
          if (isStatement === true) {
            this.unexpected();
          }
          node.id = null;
        }
      };
      pp$8.parseClassSuper = function(node) {
        node.superClass = this.eat(types$1._extends) ? this.parseExprSubscripts(null, false) : null;
      };
      pp$8.enterClassBody = function() {
        var element = { declared: /* @__PURE__ */ Object.create(null), used: [] };
        this.privateNameStack.push(element);
        return element.declared;
      };
      pp$8.exitClassBody = function() {
        var ref2 = this.privateNameStack.pop();
        var declared = ref2.declared;
        var used = ref2.used;
        if (!this.options.checkPrivateFields) {
          return;
        }
        var len = this.privateNameStack.length;
        var parent = len === 0 ? null : this.privateNameStack[len - 1];
        for (var i2 = 0; i2 < used.length; ++i2) {
          var id = used[i2];
          if (!hasOwn(declared, id.name)) {
            if (parent) {
              parent.used.push(id);
            } else {
              this.raiseRecoverable(id.start, "Private field '#" + id.name + "' must be declared in an enclosing class");
            }
          }
        }
      };
      function isPrivateNameConflicted(privateNameMap, element) {
        var name = element.key.name;
        var curr = privateNameMap[name];
        var next = "true";
        if (element.type === "MethodDefinition" && (element.kind === "get" || element.kind === "set")) {
          next = (element.static ? "s" : "i") + element.kind;
        }
        if (curr === "iget" && next === "iset" || curr === "iset" && next === "iget" || curr === "sget" && next === "sset" || curr === "sset" && next === "sget") {
          privateNameMap[name] = "true";
          return false;
        } else if (!curr) {
          privateNameMap[name] = next;
          return false;
        } else {
          return true;
        }
      }
      function checkKeyName(node, name) {
        var computed = node.computed;
        var key = node.key;
        return !computed && (key.type === "Identifier" && key.name === name || key.type === "Literal" && key.value === name);
      }
      pp$8.parseExportAllDeclaration = function(node, exports4) {
        if (this.options.ecmaVersion >= 11) {
          if (this.eatContextual("as")) {
            node.exported = this.parseModuleExportName();
            this.checkExport(exports4, node.exported, this.lastTokStart);
          } else {
            node.exported = null;
          }
        }
        this.expectContextual("from");
        if (this.type !== types$1.string) {
          this.unexpected();
        }
        node.source = this.parseExprAtom();
        if (this.options.ecmaVersion >= 16) {
          node.attributes = this.parseWithClause();
        }
        this.semicolon();
        return this.finishNode(node, "ExportAllDeclaration");
      };
      pp$8.parseExport = function(node, exports4) {
        this.next();
        if (this.eat(types$1.star)) {
          return this.parseExportAllDeclaration(node, exports4);
        }
        if (this.eat(types$1._default)) {
          this.checkExport(exports4, "default", this.lastTokStart);
          node.declaration = this.parseExportDefaultDeclaration();
          return this.finishNode(node, "ExportDefaultDeclaration");
        }
        if (this.shouldParseExportStatement()) {
          node.declaration = this.parseExportDeclaration(node);
          if (node.declaration.type === "VariableDeclaration") {
            this.checkVariableExport(exports4, node.declaration.declarations);
          } else {
            this.checkExport(exports4, node.declaration.id, node.declaration.id.start);
          }
          node.specifiers = [];
          node.source = null;
        } else {
          node.declaration = null;
          node.specifiers = this.parseExportSpecifiers(exports4);
          if (this.eatContextual("from")) {
            if (this.type !== types$1.string) {
              this.unexpected();
            }
            node.source = this.parseExprAtom();
            if (this.options.ecmaVersion >= 16) {
              node.attributes = this.parseWithClause();
            }
          } else {
            for (var i2 = 0, list2 = node.specifiers; i2 < list2.length; i2 += 1) {
              var spec = list2[i2];
              this.checkUnreserved(spec.local);
              this.checkLocalExport(spec.local);
              if (spec.local.type === "Literal") {
                this.raise(spec.local.start, "A string literal cannot be used as an exported binding without `from`.");
              }
            }
            node.source = null;
          }
          this.semicolon();
        }
        return this.finishNode(node, "ExportNamedDeclaration");
      };
      pp$8.parseExportDeclaration = function(node) {
        return this.parseStatement(null);
      };
      pp$8.parseExportDefaultDeclaration = function() {
        var isAsync;
        if (this.type === types$1._function || (isAsync = this.isAsyncFunction())) {
          var fNode = this.startNode();
          this.next();
          if (isAsync) {
            this.next();
          }
          return this.parseFunction(fNode, FUNC_STATEMENT | FUNC_NULLABLE_ID, false, isAsync);
        } else if (this.type === types$1._class) {
          var cNode = this.startNode();
          return this.parseClass(cNode, "nullableID");
        } else {
          var declaration = this.parseMaybeAssign();
          this.semicolon();
          return declaration;
        }
      };
      pp$8.checkExport = function(exports4, name, pos) {
        if (!exports4) {
          return;
        }
        if (typeof name !== "string") {
          name = name.type === "Identifier" ? name.name : name.value;
        }
        if (hasOwn(exports4, name)) {
          this.raiseRecoverable(pos, "Duplicate export '" + name + "'");
        }
        exports4[name] = true;
      };
      pp$8.checkPatternExport = function(exports4, pat) {
        var type = pat.type;
        if (type === "Identifier") {
          this.checkExport(exports4, pat, pat.start);
        } else if (type === "ObjectPattern") {
          for (var i2 = 0, list2 = pat.properties; i2 < list2.length; i2 += 1) {
            var prop = list2[i2];
            this.checkPatternExport(exports4, prop);
          }
        } else if (type === "ArrayPattern") {
          for (var i$1 = 0, list$1 = pat.elements; i$1 < list$1.length; i$1 += 1) {
            var elt = list$1[i$1];
            if (elt) {
              this.checkPatternExport(exports4, elt);
            }
          }
        } else if (type === "Property") {
          this.checkPatternExport(exports4, pat.value);
        } else if (type === "AssignmentPattern") {
          this.checkPatternExport(exports4, pat.left);
        } else if (type === "RestElement") {
          this.checkPatternExport(exports4, pat.argument);
        }
      };
      pp$8.checkVariableExport = function(exports4, decls) {
        if (!exports4) {
          return;
        }
        for (var i2 = 0, list2 = decls; i2 < list2.length; i2 += 1) {
          var decl = list2[i2];
          this.checkPatternExport(exports4, decl.id);
        }
      };
      pp$8.shouldParseExportStatement = function() {
        return this.type.keyword === "var" || this.type.keyword === "const" || this.type.keyword === "class" || this.type.keyword === "function" || this.isLet() || this.isAsyncFunction();
      };
      pp$8.parseExportSpecifier = function(exports4) {
        var node = this.startNode();
        node.local = this.parseModuleExportName();
        node.exported = this.eatContextual("as") ? this.parseModuleExportName() : node.local;
        this.checkExport(
          exports4,
          node.exported,
          node.exported.start
        );
        return this.finishNode(node, "ExportSpecifier");
      };
      pp$8.parseExportSpecifiers = function(exports4) {
        var nodes = [], first = true;
        this.expect(types$1.braceL);
        while (!this.eat(types$1.braceR)) {
          if (!first) {
            this.expect(types$1.comma);
            if (this.afterTrailingComma(types$1.braceR)) {
              break;
            }
          } else {
            first = false;
          }
          nodes.push(this.parseExportSpecifier(exports4));
        }
        return nodes;
      };
      pp$8.parseImport = function(node) {
        this.next();
        if (this.type === types$1.string) {
          node.specifiers = empty$1;
          node.source = this.parseExprAtom();
        } else {
          node.specifiers = this.parseImportSpecifiers();
          this.expectContextual("from");
          node.source = this.type === types$1.string ? this.parseExprAtom() : this.unexpected();
        }
        if (this.options.ecmaVersion >= 16) {
          node.attributes = this.parseWithClause();
        }
        this.semicolon();
        return this.finishNode(node, "ImportDeclaration");
      };
      pp$8.parseImportSpecifier = function() {
        var node = this.startNode();
        node.imported = this.parseModuleExportName();
        if (this.eatContextual("as")) {
          node.local = this.parseIdent();
        } else {
          this.checkUnreserved(node.imported);
          node.local = node.imported;
        }
        this.checkLValSimple(node.local, BIND_LEXICAL);
        return this.finishNode(node, "ImportSpecifier");
      };
      pp$8.parseImportDefaultSpecifier = function() {
        var node = this.startNode();
        node.local = this.parseIdent();
        this.checkLValSimple(node.local, BIND_LEXICAL);
        return this.finishNode(node, "ImportDefaultSpecifier");
      };
      pp$8.parseImportNamespaceSpecifier = function() {
        var node = this.startNode();
        this.next();
        this.expectContextual("as");
        node.local = this.parseIdent();
        this.checkLValSimple(node.local, BIND_LEXICAL);
        return this.finishNode(node, "ImportNamespaceSpecifier");
      };
      pp$8.parseImportSpecifiers = function() {
        var nodes = [], first = true;
        if (this.type === types$1.name) {
          nodes.push(this.parseImportDefaultSpecifier());
          if (!this.eat(types$1.comma)) {
            return nodes;
          }
        }
        if (this.type === types$1.star) {
          nodes.push(this.parseImportNamespaceSpecifier());
          return nodes;
        }
        this.expect(types$1.braceL);
        while (!this.eat(types$1.braceR)) {
          if (!first) {
            this.expect(types$1.comma);
            if (this.afterTrailingComma(types$1.braceR)) {
              break;
            }
          } else {
            first = false;
          }
          nodes.push(this.parseImportSpecifier());
        }
        return nodes;
      };
      pp$8.parseWithClause = function() {
        var nodes = [];
        if (!this.eat(types$1._with)) {
          return nodes;
        }
        this.expect(types$1.braceL);
        var attributeKeys = {};
        var first = true;
        while (!this.eat(types$1.braceR)) {
          if (!first) {
            this.expect(types$1.comma);
            if (this.afterTrailingComma(types$1.braceR)) {
              break;
            }
          } else {
            first = false;
          }
          var attr = this.parseImportAttribute();
          var keyName = attr.key.type === "Identifier" ? attr.key.name : attr.key.value;
          if (hasOwn(attributeKeys, keyName)) {
            this.raiseRecoverable(attr.key.start, "Duplicate attribute key '" + keyName + "'");
          }
          attributeKeys[keyName] = true;
          nodes.push(attr);
        }
        return nodes;
      };
      pp$8.parseImportAttribute = function() {
        var node = this.startNode();
        node.key = this.type === types$1.string ? this.parseExprAtom() : this.parseIdent(this.options.allowReserved !== "never");
        this.expect(types$1.colon);
        if (this.type !== types$1.string) {
          this.unexpected();
        }
        node.value = this.parseExprAtom();
        return this.finishNode(node, "ImportAttribute");
      };
      pp$8.parseModuleExportName = function() {
        if (this.options.ecmaVersion >= 13 && this.type === types$1.string) {
          var stringLiteral = this.parseLiteral(this.value);
          if (loneSurrogate.test(stringLiteral.value)) {
            this.raise(stringLiteral.start, "An export name cannot include a lone surrogate.");
          }
          return stringLiteral;
        }
        return this.parseIdent(true);
      };
      pp$8.adaptDirectivePrologue = function(statements) {
        for (var i2 = 0; i2 < statements.length && this.isDirectiveCandidate(statements[i2]); ++i2) {
          statements[i2].directive = statements[i2].expression.raw.slice(1, -1);
        }
      };
      pp$8.isDirectiveCandidate = function(statement) {
        return this.options.ecmaVersion >= 5 && statement.type === "ExpressionStatement" && statement.expression.type === "Literal" && typeof statement.expression.value === "string" && // Reject parenthesized strings.
        (this.input[statement.start] === '"' || this.input[statement.start] === "'");
      };
      var pp$7 = Parser.prototype;
      pp$7.toAssignable = function(node, isBinding, refDestructuringErrors) {
        if (this.options.ecmaVersion >= 6 && node) {
          switch (node.type) {
            case "Identifier":
              if (this.inAsync && node.name === "await") {
                this.raise(node.start, "Cannot use 'await' as identifier inside an async function");
              }
              break;
            case "ObjectPattern":
            case "ArrayPattern":
            case "AssignmentPattern":
            case "RestElement":
              break;
            case "ObjectExpression":
              node.type = "ObjectPattern";
              if (refDestructuringErrors) {
                this.checkPatternErrors(refDestructuringErrors, true);
              }
              for (var i2 = 0, list2 = node.properties; i2 < list2.length; i2 += 1) {
                var prop = list2[i2];
                this.toAssignable(prop, isBinding);
                if (prop.type === "RestElement" && (prop.argument.type === "ArrayPattern" || prop.argument.type === "ObjectPattern")) {
                  this.raise(prop.argument.start, "Unexpected token");
                }
              }
              break;
            case "Property":
              if (node.kind !== "init") {
                this.raise(node.key.start, "Object pattern can't contain getter or setter");
              }
              this.toAssignable(node.value, isBinding);
              break;
            case "ArrayExpression":
              node.type = "ArrayPattern";
              if (refDestructuringErrors) {
                this.checkPatternErrors(refDestructuringErrors, true);
              }
              this.toAssignableList(node.elements, isBinding);
              break;
            case "SpreadElement":
              node.type = "RestElement";
              this.toAssignable(node.argument, isBinding);
              if (node.argument.type === "AssignmentPattern") {
                this.raise(node.argument.start, "Rest elements cannot have a default value");
              }
              break;
            case "AssignmentExpression":
              if (node.operator !== "=") {
                this.raise(node.left.end, "Only '=' operator can be used for specifying default value.");
              }
              node.type = "AssignmentPattern";
              delete node.operator;
              this.toAssignable(node.left, isBinding);
              break;
            case "ParenthesizedExpression":
              this.toAssignable(node.expression, isBinding, refDestructuringErrors);
              break;
            case "ChainExpression":
              this.raiseRecoverable(node.start, "Optional chaining cannot appear in left-hand side");
              break;
            case "MemberExpression":
              if (!isBinding) {
                break;
              }
            default:
              this.raise(node.start, "Assigning to rvalue");
          }
        } else if (refDestructuringErrors) {
          this.checkPatternErrors(refDestructuringErrors, true);
        }
        return node;
      };
      pp$7.toAssignableList = function(exprList, isBinding) {
        var end = exprList.length;
        for (var i2 = 0; i2 < end; i2++) {
          var elt = exprList[i2];
          if (elt) {
            this.toAssignable(elt, isBinding);
          }
        }
        if (end) {
          var last = exprList[end - 1];
          if (this.options.ecmaVersion === 6 && isBinding && last && last.type === "RestElement" && last.argument.type !== "Identifier") {
            this.unexpected(last.argument.start);
          }
        }
        return exprList;
      };
      pp$7.parseSpread = function(refDestructuringErrors) {
        var node = this.startNode();
        this.next();
        node.argument = this.parseMaybeAssign(false, refDestructuringErrors);
        return this.finishNode(node, "SpreadElement");
      };
      pp$7.parseRestBinding = function() {
        var node = this.startNode();
        this.next();
        if (this.options.ecmaVersion === 6 && this.type !== types$1.name) {
          this.unexpected();
        }
        node.argument = this.parseBindingAtom();
        return this.finishNode(node, "RestElement");
      };
      pp$7.parseBindingAtom = function() {
        if (this.options.ecmaVersion >= 6) {
          switch (this.type) {
            case types$1.bracketL:
              var node = this.startNode();
              this.next();
              node.elements = this.parseBindingList(types$1.bracketR, true, true);
              return this.finishNode(node, "ArrayPattern");
            case types$1.braceL:
              return this.parseObj(true);
          }
        }
        return this.parseIdent();
      };
      pp$7.parseBindingList = function(close, allowEmpty, allowTrailingComma, allowModifiers) {
        var elts = [], first = true;
        while (!this.eat(close)) {
          if (first) {
            first = false;
          } else {
            this.expect(types$1.comma);
          }
          if (allowEmpty && this.type === types$1.comma) {
            elts.push(null);
          } else if (allowTrailingComma && this.afterTrailingComma(close)) {
            break;
          } else if (this.type === types$1.ellipsis) {
            var rest = this.parseRestBinding();
            this.parseBindingListItem(rest);
            elts.push(rest);
            if (this.type === types$1.comma) {
              this.raiseRecoverable(this.start, "Comma is not permitted after the rest element");
            }
            this.expect(close);
            break;
          } else {
            elts.push(this.parseAssignableListItem(allowModifiers));
          }
        }
        return elts;
      };
      pp$7.parseAssignableListItem = function(allowModifiers) {
        var elem = this.parseMaybeDefault(this.start, this.startLoc);
        this.parseBindingListItem(elem);
        return elem;
      };
      pp$7.parseBindingListItem = function(param) {
        return param;
      };
      pp$7.parseMaybeDefault = function(startPos, startLoc, left) {
        left = left || this.parseBindingAtom();
        if (this.options.ecmaVersion < 6 || !this.eat(types$1.eq)) {
          return left;
        }
        var node = this.startNodeAt(startPos, startLoc);
        node.left = left;
        node.right = this.parseMaybeAssign();
        return this.finishNode(node, "AssignmentPattern");
      };
      pp$7.checkLValSimple = function(expr, bindingType, checkClashes) {
        if (bindingType === void 0) bindingType = BIND_NONE;
        var isBind = bindingType !== BIND_NONE;
        switch (expr.type) {
          case "Identifier":
            if (this.strict && this.reservedWordsStrictBind.test(expr.name)) {
              this.raiseRecoverable(expr.start, (isBind ? "Binding " : "Assigning to ") + expr.name + " in strict mode");
            }
            if (isBind) {
              if (bindingType === BIND_LEXICAL && expr.name === "let") {
                this.raiseRecoverable(expr.start, "let is disallowed as a lexically bound name");
              }
              if (checkClashes) {
                if (hasOwn(checkClashes, expr.name)) {
                  this.raiseRecoverable(expr.start, "Argument name clash");
                }
                checkClashes[expr.name] = true;
              }
              if (bindingType !== BIND_OUTSIDE) {
                this.declareName(expr.name, bindingType, expr.start);
              }
            }
            break;
          case "ChainExpression":
            this.raiseRecoverable(expr.start, "Optional chaining cannot appear in left-hand side");
            break;
          case "MemberExpression":
            if (isBind) {
              this.raiseRecoverable(expr.start, "Binding member expression");
            }
            break;
          case "ParenthesizedExpression":
            if (isBind) {
              this.raiseRecoverable(expr.start, "Binding parenthesized expression");
            }
            return this.checkLValSimple(expr.expression, bindingType, checkClashes);
          default:
            this.raise(expr.start, (isBind ? "Binding" : "Assigning to") + " rvalue");
        }
      };
      pp$7.checkLValPattern = function(expr, bindingType, checkClashes) {
        if (bindingType === void 0) bindingType = BIND_NONE;
        switch (expr.type) {
          case "ObjectPattern":
            for (var i2 = 0, list2 = expr.properties; i2 < list2.length; i2 += 1) {
              var prop = list2[i2];
              this.checkLValInnerPattern(prop, bindingType, checkClashes);
            }
            break;
          case "ArrayPattern":
            for (var i$1 = 0, list$1 = expr.elements; i$1 < list$1.length; i$1 += 1) {
              var elem = list$1[i$1];
              if (elem) {
                this.checkLValInnerPattern(elem, bindingType, checkClashes);
              }
            }
            break;
          default:
            this.checkLValSimple(expr, bindingType, checkClashes);
        }
      };
      pp$7.checkLValInnerPattern = function(expr, bindingType, checkClashes) {
        if (bindingType === void 0) bindingType = BIND_NONE;
        switch (expr.type) {
          case "Property":
            this.checkLValInnerPattern(expr.value, bindingType, checkClashes);
            break;
          case "AssignmentPattern":
            this.checkLValPattern(expr.left, bindingType, checkClashes);
            break;
          case "RestElement":
            this.checkLValPattern(expr.argument, bindingType, checkClashes);
            break;
          default:
            this.checkLValPattern(expr, bindingType, checkClashes);
        }
      };
      var TokContext = function TokContext2(token, isExpr, preserveSpace, override, generator) {
        this.token = token;
        this.isExpr = !!isExpr;
        this.preserveSpace = !!preserveSpace;
        this.override = override;
        this.generator = !!generator;
      };
      var types = {
        b_stat: new TokContext("{", false),
        b_expr: new TokContext("{", true),
        b_tmpl: new TokContext("${", false),
        p_stat: new TokContext("(", false),
        p_expr: new TokContext("(", true),
        q_tmpl: new TokContext("`", true, true, function(p) {
          return p.tryReadTemplateToken();
        }),
        f_stat: new TokContext("function", false),
        f_expr: new TokContext("function", true),
        f_expr_gen: new TokContext("function", true, false, null, true),
        f_gen: new TokContext("function", false, false, null, true)
      };
      var pp$6 = Parser.prototype;
      pp$6.initialContext = function() {
        return [types.b_stat];
      };
      pp$6.curContext = function() {
        return this.context[this.context.length - 1];
      };
      pp$6.braceIsBlock = function(prevType) {
        var parent = this.curContext();
        if (parent === types.f_expr || parent === types.f_stat) {
          return true;
        }
        if (prevType === types$1.colon && (parent === types.b_stat || parent === types.b_expr)) {
          return !parent.isExpr;
        }
        if (prevType === types$1._return || prevType === types$1.name && this.exprAllowed) {
          return lineBreak.test(this.input.slice(this.lastTokEnd, this.start));
        }
        if (prevType === types$1._else || prevType === types$1.semi || prevType === types$1.eof || prevType === types$1.parenR || prevType === types$1.arrow) {
          return true;
        }
        if (prevType === types$1.braceL) {
          return parent === types.b_stat;
        }
        if (prevType === types$1._var || prevType === types$1._const || prevType === types$1.name) {
          return false;
        }
        return !this.exprAllowed;
      };
      pp$6.inGeneratorContext = function() {
        for (var i2 = this.context.length - 1; i2 >= 1; i2--) {
          var context = this.context[i2];
          if (context.token === "function") {
            return context.generator;
          }
        }
        return false;
      };
      pp$6.updateContext = function(prevType) {
        var update, type = this.type;
        if (type.keyword && prevType === types$1.dot) {
          this.exprAllowed = false;
        } else if (update = type.updateContext) {
          update.call(this, prevType);
        } else {
          this.exprAllowed = type.beforeExpr;
        }
      };
      pp$6.overrideContext = function(tokenCtx) {
        if (this.curContext() !== tokenCtx) {
          this.context[this.context.length - 1] = tokenCtx;
        }
      };
      types$1.parenR.updateContext = types$1.braceR.updateContext = function() {
        if (this.context.length === 1) {
          this.exprAllowed = true;
          return;
        }
        var out = this.context.pop();
        if (out === types.b_stat && this.curContext().token === "function") {
          out = this.context.pop();
        }
        this.exprAllowed = !out.isExpr;
      };
      types$1.braceL.updateContext = function(prevType) {
        this.context.push(this.braceIsBlock(prevType) ? types.b_stat : types.b_expr);
        this.exprAllowed = true;
      };
      types$1.dollarBraceL.updateContext = function() {
        this.context.push(types.b_tmpl);
        this.exprAllowed = true;
      };
      types$1.parenL.updateContext = function(prevType) {
        var statementParens = prevType === types$1._if || prevType === types$1._for || prevType === types$1._with || prevType === types$1._while;
        this.context.push(statementParens ? types.p_stat : types.p_expr);
        this.exprAllowed = true;
      };
      types$1.incDec.updateContext = function() {
      };
      types$1._function.updateContext = types$1._class.updateContext = function(prevType) {
        if (prevType.beforeExpr && prevType !== types$1._else && !(prevType === types$1.semi && this.curContext() !== types.p_stat) && !(prevType === types$1._return && lineBreak.test(this.input.slice(this.lastTokEnd, this.start))) && !((prevType === types$1.colon || prevType === types$1.braceL) && this.curContext() === types.b_stat)) {
          this.context.push(types.f_expr);
        } else {
          this.context.push(types.f_stat);
        }
        this.exprAllowed = false;
      };
      types$1.colon.updateContext = function() {
        if (this.curContext().token === "function") {
          this.context.pop();
        }
        this.exprAllowed = true;
      };
      types$1.backQuote.updateContext = function() {
        if (this.curContext() === types.q_tmpl) {
          this.context.pop();
        } else {
          this.context.push(types.q_tmpl);
        }
        this.exprAllowed = false;
      };
      types$1.star.updateContext = function(prevType) {
        if (prevType === types$1._function) {
          var index = this.context.length - 1;
          if (this.context[index] === types.f_expr) {
            this.context[index] = types.f_expr_gen;
          } else {
            this.context[index] = types.f_gen;
          }
        }
        this.exprAllowed = true;
      };
      types$1.name.updateContext = function(prevType) {
        var allowed = false;
        if (this.options.ecmaVersion >= 6 && prevType !== types$1.dot) {
          if (this.value === "of" && !this.exprAllowed || this.value === "yield" && this.inGeneratorContext()) {
            allowed = true;
          }
        }
        this.exprAllowed = allowed;
      };
      var pp$5 = Parser.prototype;
      pp$5.checkPropClash = function(prop, propHash, refDestructuringErrors) {
        if (this.options.ecmaVersion >= 9 && prop.type === "SpreadElement") {
          return;
        }
        if (this.options.ecmaVersion >= 6 && (prop.computed || prop.method || prop.shorthand)) {
          return;
        }
        var key = prop.key;
        var name;
        switch (key.type) {
          case "Identifier":
            name = key.name;
            break;
          case "Literal":
            name = String(key.value);
            break;
          default:
            return;
        }
        var kind = prop.kind;
        if (this.options.ecmaVersion >= 6) {
          if (name === "__proto__" && kind === "init") {
            if (propHash.proto) {
              if (refDestructuringErrors) {
                if (refDestructuringErrors.doubleProto < 0) {
                  refDestructuringErrors.doubleProto = key.start;
                }
              } else {
                this.raiseRecoverable(key.start, "Redefinition of __proto__ property");
              }
            }
            propHash.proto = true;
          }
          return;
        }
        name = "$" + name;
        var other = propHash[name];
        if (other) {
          var redefinition;
          if (kind === "init") {
            redefinition = this.strict && other.init || other.get || other.set;
          } else {
            redefinition = other.init || other[kind];
          }
          if (redefinition) {
            this.raiseRecoverable(key.start, "Redefinition of property");
          }
        } else {
          other = propHash[name] = {
            init: false,
            get: false,
            set: false
          };
        }
        other[kind] = true;
      };
      pp$5.parseExpression = function(forInit, refDestructuringErrors) {
        var startPos = this.start, startLoc = this.startLoc;
        var expr = this.parseMaybeAssign(forInit, refDestructuringErrors);
        if (this.type === types$1.comma) {
          var node = this.startNodeAt(startPos, startLoc);
          node.expressions = [expr];
          while (this.eat(types$1.comma)) {
            node.expressions.push(this.parseMaybeAssign(forInit, refDestructuringErrors));
          }
          return this.finishNode(node, "SequenceExpression");
        }
        return expr;
      };
      pp$5.parseMaybeAssign = function(forInit, refDestructuringErrors, afterLeftParse) {
        if (this.isContextual("yield")) {
          if (this.inGenerator) {
            return this.parseYield(forInit);
          } else {
            this.exprAllowed = false;
          }
        }
        var ownDestructuringErrors = false, oldParenAssign = -1, oldTrailingComma = -1, oldDoubleProto = -1;
        if (refDestructuringErrors) {
          oldParenAssign = refDestructuringErrors.parenthesizedAssign;
          oldTrailingComma = refDestructuringErrors.trailingComma;
          oldDoubleProto = refDestructuringErrors.doubleProto;
          refDestructuringErrors.parenthesizedAssign = refDestructuringErrors.trailingComma = -1;
        } else {
          refDestructuringErrors = new DestructuringErrors();
          ownDestructuringErrors = true;
        }
        var startPos = this.start, startLoc = this.startLoc;
        if (this.type === types$1.parenL || this.type === types$1.name) {
          this.potentialArrowAt = this.start;
          this.potentialArrowInForAwait = forInit === "await";
        }
        var left = this.parseMaybeConditional(forInit, refDestructuringErrors);
        if (afterLeftParse) {
          left = afterLeftParse.call(this, left, startPos, startLoc);
        }
        if (this.type.isAssign) {
          var node = this.startNodeAt(startPos, startLoc);
          node.operator = this.value;
          if (this.type === types$1.eq) {
            left = this.toAssignable(left, false, refDestructuringErrors);
          }
          if (!ownDestructuringErrors) {
            refDestructuringErrors.parenthesizedAssign = refDestructuringErrors.trailingComma = refDestructuringErrors.doubleProto = -1;
          }
          if (refDestructuringErrors.shorthandAssign >= left.start) {
            refDestructuringErrors.shorthandAssign = -1;
          }
          if (this.type === types$1.eq) {
            this.checkLValPattern(left);
          } else {
            this.checkLValSimple(left);
          }
          node.left = left;
          this.next();
          node.right = this.parseMaybeAssign(forInit);
          if (oldDoubleProto > -1) {
            refDestructuringErrors.doubleProto = oldDoubleProto;
          }
          return this.finishNode(node, "AssignmentExpression");
        } else {
          if (ownDestructuringErrors) {
            this.checkExpressionErrors(refDestructuringErrors, true);
          }
        }
        if (oldParenAssign > -1) {
          refDestructuringErrors.parenthesizedAssign = oldParenAssign;
        }
        if (oldTrailingComma > -1) {
          refDestructuringErrors.trailingComma = oldTrailingComma;
        }
        return left;
      };
      pp$5.parseMaybeConditional = function(forInit, refDestructuringErrors) {
        var startPos = this.start, startLoc = this.startLoc;
        var expr = this.parseExprOps(forInit, refDestructuringErrors);
        if (this.checkExpressionErrors(refDestructuringErrors)) {
          return expr;
        }
        if (this.eat(types$1.question)) {
          var node = this.startNodeAt(startPos, startLoc);
          node.test = expr;
          node.consequent = this.parseMaybeAssign();
          this.expect(types$1.colon);
          node.alternate = this.parseMaybeAssign(forInit);
          return this.finishNode(node, "ConditionalExpression");
        }
        return expr;
      };
      pp$5.parseExprOps = function(forInit, refDestructuringErrors) {
        var startPos = this.start, startLoc = this.startLoc;
        var expr = this.parseMaybeUnary(refDestructuringErrors, false, false, forInit);
        if (this.checkExpressionErrors(refDestructuringErrors)) {
          return expr;
        }
        return expr.start === startPos && expr.type === "ArrowFunctionExpression" ? expr : this.parseExprOp(expr, startPos, startLoc, -1, forInit);
      };
      pp$5.parseExprOp = function(left, leftStartPos, leftStartLoc, minPrec, forInit) {
        var prec = this.type.binop;
        if (prec != null && (!forInit || this.type !== types$1._in)) {
          if (prec > minPrec) {
            var logical = this.type === types$1.logicalOR || this.type === types$1.logicalAND;
            var coalesce = this.type === types$1.coalesce;
            if (coalesce) {
              prec = types$1.logicalAND.binop;
            }
            var op = this.value;
            this.next();
            var startPos = this.start, startLoc = this.startLoc;
            var right = this.parseExprOp(this.parseMaybeUnary(null, false, false, forInit), startPos, startLoc, prec, forInit);
            var node = this.buildBinary(leftStartPos, leftStartLoc, left, right, op, logical || coalesce);
            if (logical && this.type === types$1.coalesce || coalesce && (this.type === types$1.logicalOR || this.type === types$1.logicalAND)) {
              this.raiseRecoverable(this.start, "Logical expressions and coalesce expressions cannot be mixed. Wrap either by parentheses");
            }
            return this.parseExprOp(node, leftStartPos, leftStartLoc, minPrec, forInit);
          }
        }
        return left;
      };
      pp$5.buildBinary = function(startPos, startLoc, left, right, op, logical) {
        if (right.type === "PrivateIdentifier") {
          this.raise(right.start, "Private identifier can only be left side of binary expression");
        }
        var node = this.startNodeAt(startPos, startLoc);
        node.left = left;
        node.operator = op;
        node.right = right;
        return this.finishNode(node, logical ? "LogicalExpression" : "BinaryExpression");
      };
      pp$5.parseMaybeUnary = function(refDestructuringErrors, sawUnary, incDec, forInit) {
        var startPos = this.start, startLoc = this.startLoc, expr;
        if (this.isContextual("await") && this.canAwait) {
          expr = this.parseAwait(forInit);
          sawUnary = true;
        } else if (this.type.prefix) {
          var node = this.startNode(), update = this.type === types$1.incDec;
          node.operator = this.value;
          node.prefix = true;
          this.next();
          node.argument = this.parseMaybeUnary(null, true, update, forInit);
          this.checkExpressionErrors(refDestructuringErrors, true);
          if (update) {
            this.checkLValSimple(node.argument);
          } else if (this.strict && node.operator === "delete" && isLocalVariableAccess(node.argument)) {
            this.raiseRecoverable(node.start, "Deleting local variable in strict mode");
          } else if (node.operator === "delete" && isPrivateFieldAccess(node.argument)) {
            this.raiseRecoverable(node.start, "Private fields can not be deleted");
          } else {
            sawUnary = true;
          }
          expr = this.finishNode(node, update ? "UpdateExpression" : "UnaryExpression");
        } else if (!sawUnary && this.type === types$1.privateId) {
          if ((forInit || this.privateNameStack.length === 0) && this.options.checkPrivateFields) {
            this.unexpected();
          }
          expr = this.parsePrivateIdent();
          if (this.type !== types$1._in) {
            this.unexpected();
          }
        } else {
          expr = this.parseExprSubscripts(refDestructuringErrors, forInit);
          if (this.checkExpressionErrors(refDestructuringErrors)) {
            return expr;
          }
          while (this.type.postfix && !this.canInsertSemicolon()) {
            var node$1 = this.startNodeAt(startPos, startLoc);
            node$1.operator = this.value;
            node$1.prefix = false;
            node$1.argument = expr;
            this.checkLValSimple(expr);
            this.next();
            expr = this.finishNode(node$1, "UpdateExpression");
          }
        }
        if (!incDec && this.eat(types$1.starstar)) {
          if (sawUnary) {
            this.unexpected(this.lastTokStart);
          } else {
            return this.buildBinary(startPos, startLoc, expr, this.parseMaybeUnary(null, false, false, forInit), "**", false);
          }
        } else {
          return expr;
        }
      };
      function isLocalVariableAccess(node) {
        return node.type === "Identifier" || node.type === "ParenthesizedExpression" && isLocalVariableAccess(node.expression);
      }
      function isPrivateFieldAccess(node) {
        return node.type === "MemberExpression" && node.property.type === "PrivateIdentifier" || node.type === "ChainExpression" && isPrivateFieldAccess(node.expression) || node.type === "ParenthesizedExpression" && isPrivateFieldAccess(node.expression);
      }
      pp$5.parseExprSubscripts = function(refDestructuringErrors, forInit) {
        var startPos = this.start, startLoc = this.startLoc;
        var expr = this.parseExprAtom(refDestructuringErrors, forInit);
        if (expr.type === "ArrowFunctionExpression" && this.input.slice(this.lastTokStart, this.lastTokEnd) !== ")") {
          return expr;
        }
        var result = this.parseSubscripts(expr, startPos, startLoc, false, forInit);
        if (refDestructuringErrors && result.type === "MemberExpression") {
          if (refDestructuringErrors.parenthesizedAssign >= result.start) {
            refDestructuringErrors.parenthesizedAssign = -1;
          }
          if (refDestructuringErrors.parenthesizedBind >= result.start) {
            refDestructuringErrors.parenthesizedBind = -1;
          }
          if (refDestructuringErrors.trailingComma >= result.start) {
            refDestructuringErrors.trailingComma = -1;
          }
        }
        return result;
      };
      pp$5.parseSubscripts = function(base, startPos, startLoc, noCalls, forInit) {
        var maybeAsyncArrow = this.options.ecmaVersion >= 8 && base.type === "Identifier" && base.name === "async" && this.lastTokEnd === base.end && !this.canInsertSemicolon() && base.end - base.start === 5 && this.potentialArrowAt === base.start;
        var optionalChained = false;
        while (true) {
          var element = this.parseSubscript(base, startPos, startLoc, noCalls, maybeAsyncArrow, optionalChained, forInit);
          if (element.optional) {
            optionalChained = true;
          }
          if (element === base || element.type === "ArrowFunctionExpression") {
            if (optionalChained) {
              var chainNode = this.startNodeAt(startPos, startLoc);
              chainNode.expression = element;
              element = this.finishNode(chainNode, "ChainExpression");
            }
            return element;
          }
          base = element;
        }
      };
      pp$5.shouldParseAsyncArrow = function() {
        return !this.canInsertSemicolon() && this.eat(types$1.arrow);
      };
      pp$5.parseSubscriptAsyncArrow = function(startPos, startLoc, exprList, forInit) {
        return this.parseArrowExpression(this.startNodeAt(startPos, startLoc), exprList, true, forInit);
      };
      pp$5.parseSubscript = function(base, startPos, startLoc, noCalls, maybeAsyncArrow, optionalChained, forInit) {
        var optionalSupported = this.options.ecmaVersion >= 11;
        var optional = optionalSupported && this.eat(types$1.questionDot);
        if (noCalls && optional) {
          this.raise(this.lastTokStart, "Optional chaining cannot appear in the callee of new expressions");
        }
        var computed = this.eat(types$1.bracketL);
        if (computed || optional && this.type !== types$1.parenL && this.type !== types$1.backQuote || this.eat(types$1.dot)) {
          var node = this.startNodeAt(startPos, startLoc);
          node.object = base;
          if (computed) {
            node.property = this.parseExpression();
            this.expect(types$1.bracketR);
          } else if (this.type === types$1.privateId && base.type !== "Super") {
            node.property = this.parsePrivateIdent();
          } else {
            node.property = this.parseIdent(this.options.allowReserved !== "never");
          }
          node.computed = !!computed;
          if (optionalSupported) {
            node.optional = optional;
          }
          base = this.finishNode(node, "MemberExpression");
        } else if (!noCalls && this.eat(types$1.parenL)) {
          var refDestructuringErrors = new DestructuringErrors(), oldYieldPos = this.yieldPos, oldAwaitPos = this.awaitPos, oldAwaitIdentPos = this.awaitIdentPos;
          this.yieldPos = 0;
          this.awaitPos = 0;
          this.awaitIdentPos = 0;
          var exprList = this.parseExprList(types$1.parenR, this.options.ecmaVersion >= 8, false, refDestructuringErrors);
          if (maybeAsyncArrow && !optional && this.shouldParseAsyncArrow()) {
            this.checkPatternErrors(refDestructuringErrors, false);
            this.checkYieldAwaitInDefaultParams();
            if (this.awaitIdentPos > 0) {
              this.raise(this.awaitIdentPos, "Cannot use 'await' as identifier inside an async function");
            }
            this.yieldPos = oldYieldPos;
            this.awaitPos = oldAwaitPos;
            this.awaitIdentPos = oldAwaitIdentPos;
            return this.parseSubscriptAsyncArrow(startPos, startLoc, exprList, forInit);
          }
          this.checkExpressionErrors(refDestructuringErrors, true);
          this.yieldPos = oldYieldPos || this.yieldPos;
          this.awaitPos = oldAwaitPos || this.awaitPos;
          this.awaitIdentPos = oldAwaitIdentPos || this.awaitIdentPos;
          var node$1 = this.startNodeAt(startPos, startLoc);
          node$1.callee = base;
          node$1.arguments = exprList;
          if (optionalSupported) {
            node$1.optional = optional;
          }
          base = this.finishNode(node$1, "CallExpression");
        } else if (this.type === types$1.backQuote) {
          if (optional || optionalChained) {
            this.raise(this.start, "Optional chaining cannot appear in the tag of tagged template expressions");
          }
          var node$2 = this.startNodeAt(startPos, startLoc);
          node$2.tag = base;
          node$2.quasi = this.parseTemplate({ isTagged: true });
          base = this.finishNode(node$2, "TaggedTemplateExpression");
        }
        return base;
      };
      pp$5.parseExprAtom = function(refDestructuringErrors, forInit, forNew) {
        if (this.type === types$1.slash) {
          this.readRegexp();
        }
        var node, canBeArrow = this.potentialArrowAt === this.start;
        switch (this.type) {
          case types$1._super:
            if (!this.allowSuper) {
              this.raise(this.start, "'super' keyword outside a method");
            }
            node = this.startNode();
            this.next();
            if (this.type === types$1.parenL && !this.allowDirectSuper) {
              this.raise(node.start, "super() call outside constructor of a subclass");
            }
            if (this.type !== types$1.dot && this.type !== types$1.bracketL && this.type !== types$1.parenL) {
              this.unexpected();
            }
            return this.finishNode(node, "Super");
          case types$1._this:
            node = this.startNode();
            this.next();
            return this.finishNode(node, "ThisExpression");
          case types$1.name:
            var startPos = this.start, startLoc = this.startLoc, containsEsc = this.containsEsc;
            var id = this.parseIdent(false);
            if (this.options.ecmaVersion >= 8 && !containsEsc && id.name === "async" && !this.canInsertSemicolon() && this.eat(types$1._function)) {
              this.overrideContext(types.f_expr);
              return this.parseFunction(this.startNodeAt(startPos, startLoc), 0, false, true, forInit);
            }
            if (canBeArrow && !this.canInsertSemicolon()) {
              if (this.eat(types$1.arrow)) {
                return this.parseArrowExpression(this.startNodeAt(startPos, startLoc), [id], false, forInit);
              }
              if (this.options.ecmaVersion >= 8 && id.name === "async" && this.type === types$1.name && !containsEsc && (!this.potentialArrowInForAwait || this.value !== "of" || this.containsEsc)) {
                id = this.parseIdent(false);
                if (this.canInsertSemicolon() || !this.eat(types$1.arrow)) {
                  this.unexpected();
                }
                return this.parseArrowExpression(this.startNodeAt(startPos, startLoc), [id], true, forInit);
              }
            }
            return id;
          case types$1.regexp:
            var value2 = this.value;
            node = this.parseLiteral(value2.value);
            node.regex = { pattern: value2.pattern, flags: value2.flags };
            return node;
          case types$1.num:
          case types$1.string:
            return this.parseLiteral(this.value);
          case types$1._null:
          case types$1._true:
          case types$1._false:
            node = this.startNode();
            node.value = this.type === types$1._null ? null : this.type === types$1._true;
            node.raw = this.type.keyword;
            this.next();
            return this.finishNode(node, "Literal");
          case types$1.parenL:
            var start = this.start, expr = this.parseParenAndDistinguishExpression(canBeArrow, forInit);
            if (refDestructuringErrors) {
              if (refDestructuringErrors.parenthesizedAssign < 0 && !this.isSimpleAssignTarget(expr)) {
                refDestructuringErrors.parenthesizedAssign = start;
              }
              if (refDestructuringErrors.parenthesizedBind < 0) {
                refDestructuringErrors.parenthesizedBind = start;
              }
            }
            return expr;
          case types$1.bracketL:
            node = this.startNode();
            this.next();
            node.elements = this.parseExprList(types$1.bracketR, true, true, refDestructuringErrors);
            return this.finishNode(node, "ArrayExpression");
          case types$1.braceL:
            this.overrideContext(types.b_expr);
            return this.parseObj(false, refDestructuringErrors);
          case types$1._function:
            node = this.startNode();
            this.next();
            return this.parseFunction(node, 0);
          case types$1._class:
            return this.parseClass(this.startNode(), false);
          case types$1._new:
            return this.parseNew();
          case types$1.backQuote:
            return this.parseTemplate();
          case types$1._import:
            if (this.options.ecmaVersion >= 11) {
              return this.parseExprImport(forNew);
            } else {
              return this.unexpected();
            }
          default:
            return this.parseExprAtomDefault();
        }
      };
      pp$5.parseExprAtomDefault = function() {
        this.unexpected();
      };
      pp$5.parseExprImport = function(forNew) {
        var node = this.startNode();
        if (this.containsEsc) {
          this.raiseRecoverable(this.start, "Escape sequence in keyword import");
        }
        this.next();
        if (this.type === types$1.parenL && !forNew) {
          return this.parseDynamicImport(node);
        } else if (this.type === types$1.dot) {
          var meta = this.startNodeAt(node.start, node.loc && node.loc.start);
          meta.name = "import";
          node.meta = this.finishNode(meta, "Identifier");
          return this.parseImportMeta(node);
        } else {
          this.unexpected();
        }
      };
      pp$5.parseDynamicImport = function(node) {
        this.next();
        node.source = this.parseMaybeAssign();
        if (this.options.ecmaVersion >= 16) {
          if (!this.eat(types$1.parenR)) {
            this.expect(types$1.comma);
            if (!this.afterTrailingComma(types$1.parenR)) {
              node.options = this.parseMaybeAssign();
              if (!this.eat(types$1.parenR)) {
                this.expect(types$1.comma);
                if (!this.afterTrailingComma(types$1.parenR)) {
                  this.unexpected();
                }
              }
            } else {
              node.options = null;
            }
          } else {
            node.options = null;
          }
        } else {
          if (!this.eat(types$1.parenR)) {
            var errorPos = this.start;
            if (this.eat(types$1.comma) && this.eat(types$1.parenR)) {
              this.raiseRecoverable(errorPos, "Trailing comma is not allowed in import()");
            } else {
              this.unexpected(errorPos);
            }
          }
        }
        return this.finishNode(node, "ImportExpression");
      };
      pp$5.parseImportMeta = function(node) {
        this.next();
        var containsEsc = this.containsEsc;
        node.property = this.parseIdent(true);
        if (node.property.name !== "meta") {
          this.raiseRecoverable(node.property.start, "The only valid meta property for import is 'import.meta'");
        }
        if (containsEsc) {
          this.raiseRecoverable(node.start, "'import.meta' must not contain escaped characters");
        }
        if (this.options.sourceType !== "module" && !this.options.allowImportExportEverywhere) {
          this.raiseRecoverable(node.start, "Cannot use 'import.meta' outside a module");
        }
        return this.finishNode(node, "MetaProperty");
      };
      pp$5.parseLiteral = function(value2) {
        var node = this.startNode();
        node.value = value2;
        node.raw = this.input.slice(this.start, this.end);
        if (node.raw.charCodeAt(node.raw.length - 1) === 110) {
          node.bigint = node.raw.slice(0, -1).replace(/_/g, "");
        }
        this.next();
        return this.finishNode(node, "Literal");
      };
      pp$5.parseParenExpression = function() {
        this.expect(types$1.parenL);
        var val = this.parseExpression();
        this.expect(types$1.parenR);
        return val;
      };
      pp$5.shouldParseArrow = function(exprList) {
        return !this.canInsertSemicolon();
      };
      pp$5.parseParenAndDistinguishExpression = function(canBeArrow, forInit) {
        var startPos = this.start, startLoc = this.startLoc, val, allowTrailingComma = this.options.ecmaVersion >= 8;
        if (this.options.ecmaVersion >= 6) {
          this.next();
          var innerStartPos = this.start, innerStartLoc = this.startLoc;
          var exprList = [], first = true, lastIsComma = false;
          var refDestructuringErrors = new DestructuringErrors(), oldYieldPos = this.yieldPos, oldAwaitPos = this.awaitPos, spreadStart;
          this.yieldPos = 0;
          this.awaitPos = 0;
          while (this.type !== types$1.parenR) {
            first ? first = false : this.expect(types$1.comma);
            if (allowTrailingComma && this.afterTrailingComma(types$1.parenR, true)) {
              lastIsComma = true;
              break;
            } else if (this.type === types$1.ellipsis) {
              spreadStart = this.start;
              exprList.push(this.parseParenItem(this.parseRestBinding()));
              if (this.type === types$1.comma) {
                this.raiseRecoverable(
                  this.start,
                  "Comma is not permitted after the rest element"
                );
              }
              break;
            } else {
              exprList.push(this.parseMaybeAssign(false, refDestructuringErrors, this.parseParenItem));
            }
          }
          var innerEndPos = this.lastTokEnd, innerEndLoc = this.lastTokEndLoc;
          this.expect(types$1.parenR);
          if (canBeArrow && this.shouldParseArrow(exprList) && this.eat(types$1.arrow)) {
            this.checkPatternErrors(refDestructuringErrors, false);
            this.checkYieldAwaitInDefaultParams();
            this.yieldPos = oldYieldPos;
            this.awaitPos = oldAwaitPos;
            return this.parseParenArrowList(startPos, startLoc, exprList, forInit);
          }
          if (!exprList.length || lastIsComma) {
            this.unexpected(this.lastTokStart);
          }
          if (spreadStart) {
            this.unexpected(spreadStart);
          }
          this.checkExpressionErrors(refDestructuringErrors, true);
          this.yieldPos = oldYieldPos || this.yieldPos;
          this.awaitPos = oldAwaitPos || this.awaitPos;
          if (exprList.length > 1) {
            val = this.startNodeAt(innerStartPos, innerStartLoc);
            val.expressions = exprList;
            this.finishNodeAt(val, "SequenceExpression", innerEndPos, innerEndLoc);
          } else {
            val = exprList[0];
          }
        } else {
          val = this.parseParenExpression();
        }
        if (this.options.preserveParens) {
          var par = this.startNodeAt(startPos, startLoc);
          par.expression = val;
          return this.finishNode(par, "ParenthesizedExpression");
        } else {
          return val;
        }
      };
      pp$5.parseParenItem = function(item) {
        return item;
      };
      pp$5.parseParenArrowList = function(startPos, startLoc, exprList, forInit) {
        return this.parseArrowExpression(this.startNodeAt(startPos, startLoc), exprList, false, forInit);
      };
      var empty = [];
      pp$5.parseNew = function() {
        if (this.containsEsc) {
          this.raiseRecoverable(this.start, "Escape sequence in keyword new");
        }
        var node = this.startNode();
        this.next();
        if (this.options.ecmaVersion >= 6 && this.type === types$1.dot) {
          var meta = this.startNodeAt(node.start, node.loc && node.loc.start);
          meta.name = "new";
          node.meta = this.finishNode(meta, "Identifier");
          this.next();
          var containsEsc = this.containsEsc;
          node.property = this.parseIdent(true);
          if (node.property.name !== "target") {
            this.raiseRecoverable(node.property.start, "The only valid meta property for new is 'new.target'");
          }
          if (containsEsc) {
            this.raiseRecoverable(node.start, "'new.target' must not contain escaped characters");
          }
          if (!this.allowNewDotTarget) {
            this.raiseRecoverable(node.start, "'new.target' can only be used in functions and class static block");
          }
          return this.finishNode(node, "MetaProperty");
        }
        var startPos = this.start, startLoc = this.startLoc;
        node.callee = this.parseSubscripts(this.parseExprAtom(null, false, true), startPos, startLoc, true, false);
        if (this.eat(types$1.parenL)) {
          node.arguments = this.parseExprList(types$1.parenR, this.options.ecmaVersion >= 8, false);
        } else {
          node.arguments = empty;
        }
        return this.finishNode(node, "NewExpression");
      };
      pp$5.parseTemplateElement = function(ref2) {
        var isTagged = ref2.isTagged;
        var elem = this.startNode();
        if (this.type === types$1.invalidTemplate) {
          if (!isTagged) {
            this.raiseRecoverable(this.start, "Bad escape sequence in untagged template literal");
          }
          elem.value = {
            raw: this.value.replace(/\r\n?/g, "\n"),
            cooked: null
          };
        } else {
          elem.value = {
            raw: this.input.slice(this.start, this.end).replace(/\r\n?/g, "\n"),
            cooked: this.value
          };
        }
        this.next();
        elem.tail = this.type === types$1.backQuote;
        return this.finishNode(elem, "TemplateElement");
      };
      pp$5.parseTemplate = function(ref2) {
        if (ref2 === void 0) ref2 = {};
        var isTagged = ref2.isTagged;
        if (isTagged === void 0) isTagged = false;
        var node = this.startNode();
        this.next();
        node.expressions = [];
        var curElt = this.parseTemplateElement({ isTagged });
        node.quasis = [curElt];
        while (!curElt.tail) {
          if (this.type === types$1.eof) {
            this.raise(this.pos, "Unterminated template literal");
          }
          this.expect(types$1.dollarBraceL);
          node.expressions.push(this.parseExpression());
          this.expect(types$1.braceR);
          node.quasis.push(curElt = this.parseTemplateElement({ isTagged }));
        }
        this.next();
        return this.finishNode(node, "TemplateLiteral");
      };
      pp$5.isAsyncProp = function(prop) {
        return !prop.computed && prop.key.type === "Identifier" && prop.key.name === "async" && (this.type === types$1.name || this.type === types$1.num || this.type === types$1.string || this.type === types$1.bracketL || this.type.keyword || this.options.ecmaVersion >= 9 && this.type === types$1.star) && !lineBreak.test(this.input.slice(this.lastTokEnd, this.start));
      };
      pp$5.parseObj = function(isPattern, refDestructuringErrors) {
        var node = this.startNode(), first = true, propHash = {};
        node.properties = [];
        this.next();
        while (!this.eat(types$1.braceR)) {
          if (!first) {
            this.expect(types$1.comma);
            if (this.options.ecmaVersion >= 5 && this.afterTrailingComma(types$1.braceR)) {
              break;
            }
          } else {
            first = false;
          }
          var prop = this.parseProperty(isPattern, refDestructuringErrors);
          if (!isPattern) {
            this.checkPropClash(prop, propHash, refDestructuringErrors);
          }
          node.properties.push(prop);
        }
        return this.finishNode(node, isPattern ? "ObjectPattern" : "ObjectExpression");
      };
      pp$5.parseProperty = function(isPattern, refDestructuringErrors) {
        var prop = this.startNode(), isGenerator, isAsync, startPos, startLoc;
        if (this.options.ecmaVersion >= 9 && this.eat(types$1.ellipsis)) {
          if (isPattern) {
            prop.argument = this.parseIdent(false);
            if (this.type === types$1.comma) {
              this.raiseRecoverable(this.start, "Comma is not permitted after the rest element");
            }
            return this.finishNode(prop, "RestElement");
          }
          prop.argument = this.parseMaybeAssign(false, refDestructuringErrors);
          if (this.type === types$1.comma && refDestructuringErrors && refDestructuringErrors.trailingComma < 0) {
            refDestructuringErrors.trailingComma = this.start;
          }
          return this.finishNode(prop, "SpreadElement");
        }
        if (this.options.ecmaVersion >= 6) {
          prop.method = false;
          prop.shorthand = false;
          if (isPattern || refDestructuringErrors) {
            startPos = this.start;
            startLoc = this.startLoc;
          }
          if (!isPattern) {
            isGenerator = this.eat(types$1.star);
          }
        }
        var containsEsc = this.containsEsc;
        this.parsePropertyName(prop);
        if (!isPattern && !containsEsc && this.options.ecmaVersion >= 8 && !isGenerator && this.isAsyncProp(prop)) {
          isAsync = true;
          isGenerator = this.options.ecmaVersion >= 9 && this.eat(types$1.star);
          this.parsePropertyName(prop);
        } else {
          isAsync = false;
        }
        this.parsePropertyValue(prop, isPattern, isGenerator, isAsync, startPos, startLoc, refDestructuringErrors, containsEsc);
        return this.finishNode(prop, "Property");
      };
      pp$5.parseGetterSetter = function(prop) {
        prop.kind = prop.key.name;
        this.parsePropertyName(prop);
        prop.value = this.parseMethod(false);
        var paramCount = prop.kind === "get" ? 0 : 1;
        if (prop.value.params.length !== paramCount) {
          var start = prop.value.start;
          if (prop.kind === "get") {
            this.raiseRecoverable(start, "getter should have no params");
          } else {
            this.raiseRecoverable(start, "setter should have exactly one param");
          }
        } else {
          if (prop.kind === "set" && prop.value.params[0].type === "RestElement") {
            this.raiseRecoverable(prop.value.params[0].start, "Setter cannot use rest params");
          }
        }
      };
      pp$5.parsePropertyValue = function(prop, isPattern, isGenerator, isAsync, startPos, startLoc, refDestructuringErrors, containsEsc) {
        if ((isGenerator || isAsync) && this.type === types$1.colon) {
          this.unexpected();
        }
        if (this.eat(types$1.colon)) {
          prop.value = isPattern ? this.parseMaybeDefault(this.start, this.startLoc) : this.parseMaybeAssign(false, refDestructuringErrors);
          prop.kind = "init";
        } else if (this.options.ecmaVersion >= 6 && this.type === types$1.parenL) {
          if (isPattern) {
            this.unexpected();
          }
          prop.kind = "init";
          prop.method = true;
          prop.value = this.parseMethod(isGenerator, isAsync);
        } else if (!isPattern && !containsEsc && this.options.ecmaVersion >= 5 && !prop.computed && prop.key.type === "Identifier" && (prop.key.name === "get" || prop.key.name === "set") && (this.type !== types$1.comma && this.type !== types$1.braceR && this.type !== types$1.eq)) {
          if (isGenerator || isAsync) {
            this.unexpected();
          }
          this.parseGetterSetter(prop);
        } else if (this.options.ecmaVersion >= 6 && !prop.computed && prop.key.type === "Identifier") {
          if (isGenerator || isAsync) {
            this.unexpected();
          }
          this.checkUnreserved(prop.key);
          if (prop.key.name === "await" && !this.awaitIdentPos) {
            this.awaitIdentPos = startPos;
          }
          prop.kind = "init";
          if (isPattern) {
            prop.value = this.parseMaybeDefault(startPos, startLoc, this.copyNode(prop.key));
          } else if (this.type === types$1.eq && refDestructuringErrors) {
            if (refDestructuringErrors.shorthandAssign < 0) {
              refDestructuringErrors.shorthandAssign = this.start;
            }
            prop.value = this.parseMaybeDefault(startPos, startLoc, this.copyNode(prop.key));
          } else {
            prop.value = this.copyNode(prop.key);
          }
          prop.shorthand = true;
        } else {
          this.unexpected();
        }
      };
      pp$5.parsePropertyName = function(prop) {
        if (this.options.ecmaVersion >= 6) {
          if (this.eat(types$1.bracketL)) {
            prop.computed = true;
            prop.key = this.parseMaybeAssign();
            this.expect(types$1.bracketR);
            return prop.key;
          } else {
            prop.computed = false;
          }
        }
        return prop.key = this.type === types$1.num || this.type === types$1.string ? this.parseExprAtom() : this.parseIdent(this.options.allowReserved !== "never");
      };
      pp$5.initFunction = function(node) {
        node.id = null;
        if (this.options.ecmaVersion >= 6) {
          node.generator = node.expression = false;
        }
        if (this.options.ecmaVersion >= 8) {
          node.async = false;
        }
      };
      pp$5.parseMethod = function(isGenerator, isAsync, allowDirectSuper) {
        var node = this.startNode(), oldYieldPos = this.yieldPos, oldAwaitPos = this.awaitPos, oldAwaitIdentPos = this.awaitIdentPos;
        this.initFunction(node);
        if (this.options.ecmaVersion >= 6) {
          node.generator = isGenerator;
        }
        if (this.options.ecmaVersion >= 8) {
          node.async = !!isAsync;
        }
        this.yieldPos = 0;
        this.awaitPos = 0;
        this.awaitIdentPos = 0;
        this.enterScope(functionFlags(isAsync, node.generator) | SCOPE_SUPER | (allowDirectSuper ? SCOPE_DIRECT_SUPER : 0));
        this.expect(types$1.parenL);
        node.params = this.parseBindingList(types$1.parenR, false, this.options.ecmaVersion >= 8);
        this.checkYieldAwaitInDefaultParams();
        this.parseFunctionBody(node, false, true, false);
        this.yieldPos = oldYieldPos;
        this.awaitPos = oldAwaitPos;
        this.awaitIdentPos = oldAwaitIdentPos;
        return this.finishNode(node, "FunctionExpression");
      };
      pp$5.parseArrowExpression = function(node, params, isAsync, forInit) {
        var oldYieldPos = this.yieldPos, oldAwaitPos = this.awaitPos, oldAwaitIdentPos = this.awaitIdentPos;
        this.enterScope(functionFlags(isAsync, false) | SCOPE_ARROW);
        this.initFunction(node);
        if (this.options.ecmaVersion >= 8) {
          node.async = !!isAsync;
        }
        this.yieldPos = 0;
        this.awaitPos = 0;
        this.awaitIdentPos = 0;
        node.params = this.toAssignableList(params, true);
        this.parseFunctionBody(node, true, false, forInit);
        this.yieldPos = oldYieldPos;
        this.awaitPos = oldAwaitPos;
        this.awaitIdentPos = oldAwaitIdentPos;
        return this.finishNode(node, "ArrowFunctionExpression");
      };
      pp$5.parseFunctionBody = function(node, isArrowFunction, isMethod, forInit) {
        var isExpression = isArrowFunction && this.type !== types$1.braceL;
        var oldStrict = this.strict, useStrict = false;
        if (isExpression) {
          node.body = this.parseMaybeAssign(forInit);
          node.expression = true;
          this.checkParams(node, false);
        } else {
          var nonSimple = this.options.ecmaVersion >= 7 && !this.isSimpleParamList(node.params);
          if (!oldStrict || nonSimple) {
            useStrict = this.strictDirective(this.end);
            if (useStrict && nonSimple) {
              this.raiseRecoverable(node.start, "Illegal 'use strict' directive in function with non-simple parameter list");
            }
          }
          var oldLabels = this.labels;
          this.labels = [];
          if (useStrict) {
            this.strict = true;
          }
          this.checkParams(node, !oldStrict && !useStrict && !isArrowFunction && !isMethod && this.isSimpleParamList(node.params));
          if (this.strict && node.id) {
            this.checkLValSimple(node.id, BIND_OUTSIDE);
          }
          node.body = this.parseBlock(false, void 0, useStrict && !oldStrict);
          node.expression = false;
          this.adaptDirectivePrologue(node.body.body);
          this.labels = oldLabels;
        }
        this.exitScope();
      };
      pp$5.isSimpleParamList = function(params) {
        for (var i2 = 0, list2 = params; i2 < list2.length; i2 += 1) {
          var param = list2[i2];
          if (param.type !== "Identifier") {
            return false;
          }
        }
        return true;
      };
      pp$5.checkParams = function(node, allowDuplicates) {
        var nameHash = /* @__PURE__ */ Object.create(null);
        for (var i2 = 0, list2 = node.params; i2 < list2.length; i2 += 1) {
          var param = list2[i2];
          this.checkLValInnerPattern(param, BIND_VAR, allowDuplicates ? null : nameHash);
        }
      };
      pp$5.parseExprList = function(close, allowTrailingComma, allowEmpty, refDestructuringErrors) {
        var elts = [], first = true;
        while (!this.eat(close)) {
          if (!first) {
            this.expect(types$1.comma);
            if (allowTrailingComma && this.afterTrailingComma(close)) {
              break;
            }
          } else {
            first = false;
          }
          var elt = void 0;
          if (allowEmpty && this.type === types$1.comma) {
            elt = null;
          } else if (this.type === types$1.ellipsis) {
            elt = this.parseSpread(refDestructuringErrors);
            if (refDestructuringErrors && this.type === types$1.comma && refDestructuringErrors.trailingComma < 0) {
              refDestructuringErrors.trailingComma = this.start;
            }
          } else {
            elt = this.parseMaybeAssign(false, refDestructuringErrors);
          }
          elts.push(elt);
        }
        return elts;
      };
      pp$5.checkUnreserved = function(ref2) {
        var start = ref2.start;
        var end = ref2.end;
        var name = ref2.name;
        if (this.inGenerator && name === "yield") {
          this.raiseRecoverable(start, "Cannot use 'yield' as identifier inside a generator");
        }
        if (this.inAsync && name === "await") {
          this.raiseRecoverable(start, "Cannot use 'await' as identifier inside an async function");
        }
        if (this.currentThisScope().inClassFieldInit && name === "arguments") {
          this.raiseRecoverable(start, "Cannot use 'arguments' in class field initializer");
        }
        if (this.inClassStaticBlock && (name === "arguments" || name === "await")) {
          this.raise(start, "Cannot use " + name + " in class static initialization block");
        }
        if (this.keywords.test(name)) {
          this.raise(start, "Unexpected keyword '" + name + "'");
        }
        if (this.options.ecmaVersion < 6 && this.input.slice(start, end).indexOf("\\") !== -1) {
          return;
        }
        var re = this.strict ? this.reservedWordsStrict : this.reservedWords;
        if (re.test(name)) {
          if (!this.inAsync && name === "await") {
            this.raiseRecoverable(start, "Cannot use keyword 'await' outside an async function");
          }
          this.raiseRecoverable(start, "The keyword '" + name + "' is reserved");
        }
      };
      pp$5.parseIdent = function(liberal) {
        var node = this.parseIdentNode();
        this.next(!!liberal);
        this.finishNode(node, "Identifier");
        if (!liberal) {
          this.checkUnreserved(node);
          if (node.name === "await" && !this.awaitIdentPos) {
            this.awaitIdentPos = node.start;
          }
        }
        return node;
      };
      pp$5.parseIdentNode = function() {
        var node = this.startNode();
        if (this.type === types$1.name) {
          node.name = this.value;
        } else if (this.type.keyword) {
          node.name = this.type.keyword;
          if ((node.name === "class" || node.name === "function") && (this.lastTokEnd !== this.lastTokStart + 1 || this.input.charCodeAt(this.lastTokStart) !== 46)) {
            this.context.pop();
          }
          this.type = types$1.name;
        } else {
          this.unexpected();
        }
        return node;
      };
      pp$5.parsePrivateIdent = function() {
        var node = this.startNode();
        if (this.type === types$1.privateId) {
          node.name = this.value;
        } else {
          this.unexpected();
        }
        this.next();
        this.finishNode(node, "PrivateIdentifier");
        if (this.options.checkPrivateFields) {
          if (this.privateNameStack.length === 0) {
            this.raise(node.start, "Private field '#" + node.name + "' must be declared in an enclosing class");
          } else {
            this.privateNameStack[this.privateNameStack.length - 1].used.push(node);
          }
        }
        return node;
      };
      pp$5.parseYield = function(forInit) {
        if (!this.yieldPos) {
          this.yieldPos = this.start;
        }
        var node = this.startNode();
        this.next();
        if (this.type === types$1.semi || this.canInsertSemicolon() || this.type !== types$1.star && !this.type.startsExpr) {
          node.delegate = false;
          node.argument = null;
        } else {
          node.delegate = this.eat(types$1.star);
          node.argument = this.parseMaybeAssign(forInit);
        }
        return this.finishNode(node, "YieldExpression");
      };
      pp$5.parseAwait = function(forInit) {
        if (!this.awaitPos) {
          this.awaitPos = this.start;
        }
        var node = this.startNode();
        this.next();
        node.argument = this.parseMaybeUnary(null, true, false, forInit);
        return this.finishNode(node, "AwaitExpression");
      };
      var pp$4 = Parser.prototype;
      pp$4.raise = function(pos, message) {
        var loc = getLineInfo(this.input, pos);
        message += " (" + loc.line + ":" + loc.column + ")";
        var err = new SyntaxError(message);
        err.pos = pos;
        err.loc = loc;
        err.raisedAt = this.pos;
        throw err;
      };
      pp$4.raiseRecoverable = pp$4.raise;
      pp$4.curPosition = function() {
        if (this.options.locations) {
          return new Position(this.curLine, this.pos - this.lineStart);
        }
      };
      var pp$3 = Parser.prototype;
      var Scope = function Scope2(flags) {
        this.flags = flags;
        this.var = [];
        this.lexical = [];
        this.functions = [];
        this.inClassFieldInit = false;
      };
      pp$3.enterScope = function(flags) {
        this.scopeStack.push(new Scope(flags));
      };
      pp$3.exitScope = function() {
        this.scopeStack.pop();
      };
      pp$3.treatFunctionsAsVarInScope = function(scope) {
        return scope.flags & SCOPE_FUNCTION || !this.inModule && scope.flags & SCOPE_TOP;
      };
      pp$3.declareName = function(name, bindingType, pos) {
        var redeclared = false;
        if (bindingType === BIND_LEXICAL) {
          var scope = this.currentScope();
          redeclared = scope.lexical.indexOf(name) > -1 || scope.functions.indexOf(name) > -1 || scope.var.indexOf(name) > -1;
          scope.lexical.push(name);
          if (this.inModule && scope.flags & SCOPE_TOP) {
            delete this.undefinedExports[name];
          }
        } else if (bindingType === BIND_SIMPLE_CATCH) {
          var scope$1 = this.currentScope();
          scope$1.lexical.push(name);
        } else if (bindingType === BIND_FUNCTION) {
          var scope$2 = this.currentScope();
          if (this.treatFunctionsAsVar) {
            redeclared = scope$2.lexical.indexOf(name) > -1;
          } else {
            redeclared = scope$2.lexical.indexOf(name) > -1 || scope$2.var.indexOf(name) > -1;
          }
          scope$2.functions.push(name);
        } else {
          for (var i2 = this.scopeStack.length - 1; i2 >= 0; --i2) {
            var scope$3 = this.scopeStack[i2];
            if (scope$3.lexical.indexOf(name) > -1 && !(scope$3.flags & SCOPE_SIMPLE_CATCH && scope$3.lexical[0] === name) || !this.treatFunctionsAsVarInScope(scope$3) && scope$3.functions.indexOf(name) > -1) {
              redeclared = true;
              break;
            }
            scope$3.var.push(name);
            if (this.inModule && scope$3.flags & SCOPE_TOP) {
              delete this.undefinedExports[name];
            }
            if (scope$3.flags & SCOPE_VAR) {
              break;
            }
          }
        }
        if (redeclared) {
          this.raiseRecoverable(pos, "Identifier '" + name + "' has already been declared");
        }
      };
      pp$3.checkLocalExport = function(id) {
        if (this.scopeStack[0].lexical.indexOf(id.name) === -1 && this.scopeStack[0].var.indexOf(id.name) === -1) {
          this.undefinedExports[id.name] = id;
        }
      };
      pp$3.currentScope = function() {
        return this.scopeStack[this.scopeStack.length - 1];
      };
      pp$3.currentVarScope = function() {
        for (var i2 = this.scopeStack.length - 1; ; i2--) {
          var scope = this.scopeStack[i2];
          if (scope.flags & SCOPE_VAR) {
            return scope;
          }
        }
      };
      pp$3.currentThisScope = function() {
        for (var i2 = this.scopeStack.length - 1; ; i2--) {
          var scope = this.scopeStack[i2];
          if (scope.flags & SCOPE_VAR && !(scope.flags & SCOPE_ARROW)) {
            return scope;
          }
        }
      };
      var Node = function Node2(parser, pos, loc) {
        this.type = "";
        this.start = pos;
        this.end = 0;
        if (parser.options.locations) {
          this.loc = new SourceLocation(parser, loc);
        }
        if (parser.options.directSourceFile) {
          this.sourceFile = parser.options.directSourceFile;
        }
        if (parser.options.ranges) {
          this.range = [pos, 0];
        }
      };
      var pp$2 = Parser.prototype;
      pp$2.startNode = function() {
        return new Node(this, this.start, this.startLoc);
      };
      pp$2.startNodeAt = function(pos, loc) {
        return new Node(this, pos, loc);
      };
      function finishNodeAt(node, type, pos, loc) {
        node.type = type;
        node.end = pos;
        if (this.options.locations) {
          node.loc.end = loc;
        }
        if (this.options.ranges) {
          node.range[1] = pos;
        }
        return node;
      }
      pp$2.finishNode = function(node, type) {
        return finishNodeAt.call(this, node, type, this.lastTokEnd, this.lastTokEndLoc);
      };
      pp$2.finishNodeAt = function(node, type, pos, loc) {
        return finishNodeAt.call(this, node, type, pos, loc);
      };
      pp$2.copyNode = function(node) {
        var newNode = new Node(this, node.start, this.startLoc);
        for (var prop in node) {
          newNode[prop] = node[prop];
        }
        return newNode;
      };
      var scriptValuesAddedInUnicode = "Gara Garay Gukh Gurung_Khema Hrkt Katakana_Or_Hiragana Kawi Kirat_Rai Krai Nag_Mundari Nagm Ol_Onal Onao Sunu Sunuwar Todhri Todr Tulu_Tigalari Tutg Unknown Zzzz";
      var ecma9BinaryProperties = "ASCII ASCII_Hex_Digit AHex Alphabetic Alpha Any Assigned Bidi_Control Bidi_C Bidi_Mirrored Bidi_M Case_Ignorable CI Cased Changes_When_Casefolded CWCF Changes_When_Casemapped CWCM Changes_When_Lowercased CWL Changes_When_NFKC_Casefolded CWKCF Changes_When_Titlecased CWT Changes_When_Uppercased CWU Dash Default_Ignorable_Code_Point DI Deprecated Dep Diacritic Dia Emoji Emoji_Component Emoji_Modifier Emoji_Modifier_Base Emoji_Presentation Extender Ext Grapheme_Base Gr_Base Grapheme_Extend Gr_Ext Hex_Digit Hex IDS_Binary_Operator IDSB IDS_Trinary_Operator IDST ID_Continue IDC ID_Start IDS Ideographic Ideo Join_Control Join_C Logical_Order_Exception LOE Lowercase Lower Math Noncharacter_Code_Point NChar Pattern_Syntax Pat_Syn Pattern_White_Space Pat_WS Quotation_Mark QMark Radical Regional_Indicator RI Sentence_Terminal STerm Soft_Dotted SD Terminal_Punctuation Term Unified_Ideograph UIdeo Uppercase Upper Variation_Selector VS White_Space space XID_Continue XIDC XID_Start XIDS";
      var ecma10BinaryProperties = ecma9BinaryProperties + " Extended_Pictographic";
      var ecma11BinaryProperties = ecma10BinaryProperties;
      var ecma12BinaryProperties = ecma11BinaryProperties + " EBase EComp EMod EPres ExtPict";
      var ecma13BinaryProperties = ecma12BinaryProperties;
      var ecma14BinaryProperties = ecma13BinaryProperties;
      var unicodeBinaryProperties = {
        9: ecma9BinaryProperties,
        10: ecma10BinaryProperties,
        11: ecma11BinaryProperties,
        12: ecma12BinaryProperties,
        13: ecma13BinaryProperties,
        14: ecma14BinaryProperties
      };
      var ecma14BinaryPropertiesOfStrings = "Basic_Emoji Emoji_Keycap_Sequence RGI_Emoji_Modifier_Sequence RGI_Emoji_Flag_Sequence RGI_Emoji_Tag_Sequence RGI_Emoji_ZWJ_Sequence RGI_Emoji";
      var unicodeBinaryPropertiesOfStrings = {
        9: "",
        10: "",
        11: "",
        12: "",
        13: "",
        14: ecma14BinaryPropertiesOfStrings
      };
      var unicodeGeneralCategoryValues = "Cased_Letter LC Close_Punctuation Pe Connector_Punctuation Pc Control Cc cntrl Currency_Symbol Sc Dash_Punctuation Pd Decimal_Number Nd digit Enclosing_Mark Me Final_Punctuation Pf Format Cf Initial_Punctuation Pi Letter L Letter_Number Nl Line_Separator Zl Lowercase_Letter Ll Mark M Combining_Mark Math_Symbol Sm Modifier_Letter Lm Modifier_Symbol Sk Nonspacing_Mark Mn Number N Open_Punctuation Ps Other C Other_Letter Lo Other_Number No Other_Punctuation Po Other_Symbol So Paragraph_Separator Zp Private_Use Co Punctuation P punct Separator Z Space_Separator Zs Spacing_Mark Mc Surrogate Cs Symbol S Titlecase_Letter Lt Unassigned Cn Uppercase_Letter Lu";
      var ecma9ScriptValues = "Adlam Adlm Ahom Anatolian_Hieroglyphs Hluw Arabic Arab Armenian Armn Avestan Avst Balinese Bali Bamum Bamu Bassa_Vah Bass Batak Batk Bengali Beng Bhaiksuki Bhks Bopomofo Bopo Brahmi Brah Braille Brai Buginese Bugi Buhid Buhd Canadian_Aboriginal Cans Carian Cari Caucasian_Albanian Aghb Chakma Cakm Cham Cham Cherokee Cher Common Zyyy Coptic Copt Qaac Cuneiform Xsux Cypriot Cprt Cyrillic Cyrl Deseret Dsrt Devanagari Deva Duployan Dupl Egyptian_Hieroglyphs Egyp Elbasan Elba Ethiopic Ethi Georgian Geor Glagolitic Glag Gothic Goth Grantha Gran Greek Grek Gujarati Gujr Gurmukhi Guru Han Hani Hangul Hang Hanunoo Hano Hatran Hatr Hebrew Hebr Hiragana Hira Imperial_Aramaic Armi Inherited Zinh Qaai Inscriptional_Pahlavi Phli Inscriptional_Parthian Prti Javanese Java Kaithi Kthi Kannada Knda Katakana Kana Kayah_Li Kali Kharoshthi Khar Khmer Khmr Khojki Khoj Khudawadi Sind Lao Laoo Latin Latn Lepcha Lepc Limbu Limb Linear_A Lina Linear_B Linb Lisu Lisu Lycian Lyci Lydian Lydi Mahajani Mahj Malayalam Mlym Mandaic Mand Manichaean Mani Marchen Marc Masaram_Gondi Gonm Meetei_Mayek Mtei Mende_Kikakui Mend Meroitic_Cursive Merc Meroitic_Hieroglyphs Mero Miao Plrd Modi Mongolian Mong Mro Mroo Multani Mult Myanmar Mymr Nabataean Nbat New_Tai_Lue Talu Newa Newa Nko Nkoo Nushu Nshu Ogham Ogam Ol_Chiki Olck Old_Hungarian Hung Old_Italic Ital Old_North_Arabian Narb Old_Permic Perm Old_Persian Xpeo Old_South_Arabian Sarb Old_Turkic Orkh Oriya Orya Osage Osge Osmanya Osma Pahawh_Hmong Hmng Palmyrene Palm Pau_Cin_Hau Pauc Phags_Pa Phag Phoenician Phnx Psalter_Pahlavi Phlp Rejang Rjng Runic Runr Samaritan Samr Saurashtra Saur Sharada Shrd Shavian Shaw Siddham Sidd SignWriting Sgnw Sinhala Sinh Sora_Sompeng Sora Soyombo Soyo Sundanese Sund Syloti_Nagri Sylo Syriac Syrc Tagalog Tglg Tagbanwa Tagb Tai_Le Tale Tai_Tham Lana Tai_Viet Tavt Takri Takr Tamil Taml Tangut Tang Telugu Telu Thaana Thaa Thai Thai Tibetan Tibt Tifinagh Tfng Tirhuta Tirh Ugaritic Ugar Vai Vaii Warang_Citi Wara Yi Yiii Zanabazar_Square Zanb";
      var ecma10ScriptValues = ecma9ScriptValues + " Dogra Dogr Gunjala_Gondi Gong Hanifi_Rohingya Rohg Makasar Maka Medefaidrin Medf Old_Sogdian Sogo Sogdian Sogd";
      var ecma11ScriptValues = ecma10ScriptValues + " Elymaic Elym Nandinagari Nand Nyiakeng_Puachue_Hmong Hmnp Wancho Wcho";
      var ecma12ScriptValues = ecma11ScriptValues + " Chorasmian Chrs Diak Dives_Akuru Khitan_Small_Script Kits Yezi Yezidi";
      var ecma13ScriptValues = ecma12ScriptValues + " Cypro_Minoan Cpmn Old_Uyghur Ougr Tangsa Tnsa Toto Vithkuqi Vith";
      var ecma14ScriptValues = ecma13ScriptValues + " " + scriptValuesAddedInUnicode;
      var unicodeScriptValues = {
        9: ecma9ScriptValues,
        10: ecma10ScriptValues,
        11: ecma11ScriptValues,
        12: ecma12ScriptValues,
        13: ecma13ScriptValues,
        14: ecma14ScriptValues
      };
      var data = {};
      function buildUnicodeData(ecmaVersion2) {
        var d = data[ecmaVersion2] = {
          binary: wordsRegexp(unicodeBinaryProperties[ecmaVersion2] + " " + unicodeGeneralCategoryValues),
          binaryOfStrings: wordsRegexp(unicodeBinaryPropertiesOfStrings[ecmaVersion2]),
          nonBinary: {
            General_Category: wordsRegexp(unicodeGeneralCategoryValues),
            Script: wordsRegexp(unicodeScriptValues[ecmaVersion2])
          }
        };
        d.nonBinary.Script_Extensions = d.nonBinary.Script;
        d.nonBinary.gc = d.nonBinary.General_Category;
        d.nonBinary.sc = d.nonBinary.Script;
        d.nonBinary.scx = d.nonBinary.Script_Extensions;
      }
      for (var i = 0, list = [9, 10, 11, 12, 13, 14]; i < list.length; i += 1) {
        var ecmaVersion = list[i];
        buildUnicodeData(ecmaVersion);
      }
      var pp$1 = Parser.prototype;
      var BranchID = function BranchID2(parent, base) {
        this.parent = parent;
        this.base = base || this;
      };
      BranchID.prototype.separatedFrom = function separatedFrom(alt) {
        for (var self2 = this; self2; self2 = self2.parent) {
          for (var other = alt; other; other = other.parent) {
            if (self2.base === other.base && self2 !== other) {
              return true;
            }
          }
        }
        return false;
      };
      BranchID.prototype.sibling = function sibling() {
        return new BranchID(this.parent, this.base);
      };
      var RegExpValidationState = function RegExpValidationState2(parser) {
        this.parser = parser;
        this.validFlags = "gim" + (parser.options.ecmaVersion >= 6 ? "uy" : "") + (parser.options.ecmaVersion >= 9 ? "s" : "") + (parser.options.ecmaVersion >= 13 ? "d" : "") + (parser.options.ecmaVersion >= 15 ? "v" : "");
        this.unicodeProperties = data[parser.options.ecmaVersion >= 14 ? 14 : parser.options.ecmaVersion];
        this.source = "";
        this.flags = "";
        this.start = 0;
        this.switchU = false;
        this.switchV = false;
        this.switchN = false;
        this.pos = 0;
        this.lastIntValue = 0;
        this.lastStringValue = "";
        this.lastAssertionIsQuantifiable = false;
        this.numCapturingParens = 0;
        this.maxBackReference = 0;
        this.groupNames = /* @__PURE__ */ Object.create(null);
        this.backReferenceNames = [];
        this.branchID = null;
      };
      RegExpValidationState.prototype.reset = function reset(start, pattern, flags) {
        var unicodeSets = flags.indexOf("v") !== -1;
        var unicode = flags.indexOf("u") !== -1;
        this.start = start | 0;
        this.source = pattern + "";
        this.flags = flags;
        if (unicodeSets && this.parser.options.ecmaVersion >= 15) {
          this.switchU = true;
          this.switchV = true;
          this.switchN = true;
        } else {
          this.switchU = unicode && this.parser.options.ecmaVersion >= 6;
          this.switchV = false;
          this.switchN = unicode && this.parser.options.ecmaVersion >= 9;
        }
      };
      RegExpValidationState.prototype.raise = function raise(message) {
        this.parser.raiseRecoverable(this.start, "Invalid regular expression: /" + this.source + "/: " + message);
      };
      RegExpValidationState.prototype.at = function at(i2, forceU) {
        if (forceU === void 0) forceU = false;
        var s = this.source;
        var l = s.length;
        if (i2 >= l) {
          return -1;
        }
        var c = s.charCodeAt(i2);
        if (!(forceU || this.switchU) || c <= 55295 || c >= 57344 || i2 + 1 >= l) {
          return c;
        }
        var next = s.charCodeAt(i2 + 1);
        return next >= 56320 && next <= 57343 ? (c << 10) + next - 56613888 : c;
      };
      RegExpValidationState.prototype.nextIndex = function nextIndex(i2, forceU) {
        if (forceU === void 0) forceU = false;
        var s = this.source;
        var l = s.length;
        if (i2 >= l) {
          return l;
        }
        var c = s.charCodeAt(i2), next;
        if (!(forceU || this.switchU) || c <= 55295 || c >= 57344 || i2 + 1 >= l || (next = s.charCodeAt(i2 + 1)) < 56320 || next > 57343) {
          return i2 + 1;
        }
        return i2 + 2;
      };
      RegExpValidationState.prototype.current = function current(forceU) {
        if (forceU === void 0) forceU = false;
        return this.at(this.pos, forceU);
      };
      RegExpValidationState.prototype.lookahead = function lookahead(forceU) {
        if (forceU === void 0) forceU = false;
        return this.at(this.nextIndex(this.pos, forceU), forceU);
      };
      RegExpValidationState.prototype.advance = function advance(forceU) {
        if (forceU === void 0) forceU = false;
        this.pos = this.nextIndex(this.pos, forceU);
      };
      RegExpValidationState.prototype.eat = function eat(ch, forceU) {
        if (forceU === void 0) forceU = false;
        if (this.current(forceU) === ch) {
          this.advance(forceU);
          return true;
        }
        return false;
      };
      RegExpValidationState.prototype.eatChars = function eatChars(chs, forceU) {
        if (forceU === void 0) forceU = false;
        var pos = this.pos;
        for (var i2 = 0, list2 = chs; i2 < list2.length; i2 += 1) {
          var ch = list2[i2];
          var current = this.at(pos, forceU);
          if (current === -1 || current !== ch) {
            return false;
          }
          pos = this.nextIndex(pos, forceU);
        }
        this.pos = pos;
        return true;
      };
      pp$1.validateRegExpFlags = function(state) {
        var validFlags = state.validFlags;
        var flags = state.flags;
        var u = false;
        var v = false;
        for (var i2 = 0; i2 < flags.length; i2++) {
          var flag = flags.charAt(i2);
          if (validFlags.indexOf(flag) === -1) {
            this.raise(state.start, "Invalid regular expression flag");
          }
          if (flags.indexOf(flag, i2 + 1) > -1) {
            this.raise(state.start, "Duplicate regular expression flag");
          }
          if (flag === "u") {
            u = true;
          }
          if (flag === "v") {
            v = true;
          }
        }
        if (this.options.ecmaVersion >= 15 && u && v) {
          this.raise(state.start, "Invalid regular expression flag");
        }
      };
      function hasProp(obj) {
        for (var _ in obj) {
          return true;
        }
        return false;
      }
      pp$1.validateRegExpPattern = function(state) {
        this.regexp_pattern(state);
        if (!state.switchN && this.options.ecmaVersion >= 9 && hasProp(state.groupNames)) {
          state.switchN = true;
          this.regexp_pattern(state);
        }
      };
      pp$1.regexp_pattern = function(state) {
        state.pos = 0;
        state.lastIntValue = 0;
        state.lastStringValue = "";
        state.lastAssertionIsQuantifiable = false;
        state.numCapturingParens = 0;
        state.maxBackReference = 0;
        state.groupNames = /* @__PURE__ */ Object.create(null);
        state.backReferenceNames.length = 0;
        state.branchID = null;
        this.regexp_disjunction(state);
        if (state.pos !== state.source.length) {
          if (state.eat(
            41
            /* ) */
          )) {
            state.raise("Unmatched ')'");
          }
          if (state.eat(
            93
            /* ] */
          ) || state.eat(
            125
            /* } */
          )) {
            state.raise("Lone quantifier brackets");
          }
        }
        if (state.maxBackReference > state.numCapturingParens) {
          state.raise("Invalid escape");
        }
        for (var i2 = 0, list2 = state.backReferenceNames; i2 < list2.length; i2 += 1) {
          var name = list2[i2];
          if (!state.groupNames[name]) {
            state.raise("Invalid named capture referenced");
          }
        }
      };
      pp$1.regexp_disjunction = function(state) {
        var trackDisjunction = this.options.ecmaVersion >= 16;
        if (trackDisjunction) {
          state.branchID = new BranchID(state.branchID, null);
        }
        this.regexp_alternative(state);
        while (state.eat(
          124
          /* | */
        )) {
          if (trackDisjunction) {
            state.branchID = state.branchID.sibling();
          }
          this.regexp_alternative(state);
        }
        if (trackDisjunction) {
          state.branchID = state.branchID.parent;
        }
        if (this.regexp_eatQuantifier(state, true)) {
          state.raise("Nothing to repeat");
        }
        if (state.eat(
          123
          /* { */
        )) {
          state.raise("Lone quantifier brackets");
        }
      };
      pp$1.regexp_alternative = function(state) {
        while (state.pos < state.source.length && this.regexp_eatTerm(state)) {
        }
      };
      pp$1.regexp_eatTerm = function(state) {
        if (this.regexp_eatAssertion(state)) {
          if (state.lastAssertionIsQuantifiable && this.regexp_eatQuantifier(state)) {
            if (state.switchU) {
              state.raise("Invalid quantifier");
            }
          }
          return true;
        }
        if (state.switchU ? this.regexp_eatAtom(state) : this.regexp_eatExtendedAtom(state)) {
          this.regexp_eatQuantifier(state);
          return true;
        }
        return false;
      };
      pp$1.regexp_eatAssertion = function(state) {
        var start = state.pos;
        state.lastAssertionIsQuantifiable = false;
        if (state.eat(
          94
          /* ^ */
        ) || state.eat(
          36
          /* $ */
        )) {
          return true;
        }
        if (state.eat(
          92
          /* \ */
        )) {
          if (state.eat(
            66
            /* B */
          ) || state.eat(
            98
            /* b */
          )) {
            return true;
          }
          state.pos = start;
        }
        if (state.eat(
          40
          /* ( */
        ) && state.eat(
          63
          /* ? */
        )) {
          var lookbehind = false;
          if (this.options.ecmaVersion >= 9) {
            lookbehind = state.eat(
              60
              /* < */
            );
          }
          if (state.eat(
            61
            /* = */
          ) || state.eat(
            33
            /* ! */
          )) {
            this.regexp_disjunction(state);
            if (!state.eat(
              41
              /* ) */
            )) {
              state.raise("Unterminated group");
            }
            state.lastAssertionIsQuantifiable = !lookbehind;
            return true;
          }
        }
        state.pos = start;
        return false;
      };
      pp$1.regexp_eatQuantifier = function(state, noError) {
        if (noError === void 0) noError = false;
        if (this.regexp_eatQuantifierPrefix(state, noError)) {
          state.eat(
            63
            /* ? */
          );
          return true;
        }
        return false;
      };
      pp$1.regexp_eatQuantifierPrefix = function(state, noError) {
        return state.eat(
          42
          /* * */
        ) || state.eat(
          43
          /* + */
        ) || state.eat(
          63
          /* ? */
        ) || this.regexp_eatBracedQuantifier(state, noError);
      };
      pp$1.regexp_eatBracedQuantifier = function(state, noError) {
        var start = state.pos;
        if (state.eat(
          123
          /* { */
        )) {
          var min = 0, max = -1;
          if (this.regexp_eatDecimalDigits(state)) {
            min = state.lastIntValue;
            if (state.eat(
              44
              /* , */
            ) && this.regexp_eatDecimalDigits(state)) {
              max = state.lastIntValue;
            }
            if (state.eat(
              125
              /* } */
            )) {
              if (max !== -1 && max < min && !noError) {
                state.raise("numbers out of order in {} quantifier");
              }
              return true;
            }
          }
          if (state.switchU && !noError) {
            state.raise("Incomplete quantifier");
          }
          state.pos = start;
        }
        return false;
      };
      pp$1.regexp_eatAtom = function(state) {
        return this.regexp_eatPatternCharacters(state) || state.eat(
          46
          /* . */
        ) || this.regexp_eatReverseSolidusAtomEscape(state) || this.regexp_eatCharacterClass(state) || this.regexp_eatUncapturingGroup(state) || this.regexp_eatCapturingGroup(state);
      };
      pp$1.regexp_eatReverseSolidusAtomEscape = function(state) {
        var start = state.pos;
        if (state.eat(
          92
          /* \ */
        )) {
          if (this.regexp_eatAtomEscape(state)) {
            return true;
          }
          state.pos = start;
        }
        return false;
      };
      pp$1.regexp_eatUncapturingGroup = function(state) {
        var start = state.pos;
        if (state.eat(
          40
          /* ( */
        )) {
          if (state.eat(
            63
            /* ? */
          )) {
            if (this.options.ecmaVersion >= 16) {
              var addModifiers = this.regexp_eatModifiers(state);
              var hasHyphen = state.eat(
                45
                /* - */
              );
              if (addModifiers || hasHyphen) {
                for (var i2 = 0; i2 < addModifiers.length; i2++) {
                  var modifier = addModifiers.charAt(i2);
                  if (addModifiers.indexOf(modifier, i2 + 1) > -1) {
                    state.raise("Duplicate regular expression modifiers");
                  }
                }
                if (hasHyphen) {
                  var removeModifiers = this.regexp_eatModifiers(state);
                  if (!addModifiers && !removeModifiers && state.current() === 58) {
                    state.raise("Invalid regular expression modifiers");
                  }
                  for (var i$1 = 0; i$1 < removeModifiers.length; i$1++) {
                    var modifier$1 = removeModifiers.charAt(i$1);
                    if (removeModifiers.indexOf(modifier$1, i$1 + 1) > -1 || addModifiers.indexOf(modifier$1) > -1) {
                      state.raise("Duplicate regular expression modifiers");
                    }
                  }
                }
              }
            }
            if (state.eat(
              58
              /* : */
            )) {
              this.regexp_disjunction(state);
              if (state.eat(
                41
                /* ) */
              )) {
                return true;
              }
              state.raise("Unterminated group");
            }
          }
          state.pos = start;
        }
        return false;
      };
      pp$1.regexp_eatCapturingGroup = function(state) {
        if (state.eat(
          40
          /* ( */
        )) {
          if (this.options.ecmaVersion >= 9) {
            this.regexp_groupSpecifier(state);
          } else if (state.current() === 63) {
            state.raise("Invalid group");
          }
          this.regexp_disjunction(state);
          if (state.eat(
            41
            /* ) */
          )) {
            state.numCapturingParens += 1;
            return true;
          }
          state.raise("Unterminated group");
        }
        return false;
      };
      pp$1.regexp_eatModifiers = function(state) {
        var modifiers = "";
        var ch = 0;
        while ((ch = state.current()) !== -1 && isRegularExpressionModifier(ch)) {
          modifiers += codePointToString(ch);
          state.advance();
        }
        return modifiers;
      };
      function isRegularExpressionModifier(ch) {
        return ch === 105 || ch === 109 || ch === 115;
      }
      pp$1.regexp_eatExtendedAtom = function(state) {
        return state.eat(
          46
          /* . */
        ) || this.regexp_eatReverseSolidusAtomEscape(state) || this.regexp_eatCharacterClass(state) || this.regexp_eatUncapturingGroup(state) || this.regexp_eatCapturingGroup(state) || this.regexp_eatInvalidBracedQuantifier(state) || this.regexp_eatExtendedPatternCharacter(state);
      };
      pp$1.regexp_eatInvalidBracedQuantifier = function(state) {
        if (this.regexp_eatBracedQuantifier(state, true)) {
          state.raise("Nothing to repeat");
        }
        return false;
      };
      pp$1.regexp_eatSyntaxCharacter = function(state) {
        var ch = state.current();
        if (isSyntaxCharacter(ch)) {
          state.lastIntValue = ch;
          state.advance();
          return true;
        }
        return false;
      };
      function isSyntaxCharacter(ch) {
        return ch === 36 || ch >= 40 && ch <= 43 || ch === 46 || ch === 63 || ch >= 91 && ch <= 94 || ch >= 123 && ch <= 125;
      }
      pp$1.regexp_eatPatternCharacters = function(state) {
        var start = state.pos;
        var ch = 0;
        while ((ch = state.current()) !== -1 && !isSyntaxCharacter(ch)) {
          state.advance();
        }
        return state.pos !== start;
      };
      pp$1.regexp_eatExtendedPatternCharacter = function(state) {
        var ch = state.current();
        if (ch !== -1 && ch !== 36 && !(ch >= 40 && ch <= 43) && ch !== 46 && ch !== 63 && ch !== 91 && ch !== 94 && ch !== 124) {
          state.advance();
          return true;
        }
        return false;
      };
      pp$1.regexp_groupSpecifier = function(state) {
        if (state.eat(
          63
          /* ? */
        )) {
          if (!this.regexp_eatGroupName(state)) {
            state.raise("Invalid group");
          }
          var trackDisjunction = this.options.ecmaVersion >= 16;
          var known = state.groupNames[state.lastStringValue];
          if (known) {
            if (trackDisjunction) {
              for (var i2 = 0, list2 = known; i2 < list2.length; i2 += 1) {
                var altID = list2[i2];
                if (!altID.separatedFrom(state.branchID)) {
                  state.raise("Duplicate capture group name");
                }
              }
            } else {
              state.raise("Duplicate capture group name");
            }
          }
          if (trackDisjunction) {
            (known || (state.groupNames[state.lastStringValue] = [])).push(state.branchID);
          } else {
            state.groupNames[state.lastStringValue] = true;
          }
        }
      };
      pp$1.regexp_eatGroupName = function(state) {
        state.lastStringValue = "";
        if (state.eat(
          60
          /* < */
        )) {
          if (this.regexp_eatRegExpIdentifierName(state) && state.eat(
            62
            /* > */
          )) {
            return true;
          }
          state.raise("Invalid capture group name");
        }
        return false;
      };
      pp$1.regexp_eatRegExpIdentifierName = function(state) {
        state.lastStringValue = "";
        if (this.regexp_eatRegExpIdentifierStart(state)) {
          state.lastStringValue += codePointToString(state.lastIntValue);
          while (this.regexp_eatRegExpIdentifierPart(state)) {
            state.lastStringValue += codePointToString(state.lastIntValue);
          }
          return true;
        }
        return false;
      };
      pp$1.regexp_eatRegExpIdentifierStart = function(state) {
        var start = state.pos;
        var forceU = this.options.ecmaVersion >= 11;
        var ch = state.current(forceU);
        state.advance(forceU);
        if (ch === 92 && this.regexp_eatRegExpUnicodeEscapeSequence(state, forceU)) {
          ch = state.lastIntValue;
        }
        if (isRegExpIdentifierStart(ch)) {
          state.lastIntValue = ch;
          return true;
        }
        state.pos = start;
        return false;
      };
      function isRegExpIdentifierStart(ch) {
        return isIdentifierStart(ch, true) || ch === 36 || ch === 95;
      }
      pp$1.regexp_eatRegExpIdentifierPart = function(state) {
        var start = state.pos;
        var forceU = this.options.ecmaVersion >= 11;
        var ch = state.current(forceU);
        state.advance(forceU);
        if (ch === 92 && this.regexp_eatRegExpUnicodeEscapeSequence(state, forceU)) {
          ch = state.lastIntValue;
        }
        if (isRegExpIdentifierPart(ch)) {
          state.lastIntValue = ch;
          return true;
        }
        state.pos = start;
        return false;
      };
      function isRegExpIdentifierPart(ch) {
        return isIdentifierChar(ch, true) || ch === 36 || ch === 95 || ch === 8204 || ch === 8205;
      }
      pp$1.regexp_eatAtomEscape = function(state) {
        if (this.regexp_eatBackReference(state) || this.regexp_eatCharacterClassEscape(state) || this.regexp_eatCharacterEscape(state) || state.switchN && this.regexp_eatKGroupName(state)) {
          return true;
        }
        if (state.switchU) {
          if (state.current() === 99) {
            state.raise("Invalid unicode escape");
          }
          state.raise("Invalid escape");
        }
        return false;
      };
      pp$1.regexp_eatBackReference = function(state) {
        var start = state.pos;
        if (this.regexp_eatDecimalEscape(state)) {
          var n = state.lastIntValue;
          if (state.switchU) {
            if (n > state.maxBackReference) {
              state.maxBackReference = n;
            }
            return true;
          }
          if (n <= state.numCapturingParens) {
            return true;
          }
          state.pos = start;
        }
        return false;
      };
      pp$1.regexp_eatKGroupName = function(state) {
        if (state.eat(
          107
          /* k */
        )) {
          if (this.regexp_eatGroupName(state)) {
            state.backReferenceNames.push(state.lastStringValue);
            return true;
          }
          state.raise("Invalid named reference");
        }
        return false;
      };
      pp$1.regexp_eatCharacterEscape = function(state) {
        return this.regexp_eatControlEscape(state) || this.regexp_eatCControlLetter(state) || this.regexp_eatZero(state) || this.regexp_eatHexEscapeSequence(state) || this.regexp_eatRegExpUnicodeEscapeSequence(state, false) || !state.switchU && this.regexp_eatLegacyOctalEscapeSequence(state) || this.regexp_eatIdentityEscape(state);
      };
      pp$1.regexp_eatCControlLetter = function(state) {
        var start = state.pos;
        if (state.eat(
          99
          /* c */
        )) {
          if (this.regexp_eatControlLetter(state)) {
            return true;
          }
          state.pos = start;
        }
        return false;
      };
      pp$1.regexp_eatZero = function(state) {
        if (state.current() === 48 && !isDecimalDigit(state.lookahead())) {
          state.lastIntValue = 0;
          state.advance();
          return true;
        }
        return false;
      };
      pp$1.regexp_eatControlEscape = function(state) {
        var ch = state.current();
        if (ch === 116) {
          state.lastIntValue = 9;
          state.advance();
          return true;
        }
        if (ch === 110) {
          state.lastIntValue = 10;
          state.advance();
          return true;
        }
        if (ch === 118) {
          state.lastIntValue = 11;
          state.advance();
          return true;
        }
        if (ch === 102) {
          state.lastIntValue = 12;
          state.advance();
          return true;
        }
        if (ch === 114) {
          state.lastIntValue = 13;
          state.advance();
          return true;
        }
        return false;
      };
      pp$1.regexp_eatControlLetter = function(state) {
        var ch = state.current();
        if (isControlLetter(ch)) {
          state.lastIntValue = ch % 32;
          state.advance();
          return true;
        }
        return false;
      };
      function isControlLetter(ch) {
        return ch >= 65 && ch <= 90 || ch >= 97 && ch <= 122;
      }
      pp$1.regexp_eatRegExpUnicodeEscapeSequence = function(state, forceU) {
        if (forceU === void 0) forceU = false;
        var start = state.pos;
        var switchU = forceU || state.switchU;
        if (state.eat(
          117
          /* u */
        )) {
          if (this.regexp_eatFixedHexDigits(state, 4)) {
            var lead = state.lastIntValue;
            if (switchU && lead >= 55296 && lead <= 56319) {
              var leadSurrogateEnd = state.pos;
              if (state.eat(
                92
                /* \ */
              ) && state.eat(
                117
                /* u */
              ) && this.regexp_eatFixedHexDigits(state, 4)) {
                var trail = state.lastIntValue;
                if (trail >= 56320 && trail <= 57343) {
                  state.lastIntValue = (lead - 55296) * 1024 + (trail - 56320) + 65536;
                  return true;
                }
              }
              state.pos = leadSurrogateEnd;
              state.lastIntValue = lead;
            }
            return true;
          }
          if (switchU && state.eat(
            123
            /* { */
          ) && this.regexp_eatHexDigits(state) && state.eat(
            125
            /* } */
          ) && isValidUnicode(state.lastIntValue)) {
            return true;
          }
          if (switchU) {
            state.raise("Invalid unicode escape");
          }
          state.pos = start;
        }
        return false;
      };
      function isValidUnicode(ch) {
        return ch >= 0 && ch <= 1114111;
      }
      pp$1.regexp_eatIdentityEscape = function(state) {
        if (state.switchU) {
          if (this.regexp_eatSyntaxCharacter(state)) {
            return true;
          }
          if (state.eat(
            47
            /* / */
          )) {
            state.lastIntValue = 47;
            return true;
          }
          return false;
        }
        var ch = state.current();
        if (ch !== 99 && (!state.switchN || ch !== 107)) {
          state.lastIntValue = ch;
          state.advance();
          return true;
        }
        return false;
      };
      pp$1.regexp_eatDecimalEscape = function(state) {
        state.lastIntValue = 0;
        var ch = state.current();
        if (ch >= 49 && ch <= 57) {
          do {
            state.lastIntValue = 10 * state.lastIntValue + (ch - 48);
            state.advance();
          } while ((ch = state.current()) >= 48 && ch <= 57);
          return true;
        }
        return false;
      };
      var CharSetNone = 0;
      var CharSetOk = 1;
      var CharSetString = 2;
      pp$1.regexp_eatCharacterClassEscape = function(state) {
        var ch = state.current();
        if (isCharacterClassEscape(ch)) {
          state.lastIntValue = -1;
          state.advance();
          return CharSetOk;
        }
        var negate = false;
        if (state.switchU && this.options.ecmaVersion >= 9 && ((negate = ch === 80) || ch === 112)) {
          state.lastIntValue = -1;
          state.advance();
          var result;
          if (state.eat(
            123
            /* { */
          ) && (result = this.regexp_eatUnicodePropertyValueExpression(state)) && state.eat(
            125
            /* } */
          )) {
            if (negate && result === CharSetString) {
              state.raise("Invalid property name");
            }
            return result;
          }
          state.raise("Invalid property name");
        }
        return CharSetNone;
      };
      function isCharacterClassEscape(ch) {
        return ch === 100 || ch === 68 || ch === 115 || ch === 83 || ch === 119 || ch === 87;
      }
      pp$1.regexp_eatUnicodePropertyValueExpression = function(state) {
        var start = state.pos;
        if (this.regexp_eatUnicodePropertyName(state) && state.eat(
          61
          /* = */
        )) {
          var name = state.lastStringValue;
          if (this.regexp_eatUnicodePropertyValue(state)) {
            var value2 = state.lastStringValue;
            this.regexp_validateUnicodePropertyNameAndValue(state, name, value2);
            return CharSetOk;
          }
        }
        state.pos = start;
        if (this.regexp_eatLoneUnicodePropertyNameOrValue(state)) {
          var nameOrValue = state.lastStringValue;
          return this.regexp_validateUnicodePropertyNameOrValue(state, nameOrValue);
        }
        return CharSetNone;
      };
      pp$1.regexp_validateUnicodePropertyNameAndValue = function(state, name, value2) {
        if (!hasOwn(state.unicodeProperties.nonBinary, name)) {
          state.raise("Invalid property name");
        }
        if (!state.unicodeProperties.nonBinary[name].test(value2)) {
          state.raise("Invalid property value");
        }
      };
      pp$1.regexp_validateUnicodePropertyNameOrValue = function(state, nameOrValue) {
        if (state.unicodeProperties.binary.test(nameOrValue)) {
          return CharSetOk;
        }
        if (state.switchV && state.unicodeProperties.binaryOfStrings.test(nameOrValue)) {
          return CharSetString;
        }
        state.raise("Invalid property name");
      };
      pp$1.regexp_eatUnicodePropertyName = function(state) {
        var ch = 0;
        state.lastStringValue = "";
        while (isUnicodePropertyNameCharacter(ch = state.current())) {
          state.lastStringValue += codePointToString(ch);
          state.advance();
        }
        return state.lastStringValue !== "";
      };
      function isUnicodePropertyNameCharacter(ch) {
        return isControlLetter(ch) || ch === 95;
      }
      pp$1.regexp_eatUnicodePropertyValue = function(state) {
        var ch = 0;
        state.lastStringValue = "";
        while (isUnicodePropertyValueCharacter(ch = state.current())) {
          state.lastStringValue += codePointToString(ch);
          state.advance();
        }
        return state.lastStringValue !== "";
      };
      function isUnicodePropertyValueCharacter(ch) {
        return isUnicodePropertyNameCharacter(ch) || isDecimalDigit(ch);
      }
      pp$1.regexp_eatLoneUnicodePropertyNameOrValue = function(state) {
        return this.regexp_eatUnicodePropertyValue(state);
      };
      pp$1.regexp_eatCharacterClass = function(state) {
        if (state.eat(
          91
          /* [ */
        )) {
          var negate = state.eat(
            94
            /* ^ */
          );
          var result = this.regexp_classContents(state);
          if (!state.eat(
            93
            /* ] */
          )) {
            state.raise("Unterminated character class");
          }
          if (negate && result === CharSetString) {
            state.raise("Negated character class may contain strings");
          }
          return true;
        }
        return false;
      };
      pp$1.regexp_classContents = function(state) {
        if (state.current() === 93) {
          return CharSetOk;
        }
        if (state.switchV) {
          return this.regexp_classSetExpression(state);
        }
        this.regexp_nonEmptyClassRanges(state);
        return CharSetOk;
      };
      pp$1.regexp_nonEmptyClassRanges = function(state) {
        while (this.regexp_eatClassAtom(state)) {
          var left = state.lastIntValue;
          if (state.eat(
            45
            /* - */
          ) && this.regexp_eatClassAtom(state)) {
            var right = state.lastIntValue;
            if (state.switchU && (left === -1 || right === -1)) {
              state.raise("Invalid character class");
            }
            if (left !== -1 && right !== -1 && left > right) {
              state.raise("Range out of order in character class");
            }
          }
        }
      };
      pp$1.regexp_eatClassAtom = function(state) {
        var start = state.pos;
        if (state.eat(
          92
          /* \ */
        )) {
          if (this.regexp_eatClassEscape(state)) {
            return true;
          }
          if (state.switchU) {
            var ch$1 = state.current();
            if (ch$1 === 99 || isOctalDigit(ch$1)) {
              state.raise("Invalid class escape");
            }
            state.raise("Invalid escape");
          }
          state.pos = start;
        }
        var ch = state.current();
        if (ch !== 93) {
          state.lastIntValue = ch;
          state.advance();
          return true;
        }
        return false;
      };
      pp$1.regexp_eatClassEscape = function(state) {
        var start = state.pos;
        if (state.eat(
          98
          /* b */
        )) {
          state.lastIntValue = 8;
          return true;
        }
        if (state.switchU && state.eat(
          45
          /* - */
        )) {
          state.lastIntValue = 45;
          return true;
        }
        if (!state.switchU && state.eat(
          99
          /* c */
        )) {
          if (this.regexp_eatClassControlLetter(state)) {
            return true;
          }
          state.pos = start;
        }
        return this.regexp_eatCharacterClassEscape(state) || this.regexp_eatCharacterEscape(state);
      };
      pp$1.regexp_classSetExpression = function(state) {
        var result = CharSetOk, subResult;
        if (this.regexp_eatClassSetRange(state)) ;
        else if (subResult = this.regexp_eatClassSetOperand(state)) {
          if (subResult === CharSetString) {
            result = CharSetString;
          }
          var start = state.pos;
          while (state.eatChars(
            [38, 38]
            /* && */
          )) {
            if (state.current() !== 38 && (subResult = this.regexp_eatClassSetOperand(state))) {
              if (subResult !== CharSetString) {
                result = CharSetOk;
              }
              continue;
            }
            state.raise("Invalid character in character class");
          }
          if (start !== state.pos) {
            return result;
          }
          while (state.eatChars(
            [45, 45]
            /* -- */
          )) {
            if (this.regexp_eatClassSetOperand(state)) {
              continue;
            }
            state.raise("Invalid character in character class");
          }
          if (start !== state.pos) {
            return result;
          }
        } else {
          state.raise("Invalid character in character class");
        }
        for (; ; ) {
          if (this.regexp_eatClassSetRange(state)) {
            continue;
          }
          subResult = this.regexp_eatClassSetOperand(state);
          if (!subResult) {
            return result;
          }
          if (subResult === CharSetString) {
            result = CharSetString;
          }
        }
      };
      pp$1.regexp_eatClassSetRange = function(state) {
        var start = state.pos;
        if (this.regexp_eatClassSetCharacter(state)) {
          var left = state.lastIntValue;
          if (state.eat(
            45
            /* - */
          ) && this.regexp_eatClassSetCharacter(state)) {
            var right = state.lastIntValue;
            if (left !== -1 && right !== -1 && left > right) {
              state.raise("Range out of order in character class");
            }
            return true;
          }
          state.pos = start;
        }
        return false;
      };
      pp$1.regexp_eatClassSetOperand = function(state) {
        if (this.regexp_eatClassSetCharacter(state)) {
          return CharSetOk;
        }
        return this.regexp_eatClassStringDisjunction(state) || this.regexp_eatNestedClass(state);
      };
      pp$1.regexp_eatNestedClass = function(state) {
        var start = state.pos;
        if (state.eat(
          91
          /* [ */
        )) {
          var negate = state.eat(
            94
            /* ^ */
          );
          var result = this.regexp_classContents(state);
          if (state.eat(
            93
            /* ] */
          )) {
            if (negate && result === CharSetString) {
              state.raise("Negated character class may contain strings");
            }
            return result;
          }
          state.pos = start;
        }
        if (state.eat(
          92
          /* \ */
        )) {
          var result$1 = this.regexp_eatCharacterClassEscape(state);
          if (result$1) {
            return result$1;
          }
          state.pos = start;
        }
        return null;
      };
      pp$1.regexp_eatClassStringDisjunction = function(state) {
        var start = state.pos;
        if (state.eatChars(
          [92, 113]
          /* \q */
        )) {
          if (state.eat(
            123
            /* { */
          )) {
            var result = this.regexp_classStringDisjunctionContents(state);
            if (state.eat(
              125
              /* } */
            )) {
              return result;
            }
          } else {
            state.raise("Invalid escape");
          }
          state.pos = start;
        }
        return null;
      };
      pp$1.regexp_classStringDisjunctionContents = function(state) {
        var result = this.regexp_classString(state);
        while (state.eat(
          124
          /* | */
        )) {
          if (this.regexp_classString(state) === CharSetString) {
            result = CharSetString;
          }
        }
        return result;
      };
      pp$1.regexp_classString = function(state) {
        var count = 0;
        while (this.regexp_eatClassSetCharacter(state)) {
          count++;
        }
        return count === 1 ? CharSetOk : CharSetString;
      };
      pp$1.regexp_eatClassSetCharacter = function(state) {
        var start = state.pos;
        if (state.eat(
          92
          /* \ */
        )) {
          if (this.regexp_eatCharacterEscape(state) || this.regexp_eatClassSetReservedPunctuator(state)) {
            return true;
          }
          if (state.eat(
            98
            /* b */
          )) {
            state.lastIntValue = 8;
            return true;
          }
          state.pos = start;
          return false;
        }
        var ch = state.current();
        if (ch < 0 || ch === state.lookahead() && isClassSetReservedDoublePunctuatorCharacter(ch)) {
          return false;
        }
        if (isClassSetSyntaxCharacter(ch)) {
          return false;
        }
        state.advance();
        state.lastIntValue = ch;
        return true;
      };
      function isClassSetReservedDoublePunctuatorCharacter(ch) {
        return ch === 33 || ch >= 35 && ch <= 38 || ch >= 42 && ch <= 44 || ch === 46 || ch >= 58 && ch <= 64 || ch === 94 || ch === 96 || ch === 126;
      }
      function isClassSetSyntaxCharacter(ch) {
        return ch === 40 || ch === 41 || ch === 45 || ch === 47 || ch >= 91 && ch <= 93 || ch >= 123 && ch <= 125;
      }
      pp$1.regexp_eatClassSetReservedPunctuator = function(state) {
        var ch = state.current();
        if (isClassSetReservedPunctuator(ch)) {
          state.lastIntValue = ch;
          state.advance();
          return true;
        }
        return false;
      };
      function isClassSetReservedPunctuator(ch) {
        return ch === 33 || ch === 35 || ch === 37 || ch === 38 || ch === 44 || ch === 45 || ch >= 58 && ch <= 62 || ch === 64 || ch === 96 || ch === 126;
      }
      pp$1.regexp_eatClassControlLetter = function(state) {
        var ch = state.current();
        if (isDecimalDigit(ch) || ch === 95) {
          state.lastIntValue = ch % 32;
          state.advance();
          return true;
        }
        return false;
      };
      pp$1.regexp_eatHexEscapeSequence = function(state) {
        var start = state.pos;
        if (state.eat(
          120
          /* x */
        )) {
          if (this.regexp_eatFixedHexDigits(state, 2)) {
            return true;
          }
          if (state.switchU) {
            state.raise("Invalid escape");
          }
          state.pos = start;
        }
        return false;
      };
      pp$1.regexp_eatDecimalDigits = function(state) {
        var start = state.pos;
        var ch = 0;
        state.lastIntValue = 0;
        while (isDecimalDigit(ch = state.current())) {
          state.lastIntValue = 10 * state.lastIntValue + (ch - 48);
          state.advance();
        }
        return state.pos !== start;
      };
      function isDecimalDigit(ch) {
        return ch >= 48 && ch <= 57;
      }
      pp$1.regexp_eatHexDigits = function(state) {
        var start = state.pos;
        var ch = 0;
        state.lastIntValue = 0;
        while (isHexDigit(ch = state.current())) {
          state.lastIntValue = 16 * state.lastIntValue + hexToInt(ch);
          state.advance();
        }
        return state.pos !== start;
      };
      function isHexDigit(ch) {
        return ch >= 48 && ch <= 57 || ch >= 65 && ch <= 70 || ch >= 97 && ch <= 102;
      }
      function hexToInt(ch) {
        if (ch >= 65 && ch <= 70) {
          return 10 + (ch - 65);
        }
        if (ch >= 97 && ch <= 102) {
          return 10 + (ch - 97);
        }
        return ch - 48;
      }
      pp$1.regexp_eatLegacyOctalEscapeSequence = function(state) {
        if (this.regexp_eatOctalDigit(state)) {
          var n1 = state.lastIntValue;
          if (this.regexp_eatOctalDigit(state)) {
            var n2 = state.lastIntValue;
            if (n1 <= 3 && this.regexp_eatOctalDigit(state)) {
              state.lastIntValue = n1 * 64 + n2 * 8 + state.lastIntValue;
            } else {
              state.lastIntValue = n1 * 8 + n2;
            }
          } else {
            state.lastIntValue = n1;
          }
          return true;
        }
        return false;
      };
      pp$1.regexp_eatOctalDigit = function(state) {
        var ch = state.current();
        if (isOctalDigit(ch)) {
          state.lastIntValue = ch - 48;
          state.advance();
          return true;
        }
        state.lastIntValue = 0;
        return false;
      };
      function isOctalDigit(ch) {
        return ch >= 48 && ch <= 55;
      }
      pp$1.regexp_eatFixedHexDigits = function(state, length) {
        var start = state.pos;
        state.lastIntValue = 0;
        for (var i2 = 0; i2 < length; ++i2) {
          var ch = state.current();
          if (!isHexDigit(ch)) {
            state.pos = start;
            return false;
          }
          state.lastIntValue = 16 * state.lastIntValue + hexToInt(ch);
          state.advance();
        }
        return true;
      };
      var Token = function Token2(p) {
        this.type = p.type;
        this.value = p.value;
        this.start = p.start;
        this.end = p.end;
        if (p.options.locations) {
          this.loc = new SourceLocation(p, p.startLoc, p.endLoc);
        }
        if (p.options.ranges) {
          this.range = [p.start, p.end];
        }
      };
      var pp = Parser.prototype;
      pp.next = function(ignoreEscapeSequenceInKeyword) {
        if (!ignoreEscapeSequenceInKeyword && this.type.keyword && this.containsEsc) {
          this.raiseRecoverable(this.start, "Escape sequence in keyword " + this.type.keyword);
        }
        if (this.options.onToken) {
          this.options.onToken(new Token(this));
        }
        this.lastTokEnd = this.end;
        this.lastTokStart = this.start;
        this.lastTokEndLoc = this.endLoc;
        this.lastTokStartLoc = this.startLoc;
        this.nextToken();
      };
      pp.getToken = function() {
        this.next();
        return new Token(this);
      };
      if (typeof Symbol !== "undefined") {
        pp[Symbol.iterator] = function() {
          var this$1$1 = this;
          return {
            next: function() {
              var token = this$1$1.getToken();
              return {
                done: token.type === types$1.eof,
                value: token
              };
            }
          };
        };
      }
      pp.nextToken = function() {
        var curContext = this.curContext();
        if (!curContext || !curContext.preserveSpace) {
          this.skipSpace();
        }
        this.start = this.pos;
        if (this.options.locations) {
          this.startLoc = this.curPosition();
        }
        if (this.pos >= this.input.length) {
          return this.finishToken(types$1.eof);
        }
        if (curContext.override) {
          return curContext.override(this);
        } else {
          this.readToken(this.fullCharCodeAtPos());
        }
      };
      pp.readToken = function(code) {
        if (isIdentifierStart(code, this.options.ecmaVersion >= 6) || code === 92) {
          return this.readWord();
        }
        return this.getTokenFromCode(code);
      };
      pp.fullCharCodeAtPos = function() {
        var code = this.input.charCodeAt(this.pos);
        if (code <= 55295 || code >= 56320) {
          return code;
        }
        var next = this.input.charCodeAt(this.pos + 1);
        return next <= 56319 || next >= 57344 ? code : (code << 10) + next - 56613888;
      };
      pp.skipBlockComment = function() {
        var startLoc = this.options.onComment && this.curPosition();
        var start = this.pos, end = this.input.indexOf("*/", this.pos += 2);
        if (end === -1) {
          this.raise(this.pos - 2, "Unterminated comment");
        }
        this.pos = end + 2;
        if (this.options.locations) {
          for (var nextBreak = void 0, pos = start; (nextBreak = nextLineBreak(this.input, pos, this.pos)) > -1; ) {
            ++this.curLine;
            pos = this.lineStart = nextBreak;
          }
        }
        if (this.options.onComment) {
          this.options.onComment(
            true,
            this.input.slice(start + 2, end),
            start,
            this.pos,
            startLoc,
            this.curPosition()
          );
        }
      };
      pp.skipLineComment = function(startSkip) {
        var start = this.pos;
        var startLoc = this.options.onComment && this.curPosition();
        var ch = this.input.charCodeAt(this.pos += startSkip);
        while (this.pos < this.input.length && !isNewLine(ch)) {
          ch = this.input.charCodeAt(++this.pos);
        }
        if (this.options.onComment) {
          this.options.onComment(
            false,
            this.input.slice(start + startSkip, this.pos),
            start,
            this.pos,
            startLoc,
            this.curPosition()
          );
        }
      };
      pp.skipSpace = function() {
        loop: while (this.pos < this.input.length) {
          var ch = this.input.charCodeAt(this.pos);
          switch (ch) {
            case 32:
            case 160:
              ++this.pos;
              break;
            case 13:
              if (this.input.charCodeAt(this.pos + 1) === 10) {
                ++this.pos;
              }
            case 10:
            case 8232:
            case 8233:
              ++this.pos;
              if (this.options.locations) {
                ++this.curLine;
                this.lineStart = this.pos;
              }
              break;
            case 47:
              switch (this.input.charCodeAt(this.pos + 1)) {
                case 42:
                  this.skipBlockComment();
                  break;
                case 47:
                  this.skipLineComment(2);
                  break;
                default:
                  break loop;
              }
              break;
            default:
              if (ch > 8 && ch < 14 || ch >= 5760 && nonASCIIwhitespace.test(String.fromCharCode(ch))) {
                ++this.pos;
              } else {
                break loop;
              }
          }
        }
      };
      pp.finishToken = function(type, val) {
        this.end = this.pos;
        if (this.options.locations) {
          this.endLoc = this.curPosition();
        }
        var prevType = this.type;
        this.type = type;
        this.value = val;
        this.updateContext(prevType);
      };
      pp.readToken_dot = function() {
        var next = this.input.charCodeAt(this.pos + 1);
        if (next >= 48 && next <= 57) {
          return this.readNumber(true);
        }
        var next2 = this.input.charCodeAt(this.pos + 2);
        if (this.options.ecmaVersion >= 6 && next === 46 && next2 === 46) {
          this.pos += 3;
          return this.finishToken(types$1.ellipsis);
        } else {
          ++this.pos;
          return this.finishToken(types$1.dot);
        }
      };
      pp.readToken_slash = function() {
        var next = this.input.charCodeAt(this.pos + 1);
        if (this.exprAllowed) {
          ++this.pos;
          return this.readRegexp();
        }
        if (next === 61) {
          return this.finishOp(types$1.assign, 2);
        }
        return this.finishOp(types$1.slash, 1);
      };
      pp.readToken_mult_modulo_exp = function(code) {
        var next = this.input.charCodeAt(this.pos + 1);
        var size = 1;
        var tokentype = code === 42 ? types$1.star : types$1.modulo;
        if (this.options.ecmaVersion >= 7 && code === 42 && next === 42) {
          ++size;
          tokentype = types$1.starstar;
          next = this.input.charCodeAt(this.pos + 2);
        }
        if (next === 61) {
          return this.finishOp(types$1.assign, size + 1);
        }
        return this.finishOp(tokentype, size);
      };
      pp.readToken_pipe_amp = function(code) {
        var next = this.input.charCodeAt(this.pos + 1);
        if (next === code) {
          if (this.options.ecmaVersion >= 12) {
            var next2 = this.input.charCodeAt(this.pos + 2);
            if (next2 === 61) {
              return this.finishOp(types$1.assign, 3);
            }
          }
          return this.finishOp(code === 124 ? types$1.logicalOR : types$1.logicalAND, 2);
        }
        if (next === 61) {
          return this.finishOp(types$1.assign, 2);
        }
        return this.finishOp(code === 124 ? types$1.bitwiseOR : types$1.bitwiseAND, 1);
      };
      pp.readToken_caret = function() {
        var next = this.input.charCodeAt(this.pos + 1);
        if (next === 61) {
          return this.finishOp(types$1.assign, 2);
        }
        return this.finishOp(types$1.bitwiseXOR, 1);
      };
      pp.readToken_plus_min = function(code) {
        var next = this.input.charCodeAt(this.pos + 1);
        if (next === code) {
          if (next === 45 && !this.inModule && this.input.charCodeAt(this.pos + 2) === 62 && (this.lastTokEnd === 0 || lineBreak.test(this.input.slice(this.lastTokEnd, this.pos)))) {
            this.skipLineComment(3);
            this.skipSpace();
            return this.nextToken();
          }
          return this.finishOp(types$1.incDec, 2);
        }
        if (next === 61) {
          return this.finishOp(types$1.assign, 2);
        }
        return this.finishOp(types$1.plusMin, 1);
      };
      pp.readToken_lt_gt = function(code) {
        var next = this.input.charCodeAt(this.pos + 1);
        var size = 1;
        if (next === code) {
          size = code === 62 && this.input.charCodeAt(this.pos + 2) === 62 ? 3 : 2;
          if (this.input.charCodeAt(this.pos + size) === 61) {
            return this.finishOp(types$1.assign, size + 1);
          }
          return this.finishOp(types$1.bitShift, size);
        }
        if (next === 33 && code === 60 && !this.inModule && this.input.charCodeAt(this.pos + 2) === 45 && this.input.charCodeAt(this.pos + 3) === 45) {
          this.skipLineComment(4);
          this.skipSpace();
          return this.nextToken();
        }
        if (next === 61) {
          size = 2;
        }
        return this.finishOp(types$1.relational, size);
      };
      pp.readToken_eq_excl = function(code) {
        var next = this.input.charCodeAt(this.pos + 1);
        if (next === 61) {
          return this.finishOp(types$1.equality, this.input.charCodeAt(this.pos + 2) === 61 ? 3 : 2);
        }
        if (code === 61 && next === 62 && this.options.ecmaVersion >= 6) {
          this.pos += 2;
          return this.finishToken(types$1.arrow);
        }
        return this.finishOp(code === 61 ? types$1.eq : types$1.prefix, 1);
      };
      pp.readToken_question = function() {
        var ecmaVersion2 = this.options.ecmaVersion;
        if (ecmaVersion2 >= 11) {
          var next = this.input.charCodeAt(this.pos + 1);
          if (next === 46) {
            var next2 = this.input.charCodeAt(this.pos + 2);
            if (next2 < 48 || next2 > 57) {
              return this.finishOp(types$1.questionDot, 2);
            }
          }
          if (next === 63) {
            if (ecmaVersion2 >= 12) {
              var next2$1 = this.input.charCodeAt(this.pos + 2);
              if (next2$1 === 61) {
                return this.finishOp(types$1.assign, 3);
              }
            }
            return this.finishOp(types$1.coalesce, 2);
          }
        }
        return this.finishOp(types$1.question, 1);
      };
      pp.readToken_numberSign = function() {
        var ecmaVersion2 = this.options.ecmaVersion;
        var code = 35;
        if (ecmaVersion2 >= 13) {
          ++this.pos;
          code = this.fullCharCodeAtPos();
          if (isIdentifierStart(code, true) || code === 92) {
            return this.finishToken(types$1.privateId, this.readWord1());
          }
        }
        this.raise(this.pos, "Unexpected character '" + codePointToString(code) + "'");
      };
      pp.getTokenFromCode = function(code) {
        switch (code) {
          // The interpretation of a dot depends on whether it is followed
          // by a digit or another two dots.
          case 46:
            return this.readToken_dot();
          // Punctuation tokens.
          case 40:
            ++this.pos;
            return this.finishToken(types$1.parenL);
          case 41:
            ++this.pos;
            return this.finishToken(types$1.parenR);
          case 59:
            ++this.pos;
            return this.finishToken(types$1.semi);
          case 44:
            ++this.pos;
            return this.finishToken(types$1.comma);
          case 91:
            ++this.pos;
            return this.finishToken(types$1.bracketL);
          case 93:
            ++this.pos;
            return this.finishToken(types$1.bracketR);
          case 123:
            ++this.pos;
            return this.finishToken(types$1.braceL);
          case 125:
            ++this.pos;
            return this.finishToken(types$1.braceR);
          case 58:
            ++this.pos;
            return this.finishToken(types$1.colon);
          case 96:
            if (this.options.ecmaVersion < 6) {
              break;
            }
            ++this.pos;
            return this.finishToken(types$1.backQuote);
          case 48:
            var next = this.input.charCodeAt(this.pos + 1);
            if (next === 120 || next === 88) {
              return this.readRadixNumber(16);
            }
            if (this.options.ecmaVersion >= 6) {
              if (next === 111 || next === 79) {
                return this.readRadixNumber(8);
              }
              if (next === 98 || next === 66) {
                return this.readRadixNumber(2);
              }
            }
          // Anything else beginning with a digit is an integer, octal
          // number, or float.
          case 49:
          case 50:
          case 51:
          case 52:
          case 53:
          case 54:
          case 55:
          case 56:
          case 57:
            return this.readNumber(false);
          // Quotes produce strings.
          case 34:
          case 39:
            return this.readString(code);
          // Operators are parsed inline in tiny state machines. '=' (61) is
          // often referred to. `finishOp` simply skips the amount of
          // characters it is given as second argument, and returns a token
          // of the type given by its first argument.
          case 47:
            return this.readToken_slash();
          case 37:
          case 42:
            return this.readToken_mult_modulo_exp(code);
          case 124:
          case 38:
            return this.readToken_pipe_amp(code);
          case 94:
            return this.readToken_caret();
          case 43:
          case 45:
            return this.readToken_plus_min(code);
          case 60:
          case 62:
            return this.readToken_lt_gt(code);
          case 61:
          case 33:
            return this.readToken_eq_excl(code);
          case 63:
            return this.readToken_question();
          case 126:
            return this.finishOp(types$1.prefix, 1);
          case 35:
            return this.readToken_numberSign();
        }
        this.raise(this.pos, "Unexpected character '" + codePointToString(code) + "'");
      };
      pp.finishOp = function(type, size) {
        var str = this.input.slice(this.pos, this.pos + size);
        this.pos += size;
        return this.finishToken(type, str);
      };
      pp.readRegexp = function() {
        var escaped, inClass, start = this.pos;
        for (; ; ) {
          if (this.pos >= this.input.length) {
            this.raise(start, "Unterminated regular expression");
          }
          var ch = this.input.charAt(this.pos);
          if (lineBreak.test(ch)) {
            this.raise(start, "Unterminated regular expression");
          }
          if (!escaped) {
            if (ch === "[") {
              inClass = true;
            } else if (ch === "]" && inClass) {
              inClass = false;
            } else if (ch === "/" && !inClass) {
              break;
            }
            escaped = ch === "\\";
          } else {
            escaped = false;
          }
          ++this.pos;
        }
        var pattern = this.input.slice(start, this.pos);
        ++this.pos;
        var flagsStart = this.pos;
        var flags = this.readWord1();
        if (this.containsEsc) {
          this.unexpected(flagsStart);
        }
        var state = this.regexpState || (this.regexpState = new RegExpValidationState(this));
        state.reset(start, pattern, flags);
        this.validateRegExpFlags(state);
        this.validateRegExpPattern(state);
        var value2 = null;
        try {
          value2 = new RegExp(pattern, flags);
        } catch (e) {
        }
        return this.finishToken(types$1.regexp, { pattern, flags, value: value2 });
      };
      pp.readInt = function(radix, len, maybeLegacyOctalNumericLiteral) {
        var allowSeparators = this.options.ecmaVersion >= 12 && len === void 0;
        var isLegacyOctalNumericLiteral = maybeLegacyOctalNumericLiteral && this.input.charCodeAt(this.pos) === 48;
        var start = this.pos, total = 0, lastCode = 0;
        for (var i2 = 0, e = len == null ? Infinity : len; i2 < e; ++i2, ++this.pos) {
          var code = this.input.charCodeAt(this.pos), val = void 0;
          if (allowSeparators && code === 95) {
            if (isLegacyOctalNumericLiteral) {
              this.raiseRecoverable(this.pos, "Numeric separator is not allowed in legacy octal numeric literals");
            }
            if (lastCode === 95) {
              this.raiseRecoverable(this.pos, "Numeric separator must be exactly one underscore");
            }
            if (i2 === 0) {
              this.raiseRecoverable(this.pos, "Numeric separator is not allowed at the first of digits");
            }
            lastCode = code;
            continue;
          }
          if (code >= 97) {
            val = code - 97 + 10;
          } else if (code >= 65) {
            val = code - 65 + 10;
          } else if (code >= 48 && code <= 57) {
            val = code - 48;
          } else {
            val = Infinity;
          }
          if (val >= radix) {
            break;
          }
          lastCode = code;
          total = total * radix + val;
        }
        if (allowSeparators && lastCode === 95) {
          this.raiseRecoverable(this.pos - 1, "Numeric separator is not allowed at the last of digits");
        }
        if (this.pos === start || len != null && this.pos - start !== len) {
          return null;
        }
        return total;
      };
      function stringToNumber(str, isLegacyOctalNumericLiteral) {
        if (isLegacyOctalNumericLiteral) {
          return parseInt(str, 8);
        }
        return parseFloat(str.replace(/_/g, ""));
      }
      function stringToBigInt(str) {
        if (typeof BigInt !== "function") {
          return null;
        }
        return BigInt(str.replace(/_/g, ""));
      }
      pp.readRadixNumber = function(radix) {
        var start = this.pos;
        this.pos += 2;
        var val = this.readInt(radix);
        if (val == null) {
          this.raise(this.start + 2, "Expected number in radix " + radix);
        }
        if (this.options.ecmaVersion >= 11 && this.input.charCodeAt(this.pos) === 110) {
          val = stringToBigInt(this.input.slice(start, this.pos));
          ++this.pos;
        } else if (isIdentifierStart(this.fullCharCodeAtPos())) {
          this.raise(this.pos, "Identifier directly after number");
        }
        return this.finishToken(types$1.num, val);
      };
      pp.readNumber = function(startsWithDot) {
        var start = this.pos;
        if (!startsWithDot && this.readInt(10, void 0, true) === null) {
          this.raise(start, "Invalid number");
        }
        var octal = this.pos - start >= 2 && this.input.charCodeAt(start) === 48;
        if (octal && this.strict) {
          this.raise(start, "Invalid number");
        }
        var next = this.input.charCodeAt(this.pos);
        if (!octal && !startsWithDot && this.options.ecmaVersion >= 11 && next === 110) {
          var val$1 = stringToBigInt(this.input.slice(start, this.pos));
          ++this.pos;
          if (isIdentifierStart(this.fullCharCodeAtPos())) {
            this.raise(this.pos, "Identifier directly after number");
          }
          return this.finishToken(types$1.num, val$1);
        }
        if (octal && /[89]/.test(this.input.slice(start, this.pos))) {
          octal = false;
        }
        if (next === 46 && !octal) {
          ++this.pos;
          this.readInt(10);
          next = this.input.charCodeAt(this.pos);
        }
        if ((next === 69 || next === 101) && !octal) {
          next = this.input.charCodeAt(++this.pos);
          if (next === 43 || next === 45) {
            ++this.pos;
          }
          if (this.readInt(10) === null) {
            this.raise(start, "Invalid number");
          }
        }
        if (isIdentifierStart(this.fullCharCodeAtPos())) {
          this.raise(this.pos, "Identifier directly after number");
        }
        var val = stringToNumber(this.input.slice(start, this.pos), octal);
        return this.finishToken(types$1.num, val);
      };
      pp.readCodePoint = function() {
        var ch = this.input.charCodeAt(this.pos), code;
        if (ch === 123) {
          if (this.options.ecmaVersion < 6) {
            this.unexpected();
          }
          var codePos = ++this.pos;
          code = this.readHexChar(this.input.indexOf("}", this.pos) - this.pos);
          ++this.pos;
          if (code > 1114111) {
            this.invalidStringToken(codePos, "Code point out of bounds");
          }
        } else {
          code = this.readHexChar(4);
        }
        return code;
      };
      pp.readString = function(quote) {
        var out = "", chunkStart = ++this.pos;
        for (; ; ) {
          if (this.pos >= this.input.length) {
            this.raise(this.start, "Unterminated string constant");
          }
          var ch = this.input.charCodeAt(this.pos);
          if (ch === quote) {
            break;
          }
          if (ch === 92) {
            out += this.input.slice(chunkStart, this.pos);
            out += this.readEscapedChar(false);
            chunkStart = this.pos;
          } else if (ch === 8232 || ch === 8233) {
            if (this.options.ecmaVersion < 10) {
              this.raise(this.start, "Unterminated string constant");
            }
            ++this.pos;
            if (this.options.locations) {
              this.curLine++;
              this.lineStart = this.pos;
            }
          } else {
            if (isNewLine(ch)) {
              this.raise(this.start, "Unterminated string constant");
            }
            ++this.pos;
          }
        }
        out += this.input.slice(chunkStart, this.pos++);
        return this.finishToken(types$1.string, out);
      };
      var INVALID_TEMPLATE_ESCAPE_ERROR = {};
      pp.tryReadTemplateToken = function() {
        this.inTemplateElement = true;
        try {
          this.readTmplToken();
        } catch (err) {
          if (err === INVALID_TEMPLATE_ESCAPE_ERROR) {
            this.readInvalidTemplateToken();
          } else {
            throw err;
          }
        }
        this.inTemplateElement = false;
      };
      pp.invalidStringToken = function(position, message) {
        if (this.inTemplateElement && this.options.ecmaVersion >= 9) {
          throw INVALID_TEMPLATE_ESCAPE_ERROR;
        } else {
          this.raise(position, message);
        }
      };
      pp.readTmplToken = function() {
        var out = "", chunkStart = this.pos;
        for (; ; ) {
          if (this.pos >= this.input.length) {
            this.raise(this.start, "Unterminated template");
          }
          var ch = this.input.charCodeAt(this.pos);
          if (ch === 96 || ch === 36 && this.input.charCodeAt(this.pos + 1) === 123) {
            if (this.pos === this.start && (this.type === types$1.template || this.type === types$1.invalidTemplate)) {
              if (ch === 36) {
                this.pos += 2;
                return this.finishToken(types$1.dollarBraceL);
              } else {
                ++this.pos;
                return this.finishToken(types$1.backQuote);
              }
            }
            out += this.input.slice(chunkStart, this.pos);
            return this.finishToken(types$1.template, out);
          }
          if (ch === 92) {
            out += this.input.slice(chunkStart, this.pos);
            out += this.readEscapedChar(true);
            chunkStart = this.pos;
          } else if (isNewLine(ch)) {
            out += this.input.slice(chunkStart, this.pos);
            ++this.pos;
            switch (ch) {
              case 13:
                if (this.input.charCodeAt(this.pos) === 10) {
                  ++this.pos;
                }
              case 10:
                out += "\n";
                break;
              default:
                out += String.fromCharCode(ch);
                break;
            }
            if (this.options.locations) {
              ++this.curLine;
              this.lineStart = this.pos;
            }
            chunkStart = this.pos;
          } else {
            ++this.pos;
          }
        }
      };
      pp.readInvalidTemplateToken = function() {
        for (; this.pos < this.input.length; this.pos++) {
          switch (this.input[this.pos]) {
            case "\\":
              ++this.pos;
              break;
            case "$":
              if (this.input[this.pos + 1] !== "{") {
                break;
              }
            // fall through
            case "`":
              return this.finishToken(types$1.invalidTemplate, this.input.slice(this.start, this.pos));
            case "\r":
              if (this.input[this.pos + 1] === "\n") {
                ++this.pos;
              }
            // fall through
            case "\n":
            case "\u2028":
            case "\u2029":
              ++this.curLine;
              this.lineStart = this.pos + 1;
              break;
          }
        }
        this.raise(this.start, "Unterminated template");
      };
      pp.readEscapedChar = function(inTemplate) {
        var ch = this.input.charCodeAt(++this.pos);
        ++this.pos;
        switch (ch) {
          case 110:
            return "\n";
          // 'n' -> '\n'
          case 114:
            return "\r";
          // 'r' -> '\r'
          case 120:
            return String.fromCharCode(this.readHexChar(2));
          // 'x'
          case 117:
            return codePointToString(this.readCodePoint());
          // 'u'
          case 116:
            return "	";
          // 't' -> '\t'
          case 98:
            return "\b";
          // 'b' -> '\b'
          case 118:
            return "\v";
          // 'v' -> '\u000b'
          case 102:
            return "\f";
          // 'f' -> '\f'
          case 13:
            if (this.input.charCodeAt(this.pos) === 10) {
              ++this.pos;
            }
          // '\r\n'
          case 10:
            if (this.options.locations) {
              this.lineStart = this.pos;
              ++this.curLine;
            }
            return "";
          case 56:
          case 57:
            if (this.strict) {
              this.invalidStringToken(
                this.pos - 1,
                "Invalid escape sequence"
              );
            }
            if (inTemplate) {
              var codePos = this.pos - 1;
              this.invalidStringToken(
                codePos,
                "Invalid escape sequence in template string"
              );
            }
          default:
            if (ch >= 48 && ch <= 55) {
              var octalStr = this.input.substr(this.pos - 1, 3).match(/^[0-7]+/)[0];
              var octal = parseInt(octalStr, 8);
              if (octal > 255) {
                octalStr = octalStr.slice(0, -1);
                octal = parseInt(octalStr, 8);
              }
              this.pos += octalStr.length - 1;
              ch = this.input.charCodeAt(this.pos);
              if ((octalStr !== "0" || ch === 56 || ch === 57) && (this.strict || inTemplate)) {
                this.invalidStringToken(
                  this.pos - 1 - octalStr.length,
                  inTemplate ? "Octal literal in template string" : "Octal literal in strict mode"
                );
              }
              return String.fromCharCode(octal);
            }
            if (isNewLine(ch)) {
              if (this.options.locations) {
                this.lineStart = this.pos;
                ++this.curLine;
              }
              return "";
            }
            return String.fromCharCode(ch);
        }
      };
      pp.readHexChar = function(len) {
        var codePos = this.pos;
        var n = this.readInt(16, len);
        if (n === null) {
          this.invalidStringToken(codePos, "Bad character escape sequence");
        }
        return n;
      };
      pp.readWord1 = function() {
        this.containsEsc = false;
        var word = "", first = true, chunkStart = this.pos;
        var astral = this.options.ecmaVersion >= 6;
        while (this.pos < this.input.length) {
          var ch = this.fullCharCodeAtPos();
          if (isIdentifierChar(ch, astral)) {
            this.pos += ch <= 65535 ? 1 : 2;
          } else if (ch === 92) {
            this.containsEsc = true;
            word += this.input.slice(chunkStart, this.pos);
            var escStart = this.pos;
            if (this.input.charCodeAt(++this.pos) !== 117) {
              this.invalidStringToken(this.pos, "Expecting Unicode escape sequence \\uXXXX");
            }
            ++this.pos;
            var esc = this.readCodePoint();
            if (!(first ? isIdentifierStart : isIdentifierChar)(esc, astral)) {
              this.invalidStringToken(escStart, "Invalid Unicode escape");
            }
            word += codePointToString(esc);
            chunkStart = this.pos;
          } else {
            break;
          }
          first = false;
        }
        return word + this.input.slice(chunkStart, this.pos);
      };
      pp.readWord = function() {
        var word = this.readWord1();
        var type = types$1.name;
        if (this.keywords.test(word)) {
          type = keywords[word];
        }
        return this.finishToken(type, word);
      };
      var version = "8.14.0";
      Parser.acorn = {
        Parser,
        version,
        defaultOptions,
        Position,
        SourceLocation,
        getLineInfo,
        Node,
        TokenType,
        tokTypes: types$1,
        keywordTypes: keywords,
        TokContext,
        tokContexts: types,
        isIdentifierChar,
        isIdentifierStart,
        Token,
        isNewLine,
        lineBreak,
        lineBreakG,
        nonASCIIwhitespace
      };
      function parse(input, options) {
        return Parser.parse(input, options);
      }
      function parseExpressionAt(input, pos, options) {
        return Parser.parseExpressionAt(input, pos, options);
      }
      function tokenizer(input, options) {
        return Parser.tokenizer(input, options);
      }
      exports3.Node = Node;
      exports3.Parser = Parser;
      exports3.Position = Position;
      exports3.SourceLocation = SourceLocation;
      exports3.TokContext = TokContext;
      exports3.Token = Token;
      exports3.TokenType = TokenType;
      exports3.defaultOptions = defaultOptions;
      exports3.getLineInfo = getLineInfo;
      exports3.isIdentifierChar = isIdentifierChar;
      exports3.isIdentifierStart = isIdentifierStart;
      exports3.isNewLine = isNewLine;
      exports3.keywordTypes = keywords;
      exports3.lineBreak = lineBreak;
      exports3.lineBreakG = lineBreakG;
      exports3.nonASCIIwhitespace = nonASCIIwhitespace;
      exports3.parse = parse;
      exports3.parseExpressionAt = parseExpressionAt;
      exports3.tokContexts = types;
      exports3.tokTypes = types$1;
      exports3.tokenizer = tokenizer;
      exports3.version = version;
    });
  }
});

// node_modules/acorn-walk/dist/walk.js
var require_walk = __commonJS({
  "node_modules/acorn-walk/dist/walk.js"(exports2, module2) {
    "use strict";
    init_cjs_shims();
    (function(global2, factory) {
      typeof exports2 === "object" && typeof module2 !== "undefined" ? factory(exports2) : typeof define === "function" && define.amd ? define(["exports"], factory) : (global2 = typeof globalThis !== "undefined" ? globalThis : global2 || self, factory((global2.acorn = global2.acorn || {}, global2.acorn.walk = {})));
    })(exports2, function(exports3) {
      "use strict";
      function simple(node, visitors, baseVisitor, state, override) {
        if (!baseVisitor) {
          baseVisitor = base;
        }
        (function c(node2, st, override2) {
          var type = override2 || node2.type;
          baseVisitor[type](node2, st, c);
          if (visitors[type]) {
            visitors[type](node2, st);
          }
        })(node, state, override);
      }
      function ancestor(node, visitors, baseVisitor, state, override) {
        var ancestors = [];
        if (!baseVisitor) {
          baseVisitor = base;
        }
        (function c(node2, st, override2) {
          var type = override2 || node2.type;
          var isNew = node2 !== ancestors[ancestors.length - 1];
          if (isNew) {
            ancestors.push(node2);
          }
          baseVisitor[type](node2, st, c);
          if (visitors[type]) {
            visitors[type](node2, st || ancestors, ancestors);
          }
          if (isNew) {
            ancestors.pop();
          }
        })(node, state, override);
      }
      function recursive(node, state, funcs, baseVisitor, override) {
        var visitor = funcs ? make(funcs, baseVisitor || void 0) : baseVisitor;
        (function c(node2, st, override2) {
          visitor[override2 || node2.type](node2, st, c);
        })(node, state, override);
      }
      function makeTest(test) {
        if (typeof test === "string") {
          return function(type) {
            return type === test;
          };
        } else if (!test) {
          return function() {
            return true;
          };
        } else {
          return test;
        }
      }
      var Found = function Found2(node, state) {
        this.node = node;
        this.state = state;
      };
      function full(node, callback, baseVisitor, state, override) {
        if (!baseVisitor) {
          baseVisitor = base;
        }
        var last;
        (function c(node2, st, override2) {
          var type = override2 || node2.type;
          baseVisitor[type](node2, st, c);
          if (last !== node2) {
            callback(node2, st, type);
            last = node2;
          }
        })(node, state, override);
      }
      function fullAncestor(node, callback, baseVisitor, state) {
        if (!baseVisitor) {
          baseVisitor = base;
        }
        var ancestors = [], last;
        (function c(node2, st, override) {
          var type = override || node2.type;
          var isNew = node2 !== ancestors[ancestors.length - 1];
          if (isNew) {
            ancestors.push(node2);
          }
          baseVisitor[type](node2, st, c);
          if (last !== node2) {
            callback(node2, st || ancestors, ancestors, type);
            last = node2;
          }
          if (isNew) {
            ancestors.pop();
          }
        })(node, state);
      }
      function findNodeAt(node, start, end, test, baseVisitor, state) {
        if (!baseVisitor) {
          baseVisitor = base;
        }
        test = makeTest(test);
        try {
          (function c(node2, st, override) {
            var type = override || node2.type;
            if ((start == null || node2.start <= start) && (end == null || node2.end >= end)) {
              baseVisitor[type](node2, st, c);
            }
            if ((start == null || node2.start === start) && (end == null || node2.end === end) && test(type, node2)) {
              throw new Found(node2, st);
            }
          })(node, state);
        } catch (e) {
          if (e instanceof Found) {
            return e;
          }
          throw e;
        }
      }
      function findNodeAround(node, pos, test, baseVisitor, state) {
        test = makeTest(test);
        if (!baseVisitor) {
          baseVisitor = base;
        }
        try {
          (function c(node2, st, override) {
            var type = override || node2.type;
            if (node2.start > pos || node2.end < pos) {
              return;
            }
            baseVisitor[type](node2, st, c);
            if (test(type, node2)) {
              throw new Found(node2, st);
            }
          })(node, state);
        } catch (e) {
          if (e instanceof Found) {
            return e;
          }
          throw e;
        }
      }
      function findNodeAfter(node, pos, test, baseVisitor, state) {
        test = makeTest(test);
        if (!baseVisitor) {
          baseVisitor = base;
        }
        try {
          (function c(node2, st, override) {
            if (node2.end < pos) {
              return;
            }
            var type = override || node2.type;
            if (node2.start >= pos && test(type, node2)) {
              throw new Found(node2, st);
            }
            baseVisitor[type](node2, st, c);
          })(node, state);
        } catch (e) {
          if (e instanceof Found) {
            return e;
          }
          throw e;
        }
      }
      function findNodeBefore(node, pos, test, baseVisitor, state) {
        test = makeTest(test);
        if (!baseVisitor) {
          baseVisitor = base;
        }
        var max;
        (function c(node2, st, override) {
          if (node2.start > pos) {
            return;
          }
          var type = override || node2.type;
          if (node2.end <= pos && (!max || max.node.end < node2.end) && test(type, node2)) {
            max = new Found(node2, st);
          }
          baseVisitor[type](node2, st, c);
        })(node, state);
        return max;
      }
      function make(funcs, baseVisitor) {
        var visitor = Object.create(baseVisitor || base);
        for (var type in funcs) {
          visitor[type] = funcs[type];
        }
        return visitor;
      }
      function skipThrough(node, st, c) {
        c(node, st);
      }
      function ignore(_node, _st, _c) {
      }
      var base = {};
      base.Program = base.BlockStatement = base.StaticBlock = function(node, st, c) {
        for (var i = 0, list = node.body; i < list.length; i += 1) {
          var stmt = list[i];
          c(stmt, st, "Statement");
        }
      };
      base.Statement = skipThrough;
      base.EmptyStatement = ignore;
      base.ExpressionStatement = base.ParenthesizedExpression = base.ChainExpression = function(node, st, c) {
        return c(node.expression, st, "Expression");
      };
      base.IfStatement = function(node, st, c) {
        c(node.test, st, "Expression");
        c(node.consequent, st, "Statement");
        if (node.alternate) {
          c(node.alternate, st, "Statement");
        }
      };
      base.LabeledStatement = function(node, st, c) {
        return c(node.body, st, "Statement");
      };
      base.BreakStatement = base.ContinueStatement = ignore;
      base.WithStatement = function(node, st, c) {
        c(node.object, st, "Expression");
        c(node.body, st, "Statement");
      };
      base.SwitchStatement = function(node, st, c) {
        c(node.discriminant, st, "Expression");
        for (var i = 0, list = node.cases; i < list.length; i += 1) {
          var cs = list[i];
          c(cs, st);
        }
      };
      base.SwitchCase = function(node, st, c) {
        if (node.test) {
          c(node.test, st, "Expression");
        }
        for (var i = 0, list = node.consequent; i < list.length; i += 1) {
          var cons = list[i];
          c(cons, st, "Statement");
        }
      };
      base.ReturnStatement = base.YieldExpression = base.AwaitExpression = function(node, st, c) {
        if (node.argument) {
          c(node.argument, st, "Expression");
        }
      };
      base.ThrowStatement = base.SpreadElement = function(node, st, c) {
        return c(node.argument, st, "Expression");
      };
      base.TryStatement = function(node, st, c) {
        c(node.block, st, "Statement");
        if (node.handler) {
          c(node.handler, st);
        }
        if (node.finalizer) {
          c(node.finalizer, st, "Statement");
        }
      };
      base.CatchClause = function(node, st, c) {
        if (node.param) {
          c(node.param, st, "Pattern");
        }
        c(node.body, st, "Statement");
      };
      base.WhileStatement = base.DoWhileStatement = function(node, st, c) {
        c(node.test, st, "Expression");
        c(node.body, st, "Statement");
      };
      base.ForStatement = function(node, st, c) {
        if (node.init) {
          c(node.init, st, "ForInit");
        }
        if (node.test) {
          c(node.test, st, "Expression");
        }
        if (node.update) {
          c(node.update, st, "Expression");
        }
        c(node.body, st, "Statement");
      };
      base.ForInStatement = base.ForOfStatement = function(node, st, c) {
        c(node.left, st, "ForInit");
        c(node.right, st, "Expression");
        c(node.body, st, "Statement");
      };
      base.ForInit = function(node, st, c) {
        if (node.type === "VariableDeclaration") {
          c(node, st);
        } else {
          c(node, st, "Expression");
        }
      };
      base.DebuggerStatement = ignore;
      base.FunctionDeclaration = function(node, st, c) {
        return c(node, st, "Function");
      };
      base.VariableDeclaration = function(node, st, c) {
        for (var i = 0, list = node.declarations; i < list.length; i += 1) {
          var decl = list[i];
          c(decl, st);
        }
      };
      base.VariableDeclarator = function(node, st, c) {
        c(node.id, st, "Pattern");
        if (node.init) {
          c(node.init, st, "Expression");
        }
      };
      base.Function = function(node, st, c) {
        if (node.id) {
          c(node.id, st, "Pattern");
        }
        for (var i = 0, list = node.params; i < list.length; i += 1) {
          var param = list[i];
          c(param, st, "Pattern");
        }
        c(node.body, st, node.expression ? "Expression" : "Statement");
      };
      base.Pattern = function(node, st, c) {
        if (node.type === "Identifier") {
          c(node, st, "VariablePattern");
        } else if (node.type === "MemberExpression") {
          c(node, st, "MemberPattern");
        } else {
          c(node, st);
        }
      };
      base.VariablePattern = ignore;
      base.MemberPattern = skipThrough;
      base.RestElement = function(node, st, c) {
        return c(node.argument, st, "Pattern");
      };
      base.ArrayPattern = function(node, st, c) {
        for (var i = 0, list = node.elements; i < list.length; i += 1) {
          var elt = list[i];
          if (elt) {
            c(elt, st, "Pattern");
          }
        }
      };
      base.ObjectPattern = function(node, st, c) {
        for (var i = 0, list = node.properties; i < list.length; i += 1) {
          var prop = list[i];
          if (prop.type === "Property") {
            if (prop.computed) {
              c(prop.key, st, "Expression");
            }
            c(prop.value, st, "Pattern");
          } else if (prop.type === "RestElement") {
            c(prop.argument, st, "Pattern");
          }
        }
      };
      base.Expression = skipThrough;
      base.ThisExpression = base.Super = base.MetaProperty = ignore;
      base.ArrayExpression = function(node, st, c) {
        for (var i = 0, list = node.elements; i < list.length; i += 1) {
          var elt = list[i];
          if (elt) {
            c(elt, st, "Expression");
          }
        }
      };
      base.ObjectExpression = function(node, st, c) {
        for (var i = 0, list = node.properties; i < list.length; i += 1) {
          var prop = list[i];
          c(prop, st);
        }
      };
      base.FunctionExpression = base.ArrowFunctionExpression = base.FunctionDeclaration;
      base.SequenceExpression = function(node, st, c) {
        for (var i = 0, list = node.expressions; i < list.length; i += 1) {
          var expr = list[i];
          c(expr, st, "Expression");
        }
      };
      base.TemplateLiteral = function(node, st, c) {
        for (var i = 0, list = node.quasis; i < list.length; i += 1) {
          var quasi = list[i];
          c(quasi, st);
        }
        for (var i$1 = 0, list$1 = node.expressions; i$1 < list$1.length; i$1 += 1) {
          var expr = list$1[i$1];
          c(expr, st, "Expression");
        }
      };
      base.TemplateElement = ignore;
      base.UnaryExpression = base.UpdateExpression = function(node, st, c) {
        c(node.argument, st, "Expression");
      };
      base.BinaryExpression = base.LogicalExpression = function(node, st, c) {
        c(node.left, st, "Expression");
        c(node.right, st, "Expression");
      };
      base.AssignmentExpression = base.AssignmentPattern = function(node, st, c) {
        c(node.left, st, "Pattern");
        c(node.right, st, "Expression");
      };
      base.ConditionalExpression = function(node, st, c) {
        c(node.test, st, "Expression");
        c(node.consequent, st, "Expression");
        c(node.alternate, st, "Expression");
      };
      base.NewExpression = base.CallExpression = function(node, st, c) {
        c(node.callee, st, "Expression");
        if (node.arguments) {
          for (var i = 0, list = node.arguments; i < list.length; i += 1) {
            var arg = list[i];
            c(arg, st, "Expression");
          }
        }
      };
      base.MemberExpression = function(node, st, c) {
        c(node.object, st, "Expression");
        if (node.computed) {
          c(node.property, st, "Expression");
        }
      };
      base.ExportNamedDeclaration = base.ExportDefaultDeclaration = function(node, st, c) {
        if (node.declaration) {
          c(node.declaration, st, node.type === "ExportNamedDeclaration" || node.declaration.id ? "Statement" : "Expression");
        }
        if (node.source) {
          c(node.source, st, "Expression");
        }
      };
      base.ExportAllDeclaration = function(node, st, c) {
        if (node.exported) {
          c(node.exported, st);
        }
        c(node.source, st, "Expression");
      };
      base.ImportDeclaration = function(node, st, c) {
        for (var i = 0, list = node.specifiers; i < list.length; i += 1) {
          var spec = list[i];
          c(spec, st);
        }
        c(node.source, st, "Expression");
      };
      base.ImportExpression = function(node, st, c) {
        c(node.source, st, "Expression");
      };
      base.ImportSpecifier = base.ImportDefaultSpecifier = base.ImportNamespaceSpecifier = base.Identifier = base.PrivateIdentifier = base.Literal = ignore;
      base.TaggedTemplateExpression = function(node, st, c) {
        c(node.tag, st, "Expression");
        c(node.quasi, st, "Expression");
      };
      base.ClassDeclaration = base.ClassExpression = function(node, st, c) {
        return c(node, st, "Class");
      };
      base.Class = function(node, st, c) {
        if (node.id) {
          c(node.id, st, "Pattern");
        }
        if (node.superClass) {
          c(node.superClass, st, "Expression");
        }
        c(node.body, st);
      };
      base.ClassBody = function(node, st, c) {
        for (var i = 0, list = node.body; i < list.length; i += 1) {
          var elt = list[i];
          c(elt, st);
        }
      };
      base.MethodDefinition = base.PropertyDefinition = base.Property = function(node, st, c) {
        if (node.computed) {
          c(node.key, st, "Expression");
        }
        if (node.value) {
          c(node.value, st, "Expression");
        }
      };
      exports3.ancestor = ancestor;
      exports3.base = base;
      exports3.findNodeAfter = findNodeAfter;
      exports3.findNodeAround = findNodeAround;
      exports3.findNodeAt = findNodeAt;
      exports3.findNodeBefore = findNodeBefore;
      exports3.full = full;
      exports3.fullAncestor = fullAncestor;
      exports3.make = make;
      exports3.recursive = recursive;
      exports3.simple = simple;
    });
  }
});

// node_modules/ts-node/dist-raw/node-internal-repl-await.js
var require_node_internal_repl_await = __commonJS({
  "node_modules/ts-node/dist-raw/node-internal-repl-await.js"(exports2, module2) {
    "use strict";
    init_cjs_shims();
    var {
      ArrayFrom,
      ArrayPrototypeForEach,
      ArrayPrototypeIncludes,
      ArrayPrototypeJoin,
      ArrayPrototypePop,
      ArrayPrototypePush,
      FunctionPrototype,
      ObjectKeys,
      RegExpPrototypeSymbolReplace,
      StringPrototypeEndsWith,
      StringPrototypeIncludes,
      StringPrototypeIndexOf,
      StringPrototypeRepeat,
      StringPrototypeSplit,
      StringPrototypeStartsWith,
      SyntaxError: SyntaxError2
    } = require_node_primordials();
    var parser = require_acorn().Parser;
    var walk = require_walk();
    var { Recoverable } = require("repl");
    function isTopLevelDeclaration(state) {
      return state.ancestors[state.ancestors.length - 2] === state.body;
    }
    var noop = FunctionPrototype;
    var visitorsWithoutAncestors = {
      ClassDeclaration(node, state, c) {
        if (isTopLevelDeclaration(state)) {
          state.prepend(node, `${node.id.name}=`);
          ArrayPrototypePush(
            state.hoistedDeclarationStatements,
            `let ${node.id.name}; `
          );
        }
        walk.base.ClassDeclaration(node, state, c);
      },
      ForOfStatement(node, state, c) {
        if (node.await === true) {
          state.containsAwait = true;
        }
        walk.base.ForOfStatement(node, state, c);
      },
      FunctionDeclaration(node, state, c) {
        state.prepend(node, `${node.id.name}=`);
        ArrayPrototypePush(
          state.hoistedDeclarationStatements,
          `var ${node.id.name}; `
        );
      },
      FunctionExpression: noop,
      ArrowFunctionExpression: noop,
      MethodDefinition: noop,
      AwaitExpression(node, state, c) {
        state.containsAwait = true;
        walk.base.AwaitExpression(node, state, c);
      },
      ReturnStatement(node, state, c) {
        state.containsReturn = true;
        walk.base.ReturnStatement(node, state, c);
      },
      VariableDeclaration(node, state, c) {
        const variableKind = node.kind;
        const isIterableForDeclaration = ArrayPrototypeIncludes(
          ["ForOfStatement", "ForInStatement"],
          state.ancestors[state.ancestors.length - 2].type
        );
        if (variableKind === "var" || isTopLevelDeclaration(state)) {
          let registerVariableDeclarationIdentifiers = function(node2) {
            switch (node2.type) {
              case "Identifier":
                ArrayPrototypePush(
                  variableIdentifiersToHoist[variableKind === "var" ? 0 : 1][1],
                  node2.name
                );
                break;
              case "ObjectPattern":
                ArrayPrototypeForEach(node2.properties, (property) => {
                  registerVariableDeclarationIdentifiers(property.value);
                });
                break;
              case "ArrayPattern":
                ArrayPrototypeForEach(node2.elements, (element) => {
                  registerVariableDeclarationIdentifiers(element);
                });
                break;
            }
          };
          state.replace(
            node.start,
            node.start + variableKind.length + (isIterableForDeclaration ? 1 : 0),
            variableKind === "var" && isIterableForDeclaration ? "" : "void" + (node.declarations.length === 1 ? "" : " (")
          );
          if (!isIterableForDeclaration) {
            ArrayPrototypeForEach(node.declarations, (decl) => {
              state.prepend(decl, "(");
              state.append(decl, decl.init ? ")" : "=undefined)");
            });
            if (node.declarations.length !== 1) {
              state.append(node.declarations[node.declarations.length - 1], ")");
            }
          }
          const variableIdentifiersToHoist = [
            ["var", []],
            ["let", []]
          ];
          ArrayPrototypeForEach(node.declarations, (decl) => {
            registerVariableDeclarationIdentifiers(decl.id);
          });
          ArrayPrototypeForEach(
            variableIdentifiersToHoist,
            ({ 0: kind, 1: identifiers }) => {
              if (identifiers.length > 0) {
                ArrayPrototypePush(
                  state.hoistedDeclarationStatements,
                  `${kind} ${ArrayPrototypeJoin(identifiers, ", ")}; `
                );
              }
            }
          );
        }
        walk.base.VariableDeclaration(node, state, c);
      }
    };
    var visitors = {};
    for (const nodeType of ObjectKeys(walk.base)) {
      const callback = visitorsWithoutAncestors[nodeType] || walk.base[nodeType];
      visitors[nodeType] = (node, state, c) => {
        const isNew = node !== state.ancestors[state.ancestors.length - 1];
        if (isNew) {
          ArrayPrototypePush(state.ancestors, node);
        }
        callback(node, state, c);
        if (isNew) {
          ArrayPrototypePop(state.ancestors);
        }
      };
    }
    function processTopLevelAwait(src) {
      const wrapPrefix = "(async () => { ";
      const wrapped = `${wrapPrefix}${src} })()`;
      const wrappedArray = ArrayFrom(wrapped);
      let root;
      try {
        root = parser.parse(wrapped, { ecmaVersion: "latest" });
      } catch (e) {
        if (StringPrototypeStartsWith(e.message, "Unterminated "))
          throw new Recoverable(e);
        const awaitPos = StringPrototypeIndexOf(src, "await");
        const errPos = e.pos - wrapPrefix.length;
        if (awaitPos > errPos)
          return null;
        if (errPos === awaitPos + 6 && StringPrototypeIncludes(e.message, "Expecting Unicode escape sequence"))
          return null;
        if (errPos === awaitPos + 7 && StringPrototypeIncludes(e.message, "Unexpected token"))
          return null;
        const line = e.loc.line;
        const column2 = line === 1 ? e.loc.column - wrapPrefix.length : e.loc.column;
        let message = "\n" + StringPrototypeSplit(src, "\n")[line - 1] + "\n" + StringPrototypeRepeat(" ", column2) + "^\n\n" + RegExpPrototypeSymbolReplace(/ \([^)]+\)/, e.message, "");
        if (StringPrototypeEndsWith(message, "Unexpected token"))
          message += " '" + // Wrapper end may cause acorn to report error position after the source
          (src.length - 1 >= e.pos - wrapPrefix.length ? src[e.pos - wrapPrefix.length] : src[src.length - 1]) + "'";
        throw new SyntaxError2(message);
      }
      const body = root.body[0].expression.callee.body;
      const state = {
        body,
        ancestors: [],
        hoistedDeclarationStatements: [],
        replace(from, to, str) {
          for (let i = from; i < to; i++) {
            wrappedArray[i] = "";
          }
          if (from === to) str += wrappedArray[from];
          wrappedArray[from] = str;
        },
        prepend(node, str) {
          wrappedArray[node.start] = str + wrappedArray[node.start];
        },
        append(node, str) {
          wrappedArray[node.end - 1] += str;
        },
        containsAwait: false,
        containsReturn: false
      };
      walk.recursive(body, state, visitors);
      if (!state.containsAwait || state.containsReturn) {
        return null;
      }
      const last = body.body[body.body.length - 1];
      if (last.type === "ExpressionStatement") {
        state.prepend(last, "return (");
        state.append(last.expression, ")");
      }
      return ArrayPrototypeJoin(state.hoistedDeclarationStatements, "") + ArrayPrototypeJoin(wrappedArray, "");
    }
    module2.exports = {
      processTopLevelAwait
    };
  }
});

// node_modules/diff/lib/index.es6.js
var index_es6_exports = {};
__export(index_es6_exports, {
  Diff: () => Diff,
  applyPatch: () => applyPatch,
  applyPatches: () => applyPatches,
  canonicalize: () => canonicalize,
  convertChangesToDMP: () => convertChangesToDMP,
  convertChangesToXML: () => convertChangesToXML,
  createPatch: () => createPatch,
  createTwoFilesPatch: () => createTwoFilesPatch,
  diffArrays: () => diffArrays,
  diffChars: () => diffChars,
  diffCss: () => diffCss,
  diffJson: () => diffJson,
  diffLines: () => diffLines,
  diffSentences: () => diffSentences,
  diffTrimmedLines: () => diffTrimmedLines,
  diffWords: () => diffWords,
  diffWordsWithSpace: () => diffWordsWithSpace,
  merge: () => merge,
  parsePatch: () => parsePatch,
  structuredPatch: () => structuredPatch
});
function Diff() {
}
function buildValues(diff2, components, newString, oldString, useLongestToken) {
  var componentPos = 0, componentLen = components.length, newPos = 0, oldPos = 0;
  for (; componentPos < componentLen; componentPos++) {
    var component = components[componentPos];
    if (!component.removed) {
      if (!component.added && useLongestToken) {
        var value2 = newString.slice(newPos, newPos + component.count);
        value2 = value2.map(function(value3, i) {
          var oldValue = oldString[oldPos + i];
          return oldValue.length > value3.length ? oldValue : value3;
        });
        component.value = diff2.join(value2);
      } else {
        component.value = diff2.join(newString.slice(newPos, newPos + component.count));
      }
      newPos += component.count;
      if (!component.added) {
        oldPos += component.count;
      }
    } else {
      component.value = diff2.join(oldString.slice(oldPos, oldPos + component.count));
      oldPos += component.count;
      if (componentPos && components[componentPos - 1].added) {
        var tmp = components[componentPos - 1];
        components[componentPos - 1] = components[componentPos];
        components[componentPos] = tmp;
      }
    }
  }
  var lastComponent = components[componentLen - 1];
  if (componentLen > 1 && typeof lastComponent.value === "string" && (lastComponent.added || lastComponent.removed) && diff2.equals("", lastComponent.value)) {
    components[componentLen - 2].value += lastComponent.value;
    components.pop();
  }
  return components;
}
function clonePath(path3) {
  return {
    newPos: path3.newPos,
    components: path3.components.slice(0)
  };
}
function diffChars(oldStr, newStr, options) {
  return characterDiff.diff(oldStr, newStr, options);
}
function generateOptions(options, defaults) {
  if (typeof options === "function") {
    defaults.callback = options;
  } else if (options) {
    for (var name in options) {
      if (options.hasOwnProperty(name)) {
        defaults[name] = options[name];
      }
    }
  }
  return defaults;
}
function diffWords(oldStr, newStr, options) {
  options = generateOptions(options, {
    ignoreWhitespace: true
  });
  return wordDiff.diff(oldStr, newStr, options);
}
function diffWordsWithSpace(oldStr, newStr, options) {
  return wordDiff.diff(oldStr, newStr, options);
}
function diffLines(oldStr, newStr, callback) {
  return lineDiff.diff(oldStr, newStr, callback);
}
function diffTrimmedLines(oldStr, newStr, callback) {
  var options = generateOptions(callback, {
    ignoreWhitespace: true
  });
  return lineDiff.diff(oldStr, newStr, options);
}
function diffSentences(oldStr, newStr, callback) {
  return sentenceDiff.diff(oldStr, newStr, callback);
}
function diffCss(oldStr, newStr, callback) {
  return cssDiff.diff(oldStr, newStr, callback);
}
function _typeof(obj) {
  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    _typeof = function(obj2) {
      return typeof obj2;
    };
  } else {
    _typeof = function(obj2) {
      return obj2 && typeof Symbol === "function" && obj2.constructor === Symbol && obj2 !== Symbol.prototype ? "symbol" : typeof obj2;
    };
  }
  return _typeof(obj);
}
function _toConsumableArray(arr) {
  return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread();
}
function _arrayWithoutHoles(arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];
    return arr2;
  }
}
function _iterableToArray(iter) {
  if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter);
}
function _nonIterableSpread() {
  throw new TypeError("Invalid attempt to spread non-iterable instance");
}
function diffJson(oldObj, newObj, options) {
  return jsonDiff.diff(oldObj, newObj, options);
}
function canonicalize(obj, stack, replacementStack, replacer, key) {
  stack = stack || [];
  replacementStack = replacementStack || [];
  if (replacer) {
    obj = replacer(key, obj);
  }
  var i;
  for (i = 0; i < stack.length; i += 1) {
    if (stack[i] === obj) {
      return replacementStack[i];
    }
  }
  var canonicalizedObj;
  if ("[object Array]" === objectPrototypeToString.call(obj)) {
    stack.push(obj);
    canonicalizedObj = new Array(obj.length);
    replacementStack.push(canonicalizedObj);
    for (i = 0; i < obj.length; i += 1) {
      canonicalizedObj[i] = canonicalize(obj[i], stack, replacementStack, replacer, key);
    }
    stack.pop();
    replacementStack.pop();
    return canonicalizedObj;
  }
  if (obj && obj.toJSON) {
    obj = obj.toJSON();
  }
  if (_typeof(obj) === "object" && obj !== null) {
    stack.push(obj);
    canonicalizedObj = {};
    replacementStack.push(canonicalizedObj);
    var sortedKeys = [], _key;
    for (_key in obj) {
      if (obj.hasOwnProperty(_key)) {
        sortedKeys.push(_key);
      }
    }
    sortedKeys.sort();
    for (i = 0; i < sortedKeys.length; i += 1) {
      _key = sortedKeys[i];
      canonicalizedObj[_key] = canonicalize(obj[_key], stack, replacementStack, replacer, _key);
    }
    stack.pop();
    replacementStack.pop();
  } else {
    canonicalizedObj = obj;
  }
  return canonicalizedObj;
}
function diffArrays(oldArr, newArr, callback) {
  return arrayDiff.diff(oldArr, newArr, callback);
}
function parsePatch(uniDiff) {
  var options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  var diffstr = uniDiff.split(/\r\n|[\n\v\f\r\x85]/), delimiters = uniDiff.match(/\r\n|[\n\v\f\r\x85]/g) || [], list = [], i = 0;
  function parseIndex() {
    var index = {};
    list.push(index);
    while (i < diffstr.length) {
      var line = diffstr[i];
      if (/^(\-\-\-|\+\+\+|@@)\s/.test(line)) {
        break;
      }
      var header = /^(?:Index:|diff(?: -r \w+)+)\s+(.+?)\s*$/.exec(line);
      if (header) {
        index.index = header[1];
      }
      i++;
    }
    parseFileHeader(index);
    parseFileHeader(index);
    index.hunks = [];
    while (i < diffstr.length) {
      var _line = diffstr[i];
      if (/^(Index:|diff|\-\-\-|\+\+\+)\s/.test(_line)) {
        break;
      } else if (/^@@/.test(_line)) {
        index.hunks.push(parseHunk());
      } else if (_line && options.strict) {
        throw new Error("Unknown line " + (i + 1) + " " + JSON.stringify(_line));
      } else {
        i++;
      }
    }
  }
  function parseFileHeader(index) {
    var fileHeader = /^(---|\+\+\+)\s+(.*)$/.exec(diffstr[i]);
    if (fileHeader) {
      var keyPrefix = fileHeader[1] === "---" ? "old" : "new";
      var data = fileHeader[2].split("	", 2);
      var fileName = data[0].replace(/\\\\/g, "\\");
      if (/^".*"$/.test(fileName)) {
        fileName = fileName.substr(1, fileName.length - 2);
      }
      index[keyPrefix + "FileName"] = fileName;
      index[keyPrefix + "Header"] = (data[1] || "").trim();
      i++;
    }
  }
  function parseHunk() {
    var chunkHeaderIndex = i, chunkHeaderLine = diffstr[i++], chunkHeader = chunkHeaderLine.split(/@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
    var hunk = {
      oldStart: +chunkHeader[1],
      oldLines: +chunkHeader[2] || 1,
      newStart: +chunkHeader[3],
      newLines: +chunkHeader[4] || 1,
      lines: [],
      linedelimiters: []
    };
    var addCount = 0, removeCount = 0;
    for (; i < diffstr.length; i++) {
      if (diffstr[i].indexOf("--- ") === 0 && i + 2 < diffstr.length && diffstr[i + 1].indexOf("+++ ") === 0 && diffstr[i + 2].indexOf("@@") === 0) {
        break;
      }
      var operation = diffstr[i].length == 0 && i != diffstr.length - 1 ? " " : diffstr[i][0];
      if (operation === "+" || operation === "-" || operation === " " || operation === "\\") {
        hunk.lines.push(diffstr[i]);
        hunk.linedelimiters.push(delimiters[i] || "\n");
        if (operation === "+") {
          addCount++;
        } else if (operation === "-") {
          removeCount++;
        } else if (operation === " ") {
          addCount++;
          removeCount++;
        }
      } else {
        break;
      }
    }
    if (!addCount && hunk.newLines === 1) {
      hunk.newLines = 0;
    }
    if (!removeCount && hunk.oldLines === 1) {
      hunk.oldLines = 0;
    }
    if (options.strict) {
      if (addCount !== hunk.newLines) {
        throw new Error("Added line count did not match for hunk at line " + (chunkHeaderIndex + 1));
      }
      if (removeCount !== hunk.oldLines) {
        throw new Error("Removed line count did not match for hunk at line " + (chunkHeaderIndex + 1));
      }
    }
    return hunk;
  }
  while (i < diffstr.length) {
    parseIndex();
  }
  return list;
}
function distanceIterator(start, minLine, maxLine) {
  var wantForward = true, backwardExhausted = false, forwardExhausted = false, localOffset = 1;
  return function iterator() {
    if (wantForward && !forwardExhausted) {
      if (backwardExhausted) {
        localOffset++;
      } else {
        wantForward = false;
      }
      if (start + localOffset <= maxLine) {
        return localOffset;
      }
      forwardExhausted = true;
    }
    if (!backwardExhausted) {
      if (!forwardExhausted) {
        wantForward = true;
      }
      if (minLine <= start - localOffset) {
        return -localOffset++;
      }
      backwardExhausted = true;
      return iterator();
    }
  };
}
function applyPatch(source, uniDiff) {
  var options = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  if (typeof uniDiff === "string") {
    uniDiff = parsePatch(uniDiff);
  }
  if (Array.isArray(uniDiff)) {
    if (uniDiff.length > 1) {
      throw new Error("applyPatch only works with a single input.");
    }
    uniDiff = uniDiff[0];
  }
  var lines = source.split(/\r\n|[\n\v\f\r\x85]/), delimiters = source.match(/\r\n|[\n\v\f\r\x85]/g) || [], hunks = uniDiff.hunks, compareLine = options.compareLine || function(lineNumber, line2, operation2, patchContent) {
    return line2 === patchContent;
  }, errorCount = 0, fuzzFactor = options.fuzzFactor || 0, minLine = 0, offset = 0, removeEOFNL, addEOFNL;
  function hunkFits(hunk2, toPos2) {
    for (var j2 = 0; j2 < hunk2.lines.length; j2++) {
      var line2 = hunk2.lines[j2], operation2 = line2.length > 0 ? line2[0] : " ", content2 = line2.length > 0 ? line2.substr(1) : line2;
      if (operation2 === " " || operation2 === "-") {
        if (!compareLine(toPos2 + 1, lines[toPos2], operation2, content2)) {
          errorCount++;
          if (errorCount > fuzzFactor) {
            return false;
          }
        }
        toPos2++;
      }
    }
    return true;
  }
  for (var i = 0; i < hunks.length; i++) {
    var hunk = hunks[i], maxLine = lines.length - hunk.oldLines, localOffset = 0, toPos = offset + hunk.oldStart - 1;
    var iterator = distanceIterator(toPos, minLine, maxLine);
    for (; localOffset !== void 0; localOffset = iterator()) {
      if (hunkFits(hunk, toPos + localOffset)) {
        hunk.offset = offset += localOffset;
        break;
      }
    }
    if (localOffset === void 0) {
      return false;
    }
    minLine = hunk.offset + hunk.oldStart + hunk.oldLines;
  }
  var diffOffset = 0;
  for (var _i = 0; _i < hunks.length; _i++) {
    var _hunk = hunks[_i], _toPos = _hunk.oldStart + _hunk.offset + diffOffset - 1;
    diffOffset += _hunk.newLines - _hunk.oldLines;
    if (_toPos < 0) {
      _toPos = 0;
    }
    for (var j = 0; j < _hunk.lines.length; j++) {
      var line = _hunk.lines[j], operation = line.length > 0 ? line[0] : " ", content = line.length > 0 ? line.substr(1) : line, delimiter = _hunk.linedelimiters[j];
      if (operation === " ") {
        _toPos++;
      } else if (operation === "-") {
        lines.splice(_toPos, 1);
        delimiters.splice(_toPos, 1);
      } else if (operation === "+") {
        lines.splice(_toPos, 0, content);
        delimiters.splice(_toPos, 0, delimiter);
        _toPos++;
      } else if (operation === "\\") {
        var previousOperation = _hunk.lines[j - 1] ? _hunk.lines[j - 1][0] : null;
        if (previousOperation === "+") {
          removeEOFNL = true;
        } else if (previousOperation === "-") {
          addEOFNL = true;
        }
      }
    }
  }
  if (removeEOFNL) {
    while (!lines[lines.length - 1]) {
      lines.pop();
      delimiters.pop();
    }
  } else if (addEOFNL) {
    lines.push("");
    delimiters.push("\n");
  }
  for (var _k = 0; _k < lines.length - 1; _k++) {
    lines[_k] = lines[_k] + delimiters[_k];
  }
  return lines.join("");
}
function applyPatches(uniDiff, options) {
  if (typeof uniDiff === "string") {
    uniDiff = parsePatch(uniDiff);
  }
  var currentIndex = 0;
  function processIndex() {
    var index = uniDiff[currentIndex++];
    if (!index) {
      return options.complete();
    }
    options.loadFile(index, function(err, data) {
      if (err) {
        return options.complete(err);
      }
      var updatedContent = applyPatch(data, index, options);
      options.patched(index, updatedContent, function(err2) {
        if (err2) {
          return options.complete(err2);
        }
        processIndex();
      });
    });
  }
  processIndex();
}
function structuredPatch(oldFileName, newFileName, oldStr, newStr, oldHeader, newHeader, options) {
  if (!options) {
    options = {};
  }
  if (typeof options.context === "undefined") {
    options.context = 4;
  }
  var diff2 = diffLines(oldStr, newStr, options);
  diff2.push({
    value: "",
    lines: []
  });
  function contextLines(lines) {
    return lines.map(function(entry) {
      return " " + entry;
    });
  }
  var hunks = [];
  var oldRangeStart = 0, newRangeStart = 0, curRange = [], oldLine = 1, newLine = 1;
  var _loop = function _loop2(i2) {
    var current = diff2[i2], lines = current.lines || current.value.replace(/\n$/, "").split("\n");
    current.lines = lines;
    if (current.added || current.removed) {
      var _curRange;
      if (!oldRangeStart) {
        var prev = diff2[i2 - 1];
        oldRangeStart = oldLine;
        newRangeStart = newLine;
        if (prev) {
          curRange = options.context > 0 ? contextLines(prev.lines.slice(-options.context)) : [];
          oldRangeStart -= curRange.length;
          newRangeStart -= curRange.length;
        }
      }
      (_curRange = curRange).push.apply(_curRange, _toConsumableArray(lines.map(function(entry) {
        return (current.added ? "+" : "-") + entry;
      })));
      if (current.added) {
        newLine += lines.length;
      } else {
        oldLine += lines.length;
      }
    } else {
      if (oldRangeStart) {
        if (lines.length <= options.context * 2 && i2 < diff2.length - 2) {
          var _curRange2;
          (_curRange2 = curRange).push.apply(_curRange2, _toConsumableArray(contextLines(lines)));
        } else {
          var _curRange3;
          var contextSize = Math.min(lines.length, options.context);
          (_curRange3 = curRange).push.apply(_curRange3, _toConsumableArray(contextLines(lines.slice(0, contextSize))));
          var hunk = {
            oldStart: oldRangeStart,
            oldLines: oldLine - oldRangeStart + contextSize,
            newStart: newRangeStart,
            newLines: newLine - newRangeStart + contextSize,
            lines: curRange
          };
          if (i2 >= diff2.length - 2 && lines.length <= options.context) {
            var oldEOFNewline = /\n$/.test(oldStr);
            var newEOFNewline = /\n$/.test(newStr);
            var noNlBeforeAdds = lines.length == 0 && curRange.length > hunk.oldLines;
            if (!oldEOFNewline && noNlBeforeAdds) {
              curRange.splice(hunk.oldLines, 0, "\\ No newline at end of file");
            }
            if (!oldEOFNewline && !noNlBeforeAdds || !newEOFNewline) {
              curRange.push("\\ No newline at end of file");
            }
          }
          hunks.push(hunk);
          oldRangeStart = 0;
          newRangeStart = 0;
          curRange = [];
        }
      }
      oldLine += lines.length;
      newLine += lines.length;
    }
  };
  for (var i = 0; i < diff2.length; i++) {
    _loop(i);
  }
  return {
    oldFileName,
    newFileName,
    oldHeader,
    newHeader,
    hunks
  };
}
function createTwoFilesPatch(oldFileName, newFileName, oldStr, newStr, oldHeader, newHeader, options) {
  var diff2 = structuredPatch(oldFileName, newFileName, oldStr, newStr, oldHeader, newHeader, options);
  var ret = [];
  if (oldFileName == newFileName) {
    ret.push("Index: " + oldFileName);
  }
  ret.push("===================================================================");
  ret.push("--- " + diff2.oldFileName + (typeof diff2.oldHeader === "undefined" ? "" : "	" + diff2.oldHeader));
  ret.push("+++ " + diff2.newFileName + (typeof diff2.newHeader === "undefined" ? "" : "	" + diff2.newHeader));
  for (var i = 0; i < diff2.hunks.length; i++) {
    var hunk = diff2.hunks[i];
    ret.push("@@ -" + hunk.oldStart + "," + hunk.oldLines + " +" + hunk.newStart + "," + hunk.newLines + " @@");
    ret.push.apply(ret, hunk.lines);
  }
  return ret.join("\n") + "\n";
}
function createPatch(fileName, oldStr, newStr, oldHeader, newHeader, options) {
  return createTwoFilesPatch(fileName, fileName, oldStr, newStr, oldHeader, newHeader, options);
}
function arrayEqual(a, b) {
  if (a.length !== b.length) {
    return false;
  }
  return arrayStartsWith(a, b);
}
function arrayStartsWith(array, start) {
  if (start.length > array.length) {
    return false;
  }
  for (var i = 0; i < start.length; i++) {
    if (start[i] !== array[i]) {
      return false;
    }
  }
  return true;
}
function calcLineCount(hunk) {
  var _calcOldNewLineCount = calcOldNewLineCount(hunk.lines), oldLines = _calcOldNewLineCount.oldLines, newLines = _calcOldNewLineCount.newLines;
  if (oldLines !== void 0) {
    hunk.oldLines = oldLines;
  } else {
    delete hunk.oldLines;
  }
  if (newLines !== void 0) {
    hunk.newLines = newLines;
  } else {
    delete hunk.newLines;
  }
}
function merge(mine, theirs, base) {
  mine = loadPatch(mine, base);
  theirs = loadPatch(theirs, base);
  var ret = {};
  if (mine.index || theirs.index) {
    ret.index = mine.index || theirs.index;
  }
  if (mine.newFileName || theirs.newFileName) {
    if (!fileNameChanged(mine)) {
      ret.oldFileName = theirs.oldFileName || mine.oldFileName;
      ret.newFileName = theirs.newFileName || mine.newFileName;
      ret.oldHeader = theirs.oldHeader || mine.oldHeader;
      ret.newHeader = theirs.newHeader || mine.newHeader;
    } else if (!fileNameChanged(theirs)) {
      ret.oldFileName = mine.oldFileName;
      ret.newFileName = mine.newFileName;
      ret.oldHeader = mine.oldHeader;
      ret.newHeader = mine.newHeader;
    } else {
      ret.oldFileName = selectField(ret, mine.oldFileName, theirs.oldFileName);
      ret.newFileName = selectField(ret, mine.newFileName, theirs.newFileName);
      ret.oldHeader = selectField(ret, mine.oldHeader, theirs.oldHeader);
      ret.newHeader = selectField(ret, mine.newHeader, theirs.newHeader);
    }
  }
  ret.hunks = [];
  var mineIndex = 0, theirsIndex = 0, mineOffset = 0, theirsOffset = 0;
  while (mineIndex < mine.hunks.length || theirsIndex < theirs.hunks.length) {
    var mineCurrent = mine.hunks[mineIndex] || {
      oldStart: Infinity
    }, theirsCurrent = theirs.hunks[theirsIndex] || {
      oldStart: Infinity
    };
    if (hunkBefore(mineCurrent, theirsCurrent)) {
      ret.hunks.push(cloneHunk(mineCurrent, mineOffset));
      mineIndex++;
      theirsOffset += mineCurrent.newLines - mineCurrent.oldLines;
    } else if (hunkBefore(theirsCurrent, mineCurrent)) {
      ret.hunks.push(cloneHunk(theirsCurrent, theirsOffset));
      theirsIndex++;
      mineOffset += theirsCurrent.newLines - theirsCurrent.oldLines;
    } else {
      var mergedHunk = {
        oldStart: Math.min(mineCurrent.oldStart, theirsCurrent.oldStart),
        oldLines: 0,
        newStart: Math.min(mineCurrent.newStart + mineOffset, theirsCurrent.oldStart + theirsOffset),
        newLines: 0,
        lines: []
      };
      mergeLines(mergedHunk, mineCurrent.oldStart, mineCurrent.lines, theirsCurrent.oldStart, theirsCurrent.lines);
      theirsIndex++;
      mineIndex++;
      ret.hunks.push(mergedHunk);
    }
  }
  return ret;
}
function loadPatch(param, base) {
  if (typeof param === "string") {
    if (/^@@/m.test(param) || /^Index:/m.test(param)) {
      return parsePatch(param)[0];
    }
    if (!base) {
      throw new Error("Must provide a base reference or pass in a patch");
    }
    return structuredPatch(void 0, void 0, base, param);
  }
  return param;
}
function fileNameChanged(patch) {
  return patch.newFileName && patch.newFileName !== patch.oldFileName;
}
function selectField(index, mine, theirs) {
  if (mine === theirs) {
    return mine;
  } else {
    index.conflict = true;
    return {
      mine,
      theirs
    };
  }
}
function hunkBefore(test, check) {
  return test.oldStart < check.oldStart && test.oldStart + test.oldLines < check.oldStart;
}
function cloneHunk(hunk, offset) {
  return {
    oldStart: hunk.oldStart,
    oldLines: hunk.oldLines,
    newStart: hunk.newStart + offset,
    newLines: hunk.newLines,
    lines: hunk.lines
  };
}
function mergeLines(hunk, mineOffset, mineLines, theirOffset, theirLines) {
  var mine = {
    offset: mineOffset,
    lines: mineLines,
    index: 0
  }, their = {
    offset: theirOffset,
    lines: theirLines,
    index: 0
  };
  insertLeading(hunk, mine, their);
  insertLeading(hunk, their, mine);
  while (mine.index < mine.lines.length && their.index < their.lines.length) {
    var mineCurrent = mine.lines[mine.index], theirCurrent = their.lines[their.index];
    if ((mineCurrent[0] === "-" || mineCurrent[0] === "+") && (theirCurrent[0] === "-" || theirCurrent[0] === "+")) {
      mutualChange(hunk, mine, their);
    } else if (mineCurrent[0] === "+" && theirCurrent[0] === " ") {
      var _hunk$lines;
      (_hunk$lines = hunk.lines).push.apply(_hunk$lines, _toConsumableArray(collectChange(mine)));
    } else if (theirCurrent[0] === "+" && mineCurrent[0] === " ") {
      var _hunk$lines2;
      (_hunk$lines2 = hunk.lines).push.apply(_hunk$lines2, _toConsumableArray(collectChange(their)));
    } else if (mineCurrent[0] === "-" && theirCurrent[0] === " ") {
      removal(hunk, mine, their);
    } else if (theirCurrent[0] === "-" && mineCurrent[0] === " ") {
      removal(hunk, their, mine, true);
    } else if (mineCurrent === theirCurrent) {
      hunk.lines.push(mineCurrent);
      mine.index++;
      their.index++;
    } else {
      conflict(hunk, collectChange(mine), collectChange(their));
    }
  }
  insertTrailing(hunk, mine);
  insertTrailing(hunk, their);
  calcLineCount(hunk);
}
function mutualChange(hunk, mine, their) {
  var myChanges = collectChange(mine), theirChanges = collectChange(their);
  if (allRemoves(myChanges) && allRemoves(theirChanges)) {
    if (arrayStartsWith(myChanges, theirChanges) && skipRemoveSuperset(their, myChanges, myChanges.length - theirChanges.length)) {
      var _hunk$lines3;
      (_hunk$lines3 = hunk.lines).push.apply(_hunk$lines3, _toConsumableArray(myChanges));
      return;
    } else if (arrayStartsWith(theirChanges, myChanges) && skipRemoveSuperset(mine, theirChanges, theirChanges.length - myChanges.length)) {
      var _hunk$lines4;
      (_hunk$lines4 = hunk.lines).push.apply(_hunk$lines4, _toConsumableArray(theirChanges));
      return;
    }
  } else if (arrayEqual(myChanges, theirChanges)) {
    var _hunk$lines5;
    (_hunk$lines5 = hunk.lines).push.apply(_hunk$lines5, _toConsumableArray(myChanges));
    return;
  }
  conflict(hunk, myChanges, theirChanges);
}
function removal(hunk, mine, their, swap) {
  var myChanges = collectChange(mine), theirChanges = collectContext(their, myChanges);
  if (theirChanges.merged) {
    var _hunk$lines6;
    (_hunk$lines6 = hunk.lines).push.apply(_hunk$lines6, _toConsumableArray(theirChanges.merged));
  } else {
    conflict(hunk, swap ? theirChanges : myChanges, swap ? myChanges : theirChanges);
  }
}
function conflict(hunk, mine, their) {
  hunk.conflict = true;
  hunk.lines.push({
    conflict: true,
    mine,
    theirs: their
  });
}
function insertLeading(hunk, insert, their) {
  while (insert.offset < their.offset && insert.index < insert.lines.length) {
    var line = insert.lines[insert.index++];
    hunk.lines.push(line);
    insert.offset++;
  }
}
function insertTrailing(hunk, insert) {
  while (insert.index < insert.lines.length) {
    var line = insert.lines[insert.index++];
    hunk.lines.push(line);
  }
}
function collectChange(state) {
  var ret = [], operation = state.lines[state.index][0];
  while (state.index < state.lines.length) {
    var line = state.lines[state.index];
    if (operation === "-" && line[0] === "+") {
      operation = "+";
    }
    if (operation === line[0]) {
      ret.push(line);
      state.index++;
    } else {
      break;
    }
  }
  return ret;
}
function collectContext(state, matchChanges) {
  var changes = [], merged = [], matchIndex = 0, contextChanges = false, conflicted = false;
  while (matchIndex < matchChanges.length && state.index < state.lines.length) {
    var change = state.lines[state.index], match = matchChanges[matchIndex];
    if (match[0] === "+") {
      break;
    }
    contextChanges = contextChanges || change[0] !== " ";
    merged.push(match);
    matchIndex++;
    if (change[0] === "+") {
      conflicted = true;
      while (change[0] === "+") {
        changes.push(change);
        change = state.lines[++state.index];
      }
    }
    if (match.substr(1) === change.substr(1)) {
      changes.push(change);
      state.index++;
    } else {
      conflicted = true;
    }
  }
  if ((matchChanges[matchIndex] || "")[0] === "+" && contextChanges) {
    conflicted = true;
  }
  if (conflicted) {
    return changes;
  }
  while (matchIndex < matchChanges.length) {
    merged.push(matchChanges[matchIndex++]);
  }
  return {
    merged,
    changes
  };
}
function allRemoves(changes) {
  return changes.reduce(function(prev, change) {
    return prev && change[0] === "-";
  }, true);
}
function skipRemoveSuperset(state, removeChanges, delta) {
  for (var i = 0; i < delta; i++) {
    var changeContent = removeChanges[removeChanges.length - delta + i].substr(1);
    if (state.lines[state.index + i] !== " " + changeContent) {
      return false;
    }
  }
  state.index += delta;
  return true;
}
function calcOldNewLineCount(lines) {
  var oldLines = 0;
  var newLines = 0;
  lines.forEach(function(line) {
    if (typeof line !== "string") {
      var myCount = calcOldNewLineCount(line.mine);
      var theirCount = calcOldNewLineCount(line.theirs);
      if (oldLines !== void 0) {
        if (myCount.oldLines === theirCount.oldLines) {
          oldLines += myCount.oldLines;
        } else {
          oldLines = void 0;
        }
      }
      if (newLines !== void 0) {
        if (myCount.newLines === theirCount.newLines) {
          newLines += myCount.newLines;
        } else {
          newLines = void 0;
        }
      }
    } else {
      if (newLines !== void 0 && (line[0] === "+" || line[0] === " ")) {
        newLines++;
      }
      if (oldLines !== void 0 && (line[0] === "-" || line[0] === " ")) {
        oldLines++;
      }
    }
  });
  return {
    oldLines,
    newLines
  };
}
function convertChangesToDMP(changes) {
  var ret = [], change, operation;
  for (var i = 0; i < changes.length; i++) {
    change = changes[i];
    if (change.added) {
      operation = 1;
    } else if (change.removed) {
      operation = -1;
    } else {
      operation = 0;
    }
    ret.push([operation, change.value]);
  }
  return ret;
}
function convertChangesToXML(changes) {
  var ret = [];
  for (var i = 0; i < changes.length; i++) {
    var change = changes[i];
    if (change.added) {
      ret.push("<ins>");
    } else if (change.removed) {
      ret.push("<del>");
    }
    ret.push(escapeHTML(change.value));
    if (change.added) {
      ret.push("</ins>");
    } else if (change.removed) {
      ret.push("</del>");
    }
  }
  return ret.join("");
}
function escapeHTML(s) {
  var n = s;
  n = n.replace(/&/g, "&amp;");
  n = n.replace(/</g, "&lt;");
  n = n.replace(/>/g, "&gt;");
  n = n.replace(/"/g, "&quot;");
  return n;
}
var characterDiff, extendedWordChars, reWhitespace, wordDiff, lineDiff, sentenceDiff, cssDiff, objectPrototypeToString, jsonDiff, arrayDiff;
var init_index_es6 = __esm({
  "node_modules/diff/lib/index.es6.js"() {
    "use strict";
    init_cjs_shims();
    Diff.prototype = {
      diff: function diff(oldString, newString) {
        var options = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
        var callback = options.callback;
        if (typeof options === "function") {
          callback = options;
          options = {};
        }
        this.options = options;
        var self2 = this;
        function done(value2) {
          if (callback) {
            setTimeout(function() {
              callback(void 0, value2);
            }, 0);
            return true;
          } else {
            return value2;
          }
        }
        oldString = this.castInput(oldString);
        newString = this.castInput(newString);
        oldString = this.removeEmpty(this.tokenize(oldString));
        newString = this.removeEmpty(this.tokenize(newString));
        var newLen = newString.length, oldLen = oldString.length;
        var editLength = 1;
        var maxEditLength = newLen + oldLen;
        var bestPath = [{
          newPos: -1,
          components: []
        }];
        var oldPos = this.extractCommon(bestPath[0], newString, oldString, 0);
        if (bestPath[0].newPos + 1 >= newLen && oldPos + 1 >= oldLen) {
          return done([{
            value: this.join(newString),
            count: newString.length
          }]);
        }
        function execEditLength() {
          for (var diagonalPath = -1 * editLength; diagonalPath <= editLength; diagonalPath += 2) {
            var basePath = void 0;
            var addPath = bestPath[diagonalPath - 1], removePath = bestPath[diagonalPath + 1], _oldPos = (removePath ? removePath.newPos : 0) - diagonalPath;
            if (addPath) {
              bestPath[diagonalPath - 1] = void 0;
            }
            var canAdd = addPath && addPath.newPos + 1 < newLen, canRemove = removePath && 0 <= _oldPos && _oldPos < oldLen;
            if (!canAdd && !canRemove) {
              bestPath[diagonalPath] = void 0;
              continue;
            }
            if (!canAdd || canRemove && addPath.newPos < removePath.newPos) {
              basePath = clonePath(removePath);
              self2.pushComponent(basePath.components, void 0, true);
            } else {
              basePath = addPath;
              basePath.newPos++;
              self2.pushComponent(basePath.components, true, void 0);
            }
            _oldPos = self2.extractCommon(basePath, newString, oldString, diagonalPath);
            if (basePath.newPos + 1 >= newLen && _oldPos + 1 >= oldLen) {
              return done(buildValues(self2, basePath.components, newString, oldString, self2.useLongestToken));
            } else {
              bestPath[diagonalPath] = basePath;
            }
          }
          editLength++;
        }
        if (callback) {
          (function exec() {
            setTimeout(function() {
              if (editLength > maxEditLength) {
                return callback();
              }
              if (!execEditLength()) {
                exec();
              }
            }, 0);
          })();
        } else {
          while (editLength <= maxEditLength) {
            var ret = execEditLength();
            if (ret) {
              return ret;
            }
          }
        }
      },
      pushComponent: function pushComponent(components, added, removed) {
        var last = components[components.length - 1];
        if (last && last.added === added && last.removed === removed) {
          components[components.length - 1] = {
            count: last.count + 1,
            added,
            removed
          };
        } else {
          components.push({
            count: 1,
            added,
            removed
          });
        }
      },
      extractCommon: function extractCommon(basePath, newString, oldString, diagonalPath) {
        var newLen = newString.length, oldLen = oldString.length, newPos = basePath.newPos, oldPos = newPos - diagonalPath, commonCount = 0;
        while (newPos + 1 < newLen && oldPos + 1 < oldLen && this.equals(newString[newPos + 1], oldString[oldPos + 1])) {
          newPos++;
          oldPos++;
          commonCount++;
        }
        if (commonCount) {
          basePath.components.push({
            count: commonCount
          });
        }
        basePath.newPos = newPos;
        return oldPos;
      },
      equals: function equals(left, right) {
        if (this.options.comparator) {
          return this.options.comparator(left, right);
        } else {
          return left === right || this.options.ignoreCase && left.toLowerCase() === right.toLowerCase();
        }
      },
      removeEmpty: function removeEmpty(array) {
        var ret = [];
        for (var i = 0; i < array.length; i++) {
          if (array[i]) {
            ret.push(array[i]);
          }
        }
        return ret;
      },
      castInput: function castInput(value2) {
        return value2;
      },
      tokenize: function tokenize(value2) {
        return value2.split("");
      },
      join: function join(chars) {
        return chars.join("");
      }
    };
    characterDiff = new Diff();
    extendedWordChars = /^[A-Za-z\xC0-\u02C6\u02C8-\u02D7\u02DE-\u02FF\u1E00-\u1EFF]+$/;
    reWhitespace = /\S/;
    wordDiff = new Diff();
    wordDiff.equals = function(left, right) {
      if (this.options.ignoreCase) {
        left = left.toLowerCase();
        right = right.toLowerCase();
      }
      return left === right || this.options.ignoreWhitespace && !reWhitespace.test(left) && !reWhitespace.test(right);
    };
    wordDiff.tokenize = function(value2) {
      var tokens = value2.split(/(\s+|[()[\]{}'"]|\b)/);
      for (var i = 0; i < tokens.length - 1; i++) {
        if (!tokens[i + 1] && tokens[i + 2] && extendedWordChars.test(tokens[i]) && extendedWordChars.test(tokens[i + 2])) {
          tokens[i] += tokens[i + 2];
          tokens.splice(i + 1, 2);
          i--;
        }
      }
      return tokens;
    };
    lineDiff = new Diff();
    lineDiff.tokenize = function(value2) {
      var retLines = [], linesAndNewlines = value2.split(/(\n|\r\n)/);
      if (!linesAndNewlines[linesAndNewlines.length - 1]) {
        linesAndNewlines.pop();
      }
      for (var i = 0; i < linesAndNewlines.length; i++) {
        var line = linesAndNewlines[i];
        if (i % 2 && !this.options.newlineIsToken) {
          retLines[retLines.length - 1] += line;
        } else {
          if (this.options.ignoreWhitespace) {
            line = line.trim();
          }
          retLines.push(line);
        }
      }
      return retLines;
    };
    sentenceDiff = new Diff();
    sentenceDiff.tokenize = function(value2) {
      return value2.split(/(\S.+?[.!?])(?=\s+|$)/);
    };
    cssDiff = new Diff();
    cssDiff.tokenize = function(value2) {
      return value2.split(/([{}:;,]|\s+)/);
    };
    objectPrototypeToString = Object.prototype.toString;
    jsonDiff = new Diff();
    jsonDiff.useLongestToken = true;
    jsonDiff.tokenize = lineDiff.tokenize;
    jsonDiff.castInput = function(value2) {
      var _this$options = this.options, undefinedReplacement = _this$options.undefinedReplacement, _this$options$stringi = _this$options.stringifyReplacer, stringifyReplacer = _this$options$stringi === void 0 ? function(k, v) {
        return typeof v === "undefined" ? undefinedReplacement : v;
      } : _this$options$stringi;
      return typeof value2 === "string" ? value2 : JSON.stringify(canonicalize(value2, null, null, stringifyReplacer), stringifyReplacer, "  ");
    };
    jsonDiff.equals = function(left, right) {
      return Diff.prototype.equals.call(jsonDiff, left.replace(/,([\r\n])/g, "$1"), right.replace(/,([\r\n])/g, "$1"));
    };
    arrayDiff = new Diff();
    arrayDiff.tokenize = function(value2) {
      return value2.slice();
    };
    arrayDiff.join = arrayDiff.removeEmpty = function(value2) {
      return value2;
    };
  }
});

// node_modules/ts-node/dist/repl.js
var require_repl = __commonJS({
  "node_modules/ts-node/dist/repl.js"(exports2) {
    "use strict";
    init_cjs_shims();
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.setupContext = exports2.createEvalAwarePartialHost = exports2.EvalState = exports2.createRepl = exports2.REPL_NAME = exports2.REPL_FILENAME = exports2.STDIN_NAME = exports2.STDIN_FILENAME = exports2.EVAL_NAME = exports2.EVAL_FILENAME = void 0;
    var os_1 = require("os");
    var path_1 = require("path");
    var repl_1 = require("repl");
    var vm_1 = require("vm");
    var index_1 = require_dist();
    var fs_1 = require("fs");
    var console_1 = require("console");
    var assert = require("assert");
    var module_1 = require("module");
    var _processTopLevelAwait;
    function getProcessTopLevelAwait() {
      if (_processTopLevelAwait === void 0) {
        ({
          processTopLevelAwait: _processTopLevelAwait
        } = require_node_internal_repl_await());
      }
      return _processTopLevelAwait;
    }
    var diff2;
    function getDiffLines() {
      if (diff2 === void 0) {
        diff2 = (init_index_es6(), __toCommonJS(index_es6_exports));
      }
      return diff2.diffLines;
    }
    exports2.EVAL_FILENAME = `[eval].ts`;
    exports2.EVAL_NAME = `[eval]`;
    exports2.STDIN_FILENAME = `[stdin].ts`;
    exports2.STDIN_NAME = `[stdin]`;
    exports2.REPL_FILENAME = "<repl>.ts";
    exports2.REPL_NAME = "<repl>";
    function createRepl(options = {}) {
      var _a, _b, _c, _d, _e;
      const { ignoreDiagnosticsThatAreAnnoyingInInteractiveRepl = true } = options;
      let service = options.service;
      let nodeReplServer;
      let context;
      const state = (_a = options.state) !== null && _a !== void 0 ? _a : new EvalState((0, path_1.join)(process.cwd(), exports2.REPL_FILENAME));
      const evalAwarePartialHost = createEvalAwarePartialHost(state, options.composeWithEvalAwarePartialHost);
      const stdin = (_b = options.stdin) !== null && _b !== void 0 ? _b : process.stdin;
      const stdout = (_c = options.stdout) !== null && _c !== void 0 ? _c : process.stdout;
      const stderr = (_d = options.stderr) !== null && _d !== void 0 ? _d : process.stderr;
      const _console = stdout === process.stdout && stderr === process.stderr ? console : new console_1.Console(stdout, stderr);
      const replService = {
        state: (_e = options.state) !== null && _e !== void 0 ? _e : new EvalState((0, path_1.join)(process.cwd(), exports2.EVAL_FILENAME)),
        setService,
        evalCode,
        evalCodeInternal,
        nodeEval,
        evalAwarePartialHost,
        start,
        startInternal,
        stdin,
        stdout,
        stderr,
        console: _console
      };
      return replService;
      function setService(_service) {
        service = _service;
        if (ignoreDiagnosticsThatAreAnnoyingInInteractiveRepl) {
          service.addDiagnosticFilter({
            appliesToAllFiles: false,
            filenamesAbsolute: [state.path],
            diagnosticsIgnored: [
              2393,
              6133,
              7027,
              ...service.shouldReplAwait ? topLevelAwaitDiagnosticCodes : []
            ]
          });
        }
      }
      function evalCode(code) {
        const result = appendCompileAndEvalInput({
          service,
          state,
          input: code,
          context,
          overrideIsCompletion: false
        });
        assert(result.containsTopLevelAwait === false);
        return result.value;
      }
      function evalCodeInternal(options2) {
        const { code, enableTopLevelAwait, context: context2 } = options2;
        return appendCompileAndEvalInput({
          service,
          state,
          input: code,
          enableTopLevelAwait,
          context: context2
        });
      }
      function nodeEval(code, context2, _filename, callback) {
        if (code === ".scope") {
          callback(null);
          return;
        }
        try {
          const evalResult = evalCodeInternal({
            code,
            enableTopLevelAwait: true,
            context: context2
          });
          if (evalResult.containsTopLevelAwait) {
            (async () => {
              try {
                callback(null, await evalResult.valuePromise);
              } catch (promiseError) {
                handleError(promiseError);
              }
            })();
          } else {
            callback(null, evalResult.value);
          }
        } catch (error) {
          handleError(error);
        }
        function handleError(error) {
          var _a2, _b2;
          const canLogTopLevelAwaitHint = service.options.experimentalReplAwait !== false && !service.shouldReplAwait;
          if (error instanceof index_1.TSError) {
            if (repl_1.Recoverable && isRecoverable(error)) {
              callback(new repl_1.Recoverable(error));
              return;
            } else {
              _console.error(error);
              if (canLogTopLevelAwaitHint && error.diagnosticCodes.some((dC) => topLevelAwaitDiagnosticCodes.includes(dC))) {
                _console.error(getTopLevelAwaitHint());
              }
              callback(null);
            }
          } else {
            let _error = error;
            if (canLogTopLevelAwaitHint && _error instanceof SyntaxError && ((_a2 = _error.message) === null || _a2 === void 0 ? void 0 : _a2.includes("await is only valid"))) {
              try {
                _error.message += `

${getTopLevelAwaitHint()}`;
                _error.stack = (_b2 = _error.stack) === null || _b2 === void 0 ? void 0 : _b2.replace(/(SyntaxError:.*)/, (_, $1) => `${$1}

${getTopLevelAwaitHint()}`);
              } catch {
              }
            }
            callback(_error);
          }
        }
        function getTopLevelAwaitHint() {
          return `Hint: REPL top-level await requires TypeScript version 3.8 or higher and target ES2018 or higher. You are using TypeScript ${service.ts.version} and target ${service.ts.ScriptTarget[service.config.options.target]}.`;
        }
      }
      function start(code) {
        startInternal({ code });
      }
      function startInternal(options2) {
        const { code, forceToBeModule = true, ...optionsOverride } = options2 !== null && options2 !== void 0 ? options2 : {};
        if (code) {
          try {
            evalCode(`${code}
`);
          } catch (err) {
            _console.error(err);
            process.exit(1);
          }
        }
        service === null || service === void 0 ? void 0 : service.compile("", state.path);
        const repl = (0, repl_1.start)({
          prompt: "> ",
          input: replService.stdin,
          output: replService.stdout,
          // Mimicking node's REPL implementation: https://github.com/nodejs/node/blob/168b22ba073ee1cbf8d0bcb4ded7ff3099335d04/lib/internal/repl.js#L28-L30
          terminal: stdout.isTTY && !parseInt(index_1.env.NODE_NO_READLINE, 10),
          eval: nodeEval,
          useGlobal: true,
          ...optionsOverride
        });
        nodeReplServer = repl;
        context = repl.context;
        const resetEval = appendToEvalState(state, "");
        function reset() {
          resetEval();
          runInContext("exports = module.exports", state.path, context);
          if (forceToBeModule) {
            state.input += "export {};void 0;\n";
          }
          if (!(service === null || service === void 0 ? void 0 : service.transpileOnly)) {
            state.input += `// @ts-ignore
${module_1.builtinModules.filter((name) => !name.startsWith("_") && !name.includes("/") && !["console", "module", "process"].includes(name)).map((name) => `declare import ${name} = require('${name}')`).join(";")}
`;
          }
        }
        reset();
        repl.on("reset", reset);
        repl.defineCommand("type", {
          help: "Check the type of a TypeScript identifier",
          action: function(identifier) {
            if (!identifier) {
              repl.displayPrompt();
              return;
            }
            const undo = appendToEvalState(state, identifier);
            const { name, comment } = service.getTypeInfo(state.input, state.path, state.input.length);
            undo();
            if (name)
              repl.outputStream.write(`${name}
`);
            if (comment)
              repl.outputStream.write(`${comment}
`);
            repl.displayPrompt();
          }
        });
        if (repl.setupHistory) {
          const historyPath = index_1.env.TS_NODE_HISTORY || (0, path_1.join)((0, os_1.homedir)(), ".ts_node_repl_history");
          repl.setupHistory(historyPath, (err) => {
            if (!err)
              return;
            _console.error(err);
            process.exit(1);
          });
        }
        return repl;
      }
    }
    exports2.createRepl = createRepl;
    var EvalState = class {
      constructor(path3) {
        this.path = path3;
        this.input = "";
        this.output = "";
        this.version = 0;
        this.lines = 0;
      }
    };
    exports2.EvalState = EvalState;
    function createEvalAwarePartialHost(state, composeWith) {
      function readFile(path3) {
        if (path3 === state.path)
          return state.input;
        if (composeWith === null || composeWith === void 0 ? void 0 : composeWith.readFile)
          return composeWith.readFile(path3);
        try {
          return (0, fs_1.readFileSync)(path3, "utf8");
        } catch (err) {
        }
      }
      function fileExists(path3) {
        if (path3 === state.path)
          return true;
        if (composeWith === null || composeWith === void 0 ? void 0 : composeWith.fileExists)
          return composeWith.fileExists(path3);
        try {
          const stats = (0, fs_1.statSync)(path3);
          return stats.isFile() || stats.isFIFO();
        } catch (err) {
          return false;
        }
      }
      return { readFile, fileExists };
    }
    exports2.createEvalAwarePartialHost = createEvalAwarePartialHost;
    var sourcemapCommentRe = /\/\/# ?sourceMappingURL=\S+[\s\r\n]*$/;
    function appendCompileAndEvalInput(options) {
      const { service, state, wrappedErr, enableTopLevelAwait = false, context, overrideIsCompletion } = options;
      let { input } = options;
      let wrappedCmd = false;
      if (!wrappedErr && /^\s*{/.test(input) && !/;\s*$/.test(input)) {
        input = `(${input.trim()})
`;
        wrappedCmd = true;
      }
      const lines = state.lines;
      const isCompletion = overrideIsCompletion !== null && overrideIsCompletion !== void 0 ? overrideIsCompletion : !/\n$/.test(input);
      const undo = appendToEvalState(state, input);
      let output;
      function adjustUseStrict(code) {
        return code.replace(/^"use strict";/, '"use strict"; void 0;');
      }
      try {
        output = service.compile(state.input, state.path, -lines);
      } catch (err) {
        undo();
        if (wrappedCmd) {
          if (err instanceof index_1.TSError && err.diagnosticCodes[0] === 2339) {
            throw err;
          }
          return appendCompileAndEvalInput({
            ...options,
            wrappedErr: err
          });
        }
        if (wrappedErr)
          throw wrappedErr;
        throw err;
      }
      output = adjustUseStrict(output);
      const outputWithoutSourcemapComment = output.replace(sourcemapCommentRe, "");
      const oldOutputWithoutSourcemapComment = state.output.replace(sourcemapCommentRe, "");
      const changes = getDiffLines()(oldOutputWithoutSourcemapComment, outputWithoutSourcemapComment);
      if (isCompletion) {
        undo();
      } else {
        state.output = output;
        state.input = state.input.replace(/([^\n\s])([\n\s]*)$/, (all, lastChar, whitespace) => {
          if (lastChar !== ";")
            return `${lastChar};${whitespace}`;
          return all;
        });
      }
      let commands = [];
      let containsTopLevelAwait = false;
      for (const change of changes) {
        if (change.added) {
          if (enableTopLevelAwait && service.shouldReplAwait && change.value.indexOf("await") > -1) {
            const processTopLevelAwait = getProcessTopLevelAwait();
            const wrappedResult = processTopLevelAwait(change.value + "\n");
            if (wrappedResult !== null) {
              containsTopLevelAwait = true;
              commands.push({
                mustAwait: true,
                execCommand: () => runInContext(wrappedResult, state.path, context)
              });
              continue;
            }
          }
          commands.push({
            execCommand: () => runInContext(change.value, state.path, context)
          });
        }
      }
      if (containsTopLevelAwait) {
        return {
          containsTopLevelAwait,
          valuePromise: (async () => {
            let value2;
            for (const command of commands) {
              const r = command.execCommand();
              value2 = command.mustAwait ? await r : r;
            }
            return value2;
          })()
        };
      } else {
        return {
          containsTopLevelAwait: false,
          value: commands.reduce((_, c) => c.execCommand(), void 0)
        };
      }
    }
    function runInContext(code, filename, context) {
      const script = new vm_1.Script(code, { filename });
      if (context === void 0 || context === global) {
        return script.runInThisContext();
      } else {
        return script.runInContext(context);
      }
    }
    function appendToEvalState(state, input) {
      const undoInput = state.input;
      const undoVersion = state.version;
      const undoOutput = state.output;
      const undoLines = state.lines;
      state.input += input;
      state.lines += lineCount(input);
      state.version++;
      return function() {
        state.input = undoInput;
        state.output = undoOutput;
        state.version = undoVersion;
        state.lines = undoLines;
      };
    }
    function lineCount(value2) {
      let count = 0;
      for (const char of value2) {
        if (char === "\n") {
          count++;
        }
      }
      return count;
    }
    var RECOVERY_CODES = /* @__PURE__ */ new Map([
      [1003, null],
      [1005, null],
      [1109, null],
      [1126, null],
      [
        1136,
        /* @__PURE__ */ new Set([1005])
        // happens when typing out an object literal or block scope across multiple lines: '{ foo: 123,'
      ],
      [1160, null],
      [1161, null],
      [2355, null],
      [2391, null],
      [
        7010,
        /* @__PURE__ */ new Set([1005])
        // happens when fn signature spread across multiple lines: 'function a(\nb: any\n) {'
      ]
    ]);
    var topLevelAwaitDiagnosticCodes = [
      1375,
      1378,
      1431,
      1432
      // Top-level 'for await' loops are only allowed when the 'module' option is set to 'esnext' or 'system', and the 'target' option is set to 'es2017' or higher.
    ];
    function isRecoverable(error) {
      return error.diagnosticCodes.every((code) => {
        const deps = RECOVERY_CODES.get(code);
        return deps === null || deps && error.diagnosticCodes.some((code2) => deps.has(code2));
      });
    }
    function setupContext(context, module3, filenameAndDirname) {
      if (filenameAndDirname) {
        context.__dirname = ".";
        context.__filename = `[${filenameAndDirname}]`;
      }
      context.module = module3;
      context.exports = module3.exports;
      context.require = module3.require.bind(module3);
    }
    exports2.setupContext = setupContext;
  }
});

// node_modules/ts-node/package.json
var require_package = __commonJS({
  "node_modules/ts-node/package.json"(exports2, module2) {
    module2.exports = {
      name: "ts-node",
      version: "10.9.2",
      description: "TypeScript execution environment and REPL for node.js, with source map support",
      main: "dist/index.js",
      exports: {
        ".": "./dist/index.js",
        "./package": "./package.json",
        "./package.json": "./package.json",
        "./dist/bin": "./dist/bin.js",
        "./dist/bin.js": "./dist/bin.js",
        "./dist/bin-transpile": "./dist/bin-transpile.js",
        "./dist/bin-transpile.js": "./dist/bin-transpile.js",
        "./dist/bin-script": "./dist/bin-script.js",
        "./dist/bin-script.js": "./dist/bin-script.js",
        "./dist/bin-cwd": "./dist/bin-cwd.js",
        "./dist/bin-cwd.js": "./dist/bin-cwd.js",
        "./dist/bin-esm": "./dist/bin-esm.js",
        "./dist/bin-esm.js": "./dist/bin-esm.js",
        "./register": "./register/index.js",
        "./register/files": "./register/files.js",
        "./register/transpile-only": "./register/transpile-only.js",
        "./register/type-check": "./register/type-check.js",
        "./esm": "./esm.mjs",
        "./esm.mjs": "./esm.mjs",
        "./esm/transpile-only": "./esm/transpile-only.mjs",
        "./esm/transpile-only.mjs": "./esm/transpile-only.mjs",
        "./child-loader.mjs": "./child-loader.mjs",
        "./transpilers/swc": "./transpilers/swc.js",
        "./transpilers/swc-experimental": "./transpilers/swc-experimental.js",
        "./node10/tsconfig.json": "./node10/tsconfig.json",
        "./node12/tsconfig.json": "./node12/tsconfig.json",
        "./node14/tsconfig.json": "./node14/tsconfig.json",
        "./node16/tsconfig.json": "./node16/tsconfig.json"
      },
      types: "dist/index.d.ts",
      bin: {
        "ts-node": "dist/bin.js",
        "ts-node-cwd": "dist/bin-cwd.js",
        "ts-node-esm": "dist/bin-esm.js",
        "ts-node-script": "dist/bin-script.js",
        "ts-node-transpile-only": "dist/bin-transpile.js",
        "ts-script": "dist/bin-script-deprecated.js"
      },
      files: [
        "/transpilers/",
        "/dist/",
        "!/dist/test",
        "/dist-raw/NODE-LICENSE.md",
        "/dist-raw/**.js",
        "/register/",
        "/esm/",
        "/esm.mjs",
        "/child-loader.mjs",
        "/LICENSE",
        "/tsconfig.schema.json",
        "/tsconfig.schemastore-schema.json",
        "/node10/",
        "/node12/",
        "/node14/",
        "/node16/"
      ],
      scripts: {
        lint: "dprint check",
        "lint-fix": "dprint fmt",
        clean: "rimraf temp dist tsconfig.schema.json tsconfig.schemastore-schema.json tsconfig.tsbuildinfo tests/ts-node-packed.tgz tests/node_modules tests/tmp",
        rebuild: "npm run clean && npm run build",
        build: "npm run build-nopack && npm run build-pack",
        "build-nopack": "npm run build-tsc && npm run build-configSchema",
        "build-tsc": "tsc -b ./tsconfig.build-dist.json",
        "build-configSchema": "typescript-json-schema --topRef --refs --validationKeywords allOf --out tsconfig.schema.json tsconfig.build-schema.json TsConfigSchema && node --require ./register ./scripts/create-merged-schema",
        "build-pack": "node ./scripts/build-pack.js",
        "test-spec": "ava",
        "test-cov": "nyc ava",
        test: "npm run build && npm run lint && npm run test-cov --",
        "test-local": "npm run lint-fix && npm run build-tsc && npm run build-pack && npm run test-spec --",
        "pre-debug": "npm run build-tsc && npm run build-pack",
        "coverage-report": "nyc report --reporter=lcov",
        prepare: "npm run clean && npm run build-nopack",
        "api-extractor": "api-extractor run --local --verbose",
        "esm-usage-example": "npm run build-tsc && cd esm-usage-example && node --experimental-specifier-resolution node --loader ../esm.mjs ./index",
        "esm-usage-example2": "npm run build-tsc && cd tests && TS_NODE_PROJECT=./module-types/override-to-cjs/tsconfig.json node --loader ../esm.mjs ./module-types/override-to-cjs/test.cjs"
      },
      repository: {
        type: "git",
        url: "git://github.com/TypeStrong/ts-node.git"
      },
      keywords: [
        "typescript",
        "node",
        "runtime",
        "environment",
        "ts",
        "compiler"
      ],
      author: {
        name: "Blake Embrey",
        email: "hello@blakeembrey.com",
        url: "http://blakeembrey.me"
      },
      contributors: [
        {
          name: "Andrew Bradley",
          email: "cspotcode@gmail.com",
          url: "https://github.com/cspotcode"
        }
      ],
      license: "MIT",
      bugs: {
        url: "https://github.com/TypeStrong/ts-node/issues"
      },
      homepage: "https://typestrong.org/ts-node",
      devDependencies: {
        "@microsoft/api-extractor": "^7.19.4",
        "@swc/core": "^1.3.100",
        "@swc/wasm": "^1.3.100",
        "@types/diff": "^4.0.2",
        "@types/lodash": "^4.14.151",
        "@types/node": "13.13.5",
        "@types/proper-lockfile": "^4.1.2",
        "@types/proxyquire": "^1.3.28",
        "@types/react": "^16.14.19",
        "@types/rimraf": "^3.0.0",
        "@types/semver": "^7.1.0",
        "@yarnpkg/fslib": "^2.4.0",
        ava: "^3.15.0",
        axios: "^0.21.1",
        dprint: "^0.25.0",
        expect: "^27.0.2",
        "get-stream": "^6.0.0",
        lodash: "^4.17.15",
        ntypescript: "^1.201507091536.1",
        nyc: "^15.0.1",
        outdent: "^0.8.0",
        "proper-lockfile": "^4.1.2",
        proxyquire: "^2.0.0",
        react: "^16.14.0",
        rimraf: "^3.0.0",
        semver: "^7.1.3",
        throat: "^6.0.1",
        typedoc: "^0.22.10",
        typescript: "4.7.4",
        "typescript-json-schema": "^0.53.0",
        "util.promisify": "^1.0.1"
      },
      peerDependencies: {
        "@swc/core": ">=1.2.50",
        "@swc/wasm": ">=1.2.50",
        "@types/node": "*",
        typescript: ">=2.7"
      },
      peerDependenciesMeta: {
        "@swc/core": {
          optional: true
        },
        "@swc/wasm": {
          optional: true
        }
      },
      dependencies: {
        "@cspotcode/source-map-support": "^0.8.0",
        "@tsconfig/node10": "^1.0.7",
        "@tsconfig/node12": "^1.0.7",
        "@tsconfig/node14": "^1.0.0",
        "@tsconfig/node16": "^1.0.2",
        acorn: "^8.4.1",
        "acorn-walk": "^8.1.1",
        arg: "^4.1.0",
        "create-require": "^1.1.0",
        diff: "^4.0.1",
        "make-error": "^1.1.1",
        "v8-compile-cache-lib": "^3.0.1",
        yn: "3.1.1"
      },
      prettier: {
        singleQuote: true
      },
      volta: {
        node: "18.1.0",
        npm: "6.14.15"
      }
    };
  }
});

// node_modules/@jridgewell/sourcemap-codec/dist/sourcemap-codec.umd.js
var require_sourcemap_codec_umd = __commonJS({
  "node_modules/@jridgewell/sourcemap-codec/dist/sourcemap-codec.umd.js"(exports2, module2) {
    "use strict";
    init_cjs_shims();
    (function(global2, factory) {
      typeof exports2 === "object" && typeof module2 !== "undefined" ? factory(exports2) : typeof define === "function" && define.amd ? define(["exports"], factory) : (global2 = typeof globalThis !== "undefined" ? globalThis : global2 || self, factory(global2.sourcemapCodec = {}));
    })(exports2, function(exports3) {
      "use strict";
      const comma = ",".charCodeAt(0);
      const semicolon = ";".charCodeAt(0);
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
      const intToChar = new Uint8Array(64);
      const charToInt = new Uint8Array(128);
      for (let i = 0; i < chars.length; i++) {
        const c = chars.charCodeAt(i);
        intToChar[i] = c;
        charToInt[c] = i;
      }
      function decodeInteger(reader, relative) {
        let value2 = 0;
        let shift = 0;
        let integer = 0;
        do {
          const c = reader.next();
          integer = charToInt[c];
          value2 |= (integer & 31) << shift;
          shift += 5;
        } while (integer & 32);
        const shouldNegate = value2 & 1;
        value2 >>>= 1;
        if (shouldNegate) {
          value2 = -2147483648 | -value2;
        }
        return relative + value2;
      }
      function encodeInteger(builder, num, relative) {
        let delta = num - relative;
        delta = delta < 0 ? -delta << 1 | 1 : delta << 1;
        do {
          let clamped = delta & 31;
          delta >>>= 5;
          if (delta > 0)
            clamped |= 32;
          builder.write(intToChar[clamped]);
        } while (delta > 0);
        return num;
      }
      function hasMoreVlq(reader, max) {
        if (reader.pos >= max)
          return false;
        return reader.peek() !== comma;
      }
      const bufLength = 1024 * 16;
      const td = typeof TextDecoder !== "undefined" ? /* @__PURE__ */ new TextDecoder() : typeof Buffer !== "undefined" ? {
        decode(buf) {
          const out = Buffer.from(buf.buffer, buf.byteOffset, buf.byteLength);
          return out.toString();
        }
      } : {
        decode(buf) {
          let out = "";
          for (let i = 0; i < buf.length; i++) {
            out += String.fromCharCode(buf[i]);
          }
          return out;
        }
      };
      class StringWriter {
        constructor() {
          this.pos = 0;
          this.out = "";
          this.buffer = new Uint8Array(bufLength);
        }
        write(v) {
          const { buffer } = this;
          buffer[this.pos++] = v;
          if (this.pos === bufLength) {
            this.out += td.decode(buffer);
            this.pos = 0;
          }
        }
        flush() {
          const { buffer, out, pos } = this;
          return pos > 0 ? out + td.decode(buffer.subarray(0, pos)) : out;
        }
      }
      class StringReader {
        constructor(buffer) {
          this.pos = 0;
          this.buffer = buffer;
        }
        next() {
          return this.buffer.charCodeAt(this.pos++);
        }
        peek() {
          return this.buffer.charCodeAt(this.pos);
        }
        indexOf(char) {
          const { buffer, pos } = this;
          const idx = buffer.indexOf(char, pos);
          return idx === -1 ? buffer.length : idx;
        }
      }
      const EMPTY = [];
      function decodeOriginalScopes(input) {
        const { length } = input;
        const reader = new StringReader(input);
        const scopes = [];
        const stack = [];
        let line = 0;
        for (; reader.pos < length; reader.pos++) {
          line = decodeInteger(reader, line);
          const column2 = decodeInteger(reader, 0);
          if (!hasMoreVlq(reader, length)) {
            const last = stack.pop();
            last[2] = line;
            last[3] = column2;
            continue;
          }
          const kind = decodeInteger(reader, 0);
          const fields = decodeInteger(reader, 0);
          const hasName = fields & 1;
          const scope = hasName ? [line, column2, 0, 0, kind, decodeInteger(reader, 0)] : [line, column2, 0, 0, kind];
          let vars = EMPTY;
          if (hasMoreVlq(reader, length)) {
            vars = [];
            do {
              const varsIndex = decodeInteger(reader, 0);
              vars.push(varsIndex);
            } while (hasMoreVlq(reader, length));
          }
          scope.vars = vars;
          scopes.push(scope);
          stack.push(scope);
        }
        return scopes;
      }
      function encodeOriginalScopes(scopes) {
        const writer = new StringWriter();
        for (let i = 0; i < scopes.length; ) {
          i = _encodeOriginalScopes(scopes, i, writer, [0]);
        }
        return writer.flush();
      }
      function _encodeOriginalScopes(scopes, index, writer, state) {
        const scope = scopes[index];
        const { 0: startLine, 1: startColumn, 2: endLine, 3: endColumn, 4: kind, vars } = scope;
        if (index > 0)
          writer.write(comma);
        state[0] = encodeInteger(writer, startLine, state[0]);
        encodeInteger(writer, startColumn, 0);
        encodeInteger(writer, kind, 0);
        const fields = scope.length === 6 ? 1 : 0;
        encodeInteger(writer, fields, 0);
        if (scope.length === 6)
          encodeInteger(writer, scope[5], 0);
        for (const v of vars) {
          encodeInteger(writer, v, 0);
        }
        for (index++; index < scopes.length; ) {
          const next = scopes[index];
          const { 0: l, 1: c } = next;
          if (l > endLine || l === endLine && c >= endColumn) {
            break;
          }
          index = _encodeOriginalScopes(scopes, index, writer, state);
        }
        writer.write(comma);
        state[0] = encodeInteger(writer, endLine, state[0]);
        encodeInteger(writer, endColumn, 0);
        return index;
      }
      function decodeGeneratedRanges(input) {
        const { length } = input;
        const reader = new StringReader(input);
        const ranges = [];
        const stack = [];
        let genLine = 0;
        let definitionSourcesIndex = 0;
        let definitionScopeIndex = 0;
        let callsiteSourcesIndex = 0;
        let callsiteLine = 0;
        let callsiteColumn = 0;
        let bindingLine = 0;
        let bindingColumn = 0;
        do {
          const semi = reader.indexOf(";");
          let genColumn = 0;
          for (; reader.pos < semi; reader.pos++) {
            genColumn = decodeInteger(reader, genColumn);
            if (!hasMoreVlq(reader, semi)) {
              const last = stack.pop();
              last[2] = genLine;
              last[3] = genColumn;
              continue;
            }
            const fields = decodeInteger(reader, 0);
            const hasDefinition = fields & 1;
            const hasCallsite = fields & 2;
            const hasScope = fields & 4;
            let callsite = null;
            let bindings = EMPTY;
            let range;
            if (hasDefinition) {
              const defSourcesIndex = decodeInteger(reader, definitionSourcesIndex);
              definitionScopeIndex = decodeInteger(reader, definitionSourcesIndex === defSourcesIndex ? definitionScopeIndex : 0);
              definitionSourcesIndex = defSourcesIndex;
              range = [genLine, genColumn, 0, 0, defSourcesIndex, definitionScopeIndex];
            } else {
              range = [genLine, genColumn, 0, 0];
            }
            range.isScope = !!hasScope;
            if (hasCallsite) {
              const prevCsi = callsiteSourcesIndex;
              const prevLine = callsiteLine;
              callsiteSourcesIndex = decodeInteger(reader, callsiteSourcesIndex);
              const sameSource = prevCsi === callsiteSourcesIndex;
              callsiteLine = decodeInteger(reader, sameSource ? callsiteLine : 0);
              callsiteColumn = decodeInteger(reader, sameSource && prevLine === callsiteLine ? callsiteColumn : 0);
              callsite = [callsiteSourcesIndex, callsiteLine, callsiteColumn];
            }
            range.callsite = callsite;
            if (hasMoreVlq(reader, semi)) {
              bindings = [];
              do {
                bindingLine = genLine;
                bindingColumn = genColumn;
                const expressionsCount = decodeInteger(reader, 0);
                let expressionRanges;
                if (expressionsCount < -1) {
                  expressionRanges = [[decodeInteger(reader, 0)]];
                  for (let i = -1; i > expressionsCount; i--) {
                    const prevBl = bindingLine;
                    bindingLine = decodeInteger(reader, bindingLine);
                    bindingColumn = decodeInteger(reader, bindingLine === prevBl ? bindingColumn : 0);
                    const expression = decodeInteger(reader, 0);
                    expressionRanges.push([expression, bindingLine, bindingColumn]);
                  }
                } else {
                  expressionRanges = [[expressionsCount]];
                }
                bindings.push(expressionRanges);
              } while (hasMoreVlq(reader, semi));
            }
            range.bindings = bindings;
            ranges.push(range);
            stack.push(range);
          }
          genLine++;
          reader.pos = semi + 1;
        } while (reader.pos < length);
        return ranges;
      }
      function encodeGeneratedRanges(ranges) {
        if (ranges.length === 0)
          return "";
        const writer = new StringWriter();
        for (let i = 0; i < ranges.length; ) {
          i = _encodeGeneratedRanges(ranges, i, writer, [0, 0, 0, 0, 0, 0, 0]);
        }
        return writer.flush();
      }
      function _encodeGeneratedRanges(ranges, index, writer, state) {
        const range = ranges[index];
        const { 0: startLine, 1: startColumn, 2: endLine, 3: endColumn, isScope, callsite, bindings } = range;
        if (state[0] < startLine) {
          catchupLine(writer, state[0], startLine);
          state[0] = startLine;
          state[1] = 0;
        } else if (index > 0) {
          writer.write(comma);
        }
        state[1] = encodeInteger(writer, range[1], state[1]);
        const fields = (range.length === 6 ? 1 : 0) | (callsite ? 2 : 0) | (isScope ? 4 : 0);
        encodeInteger(writer, fields, 0);
        if (range.length === 6) {
          const { 4: sourcesIndex, 5: scopesIndex } = range;
          if (sourcesIndex !== state[2]) {
            state[3] = 0;
          }
          state[2] = encodeInteger(writer, sourcesIndex, state[2]);
          state[3] = encodeInteger(writer, scopesIndex, state[3]);
        }
        if (callsite) {
          const { 0: sourcesIndex, 1: callLine, 2: callColumn } = range.callsite;
          if (sourcesIndex !== state[4]) {
            state[5] = 0;
            state[6] = 0;
          } else if (callLine !== state[5]) {
            state[6] = 0;
          }
          state[4] = encodeInteger(writer, sourcesIndex, state[4]);
          state[5] = encodeInteger(writer, callLine, state[5]);
          state[6] = encodeInteger(writer, callColumn, state[6]);
        }
        if (bindings) {
          for (const binding of bindings) {
            if (binding.length > 1)
              encodeInteger(writer, -binding.length, 0);
            const expression = binding[0][0];
            encodeInteger(writer, expression, 0);
            let bindingStartLine = startLine;
            let bindingStartColumn = startColumn;
            for (let i = 1; i < binding.length; i++) {
              const expRange = binding[i];
              bindingStartLine = encodeInteger(writer, expRange[1], bindingStartLine);
              bindingStartColumn = encodeInteger(writer, expRange[2], bindingStartColumn);
              encodeInteger(writer, expRange[0], 0);
            }
          }
        }
        for (index++; index < ranges.length; ) {
          const next = ranges[index];
          const { 0: l, 1: c } = next;
          if (l > endLine || l === endLine && c >= endColumn) {
            break;
          }
          index = _encodeGeneratedRanges(ranges, index, writer, state);
        }
        if (state[0] < endLine) {
          catchupLine(writer, state[0], endLine);
          state[0] = endLine;
          state[1] = 0;
        } else {
          writer.write(comma);
        }
        state[1] = encodeInteger(writer, endColumn, state[1]);
        return index;
      }
      function catchupLine(writer, lastLine, line) {
        do {
          writer.write(semicolon);
        } while (++lastLine < line);
      }
      function decode(mappings) {
        const { length } = mappings;
        const reader = new StringReader(mappings);
        const decoded = [];
        let genColumn = 0;
        let sourcesIndex = 0;
        let sourceLine = 0;
        let sourceColumn = 0;
        let namesIndex = 0;
        do {
          const semi = reader.indexOf(";");
          const line = [];
          let sorted = true;
          let lastCol = 0;
          genColumn = 0;
          while (reader.pos < semi) {
            let seg;
            genColumn = decodeInteger(reader, genColumn);
            if (genColumn < lastCol)
              sorted = false;
            lastCol = genColumn;
            if (hasMoreVlq(reader, semi)) {
              sourcesIndex = decodeInteger(reader, sourcesIndex);
              sourceLine = decodeInteger(reader, sourceLine);
              sourceColumn = decodeInteger(reader, sourceColumn);
              if (hasMoreVlq(reader, semi)) {
                namesIndex = decodeInteger(reader, namesIndex);
                seg = [genColumn, sourcesIndex, sourceLine, sourceColumn, namesIndex];
              } else {
                seg = [genColumn, sourcesIndex, sourceLine, sourceColumn];
              }
            } else {
              seg = [genColumn];
            }
            line.push(seg);
            reader.pos++;
          }
          if (!sorted)
            sort(line);
          decoded.push(line);
          reader.pos = semi + 1;
        } while (reader.pos <= length);
        return decoded;
      }
      function sort(line) {
        line.sort(sortComparator);
      }
      function sortComparator(a, b) {
        return a[0] - b[0];
      }
      function encode(decoded) {
        const writer = new StringWriter();
        let sourcesIndex = 0;
        let sourceLine = 0;
        let sourceColumn = 0;
        let namesIndex = 0;
        for (let i = 0; i < decoded.length; i++) {
          const line = decoded[i];
          if (i > 0)
            writer.write(semicolon);
          if (line.length === 0)
            continue;
          let genColumn = 0;
          for (let j = 0; j < line.length; j++) {
            const segment = line[j];
            if (j > 0)
              writer.write(comma);
            genColumn = encodeInteger(writer, segment[0], genColumn);
            if (segment.length === 1)
              continue;
            sourcesIndex = encodeInteger(writer, segment[1], sourcesIndex);
            sourceLine = encodeInteger(writer, segment[2], sourceLine);
            sourceColumn = encodeInteger(writer, segment[3], sourceColumn);
            if (segment.length === 4)
              continue;
            namesIndex = encodeInteger(writer, segment[4], namesIndex);
          }
        }
        return writer.flush();
      }
      exports3.decode = decode;
      exports3.decodeGeneratedRanges = decodeGeneratedRanges;
      exports3.decodeOriginalScopes = decodeOriginalScopes;
      exports3.encode = encode;
      exports3.encodeGeneratedRanges = encodeGeneratedRanges;
      exports3.encodeOriginalScopes = encodeOriginalScopes;
      Object.defineProperty(exports3, "__esModule", { value: true });
    });
  }
});

// node_modules/@jridgewell/resolve-uri/dist/resolve-uri.umd.js
var require_resolve_uri_umd = __commonJS({
  "node_modules/@jridgewell/resolve-uri/dist/resolve-uri.umd.js"(exports2, module2) {
    "use strict";
    init_cjs_shims();
    (function(global2, factory) {
      typeof exports2 === "object" && typeof module2 !== "undefined" ? module2.exports = factory() : typeof define === "function" && define.amd ? define(factory) : (global2 = typeof globalThis !== "undefined" ? globalThis : global2 || self, global2.resolveURI = factory());
    })(exports2, function() {
      "use strict";
      const schemeRegex = /^[\w+.-]+:\/\//;
      const urlRegex = /^([\w+.-]+:)\/\/([^@/#?]*@)?([^:/#?]*)(:\d+)?(\/[^#?]*)?(\?[^#]*)?(#.*)?/;
      const fileRegex = /^file:(?:\/\/((?![a-z]:)[^/#?]*)?)?(\/?[^#?]*)(\?[^#]*)?(#.*)?/i;
      function isAbsoluteUrl(input) {
        return schemeRegex.test(input);
      }
      function isSchemeRelativeUrl(input) {
        return input.startsWith("//");
      }
      function isAbsolutePath(input) {
        return input.startsWith("/");
      }
      function isFileUrl(input) {
        return input.startsWith("file:");
      }
      function isRelative(input) {
        return /^[.?#]/.test(input);
      }
      function parseAbsoluteUrl(input) {
        const match = urlRegex.exec(input);
        return makeUrl(match[1], match[2] || "", match[3], match[4] || "", match[5] || "/", match[6] || "", match[7] || "");
      }
      function parseFileUrl(input) {
        const match = fileRegex.exec(input);
        const path3 = match[2];
        return makeUrl("file:", "", match[1] || "", "", isAbsolutePath(path3) ? path3 : "/" + path3, match[3] || "", match[4] || "");
      }
      function makeUrl(scheme, user, host, port, path3, query, hash) {
        return {
          scheme,
          user,
          host,
          port,
          path: path3,
          query,
          hash,
          type: 7
        };
      }
      function parseUrl(input) {
        if (isSchemeRelativeUrl(input)) {
          const url2 = parseAbsoluteUrl("http:" + input);
          url2.scheme = "";
          url2.type = 6;
          return url2;
        }
        if (isAbsolutePath(input)) {
          const url2 = parseAbsoluteUrl("http://foo.com" + input);
          url2.scheme = "";
          url2.host = "";
          url2.type = 5;
          return url2;
        }
        if (isFileUrl(input))
          return parseFileUrl(input);
        if (isAbsoluteUrl(input))
          return parseAbsoluteUrl(input);
        const url = parseAbsoluteUrl("http://foo.com/" + input);
        url.scheme = "";
        url.host = "";
        url.type = input ? input.startsWith("?") ? 3 : input.startsWith("#") ? 2 : 4 : 1;
        return url;
      }
      function stripPathFilename(path3) {
        if (path3.endsWith("/.."))
          return path3;
        const index = path3.lastIndexOf("/");
        return path3.slice(0, index + 1);
      }
      function mergePaths(url, base) {
        normalizePath(base, base.type);
        if (url.path === "/") {
          url.path = base.path;
        } else {
          url.path = stripPathFilename(base.path) + url.path;
        }
      }
      function normalizePath(url, type) {
        const rel = type <= 4;
        const pieces = url.path.split("/");
        let pointer = 1;
        let positive = 0;
        let addTrailingSlash = false;
        for (let i = 1; i < pieces.length; i++) {
          const piece = pieces[i];
          if (!piece) {
            addTrailingSlash = true;
            continue;
          }
          addTrailingSlash = false;
          if (piece === ".")
            continue;
          if (piece === "..") {
            if (positive) {
              addTrailingSlash = true;
              positive--;
              pointer--;
            } else if (rel) {
              pieces[pointer++] = piece;
            }
            continue;
          }
          pieces[pointer++] = piece;
          positive++;
        }
        let path3 = "";
        for (let i = 1; i < pointer; i++) {
          path3 += "/" + pieces[i];
        }
        if (!path3 || addTrailingSlash && !path3.endsWith("/..")) {
          path3 += "/";
        }
        url.path = path3;
      }
      function resolve(input, base) {
        if (!input && !base)
          return "";
        const url = parseUrl(input);
        let inputType = url.type;
        if (base && inputType !== 7) {
          const baseUrl = parseUrl(base);
          const baseType = baseUrl.type;
          switch (inputType) {
            case 1:
              url.hash = baseUrl.hash;
            // fall through
            case 2:
              url.query = baseUrl.query;
            // fall through
            case 3:
            case 4:
              mergePaths(url, baseUrl);
            // fall through
            case 5:
              url.user = baseUrl.user;
              url.host = baseUrl.host;
              url.port = baseUrl.port;
            // fall through
            case 6:
              url.scheme = baseUrl.scheme;
          }
          if (baseType > inputType)
            inputType = baseType;
        }
        normalizePath(url, inputType);
        const queryHash = url.query + url.hash;
        switch (inputType) {
          // This is impossible, because of the empty checks at the start of the function.
          // case UrlType.Empty:
          case 2:
          case 3:
            return queryHash;
          case 4: {
            const path3 = url.path.slice(1);
            if (!path3)
              return queryHash || ".";
            if (isRelative(base || input) && !isRelative(path3)) {
              return "./" + path3 + queryHash;
            }
            return path3 + queryHash;
          }
          case 5:
            return url.path + queryHash;
          default:
            return url.scheme + "//" + url.user + url.host + url.port + url.path + queryHash;
        }
      }
      return resolve;
    });
  }
});

// node_modules/@cspotcode/source-map-support/node_modules/@jridgewell/trace-mapping/dist/trace-mapping.umd.js
var require_trace_mapping_umd = __commonJS({
  "node_modules/@cspotcode/source-map-support/node_modules/@jridgewell/trace-mapping/dist/trace-mapping.umd.js"(exports2, module2) {
    "use strict";
    init_cjs_shims();
    (function(global2, factory) {
      typeof exports2 === "object" && typeof module2 !== "undefined" ? factory(exports2, require_sourcemap_codec_umd(), require_resolve_uri_umd()) : typeof define === "function" && define.amd ? define(["exports", "@jridgewell/sourcemap-codec", "@jridgewell/resolve-uri"], factory) : (global2 = typeof globalThis !== "undefined" ? globalThis : global2 || self, factory(global2.traceMapping = {}, global2.sourcemapCodec, global2.resolveURI));
    })(exports2, function(exports3, sourcemapCodec, resolveUri) {
      "use strict";
      function _interopDefaultLegacy(e) {
        return e && typeof e === "object" && "default" in e ? e : { "default": e };
      }
      var resolveUri__default = /* @__PURE__ */ _interopDefaultLegacy(resolveUri);
      function resolve(input, base) {
        if (base && !base.endsWith("/"))
          base += "/";
        return resolveUri__default["default"](input, base);
      }
      function stripFilename(path3) {
        if (!path3)
          return "";
        const index = path3.lastIndexOf("/");
        return path3.slice(0, index + 1);
      }
      const COLUMN = 0;
      const SOURCES_INDEX = 1;
      const SOURCE_LINE = 2;
      const SOURCE_COLUMN = 3;
      const NAMES_INDEX = 4;
      const REV_GENERATED_LINE = 1;
      const REV_GENERATED_COLUMN = 2;
      function maybeSort(mappings, owned) {
        const unsortedIndex = nextUnsortedSegmentLine(mappings, 0);
        if (unsortedIndex === mappings.length)
          return mappings;
        if (!owned)
          mappings = mappings.slice();
        for (let i = unsortedIndex; i < mappings.length; i = nextUnsortedSegmentLine(mappings, i + 1)) {
          mappings[i] = sortSegments(mappings[i], owned);
        }
        return mappings;
      }
      function nextUnsortedSegmentLine(mappings, start) {
        for (let i = start; i < mappings.length; i++) {
          if (!isSorted(mappings[i]))
            return i;
        }
        return mappings.length;
      }
      function isSorted(line) {
        for (let j = 1; j < line.length; j++) {
          if (line[j][COLUMN] < line[j - 1][COLUMN]) {
            return false;
          }
        }
        return true;
      }
      function sortSegments(line, owned) {
        if (!owned)
          line = line.slice();
        return line.sort(sortComparator);
      }
      function sortComparator(a, b) {
        return a[COLUMN] - b[COLUMN];
      }
      let found = false;
      function binarySearch(haystack, needle, low, high) {
        while (low <= high) {
          const mid = low + (high - low >> 1);
          const cmp = haystack[mid][COLUMN] - needle;
          if (cmp === 0) {
            found = true;
            return mid;
          }
          if (cmp < 0) {
            low = mid + 1;
          } else {
            high = mid - 1;
          }
        }
        found = false;
        return low - 1;
      }
      function upperBound(haystack, needle, index) {
        for (let i = index + 1; i < haystack.length; i++, index++) {
          if (haystack[i][COLUMN] !== needle)
            break;
        }
        return index;
      }
      function lowerBound(haystack, needle, index) {
        for (let i = index - 1; i >= 0; i--, index--) {
          if (haystack[i][COLUMN] !== needle)
            break;
        }
        return index;
      }
      function memoizedState() {
        return {
          lastKey: -1,
          lastNeedle: -1,
          lastIndex: -1
        };
      }
      function memoizedBinarySearch(haystack, needle, state, key) {
        const { lastKey, lastNeedle, lastIndex } = state;
        let low = 0;
        let high = haystack.length - 1;
        if (key === lastKey) {
          if (needle === lastNeedle) {
            found = lastIndex !== -1 && haystack[lastIndex][COLUMN] === needle;
            return lastIndex;
          }
          if (needle >= lastNeedle) {
            low = lastIndex === -1 ? 0 : lastIndex;
          } else {
            high = lastIndex;
          }
        }
        state.lastKey = key;
        state.lastNeedle = needle;
        return state.lastIndex = binarySearch(haystack, needle, low, high);
      }
      function buildBySources(decoded, memos) {
        const sources = memos.map(buildNullArray);
        for (let i = 0; i < decoded.length; i++) {
          const line = decoded[i];
          for (let j = 0; j < line.length; j++) {
            const seg = line[j];
            if (seg.length === 1)
              continue;
            const sourceIndex = seg[SOURCES_INDEX];
            const sourceLine = seg[SOURCE_LINE];
            const sourceColumn = seg[SOURCE_COLUMN];
            const originalSource = sources[sourceIndex];
            const originalLine = originalSource[sourceLine] || (originalSource[sourceLine] = []);
            const memo = memos[sourceIndex];
            const index = upperBound(originalLine, sourceColumn, memoizedBinarySearch(originalLine, sourceColumn, memo, sourceLine));
            insert(originalLine, memo.lastIndex = index + 1, [sourceColumn, i, seg[COLUMN]]);
          }
        }
        return sources;
      }
      function insert(array, index, value2) {
        for (let i = array.length; i > index; i--) {
          array[i] = array[i - 1];
        }
        array[index] = value2;
      }
      function buildNullArray() {
        return { __proto__: null };
      }
      const AnyMap = function(map, mapUrl) {
        const parsed = typeof map === "string" ? JSON.parse(map) : map;
        if (!("sections" in parsed))
          return new TraceMap(parsed, mapUrl);
        const mappings = [];
        const sources = [];
        const sourcesContent = [];
        const names = [];
        const { sections } = parsed;
        let i = 0;
        for (; i < sections.length - 1; i++) {
          const no = sections[i + 1].offset;
          addSection(sections[i], mapUrl, mappings, sources, sourcesContent, names, no.line, no.column);
        }
        if (sections.length > 0) {
          addSection(sections[i], mapUrl, mappings, sources, sourcesContent, names, Infinity, Infinity);
        }
        const joined = {
          version: 3,
          file: parsed.file,
          names,
          sources,
          sourcesContent,
          mappings
        };
        return exports3.presortedDecodedMap(joined);
      };
      function addSection(section, mapUrl, mappings, sources, sourcesContent, names, stopLine, stopColumn) {
        const map = AnyMap(section.map, mapUrl);
        const { line: lineOffset, column: columnOffset } = section.offset;
        const sourcesOffset = sources.length;
        const namesOffset = names.length;
        const decoded = exports3.decodedMappings(map);
        const { resolvedSources } = map;
        append(sources, resolvedSources);
        append(sourcesContent, map.sourcesContent || fillSourcesContent(resolvedSources.length));
        append(names, map.names);
        for (let i = mappings.length; i <= lineOffset; i++)
          mappings.push([]);
        const stopI = stopLine - lineOffset;
        const len = Math.min(decoded.length, stopI + 1);
        for (let i = 0; i < len; i++) {
          const line = decoded[i];
          const out = i === 0 ? mappings[lineOffset] : mappings[lineOffset + i] = [];
          const cOffset = i === 0 ? columnOffset : 0;
          for (let j = 0; j < line.length; j++) {
            const seg = line[j];
            const column2 = cOffset + seg[COLUMN];
            if (i === stopI && column2 >= stopColumn)
              break;
            if (seg.length === 1) {
              out.push([column2]);
              continue;
            }
            const sourcesIndex = sourcesOffset + seg[SOURCES_INDEX];
            const sourceLine = seg[SOURCE_LINE];
            const sourceColumn = seg[SOURCE_COLUMN];
            if (seg.length === 4) {
              out.push([column2, sourcesIndex, sourceLine, sourceColumn]);
              continue;
            }
            out.push([column2, sourcesIndex, sourceLine, sourceColumn, namesOffset + seg[NAMES_INDEX]]);
          }
        }
      }
      function append(arr, other) {
        for (let i = 0; i < other.length; i++)
          arr.push(other[i]);
      }
      function fillSourcesContent(len) {
        const sourcesContent = [];
        for (let i = 0; i < len; i++)
          sourcesContent[i] = null;
        return sourcesContent;
      }
      const INVALID_ORIGINAL_MAPPING = Object.freeze({
        source: null,
        line: null,
        column: null,
        name: null
      });
      const INVALID_GENERATED_MAPPING = Object.freeze({
        line: null,
        column: null
      });
      const LINE_GTR_ZERO = "`line` must be greater than 0 (lines start at line 1)";
      const COL_GTR_EQ_ZERO = "`column` must be greater than or equal to 0 (columns start at column 0)";
      const LEAST_UPPER_BOUND = -1;
      const GREATEST_LOWER_BOUND = 1;
      exports3.encodedMappings = void 0;
      exports3.decodedMappings = void 0;
      exports3.traceSegment = void 0;
      exports3.originalPositionFor = void 0;
      exports3.generatedPositionFor = void 0;
      exports3.eachMapping = void 0;
      exports3.presortedDecodedMap = void 0;
      exports3.decodedMap = void 0;
      exports3.encodedMap = void 0;
      class TraceMap {
        constructor(map, mapUrl) {
          this._decodedMemo = memoizedState();
          this._bySources = void 0;
          this._bySourceMemos = void 0;
          const isString = typeof map === "string";
          if (!isString && map.constructor === TraceMap)
            return map;
          const parsed = isString ? JSON.parse(map) : map;
          const { version, file, names, sourceRoot, sources, sourcesContent } = parsed;
          this.version = version;
          this.file = file;
          this.names = names;
          this.sourceRoot = sourceRoot;
          this.sources = sources;
          this.sourcesContent = sourcesContent;
          if (sourceRoot || mapUrl) {
            const from = resolve(sourceRoot || "", stripFilename(mapUrl));
            this.resolvedSources = sources.map((s) => resolve(s || "", from));
          } else {
            this.resolvedSources = sources.map((s) => s || "");
          }
          const { mappings } = parsed;
          if (typeof mappings === "string") {
            this._encoded = mappings;
            this._decoded = void 0;
          } else {
            this._encoded = void 0;
            this._decoded = maybeSort(mappings, isString);
          }
        }
      }
      (() => {
        exports3.encodedMappings = (map) => {
          var _a;
          return (_a = map._encoded) !== null && _a !== void 0 ? _a : map._encoded = sourcemapCodec.encode(map._decoded);
        };
        exports3.decodedMappings = (map) => {
          return map._decoded || (map._decoded = sourcemapCodec.decode(map._encoded));
        };
        exports3.traceSegment = (map, line, column2) => {
          const decoded = exports3.decodedMappings(map);
          if (line >= decoded.length)
            return null;
          return traceSegmentInternal(decoded[line], map._decodedMemo, line, column2, GREATEST_LOWER_BOUND);
        };
        exports3.originalPositionFor = (map, { line, column: column2, bias }) => {
          line--;
          if (line < 0)
            throw new Error(LINE_GTR_ZERO);
          if (column2 < 0)
            throw new Error(COL_GTR_EQ_ZERO);
          const decoded = exports3.decodedMappings(map);
          if (line >= decoded.length)
            return INVALID_ORIGINAL_MAPPING;
          const segment = traceSegmentInternal(decoded[line], map._decodedMemo, line, column2, bias || GREATEST_LOWER_BOUND);
          if (segment == null)
            return INVALID_ORIGINAL_MAPPING;
          if (segment.length == 1)
            return INVALID_ORIGINAL_MAPPING;
          const { names, resolvedSources } = map;
          return {
            source: resolvedSources[segment[SOURCES_INDEX]],
            line: segment[SOURCE_LINE] + 1,
            column: segment[SOURCE_COLUMN],
            name: segment.length === 5 ? names[segment[NAMES_INDEX]] : null
          };
        };
        exports3.generatedPositionFor = (map, { source, line, column: column2, bias }) => {
          line--;
          if (line < 0)
            throw new Error(LINE_GTR_ZERO);
          if (column2 < 0)
            throw new Error(COL_GTR_EQ_ZERO);
          const { sources, resolvedSources } = map;
          let sourceIndex = sources.indexOf(source);
          if (sourceIndex === -1)
            sourceIndex = resolvedSources.indexOf(source);
          if (sourceIndex === -1)
            return INVALID_GENERATED_MAPPING;
          const generated = map._bySources || (map._bySources = buildBySources(exports3.decodedMappings(map), map._bySourceMemos = sources.map(memoizedState)));
          const memos = map._bySourceMemos;
          const segments = generated[sourceIndex][line];
          if (segments == null)
            return INVALID_GENERATED_MAPPING;
          const segment = traceSegmentInternal(segments, memos[sourceIndex], line, column2, bias || GREATEST_LOWER_BOUND);
          if (segment == null)
            return INVALID_GENERATED_MAPPING;
          return {
            line: segment[REV_GENERATED_LINE] + 1,
            column: segment[REV_GENERATED_COLUMN]
          };
        };
        exports3.eachMapping = (map, cb) => {
          const decoded = exports3.decodedMappings(map);
          const { names, resolvedSources } = map;
          for (let i = 0; i < decoded.length; i++) {
            const line = decoded[i];
            for (let j = 0; j < line.length; j++) {
              const seg = line[j];
              const generatedLine = i + 1;
              const generatedColumn = seg[0];
              let source = null;
              let originalLine = null;
              let originalColumn = null;
              let name = null;
              if (seg.length !== 1) {
                source = resolvedSources[seg[1]];
                originalLine = seg[2] + 1;
                originalColumn = seg[3];
              }
              if (seg.length === 5)
                name = names[seg[4]];
              cb({
                generatedLine,
                generatedColumn,
                source,
                originalLine,
                originalColumn,
                name
              });
            }
          }
        };
        exports3.presortedDecodedMap = (map, mapUrl) => {
          const clone = Object.assign({}, map);
          clone.mappings = [];
          const tracer = new TraceMap(clone, mapUrl);
          tracer._decoded = map.mappings;
          return tracer;
        };
        exports3.decodedMap = (map) => {
          return {
            version: 3,
            file: map.file,
            names: map.names,
            sourceRoot: map.sourceRoot,
            sources: map.sources,
            sourcesContent: map.sourcesContent,
            mappings: exports3.decodedMappings(map)
          };
        };
        exports3.encodedMap = (map) => {
          return {
            version: 3,
            file: map.file,
            names: map.names,
            sourceRoot: map.sourceRoot,
            sources: map.sources,
            sourcesContent: map.sourcesContent,
            mappings: exports3.encodedMappings(map)
          };
        };
      })();
      function traceSegmentInternal(segments, memo, line, column2, bias) {
        let index = memoizedBinarySearch(segments, column2, memo, line);
        if (found) {
          index = (bias === LEAST_UPPER_BOUND ? upperBound : lowerBound)(segments, column2, index);
        } else if (bias === LEAST_UPPER_BOUND)
          index++;
        if (index === -1 || index === segments.length)
          return null;
        return segments[index];
      }
      exports3.AnyMap = AnyMap;
      exports3.GREATEST_LOWER_BOUND = GREATEST_LOWER_BOUND;
      exports3.LEAST_UPPER_BOUND = LEAST_UPPER_BOUND;
      exports3.TraceMap = TraceMap;
      Object.defineProperty(exports3, "__esModule", { value: true });
    });
  }
});

// node_modules/@cspotcode/source-map-support/source-map-support.js
var require_source_map_support = __commonJS({
  "node_modules/@cspotcode/source-map-support/source-map-support.js"(exports2, module2) {
    "use strict";
    init_cjs_shims();
    var { TraceMap, originalPositionFor, AnyMap } = require_trace_mapping_umd();
    var path3 = require("path");
    var { fileURLToPath, pathToFileURL } = require("url");
    var util = require("util");
    var fs3;
    try {
      fs3 = require("fs");
      if (!fs3.existsSync || !fs3.readFileSync) {
        fs3 = null;
      }
    } catch (err) {
    }
    function dynamicRequire(mod, request) {
      return mod.require(request);
    }
    var sharedDataVersion = 1;
    function initializeSharedData(defaults) {
      var sharedDataKey = "source-map-support/sharedData";
      if (typeof Symbol !== "undefined") {
        sharedDataKey = Symbol.for(sharedDataKey);
      }
      var sharedData2 = this[sharedDataKey];
      if (!sharedData2) {
        sharedData2 = { version: sharedDataVersion };
        if (Object.defineProperty) {
          Object.defineProperty(this, sharedDataKey, { value: sharedData2 });
        } else {
          this[sharedDataKey] = sharedData2;
        }
      }
      if (sharedDataVersion !== sharedData2.version) {
        throw new Error("Multiple incompatible instances of source-map-support were loaded");
      }
      for (var key in defaults) {
        if (!(key in sharedData2)) {
          sharedData2[key] = defaults[key];
        }
      }
      return sharedData2;
    }
    var sharedData = initializeSharedData({
      // Only install once if called multiple times
      // Remember how the environment looked before installation so we can restore if able
      /** @type {HookState} */
      errorPrepareStackTraceHook: void 0,
      /** @type {HookState} */
      processEmitHook: void 0,
      /** @type {HookState} */
      moduleResolveFilenameHook: void 0,
      /** @type {Array<(request: string, parent: any, isMain: boolean, options: any, redirectedRequest: string) => void>} */
      onConflictingLibraryRedirectArr: [],
      // If true, the caches are reset before a stack trace formatting operation
      emptyCacheBetweenOperations: false,
      // Maps a file path to a string containing the file contents
      fileContentsCache: /* @__PURE__ */ Object.create(null),
      // Maps a file path to a source map for that file
      /** @type {Record<string, {url: string, map: TraceMap}} */
      sourceMapCache: /* @__PURE__ */ Object.create(null),
      // Priority list of retrieve handlers
      retrieveFileHandlers: [],
      retrieveMapHandlers: [],
      // Priority list of internally-implemented handlers.
      // When resetting state, we must keep these.
      internalRetrieveFileHandlers: [],
      internalRetrieveMapHandlers: []
    });
    var environment = "auto";
    var reSourceMap = /^data:application\/json[^,]+base64,/;
    function isInBrowser() {
      if (environment === "browser")
        return true;
      if (environment === "node")
        return false;
      return typeof window !== "undefined" && typeof XMLHttpRequest === "function" && !(window.require && window.module && window.process && window.process.type === "renderer");
    }
    function hasGlobalProcessEventEmitter() {
      return typeof process === "object" && process !== null && typeof process.on === "function";
    }
    function tryFileURLToPath(v) {
      if (isFileUrl(v)) {
        return fileURLToPath(v);
      }
      return v;
    }
    function isFileUrl(input) {
      return input.startsWith("file:");
    }
    function isAbsoluteUrl(input) {
      return schemeRegex.test(input);
    }
    var schemeRegex = /^[\w+.-]+:\/\//;
    function isSchemeRelativeUrl(input) {
      return input.startsWith("//");
    }
    function getCacheKey(pathOrFileUrl) {
      if (pathOrFileUrl.startsWith("node:")) return pathOrFileUrl;
      if (isFileUrl(pathOrFileUrl)) {
        return new URL(pathOrFileUrl).toString();
      } else {
        try {
          return pathToFileURL(pathOrFileUrl).toString();
        } catch {
          return pathOrFileUrl;
        }
      }
    }
    function getFileContentsCache(key) {
      return sharedData.fileContentsCache[getCacheKey(key)];
    }
    function hasFileContentsCacheFromKey(key) {
      return Object.prototype.hasOwnProperty.call(sharedData.fileContentsCache, key);
    }
    function getFileContentsCacheFromKey(key) {
      return sharedData.fileContentsCache[key];
    }
    function setFileContentsCache(key, value2) {
      return sharedData.fileContentsCache[getCacheKey(key)] = value2;
    }
    function getSourceMapCache(key) {
      return sharedData.sourceMapCache[getCacheKey(key)];
    }
    function setSourceMapCache(key, value2) {
      return sharedData.sourceMapCache[getCacheKey(key)] = value2;
    }
    function clearCaches() {
      sharedData.fileContentsCache = /* @__PURE__ */ Object.create(null);
      sharedData.sourceMapCache = /* @__PURE__ */ Object.create(null);
    }
    function handlerExec(list, internalList) {
      return function(arg) {
        for (var i = 0; i < list.length; i++) {
          var ret = list[i](arg);
          if (ret) {
            return ret;
          }
        }
        for (var i = 0; i < internalList.length; i++) {
          var ret = internalList[i](arg);
          if (ret) {
            return ret;
          }
        }
        return null;
      };
    }
    var retrieveFile = handlerExec(sharedData.retrieveFileHandlers, sharedData.internalRetrieveFileHandlers);
    sharedData.internalRetrieveFileHandlers.push(function(path4) {
      path4 = path4.trim();
      if (/^file:/.test(path4)) {
        path4 = path4.replace(/file:\/\/\/(\w:)?/, function(protocol, drive) {
          return drive ? "" : (
            // file:///C:/dir/file -> C:/dir/file
            "/"
          );
        });
      }
      const key = getCacheKey(path4);
      if (hasFileContentsCacheFromKey(key)) {
        return getFileContentsCacheFromKey(key);
      }
      var contents = "";
      try {
        if (!fs3) {
          var xhr = new XMLHttpRequest();
          xhr.open(
            "GET",
            path4,
            /** async */
            false
          );
          xhr.send(null);
          if (xhr.readyState === 4 && xhr.status === 200) {
            contents = xhr.responseText;
          }
        } else if (fs3.existsSync(path4)) {
          contents = fs3.readFileSync(path4, "utf8");
        }
      } catch (er) {
      }
      return setFileContentsCache(path4, contents);
    });
    function supportRelativeURL(file, url) {
      if (!file) return url;
      try {
        if (isAbsoluteUrl(file) || isSchemeRelativeUrl(file)) {
          if (isAbsoluteUrl(url) || isSchemeRelativeUrl(url)) {
            return new URL(url, file).toString();
          }
          if (path3.isAbsolute(url)) {
            return new URL(pathToFileURL(url), file).toString();
          }
          return new URL(url.replace(/\\/g, "/"), file).toString();
        }
        if (path3.isAbsolute(file)) {
          if (isFileUrl(url)) {
            return fileURLToPath(url);
          }
          if (isSchemeRelativeUrl(url)) {
            return fileURLToPath(new URL(url, "file://"));
          }
          if (isAbsoluteUrl(url)) {
            return url;
          }
          if (path3.isAbsolute(url)) {
            return path3.normalize(url);
          }
          return path3.join(file, "..", decodeURI(url));
        }
        if (isAbsoluteUrl(url) || isSchemeRelativeUrl(url)) {
          return url;
        }
        return path3.join(file, "..", url);
      } catch (e) {
        return url;
      }
    }
    function matchStyleOfPathOrUrl(matchStyleOf, pathOrUrl) {
      try {
        if (isAbsoluteUrl(matchStyleOf) || isSchemeRelativeUrl(matchStyleOf)) {
          if (isAbsoluteUrl(pathOrUrl) || isSchemeRelativeUrl(pathOrUrl)) return pathOrUrl;
          if (path3.isAbsolute(pathOrUrl)) return pathToFileURL(pathOrUrl).toString();
        } else if (path3.isAbsolute(matchStyleOf)) {
          if (isAbsoluteUrl(pathOrUrl) || isSchemeRelativeUrl(pathOrUrl)) {
            return fileURLToPath(new URL(pathOrUrl, "file://"));
          }
        }
        return pathOrUrl;
      } catch (e) {
        return pathOrUrl;
      }
    }
    function retrieveSourceMapURL(source) {
      var fileData;
      if (isInBrowser()) {
        try {
          var xhr = new XMLHttpRequest();
          xhr.open("GET", source, false);
          xhr.send(null);
          fileData = xhr.readyState === 4 ? xhr.responseText : null;
          var sourceMapHeader = xhr.getResponseHeader("SourceMap") || xhr.getResponseHeader("X-SourceMap");
          if (sourceMapHeader) {
            return sourceMapHeader;
          }
        } catch (e) {
        }
      }
      fileData = retrieveFile(tryFileURLToPath(source));
      var re = /(?:\/\/[@#][\s]*sourceMappingURL=([^\s'"]+)[\s]*$)|(?:\/\*[@#][\s]*sourceMappingURL=([^\s*'"]+)[\s]*(?:\*\/)[\s]*$)/mg;
      var lastMatch, match;
      while (match = re.exec(fileData)) lastMatch = match;
      if (!lastMatch) return null;
      return lastMatch[1];
    }
    var retrieveSourceMap = handlerExec(sharedData.retrieveMapHandlers, sharedData.internalRetrieveMapHandlers);
    sharedData.internalRetrieveMapHandlers.push(function(source) {
      var sourceMappingURL = retrieveSourceMapURL(source);
      if (!sourceMappingURL) return null;
      var sourceMapData;
      if (reSourceMap.test(sourceMappingURL)) {
        var rawData = sourceMappingURL.slice(sourceMappingURL.indexOf(",") + 1);
        sourceMapData = Buffer.from(rawData, "base64").toString();
        sourceMappingURL = source;
      } else {
        sourceMappingURL = supportRelativeURL(source, sourceMappingURL);
        sourceMapData = retrieveFile(tryFileURLToPath(sourceMappingURL));
      }
      if (!sourceMapData) {
        return null;
      }
      return {
        url: sourceMappingURL,
        map: sourceMapData
      };
    });
    function mapSourcePosition(position) {
      var sourceMap = getSourceMapCache(position.source);
      if (!sourceMap) {
        var urlAndMap = retrieveSourceMap(position.source);
        if (urlAndMap) {
          sourceMap = setSourceMapCache(position.source, {
            url: urlAndMap.url,
            map: new AnyMap(urlAndMap.map, urlAndMap.url)
          });
          sourceMap.map.resolvedSources = sourceMap.map.sources.map((s) => supportRelativeURL(sourceMap.url, s));
          if (sourceMap.map.sourcesContent) {
            sourceMap.map.resolvedSources.forEach(function(resolvedSource, i) {
              var contents = sourceMap.map.sourcesContent[i];
              if (contents) {
                setFileContentsCache(resolvedSource, contents);
              }
            });
          }
        } else {
          sourceMap = setSourceMapCache(position.source, {
            url: null,
            map: null
          });
        }
      }
      if (sourceMap && sourceMap.map) {
        var originalPosition = originalPositionFor(sourceMap.map, position);
        if (originalPosition.source !== null) {
          originalPosition.source = matchStyleOfPathOrUrl(
            position.source,
            originalPosition.source
          );
          return originalPosition;
        }
      }
      return position;
    }
    function mapEvalOrigin(origin) {
      var match = /^eval at ([^(]+) \((.+):(\d+):(\d+)\)$/.exec(origin);
      if (match) {
        var position = mapSourcePosition({
          source: match[2],
          line: +match[3],
          column: match[4] - 1
        });
        return "eval at " + match[1] + " (" + position.source + ":" + position.line + ":" + (position.column + 1) + ")";
      }
      match = /^eval at ([^(]+) \((.+)\)$/.exec(origin);
      if (match) {
        return "eval at " + match[1] + " (" + mapEvalOrigin(match[2]) + ")";
      }
      return origin;
    }
    function CallSiteToString() {
      var fileName;
      var fileLocation = "";
      if (this.isNative()) {
        fileLocation = "native";
      } else {
        fileName = this.getScriptNameOrSourceURL();
        if (!fileName && this.isEval()) {
          fileLocation = this.getEvalOrigin();
          fileLocation += ", ";
        }
        if (fileName) {
          fileLocation += fileName;
        } else {
          fileLocation += "<anonymous>";
        }
        var lineNumber = this.getLineNumber();
        if (lineNumber != null) {
          fileLocation += ":" + lineNumber;
          var columnNumber = this.getColumnNumber();
          if (columnNumber) {
            fileLocation += ":" + columnNumber;
          }
        }
      }
      var line = "";
      var isAsync = this.isAsync ? this.isAsync() : false;
      if (isAsync) {
        line += "async ";
        var isPromiseAll = this.isPromiseAll ? this.isPromiseAll() : false;
        var isPromiseAny = this.isPromiseAny ? this.isPromiseAny() : false;
        if (isPromiseAny || isPromiseAll) {
          line += isPromiseAll ? "Promise.all (index " : "Promise.any (index ";
          var promiseIndex = this.getPromiseIndex();
          line += promiseIndex + ")";
        }
      }
      var functionName = this.getFunctionName();
      var addSuffix = true;
      var isConstructor = this.isConstructor();
      var isMethodCall = !(this.isToplevel() || isConstructor);
      if (isMethodCall) {
        var typeName = this.getTypeName();
        if (typeName === "[object Object]") {
          typeName = "null";
        }
        var methodName = this.getMethodName();
        if (functionName) {
          if (typeName && functionName.indexOf(typeName) != 0) {
            line += typeName + ".";
          }
          line += functionName;
          if (methodName && functionName.indexOf("." + methodName) != functionName.length - methodName.length - 1) {
            line += " [as " + methodName + "]";
          }
        } else {
          line += typeName + "." + (methodName || "<anonymous>");
        }
      } else if (isConstructor) {
        line += "new " + (functionName || "<anonymous>");
      } else if (functionName) {
        line += functionName;
      } else {
        line += fileLocation;
        addSuffix = false;
      }
      if (addSuffix) {
        line += " (" + fileLocation + ")";
      }
      return line;
    }
    function cloneCallSite(frame) {
      var object = {};
      Object.getOwnPropertyNames(Object.getPrototypeOf(frame)).forEach(function(name) {
        object[name] = /^(?:is|get)/.test(name) ? function() {
          return frame[name].call(frame);
        } : frame[name];
      });
      object.toString = CallSiteToString;
      return object;
    }
    function wrapCallSite(frame, state) {
      if (state === void 0) {
        state = { nextPosition: null, curPosition: null };
      }
      if (frame.isNative()) {
        state.curPosition = null;
        return frame;
      }
      var source = frame.getFileName() || frame.getScriptNameOrSourceURL();
      if (source) {
        if (source.startsWith("wasm://")) {
          state.curPosition = null;
          return frame;
        }
        var line = frame.getLineNumber();
        var column2 = frame.getColumnNumber() - 1;
        var noHeader = /^v(10\.1[6-9]|10\.[2-9][0-9]|10\.[0-9]{3,}|1[2-9]\d*|[2-9]\d|\d{3,}|11\.11)/;
        var headerLength = noHeader.test(process.version) ? 0 : 62;
        if (line === 1 && column2 > headerLength && !isInBrowser() && !frame.isEval()) {
          column2 -= headerLength;
        }
        var position = mapSourcePosition({
          source,
          line,
          column: column2
        });
        state.curPosition = position;
        frame = cloneCallSite(frame);
        var originalFunctionName = frame.getFunctionName;
        frame.getFunctionName = function() {
          if (state.nextPosition == null) {
            return originalFunctionName();
          }
          return state.nextPosition.name || originalFunctionName();
        };
        frame.getFileName = function() {
          return position.source;
        };
        frame.getLineNumber = function() {
          return position.line;
        };
        frame.getColumnNumber = function() {
          return position.column + 1;
        };
        frame.getScriptNameOrSourceURL = function() {
          return position.source;
        };
        return frame;
      }
      var origin = frame.isEval() && frame.getEvalOrigin();
      if (origin) {
        origin = mapEvalOrigin(origin);
        frame = cloneCallSite(frame);
        frame.getEvalOrigin = function() {
          return origin;
        };
        return frame;
      }
      return frame;
    }
    var kIsNodeError = void 0;
    try {
      path3.resolve(123);
    } catch (e) {
      const symbols = Object.getOwnPropertySymbols(e);
      const symbol = symbols.find(function(s) {
        return s.toString().indexOf("kIsNodeError") >= 0;
      });
      if (symbol) kIsNodeError = symbol;
    }
    var ErrorPrototypeToString = (err) => Error.prototype.toString.call(err);
    function createPrepareStackTrace(hookState) {
      return prepareStackTrace;
      function prepareStackTrace(error, stack) {
        if (!hookState.enabled) return hookState.originalValue.apply(this, arguments);
        if (sharedData.emptyCacheBetweenOperations) {
          clearCaches();
        }
        var errorString;
        if (kIsNodeError) {
          if (kIsNodeError in error) {
            errorString = `${error.name} [${error.code}]: ${error.message}`;
          } else {
            errorString = ErrorPrototypeToString(error);
          }
        } else {
          var name = error.name || "Error";
          var message = error.message || "";
          errorString = message ? name + ": " + message : name;
        }
        var state = { nextPosition: null, curPosition: null };
        var processedStack = [];
        for (var i = stack.length - 1; i >= 0; i--) {
          processedStack.push("\n    at " + wrapCallSite(stack[i], state));
          state.nextPosition = state.curPosition;
        }
        state.curPosition = state.nextPosition = null;
        return errorString + processedStack.reverse().join("");
      }
    }
    function getErrorSource(error) {
      var match = /\n    at [^(]+ \((.*):(\d+):(\d+)\)/.exec(error.stack);
      if (match) {
        var source = match[1];
        var line = +match[2];
        var column2 = +match[3];
        var contents = getFileContentsCache(source);
        const sourceAsPath = tryFileURLToPath(source);
        if (!contents && fs3 && fs3.existsSync(sourceAsPath)) {
          try {
            contents = fs3.readFileSync(sourceAsPath, "utf8");
          } catch (er) {
            contents = "";
          }
        }
        if (contents) {
          var code = contents.split(/(?:\r\n|\r|\n)/)[line - 1];
          if (code) {
            return source + ":" + line + "\n" + code + "\n" + new Array(column2).join(" ") + "^";
          }
        }
      }
      return null;
    }
    function printFatalErrorUponExit(error) {
      var source = getErrorSource(error);
      if (process.stderr._handle && process.stderr._handle.setBlocking) {
        process.stderr._handle.setBlocking(true);
      }
      if (source) {
        console.error(source);
      }
      console.error(
        util.inspect(error, {
          customInspect: false,
          colors: process.stderr.isTTY
        })
      );
    }
    function shimEmitUncaughtException() {
      const originalValue = process.emit;
      var hook = sharedData.processEmitHook = {
        enabled: true,
        originalValue,
        installedValue: void 0
      };
      var isTerminatingDueToFatalException = false;
      var fatalException;
      process.emit = sharedData.processEmitHook.installedValue = function(type) {
        const hadListeners = originalValue.apply(this, arguments);
        if (hook.enabled) {
          if (type === "uncaughtException" && !hadListeners) {
            isTerminatingDueToFatalException = true;
            fatalException = arguments[1];
            process.exit(1);
          }
          if (type === "exit" && isTerminatingDueToFatalException) {
            printFatalErrorUponExit(fatalException);
          }
        }
        return hadListeners;
      };
    }
    var originalRetrieveFileHandlers = sharedData.retrieveFileHandlers.slice(0);
    var originalRetrieveMapHandlers = sharedData.retrieveMapHandlers.slice(0);
    exports2.wrapCallSite = wrapCallSite;
    exports2.getErrorSource = getErrorSource;
    exports2.mapSourcePosition = mapSourcePosition;
    exports2.retrieveSourceMap = retrieveSourceMap;
    exports2.install = function(options) {
      options = options || {};
      if (options.environment) {
        environment = options.environment;
        if (["node", "browser", "auto"].indexOf(environment) === -1) {
          throw new Error("environment " + environment + " was unknown. Available options are {auto, browser, node}");
        }
      }
      var Module = dynamicRequire(module2, "module");
      const { redirectConflictingLibrary = true, onConflictingLibraryRedirect } = options;
      if (redirectConflictingLibrary) {
        if (!sharedData.moduleResolveFilenameHook) {
          const originalValue = Module._resolveFilename;
          const moduleResolveFilenameHook = sharedData.moduleResolveFilenameHook = {
            enabled: true,
            originalValue,
            installedValue: void 0
          };
          Module._resolveFilename = sharedData.moduleResolveFilenameHook.installedValue = function(request, parent, isMain, options2) {
            if (moduleResolveFilenameHook.enabled) {
              let requestRedirect;
              if (request === "source-map-support") {
                requestRedirect = "./";
              } else if (request === "source-map-support/register") {
                requestRedirect = "./register";
              }
              if (requestRedirect !== void 0) {
                const newRequest = require.resolve(requestRedirect);
                for (const cb of sharedData.onConflictingLibraryRedirectArr) {
                  cb(request, parent, isMain, options2, newRequest);
                }
                request = newRequest;
              }
            }
            return originalValue.call(this, request, parent, isMain, options2);
          };
        }
        if (onConflictingLibraryRedirect) {
          sharedData.onConflictingLibraryRedirectArr.push(onConflictingLibraryRedirect);
        }
      }
      if (options.retrieveFile) {
        if (options.overrideRetrieveFile) {
          sharedData.retrieveFileHandlers.length = 0;
        }
        sharedData.retrieveFileHandlers.unshift(options.retrieveFile);
      }
      if (options.retrieveSourceMap) {
        if (options.overrideRetrieveSourceMap) {
          sharedData.retrieveMapHandlers.length = 0;
        }
        sharedData.retrieveMapHandlers.unshift(options.retrieveSourceMap);
      }
      if (options.hookRequire && !isInBrowser()) {
        var $compile = Module.prototype._compile;
        if (!$compile.__sourceMapSupport) {
          Module.prototype._compile = function(content, filename) {
            setFileContentsCache(filename, content);
            setSourceMapCache(filename, void 0);
            return $compile.call(this, content, filename);
          };
          Module.prototype._compile.__sourceMapSupport = true;
        }
      }
      if (!sharedData.emptyCacheBetweenOperations) {
        sharedData.emptyCacheBetweenOperations = "emptyCacheBetweenOperations" in options ? options.emptyCacheBetweenOperations : false;
      }
      if (!sharedData.errorPrepareStackTraceHook) {
        const originalValue = Error.prepareStackTrace;
        sharedData.errorPrepareStackTraceHook = {
          enabled: true,
          originalValue,
          installedValue: void 0
        };
        Error.prepareStackTrace = sharedData.errorPrepareStackTraceHook.installedValue = createPrepareStackTrace(sharedData.errorPrepareStackTraceHook);
      }
      if (!sharedData.processEmitHook) {
        var installHandler = "handleUncaughtExceptions" in options ? options.handleUncaughtExceptions : true;
        try {
          var worker_threads = dynamicRequire(module2, "worker_threads");
          if (worker_threads.isMainThread === false) {
            installHandler = false;
          }
        } catch (e) {
        }
        if (installHandler && hasGlobalProcessEventEmitter()) {
          shimEmitUncaughtException();
        }
      }
    };
    exports2.uninstall = function() {
      if (sharedData.processEmitHook) {
        sharedData.processEmitHook.enabled = false;
        if (process.emit === sharedData.processEmitHook.installedValue) {
          process.emit = sharedData.processEmitHook.originalValue;
        }
        sharedData.processEmitHook = void 0;
      }
      if (sharedData.errorPrepareStackTraceHook) {
        sharedData.errorPrepareStackTraceHook.enabled = false;
        if (Error.prepareStackTrace === sharedData.errorPrepareStackTraceHook.installedValue || typeof sharedData.errorPrepareStackTraceHook.originalValue !== "function") {
          Error.prepareStackTrace = sharedData.errorPrepareStackTraceHook.originalValue;
        }
        sharedData.errorPrepareStackTraceHook = void 0;
      }
      if (sharedData.moduleResolveFilenameHook) {
        sharedData.moduleResolveFilenameHook.enabled = false;
        var Module = dynamicRequire(module2, "module");
        if (Module._resolveFilename === sharedData.moduleResolveFilenameHook.installedValue) {
          Module._resolveFilename = sharedData.moduleResolveFilenameHook.originalValue;
        }
        sharedData.moduleResolveFilenameHook = void 0;
      }
      sharedData.onConflictingLibraryRedirectArr.length = 0;
    };
    exports2.resetRetrieveHandlers = function() {
      sharedData.retrieveFileHandlers.length = 0;
      sharedData.retrieveMapHandlers.length = 0;
    };
  }
});

// node_modules/ts-node/dist-raw/node-internal-modules-esm-resolve.js
var require_node_internal_modules_esm_resolve = __commonJS({
  "node_modules/ts-node/dist-raw/node-internal-modules-esm-resolve.js"(exports2, module2) {
    "use strict";
    init_cjs_shims();
    var { versionGteLt } = require_util();
    var builtinModuleProtocol = versionGteLt(process.versions.node, "14.13.1") || versionGteLt(process.versions.node, "12.20.0", "13.0.0") ? "node:" : "nodejs:";
    var {
      ArrayIsArray,
      ArrayPrototypeJoin,
      ArrayPrototypeShift,
      JSONParse,
      JSONStringify,
      ObjectFreeze,
      ObjectGetOwnPropertyNames,
      ObjectPrototypeHasOwnProperty,
      RegExpPrototypeTest,
      SafeMap,
      SafeSet,
      StringPrototypeEndsWith,
      StringPrototypeIndexOf,
      StringPrototypeLastIndexOf,
      StringPrototypeReplace,
      StringPrototypeSlice,
      StringPrototypeSplit,
      StringPrototypeStartsWith,
      StringPrototypeSubstr
    } = require_node_primordials();
    var Module = require("module");
    var { NativeModule } = require_node_nativemodule();
    var {
      realpathSync,
      statSync,
      Stats
    } = require("fs");
    var { getOptionValue } = require_node_options();
    var policy = null;
    var { sep, relative } = require("path");
    var preserveSymlinks = getOptionValue("--preserve-symlinks");
    var preserveSymlinksMain = getOptionValue("--preserve-symlinks-main");
    var typeFlag = getOptionValue("--input-type");
    var { URL: URL2, pathToFileURL, fileURLToPath } = require("url");
    var {
      ERR_INPUT_TYPE_NOT_ALLOWED,
      ERR_INVALID_ARG_VALUE: ERR_INVALID_ARG_VALUE2,
      ERR_INVALID_MODULE_SPECIFIER,
      ERR_INVALID_PACKAGE_CONFIG,
      ERR_INVALID_PACKAGE_TARGET,
      ERR_MANIFEST_DEPENDENCY_MISSING,
      ERR_MODULE_NOT_FOUND,
      ERR_PACKAGE_IMPORT_NOT_DEFINED,
      ERR_PACKAGE_PATH_NOT_EXPORTED,
      ERR_UNSUPPORTED_DIR_IMPORT,
      ERR_UNSUPPORTED_ESM_URL_SCHEME
      // } = require('internal/errors').codes;
    } = require_node_internal_errors().codes;
    var CJSModule = Module;
    var packageJsonReader = require_node_internal_modules_package_json_reader();
    var userConditions = getOptionValue("--conditions");
    var DEFAULT_CONDITIONS = ObjectFreeze(["node", "import", ...userConditions]);
    var DEFAULT_CONDITIONS_SET = new SafeSet(DEFAULT_CONDITIONS);
    var pendingDeprecation = getOptionValue("--pending-deprecation");
    function createResolve(opts) {
      const { preferTsExts, tsNodeExperimentalSpecifierResolution, extensions } = opts;
      const esrnExtensions = extensions.experimentalSpecifierResolutionAddsIfOmitted;
      const { legacyMainResolveAddsIfOmitted, replacementsForCjs, replacementsForJs, replacementsForMjs, replacementsForJsx } = extensions;
      const experimentalSpecifierResolution = tsNodeExperimentalSpecifierResolution != null ? tsNodeExperimentalSpecifierResolution : getOptionValue("--experimental-specifier-resolution");
      const emittedPackageWarnings = new SafeSet();
      function emitFolderMapDeprecation(match, pjsonUrl, isExports, base) {
        const pjsonPath = fileURLToPath(pjsonUrl);
        if (!pendingDeprecation) {
          const nodeModulesIndex = StringPrototypeLastIndexOf(
            pjsonPath,
            "/node_modules/"
          );
          if (nodeModulesIndex !== -1) {
            const afterNodeModulesPath = StringPrototypeSlice(
              pjsonPath,
              nodeModulesIndex + 14,
              -13
            );
            try {
              const { packageSubpath } = parsePackageName(afterNodeModulesPath);
              if (packageSubpath === ".")
                return;
            } catch {
            }
          }
        }
        if (emittedPackageWarnings.has(pjsonPath + "|" + match))
          return;
        emittedPackageWarnings.add(pjsonPath + "|" + match);
        process.emitWarning(
          `Use of deprecated folder mapping "${match}" in the ${isExports ? '"exports"' : '"imports"'} field module resolution of the package at ${pjsonPath}${base ? ` imported from ${fileURLToPath(base)}` : ""}.
Update this package.json to use a subpath pattern like "${match}*".`,
          "DeprecationWarning",
          "DEP0148"
        );
      }
      function getConditionsSet(conditions) {
        if (conditions !== void 0 && conditions !== DEFAULT_CONDITIONS) {
          if (!ArrayIsArray(conditions)) {
            throw new ERR_INVALID_ARG_VALUE2(
              "conditions",
              conditions,
              "expected an array"
            );
          }
          return new SafeSet(conditions);
        }
        return DEFAULT_CONDITIONS_SET;
      }
      const realpathCache = new SafeMap();
      const packageJSONCache = new SafeMap();
      const statSupportsThrowIfNoEntry = versionGteLt(process.versions.node, "15.3.0") || versionGteLt(process.versions.node, "14.17.0", "15.0.0");
      const tryStatSync = statSupportsThrowIfNoEntry ? tryStatSyncWithoutErrors : tryStatSyncWithErrors;
      const statsIfNotFound = new Stats();
      function tryStatSyncWithoutErrors(path3) {
        const stats = statSync(path3, { throwIfNoEntry: false });
        if (stats != null) return stats;
        return statsIfNotFound;
      }
      function tryStatSyncWithErrors(path3) {
        try {
          return statSync(path3);
        } catch {
          return statsIfNotFound;
        }
      }
      function getPackageConfig(path3, specifier, base) {
        const existing = packageJSONCache.get(path3);
        if (existing !== void 0) {
          return existing;
        }
        const source = packageJsonReader.read(path3).string;
        if (source === void 0) {
          const packageConfig2 = {
            pjsonPath: path3,
            exists: false,
            main: void 0,
            name: void 0,
            type: "none",
            exports: void 0,
            imports: void 0
          };
          packageJSONCache.set(path3, packageConfig2);
          return packageConfig2;
        }
        let packageJSON;
        try {
          packageJSON = JSONParse(source);
        } catch (error) {
          throw new ERR_INVALID_PACKAGE_CONFIG(
            path3,
            (base ? `"${specifier}" from ` : "") + fileURLToPath(base || specifier),
            error.message
          );
        }
        let { imports, main, name, type } = packageJSON;
        const { exports: exports3 } = packageJSON;
        if (typeof imports !== "object" || imports === null) imports = void 0;
        if (typeof main !== "string") main = void 0;
        if (typeof name !== "string") name = void 0;
        if (type !== "module" && type !== "commonjs") type = "none";
        const packageConfig = {
          pjsonPath: path3,
          exists: true,
          main,
          name,
          type,
          exports: exports3,
          imports
        };
        packageJSONCache.set(path3, packageConfig);
        return packageConfig;
      }
      function getPackageScopeConfig(resolved) {
        let packageJSONUrl = new URL2("./package.json", resolved);
        while (true) {
          const packageJSONPath2 = packageJSONUrl.pathname;
          if (StringPrototypeEndsWith(packageJSONPath2, "node_modules/package.json"))
            break;
          const packageConfig2 = getPackageConfig(
            fileURLToPath(packageJSONUrl),
            resolved
          );
          if (packageConfig2.exists) return packageConfig2;
          const lastPackageJSONUrl = packageJSONUrl;
          packageJSONUrl = new URL2("../package.json", packageJSONUrl);
          if (packageJSONUrl.pathname === lastPackageJSONUrl.pathname) break;
        }
        const packageJSONPath = fileURLToPath(packageJSONUrl);
        const packageConfig = {
          pjsonPath: packageJSONPath,
          exists: false,
          main: void 0,
          name: void 0,
          type: "none",
          exports: void 0,
          imports: void 0
        };
        packageJSONCache.set(packageJSONPath, packageConfig);
        return packageConfig;
      }
      function fileExists(url) {
        return tryStatSync(fileURLToPath(url)).isFile();
      }
      function legacyMainResolve(packageJSONUrl, packageConfig, base) {
        let guess;
        if (packageConfig.main !== void 0) {
          if (guess = resolveReplacementExtensions(new URL2(`./${packageConfig.main}`, packageJSONUrl))) {
            return guess;
          }
          if (fileExists(guess = new URL2(
            `./${packageConfig.main}`,
            packageJSONUrl
          ))) {
            return guess;
          }
          for (const extension of legacyMainResolveAddsIfOmitted) {
            if (fileExists(guess = new URL2(
              `./${packageConfig.main}${extension}`,
              packageJSONUrl
            ))) {
              return guess;
            }
          }
          for (const extension of legacyMainResolveAddsIfOmitted) {
            if (fileExists(guess = new URL2(
              `./${packageConfig.main}/index${extension}`,
              packageJSONUrl
            ))) {
              return guess;
            }
          }
        }
        for (const extension of legacyMainResolveAddsIfOmitted) {
          if (fileExists(guess = new URL2(`./index${extension}`, packageJSONUrl))) {
            return guess;
          }
        }
        throw new ERR_MODULE_NOT_FOUND(
          fileURLToPath(new URL2(".", packageJSONUrl)),
          fileURLToPath(base)
        );
      }
      function resolveExtensionsWithTryExactName(search) {
        const resolvedReplacementExtension = resolveReplacementExtensions(search);
        if (resolvedReplacementExtension) return resolvedReplacementExtension;
        if (fileExists(search)) return search;
        return resolveExtensions(search);
      }
      function resolveExtensions(search) {
        for (let i = 0; i < esrnExtensions.length; i++) {
          const extension = esrnExtensions[i];
          const guess = new URL2(`${search.pathname}${extension}`, search);
          if (fileExists(guess)) return guess;
        }
        return void 0;
      }
      function resolveReplacementExtensions(search) {
        const lastDotIndex = search.pathname.lastIndexOf(".");
        if (lastDotIndex >= 0) {
          const ext = search.pathname.slice(lastDotIndex);
          if (ext === ".js" || ext === ".jsx" || ext === ".mjs" || ext === ".cjs") {
            const pathnameWithoutExtension = search.pathname.slice(0, lastDotIndex);
            const replacementExts = ext === ".js" ? replacementsForJs : ext === ".jsx" ? replacementsForJsx : ext === ".mjs" ? replacementsForMjs : replacementsForCjs;
            const guess = new URL2(search.toString());
            for (let i = 0; i < replacementExts.length; i++) {
              const extension = replacementExts[i];
              guess.pathname = `${pathnameWithoutExtension}${extension}`;
              if (fileExists(guess)) return guess;
            }
          }
        }
        return void 0;
      }
      function resolveIndex(search) {
        return resolveExtensions(new URL2("index", search));
      }
      const encodedSepRegEx = /%2F|%2C/i;
      function finalizeResolution(resolved, base) {
        if (RegExpPrototypeTest(encodedSepRegEx, resolved.pathname))
          throw new ERR_INVALID_MODULE_SPECIFIER(
            resolved.pathname,
            'must not include encoded "/" or "\\" characters',
            fileURLToPath(base)
          );
        if (experimentalSpecifierResolution === "node") {
          const path4 = fileURLToPath(resolved);
          let file2 = resolveExtensionsWithTryExactName(resolved);
          if (file2 !== void 0) return file2;
          if (!StringPrototypeEndsWith(path4, "/")) {
            file2 = resolveIndex(new URL2(`${resolved}/`));
            if (file2 !== void 0) return file2;
          } else {
            return resolveIndex(resolved) || resolved;
          }
          throw new ERR_MODULE_NOT_FOUND(
            resolved.pathname,
            fileURLToPath(base),
            "module"
          );
        }
        const file = resolveReplacementExtensions(resolved) || resolved;
        const path3 = fileURLToPath(file);
        const stats = tryStatSync(StringPrototypeEndsWith(path3, "/") ? StringPrototypeSlice(path3, -1) : path3);
        if (stats.isDirectory()) {
          const err = new ERR_UNSUPPORTED_DIR_IMPORT(path3, fileURLToPath(base));
          err.url = String(resolved);
          throw err;
        } else if (!stats.isFile()) {
          throw new ERR_MODULE_NOT_FOUND(
            path3 || resolved.pathname,
            fileURLToPath(base),
            "module"
          );
        }
        return file;
      }
      function throwImportNotDefined(specifier, packageJSONUrl, base) {
        throw new ERR_PACKAGE_IMPORT_NOT_DEFINED(
          specifier,
          packageJSONUrl && fileURLToPath(new URL2(".", packageJSONUrl)),
          fileURLToPath(base)
        );
      }
      function throwExportsNotFound(subpath, packageJSONUrl, base) {
        throw new ERR_PACKAGE_PATH_NOT_EXPORTED(
          fileURLToPath(new URL2(".", packageJSONUrl)),
          subpath,
          base && fileURLToPath(base)
        );
      }
      function throwInvalidSubpath(subpath, packageJSONUrl, internal, base) {
        const reason = `request is not a valid subpath for the "${internal ? "imports" : "exports"}" resolution of ${fileURLToPath(packageJSONUrl)}`;
        throw new ERR_INVALID_MODULE_SPECIFIER(
          subpath,
          reason,
          base && fileURLToPath(base)
        );
      }
      function throwInvalidPackageTarget(subpath, target, packageJSONUrl, internal, base) {
        if (typeof target === "object" && target !== null) {
          target = JSONStringify(target, null, "");
        } else {
          target = `${target}`;
        }
        throw new ERR_INVALID_PACKAGE_TARGET(
          fileURLToPath(new URL2(".", packageJSONUrl)),
          subpath,
          target,
          internal,
          base && fileURLToPath(base)
        );
      }
      const invalidSegmentRegEx = /(^|\\|\/)(\.\.?|node_modules)(\\|\/|$)/;
      const patternRegEx = /\*/g;
      function resolvePackageTargetString(target, subpath, match, packageJSONUrl, base, pattern, internal, conditions) {
        if (subpath !== "" && !pattern && target[target.length - 1] !== "/")
          throwInvalidPackageTarget(match, target, packageJSONUrl, internal, base);
        if (!StringPrototypeStartsWith(target, "./")) {
          if (internal && !StringPrototypeStartsWith(target, "../") && !StringPrototypeStartsWith(target, "/")) {
            let isURL = false;
            try {
              new URL2(target);
              isURL = true;
            } catch {
            }
            if (!isURL) {
              const exportTarget = pattern ? StringPrototypeReplace(target, patternRegEx, subpath) : target + subpath;
              return packageResolve(exportTarget, packageJSONUrl, conditions);
            }
          }
          throwInvalidPackageTarget(match, target, packageJSONUrl, internal, base);
        }
        if (RegExpPrototypeTest(invalidSegmentRegEx, StringPrototypeSlice(target, 2)))
          throwInvalidPackageTarget(match, target, packageJSONUrl, internal, base);
        const resolved = new URL2(target, packageJSONUrl);
        const resolvedPath = resolved.pathname;
        const packagePath = new URL2(".", packageJSONUrl).pathname;
        if (!StringPrototypeStartsWith(resolvedPath, packagePath))
          throwInvalidPackageTarget(match, target, packageJSONUrl, internal, base);
        if (subpath === "") return resolved;
        if (RegExpPrototypeTest(invalidSegmentRegEx, subpath))
          throwInvalidSubpath(match + subpath, packageJSONUrl, internal, base);
        if (pattern)
          return new URL2(StringPrototypeReplace(
            resolved.href,
            patternRegEx,
            subpath
          ));
        return new URL2(subpath, resolved);
      }
      function isArrayIndex(key) {
        const keyNum = +key;
        if (`${keyNum}` !== key) return false;
        return keyNum >= 0 && keyNum < 4294967295;
      }
      function resolvePackageTarget(packageJSONUrl, target, subpath, packageSubpath, base, pattern, internal, conditions) {
        if (typeof target === "string") {
          return resolvePackageTargetString(
            target,
            subpath,
            packageSubpath,
            packageJSONUrl,
            base,
            pattern,
            internal,
            conditions
          );
        } else if (ArrayIsArray(target)) {
          if (target.length === 0)
            return null;
          let lastException;
          for (let i = 0; i < target.length; i++) {
            const targetItem = target[i];
            let resolved;
            try {
              resolved = resolvePackageTarget(
                packageJSONUrl,
                targetItem,
                subpath,
                packageSubpath,
                base,
                pattern,
                internal,
                conditions
              );
            } catch (e) {
              lastException = e;
              if (e.code === "ERR_INVALID_PACKAGE_TARGET")
                continue;
              throw e;
            }
            if (resolved === void 0)
              continue;
            if (resolved === null) {
              lastException = null;
              continue;
            }
            return resolved;
          }
          if (lastException === void 0 || lastException === null)
            return lastException;
          throw lastException;
        } else if (typeof target === "object" && target !== null) {
          const keys = ObjectGetOwnPropertyNames(target);
          for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            if (isArrayIndex(key)) {
              throw new ERR_INVALID_PACKAGE_CONFIG(
                fileURLToPath(packageJSONUrl),
                base,
                '"exports" cannot contain numeric property keys.'
              );
            }
          }
          for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            if (key === "default" || conditions.has(key)) {
              const conditionalTarget = target[key];
              const resolved = resolvePackageTarget(
                packageJSONUrl,
                conditionalTarget,
                subpath,
                packageSubpath,
                base,
                pattern,
                internal,
                conditions
              );
              if (resolved === void 0)
                continue;
              return resolved;
            }
          }
          return void 0;
        } else if (target === null) {
          return null;
        }
        throwInvalidPackageTarget(
          packageSubpath,
          target,
          packageJSONUrl,
          internal,
          base
        );
      }
      function isConditionalExportsMainSugar(exports3, packageJSONUrl, base) {
        if (typeof exports3 === "string" || ArrayIsArray(exports3)) return true;
        if (typeof exports3 !== "object" || exports3 === null) return false;
        const keys = ObjectGetOwnPropertyNames(exports3);
        let isConditionalSugar = false;
        let i = 0;
        for (let j = 0; j < keys.length; j++) {
          const key = keys[j];
          const curIsConditionalSugar = key === "" || key[0] !== ".";
          if (i++ === 0) {
            isConditionalSugar = curIsConditionalSugar;
          } else if (isConditionalSugar !== curIsConditionalSugar) {
            throw new ERR_INVALID_PACKAGE_CONFIG(
              fileURLToPath(packageJSONUrl),
              base,
              `"exports" cannot contain some keys starting with '.' and some not. The exports object must either be an object of package subpath keys or an object of main entry condition name keys only.`
            );
          }
        }
        return isConditionalSugar;
      }
      function packageExportsResolve(packageJSONUrl, packageSubpath, packageConfig, base, conditions) {
        let exports3 = packageConfig.exports;
        if (isConditionalExportsMainSugar(exports3, packageJSONUrl, base))
          exports3 = { ".": exports3 };
        if (ObjectPrototypeHasOwnProperty(exports3, packageSubpath)) {
          const target = exports3[packageSubpath];
          const resolved = resolvePackageTarget(
            packageJSONUrl,
            target,
            "",
            packageSubpath,
            base,
            false,
            false,
            conditions
          );
          if (resolved === null || resolved === void 0)
            throwExportsNotFound(packageSubpath, packageJSONUrl, base);
          return { resolved, exact: true };
        }
        let bestMatch = "";
        const keys = ObjectGetOwnPropertyNames(exports3);
        for (let i = 0; i < keys.length; i++) {
          const key = keys[i];
          if (key[key.length - 1] === "*" && StringPrototypeStartsWith(
            packageSubpath,
            StringPrototypeSlice(key, 0, -1)
          ) && packageSubpath.length >= key.length && key.length > bestMatch.length) {
            bestMatch = key;
          } else if (key[key.length - 1] === "/" && StringPrototypeStartsWith(packageSubpath, key) && key.length > bestMatch.length) {
            bestMatch = key;
          }
        }
        if (bestMatch) {
          const target = exports3[bestMatch];
          const pattern = bestMatch[bestMatch.length - 1] === "*";
          const subpath = StringPrototypeSubstr(packageSubpath, bestMatch.length - (pattern ? 1 : 0));
          const resolved = resolvePackageTarget(
            packageJSONUrl,
            target,
            subpath,
            bestMatch,
            base,
            pattern,
            false,
            conditions
          );
          if (resolved === null || resolved === void 0)
            throwExportsNotFound(packageSubpath, packageJSONUrl, base);
          if (!pattern)
            emitFolderMapDeprecation(bestMatch, packageJSONUrl, true, base);
          return { resolved, exact: pattern };
        }
        throwExportsNotFound(packageSubpath, packageJSONUrl, base);
      }
      function packageImportsResolve(name, base, conditions) {
        if (name === "#" || StringPrototypeStartsWith(name, "#/")) {
          const reason = "is not a valid internal imports specifier name";
          throw new ERR_INVALID_MODULE_SPECIFIER(name, reason, fileURLToPath(base));
        }
        let packageJSONUrl;
        const packageConfig = getPackageScopeConfig(base);
        if (packageConfig.exists) {
          packageJSONUrl = pathToFileURL(packageConfig.pjsonPath);
          const imports = packageConfig.imports;
          if (imports) {
            if (ObjectPrototypeHasOwnProperty(imports, name)) {
              const resolved = resolvePackageTarget(
                packageJSONUrl,
                imports[name],
                "",
                name,
                base,
                false,
                true,
                conditions
              );
              if (resolved !== null)
                return { resolved, exact: true };
            } else {
              let bestMatch = "";
              const keys = ObjectGetOwnPropertyNames(imports);
              for (let i = 0; i < keys.length; i++) {
                const key = keys[i];
                if (key[key.length - 1] === "*" && StringPrototypeStartsWith(
                  name,
                  StringPrototypeSlice(key, 0, -1)
                ) && name.length >= key.length && key.length > bestMatch.length) {
                  bestMatch = key;
                } else if (key[key.length - 1] === "/" && StringPrototypeStartsWith(name, key) && key.length > bestMatch.length) {
                  bestMatch = key;
                }
              }
              if (bestMatch) {
                const target = imports[bestMatch];
                const pattern = bestMatch[bestMatch.length - 1] === "*";
                const subpath = StringPrototypeSubstr(name, bestMatch.length - (pattern ? 1 : 0));
                const resolved = resolvePackageTarget(
                  packageJSONUrl,
                  target,
                  subpath,
                  bestMatch,
                  base,
                  pattern,
                  true,
                  conditions
                );
                if (resolved !== null) {
                  if (!pattern)
                    emitFolderMapDeprecation(bestMatch, packageJSONUrl, false, base);
                  return { resolved, exact: pattern };
                }
              }
            }
          }
        }
        throwImportNotDefined(name, packageJSONUrl, base);
      }
      function getPackageType(url) {
        const packageConfig = getPackageScopeConfig(url);
        return packageConfig.type;
      }
      function parsePackageName(specifier, base) {
        let separatorIndex = StringPrototypeIndexOf(specifier, "/");
        let validPackageName = true;
        let isScoped = false;
        if (specifier[0] === "@") {
          isScoped = true;
          if (separatorIndex === -1 || specifier.length === 0) {
            validPackageName = false;
          } else {
            separatorIndex = StringPrototypeIndexOf(
              specifier,
              "/",
              separatorIndex + 1
            );
          }
        }
        const packageName = separatorIndex === -1 ? specifier : StringPrototypeSlice(specifier, 0, separatorIndex);
        for (let i = 0; i < packageName.length; i++) {
          if (packageName[i] === "%" || packageName[i] === "\\") {
            validPackageName = false;
            break;
          }
        }
        if (!validPackageName) {
          throw new ERR_INVALID_MODULE_SPECIFIER(
            specifier,
            "is not a valid package name",
            fileURLToPath(base)
          );
        }
        const packageSubpath = "." + (separatorIndex === -1 ? "" : StringPrototypeSlice(specifier, separatorIndex));
        return { packageName, packageSubpath, isScoped };
      }
      function packageResolve(specifier, base, conditions) {
        const { packageName, packageSubpath, isScoped } = parsePackageName(specifier, base);
        const packageConfig = getPackageScopeConfig(base);
        if (packageConfig.exists) {
          const packageJSONUrl2 = pathToFileURL(packageConfig.pjsonPath);
          if (packageConfig.name === packageName && packageConfig.exports !== void 0 && packageConfig.exports !== null) {
            return packageExportsResolve(
              packageJSONUrl2,
              packageSubpath,
              packageConfig,
              base,
              conditions
            ).resolved;
          }
        }
        let packageJSONUrl = new URL2("./node_modules/" + packageName + "/package.json", base);
        let packageJSONPath = fileURLToPath(packageJSONUrl);
        let lastPath;
        do {
          const stat = tryStatSync(StringPrototypeSlice(
            packageJSONPath,
            0,
            packageJSONPath.length - 13
          ));
          if (!stat.isDirectory()) {
            lastPath = packageJSONPath;
            packageJSONUrl = new URL2((isScoped ? "../../../../node_modules/" : "../../../node_modules/") + packageName + "/package.json", packageJSONUrl);
            packageJSONPath = fileURLToPath(packageJSONUrl);
            continue;
          }
          const packageConfig2 = getPackageConfig(packageJSONPath, specifier, base);
          if (packageConfig2.exports !== void 0 && packageConfig2.exports !== null)
            return packageExportsResolve(
              packageJSONUrl,
              packageSubpath,
              packageConfig2,
              base,
              conditions
            ).resolved;
          if (packageSubpath === ".")
            return legacyMainResolve(packageJSONUrl, packageConfig2, base);
          return new URL2(packageSubpath, packageJSONUrl);
        } while (packageJSONPath.length !== lastPath.length);
        throw new ERR_MODULE_NOT_FOUND(packageName, fileURLToPath(base));
      }
      function isBareSpecifier(specifier) {
        return specifier[0] && specifier[0] !== "/" && specifier[0] !== ".";
      }
      function isRelativeSpecifier(specifier) {
        if (specifier[0] === ".") {
          if (specifier.length === 1 || specifier[1] === "/") return true;
          if (specifier[1] === ".") {
            if (specifier.length === 2 || specifier[2] === "/") return true;
          }
        }
        return false;
      }
      function shouldBeTreatedAsRelativeOrAbsolutePath(specifier) {
        if (specifier === "") return false;
        if (specifier[0] === "/") return true;
        return isRelativeSpecifier(specifier);
      }
      function moduleResolve(specifier, base, conditions) {
        let resolved;
        if (shouldBeTreatedAsRelativeOrAbsolutePath(specifier)) {
          resolved = new URL2(specifier, base);
        } else if (specifier[0] === "#") {
          ({ resolved } = packageImportsResolve(specifier, base, conditions));
        } else {
          try {
            resolved = new URL2(specifier);
          } catch {
            resolved = packageResolve(specifier, base, conditions);
          }
        }
        return finalizeResolution(resolved, base);
      }
      function resolveAsCommonJS(specifier, parentURL) {
        try {
          const parent = fileURLToPath(parentURL);
          const tmpModule = new CJSModule(parent, null);
          tmpModule.paths = CJSModule._nodeModulePaths(parent);
          let found = CJSModule._resolveFilename(specifier, tmpModule, false);
          if (isRelativeSpecifier(specifier)) {
            found = relative(parent, found);
            if (!StringPrototypeStartsWith(found, `..${sep}`)) {
              found = `.${sep}${found}`;
            }
          } else if (isBareSpecifier(specifier)) {
            const pkg = StringPrototypeSplit(specifier, "/")[0];
            const index = StringPrototypeIndexOf(found, pkg);
            if (index !== -1) {
              found = StringPrototypeSlice(found, index);
            }
          }
          if (process.platform === "win32") {
            found = StringPrototypeReplace(found, new RegExp(`\\${sep}`, "g"), "/");
          }
          return found;
        } catch {
          return false;
        }
      }
      function defaultResolve(specifier, context = {}, defaultResolveUnused) {
        let { parentURL, conditions } = context;
        if (parentURL && policy != null && policy.manifest) {
          const redirects = policy.manifest.getDependencyMapper(parentURL);
          if (redirects) {
            const { resolve, reaction } = redirects;
            const destination = resolve(specifier, new SafeSet(conditions));
            let missing = true;
            if (destination === true) {
              missing = false;
            } else if (destination) {
              const href = destination.href;
              return { url: href };
            }
            if (missing) {
              reaction(
                new ERR_MANIFEST_DEPENDENCY_MISSING(
                  parentURL,
                  specifier,
                  ArrayPrototypeJoin([...conditions], ", ")
                )
              );
            }
          }
        }
        let parsed;
        try {
          parsed = new URL2(specifier);
          if (parsed.protocol === "data:") {
            return {
              url: specifier
            };
          }
        } catch {
        }
        if (parsed && parsed.protocol === builtinModuleProtocol)
          return { url: specifier };
        if (parsed && parsed.protocol !== "file:" && parsed.protocol !== "data:")
          throw new ERR_UNSUPPORTED_ESM_URL_SCHEME(parsed);
        if (NativeModule.canBeRequiredByUsers(specifier)) {
          return {
            url: builtinModuleProtocol + specifier
          };
        }
        if (parentURL && StringPrototypeStartsWith(parentURL, "data:")) {
          new URL2(specifier, parentURL);
        }
        const isMain = parentURL === void 0;
        if (isMain) {
          parentURL = pathToFileURL(`${process.cwd()}/`).href;
          if (typeFlag)
            throw new ERR_INPUT_TYPE_NOT_ALLOWED();
        }
        conditions = getConditionsSet(conditions);
        let url;
        try {
          url = moduleResolve(specifier, parentURL, conditions);
        } catch (error) {
          if (error.code === "ERR_MODULE_NOT_FOUND" || error.code === "ERR_UNSUPPORTED_DIR_IMPORT") {
            if (StringPrototypeStartsWith(specifier, "file://")) {
              specifier = fileURLToPath(specifier);
            }
            const found = resolveAsCommonJS(specifier, parentURL);
            if (found) {
              const lines = StringPrototypeSplit(error.stack, "\n");
              const hint = `Did you mean to import ${found}?`;
              error.stack = ArrayPrototypeShift(lines) + "\n" + hint + "\n" + ArrayPrototypeJoin(lines, "\n");
              error.message += `
${hint}`;
            }
          }
          throw error;
        }
        if (isMain ? !preserveSymlinksMain : !preserveSymlinks) {
          const urlPath = fileURLToPath(url);
          const real = realpathSync(urlPath, {
            // [internalFS.realpathCacheKey]: realpathCache
          });
          const old = url;
          url = pathToFileURL(
            real + (StringPrototypeEndsWith(urlPath, sep) ? "/" : "")
          );
          url.search = old.search;
          url.hash = old.hash;
        }
        return { url: `${url}` };
      }
      return {
        DEFAULT_CONDITIONS,
        defaultResolve,
        encodedSepRegEx,
        getPackageType,
        packageExportsResolve,
        packageImportsResolve
      };
    }
    module2.exports = {
      createResolve
    };
  }
});

// node_modules/ts-node/dist-raw/node-internal-modules-esm-get_format.js
var require_node_internal_modules_esm_get_format = __commonJS({
  "node_modules/ts-node/dist-raw/node-internal-modules-esm-get_format.js"(exports2, module2) {
    "use strict";
    init_cjs_shims();
    var {
      RegExpPrototypeExec,
      StringPrototypeStartsWith
    } = require_node_primordials();
    var { extname } = require("path");
    var { getOptionValue } = require_node_options();
    var [nodeMajor, nodeMinor] = process.versions.node.split(".").map((s) => parseInt(s, 10));
    var experimentalJsonModules = nodeMajor > 17 || nodeMajor === 17 && nodeMinor >= 5 || nodeMajor === 16 && nodeMinor >= 15 || getOptionValue("--experimental-json-modules");
    var experimentalWasmModules = getOptionValue("--experimental-wasm-modules");
    var { URL: URL2, fileURLToPath } = require("url");
    var { ERR_UNKNOWN_FILE_EXTENSION } = require_node_internal_errors().codes;
    var extensionFormatMap = {
      "__proto__": null,
      ".cjs": "commonjs",
      ".js": "module",
      ".mjs": "module"
    };
    var legacyExtensionFormatMap = {
      "__proto__": null,
      ".cjs": "commonjs",
      ".js": "commonjs",
      ".json": "commonjs",
      ".mjs": "module",
      ".node": "commonjs"
    };
    if (experimentalWasmModules)
      extensionFormatMap[".wasm"] = legacyExtensionFormatMap[".wasm"] = "wasm";
    if (experimentalJsonModules)
      extensionFormatMap[".json"] = legacyExtensionFormatMap[".json"] = "json";
    function createGetFormat(tsNodeExperimentalSpecifierResolution, nodeEsmResolver) {
      let experimentalSpeciferResolution = tsNodeExperimentalSpecifierResolution != null ? tsNodeExperimentalSpecifierResolution : getOptionValue("--experimental-specifier-resolution");
      const { getPackageType } = nodeEsmResolver;
      function defaultGetFormat(url, context, defaultGetFormatUnused) {
        if (StringPrototypeStartsWith(url, "node:")) {
          return { format: "builtin" };
        }
        const parsed = new URL2(url);
        if (parsed.protocol === "data:") {
          const [, mime] = RegExpPrototypeExec(
            /^([^/]+\/[^;,]+)(?:[^,]*?)(;base64)?,/,
            parsed.pathname
          ) || [null, null, null];
          const format = {
            "__proto__": null,
            "text/javascript": "module",
            "application/json": experimentalJsonModules ? "json" : null,
            "application/wasm": experimentalWasmModules ? "wasm" : null
          }[mime] || null;
          return { format };
        } else if (parsed.protocol === "file:") {
          const ext = extname(parsed.pathname);
          let format;
          if (ext === ".js") {
            format = getPackageType(parsed.href) === "module" ? "module" : "commonjs";
          } else {
            format = extensionFormatMap[ext];
          }
          if (!format) {
            if (experimentalSpeciferResolution === "node") {
              process.emitWarning(
                "The Node.js specifier resolution in ESM is experimental.",
                "ExperimentalWarning"
              );
              format = legacyExtensionFormatMap[ext];
            } else {
              throw new ERR_UNKNOWN_FILE_EXTENSION(ext, fileURLToPath(url));
            }
          }
          return { format: format || null };
        }
        return { format: null };
      }
      return { defaultGetFormat };
    }
    module2.exports = {
      createGetFormat
    };
  }
});

// node_modules/ts-node/dist/esm.js
var require_esm = __commonJS({
  "node_modules/ts-node/dist/esm.js"(exports2) {
    "use strict";
    init_cjs_shims();
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.createEsmHooks = exports2.registerAndCreateEsmHooks = exports2.filterHooksByAPIVersion = void 0;
    var index_1 = require_dist();
    var url_1 = require("url");
    var path_1 = require("path");
    var assert = require("assert");
    var util_1 = require_util();
    var module_1 = require("module");
    var newHooksAPI = (0, util_1.versionGteLt)(process.versions.node, "16.12.0");
    function filterHooksByAPIVersion(hooks) {
      const { getFormat, load, resolve, transformSource } = hooks;
      const hooksAPI = newHooksAPI ? { resolve, load, getFormat: void 0, transformSource: void 0 } : { resolve, getFormat, transformSource, load: void 0 };
      return hooksAPI;
    }
    exports2.filterHooksByAPIVersion = filterHooksByAPIVersion;
    function registerAndCreateEsmHooks(opts) {
      const tsNodeInstance = (0, index_1.register)(opts);
      return createEsmHooks(tsNodeInstance);
    }
    exports2.registerAndCreateEsmHooks = registerAndCreateEsmHooks;
    function createEsmHooks(tsNodeService) {
      tsNodeService.enableExperimentalEsmLoaderInterop();
      const nodeResolveImplementation = tsNodeService.getNodeEsmResolver();
      const nodeGetFormatImplementation = tsNodeService.getNodeEsmGetFormat();
      const extensions = tsNodeService.extensions;
      const hooksAPI = filterHooksByAPIVersion({
        resolve,
        load,
        getFormat,
        transformSource
      });
      function isFileUrlOrNodeStyleSpecifier(parsed) {
        const { protocol } = parsed;
        return protocol === null || protocol === "file:";
      }
      function isProbablyEntrypoint(specifier, parentURL) {
        return parentURL === void 0 && specifier.startsWith("file://");
      }
      const rememberIsProbablyEntrypoint = /* @__PURE__ */ new Set();
      const rememberResolvedViaCommonjsFallback = /* @__PURE__ */ new Set();
      async function resolve(specifier, context, defaultResolve) {
        const defer = async () => {
          const r = await defaultResolve(specifier, context, defaultResolve);
          return r;
        };
        async function entrypointFallback(cb) {
          try {
            const resolution = await cb();
            if ((resolution === null || resolution === void 0 ? void 0 : resolution.url) && isProbablyEntrypoint(specifier, context.parentURL))
              rememberIsProbablyEntrypoint.add(resolution.url);
            return resolution;
          } catch (esmResolverError) {
            if (!isProbablyEntrypoint(specifier, context.parentURL))
              throw esmResolverError;
            try {
              let cjsSpecifier = specifier;
              try {
                if (specifier.startsWith("file://"))
                  cjsSpecifier = (0, url_1.fileURLToPath)(specifier);
              } catch {
              }
              const resolution = (0, url_1.pathToFileURL)((0, module_1.createRequire)(process.cwd()).resolve(cjsSpecifier)).toString();
              rememberIsProbablyEntrypoint.add(resolution);
              rememberResolvedViaCommonjsFallback.add(resolution);
              return { url: resolution, format: "commonjs" };
            } catch (commonjsResolverError) {
              throw esmResolverError;
            }
          }
        }
        return addShortCircuitFlag(async () => {
          const parsed = (0, url_1.parse)(specifier);
          const { pathname, protocol, hostname } = parsed;
          if (!isFileUrlOrNodeStyleSpecifier(parsed)) {
            return entrypointFallback(defer);
          }
          if (protocol !== null && protocol !== "file:") {
            return entrypointFallback(defer);
          }
          if (hostname) {
            return entrypointFallback(defer);
          }
          return entrypointFallback(() => nodeResolveImplementation.defaultResolve(specifier, context, defaultResolve));
        });
      }
      async function load(url, context, defaultLoad) {
        return addShortCircuitFlag(async () => {
          var _a;
          const format = (_a = context.format) !== null && _a !== void 0 ? _a : (await getFormat(url, context, nodeGetFormatImplementation.defaultGetFormat)).format;
          let source = void 0;
          if (format !== "builtin" && format !== "commonjs") {
            const { source: rawSource } = await defaultLoad(url, {
              ...context,
              format
            }, defaultLoad);
            if (rawSource === void 0 || rawSource === null) {
              throw new Error(`Failed to load raw source: Format was '${format}' and url was '${url}''.`);
            }
            const defaultTransformSource = async (source2, _context, _defaultTransformSource) => ({ source: source2 });
            const { source: transformedSource } = await transformSource(rawSource, { url, format }, defaultTransformSource);
            source = transformedSource;
          }
          return { format, source };
        });
      }
      async function getFormat(url, context, defaultGetFormat) {
        const defer = (overrideUrl = url) => defaultGetFormat(overrideUrl, context, defaultGetFormat);
        async function entrypointFallback(cb) {
          try {
            return await cb();
          } catch (getFormatError) {
            if (!rememberIsProbablyEntrypoint.has(url))
              throw getFormatError;
            return { format: "commonjs" };
          }
        }
        const parsed = (0, url_1.parse)(url);
        if (!isFileUrlOrNodeStyleSpecifier(parsed)) {
          return entrypointFallback(defer);
        }
        const { pathname } = parsed;
        assert(pathname !== null, "ESM getFormat() hook: URL should never have null pathname");
        const nativePath = (0, url_1.fileURLToPath)(url);
        let nodeSays;
        const ext = (0, path_1.extname)(nativePath);
        const tsNodeIgnored = tsNodeService.ignored(nativePath);
        const nodeEquivalentExt = extensions.nodeEquivalents.get(ext);
        if (nodeEquivalentExt && !tsNodeIgnored) {
          nodeSays = await entrypointFallback(() => defer((0, url_1.format)((0, url_1.pathToFileURL)(nativePath + nodeEquivalentExt))));
        } else {
          try {
            nodeSays = await entrypointFallback(defer);
          } catch (e) {
            if (e instanceof Error && tsNodeIgnored && extensions.nodeDoesNotUnderstand.includes(ext)) {
              e.message += `

Hint:
ts-node is configured to ignore this file.
If you want ts-node to handle this file, consider enabling the "skipIgnore" option or adjusting your "ignore" patterns.
https://typestrong.org/ts-node/docs/scope
`;
            }
            throw e;
          }
        }
        if (!tsNodeService.ignored(nativePath) && (nodeSays.format === "commonjs" || nodeSays.format === "module")) {
          const { moduleType } = tsNodeService.moduleTypeClassifier.classifyModuleByModuleTypeOverrides((0, util_1.normalizeSlashes)(nativePath));
          if (moduleType === "cjs") {
            return { format: "commonjs" };
          } else if (moduleType === "esm") {
            return { format: "module" };
          }
        }
        return nodeSays;
      }
      async function transformSource(source, context, defaultTransformSource) {
        if (source === null || source === void 0) {
          throw new Error("No source");
        }
        const defer = () => defaultTransformSource(source, context, defaultTransformSource);
        const sourceAsString = typeof source === "string" ? source : source.toString("utf8");
        const { url } = context;
        const parsed = (0, url_1.parse)(url);
        if (!isFileUrlOrNodeStyleSpecifier(parsed)) {
          return defer();
        }
        const nativePath = (0, url_1.fileURLToPath)(url);
        if (tsNodeService.ignored(nativePath)) {
          return defer();
        }
        const emittedJs = tsNodeService.compile(sourceAsString, nativePath);
        return { source: emittedJs };
      }
      return hooksAPI;
    }
    exports2.createEsmHooks = createEsmHooks;
    async function addShortCircuitFlag(fn) {
      const ret = await fn();
      if (ret == null)
        return ret;
      return {
        ...ret,
        shortCircuit: true
      };
    }
  }
});

// node_modules/ts-node/dist/index.js
var require_dist = __commonJS({
  "node_modules/ts-node/dist/index.js"(exports2) {
    "use strict";
    init_cjs_shims();
    var _a;
    var _b;
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.createEsmHooks = exports2.createFromPreloadedConfig = exports2.create = exports2.register = exports2.TSError = exports2.DEFAULTS = exports2.VERSION = exports2.debug = exports2.INSPECT_CUSTOM = exports2.env = exports2.REGISTER_INSTANCE = exports2.createRepl = void 0;
    var path_1 = require("path");
    var module_1 = require("module");
    var util = require("util");
    var url_1 = require("url");
    var make_error_1 = require_make_error();
    var util_1 = require_util();
    var configuration_1 = require_configuration();
    var module_type_classifier_1 = require_module_type_classifier();
    var resolver_functions_1 = require_resolver_functions();
    var cjs_resolve_hooks_1 = require_cjs_resolve_hooks();
    var node_module_type_classifier_1 = require_node_module_type_classifier();
    var file_extensions_1 = require_file_extensions();
    var ts_transpile_module_1 = require_ts_transpile_module();
    var repl_1 = require_repl();
    Object.defineProperty(exports2, "createRepl", { enumerable: true, get: function() {
      return repl_1.createRepl;
    } });
    var engineSupportsPackageTypeField = parseInt(process.versions.node.split(".")[0], 10) >= 12;
    var assertScriptCanLoadAsCJS = engineSupportsPackageTypeField ? require_node_internal_modules_cjs_loader().assertScriptCanLoadAsCJSImpl : () => {
    };
    exports2.REGISTER_INSTANCE = Symbol.for("ts-node.register.instance");
    exports2.env = process.env;
    exports2.INSPECT_CUSTOM = util.inspect.custom || "inspect";
    var shouldDebug = (0, util_1.yn)(exports2.env.TS_NODE_DEBUG);
    exports2.debug = shouldDebug ? (...args) => console.log(`[ts-node ${(/* @__PURE__ */ new Date()).toISOString()}]`, ...args) : () => void 0;
    var debugFn = shouldDebug ? (key, fn) => {
      let i = 0;
      return (x) => {
        (0, exports2.debug)(key, x, ++i);
        return fn(x);
      };
    } : (_, fn) => fn;
    exports2.VERSION = require_package().version;
    exports2.DEFAULTS = {
      cwd: (_a = exports2.env.TS_NODE_CWD) !== null && _a !== void 0 ? _a : exports2.env.TS_NODE_DIR,
      emit: (0, util_1.yn)(exports2.env.TS_NODE_EMIT),
      scope: (0, util_1.yn)(exports2.env.TS_NODE_SCOPE),
      scopeDir: exports2.env.TS_NODE_SCOPE_DIR,
      files: (0, util_1.yn)(exports2.env.TS_NODE_FILES),
      pretty: (0, util_1.yn)(exports2.env.TS_NODE_PRETTY),
      compiler: exports2.env.TS_NODE_COMPILER,
      compilerOptions: (0, util_1.parse)(exports2.env.TS_NODE_COMPILER_OPTIONS),
      ignore: (0, util_1.split)(exports2.env.TS_NODE_IGNORE),
      project: exports2.env.TS_NODE_PROJECT,
      skipProject: (0, util_1.yn)(exports2.env.TS_NODE_SKIP_PROJECT),
      skipIgnore: (0, util_1.yn)(exports2.env.TS_NODE_SKIP_IGNORE),
      preferTsExts: (0, util_1.yn)(exports2.env.TS_NODE_PREFER_TS_EXTS),
      ignoreDiagnostics: (0, util_1.split)(exports2.env.TS_NODE_IGNORE_DIAGNOSTICS),
      transpileOnly: (0, util_1.yn)(exports2.env.TS_NODE_TRANSPILE_ONLY),
      typeCheck: (0, util_1.yn)(exports2.env.TS_NODE_TYPE_CHECK),
      compilerHost: (0, util_1.yn)(exports2.env.TS_NODE_COMPILER_HOST),
      logError: (0, util_1.yn)(exports2.env.TS_NODE_LOG_ERROR),
      experimentalReplAwait: (_b = (0, util_1.yn)(exports2.env.TS_NODE_EXPERIMENTAL_REPL_AWAIT)) !== null && _b !== void 0 ? _b : void 0,
      tsTrace: console.log.bind(console)
    };
    var TSError = class extends make_error_1.BaseError {
      constructor(diagnosticText, diagnosticCodes, diagnostics = []) {
        super(`\u2A2F Unable to compile TypeScript:
${diagnosticText}`);
        this.diagnosticCodes = diagnosticCodes;
        this.name = "TSError";
        Object.defineProperty(this, "diagnosticText", {
          configurable: true,
          writable: true,
          value: diagnosticText
        });
        Object.defineProperty(this, "diagnostics", {
          configurable: true,
          writable: true,
          value: diagnostics
        });
      }
      /**
       * @internal
       */
      [exports2.INSPECT_CUSTOM]() {
        return this.diagnosticText;
      }
    };
    exports2.TSError = TSError;
    var TS_NODE_SERVICE_BRAND = Symbol("TS_NODE_SERVICE_BRAND");
    function register(serviceOrOpts) {
      let service = serviceOrOpts;
      if (!(serviceOrOpts === null || serviceOrOpts === void 0 ? void 0 : serviceOrOpts[TS_NODE_SERVICE_BRAND])) {
        service = create(serviceOrOpts !== null && serviceOrOpts !== void 0 ? serviceOrOpts : {});
      }
      const originalJsHandler = require.extensions[".js"];
      process[exports2.REGISTER_INSTANCE] = service;
      registerExtensions(service.options.preferTsExts, service.extensions.compiled, service, originalJsHandler);
      (0, cjs_resolve_hooks_1.installCommonjsResolveHooksIfNecessary)(service);
      module_1.Module._preloadModules(service.options.require);
      return service;
    }
    exports2.register = register;
    function create(rawOptions = {}) {
      const foundConfigResult = (0, configuration_1.findAndReadConfig)(rawOptions);
      return createFromPreloadedConfig(foundConfigResult);
    }
    exports2.create = create;
    function createFromPreloadedConfig(foundConfigResult) {
      var _a2, _b2, _c, _d;
      const { configFilePath, cwd, options, config, compiler, projectLocalResolveDir, optionBasePaths } = foundConfigResult;
      const projectLocalResolveHelper = (0, util_1.createProjectLocalResolveHelper)(projectLocalResolveDir);
      const ts = (0, configuration_1.loadCompiler)(compiler);
      const targetSupportsTla = config.options.target >= ts.ScriptTarget.ES2018;
      if (options.experimentalReplAwait === true && !targetSupportsTla) {
        throw new Error("Experimental REPL await is not compatible with targets lower than ES2018");
      }
      const tsVersionSupportsTla = (0, util_1.versionGteLt)(ts.version, "3.8.0");
      if (options.experimentalReplAwait === true && !tsVersionSupportsTla) {
        throw new Error("Experimental REPL await is not compatible with TypeScript versions older than 3.8");
      }
      const shouldReplAwait = options.experimentalReplAwait !== false && tsVersionSupportsTla && targetSupportsTla;
      if (options.swc && !options.typeCheck) {
        if (options.transpileOnly === false) {
          throw new Error("Cannot enable 'swc' option with 'transpileOnly: false'.  'swc' implies 'transpileOnly'.");
        }
        if (options.transpiler) {
          throw new Error("Cannot specify both 'swc' and 'transpiler' options.  'swc' uses the built-in swc transpiler.");
        }
      }
      const readFile = options.readFile || ts.sys.readFile;
      const fileExists = options.fileExists || ts.sys.fileExists;
      const transpileOnly = (options.transpileOnly === true || options.swc === true) && options.typeCheck !== true;
      let transpiler = void 0;
      let transpilerBasePath = void 0;
      if (options.transpiler) {
        transpiler = options.transpiler;
        transpilerBasePath = optionBasePaths.transpiler;
      } else if (options.swc) {
        transpiler = require.resolve("./transpilers/swc.js");
        transpilerBasePath = optionBasePaths.swc;
      }
      const transformers = options.transformers || void 0;
      const diagnosticFilters = [
        {
          appliesToAllFiles: true,
          filenamesAbsolute: [],
          diagnosticsIgnored: [
            6059,
            18002,
            18003,
            ...options.experimentalTsImportSpecifiers ? [
              2691
              // "An import path cannot end with a '.ts' extension. Consider importing '<specifier without ext>' instead."
            ] : [],
            ...options.ignoreDiagnostics || []
          ].map(Number)
        }
      ];
      const configDiagnosticList = filterDiagnostics(config.errors, diagnosticFilters);
      const outputCache = /* @__PURE__ */ new Map();
      const configFileDirname = configFilePath ? (0, path_1.dirname)(configFilePath) : null;
      const scopeDir = (_c = (_b2 = (_a2 = options.scopeDir) !== null && _a2 !== void 0 ? _a2 : config.options.rootDir) !== null && _b2 !== void 0 ? _b2 : configFileDirname) !== null && _c !== void 0 ? _c : cwd;
      const ignoreBaseDir = configFileDirname !== null && configFileDirname !== void 0 ? configFileDirname : cwd;
      const isScoped = options.scope ? (fileName) => (0, path_1.relative)(scopeDir, fileName).charAt(0) !== "." : () => true;
      const shouldIgnore = createIgnore(ignoreBaseDir, options.skipIgnore ? [] : (options.ignore || ["(?:^|/)node_modules/"]).map((str) => new RegExp(str)));
      const diagnosticHost = {
        getNewLine: () => ts.sys.newLine,
        getCurrentDirectory: () => cwd,
        // TODO switch to getCanonicalFileName we already create later in scope
        getCanonicalFileName: ts.sys.useCaseSensitiveFileNames ? (x) => x : (x) => x.toLowerCase()
      };
      if (options.transpileOnly && typeof transformers === "function") {
        throw new TypeError('Transformers function is unavailable in "--transpile-only"');
      }
      let createTranspiler = initializeTranspilerFactory();
      function initializeTranspilerFactory() {
        var _a3;
        if (transpiler) {
          let createTranspiler2 = function(compilerOptions, nodeModuleEmitKind) {
            return transpilerFactory === null || transpilerFactory === void 0 ? void 0 : transpilerFactory({
              service: {
                options,
                config: {
                  ...config,
                  options: compilerOptions
                },
                projectLocalResolveHelper
              },
              transpilerConfigLocalResolveHelper,
              nodeModuleEmitKind,
              ...transpilerOptions
            });
          };
          if (!transpileOnly)
            throw new Error("Custom transpiler can only be used when transpileOnly is enabled.");
          const transpilerName = typeof transpiler === "string" ? transpiler : transpiler[0];
          const transpilerOptions = typeof transpiler === "string" ? {} : (_a3 = transpiler[1]) !== null && _a3 !== void 0 ? _a3 : {};
          const transpilerConfigLocalResolveHelper = transpilerBasePath ? (0, util_1.createProjectLocalResolveHelper)(transpilerBasePath) : projectLocalResolveHelper;
          const transpilerPath = transpilerConfigLocalResolveHelper(transpilerName, true);
          const transpilerFactory = require(transpilerPath).create;
          return createTranspiler2;
        }
      }
      let experimentalEsmLoader = false;
      function enableExperimentalEsmLoaderInterop() {
        experimentalEsmLoader = true;
      }
      installSourceMapSupport();
      function installSourceMapSupport() {
        const sourceMapSupport = require_source_map_support();
        sourceMapSupport.install({
          environment: "node",
          retrieveFile(pathOrUrl) {
            var _a3;
            let path3 = pathOrUrl;
            if (experimentalEsmLoader && path3.startsWith("file://")) {
              try {
                path3 = (0, url_1.fileURLToPath)(path3);
              } catch (e) {
              }
            }
            path3 = (0, util_1.normalizeSlashes)(path3);
            return ((_a3 = outputCache.get(path3)) === null || _a3 === void 0 ? void 0 : _a3.content) || "";
          },
          redirectConflictingLibrary: true,
          onConflictingLibraryRedirect(request, parent, isMain, options2, redirectedRequest) {
            (0, exports2.debug)(`Redirected an attempt to require source-map-support to instead receive @cspotcode/source-map-support.  "${parent.filename}" attempted to require or resolve "${request}" and was redirected to "${redirectedRequest}".`);
          }
        });
      }
      const shouldHavePrettyErrors = options.pretty === void 0 ? process.stdout.isTTY : options.pretty;
      const formatDiagnostics = shouldHavePrettyErrors ? ts.formatDiagnosticsWithColorAndContext || ts.formatDiagnostics : ts.formatDiagnostics;
      function createTSError(diagnostics) {
        const diagnosticText = formatDiagnostics(diagnostics, diagnosticHost);
        const diagnosticCodes = diagnostics.map((x) => x.code);
        return new TSError(diagnosticText, diagnosticCodes, diagnostics);
      }
      function reportTSError(configDiagnosticList2) {
        const error = createTSError(configDiagnosticList2);
        if (options.logError) {
          console.error("\x1B[31m%s\x1B[0m", error);
        } else {
          throw error;
        }
      }
      if (configDiagnosticList.length)
        reportTSError(configDiagnosticList);
      const jsxEmitPreserve = config.options.jsx === ts.JsxEmit.Preserve;
      function getEmitExtension(path3) {
        const lastDotIndex = path3.lastIndexOf(".");
        if (lastDotIndex >= 0) {
          const ext = path3.slice(lastDotIndex);
          switch (ext) {
            case ".js":
            case ".ts":
              return ".js";
            case ".jsx":
            case ".tsx":
              return jsxEmitPreserve ? ".jsx" : ".js";
            case ".mjs":
            case ".mts":
              return ".mjs";
            case ".cjs":
            case ".cts":
              return ".cjs";
          }
        }
        return ".js";
      }
      let getOutput;
      let getTypeInfo;
      const getCanonicalFileName = ts.createGetCanonicalFileName(ts.sys.useCaseSensitiveFileNames);
      const moduleTypeClassifier = (0, module_type_classifier_1.createModuleTypeClassifier)({
        basePath: (_d = options.optionBasePaths) === null || _d === void 0 ? void 0 : _d.moduleTypes,
        patterns: options.moduleTypes
      });
      const extensions = (0, file_extensions_1.getExtensions)(config, options, ts.version);
      if (!transpileOnly) {
        const fileContents = /* @__PURE__ */ new Map();
        const rootFileNames = new Set(config.fileNames);
        const cachedReadFile = (0, util_1.cachedLookup)(debugFn("readFile", readFile));
        if (!options.compilerHost) {
          let projectVersion = 1;
          const fileVersions = new Map(Array.from(rootFileNames).map((fileName) => [fileName, 0]));
          const getCustomTransformers = () => {
            if (typeof transformers === "function") {
              const program2 = service.getProgram();
              return program2 ? transformers(program2) : void 0;
            }
            return transformers;
          };
          const serviceHost = {
            getProjectVersion: () => String(projectVersion),
            getScriptFileNames: () => Array.from(rootFileNames),
            getScriptVersion: (fileName) => {
              const version = fileVersions.get(fileName);
              return version ? version.toString() : "";
            },
            getScriptSnapshot(fileName) {
              let contents = fileContents.get(fileName);
              if (contents === void 0) {
                contents = cachedReadFile(fileName);
                if (contents === void 0)
                  return;
                fileVersions.set(fileName, 1);
                fileContents.set(fileName, contents);
                projectVersion++;
              }
              return ts.ScriptSnapshot.fromString(contents);
            },
            readFile: cachedReadFile,
            readDirectory: ts.sys.readDirectory,
            getDirectories: (0, util_1.cachedLookup)(debugFn("getDirectories", ts.sys.getDirectories)),
            fileExists: (0, util_1.cachedLookup)(debugFn("fileExists", fileExists)),
            directoryExists: (0, util_1.cachedLookup)(debugFn("directoryExists", ts.sys.directoryExists)),
            realpath: ts.sys.realpath ? (0, util_1.cachedLookup)(debugFn("realpath", ts.sys.realpath)) : void 0,
            getNewLine: () => ts.sys.newLine,
            useCaseSensitiveFileNames: () => ts.sys.useCaseSensitiveFileNames,
            getCurrentDirectory: () => cwd,
            getCompilationSettings: () => config.options,
            getDefaultLibFileName: () => ts.getDefaultLibFilePath(config.options),
            getCustomTransformers,
            trace: options.tsTrace
          };
          const { resolveModuleNames, getResolvedModuleWithFailedLookupLocationsFromCache, resolveTypeReferenceDirectives, isFileKnownToBeInternal, markBucketOfFilenameInternal } = (0, resolver_functions_1.createResolverFunctions)({
            host: serviceHost,
            getCanonicalFileName,
            ts,
            cwd,
            config,
            projectLocalResolveHelper,
            options,
            extensions
          });
          serviceHost.resolveModuleNames = resolveModuleNames;
          serviceHost.getResolvedModuleWithFailedLookupLocationsFromCache = getResolvedModuleWithFailedLookupLocationsFromCache;
          serviceHost.resolveTypeReferenceDirectives = resolveTypeReferenceDirectives;
          const registry = ts.createDocumentRegistry(ts.sys.useCaseSensitiveFileNames, cwd);
          const service = ts.createLanguageService(serviceHost, registry);
          const updateMemoryCache = (contents, fileName) => {
            if (!rootFileNames.has(fileName) && !isFileKnownToBeInternal(fileName)) {
              markBucketOfFilenameInternal(fileName);
              rootFileNames.add(fileName);
              projectVersion++;
            }
            const previousVersion = fileVersions.get(fileName) || 0;
            const previousContents = fileContents.get(fileName);
            if (contents !== previousContents) {
              fileVersions.set(fileName, previousVersion + 1);
              fileContents.set(fileName, contents);
              projectVersion++;
            }
          };
          let previousProgram = void 0;
          getOutput = (code, fileName) => {
            updateMemoryCache(code, fileName);
            const programBefore = service.getProgram();
            if (programBefore !== previousProgram) {
              (0, exports2.debug)(`compiler rebuilt Program instance when getting output for ${fileName}`);
            }
            const output = service.getEmitOutput(fileName);
            const diagnostics = service.getSemanticDiagnostics(fileName).concat(service.getSyntacticDiagnostics(fileName));
            const programAfter = service.getProgram();
            (0, exports2.debug)("invariant: Is service.getProject() identical before and after getting emit output and diagnostics? (should always be true) ", programBefore === programAfter);
            previousProgram = programAfter;
            const diagnosticList = filterDiagnostics(diagnostics, diagnosticFilters);
            if (diagnosticList.length)
              reportTSError(diagnosticList);
            if (output.emitSkipped) {
              return [void 0, void 0, true];
            }
            if (output.outputFiles.length === 0) {
              throw new TypeError(`Unable to require file: ${(0, path_1.relative)(cwd, fileName)}
This is usually the result of a faulty configuration or import. Make sure there is a \`.js\`, \`.json\` or other executable extension with loader attached before \`ts-node\` available.`);
            }
            return [output.outputFiles[1].text, output.outputFiles[0].text, false];
          };
          getTypeInfo = (code, fileName, position) => {
            const normalizedFileName = (0, util_1.normalizeSlashes)(fileName);
            updateMemoryCache(code, normalizedFileName);
            const info = service.getQuickInfoAtPosition(normalizedFileName, position);
            const name = ts.displayPartsToString(info ? info.displayParts : []);
            const comment = ts.displayPartsToString(info ? info.documentation : []);
            return { name, comment };
          };
        } else {
          const sys = {
            ...ts.sys,
            ...diagnosticHost,
            readFile: (fileName) => {
              const cacheContents = fileContents.get(fileName);
              if (cacheContents !== void 0)
                return cacheContents;
              const contents = cachedReadFile(fileName);
              if (contents)
                fileContents.set(fileName, contents);
              return contents;
            },
            readDirectory: ts.sys.readDirectory,
            getDirectories: (0, util_1.cachedLookup)(debugFn("getDirectories", ts.sys.getDirectories)),
            fileExists: (0, util_1.cachedLookup)(debugFn("fileExists", fileExists)),
            directoryExists: (0, util_1.cachedLookup)(debugFn("directoryExists", ts.sys.directoryExists)),
            resolvePath: (0, util_1.cachedLookup)(debugFn("resolvePath", ts.sys.resolvePath)),
            realpath: ts.sys.realpath ? (0, util_1.cachedLookup)(debugFn("realpath", ts.sys.realpath)) : void 0
          };
          const host = ts.createIncrementalCompilerHost ? ts.createIncrementalCompilerHost(config.options, sys) : {
            ...sys,
            getSourceFile: (fileName, languageVersion) => {
              const contents = sys.readFile(fileName);
              if (contents === void 0)
                return;
              return ts.createSourceFile(fileName, contents, languageVersion);
            },
            getDefaultLibLocation: () => (0, util_1.normalizeSlashes)((0, path_1.dirname)(compiler)),
            getDefaultLibFileName: () => (0, util_1.normalizeSlashes)((0, path_1.join)((0, path_1.dirname)(compiler), ts.getDefaultLibFileName(config.options))),
            useCaseSensitiveFileNames: () => sys.useCaseSensitiveFileNames
          };
          host.trace = options.tsTrace;
          const { resolveModuleNames, resolveTypeReferenceDirectives, isFileKnownToBeInternal, markBucketOfFilenameInternal } = (0, resolver_functions_1.createResolverFunctions)({
            host,
            cwd,
            config,
            ts,
            getCanonicalFileName,
            projectLocalResolveHelper,
            options,
            extensions
          });
          host.resolveModuleNames = resolveModuleNames;
          host.resolveTypeReferenceDirectives = resolveTypeReferenceDirectives;
          let builderProgram = ts.createIncrementalProgram ? ts.createIncrementalProgram({
            rootNames: Array.from(rootFileNames),
            options: config.options,
            host,
            configFileParsingDiagnostics: config.errors,
            projectReferences: config.projectReferences
          }) : ts.createEmitAndSemanticDiagnosticsBuilderProgram(Array.from(rootFileNames), config.options, host, void 0, config.errors, config.projectReferences);
          const customTransformers = typeof transformers === "function" ? transformers(builderProgram.getProgram()) : transformers;
          const updateMemoryCache = (contents, fileName) => {
            const previousContents = fileContents.get(fileName);
            const contentsChanged = previousContents !== contents;
            if (contentsChanged) {
              fileContents.set(fileName, contents);
            }
            let addedToRootFileNames = false;
            if (!rootFileNames.has(fileName) && !isFileKnownToBeInternal(fileName)) {
              markBucketOfFilenameInternal(fileName);
              rootFileNames.add(fileName);
              addedToRootFileNames = true;
            }
            if (addedToRootFileNames || contentsChanged) {
              builderProgram = ts.createEmitAndSemanticDiagnosticsBuilderProgram(Array.from(rootFileNames), config.options, host, builderProgram, config.errors, config.projectReferences);
            }
          };
          getOutput = (code, fileName) => {
            let outText = "";
            let outMap = "";
            updateMemoryCache(code, fileName);
            const sourceFile = builderProgram.getSourceFile(fileName);
            if (!sourceFile)
              throw new TypeError(`Unable to read file: ${fileName}`);
            const program2 = builderProgram.getProgram();
            const diagnostics = ts.getPreEmitDiagnostics(program2, sourceFile);
            const diagnosticList = filterDiagnostics(diagnostics, diagnosticFilters);
            if (diagnosticList.length)
              reportTSError(diagnosticList);
            const result = builderProgram.emit(sourceFile, (path3, file, writeByteOrderMark) => {
              if (path3.endsWith(".map")) {
                outMap = file;
              } else {
                outText = file;
              }
              if (options.emit)
                sys.writeFile(path3, file, writeByteOrderMark);
            }, void 0, void 0, customTransformers);
            if (result.emitSkipped) {
              return [void 0, void 0, true];
            }
            if (outText === "") {
              if (program2.isSourceFileFromExternalLibrary(sourceFile)) {
                throw new TypeError(`Unable to compile file from external library: ${(0, path_1.relative)(cwd, fileName)}`);
              }
              throw new TypeError(`Unable to require file: ${(0, path_1.relative)(cwd, fileName)}
This is usually the result of a faulty configuration or import. Make sure there is a \`.js\`, \`.json\` or other executable extension with loader attached before \`ts-node\` available.`);
            }
            return [outText, outMap, false];
          };
          getTypeInfo = (code, fileName, position) => {
            const normalizedFileName = (0, util_1.normalizeSlashes)(fileName);
            updateMemoryCache(code, normalizedFileName);
            const sourceFile = builderProgram.getSourceFile(normalizedFileName);
            if (!sourceFile)
              throw new TypeError(`Unable to read file: ${fileName}`);
            const node = getTokenAtPosition(ts, sourceFile, position);
            const checker = builderProgram.getProgram().getTypeChecker();
            const symbol = checker.getSymbolAtLocation(node);
            if (!symbol)
              return { name: "", comment: "" };
            const type = checker.getTypeOfSymbolAtLocation(symbol, node);
            const signatures = [
              ...type.getConstructSignatures(),
              ...type.getCallSignatures()
            ];
            return {
              name: signatures.length ? signatures.map((x) => checker.signatureToString(x)).join("\n") : checker.typeToString(type),
              comment: ts.displayPartsToString(symbol ? symbol.getDocumentationComment(checker) : [])
            };
          };
          if (options.emit && config.options.incremental) {
            process.on("exit", () => {
              builderProgram.getProgram().emitBuildInfo();
            });
          }
        }
      } else {
        getTypeInfo = () => {
          throw new TypeError('Type information is unavailable in "--transpile-only"');
        };
      }
      function createTranspileOnlyGetOutputFunction(overrideModuleType, nodeModuleEmitKind) {
        const compilerOptions = { ...config.options };
        if (overrideModuleType !== void 0)
          compilerOptions.module = overrideModuleType;
        let customTranspiler = createTranspiler === null || createTranspiler === void 0 ? void 0 : createTranspiler(compilerOptions, nodeModuleEmitKind);
        let tsTranspileModule = (0, util_1.versionGteLt)(ts.version, "4.7.0") ? (0, ts_transpile_module_1.createTsTranspileModule)(ts, {
          compilerOptions,
          reportDiagnostics: true,
          transformers
        }) : void 0;
        return (code, fileName) => {
          let result;
          if (customTranspiler) {
            result = customTranspiler.transpile(code, {
              fileName
            });
          } else if (tsTranspileModule) {
            result = tsTranspileModule(code, {
              fileName
            }, nodeModuleEmitKind === "nodeesm" ? "module" : "commonjs");
          } else {
            result = ts.transpileModule(code, {
              fileName,
              compilerOptions,
              reportDiagnostics: true,
              transformers
            });
          }
          const diagnosticList = filterDiagnostics(result.diagnostics || [], diagnosticFilters);
          if (diagnosticList.length)
            reportTSError(diagnosticList);
          return [result.outputText, result.sourceMapText, false];
        };
      }
      const shouldOverwriteEmitWhenForcingCommonJS = config.options.module !== ts.ModuleKind.CommonJS;
      const shouldOverwriteEmitWhenForcingEsm = !(config.options.module === ts.ModuleKind.ES2015 || ts.ModuleKind.ES2020 && config.options.module === ts.ModuleKind.ES2020 || ts.ModuleKind.ES2022 && config.options.module === ts.ModuleKind.ES2022 || config.options.module === ts.ModuleKind.ESNext);
      const isNodeModuleType = ts.ModuleKind.Node16 && config.options.module === ts.ModuleKind.Node16 || ts.ModuleKind.NodeNext && config.options.module === ts.ModuleKind.NodeNext;
      const getOutputForceCommonJS = createTranspileOnlyGetOutputFunction(ts.ModuleKind.CommonJS);
      const getOutputForceNodeCommonJS = createTranspileOnlyGetOutputFunction(ts.ModuleKind.NodeNext, "nodecjs");
      const getOutputForceNodeESM = createTranspileOnlyGetOutputFunction(ts.ModuleKind.NodeNext, "nodeesm");
      const getOutputForceESM = createTranspileOnlyGetOutputFunction(ts.ModuleKind.ES2022 || ts.ModuleKind.ES2020 || ts.ModuleKind.ES2015);
      const getOutputTranspileOnly = createTranspileOnlyGetOutputFunction();
      function compile(code, fileName, lineOffset = 0) {
        const normalizedFileName = (0, util_1.normalizeSlashes)(fileName);
        const classification = moduleTypeClassifier.classifyModuleByModuleTypeOverrides(normalizedFileName);
        let value2 = "";
        let sourceMap = "";
        let emitSkipped = true;
        if (getOutput) {
          [value2, sourceMap, emitSkipped] = getOutput(code, normalizedFileName);
        }
        if (classification.moduleType === "cjs" && (shouldOverwriteEmitWhenForcingCommonJS || emitSkipped)) {
          [value2, sourceMap] = getOutputForceCommonJS(code, normalizedFileName);
        } else if (classification.moduleType === "esm" && (shouldOverwriteEmitWhenForcingEsm || emitSkipped)) {
          [value2, sourceMap] = getOutputForceESM(code, normalizedFileName);
        } else if (emitSkipped) {
          const classification2 = (0, node_module_type_classifier_1.classifyModule)(fileName, isNodeModuleType);
          [value2, sourceMap] = classification2 === "nodecjs" ? getOutputForceNodeCommonJS(code, normalizedFileName) : classification2 === "nodeesm" ? getOutputForceNodeESM(code, normalizedFileName) : classification2 === "cjs" ? getOutputForceCommonJS(code, normalizedFileName) : classification2 === "esm" ? getOutputForceESM(code, normalizedFileName) : getOutputTranspileOnly(code, normalizedFileName);
        }
        const output = updateOutput(value2, normalizedFileName, sourceMap, getEmitExtension);
        outputCache.set(normalizedFileName, { content: output });
        return output;
      }
      let active = true;
      const enabled = (enabled2) => enabled2 === void 0 ? active : active = !!enabled2;
      const ignored = (fileName) => {
        if (!active)
          return true;
        const ext = (0, path_1.extname)(fileName);
        if (extensions.compiled.includes(ext)) {
          return !isScoped(fileName) || shouldIgnore(fileName);
        }
        return true;
      };
      function addDiagnosticFilter(filter) {
        diagnosticFilters.push({
          ...filter,
          filenamesAbsolute: filter.filenamesAbsolute.map((f) => (0, util_1.normalizeSlashes)(f))
        });
      }
      const getNodeEsmResolver = (0, util_1.once)(() => require_node_internal_modules_esm_resolve().createResolve({
        extensions,
        preferTsExts: options.preferTsExts,
        tsNodeExperimentalSpecifierResolution: options.experimentalSpecifierResolution
      }));
      const getNodeEsmGetFormat = (0, util_1.once)(() => require_node_internal_modules_esm_get_format().createGetFormat(options.experimentalSpecifierResolution, getNodeEsmResolver()));
      const getNodeCjsLoader = (0, util_1.once)(() => require_node_internal_modules_cjs_loader().createCjsLoader({
        extensions,
        preferTsExts: options.preferTsExts,
        nodeEsmResolver: getNodeEsmResolver()
      }));
      return {
        [TS_NODE_SERVICE_BRAND]: true,
        ts,
        compilerPath: compiler,
        config,
        compile,
        getTypeInfo,
        ignored,
        enabled,
        options,
        configFilePath,
        moduleTypeClassifier,
        shouldReplAwait,
        addDiagnosticFilter,
        installSourceMapSupport,
        enableExperimentalEsmLoaderInterop,
        transpileOnly,
        projectLocalResolveHelper,
        getNodeEsmResolver,
        getNodeEsmGetFormat,
        getNodeCjsLoader,
        extensions
      };
    }
    exports2.createFromPreloadedConfig = createFromPreloadedConfig;
    function createIgnore(ignoreBaseDir, ignore) {
      return (fileName) => {
        const relname = (0, path_1.relative)(ignoreBaseDir, fileName);
        const path3 = (0, util_1.normalizeSlashes)(relname);
        return ignore.some((x) => x.test(path3));
      };
    }
    function registerExtensions(preferTsExts, extensions, service, originalJsHandler) {
      const exts = new Set(extensions);
      for (const cannotAdd of [".mts", ".cts", ".mjs", ".cjs"]) {
        if (exts.has(cannotAdd) && !(0, util_1.hasOwnProperty)(require.extensions, cannotAdd)) {
          exts.add(".js");
          exts.delete(cannotAdd);
        }
      }
      for (const ext of exts) {
        registerExtension(ext, service, originalJsHandler);
      }
      if (preferTsExts) {
        const preferredExtensions = /* @__PURE__ */ new Set([
          ...exts,
          ...Object.keys(require.extensions)
        ]);
        for (const ext of preferredExtensions) {
          const old = Object.getOwnPropertyDescriptor(require.extensions, ext);
          delete require.extensions[ext];
          Object.defineProperty(require.extensions, ext, old);
        }
      }
    }
    function registerExtension(ext, service, originalHandler) {
      const old = require.extensions[ext] || originalHandler;
      require.extensions[ext] = function(m, filename) {
        if (service.ignored(filename))
          return old(m, filename);
        assertScriptCanLoadAsCJS(service, m, filename);
        const _compile = m._compile;
        m._compile = function(code, fileName) {
          (0, exports2.debug)("module._compile", fileName);
          const result = service.compile(code, fileName);
          return _compile.call(this, result, fileName);
        };
        return old(m, filename);
      };
    }
    function updateOutput(outputText, fileName, sourceMap, getEmitExtension) {
      const base64Map = Buffer.from(updateSourceMap(sourceMap, fileName), "utf8").toString("base64");
      const sourceMapContent = `//# sourceMappingURL=data:application/json;charset=utf-8;base64,${base64Map}`;
      const prefix = "//# sourceMappingURL=";
      const prefixLength = prefix.length;
      const baseName = (
        /*foo.tsx*/
        (0, path_1.basename)(fileName)
      );
      const extName = (
        /*.tsx*/
        (0, path_1.extname)(fileName)
      );
      const extension = (
        /*.js*/
        getEmitExtension(fileName)
      );
      const sourcemapFilename = baseName.slice(0, -extName.length) + extension + ".map";
      const sourceMapLengthWithoutPercentEncoding = prefixLength + sourcemapFilename.length;
      if (outputText.substr(-sourceMapLengthWithoutPercentEncoding, prefixLength) === prefix) {
        return outputText.slice(0, -sourceMapLengthWithoutPercentEncoding) + sourceMapContent;
      }
      const sourceMapLengthWithPercentEncoding = prefixLength + encodeURI(sourcemapFilename).length;
      if (outputText.substr(-sourceMapLengthWithPercentEncoding, prefixLength) === prefix) {
        return outputText.slice(0, -sourceMapLengthWithPercentEncoding) + sourceMapContent;
      }
      return `${outputText}
${sourceMapContent}`;
    }
    function updateSourceMap(sourceMapText, fileName) {
      const sourceMap = JSON.parse(sourceMapText);
      sourceMap.file = fileName;
      sourceMap.sources = [fileName];
      delete sourceMap.sourceRoot;
      return JSON.stringify(sourceMap);
    }
    function filterDiagnostics(diagnostics, filters) {
      return diagnostics.filter((d) => filters.every((f) => {
        var _a2;
        return !f.appliesToAllFiles && f.filenamesAbsolute.indexOf((_a2 = d.file) === null || _a2 === void 0 ? void 0 : _a2.fileName) === -1 || f.diagnosticsIgnored.indexOf(d.code) === -1;
      }));
    }
    function getTokenAtPosition(ts, sourceFile, position) {
      let current = sourceFile;
      outer: while (true) {
        for (const child of current.getChildren(sourceFile)) {
          const start = child.getFullStart();
          if (start > position)
            break;
          const end = child.getEnd();
          if (position <= end) {
            current = child;
            continue outer;
          }
        }
        return current;
      }
    }
    var createEsmHooks = (tsNodeService) => require_esm().createEsmHooks(tsNodeService);
    exports2.createEsmHooks = createEsmHooks;
  }
});

// src/cli.ts
init_cjs_shims();
var import_commander = require("commander");

// src/hysteria_cli/migration_create_connector.ts
init_cjs_shims();
var import_dotenv = __toESM(require("dotenv"));
var import_path = __toESM(require("path"));

// src/hysteria_cli/resources/migration_templates.ts
init_cjs_shims();
var Migration_templates = class {
  basicMigrationTemplate(js = false) {
    if (js) {
      return `import { Migration } from 'hysteria-orm';

export default class extends Migration {
  async up() {
    // Your migration logic here
  }

  async down() {
    // Your rollback logic here
  }
}
`;
    }
    return `import { Migration } from 'hysteria-orm';

export default class extends Migration {
  async up(): Promise<void> {
    // Your migration logic here
  }

  async down(): Promise<void> {
    // Your rollback logic here
  }
}
`;
  }
  selectAllFromMigrationsTemplate() {
    return `SELECT * FROM migrations;`;
  }
  migrationTableTemplateMysql() {
    return `CREATE TABLE IF NOT EXISTS \`migrations\`(
    \`id\` INT NOT NULL AUTO_INCREMENT,
    \`name\` VARCHAR(255) NOT NULL,
    \`timestamp\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;
  }
  migrationTableTemplatePg() {
    return `CREATE TABLE IF NOT EXISTS migrations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`;
  }
  migrationTableTemplateSQLite() {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    return `CREATE TABLE IF NOT EXISTS migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    timestamp TEXT NOT NULL DEFAULT '${now}'
);`;
  }
};
var migration_templates_default = new Migration_templates();

// src/hysteria_cli/migration_create_connector.ts
var import_fs = __toESM(require("fs"));

// src/utils/logger.ts
init_cjs_shims();
var import_winston = __toESM(require("winston"));
var colors = {
  info: "\x1B[32m",
  warn: "\x1B[33m",
  error: "\x1B[31m"
};
var logFormat = import_winston.default.format.combine(
  import_winston.default.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  import_winston.default.format.printf(({ level, message, timestamp }) => {
    const color = colors[level] || "\x1B[0m";
    return `${timestamp} ${color}${level}\x1B[0m: ${color}${message}\x1B[0m`;
  })
);
var consoleTransport = new import_winston.default.transports.Console();
var fileTransport = new import_winston.default.transports.File({ filename: "logfile.log" });
var logger = import_winston.default.createLogger({
  format: logFormat,
  transports: [consoleTransport, fileTransport]
});
function log(query, logs, params) {
  if (!logs) {
    return;
  }
  if (params && params.length) {
    params.forEach((param, index) => {
      let formattedParam = null;
      if (typeof param === "string") {
        formattedParam = `'${param}'`;
      } else if (typeof param === "object" && param !== null && Object.keys(param).length > 0) {
        formattedParam = `'${JSON.stringify(param)}'`;
      } else {
        formattedParam = param;
      }
      query = query.replace(/\?/, formattedParam);
      const pgPlaceholder = new RegExp(`\\$${index + 1}`, "g");
      query = query.replace(pgPlaceholder, formattedParam);
    });
  }
  logger.info("\n" + query);
}
var logger_default = logger;

// src/hysteria_cli/migration_create_connector.ts
import_dotenv.default.config();
function getOrCreateMigrationPath() {
  let migrationPath = process.env.MIGRATION_PATH || "database/migrations";
  let currentPath = import_path.default.resolve(process.cwd(), migrationPath);
  if (!import_fs.default.existsSync(currentPath)) {
    import_fs.default.mkdirSync(currentPath, { recursive: true });
  }
  return currentPath;
}
function migrationCreateConnector(name, js = false) {
  const migrationFolderPath = getOrCreateMigrationPath();
  const timestamp = (/* @__PURE__ */ new Date()).getTime();
  const migrationFileName = !js ? `${timestamp}_${name}.ts` : `${timestamp}_${name}.js`;
  const migrationFilePath = import_path.default.join(migrationFolderPath, migrationFileName);
  const migrationTemplate = migration_templates_default.basicMigrationTemplate(js);
  import_fs.default.writeFileSync(migrationFilePath, migrationTemplate);
  logger_default.info(`Migration created successfully at '${migrationFilePath}'.`);
}

// src/hysteria_cli/migration_run_connector.ts
init_cjs_shims();
var import_dotenv7 = __toESM(require("dotenv"));

// src/hysteria_cli/postgres/run_migration.ts
init_cjs_shims();
var import_dotenv4 = __toESM(require("dotenv"));

// src/sql/migrations/migration_controller.ts
init_cjs_shims();
var MigrationController = class {
  constructor(sqlDataSource, sqlConnection, sqlType) {
    this.sqlConnection = sqlConnection;
    this.sqlType = sqlType;
    this.sqlDataSource = sqlDataSource;
  }
  async upMigrations(migrations) {
    try {
      for (const migration of migrations) {
        await migration.up();
        const statements = migration.schema.queryStatements;
        for (const statement of statements) {
          if (!statement || statement === "" || statement === ";" || statement === ",") {
            continue;
          }
          await this.localQuery(statement);
        }
        await this.addMigrationToMigrationTable(migration);
        if (migration.afterUp) {
          await migration.afterUp(this.sqlDataSource);
        }
      }
    } catch (error) {
      throw error;
    }
  }
  async downMigrations(migrations) {
    migrations = migrations.reverse();
    try {
      for (const migration of migrations) {
        await migration.down();
        const statements = migration.schema.queryStatements;
        for (const statement of statements) {
          if (!statement || statement === "" || statement === ";" || statement === ",") {
            continue;
          }
          await this.localQuery(statement);
        }
        await this.deleteMigrationFromMigrationTable(migration);
        if (migration.afterDown) {
          await migration.afterDown(this.sqlDataSource);
        }
      }
    } catch (error) {
      throw new Error(error);
    }
  }
  async localQuery(text, params = []) {
    if (this.sqlType === "mysql" || this.sqlType === "mariadb") {
      text = text.replace(/PLACEHOLDER/g, "?");
      log(text, true, params);
      await this.sqlConnection.query(text, params);
      return;
    } else if (this.sqlType === "postgres") {
      let index = 1;
      text = text.replace(/PLACEHOLDER/g, () => `$${index++}`);
      log(text, true, params);
      await this.sqlConnection.query(text, params);
      return;
    } else if (this.sqlType === "sqlite") {
      text = text.replace(/PLACEHOLDER/g, "?");
      log(text, true, params);
      await new Promise((resolve, reject) => {
        this.sqlConnection.run(
          text,
          params,
          (error) => {
            if (error) {
              reject(error);
            } else {
              resolve();
            }
          }
        );
      });
      return;
    }
    throw new Error("No database connection found while running migration");
  }
  async addMigrationToMigrationTable(migration) {
    const completeUtcTimestamp = /* @__PURE__ */ new Date();
    const timestamp = completeUtcTimestamp.toISOString().replace("T", " ").replace(/\.\d{3}Z$/, "");
    const insertMigrationSql = `INSERT INTO migrations (name, timestamp) VALUES (PLACEHOLDER, PLACEHOLDER)`;
    await this.localQuery(insertMigrationSql, [
      migration.migrationName,
      timestamp
    ]);
  }
  async deleteMigrationFromMigrationTable(migration) {
    const deleteMigrationSql = `DELETE FROM migrations WHERE name = PLACEHOLDER`;
    await this.localQuery(deleteMigrationSql, [migration.migrationName]);
  }
  async removeMigrationTable() {
    const dropMigrationTableSql = `
      DROP TABLE IF EXISTS migrations
    `;
    log(dropMigrationTableSql, true);
    await this.localQuery(dropMigrationTableSql);
  }
};

// src/sql/resources/query/TRANSACTION.ts
init_cjs_shims();
var BEGIN_TRANSACTION = "BEGIN; \n";
var COMMIT_TRANSACTION = "COMMIT; \n";
var ROLLBACK_TRANSACTION = "ROLLBACK; \n";

// src/sql/sql_data_source.ts
init_cjs_shims();

// src/data_source.ts
init_cjs_shims();
var import_dotenv2 = __toESM(require("dotenv"));
import_dotenv2.default.config();
var DataSource = class {
  constructor(input) {
    if (this.type === "mongo") {
      this.handleMongoSource(input?.url);
      return;
    }
    this.handleSqlSource(input);
  }
  handleMongoSource(url) {
    this.type = "mongo";
  }
  handleSqlSource(input) {
    this.type = input?.type || process.env.DB_TYPE;
    this.host = input?.host || process.env.DB_HOST;
    this.port = +input?.port || +process.env.DB_PORT;
    this.username = input?.username || process.env.DB_USER;
    this.password = input?.password || process.env.DB_PASSWORD;
    this.database = input?.database || process.env.DB_DATABASE;
    this.logs = Boolean(input?.logs) || Boolean(process.env.DB_LOGS) || false;
    if (!this.port) {
      switch (this.type) {
        case "mysql":
        case "mariadb":
          this.port = 3306;
          break;
        case "postgres":
          this.port = 5432;
          break;
        case "mongo":
          this.port = 27017;
          break;
        case "sqlite":
          break;
        default:
          throw new Error(
            "Database type not provided in the envs nor in the connection details"
          );
      }
    }
  }
};

// src/drivers/drivers_factory.ts
init_cjs_shims();

// src/drivers/pg_driver.ts
init_cjs_shims();

// src/drivers/driver.ts
init_cjs_shims();
var Driver = class {
  constructor(driverSpecificOptions) {
    this.options = driverSpecificOptions;
  }
  static async createDriver(_driverSpecificOptions) {
    throw new Error("Cannot be used by abstract class");
  }
};

// src/drivers/driver_constants.ts
init_cjs_shims();
var DriverNotFoundError = class extends Error {
  constructor(driverName) {
    super(driverName);
    this.name = `Driver ${driverName} not found, it's likely not installed, try running npm install ${driverName}`;
  }
};

// src/drivers/pg_driver.ts
var PgDriver = class _PgDriver extends Driver {
  constructor(client, driverSpecificOptions) {
    super(driverSpecificOptions);
    this.type = "postgres";
    this.client = client;
  }
  static async createDriver(driverSpecificOptions) {
    const pg = await import("pg").catch(() => {
      throw new DriverNotFoundError("pg");
    });
    if (!pg) {
      throw new DriverNotFoundError("pg");
    }
    return new _PgDriver(pg.default, driverSpecificOptions);
  }
};

// src/drivers/mongo_driver.ts
init_cjs_shims();
var MongoDriver = class _MongoDriver extends Driver {
  constructor(client, driverSpecificOptions) {
    super(driverSpecificOptions);
    this.type = "postgres";
    this.client = client;
  }
  static async createDriver(driverSpecificOptions) {
    const mongo = await import("mongodb").catch(() => {
      throw new DriverNotFoundError("mongodb");
    });
    if (!mongo) {
      throw new DriverNotFoundError("mongodb");
    }
    return new _MongoDriver(mongo, driverSpecificOptions);
  }
};

// src/drivers/mysql_driver.ts
init_cjs_shims();
var MysqlDriver = class _MysqlDriver extends Driver {
  constructor(client, driverSpecificOptions) {
    super(driverSpecificOptions);
    this.type = "mysql";
    this.client = client;
  }
  static async createDriver(driverSpecificOptions) {
    const mysql2 = await import("mysql2/promise").catch(() => {
      throw new DriverNotFoundError("mysql2");
    });
    if (!mysql2) {
      throw new DriverNotFoundError("mysql");
    }
    return new _MysqlDriver(mysql2.default, driverSpecificOptions);
  }
};

// src/drivers/redis_driver.ts
init_cjs_shims();
var RedisDriver = class _RedisDriver extends Driver {
  constructor(client, driverSpecificOptions) {
    super(driverSpecificOptions);
    this.type = "postgres";
    this.client = client;
  }
  static async createDriver(driverSpecificOptions) {
    const redis = await import("ioredis").catch(() => {
      throw new DriverNotFoundError("ioredis");
    });
    if (!redis) {
      throw new DriverNotFoundError("ioredis");
    }
    return new _RedisDriver(redis, driverSpecificOptions);
  }
};

// src/drivers/sqlite3_driver.ts
init_cjs_shims();
var Sqlite3Driver = class _Sqlite3Driver extends Driver {
  constructor(client, driverSpecificOptions) {
    super(driverSpecificOptions);
    this.type = "postgres";
    this.client = client;
  }
  static async createDriver(driverSpecificOptions) {
    const sqlite3 = await import("sqlite3").catch(() => {
      throw new DriverNotFoundError("sqlite3");
    });
    if (!sqlite3) {
      throw new DriverNotFoundError("sqlite3");
    }
    return new _Sqlite3Driver(sqlite3.default, driverSpecificOptions);
  }
};

// src/drivers/drivers_factory.ts
var DriverFactory = class {
  static async getDriver(client, driverSpecificOptions) {
    switch (client) {
      case "mysql":
      case "mariadb":
        return MysqlDriver.createDriver(driverSpecificOptions);
      case "postgres":
        return PgDriver.createDriver(driverSpecificOptions);
      case "sqlite":
        return Sqlite3Driver.createDriver(driverSpecificOptions);
      case "mongo":
        return MongoDriver.createDriver(driverSpecificOptions);
      case "redis":
        return RedisDriver.createDriver(driverSpecificOptions);
      default:
        throw new Error(
          `Driver ${client} not found, il likely not installed, try running npm install ${client}`
        );
    }
  }
};

// src/sql/mysql/mysql_model_manager.ts
init_cjs_shims();

// src/sql/models/model_manager/model_manager.ts
init_cjs_shims();

// src/sql/models/model.ts
init_cjs_shims();
var import_reflect_metadata = require("reflect-metadata");

// src/utils/case_utils.ts
init_cjs_shims();
function camelToSnakeCase(camelCase) {
  if (typeof camelCase !== "string" || !camelCase) {
    return camelCase;
  }
  if (camelCase === camelCase.toLowerCase()) {
    return camelCase;
  }
  return camelCase.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase();
}
function fromSnakeToCamelCase(snake) {
  if (typeof snake !== "string" || !snake) {
    return snake;
  }
  if (snake === snake.toUpperCase()) {
    return snake;
  }
  return snake.replace(/(_\w)/g, (x) => x[1].toUpperCase());
}
function convertCase(value2, to) {
  if (to === "none") {
    return value2;
  }
  if (to === "snake") {
    return camelToSnakeCase(value2);
  }
  if (to === "camel") {
    return fromSnakeToCamelCase(value2);
  }
  if (to instanceof RegExp) {
    return value2.replace(to, (x) => x[1].toUpperCase());
  }
  return to(value2);
}

// src/sql/serializer.ts
init_cjs_shims();

// src/utils/json_utils.ts
init_cjs_shims();
function isNestedObject(value2) {
  return typeof value2 === "object" && !Array.isArray(value2) && value2 !== null && Object.keys(value2).length > 0;
}

// src/sql/models/model_decorators.ts
init_cjs_shims();

// src/sql/models/relations/belongs_to.ts
init_cjs_shims();

// src/sql/models/relations/relation.ts
init_cjs_shims();
function isRelationDefinition(originalValue) {
  return originalValue.hasOwnProperty("type") && originalValue.hasOwnProperty("relatedModel") && originalValue.hasOwnProperty("foreignKey");
}
var Relation = class {
  constructor(model, columnName) {
    this.model = Model;
    this.columnName = "";
    this.relatedModel = "";
    this.model = model;
    this.columnName = columnName;
    this.relatedModel = this.model.table;
  }
};

// src/sql/models/relations/belongs_to.ts
var BelongsTo = class extends Relation {
  constructor(relatedModel, columnName, foreignKey) {
    super(relatedModel, columnName);
    this.foreignKey = foreignKey;
    this.type = "belongsTo" /* belongsTo */;
  }
};

// src/sql/models/relations/has_many.ts
init_cjs_shims();
var HasMany = class extends Relation {
  constructor(relatedModel, columnName, foreignKey) {
    super(relatedModel, columnName);
    this.type = "hasMany" /* hasMany */;
    this.foreignKey = foreignKey;
    this.type = "hasMany" /* hasMany */;
  }
};

// src/sql/models/relations/has_one.ts
init_cjs_shims();
var HasOne = class extends Relation {
  constructor(relatedModel, columnName, foreignKey) {
    super(relatedModel, columnName);
    this.foreignKey = foreignKey;
    this.type = "hasOne" /* hasOne */;
  }
};

// src/sql/models/relations/many_to_many.ts
init_cjs_shims();
var ManyToMany = class extends Relation {
  constructor(model, columnName, throughModel, foreignKey) {
    super(model, columnName);
    this.type = "manyToMany" /* manyToMany */;
    this.throughModel = "";
    this.foreignKey = "";
    this.relatedModelForeignKey = "";
    this.columnName = columnName;
    this.foreignKey = foreignKey;
    this.throughModel = throughModel;
  }
};

// src/sql/models/model_decorators.ts
var COLUMN_METADATA_KEY = Symbol("columns");
var DYNAMIC_COLUMN_METADATA_KEY = Symbol("dynamicColumns");
var PRIMARY_KEY_METADATA_KEY = Symbol("primaryKey");
var RELATION_METADATA_KEY = Symbol("relations");
function column(options = {
  primaryKey: false
}) {
  return (target, propertyKey) => {
    if (options.primaryKey) {
      const primaryKey = Reflect.getMetadata(PRIMARY_KEY_METADATA_KEY, target);
      if (primaryKey) {
        throw new Error("Multiple primary keys are not allowed");
      }
      Reflect.defineMetadata(PRIMARY_KEY_METADATA_KEY, propertyKey, target);
    }
    const column2 = {
      columnName: propertyKey,
      serialize: options.serialize,
      prepare: options.prepare,
      hidden: options.hidden
    };
    const existingColumns = Reflect.getMetadata(COLUMN_METADATA_KEY, target) || [];
    existingColumns.push(column2);
    Reflect.defineMetadata(COLUMN_METADATA_KEY, existingColumns, target);
  };
}
function dynamicColumn(columnName) {
  return (target, propertyKey) => {
    const dynamicColumn2 = {
      columnName,
      functionName: propertyKey,
      dynamicColumnFn: target.constructor.prototype[propertyKey]
    };
    const existingColumns = Reflect.getMetadata(DYNAMIC_COLUMN_METADATA_KEY, target) || [];
    existingColumns.push(dynamicColumn2);
    Reflect.defineMetadata(
      DYNAMIC_COLUMN_METADATA_KEY,
      existingColumns,
      target
    );
  };
}
function getModelColumns(target) {
  return Reflect.getMetadata(COLUMN_METADATA_KEY, target.prototype) || [];
}
function belongsTo(model, foreignKey) {
  return (target, propertyKey) => {
    const relation = {
      type: "belongsTo" /* belongsTo */,
      columnName: propertyKey,
      model,
      foreignKey
    };
    const relations = Reflect.getMetadata(RELATION_METADATA_KEY, target) || [];
    relations.push(relation);
    Reflect.defineMetadata(RELATION_METADATA_KEY, relations, target);
  };
}
function hasOne(model, foreignKey) {
  return (target, propertyKey) => {
    const relation = {
      type: "hasOne" /* hasOne */,
      columnName: propertyKey,
      model,
      foreignKey
    };
    const relations = Reflect.getMetadata(RELATION_METADATA_KEY, target) || [];
    relations.push(relation);
    Reflect.defineMetadata(RELATION_METADATA_KEY, relations, target);
  };
}
function hasMany(model, foreignKey) {
  return (target, propertyKey) => {
    const relation = {
      type: "hasMany" /* hasMany */,
      columnName: propertyKey,
      model,
      foreignKey
    };
    const relations = Reflect.getMetadata(RELATION_METADATA_KEY, target) || [];
    relations.push(relation);
    Reflect.defineMetadata(RELATION_METADATA_KEY, relations, target);
  };
}
function manyToMany(model, throughModel, foreignKey) {
  return (target, propertyKey) => {
    if (!(typeof throughModel === "string")) {
      throughModel = throughModel().table;
    }
    const relation = {
      type: "manyToMany" /* manyToMany */,
      columnName: propertyKey,
      model,
      foreignKey,
      manyToManyOptions: {
        throughModel
      }
    };
    const relations = Reflect.getMetadata(RELATION_METADATA_KEY, target) || [];
    relations.push(relation);
    Reflect.defineMetadata(RELATION_METADATA_KEY, relations, target);
  };
}
function getRelations(target) {
  const relations = Reflect.getMetadata(RELATION_METADATA_KEY, target.prototype) || [];
  return relations.map((relation) => {
    const { type, model, columnName, foreignKey } = relation;
    switch (type) {
      case "belongsTo" /* belongsTo */:
        return new BelongsTo(model(), columnName, foreignKey);
      case "hasOne" /* hasOne */:
        return new HasOne(model(), columnName, foreignKey);
      case "hasMany" /* hasMany */:
        return new HasMany(model(), columnName, foreignKey);
      case "manyToMany" /* manyToMany */:
        if (!relation.manyToManyOptions) {
          throw new Error("Many to many relation must have a through model");
        }
        return new ManyToMany(
          model(),
          columnName,
          relation.manyToManyOptions.throughModel,
          relation.foreignKey
        );
      default:
        throw new Error(`Unknown relation type: ${type}`);
    }
  });
}
function getPrimaryKey(target) {
  return Reflect.getMetadata(PRIMARY_KEY_METADATA_KEY, target.prototype);
}
function getDynamicColumns(target) {
  return Reflect.getMetadata(DYNAMIC_COLUMN_METADATA_KEY, target.prototype);
}

// src/sql/serializer.ts
async function parseDatabaseDataIntoModelResponse(models, typeofModel, relationModels = [], modelSelectedColumns = []) {
  if (!models.length) {
    return null;
  }
  const relations = getRelations(typeofModel);
  const serializedModels = models.map((model) => {
    const serializedModel = serializeModel(
      model,
      typeofModel,
      modelSelectedColumns
    );
    processRelation(serializedModel, typeofModel, relations, relationModels);
    return serializedModel;
  });
  return serializedModels.length === 1 ? serializedModels[0] : serializedModels;
}
function serializeModel(model, typeofModel, modelSelectedColumns = []) {
  const casedModel = {};
  const columns = getModelColumns(typeofModel);
  const hiddenColumns = columns.filter((column2) => column2.hidden).map((column2) => column2.columnName);
  for (const key in model) {
    if (key === "$additionalColumns") {
      processAdditionalColumns(model, key, casedModel, typeofModel);
      continue;
    }
    if (!model.hasOwnProperty(key) || hiddenColumns.includes(key) || modelSelectedColumns.length && !modelSelectedColumns.includes(key)) {
      continue;
    }
    const originalValue = model[key];
    if (originalValue == null) {
      casedModel[convertCase(key, typeofModel.modelCaseConvention)] = originalValue;
      continue;
    }
    if (isRelationDefinition(originalValue)) {
      continue;
    }
    const camelCaseKey = convertCase(key, typeofModel.modelCaseConvention);
    if (isNestedObject(originalValue) && !Array.isArray(originalValue)) {
      casedModel[camelCaseKey] = convertToModelCaseConvention(
        originalValue,
        typeofModel
      );
      continue;
    }
    if (Array.isArray(originalValue)) {
      continue;
    }
    const modelColumn = columns.find((column2) => column2.columnName === key);
    if (modelColumn && modelColumn.serialize) {
      casedModel[camelCaseKey] = modelColumn.serialize(originalValue);
      continue;
    }
    casedModel[camelCaseKey] = originalValue;
  }
  return casedModel;
}
function processAdditionalColumns(model, key, casedModel, typeofModel) {
  if (!Object.keys(model[key]).length) {
    return;
  }
  const $additionalColumns = Object.keys(model[key]).reduce(
    (acc, objKey) => {
      acc[convertCase(objKey, typeofModel.modelCaseConvention)] = model[key][objKey];
      return acc;
    },
    {}
  );
  casedModel[key] = $additionalColumns;
}
function processRelation(serializedModel, typeofModel, relations, relationModels) {
  relations.forEach((relation) => {
    const relationModel = relationModels.find(
      (relationModel2) => relationModel2[relation.columnName]
    );
    if (!relationModel) {
      return;
    }
    const relatedModels = relationModel[relation.columnName];
    const foreignKey = convertCase(
      relation.foreignKey,
      typeofModel.modelCaseConvention
    );
    const primaryKey = convertCase(
      typeofModel.primaryKey,
      typeofModel.modelCaseConvention
    );
    switch (relation.type) {
      case "belongsTo" /* belongsTo */:
        const relatedModelMap = /* @__PURE__ */ new Map();
        const casedPrimaryKey = convertCase(
          primaryKey,
          typeofModel.databaseCaseConvention
        );
        relatedModels.forEach((model) => {
          relatedModelMap.set(model[casedPrimaryKey], model);
        });
        const retrievedRelatedModel = relatedModelMap.get(
          serializedModel[foreignKey]
        );
        if (!retrievedRelatedModel) {
          serializedModel[relation.columnName] = null;
          return;
        }
        serializedModel[relation.columnName] = serializeModel(
          retrievedRelatedModel,
          relation.model
        );
        break;
      case "hasOne" /* hasOne */:
        const relatedModelMapHasOne = /* @__PURE__ */ new Map();
        const casedForeignKey = convertCase(
          foreignKey,
          typeofModel.databaseCaseConvention
        );
        relatedModels.forEach((model) => {
          relatedModelMapHasOne.set(
            model[casedForeignKey],
            model
          );
        });
        const retrievedRelatedModelHasOne = relatedModelMapHasOne.get(
          serializedModel[primaryKey]
        );
        if (!retrievedRelatedModelHasOne) {
          serializedModel[relation.columnName] = null;
          return;
        }
        serializedModel[relation.columnName] = serializeModel(
          retrievedRelatedModelHasOne,
          relation.model
        );
        break;
      case "hasMany" /* hasMany */:
        const retrievedRelatedModels = relatedModels.filter(
          (item) => (
            // Since it's still raw data and it's not yet been converted to camel case (it will soon in the serializeModel call)m it's matched with the camel case key
            item[convertCase(
              foreignKey,
              typeofModel.databaseCaseConvention
            )] === serializedModel[primaryKey]
          )
        );
        serializedModel[relation.columnName] = retrievedRelatedModels.map(
          (model) => serializeModel(model, relation.model)
        );
        break;
      case "manyToMany" /* manyToMany */:
        const relatedModelMapManyToMany = /* @__PURE__ */ new Map();
        relatedModels.forEach((model) => {
          relatedModelMapManyToMany.set(
            model[primaryKey],
            model
          );
        });
        const currentModelId = serializedModel[primaryKey];
        const relatedModel = relatedModelMapManyToMany.get(currentModelId);
        if (!relatedModel) {
          serializedModel[relation.columnName] = [];
          return;
        }
        let relatedColumnValue = relatedModel[relation.columnName];
        if (!relatedColumnValue) {
          relatedColumnValue = [];
        }
        if (!Array.isArray(relatedColumnValue)) {
          relatedColumnValue = [relatedColumnValue];
        }
        serializedModel[relation.columnName] = relatedColumnValue.map(
          (relatedItem) => serializeModel(relatedItem, relation.model)
        );
        break;
      default:
        throw new Error("Relation type not supported");
    }
  });
}
function convertToModelCaseConvention(originalValue, typeofModel) {
  return Object.keys(originalValue).reduce(
    (acc, objKey) => {
      acc[convertCase(objKey, typeofModel.modelCaseConvention)] = originalValue[objKey];
      return acc;
    },
    {}
  );
}
async function addDynamicColumnsToModel(typeofModel, model, dynamicColumnsToAdd) {
  const dynamicColumns = getDynamicColumns(typeofModel);
  if (!dynamicColumns || !dynamicColumns.length) {
    return;
  }
  const dynamicColumnMap = /* @__PURE__ */ new Map();
  for (const dynamicColumn2 of dynamicColumns) {
    dynamicColumnMap.set(dynamicColumn2.functionName, {
      columnName: dynamicColumn2.columnName,
      dynamicColumnFn: dynamicColumn2.dynamicColumnFn
    });
  }
  const promises = dynamicColumnsToAdd.map(async (dynamicColumn2) => {
    const dynamic = dynamicColumnMap.get(dynamicColumn2);
    const casedKey = convertCase(
      dynamic?.columnName,
      typeofModel.modelCaseConvention
    );
    Object.assign(model, { [casedKey]: await dynamic?.dynamicColumnFn() });
  });
  await Promise.all(promises);
}

// src/entity.ts
init_cjs_shims();
var Entity = class {
  constructor() {
    this.$additionalColumns = {};
  }
};
/**
 * @description Defines the case convention for the model
 * @type {CaseConvention}
 */
Entity.modelCaseConvention = "camel";
/**
 * @description Defines the case convention for the database, this should be the case convention you use in your database
 * @type {CaseConvention}
 */
Entity.databaseCaseConvention = "snake";

// src/utils/date_utils.ts
init_cjs_shims();
function baseSoftDeleteDate(date) {
  const pad = (n) => n.toString().padStart(2, "0");
  const year = date.getUTCFullYear();
  const month = pad(date.getUTCMonth() + 1);
  const day = pad(date.getUTCDate());
  const hours = pad(date.getUTCHours());
  const minutes = pad(date.getUTCMinutes());
  const seconds = pad(date.getUTCSeconds());
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// src/sql/models/model.ts
function getBaseTableName(target) {
  const className = target.name;
  return className.endsWith("s") ? convertCase(className, "snake") : convertCase(className, "snake") + "s";
}
function getBaseModelInstance() {
  return { $additionalColumns: {} };
}
var tableMap = /* @__PURE__ */ new Map();
var primaryKeyMap = /* @__PURE__ */ new Map();
var Model = class extends Entity {
  /**
   * @description Static getter for table;
   * @internal
   */
  static get table() {
    if (!tableMap.has(this)) {
      tableMap.set(this, this.tableName || getBaseTableName(this));
    }
    return tableMap.get(this);
  }
  /**
   * @description Getter for the primary key of the model
   */
  static get primaryKey() {
    if (!primaryKeyMap.has(this)) {
      primaryKeyMap.set(this, getPrimaryKey(this));
    }
    return primaryKeyMap.get(this);
  }
  /**
   * @description Constructor for the model, it's not meant to be used directly, it just initializes the $additionalColumns, it's advised to only use the static methods to interact with the database to save the model
   * @description Using the constructor could lead to unexpected behavior, if you want to create a new record use the insert method
   * @deprecated
   */
  constructor() {
    super();
  }
  /**
   * @description Returns all the records for the given model
   */
  static async all(options = {}) {
    const typeofModel = this;
    const modelManager = typeofModel.dispatchModelManager(options);
    return await modelManager.find();
  }
  /**
   * @description Gives a query sqlInstance for the given model
   */
  static query(options = {}) {
    const typeofModel = this;
    const modelManager = typeofModel.dispatchModelManager(options);
    return modelManager.query();
  }
  /**
   * @description Finds the first record in the database
   * @deprecated Used only for debugging purposes, use findOne or query instead
   */
  static async first(options = {}) {
    const typeofModel = this;
    const modelManager = typeofModel.dispatchModelManager(options);
    return modelManager.query().one(options);
  }
  /**
   * @description Finds records for the given model
   */
  static async find(findOptions, options = {}) {
    const typeofModel = this;
    const modelManager = typeofModel.dispatchModelManager(options);
    return modelManager.find(findOptions);
  }
  /**
   * @description Finds a record for the given model or throws an error if it doesn't exist
   */
  static async findOneOrFail(findOneOptions, options = {}) {
    const typeofModel = this;
    const modelManager = typeofModel.dispatchModelManager(options);
    return modelManager.findOneOrFail(findOneOptions);
  }
  /**
   * @description Finds a record for the given model
   */
  static async findOne(findOneOptions, options = {}) {
    const typeofModel = this;
    const modelManager = typeofModel.dispatchModelManager(options);
    return modelManager.findOne(findOneOptions);
  }
  /**
   * @description Finds a record for the given model for the given id, "id" must be set in the model in order for it to work
   */
  static async findOneByPrimaryKey(value2, options = {}) {
    const typeofModel = this;
    const modelManager = typeofModel.dispatchModelManager(options);
    return modelManager.findOneByPrimaryKey(value2);
  }
  /**
   * @description Refreshes a model from the database, the model must have a primary key defined
   */
  static async refresh(model, options = {}) {
    const typeofModel = this;
    const modelManager = typeofModel.dispatchModelManager(options);
    const primaryKey = typeofModel.primaryKey;
    const primaryKeyValue = model[primaryKey];
    const refreshedModel = await modelManager.findOneByPrimaryKey(
      primaryKeyValue
    );
    if (!refreshedModel) {
      return null;
    }
    refreshedModel.$additionalColumns = model.$additionalColumns;
    return refreshedModel;
  }
  /**
   * @description Saves a new record to the database
   * @description $additionalColumns will be ignored if set in the modelData and won't be returned in the response
   */
  static async insert(modelData, options = {}) {
    const typeofModel = this;
    const modelManager = typeofModel.dispatchModelManager(options);
    return modelManager.insert(modelData);
  }
  /**
   * @description Saves multiple records to the database
   */
  static async insertMany(modelsData, options = {}) {
    const typeofModel = this;
    const modelManager = typeofModel.dispatchModelManager(options);
    return modelManager.insertMany(modelsData);
  }
  /**
   * @description Updates a record to the database
   */
  static async updateRecord(modelSqlInstance, options = {}) {
    const typeofModel = this;
    const modelManager = typeofModel.dispatchModelManager(options);
    const updatedModel = await modelManager.updateRecord(modelSqlInstance);
    if (!updatedModel) {
      return null;
    }
    updatedModel.$additionalColumns = modelSqlInstance.$additionalColumns;
    return updatedModel;
  }
  /**
   * @description Finds the first record or creates a new one if it doesn't exist
   */
  static async firstOrCreate(searchCriteria, createData, options = {}) {
    const typeofModel = this;
    const modelManager = typeofModel.dispatchModelManager(options);
    const doesExist = await modelManager.findOne({
      where: searchCriteria
    });
    if (doesExist) {
      return doesExist;
    }
    return await modelManager.insert(createData);
  }
  /**
   * @description Updates or creates a new record
   */
  static async upsert(searchCriteria, data, options = {
    updateOnConflict: true
  }) {
    const typeofModel = this;
    const modelManager = typeofModel.dispatchModelManager(options);
    const doesExist = await modelManager.findOne({
      where: searchCriteria
    });
    if (doesExist) {
      data[typeofModel.primaryKey] = doesExist[typeofModel.primaryKey];
      if (options.updateOnConflict) {
        return await modelManager.updateRecord(data);
      }
      return doesExist;
    }
    return await modelManager.insert(data);
  }
  /**
   * @description Updates or creates multiple records
   */
  static async upsertMany(searchCriteria, data, options = {
    updateOnConflict: true
  }) {
    const typeofModel = this;
    const modelManager = typeofModel.dispatchModelManager(options);
    if (!data.every(
      (record) => searchCriteria.every((column2) => column2 in record)
    )) {
      throw new Error(
        "Conflict columns are not present in the data, please make sure to include them in the data, " + searchCriteria.join(", ")
      );
    }
    const results = [];
    for (let i = 0; i < data.length; i++) {
      const record = data[i];
      const search = searchCriteria.reduce((acc, column2) => {
        acc[column2] = record[column2];
        return acc;
      }, {});
      const doesExist = await modelManager.findOne({
        where: search
      });
      if (doesExist) {
        record[typeofModel.primaryKey] = doesExist[typeofModel.primaryKey];
        if (options.updateOnConflict) {
          results.push(await modelManager.updateRecord(record));
          continue;
        }
        results.push(doesExist);
        continue;
      }
      results.push(await modelManager.insert(record));
    }
    return results;
  }
  /**
   * @description Deletes a record to the database
   */
  static async deleteRecord(modelSqlInstance, options = {}) {
    const typeofModel = this;
    const modelManager = typeofModel.dispatchModelManager(options);
    return modelManager.deleteRecord(modelSqlInstance);
  }
  /**
   * @description Soft Deletes a record to the database
   */
  static async softDelete(modelSqlInstance, options) {
    const typeofModel = this;
    const {
      column: column2 = "deletedAt",
      value: value2 = baseSoftDeleteDate(/* @__PURE__ */ new Date())
    } = options || {};
    modelSqlInstance[column2] = value2;
    const modelManager = typeofModel.dispatchModelManager({
      trx: options?.trx,
      useConnection: options?.useConnection
    });
    await modelManager.updateRecord(modelSqlInstance);
    if (typeof value2 === "string") {
      modelSqlInstance[column2] = new Date(value2);
    }
    modelSqlInstance[column2] = value2;
    return await parseDatabaseDataIntoModelResponse(
      [modelSqlInstance],
      typeofModel
    );
  }
  /**
   * @description Adds dynamic columns to the model that are not defined in the Table and are defined in the model
   * @description It does not support custom connection or transaction
   */
  static async addDynamicColumns(data, dynamicColumns) {
    const typeofModel = this;
    typeofModel.establishConnection();
    if (Array.isArray(data)) {
      for (const model of data) {
        await addDynamicColumnsToModel(
          typeofModel,
          model,
          dynamicColumns
        );
      }
      return data;
    }
    if (!Array.isArray(data)) {
      await addDynamicColumnsToModel(
        typeofModel,
        data,
        dynamicColumns
      );
      return data;
    }
    for (const model of data.data) {
      await addDynamicColumnsToModel(
        typeofModel,
        model,
        dynamicColumns
      );
    }
    return data;
  }
  /**
   * @description Merges the provided data with the sqlInstance
   */
  static combineProps(sqlInstance, data) {
    for (const key in data) {
      Object.assign(sqlInstance, { [key]: data[key] });
    }
  }
  /**
   * @description Adds a beforeFetch clause to the model, adding the ability to modify the query before fetching the data
   */
  static beforeFetch(queryBuilder) {
    queryBuilder;
  }
  /**
   * @description Adds a beforeInsert clause to the model, adding the ability to modify the data after fetching the data
   */
  static beforeInsert(data) {
    return data;
  }
  /**
   * @description Adds a beforeUpdate clause to the model, adding the ability to modify the query before updating the data
   */
  static beforeUpdate(queryBuilder) {
    queryBuilder;
  }
  /**
   * @description Adds a beforeDelete clause to the model, adding the ability to modify the query before deleting the data
   */
  static beforeDelete(queryBuilder) {
    queryBuilder;
  }
  /**
   * @description Adds a afterFetch clause to the model, adding the ability to modify the data after fetching the data
   */
  static async afterFetch(data) {
    return data;
  }
  // JS Static methods
  /**
   * @description Defines a column in the model, useful in javascript in order to not have to rely on decorators since are not supported without a transpiler like babel
   * @javascript
   */
  static column(columnName, options = {}) {
    column(options)(this.prototype, columnName);
  }
  /**
   * @description Defines a dynamic column in the model, useful in javascript in order to not have to rely on decorators since are not supported without a transpiler like babel
   * @javascript
   */
  static hasOne(columnName, model, foreignKey) {
    hasOne(model, foreignKey)(this.prototype, columnName);
  }
  /**
   * @description Defines a dynamic column in the model, useful in javascript in order to not have to rely on decorators since are not supported without a transpiler like babel
   * @javascript
   */
  static hasMany(columnName, model, foreignKey) {
    hasMany(model, foreignKey)(this.prototype, columnName);
  }
  /**
   * @description Defines a dynamic column in the model, useful in javascript in order to not have to rely on decorators since are not supported without a transpiler like babel
   * @javascript
   */
  static belongsTo(columnName, model, foreignKey) {
    belongsTo(model, foreignKey)(this.prototype, columnName);
  }
  /**
   * @description Defines a dynamic column in the model, useful in javascript in order to not have to rely on decorators since are not supported without a transpiler like babel
   * @javascript
   */
  static manyToMany(columnName, model, throughModel, foreignKey) {
    manyToMany(model, throughModel, foreignKey)(this.prototype, columnName);
  }
  /**
   * @description Defines a dynamic column in the model, useful in javascript in order to not have to rely on decorators since are not supported without a transpiler like babel
   * @javascript
   */
  static dynamicColumn(columnName, func) {
    dynamicColumn(columnName)(this.prototype, func.name);
  }
  /**
   * @description Establishes a connection to the database instantiated from the SqlDataSource.connect method, this is done automatically when using the static methods
   * @description This method is meant to be used only if you want to establish sql sqlInstance of the model directly
   * @internal
   */
  static establishConnection() {
    const sql = SqlDataSource.getInstance();
    if (!sql) {
      throw new Error(
        "sql sqlInstance not initialized, did you defined it in SqlDataSource.connect static method?"
      );
    }
    this.sqlInstance = sql;
  }
  /**
   * @description Gives the correct model manager with the correct connection based on the options provided
   */
  static dispatchModelManager(options) {
    if (options?.useConnection) {
      return options.useConnection.getModelManager(
        this
      );
    }
    if (options?.trx) {
      return options.trx.sqlDataSource.getModelManager(
        this
      );
    }
    const typeofModel = this;
    typeofModel.establishConnection();
    return typeofModel.sqlInstance.getModelManager(typeofModel);
  }
};

// src/sql/models/model_manager/model_manager.ts
var ModelManager = class {
  /**
   * @param model
   * @param logs
   * @param sqlDataSource Passed if a custom connection is provided
   */
  constructor(model, logs, sqlDataSource) {
    this.logs = logs;
    this.model = model;
    this.throwError = false;
    this.modelInstance = getBaseModelInstance();
    this.sqlDataSource = sqlDataSource;
  }
  /**
   * @description Finds the first record that matches the input or throws an error
   */
  async findOneOrFail(input) {
    const result = await this.findOne(input);
    if (result === null) {
      if (input.customError) {
        throw input.customError;
      }
      throw new Error("ROW_NOT_FOUND");
    }
    return result;
  }
};

// src/sql/models/model_manager/model_manager_utils.ts
init_cjs_shims();

// src/sql/resources/query/DELETE.ts
init_cjs_shims();
var deleteTemplate = (table, dbType) => {
  return {
    delete: (column2, value2) => {
      let baseQuery = `DELETE FROM ${table} WHERE ${column2} = PLACEHOLDER`;
      switch (dbType) {
        case "mariadb":
        case "sqlite":
        case "mysql":
          baseQuery = baseQuery.replace("PLACEHOLDER", "?");
          break;
        case "postgres":
          baseQuery = baseQuery.replace("PLACEHOLDER", "$1");
          break;
        default:
          throw new Error("Unsupported database type");
      }
      return { query: baseQuery, params: [value2] };
    },
    massiveDelete: (whereClause, joinClause = "") => {
      return `DELETE FROM ${table} ${joinClause} ${whereClause}`;
    }
  };
};
var DELETE_default = deleteTemplate;

// src/sql/resources/query/INSERT.ts
init_cjs_shims();
var insertTemplate = (dbType, typeofModel) => {
  const table = typeofModel.table;
  const modelColumns = getModelColumns(typeofModel);
  return {
    insert: (columns, values) => {
      if (columns.includes("$additionalColumns")) {
        const $additionalColumnsIndex = columns.indexOf("$additionalColumns");
        columns.splice(columns.indexOf("$additionalColumns"), 1);
        values.splice($additionalColumnsIndex, 1);
      }
      for (let i = 0; i < values.length; i++) {
        const column2 = columns[i];
        const modelColumn = modelColumns.find(
          (modelColumn2) => modelColumn2.columnName === column2
        );
        if (modelColumn && modelColumn.prepare) {
          values[i] = modelColumn.prepare(values[i]);
        }
      }
      columns = columns.map(
        (column2) => convertCase(column2, typeofModel.databaseCaseConvention)
      );
      let placeholders;
      let params;
      switch (dbType) {
        case "mysql":
        case "mariadb":
          placeholders = columns.map((_, index) => {
            if (isNestedObject(values[index])) {
              return `?`;
            }
            return `?`;
          }).join(", ");
          params = values.map(
            (value2) => isNestedObject(value2) ? JSON.stringify(value2) : value2
          );
          break;
        case "sqlite":
          placeholders = columns.map(() => "?").join(", ");
          params = values;
          break;
        case "postgres":
          placeholders = columns.map((_, index) => {
            if (isNestedObject(values[index])) {
              return `$${index + 1}::jsonb`;
            }
            return `$${index + 1}`;
          }).join(", ");
          params = values.map(
            (value2) => isNestedObject(value2) ? JSON.stringify(value2) : value2
          );
          break;
        default:
          throw new Error("Unsupported database type");
      }
      const query = dbType !== "postgres" ? `INSERT INTO ${table} (${columns.join(", ")})
VALUES (${placeholders});` : `INSERT INTO ${table} (${columns.join(", ")})
VALUES (${placeholders}) RETURNING *;`;
      return { query, params };
    },
    insertMany: (columns, values) => {
      columns = columns.map(
        (column2) => convertCase(column2, typeofModel.databaseCaseConvention)
      );
      let valueSets;
      let params = [];
      for (let i = 0; i < values.length; i++) {
        for (let j = 0; j < values[i].length; j++) {
          const column2 = columns[j];
          const modelColumn = modelColumns.find(
            (modelColumn2) => modelColumn2.columnName === column2
          );
          if (modelColumn && modelColumn.prepare) {
            values[i][j] = modelColumn.prepare(values[i][j]);
          }
        }
      }
      switch (dbType) {
        case "mysql":
        case "mariadb":
          valueSets = values.map((valueSet) => {
            params.push(
              ...valueSet.map(
                (value2) => isNestedObject(value2) ? JSON.stringify(value2) : value2
              )
            );
            return `(${valueSet.map(() => "?").join(", ")})`;
          });
          break;
        case "sqlite":
          valueSets = values.map((valueSet) => {
            params.push(...valueSet);
            return `(${valueSet.map(() => "?").join(", ")})`;
          });
          break;
        case "postgres":
          valueSets = values.map((valueSet, rowIndex) => {
            params.push(
              ...valueSet.map(
                (value2) => isNestedObject(value2) ? JSON.stringify(value2) : value2
              )
            );
            return `(${valueSet.map((value2, colIndex) => {
              if (isNestedObject(value2)) {
                return `$${rowIndex * columns.length + colIndex + 1}::jsonb`;
              }
              return `$${rowIndex * columns.length + colIndex + 1}`;
            }).join(", ")})`;
          });
          break;
        default:
          throw new Error("Unsupported database type");
      }
      const query = dbType !== "postgres" ? `INSERT INTO ${table} (${columns.join(", ")})
VALUES ${valueSets.join(", ")};` : `INSERT INTO ${table} (${columns.join(", ")})
VALUES ${valueSets.join(", ")} RETURNING *;`;
      return { query, params };
    }
  };
};
var INSERT_default = insertTemplate;

// src/sql/resources/query/RELATION.ts
init_cjs_shims();

// src/sql/resources/utils.ts
init_cjs_shims();
function generateManyToManyQuery({
  dbType,
  relationName,
  selectedColumns,
  leftTable,
  leftTablePrimaryColumn,
  rightTablePrimaryColumn,
  pivotLeftTableColumn,
  pivotRightTableColumn,
  rightTable,
  pivotTable,
  whereCondition,
  relatedModelColumns,
  havingQuery,
  limit,
  offset,
  orderBy
}) {
  let jsonAggFunction = "";
  let jsonObjectFunction = "";
  let jsonAlias = "";
  switch (dbType) {
    case "postgres":
      jsonAggFunction = "json_agg";
      jsonObjectFunction = "json_build_object";
      jsonAlias = "t.json_data";
      break;
    case "mysql":
    case "mariadb":
      jsonAggFunction = "JSON_ARRAYAGG";
      jsonObjectFunction = "JSON_OBJECT";
      jsonAlias = "t.json_data";
      break;
    case "sqlite":
      jsonAggFunction = "JSON_GROUP_ARRAY";
      jsonObjectFunction = "JSON_OBJECT";
      jsonAlias = "JSON(t.json_data)";
      break;
    default:
      throw new Error("Unsupported database type");
  }
  const columnsList = selectedColumns.map((col) => {
    if (col.includes("*")) {
      return relatedModelColumns.map((column2) => {
        return `'${column2}', ${rightTable}.${column2}`;
      }).join(",\n            ");
    }
    if (col.toLowerCase().includes("as")) {
      const [column2, alias2] = col.split(" as ");
      return `'${alias2}', ${column2}`;
    }
    if (!col.includes(".")) {
      return `'${col}', ${rightTable}.${col}`;
    }
    const alias = col.split(".").pop();
    return `'${alias}', ${col}`;
  }).join(",\n            ");
  let limitOffsetClause = "";
  if (limit) {
    limitOffsetClause += `LIMIT ${limit}`;
  }
  if (offset) {
    limitOffsetClause += ` OFFSET ${offset}`;
  }
  let query = `
  SELECT
    ${leftTable}.id AS ${leftTablePrimaryColumn},
    '${relationName}' AS relation_name,
    (
      SELECT ${jsonAggFunction}(${jsonAlias})
      FROM (
        SELECT ${jsonObjectFunction}(
          ${columnsList}
        ) AS json_data
        FROM ${rightTable}
        JOIN ${pivotTable} ON ${pivotTable}.${pivotRightTableColumn} = ${rightTable}.${rightTablePrimaryColumn}
        ${dbType === "mariadb" ? `JOIN ${leftTable} ON ${pivotTable}.${pivotLeftTableColumn} = ${leftTable}.${leftTablePrimaryColumn}` : ""}
        WHERE ${pivotTable}.${pivotLeftTableColumn} = ${leftTable}.${leftTablePrimaryColumn}`;
  if (whereCondition) {
    query += ` AND ${whereCondition.replace("WHERE", "")}`;
  }
  if (havingQuery) {
    query += ` HAVING ${havingQuery}`;
  }
  if (orderBy) {
    query += ` ${orderBy}`;
  }
  query += ` ${limitOffsetClause}
      ) t
    ) AS ${relationName}
  FROM ${leftTable};
  `;
  return query.trim();
}
function generateHasManyQuery({
  selectQuery,
  relationName,
  relatedModel,
  foreignKey,
  typeofModel,
  primaryKeyValues,
  joinQuery,
  whereQuery,
  groupByQuery,
  havingQuery,
  orderByQuery,
  extractedOffsetValue,
  extractedLimitValue,
  databaseType
}) {
  const foreignKeyConverted = convertCase(
    foreignKey,
    typeofModel.databaseCaseConvention
  );
  const primaryKeyValuesSQL = primaryKeyValues.map(({ value: value2, type }) => convertValueToSQL(value2, type)).join(", ");
  let rowNumberClause;
  if (databaseType === "mysql" || databaseType === "mariadb") {
    rowNumberClause = `ROW_NUMBER() OVER (PARTITION BY ${relatedModel}.${foreignKeyConverted} ORDER BY ${orderByQuery || `${relatedModel}.${foreignKeyConverted}`}) as row_num`;
  } else {
    rowNumberClause = `ROW_NUMBER() OVER (PARTITION BY ${relatedModel}.${foreignKeyConverted} ORDER BY ${orderByQuery || "1"}) as row_num`;
  }
  const hasManyQuery = `
    WITH CTE AS (
      SELECT ${selectQuery}, '${relationName}' as relation_name,
             ${rowNumberClause}
      FROM ${relatedModel}
      ${joinQuery}
      WHERE ${relatedModel}.${foreignKeyConverted} IN (${primaryKeyValuesSQL})
      ${whereQuery} ${groupByQuery} ${havingQuery}
    )
    SELECT * FROM CTE
    WHERE row_num > ${extractedOffsetValue || 0}
    ${extractedLimitValue ? `AND row_num <= (${extractedOffsetValue || 0} + ${extractedLimitValue})` : ""};
  `;
  return hasManyQuery;
}
function convertValueToSQL(value2, type) {
  switch (type) {
    case "string":
      return `'${value2}'`;
    case "number":
    case "boolean":
      return `${value2}`;
    default:
      throw new Error(`Unsupported value type: ${type}`);
  }
}

// src/sql/resources/query/RELATION.ts
function parseValueType(value2) {
  return typeof value2;
}
function parseRelationQuery(relationQuery) {
  const selectQuery = relationQuery.selectedColumns?.join(", ") || "*";
  const joinQuery = relationQuery.joinQuery ? relationQuery.joinQuery : "";
  const orderByQuery = relationQuery.orderByQuery ? `ORDER BY ${relationQuery.orderByQuery}` : "";
  const groupByQuery = relationQuery.groupByQuery ? `GROUP BY ${relationQuery.groupByQuery}` : "";
  const limitQuery = relationQuery.limitQuery ? `LIMIT ${relationQuery.limitQuery}` : "";
  const offsetQuery = relationQuery.offsetQuery ? `OFFSET ${relationQuery.offsetQuery}` : "";
  const havingQuery = relationQuery.havingQuery ? `HAVING ${relationQuery.havingQuery}` : "";
  return {
    selectQuery,
    whereQuery: relationQuery.whereQuery || "",
    joinQuery,
    orderByQuery,
    groupByQuery,
    limitQuery,
    offsetQuery,
    havingQuery
  };
}
function relationTemplates(models, relation, relationName, relationQuery, typeofModel, dbType) {
  const primaryKey = relation.model.primaryKey;
  const foreignKey = relation.foreignKey;
  const relatedModel = relation.relatedModel;
  const {
    selectQuery,
    whereQuery,
    joinQuery,
    orderByQuery,
    groupByQuery,
    limitQuery,
    offsetQuery,
    havingQuery
  } = parseRelationQuery(relationQuery);
  const params = relationQuery.params || [];
  const extractedLimitValue = limitQuery.match(/\d+/)?.[0];
  const extractedOffsetValue = offsetQuery.match(/\d+/)?.[0] || 0;
  const primaryKeyValues = models.map((model) => {
    const value2 = model[convertCase(primaryKey, typeofModel.modelCaseConvention)];
    return { value: value2, type: parseValueType(value2) };
  });
  const foreignKeyValues = models.map((model) => {
    const value2 = model[convertCase(foreignKey, typeofModel.modelCaseConvention)];
    return { value: value2, type: parseValueType(value2) };
  });
  switch (relation.type) {
    case "hasOne" /* hasOne */:
      if (primaryKeyValues.some(({ value: value2 }) => !value2)) {
        logger_default.error(
          `Foreign key values are missing for has one relation: ${relationName} ${foreignKeyValues}`
        );
        throw new Error(
          `Foreign key values are missing for has one relation: ${relationName} ${foreignKeyValues}`
        );
      }
      if (!primaryKey) {
        throw new Error(
          `Related Model ${relatedModel} does not have a primary key`
        );
      }
      if (!foreignKeyValues.length) {
        return {
          query: "",
          params
        };
      }
      const query = `SELECT ${selectQuery}, '${relationName}' as relation_name FROM ${relatedModel}
${joinQuery} WHERE ${relatedModel}.${convertCase(
        foreignKey,
        typeofModel.databaseCaseConvention
      )} IN (${primaryKeyValues.map(({ value: value2, type }) => convertValueToSQL(value2, type)).join(", ")}) ${whereQuery};
      `;
      return {
        query,
        params
      };
    case "belongsTo" /* belongsTo */:
      if (foreignKeyValues.some(({ value: value2 }) => !value2)) {
        logger_default.error(
          `Foreign key values are missing for belongs to relation: ${relationName} ${foreignKeyValues}`
        );
        throw new Error(
          `Foreign key values are missing for belongs to relation: ${relationName} ${foreignKeyValues}`
        );
      }
      if (!primaryKey) {
        throw new Error(
          `Related Model ${relatedModel} does not have a primary key`
        );
      }
      if (!foreignKeyValues.length) {
        return {
          query: "",
          params: []
        };
      }
      const belongsToQuery = `SELECT ${selectQuery}, '${relationName}' as relation_name FROM ${relatedModel}
${joinQuery}  WHERE ${relatedModel}.${primaryKey} IN (${foreignKeyValues.map(({ value: value2, type }) => convertValueToSQL(value2, type)).join(
        ", "
      )}) ${whereQuery} ${groupByQuery} ${havingQuery} ${orderByQuery} ${limitQuery} ${offsetQuery};
`;
      return {
        query: belongsToQuery,
        params
      };
    case "hasMany" /* hasMany */:
      if (primaryKeyValues.some(({ value: value2 }) => !value2)) {
        logger_default.error(
          `Primary key values are missing for has many relation: ${relationName} ${primaryKeyValues}`
        );
        throw new Error(
          `Primary key values are missing for has many relation: ${relationName} ${primaryKeyValues}`
        );
      }
      if (!primaryKeyValues.length) {
        return {
          query: "",
          params: []
        };
      }
      return {
        query: generateHasManyQuery({
          selectQuery,
          relationName,
          relatedModel,
          foreignKey,
          typeofModel,
          primaryKeyValues,
          joinQuery,
          whereQuery,
          groupByQuery,
          havingQuery,
          orderByQuery,
          extractedOffsetValue,
          extractedLimitValue,
          databaseType: dbType
        }),
        params
      };
    case "manyToMany" /* manyToMany */:
      if (primaryKeyValues.some(({ value: value2 }) => !value2)) {
        logger_default.error(
          `Primary key values are missing for many to many relation: ${relationName} ${primaryKeyValues}`
        );
        throw new Error(
          `Primary key values are missing for many to many relation: ${relationName} ${primaryKeyValues}`
        );
      }
      if (!primaryKeyValues.length) {
        return {
          query: "",
          params: []
        };
      }
      const throughModel = relation.throughModel;
      const throughModelPrimaryKey = relation.foreignKey;
      const relatedModelTable = relation.relatedModel;
      const relatedModelPrimaryKey = relation.model.primaryKey;
      const relatedModeRelations = getRelations(relation.model);
      const relatedModelManyToManyRelation = relatedModeRelations.find(
        (relation2) => relation2.type === "manyToMany" /* manyToMany */ && relation2.throughModel === throughModel
      );
      if (!relatedModelManyToManyRelation || !relatedModelManyToManyRelation.foreignKey) {
        throw new Error(
          `Many to many relation not found for related model ${relatedModel} and through model ${throughModel}, the error is likely in the relation definition and was called by relation ${relationName} in model ${typeofModel.tableName}`
        );
      }
      const relatedModelForeignKey = relatedModelManyToManyRelation.foreignKey;
      const relatedModelColumns = getModelColumns(relation.model).map(
        (column2) => column2.columnName
      );
      return {
        query: generateManyToManyQuery({
          dbType,
          relationName,
          leftTablePrimaryColumn: convertCase(
            primaryKey,
            typeofModel.databaseCaseConvention
          ),
          rightTablePrimaryColumn: convertCase(
            relatedModelPrimaryKey,
            typeofModel.databaseCaseConvention
          ),
          pivotLeftTableColumn: convertCase(
            throughModelPrimaryKey,
            typeofModel.databaseCaseConvention
          ),
          pivotRightTableColumn: convertCase(
            relatedModelForeignKey,
            typeofModel.databaseCaseConvention
          ),
          selectedColumns: relationQuery.selectedColumns?.length ? relationQuery.selectedColumns : relatedModelColumns.map(
            (column2) => convertCase(column2, typeofModel.databaseCaseConvention)
          ),
          relatedModelColumns: relatedModelColumns.map(
            (column2) => convertCase(column2, typeofModel.databaseCaseConvention)
          ),
          leftTable: typeofModel.tableName,
          rightTable: relatedModelTable,
          pivotTable: throughModel,
          whereCondition: whereQuery,
          orderBy: orderByQuery,
          havingQuery,
          limit: extractedLimitValue ? +extractedLimitValue : void 0,
          offset: +extractedOffsetValue || 0
        }),
        params
      };
    default:
      throw new Error(`Unknown relation type: ${relation.type}`);
  }
}
var RELATION_default = relationTemplates;

// src/sql/resources/query/UPDATE.ts
init_cjs_shims();
var updateTemplate = (dbType, typeofModel) => {
  const table = typeofModel.table;
  const modelColumns = getModelColumns(typeofModel);
  return {
    update: (columns, values, primaryKey, primaryKeyValue) => {
      if (columns.includes("$additionalColumns")) {
        const $additionalColumnsIndex = columns.indexOf("$additionalColumns");
        columns.splice(columns.indexOf("$additionalColumns"), 1);
        values.splice($additionalColumnsIndex, 1);
      }
      for (let i = 0; i < values.length; i++) {
        const column2 = columns[i];
        const modelColumn = modelColumns.find(
          (modelColumn2) => modelColumn2.columnName === column2
        );
        if (modelColumn && modelColumn.prepare) {
          values[i] = modelColumn.prepare(values[i]);
        }
      }
      values = values.map((value2) => {
        if (isNestedObject(value2)) {
          return JSON.stringify(value2);
        }
        return value2;
      });
      columns = columns.map(
        (column2) => convertCase(column2, typeofModel.databaseCaseConvention)
      );
      let setClause;
      let params;
      switch (dbType) {
        case "mysql":
        case "sqlite":
        case "mariadb":
          setClause = columns.map((column2) => `\`${column2}\` = ?`).join(", ");
          params = [...values, primaryKeyValue];
          break;
        case "postgres":
          setClause = columns.map((column2, index) => `"${column2}" = $${index + 1}`).join(", ");
          params = [...values, primaryKeyValue];
          break;
        default:
          throw new Error("Unsupported database type");
      }
      const primaryKeyPlaceholder = dbType === "postgres" ? `$${columns.length + 1}` : "?";
      const query = `UPDATE ${table}
SET ${setClause}
WHERE ${primaryKey} = ${primaryKeyPlaceholder};`;
      return { query, params };
    },
    massiveUpdate: (columns, values, whereClause, joinClause = "") => {
      columns = columns.map(
        (column2) => convertCase(column2, typeofModel.databaseCaseConvention)
      );
      if (columns.includes("$additionalColumns")) {
        const $additionalColumnsIndex = columns.indexOf("$additionalColumns");
        columns.splice(columns.indexOf("$additionalColumns"), 1);
        values.splice($additionalColumnsIndex, 1);
      }
      for (let i = 0; i < values.length; i++) {
        const column2 = columns[i];
        const modelColumn = modelColumns.find(
          (modelColumn2) => modelColumn2.columnName === column2
        );
        if (modelColumn && modelColumn.prepare) {
          values[i] = modelColumn.prepare(values[i]);
        }
      }
      let setClause;
      const params = [];
      switch (dbType) {
        case "mysql":
        case "sqlite":
        case "mariadb":
          setClause = columns.map((column2) => `\`${column2}\` = ?`).join(", ");
          values.forEach((value2) => {
            if (isNestedObject(value2)) {
              params.push(JSON.stringify(value2));
              return;
            }
            params.push(value2 ?? null);
          });
          break;
        case "postgres":
          setClause = columns.map((column2, index) => `"${column2}" = $${index + 1}`).join(", ");
          values.forEach((value2) => {
            if (isNestedObject(value2)) {
              params.push(JSON.stringify(value2));
              return;
            }
            params.push(value2 ?? null);
          });
          break;
        default:
          throw new Error("Unsupported database type");
      }
      const query = `UPDATE ${table} ${joinClause}
SET ${setClause} ${whereClause}`;
      return { query, params };
    }
  };
};
var UPDATE_default = updateTemplate;

// src/sql/models/model_manager/model_manager_utils.ts
var SqlModelManagerUtils = class {
  constructor(dbType, sqlConnection) {
    this.dbType = dbType;
    this.sqlConnection = sqlConnection;
  }
  parseInsert(model, typeofModel, dbType) {
    const filteredModel = this.filterRelationsAndMetadata(model);
    const keys = Object.keys(filteredModel);
    const values = Object.values(filteredModel);
    const insert = INSERT_default(dbType, typeofModel);
    return insert.insert(keys, values);
  }
  parseMassiveInsert(models, typeofModel, dbType) {
    const filteredModels = models.map(
      (m) => this.filterRelationsAndMetadata(m)
    );
    const insert = INSERT_default(dbType, typeofModel);
    const keys = Object.keys(filteredModels[0]);
    const values = filteredModels.map((model) => Object.values(model));
    return insert.insertMany(keys, values);
  }
  parseUpdate(model, typeofModel, dbType) {
    const update = UPDATE_default(dbType, typeofModel);
    const filteredModel = this.filterRelationsAndMetadata(model);
    const keys = Object.keys(filteredModel);
    const values = Object.values(filteredModel);
    const primaryKeyValue = filteredModel[typeofModel.primaryKey];
    return update.update(
      keys,
      values,
      typeofModel.primaryKey,
      primaryKeyValue
    );
  }
  filterRelationsAndMetadata(model) {
    const filteredModel = {};
    const keys = Object.keys(model);
    const isRelation = (value2) => value2 instanceof Relation;
    for (const key of keys) {
      if (isRelation(model[key])) {
        continue;
      }
      Object.assign(filteredModel, { [key]: model[key] });
    }
    return filteredModel;
  }
  parseDelete(table, column2, value2) {
    return DELETE_default(table, this.dbType).delete(column2, value2);
  }
  getRelationFromModel(relationField, typeofModel) {
    const relations = getRelations(typeofModel);
    const relation = relations.find(
      (relation2) => relation2.columnName === relationField
    );
    if (!relation) {
      throw new Error(
        `Relation ${relationField} not found in model ${typeofModel}`
      );
    }
    return relation;
  }
  async parseQueryBuilderRelations(models, typeofModel, input, dbType, logs) {
    if (!input.length) {
      return [];
    }
    if (!typeofModel.primaryKey) {
      throw new Error(`Model ${typeofModel} does not have a primary key`);
    }
    const resultMap = {};
    for (const inputRelation of input) {
      const relation = this.getRelationFromModel(
        inputRelation.relation,
        typeofModel
      );
      const { query, params } = RELATION_default(
        models,
        relation,
        inputRelation.relation,
        inputRelation,
        typeofModel,
        dbType
      );
      if (!query) {
        resultMap[inputRelation.relation] = [];
        continue;
      }
      log(query, logs, params);
      let result = await this.getQueryResult(query, params);
      if (!result) {
        result = [];
      } else if (!Array.isArray(result)) {
        result = [result];
      }
      for (const row of result) {
        if (inputRelation.dynamicColumns?.length) {
          await relation.model.addDynamicColumns(
            row[row["relation_name"]],
            inputRelation.dynamicColumns
          );
        }
      }
      if (!inputRelation.ignoreAfterFetchHook) {
        result = await relation.model.afterFetch(result);
      }
      result.forEach((row) => {
        const relationName = row.relation_name;
        delete row.relation_name;
        if (!resultMap[relationName]) {
          resultMap[relationName] = [];
        }
        resultMap[relationName].push(row);
      });
    }
    const resultArray = input.map(
      (inputRelation) => {
        const modelsForRelation = resultMap[inputRelation.relation] || [];
        modelsForRelation.forEach((model) => {
          if (typeof model[inputRelation.relation] === "string") {
            model[inputRelation.relation] = JSON.parse(
              model[inputRelation.relation]
            );
          }
        });
        return {
          [inputRelation.relation]: modelsForRelation
        };
      }
    );
    return resultArray;
  }
  async getQueryResult(query, params = []) {
    switch (this.dbType) {
      case "mysql":
      case "mariadb":
        const resultMysql = await this.sqlConnection.query(query, params);
        return resultMysql[0];
      case "postgres":
        const resultPg = await this.sqlConnection.query(
          query,
          params
        );
        return resultPg.rows;
      case "sqlite":
        return await new Promise((resolve, reject) => {
          this.sqlConnection.all(
            query,
            params,
            (err, result) => {
              if (err) {
                reject(err);
              }
              resolve(result);
            }
          );
        });
      default:
        throw new Error(`Unsupported data source type: ${this.dbType}`);
    }
  }
};

// src/sql/mysql/mysql_query_builder.ts
init_cjs_shims();

// src/sql/pagination.ts
init_cjs_shims();
function getPaginationMetadata(page, limit, total) {
  return {
    total,
    perPage: limit,
    currentPage: page,
    firstPage: 1,
    isEmpty: total === 0,
    lastPage: Math.max(1, Math.ceil(total / limit)),
    hasMorePages: page < Math.max(1, Math.ceil(total / limit)),
    hasPages: total > limit
  };
}

// src/sql/query_builder/query_builder.ts
init_cjs_shims();

// src/sql/resources/query/SELECT.ts
init_cjs_shims();
var baseSelectMethods = [
  "*",
  "COUNT",
  "DISTINCT",
  "CONCAT",
  "GROUP_CONCAT",
  "AVG",
  "MAX",
  "MIN",
  "SUM",
  "AS",
  "CONVERT",
  "CAST",
  "CONVERT_TZ",
  "DATE_FORMAT",
  "CURDATE",
  "CURRENT_DATE",
  "CURRENT_TIME",
  "CURRENT_TIMESTAMP",
  "CURTIME",
  "DAYNAME",
  "DAYOFMONTH",
  "DAYOFWEEK",
  "DAYOFYEAR",
  "EXTRACT",
  "HOUR",
  "LOCALTIME",
  "LOCALTIMESTAMP",
  "MICROSECOND",
  "MINUTE",
  "MONTH",
  "QUARTER",
  "SECOND",
  "STR_TO_DATE",
  "TIME",
  "TIMESTAMP",
  "WEEK",
  "YEAR",
  "NOW",
  "UTC_DATE",
  "UTC_TIME",
  "UTC_TIMESTAMP",
  "DATE_ADD",
  "DATE_SUB",
  "DATE",
  "DATEDIFF",
  "DATE_FORMAT",
  "DISTINCTROW"
];
var selectTemplate = (dbType, typeofModel) => {
  const table = typeofModel.table;
  const escapeIdentifier = (identifier) => {
    switch (dbType) {
      case "mysql":
      case "sqlite":
      case "mariadb":
        return `\`${identifier.replace(/`/g, "``")}\``;
      case "postgres":
        return `"${identifier.replace(/"/g, '""')}"`;
      default:
        throw new Error("Unsupported database type");
    }
  };
  return {
    selectAll: `SELECT * FROM ${table} `,
    selectById: (id) => `SELECT * FROM ${table} WHERE id = ${id}`,
    selectByIds: (ids) => {
      ids = ids.map((id) => escapeIdentifier(id));
      return `SELECT * FROM ${table} WHERE id IN (${ids.join(", ")})`;
    },
    selectColumns: (...columns) => {
      columns = columns.map((column2) => {
        const columnCase = typeofModel.databaseCaseConvention;
        let tableName = "";
        let columnName = column2;
        let alias = "";
        if (column2.toUpperCase().includes(" AS ")) {
          [columnName, alias] = column2.split(/ AS /i);
        }
        alias = convertCase(alias, columnCase);
        if (columnName.includes(".")) {
          [tableName, columnName] = columnName.split(".");
        }
        if (baseSelectMethods.includes(columnName.toUpperCase()) || columnName.includes("(")) {
          return alias ? `${columnName} AS ${alias}` : columnName;
        }
        let finalColumn = columnName;
        if (!alias) {
          const processedColumnName = escapeIdentifier(
            convertCase(columnName, columnCase)
          );
          finalColumn = tableName ? `${tableName}.${processedColumnName}` : processedColumnName;
        } else if (tableName) {
          finalColumn = `${tableName}.${columnName}`;
        }
        return alias ? `${finalColumn} AS ${alias}` : finalColumn;
      });
      return `SELECT ${columns.join(", ")} FROM ${table} `;
    },
    distinct: `DISTINCT`,
    distinctOn: (...columns) => {
      if (dbType !== "postgres") {
        throw new Error("DISTINCT ON is only supported in postgres");
      }
      columns = columns.map(
        (column2) => escapeIdentifier(
          convertCase(column2, typeofModel.databaseCaseConvention)
        )
      );
      return `DISTINCT ON (${columns.join(", ")})`;
    },
    selectCount: `SELECT COUNT(*) FROM ${table} `,
    selectDistinct: (...columns) => {
      columns = columns.map(
        (column2) => escapeIdentifier(
          convertCase(column2, typeofModel.databaseCaseConvention)
        )
      );
      return `SELECT DISTINCT ${columns.join(", ")} FROM ${table} `;
    },
    selectSum: (column2) => `SELECT SUM(${escapeIdentifier(
      convertCase(column2, typeofModel.databaseCaseConvention)
    )}) FROM ${table} `,
    _orderBy: (columns, order = "ASC") => {
      columns = columns.map((column2) => {
        let tableName = "";
        let columnName = column2;
        if (column2.includes(".")) {
          [tableName, columnName] = column2.split(".");
        }
        const processedColumnName = convertCase(
          columnName,
          typeofModel.databaseCaseConvention
        );
        return tableName ? `${tableName}.${processedColumnName}` : processedColumnName;
      });
      return ` ORDER BY ${columns.join(", ")} ${order}`;
    },
    groupBy: (...columns) => {
      columns = columns.map((column2) => {
        let tableName = "";
        let columnName = column2;
        if (column2.includes(".")) {
          [tableName, columnName] = column2.split(".");
        }
        const processedColumnName = convertCase(
          columnName,
          typeofModel.databaseCaseConvention
        );
        return tableName ? `${tableName}.${processedColumnName}` : processedColumnName;
      });
      return ` GROUP BY ${columns.join(", ")}`;
    },
    limit: (limit) => {
      return ` LIMIT ${limit}`;
    },
    offset: (offset) => {
      return ` OFFSET ${offset}`;
    }
  };
};
var SELECT_default = selectTemplate;

// src/sql/query_builder/where_query_builder.ts
init_cjs_shims();

// src/sql/resources/query/WHERE.ts
init_cjs_shims();
var whereTemplate = (dbType, typeofModel) => {
  return {
    convertPlaceHolderToValue: (query, startIndex = 1) => {
      switch (dbType) {
        case "mysql":
        case "sqlite":
        case "mariadb":
          return query.replace(/PLACEHOLDER/g, () => "?");
        case "postgres":
          let index = startIndex;
          return query.replace(/PLACEHOLDER/g, () => `$${index++}`);
        default:
          throw new Error("Unsupported database type");
      }
    },
    where: (column2, value2, operator = "=") => {
      let query = `
WHERE ${convertCase(
        column2,
        typeofModel.databaseCaseConvention
      )} ${operator} PLACEHOLDER`;
      let params = [value2];
      if (typeof value2 === "object" && value2 !== null) {
        switch (dbType) {
          case "mariadb":
          case "mysql":
          case "sqlite":
            query = `
WHERE JSON_UNQUOTE(JSON_EXTRACT(${column2}, '$')) ${operator} PLACEHOLDER`;
            params = [value2];
            break;
          case "postgres":
            query = `
WHERE ${column2}::jsonb ${operator} PLACEHOLDER::jsonb`;
            break;
          default:
            throw new Error(`Unsupported database type: ${dbType}`);
        }
      }
      return {
        query,
        params
      };
    },
    andWhere: (column2, value2, operator = "=") => {
      let query = ` AND ${convertCase(
        column2,
        typeofModel.databaseCaseConvention
      )} ${operator} PLACEHOLDER`;
      let params = [value2];
      if (typeof value2 === "object" && value2 !== null) {
        switch (dbType) {
          case "mariadb":
          case "mysql":
          case "sqlite":
            query = ` AND JSON_UNQUOTE(JSON_EXTRACT(${column2}, '$')) ${operator} PLACEHOLDER`;
            break;
          case "postgres":
            query = ` AND ${column2}::jsonb ${operator} PLACEHOLDER::jsonb`;
            break;
          default:
            throw new Error(`Unsupported database type: ${dbType}`);
        }
      }
      return {
        query,
        params
      };
    },
    orWhere: (column2, value2, operator = "=") => {
      let query = ` OR ${convertCase(
        column2,
        typeofModel.databaseCaseConvention
      )} ${operator} PLACEHOLDER`;
      let params = [value2];
      if (typeof value2 === "object" && value2 !== null) {
        switch (dbType) {
          case "mariadb":
          case "mysql":
          case "sqlite":
            query = ` OR JSON_UNQUOTE(JSON_EXTRACT(${column2}, '$')) ${operator} PLACEHOLDER`;
            break;
          case "postgres":
            query = ` OR ${column2}::jsonb ${operator} PLACEHOLDER::jsonb`;
            break;
          default:
            throw new Error(`Unsupported database type: ${dbType}`);
        }
      }
      return {
        query,
        params
      };
    },
    whereNot: (column2, value2) => {
      let query = `
WHERE ${convertCase(
        column2,
        typeofModel.databaseCaseConvention
      )} != PLACEHOLDER`;
      let params = [value2];
      if (typeof value2 === "object" && value2 !== null) {
        switch (dbType) {
          case "mariadb":
          case "mysql":
          case "sqlite":
            query = `
WHERE JSON_UNQUOTE(JSON_EXTRACT(${column2}, '$')) != PLACEHOLDER`;
            break;
          case "postgres":
            query = `
WHERE ${column2}::jsonb != PLACEHOLDER::jsonb`;
            break;
          default:
            throw new Error(`Unsupported database type: ${dbType}`);
        }
      }
      return {
        query,
        params
      };
    },
    andWhereNot: (column2, value2) => {
      let query = ` AND ${convertCase(
        column2,
        typeofModel.databaseCaseConvention
      )} != PLACEHOLDER`;
      let params = [value2];
      if (typeof value2 === "object" && value2 !== null) {
        switch (dbType) {
          case "mariadb":
          case "mysql":
          case "sqlite":
            query = ` AND JSON_UNQUOTE(JSON_EXTRACT(${column2}, '$')) != PLACEHOLDER`;
            break;
          case "postgres":
            query = ` AND ${column2}::jsonb != PLACEHOLDER::jsonb`;
            break;
          default:
            throw new Error(`Unsupported database type: ${dbType}`);
        }
      }
      return {
        query,
        params
      };
    },
    orWhereNot: (column2, value2) => {
      let query = ` OR ${convertCase(
        column2,
        typeofModel.databaseCaseConvention
      )} != PLACEHOLDER`;
      let params = [value2];
      if (typeof value2 === "object" && value2 !== null) {
        switch (dbType) {
          case "mariadb":
          case "mysql":
          case "sqlite":
            query = ` OR JSON_UNQUOTE(JSON_EXTRACT(${column2}, '$')) != PLACEHOLDER`;
            break;
          case "postgres":
            query = ` OR ${column2}::jsonb != PLACEHOLDER::jsonb`;
            break;
          default:
            throw new Error(`Unsupported database type: ${dbType}`);
        }
      }
      return {
        query,
        params
      };
    },
    whereBetween: (column2, min, max) => {
      let query = `
WHERE ${convertCase(
        column2,
        typeofModel.databaseCaseConvention
      )} BETWEEN PLACEHOLDER AND PLACEHOLDER`;
      let params = [min, max];
      if (typeof min === "object" && min !== null) {
        switch (dbType) {
          case "mariadb":
          case "mysql":
          case "sqlite":
            query = `
WHERE JSON_UNQUOTE(JSON_EXTRACT(${column2}, '$')) BETWEEN PLACEHOLDER AND PLACEHOLDER`;
            break;
          case "postgres":
            query = `
WHERE ${column2}::jsonb BETWEEN PLACEHOLDER::jsonb AND PLACEHOLDER::jsonb`;
            break;
          default:
            throw new Error(`Unsupported database type: ${dbType}`);
        }
      }
      return {
        query,
        params
      };
    },
    andWhereBetween: (column2, min, max) => {
      let query = ` AND ${convertCase(
        column2,
        typeofModel.databaseCaseConvention
      )} BETWEEN PLACEHOLDER AND PLACEHOLDER`;
      let params = [min, max];
      if (typeof min === "object" && min !== null) {
        switch (dbType) {
          case "mariadb":
          case "mysql":
          case "sqlite":
            query = ` AND JSON_UNQUOTE(JSON_EXTRACT(${column2}, '$')) BETWEEN PLACEHOLDER AND PLACEHOLDER`;
            break;
          case "postgres":
            query = ` AND ${column2}::jsonb BETWEEN PLACEHOLDER::jsonb AND PLACEHOLDER::jsonb`;
            break;
          default:
            throw new Error(`Unsupported database type: ${dbType}`);
        }
      }
      return {
        query,
        params
      };
    },
    orWhereBetween: (column2, min, max) => {
      let query = ` OR ${convertCase(
        column2,
        typeofModel.databaseCaseConvention
      )} BETWEEN PLACEHOLDER AND PLACEHOLDER`;
      let params = [min, max];
      if (typeof min === "object" && min !== null) {
        switch (dbType) {
          case "mariadb":
          case "mysql":
          case "sqlite":
            query = ` OR JSON_UNQUOTE(JSON_EXTRACT(${column2}, '$')) BETWEEN PLACEHOLDER AND PLACEHOLDER`;
            break;
          case "postgres":
            query = ` OR ${column2}::jsonb BETWEEN PLACEHOLDER::jsonb AND PLACEHOLDER::jsonb`;
            break;
          default:
            throw new Error(`Unsupported database type: ${dbType}`);
        }
      }
      return {
        query,
        params
      };
    },
    whereNotBetween: (column2, min, max) => {
      let query = `
WHERE ${convertCase(
        column2,
        typeofModel.databaseCaseConvention
      )} NOT BETWEEN PLACEHOLDER AND PLACEHOLDER`;
      let params = [min, max];
      if (typeof min === "object" && min !== null) {
        switch (dbType) {
          case "mariadb":
          case "mysql":
          case "sqlite":
            query = `
WHERE JSON_UNQUOTE(JSON_EXTRACT(${column2}, '$')) NOT BETWEEN PLACEHOLDER AND PLACEHOLDER`;
            break;
          case "postgres":
            query = `
WHERE ${column2}::jsonb NOT BETWEEN PLACEHOLDER::jsonb AND PLACEHOLDER::jsonb`;
            break;
          default:
            throw new Error(`Unsupported database type: ${dbType}`);
        }
      }
      return {
        query,
        params
      };
    },
    andWhereNotBetween: (column2, min, max) => {
      let query = ` AND ${convertCase(
        column2,
        typeofModel.databaseCaseConvention
      )} NOT BETWEEN PLACEHOLDER AND PLACEHOLDER`;
      let params = [min, max];
      if (typeof min === "object" && min !== null) {
        switch (dbType) {
          case "mariadb":
          case "mysql":
          case "sqlite":
            query = ` AND JSON_UNQUOTE(JSON_EXTRACT(${column2}, '$')) NOT BETWEEN PLACEHOLDER AND PLACEHOLDER`;
            break;
          case "postgres":
            query = ` AND ${column2}::jsonb NOT BETWEEN PLACEHOLDER::jsonb AND PLACEHOLDER::jsonb`;
            break;
          default:
            throw new Error(`Unsupported database type: ${dbType}`);
        }
      }
      return {
        query,
        params
      };
    },
    orWhereNotBetween: (column2, min, max) => {
      let query = ` OR ${convertCase(
        column2,
        typeofModel.databaseCaseConvention
      )} NOT BETWEEN PLACEHOLDER AND PLACEHOLDER`;
      let params = [min, max];
      if (typeof min === "object" && min !== null) {
        switch (dbType) {
          case "mariadb":
          case "mysql":
          case "sqlite":
            query = ` OR JSON_UNQUOTE(JSON_EXTRACT(${column2}, '$')) NOT BETWEEN PLACEHOLDER AND PLACEHOLDER`;
            break;
          case "postgres":
            query = ` OR ${column2}::jsonb NOT BETWEEN PLACEHOLDER::jsonb AND PLACEHOLDER::jsonb`;
            break;
          default:
            throw new Error(`Unsupported database type: ${dbType}`);
        }
      }
      return {
        query,
        params
      };
    },
    whereIn: (column2, values) => {
      let query = `
WHERE ${convertCase(
        column2,
        typeofModel.databaseCaseConvention
      )} IN (${values.map((_) => "PLACEHOLDER").join(", ")})`;
      let params = values;
      if (values[0] && typeof values[0] === "object") {
        switch (dbType) {
          case "mariadb":
          case "mysql":
          case "sqlite":
            query = `
WHERE JSON_UNQUOTE(JSON_EXTRACT(${column2}, '$')) IN (${values.map((_) => "PLACEHOLDER").join(", ")})`;
            break;
          case "postgres":
            query = `
WHERE ${convertCase(
              column2,
              typeofModel.databaseCaseConvention
            )}::jsonb IN (${values.map((_) => "PLACEHOLDER").join(", ")})`;
            break;
          default:
            throw new Error(`Unsupported database type: ${dbType}`);
        }
      }
      return {
        query,
        params
      };
    },
    andWhereIn: (column2, values) => {
      let query = ` AND ${convertCase(
        column2,
        typeofModel.databaseCaseConvention
      )} IN (${values.map((_) => "PLACEHOLDER").join(", ")})`;
      let params = values;
      if (values[0] && typeof values[0] === "object") {
        switch (dbType) {
          case "mariadb":
          case "mysql":
          case "sqlite":
            query = ` AND JSON_UNQUOTE(JSON_EXTRACT(${column2}, '$')) IN (${values.map((_) => "PLACEHOLDER").join(", ")})`;
            break;
          case "postgres":
            query = ` AND ${convertCase(
              column2,
              typeofModel.databaseCaseConvention
            )}::jsonb IN (${values.map((_) => "PLACEHOLDER").join(", ")})`;
            break;
          default:
            throw new Error(`Unsupported database type: ${dbType}`);
        }
      }
      return {
        query,
        params
      };
    },
    orWhereIn: (column2, values) => {
      let query = ` OR ${convertCase(
        column2,
        typeofModel.databaseCaseConvention
      )} IN (${values.map((_) => "PLACEHOLDER").join(", ")})`;
      let params = values;
      if (values[0] && typeof values[0] === "object") {
        switch (dbType) {
          case "mariadb":
          case "mysql":
          case "sqlite":
            query = ` OR JSON_UNQUOTE(JSON_EXTRACT(${column2}, '$')) IN (${values.map((_) => "PLACEHOLDER").join(", ")})`;
            break;
          case "postgres":
            query = ` OR ${convertCase(
              column2,
              typeofModel.databaseCaseConvention
            )}::jsonb IN (${values.map((_) => "PLACEHOLDER").join(", ")})`;
            break;
          default:
            throw new Error(`Unsupported database type: ${dbType}`);
        }
      }
      return {
        query,
        params
      };
    },
    whereNotIn: (column2, values) => {
      let query = `
WHERE ${convertCase(
        column2,
        typeofModel.databaseCaseConvention
      )} NOT IN (${values.map((_) => "PLACEHOLDER").join(", ")})`;
      let params = values;
      if (values[0] && typeof values[0] === "object") {
        switch (dbType) {
          case "mariadb":
          case "mysql":
          case "sqlite":
            query = `
WHERE JSON_UNQUOTE(JSON_EXTRACT(${column2}, '$')) NOT IN (${values.map((_) => "PLACEHOLDER").join(", ")})`;
            break;
          case "postgres":
            query = `
WHERE ${convertCase(
              column2,
              typeofModel.databaseCaseConvention
            )}::jsonb NOT IN (${values.map((_) => "PLACEHOLDER").join(", ")})`;
            break;
          default:
            throw new Error(`Unsupported database type: ${dbType}`);
        }
      }
      return {
        query,
        params
      };
    },
    andWhereNotIn: (column2, values) => {
      let query = ` AND ${convertCase(
        column2,
        typeofModel.databaseCaseConvention
      )} NOT IN (${values.map((_) => "PLACEHOLDER").join(", ")})`;
      let params = values;
      if (values[0] && typeof values[0] === "object") {
        switch (dbType) {
          case "mariadb":
          case "mysql":
          case "sqlite":
            query = ` AND JSON_UNQUOTE(JSON_EXTRACT(${column2}, '$')) NOT IN (${values.map((_) => "PLACEHOLDER").join(", ")})`;
            break;
          case "postgres":
            query = ` AND ${convertCase(
              column2,
              typeofModel.databaseCaseConvention
            )}::jsonb NOT IN (${values.map((_) => "PLACEHOLDER").join(", ")})`;
            break;
          default:
            throw new Error(`Unsupported database type: ${dbType}`);
        }
      }
      return {
        query,
        params
      };
    },
    orWhereNotIn: (column2, values) => {
      let query = ` OR ${convertCase(
        column2,
        typeofModel.databaseCaseConvention
      )} NOT IN (${values.map((_) => "PLACEHOLDER").join(", ")})`;
      let params = values;
      if (values[0] && typeof values[0] === "object") {
        switch (dbType) {
          case "mariadb":
          case "mysql":
          case "sqlite":
            query = ` OR JSON_UNQUOTE(JSON_EXTRACT(${column2}, '$')) NOT IN (${values.map((_) => "PLACEHOLDER").join(", ")})`;
            break;
          case "postgres":
            query = ` OR ${convertCase(
              column2,
              typeofModel.databaseCaseConvention
            )}::jsonb NOT IN (${values.map((_) => "PLACEHOLDER").join(", ")})`;
            break;
          default:
            throw new Error(`Unsupported database type: ${dbType}`);
        }
      }
      return {
        query,
        params
      };
    },
    whereNull: (column2) => ({
      query: `
WHERE ${convertCase(
        column2,
        typeofModel.databaseCaseConvention
      )} IS NULL`,
      params: []
    }),
    andWhereNull: (column2) => ({
      query: ` AND ${convertCase(
        column2,
        typeofModel.databaseCaseConvention
      )} IS NULL`,
      params: []
    }),
    orWhereNull: (column2) => ({
      query: ` OR ${convertCase(
        column2,
        typeofModel.databaseCaseConvention
      )} IS NULL`,
      params: []
    }),
    whereNotNull: (column2) => ({
      query: `
WHERE ${convertCase(
        column2,
        typeofModel.databaseCaseConvention
      )} IS NOT NULL`,
      params: []
    }),
    andWhereNotNull: (column2) => ({
      query: ` AND ${convertCase(
        column2,
        typeofModel.databaseCaseConvention
      )} IS NOT NULL`,
      params: []
    }),
    orWhereNotNull: (column2) => ({
      query: ` OR ${convertCase(
        column2,
        typeofModel.databaseCaseConvention
      )} IS NOT NULL`,
      params: []
    }),
    rawWhere: (query, params) => ({
      query: `
WHERE ${query}`,
      params
    }),
    rawAndWhere: (query, params) => ({
      query: ` AND ${query}`,
      params
    }),
    rawOrWhere: (query, params) => ({
      query: ` OR ${query}`,
      params
    }),
    whereRegex: (column2, regex) => {
      switch (dbType) {
        case "postgres":
          return {
            query: `
WHERE ${convertCase(
              column2,
              typeofModel.databaseCaseConvention
            )} ~ PLACEHOLDER`,
            params: [regex.source]
          };
        case "mysql":
        case "mariadb":
          return {
            query: `
WHERE ${convertCase(
              column2,
              typeofModel.databaseCaseConvention
            )} REGEXP PLACEHOLDER`,
            params: [regex.source]
          };
        case "sqlite":
          throw new Error("SQLite does not support REGEXP out of the box");
        default:
          throw new Error(`Unsupported database type: ${dbType}`);
      }
    },
    andWhereRegex: (column2, regex) => {
      switch (dbType) {
        case "postgres":
          return {
            query: ` AND ${convertCase(
              column2,
              typeofModel.databaseCaseConvention
            )} ~ PLACEHOLDER`,
            params: [regex.source]
          };
        case "mysql":
        case "mariadb":
          return {
            query: ` AND ${convertCase(
              column2,
              typeofModel.databaseCaseConvention
            )} REGEXP PLACEHOLDER`,
            params: [regex.source]
          };
        case "sqlite":
          throw new Error("SQLite does not support REGEXP out of the box");
        default:
          throw new Error(`Unsupported database type: ${dbType}`);
      }
    },
    orWhereRegex: (column2, regex) => {
      switch (dbType) {
        case "postgres":
          return {
            query: ` OR ${convertCase(
              column2,
              typeofModel.databaseCaseConvention
            )} ~ PLACEHOLDER`,
            params: [regex.source]
          };
        case "mysql":
        case "mariadb":
          return {
            query: ` OR ${convertCase(
              column2,
              typeofModel.databaseCaseConvention
            )} REGEXP PLACEHOLDER`,
            params: [regex.source]
          };
        case "sqlite":
          throw new Error("SQLite does not support REGEXP out of the box");
        default:
          throw new Error(`Unsupported database type: ${dbType}`);
      }
    }
  };
};
var WHERE_default = whereTemplate;

// src/sql/query_builder/where_query_builder.ts
var WhereQueryBuilder = class {
  /**
   * @description Constructs a query_builder instance.
   */
  constructor(model, table, logs, isNestedCondition = false, sqlDataSource) {
    this.whereQuery = "";
    this.params = [];
    this.isNestedCondition = false;
    this.model = model;
    this.sqlDataSource = sqlDataSource;
    this.logs = logs;
    this.table = table;
    this.whereTemplate = WHERE_default(
      this.sqlDataSource.getDbType(),
      this.model
    );
    this.params = [];
    this.isNestedCondition = isNestedCondition;
  }
  /**
   * @description Accepts a value and executes a callback only of the value is not null or undefined.
   */
  when(value2, cb) {
    if (value2 === void 0 || value2 === null) {
      return this;
    }
    cb(value2, this);
    return this;
  }
  where(column2, operatorOrValue, value2) {
    let operator = "=";
    let actualValue;
    if (typeof operatorOrValue === "string" && value2) {
      operator = operatorOrValue;
      actualValue = value2;
    } else {
      actualValue = operatorOrValue;
      operator = "=";
    }
    if (this.whereQuery || this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.andWhere(
        column2,
        actualValue,
        operator
      );
      this.whereQuery += query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.where(
      column2,
      actualValue,
      operator
    );
    this.whereQuery = query;
    this.params.push(...params);
    return this;
  }
  andWhere(column2, operatorOrValue, value2) {
    let operator = "=";
    let actualValue;
    if (typeof operatorOrValue === "string" && value2) {
      operator = operatorOrValue;
      actualValue = value2;
    } else {
      actualValue = operatorOrValue;
      operator = "=";
    }
    if (!this.whereQuery && !this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.where(
        column2,
        actualValue,
        operator
      );
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.andWhere(
      column2,
      actualValue,
      operator
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  orWhere(column2, operatorOrValue, value2) {
    let operator = "=";
    let actualValue;
    if (typeof operatorOrValue === "string" && value2) {
      operator = operatorOrValue;
      actualValue = value2;
    } else {
      actualValue = operatorOrValue;
      operator = "=";
    }
    if (!this.whereQuery && !this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.where(
        column2,
        actualValue,
        operator
      );
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.orWhere(
      column2,
      actualValue,
      operator
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  whereBetween(column2, min, max) {
    if (!this.whereQuery && !this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.whereBetween(
        column2,
        min,
        max
      );
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.andWhereBetween(
      column2,
      min,
      max
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  andWhereBetween(column2, min, max) {
    if (!this.whereQuery && !this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.whereBetween(
        column2,
        min,
        max
      );
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.andWhereBetween(
      column2,
      min,
      max
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  orWhereBetween(column2, min, max) {
    if (!this.whereQuery && !this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.whereBetween(
        column2,
        min,
        max
      );
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.orWhereBetween(
      column2,
      min,
      max
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  whereNotBetween(column2, min, max) {
    if (!this.whereQuery && !this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.whereNotBetween(
        column2,
        min,
        max
      );
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.andWhereNotBetween(
      column2,
      min,
      max
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  orWhereNotBetween(column2, min, max) {
    if (!this.whereQuery && !this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.whereNotBetween(
        column2,
        min,
        max
      );
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.orWhereNotBetween(
      column2,
      min,
      max
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  whereIn(column2, values) {
    if (!this.whereQuery && !this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.whereIn(
        column2,
        values
      );
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.andWhereIn(
      column2,
      values
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  andWhereIn(column2, values) {
    if (!this.whereQuery && !this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.whereIn(
        column2,
        values
      );
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.andWhereIn(
      column2,
      values
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  orWhereIn(column2, values) {
    if (!this.whereQuery && !this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.whereIn(
        column2,
        values
      );
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.orWhereIn(
      column2,
      values
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  whereNotIn(column2, values) {
    if (!this.whereQuery && !this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.whereNotIn(
        column2,
        values
      );
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.andWhereNotIn(
      column2,
      values
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  orWhereNotIn(column2, values) {
    if (!this.whereQuery && !this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.whereNotIn(
        column2,
        values
      );
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.orWhereNotIn(
      column2,
      values
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  whereNull(column2) {
    if (!this.whereQuery && !this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.whereNull(column2);
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.andWhereNull(column2);
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  andWhereNull(column2) {
    if (!this.whereQuery && !this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.whereNull(column2);
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.andWhereNull(column2);
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  orWhereNull(column2) {
    if (!this.whereQuery && !this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.whereNull(column2);
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.orWhereNull(column2);
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  whereNotNull(column2) {
    if (!this.whereQuery && !this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.whereNotNull(
        column2
      );
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.andWhereNotNull(
      column2
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  andWhereNotNull(column2) {
    if (!this.whereQuery && !this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.whereNotNull(
        column2
      );
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.andWhereNotNull(
      column2
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  orWhereNotNull(column2) {
    if (!this.whereQuery && !this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.whereNotNull(
        column2
      );
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.orWhereNotNull(
      column2
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  whereRegexp(column2, regexp) {
    if (!this.whereQuery && !this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.whereRegex(
        column2,
        regexp
      );
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.andWhereRegex(
      column2,
      regexp
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  andWhereRegexp(column2, regexp) {
    if (!this.whereQuery && !this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.whereRegex(
        column2,
        regexp
      );
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.andWhereRegex(
      column2,
      regexp
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  orWhereRegexp(column2, regexp) {
    if (!this.whereQuery && !this.isNestedCondition) {
      const { query: query2, params: params2 } = this.whereTemplate.whereRegex(
        column2,
        regexp
      );
      this.whereQuery = query2;
      this.params.push(...params2);
      return this;
    }
    const { query, params } = this.whereTemplate.orWhereRegex(
      column2,
      regexp
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }
  /**
   * @description Adds a raw WHERE condition to the query.
   */
  rawWhere(query, queryParams = []) {
    if (!this.whereQuery && !this.isNestedCondition) {
      const { query: rawQuery2, params: params2 } = this.whereTemplate.rawWhere(
        query,
        queryParams
      );
      this.whereQuery = rawQuery2;
      this.params.push(...params2);
      return this;
    }
    const { query: rawQuery, params } = this.whereTemplate.rawAndWhere(
      query,
      queryParams
    );
    this.whereQuery += rawQuery;
    this.params.push(...params);
    return this;
  }
  /**
   * @description Adds a raw AND WHERE condition to the query.
   */
  rawAndWhere(query, queryParams = []) {
    if (!this.whereQuery && !this.isNestedCondition) {
      const { query: rawQuery2, params: params2 } = this.whereTemplate.rawWhere(
        query,
        queryParams
      );
      this.whereQuery = rawQuery2;
      this.params.push(...params2);
      return this;
    }
    const { query: rawQuery, params } = this.whereTemplate.rawAndWhere(
      query,
      queryParams
    );
    this.whereQuery += rawQuery;
    this.params.push(...params);
    return this;
  }
  /**
   * @description Adds a raw OR WHERE condition to the query.
   */
  rawOrWhere(query, queryParams = []) {
    if (!this.whereQuery && !this.isNestedCondition) {
      const { query: rawQuery2, params: params2 } = this.whereTemplate.rawWhere(
        query,
        queryParams
      );
      this.whereQuery = rawQuery2;
      this.params.push(...params2);
      return this;
    }
    const { query: rawQuery, params } = this.whereTemplate.rawOrWhere(
      query,
      queryParams
    );
    this.whereQuery += rawQuery;
    this.params.push(...params);
    return this;
  }
};

// src/sql/query_builder/query_builder.ts
var QueryBuilder = class extends WhereQueryBuilder {
  /**
   * @description Constructs a Mysql_query_builder instance.
   */
  constructor(model, table, logs, sqlDataSource) {
    super(model, table, logs, false, sqlDataSource);
    this.sqlDataSource = sqlDataSource;
    this.selectQuery = SELECT_default(
      this.sqlDataSource.getDbType(),
      this.model
    ).selectAll;
    this.selectTemplate = SELECT_default(
      this.sqlDataSource.getDbType(),
      this.model
    );
    this.joinQuery = "";
    this.whereQuery = "";
    this.modelSelectedColumns = [];
    this.relations = [];
    this.dynamicColumns = [];
    this.groupByQuery = "";
    this.orderByQuery = "";
    this.limitQuery = "";
    this.offsetQuery = "";
    this.havingQuery = "";
  }
  /**
   * @description Executes the query and retrieves the first result.
   * @alias one
   */
  async first(options) {
    return this.one(options);
  }
  /**
   * @description Executes the query and retrieves the first result. Fail if no result is found.
   * @alias oneOrFail
   */
  async firstOrFail(options) {
    return this.oneOrFail(options);
  }
  /**
   * @description Returns the query and the parameters in an object.
   */
  toSql() {
    const query = this.selectQuery + this.joinQuery + this.whereQuery + this.groupByQuery + this.havingQuery + this.orderByQuery + this.limitQuery + this.offsetQuery;
    function parsePlaceHolders(dbType, query2, startIndex = 1) {
      switch (dbType) {
        case "mysql":
        case "sqlite":
        case "mariadb":
          return query2.replace(/PLACEHOLDER/g, () => "?");
        case "postgres":
          let index = startIndex;
          return query2.replace(/PLACEHOLDER/g, () => `$${index++}`);
        default:
          throw new Error(
            "Unsupported database type, did you forget to set the dbType in the function params?"
          );
      }
    }
    const parsedQuery = parsePlaceHolders(
      this.sqlDataSource.getDbType(),
      query
    );
    return { query: parsedQuery, params: this.params };
  }
  groupFooterQuery() {
    return this.groupByQuery + this.havingQuery + this.orderByQuery + this.limitQuery + this.offsetQuery;
  }
  async mergeRawPacketIntoModel(model, row, typeofModel) {
    const columns = getModelColumns(this.model);
    Object.entries(row).forEach(([key, value2]) => {
      const casedKey = convertCase(
        key,
        typeofModel.modelCaseConvention
      );
      if (columns.map((column2) => column2.columnName).includes(casedKey)) {
        Object.assign(model, { [casedKey]: value2 });
        return;
      }
      model.$additionalColumns[key] = value2;
    });
    if (!this.dynamicColumns.length) {
      return;
    }
    await addDynamicColumnsToModel(this.model, model, this.dynamicColumns);
  }
};

// src/sql/resources/query/JOIN.ts
init_cjs_shims();
var joinTemplate = (typeofModel, relatedTable, primaryColumn, foreignColumn) => {
  const table = typeofModel.table;
  const foreignColumnName = foreignColumn.includes(".") ? foreignColumn.split(".").pop() : foreignColumn;
  const primaryColumnName = primaryColumn.includes(".") ? primaryColumn.split(".").pop() : primaryColumn;
  return {
    innerJoin: () => {
      const foreignColumnConverted = convertCase(
        foreignColumnName,
        typeofModel.databaseCaseConvention
      );
      const primaryColumnConverted = convertCase(
        primaryColumnName,
        typeofModel.databaseCaseConvention
      );
      return `
INNER JOIN ${relatedTable} ON ${relatedTable}.${foreignColumnConverted} = ${table}.${primaryColumnConverted} `;
    },
    leftJoin: () => {
      const foreignColumnConverted = convertCase(
        foreignColumnName,
        typeofModel.databaseCaseConvention
      );
      const primaryColumnConverted = convertCase(
        primaryColumnName,
        typeofModel.databaseCaseConvention
      );
      return `
LEFT JOIN ${relatedTable} ON ${relatedTable}.${foreignColumnConverted} = ${table}.${primaryColumnConverted} `;
    }
  };
};
var JOIN_default = joinTemplate;

// src/sql/mysql/mysql_query_builder.ts
var MysqlQueryBuilder = class _MysqlQueryBuilder extends QueryBuilder {
  constructor(type, model, table, mysqlConnection, logs, isNestedCondition = false, sqlDataSource) {
    super(model, table, logs, sqlDataSource);
    this.type = type;
    this.mysqlConnection = mysqlConnection;
    this.updateTemplate = UPDATE_default(sqlDataSource.getDbType(), this.model);
    this.deleteTemplate = DELETE_default(table, sqlDataSource.getDbType());
    this.isNestedCondition = isNestedCondition;
    this.mysqlModelManagerUtils = new SqlModelManagerUtils(
      this.type,
      this.mysqlConnection
    );
  }
  async one(options = {}) {
    if (!options.ignoreHooks?.includes("beforeFetch")) {
      this.model.beforeFetch(this);
    }
    let query = "";
    if (this.joinQuery && !this.selectQuery) {
      this.selectQuery = this.selectTemplate.selectColumns(`${this.table}.*`);
    }
    query = this.selectQuery + this.joinQuery;
    if (this.whereQuery) {
      query += this.whereQuery;
    }
    query = this.whereTemplate.convertPlaceHolderToValue(query);
    this.limit(1);
    query += this.groupFooterQuery();
    query = query.trim();
    log(query, this.logs, this.params);
    const [rows] = await this.mysqlConnection.query(query, this.params);
    if (!rows.length) {
      return null;
    }
    const modelInstance = getBaseModelInstance();
    await this.mergeRawPacketIntoModel(modelInstance, rows[0], this.model);
    const relationModels = await this.mysqlModelManagerUtils.parseQueryBuilderRelations(
      [modelInstance],
      this.model,
      this.relations,
      this.type,
      this.logs
    );
    const model = await parseDatabaseDataIntoModelResponse(
      [modelInstance],
      this.model,
      relationModels,
      this.modelSelectedColumns
    );
    return !options.ignoreHooks?.includes("afterFetch") ? (await this.model.afterFetch([model]))[0] : model;
  }
  async oneOrFail(options) {
    const model = await this.one({
      ignoreHooks: options?.ignoreHooks
    });
    if (!model) {
      if (options?.customError) {
        throw options.customError;
      }
      throw new Error("ROW_NOT_FOUND");
    }
    return model;
  }
  async many(options = {}) {
    if (!options.ignoreHooks?.includes("beforeFetch")) {
      this.model.beforeFetch(this);
    }
    let query = "";
    if (this.joinQuery && !this.selectQuery) {
      this.selectQuery = this.selectTemplate.selectColumns(`${this.table}.*`);
    }
    query = this.selectQuery + this.joinQuery;
    if (this.whereQuery) {
      query += this.whereQuery;
    }
    query += this.groupFooterQuery();
    query = this.whereTemplate.convertPlaceHolderToValue(query);
    query = query.trim();
    log(query, this.logs, this.params);
    const [rows] = await this.mysqlConnection.query(query, this.params);
    const modelPromises = rows.map(async (row) => {
      const modelInstance = getBaseModelInstance();
      await this.mergeRawPacketIntoModel(modelInstance, row, this.model);
      return modelInstance;
    });
    const models = await Promise.all(modelPromises);
    const relationModels = await this.mysqlModelManagerUtils.parseQueryBuilderRelations(
      models,
      this.model,
      this.relations,
      this.type,
      this.logs
    );
    const serializedModels = await parseDatabaseDataIntoModelResponse(
      models,
      this.model,
      relationModels,
      this.modelSelectedColumns
    );
    if (!serializedModels) {
      return [];
    }
    if (!options.ignoreHooks?.includes("afterFetch")) {
      await this.model.afterFetch(
        Array.isArray(serializedModels) ? serializedModels : [serializedModels]
      );
    }
    return Array.isArray(serializedModels) ? serializedModels : [serializedModels];
  }
  async softDelete(options) {
    const {
      column: column2 = "deletedAt",
      value: value2 = (/* @__PURE__ */ new Date()).toISOString().slice(0, 19).replace("T", " "),
      ignoreBeforeDeleteHook = false
    } = options || {};
    if (!ignoreBeforeDeleteHook) {
      this.model.beforeDelete(this);
    }
    let { query, params } = this.updateTemplate.massiveUpdate(
      [column2],
      [value2],
      this.whereQuery,
      this.joinQuery
    );
    params = [...params, ...this.params];
    log(query, this.logs, params);
    const rows = await this.mysqlConnection.query(query, params);
    if (!rows[0].affectedRows) {
      return 0;
    }
    return rows[0].affectedRows;
  }
  async delete(options = {}) {
    const { ignoreBeforeDeleteHook } = options || {};
    if (!ignoreBeforeDeleteHook) {
      this.model.beforeDelete(this);
    }
    this.whereQuery = this.whereTemplate.convertPlaceHolderToValue(
      this.whereQuery
    );
    const query = this.deleteTemplate.massiveDelete(
      this.whereQuery,
      this.joinQuery
    );
    log(query, this.logs, this.params);
    const rows = await this.mysqlConnection.query(query, this.params);
    if (!rows[0].affectedRows) {
      return 0;
    }
    return rows[0].affectedRows;
  }
  async update(data, options) {
    const { ignoreBeforeUpdateHook } = options || {};
    if (!ignoreBeforeUpdateHook) {
      this.model.beforeUpdate(this);
    }
    const columns = Object.keys(data);
    const values = Object.values(data);
    this.whereQuery = this.whereTemplate.convertPlaceHolderToValue(
      this.whereQuery
    );
    const { query, params } = this.updateTemplate.massiveUpdate(
      columns,
      values,
      this.whereQuery,
      this.joinQuery
    );
    console.log(query, params, this.params);
    params.push(...this.params);
    log(query, this.logs, params);
    const rows = await this.mysqlConnection.query(query, params);
    if (!rows[0].affectedRows) {
      return 0;
    }
    return rows[0].affectedRows;
  }
  whereBuilder(cb) {
    const queryBuilder = new _MysqlQueryBuilder(
      this.type,
      this.model,
      this.table,
      this.mysqlConnection,
      this.logs,
      true,
      this.sqlDataSource
    );
    cb(queryBuilder);
    let whereCondition = queryBuilder.whereQuery.trim();
    if (whereCondition.startsWith("AND")) {
      whereCondition = whereCondition.substring(4);
    } else if (whereCondition.startsWith("OR")) {
      whereCondition = whereCondition.substring(3);
    }
    whereCondition = "(" + whereCondition + ")";
    if (!this.whereQuery) {
      this.whereQuery = this.isNestedCondition ? whereCondition : `WHERE ${whereCondition}`;
    } else {
      this.whereQuery += ` AND ${whereCondition}`;
    }
    this.params.push(...queryBuilder.params);
    return this;
  }
  orWhereBuilder(cb) {
    const nestedBuilder = new _MysqlQueryBuilder(
      this.type,
      this.model,
      this.table,
      this.mysqlConnection,
      this.logs,
      true,
      this.sqlDataSource
    );
    cb(nestedBuilder);
    let nestedCondition = nestedBuilder.whereQuery.trim();
    if (nestedCondition.startsWith("AND")) {
      nestedCondition = nestedCondition.substring(4);
    } else if (nestedCondition.startsWith("OR")) {
      nestedCondition = nestedCondition.substring(3);
    }
    nestedCondition = `(${nestedCondition})`;
    if (!this.whereQuery) {
      this.whereQuery = this.isNestedCondition ? nestedCondition : `WHERE ${nestedCondition}`;
      this.params.push(...nestedBuilder.params);
      return this;
    }
    this.whereQuery += ` OR ${nestedCondition}`;
    this.params.push(...nestedBuilder.params);
    return this;
  }
  andWhereBuilder(cb) {
    const nestedBuilder = new _MysqlQueryBuilder(
      this.type,
      this.model,
      this.table,
      this.mysqlConnection,
      this.logs,
      true,
      this.sqlDataSource
    );
    cb(nestedBuilder);
    let nestedCondition = nestedBuilder.whereQuery.trim();
    if (nestedCondition.startsWith("AND")) {
      nestedCondition = nestedCondition.substring(4);
    } else if (nestedCondition.startsWith("OR")) {
      nestedCondition = nestedCondition.substring(3);
    }
    if (!this.whereQuery) {
      this.whereQuery = this.isNestedCondition ? nestedCondition : `WHERE ${nestedCondition}`;
      this.params.push(...nestedBuilder.params);
      return this;
    }
    this.whereQuery += ` AND ${nestedCondition}`;
    this.params.push(...nestedBuilder.params);
    return this;
  }
  async getCount(options = { ignoreHooks: false }) {
    if (options.ignoreHooks) {
      const [result2] = await this.mysqlConnection.query(
        `SELECT COUNT(*) as total from ${this.table}`
      );
      return result2[0].total;
    }
    this.select("COUNT(*) as total");
    const result = await this.one();
    return result ? +result.$additionalColumns.total : 0;
  }
  async getSum(column2, options = { ignoreHooks: false }) {
    if (options.ignoreHooks) {
      const [result2] = await this.mysqlConnection.query(
        `SELECT SUM(${column2}) as total from ${this.table}`
      );
      return result2[0].total;
    }
    column2 = convertCase(column2, this.model.databaseCaseConvention);
    this.select(`SUM(${column2}) as total`);
    const result = await this.one();
    return result ? +result.$additionalColumns.total : 0;
  }
  async paginate(page, limit, options) {
    this.limitQuery = this.selectTemplate.limit(limit);
    this.offsetQuery = this.selectTemplate.offset((page - 1) * limit);
    const originalSelectQuery = this.selectQuery;
    this.select("COUNT(*) as total");
    const total = await this.many(options);
    this.selectQuery = originalSelectQuery;
    const models = await this.many(options);
    const paginationMetadata = getPaginationMetadata(
      page,
      limit,
      +total[0].$additionalColumns["total"]
    );
    let data = await parseDatabaseDataIntoModelResponse(models, this.model) || [];
    if (Array.isArray(data)) {
      data = data.filter((model) => model !== null);
    }
    return {
      paginationMetadata,
      data: Array.isArray(data) ? data : [data]
    };
  }
  select(...columns) {
    this.modelSelectedColumns = columns.map(
      (column2) => convertCase(column2, this.model.databaseCaseConvention)
    );
    this.selectQuery = this.selectTemplate.selectColumns(
      ...columns
    );
    return this;
  }
  distinct() {
    const distinct = this.selectTemplate.distinct;
    this.selectQuery = this.selectQuery.replace(
      /select/i,
      `SELECT ${distinct}`
    );
    return this;
  }
  distinctOn(...columns) {
    throw new Error("DISTINCT ON is only supported in postgres");
  }
  joinRaw(query) {
    this.joinQuery += ` ${query} `;
    return this;
  }
  join(relationTable, primaryColumn, foreignColumn) {
    const join2 = JOIN_default(
      this.model,
      relationTable,
      primaryColumn,
      foreignColumn
    );
    this.joinQuery += join2.innerJoin();
    return this;
  }
  leftJoin(relationTable, primaryColumn, foreignColumn) {
    const join2 = JOIN_default(
      this.model,
      relationTable,
      primaryColumn,
      foreignColumn
    );
    this.joinQuery += join2.leftJoin();
    return this;
  }
  with(relation, relatedModel, relatedModelQueryBuilder, ignoreHooks) {
    if (!relatedModelQueryBuilder) {
      this.relations.push({
        relation
      });
      return this;
    }
    const queryBuilder = new _MysqlQueryBuilder(
      this.type,
      relatedModel,
      relatedModel?.table || "",
      this.mysqlConnection,
      this.logs,
      false,
      this.sqlDataSource
    );
    relatedModelQueryBuilder(queryBuilder);
    if (!ignoreHooks?.beforeFetch) {
      relatedModel?.beforeFetch(queryBuilder);
    }
    this.relations.push({
      relation,
      selectedColumns: queryBuilder.modelSelectedColumns,
      whereQuery: this.whereTemplate.convertPlaceHolderToValue(
        queryBuilder.whereQuery
      ),
      params: queryBuilder.params,
      joinQuery: queryBuilder.joinQuery,
      groupByQuery: queryBuilder.groupByQuery,
      orderByQuery: queryBuilder.orderByQuery,
      limitQuery: queryBuilder.limitQuery,
      offsetQuery: queryBuilder.offsetQuery,
      havingQuery: queryBuilder.havingQuery,
      dynamicColumns: queryBuilder.dynamicColumns,
      ignoreAfterFetchHook: ignoreHooks?.afterFetch || false
    });
    return this;
  }
  addDynamicColumns(dynamicColumns) {
    this.dynamicColumns = dynamicColumns;
    return this;
  }
  groupBy(...columns) {
    this.groupByQuery = this.selectTemplate.groupBy(...columns);
    return this;
  }
  groupByRaw(query) {
    query.replace("GROUP BY", "");
    this.groupByQuery = ` GROUP BY ${query}`;
    return this;
  }
  orderBy(column2, order) {
    const casedColumn = convertCase(
      column2,
      this.model.databaseCaseConvention
    );
    if (this.orderByQuery) {
      this.orderByQuery += `, ${casedColumn} ${order}`;
      return this;
    }
    this.orderByQuery = ` ORDER BY ${casedColumn} ${order}`;
    return this;
  }
  orderByRaw(query) {
    if (this.orderByQuery) {
      this.orderByQuery += `, ${query}`;
      return this;
    }
    this.orderByQuery = ` ORDER BY ${query}`;
    return this;
  }
  limit(limit) {
    this.limitQuery = this.selectTemplate.limit(limit);
    return this;
  }
  offset(offset) {
    this.offsetQuery = this.selectTemplate.offset(offset);
    return this;
  }
  havingRaw(query) {
    query = query.replace("HAVING", "");
    if (this.havingQuery) {
      this.havingQuery += ` AND ${query}`;
      return this;
    }
    this.havingQuery = ` HAVING ${query}`;
    return this;
  }
  copy() {
    const queryBuilder = new _MysqlQueryBuilder(
      this.type,
      this.model,
      this.table,
      this.mysqlConnection,
      this.logs,
      this.isNestedCondition,
      this.sqlDataSource
    );
    queryBuilder.selectQuery = this.selectQuery;
    queryBuilder.whereQuery = this.whereQuery;
    queryBuilder.joinQuery = this.joinQuery;
    queryBuilder.groupByQuery = this.groupByQuery;
    queryBuilder.orderByQuery = this.orderByQuery;
    queryBuilder.limitQuery = this.limitQuery;
    queryBuilder.offsetQuery = this.offsetQuery;
    queryBuilder.params = [...this.params];
    queryBuilder.relations = [...this.relations];
    return queryBuilder;
  }
};

// src/sql/mysql/mysql_model_manager.ts
var MysqlModelManager = class extends ModelManager {
  /**
   * Constructor for MysqlModelManager class.
   *
   * @param {typeof Model} model - Model constructor.
   * @param {Connection} mysqlConnection - MySQL connection pool.
   * @param {boolean} logs - Flag to enable or disable logging.
   */
  constructor(type, model, mysqlConnection, logs, sqlDataSource) {
    super(model, logs, sqlDataSource);
    this.type = type;
    this.mysqlConnection = mysqlConnection;
    this.sqlModelManagerUtils = new SqlModelManagerUtils(
      this.type,
      mysqlConnection
    );
  }
  /**
   * Find method to retrieve multiple records from the database based on the input conditions.
   *
   * @param {FindType} input - Optional query parameters for filtering, ordering, and pagination.
   * @returns Promise resolving to an array of models.
   */
  async find(input) {
    if (!input) {
      return await this.query().many();
    }
    const query = this.query();
    if (input.select) {
      query.select(...input.select);
    }
    if (input.relations) {
      input.relations.forEach((relation) => {
        query.with(relation);
      });
    }
    if (input.where) {
      Object.entries(input.where).forEach(([key, value2]) => {
        query.where(key, value2);
      });
    }
    if (input.orderBy) {
      Object.entries(input.orderBy).forEach(([key, value2]) => {
        query.orderBy(key, value2);
      });
    }
    if (input.limit) {
      query.limit(input.limit);
    }
    if (input.offset) {
      query.offset(input.offset);
    }
    if (input.groupBy) {
      query.groupBy(...input.groupBy);
    }
    return await query.many({ ignoreHooks: input.ignoreHooks || [] });
  }
  /**
   * Find a single record from the database based on the input conditions.
   *
   * @param {FindOneType} input - query parameters for filtering and selecting a single record.
   * @returns Promise resolving to a single model or null if not found.
   */
  async findOne(input) {
    const results = await this.find({
      ...input,
      limit: 1
    });
    if (!results.length) {
      return null;
    }
    return results[0];
  }
  /**
   * Find a single record by its PK from the database.
   *
   * @param {string | number | boolean} value - PK of the record to retrieve, hooks will not have any effect, since it's a direct query for the PK.
   * @returns Promise resolving to a single model or null if not found.
   */
  async findOneByPrimaryKey(value2) {
    if (!this.model.primaryKey) {
      throw new Error(
        "Model " + this.model.table + " has no primary key to be retrieved by"
      );
    }
    return await this.query().where(this.model.primaryKey, value2).one();
  }
  /**
   * Save a new model instance to the database.
   *
   * @param {Model} model - Model instance to be saved.
   * @param {TransactionType} trx - TransactionType to be used on the save operation.
   * @returns Promise resolving to the saved model or null if saving fails.
   */
  async insert(model) {
    this.model.beforeInsert(model);
    const { query, params } = this.sqlModelManagerUtils.parseInsert(
      model,
      this.model,
      this.sqlDataSource.getDbType()
    );
    log(query, this.logs, params);
    const [result] = await this.mysqlConnection.query(query, params);
    if (this.model.primaryKey && model[this.model.primaryKey]) {
      const pkValue = model[this.model.primaryKey];
      return await this.findOneByPrimaryKey(pkValue);
    }
    return await this.findOneByPrimaryKey(result["insertId"]);
  }
  /**
   * Create multiple model instances in the database.
   *
   * @param {Model} model - Model instance to be saved.
   * @param {TransactionType} trx - TransactionType to be used on the save operation.
   * @returns Promise resolving to an array of saved models or null if saving fails.
   */
  async insertMany(models) {
    models.forEach((model) => {
      this.model.beforeInsert(model);
    });
    const { query, params } = this.sqlModelManagerUtils.parseMassiveInsert(
      models,
      this.model,
      this.sqlDataSource.getDbType()
    );
    log(query, this.logs, params);
    const [rows] = await this.mysqlConnection.query(query, params);
    if (!rows.affectedRows) {
      return [];
    }
    if (this.model.primaryKey && models[0][this.model.primaryKey]) {
      const idsToFetchList2 = models.map(
        (model) => model[this.model.primaryKey]
      );
      const primaryKeyList = idsToFetchList2.map((key) => `'${key}'`).join(",");
      return await this.query().whereIn(this.model.primaryKey, idsToFetchList2).orderByRaw(`FIELD(${this.model.primaryKey}, ${primaryKeyList})`).many();
    }
    const idsToFetchList = Array.from(
      { length: rows.affectedRows },
      (_, i) => i + rows.insertId
    );
    return await this.query().whereIn(this.model.primaryKey, idsToFetchList).many();
  }
  /**
   * Update an existing model instance in the database.
   * @param {Model} model - Model instance to be updated.
   * @param {TransactionType} trx - TransactionType to be used on the update operation.
   * @returns Promise resolving to the updated model or null if updating fails.
   */
  async updateRecord(model) {
    if (!this.model.primaryKey) {
      throw new Error(
        "Model " + this.model.table + " has no primary key to be updated, try save"
      );
    }
    const updateQuery = this.sqlModelManagerUtils.parseUpdate(
      model,
      this.model,
      this.sqlDataSource.getDbType()
    );
    log(updateQuery.query, this.logs, updateQuery.params);
    await this.mysqlConnection.query(updateQuery.query, updateQuery.params);
    if (!this.model.primaryKey) {
      log("Model has no primary key so no record can be retrieved", this.logs);
      return null;
    }
    return await this.findOneByPrimaryKey(
      model[this.model.primaryKey]
    );
  }
  /**
   * @description Delete a record from the database from the given model.
   *
   * @param {Model} model - Model to delete.
   * @param {TransactionType} trx - TransactionType to be used on the delete operation.
   * @returns Promise resolving to the deleted model or null if deleting fails.
   */
  async deleteRecord(model) {
    if (!this.model.primaryKey) {
      throw new Error(
        "Model " + this.model.table + " has no primary key to be deleted from"
      );
    }
    const { query, params } = this.sqlModelManagerUtils.parseDelete(
      this.model.table,
      this.model.primaryKey,
      model[this.model.primaryKey]
    );
    log(query, this.logs, params);
    const [rows] = await this.mysqlConnection.query(query, params);
    if (this.sqlDataSource.getDbType() === "mariadb") {
      return await parseDatabaseDataIntoModelResponse(
        [rows[0]],
        this.model
      );
    }
    return model;
  }
  /**
   * Create and return a new instance of the Mysql_query_builder for building more complex SQL queries.
   *
   * @returns {Mysql_query_builder<Model>} - Instance of Mysql_query_builder.
   */
  query() {
    return new MysqlQueryBuilder(
      this.type,
      this.model,
      this.model.table,
      this.mysqlConnection,
      this.logs,
      false,
      this.sqlDataSource
    );
  }
};

// src/sql/postgres/postgres_model_manager.ts
init_cjs_shims();

// src/sql/postgres/postgres_query_builder.ts
init_cjs_shims();
var import_reflect_metadata2 = require("reflect-metadata");
var PostgresQueryBuilder = class _PostgresQueryBuilder extends QueryBuilder {
  constructor(model, table, pgClient, logs, isNestedCondition = false, sqlDataSource) {
    super(model, table, logs, sqlDataSource);
    this.pgClient = pgClient;
    this.isNestedCondition = isNestedCondition;
    this.updateTemplate = UPDATE_default(sqlDataSource.getDbType(), this.model);
    this.deleteTemplate = DELETE_default(table, sqlDataSource.getDbType());
    this.postgresModelManagerUtils = new SqlModelManagerUtils(
      "postgres",
      this.pgClient
    );
  }
  select(...columns) {
    this.selectQuery = this.selectTemplate.selectColumns(
      ...columns
    );
    this.modelSelectedColumns = columns.map(
      (column2) => convertCase(column2, this.model.databaseCaseConvention)
    );
    return this;
  }
  distinct() {
    const distinct = this.selectTemplate.distinct;
    this.selectQuery = this.selectQuery.replace(
      /select/i,
      `SELECT ${distinct}`
    );
    return this;
  }
  distinctOn(...columns) {
    const distinctOn = this.selectTemplate.distinctOn(...columns);
    this.selectQuery = this.selectQuery.replace(
      /select/i,
      `SELECT ${distinctOn}`
    );
    return this;
  }
  async one(options = {}) {
    if (!options.ignoreHooks?.includes("beforeFetch")) {
      this.model.beforeFetch(this);
    }
    this.limitQuery = this.selectTemplate.limit(1);
    let query = "";
    if (this.joinQuery && !this.selectQuery) {
      this.selectQuery = this.selectTemplate.selectColumns(`${this.table}.*`);
    }
    query = this.selectQuery + this.joinQuery;
    if (this.whereQuery) {
      query += this.whereQuery;
    }
    query = this.whereTemplate.convertPlaceHolderToValue(query);
    this.limit(1);
    query += this.groupFooterQuery();
    query = query.trim();
    log(query, this.logs, this.params);
    const result = await this.pgClient.query(query, this.params);
    if (!result.rows[0]) {
      return null;
    }
    const modelInstance = getBaseModelInstance();
    await this.mergeRawPacketIntoModel(
      modelInstance,
      result.rows[0],
      this.model
    );
    const relationModels = await this.postgresModelManagerUtils.parseQueryBuilderRelations(
      [modelInstance],
      this.model,
      this.relations,
      "postgres",
      this.logs
    );
    const model = await parseDatabaseDataIntoModelResponse(
      [modelInstance],
      this.model,
      relationModels,
      this.modelSelectedColumns
    );
    return !options.ignoreHooks?.includes("afterFetch") ? (await this.model.afterFetch([model]))[0] : model;
  }
  async oneOrFail(options) {
    const model = await this.one({
      ignoreHooks: options?.ignoreHooks
    });
    if (!model) {
      if (options?.customError) {
        throw options.customError;
      }
      throw new Error("ROW_NOT_FOUND");
    }
    return model;
  }
  async many(options = {}) {
    if (!options.ignoreHooks?.includes("beforeFetch")) {
      this.model.beforeFetch(this);
    }
    let query = "";
    if (this.joinQuery && !this.selectQuery) {
      this.selectQuery = this.selectTemplate.selectColumns(`${this.table}.*`);
    }
    query = this.selectQuery + this.joinQuery;
    if (this.whereQuery) {
      query += this.whereQuery;
    }
    query += this.groupFooterQuery();
    query = this.whereTemplate.convertPlaceHolderToValue(query);
    query = query.trim();
    log(query, this.logs, this.params);
    const result = await this.pgClient.query(query, this.params);
    const rows = result.rows;
    const modelPromises = rows.map(async (row) => {
      const modelInstance = getBaseModelInstance();
      await this.mergeRawPacketIntoModel(modelInstance, row, this.model);
      return modelInstance;
    });
    const models = await Promise.all(modelPromises);
    const relationModels = await this.postgresModelManagerUtils.parseQueryBuilderRelations(
      models,
      this.model,
      this.relations,
      "postgres",
      this.logs
    );
    const serializedModels = await parseDatabaseDataIntoModelResponse(
      models,
      this.model,
      relationModels,
      this.modelSelectedColumns
    );
    if (!serializedModels) {
      return [];
    }
    if (!options.ignoreHooks?.includes("afterFetch")) {
      await this.model.afterFetch(
        Array.isArray(serializedModels) ? serializedModels : [serializedModels]
      );
    }
    return Array.isArray(serializedModels) ? serializedModels : [serializedModels];
  }
  async update(data, options) {
    const { ignoreBeforeUpdateHook } = options || {};
    if (!ignoreBeforeUpdateHook) {
      this.model.beforeUpdate(this);
    }
    const columns = Object.keys(data);
    const values = Object.values(data);
    this.whereQuery = this.whereTemplate.convertPlaceHolderToValue(
      this.whereQuery,
      values.length + 1
    );
    const { query, params } = this.updateTemplate.massiveUpdate(
      columns,
      values,
      this.whereQuery,
      this.joinQuery
    );
    params.push(...this.params);
    log(query, this.logs, params);
    const result = await this.pgClient.query(query, params);
    if (!result.rows) {
      return 0;
    }
    return result.rowCount || 0;
  }
  async delete(options = {}) {
    const { ignoreBeforeDeleteHook } = options || {};
    if (!ignoreBeforeDeleteHook) {
      this.model.beforeDelete(this);
    }
    this.whereQuery = this.whereTemplate.convertPlaceHolderToValue(
      this.whereQuery
    );
    const query = this.deleteTemplate.massiveDelete(
      this.whereQuery,
      this.joinQuery
    );
    log(query, this.logs, this.params);
    const result = await this.pgClient.query(query, this.params);
    if (!result.rows) {
      return 0;
    }
    return result.rowCount || 0;
  }
  async softDelete(options) {
    const {
      column: column2 = "deletedAt",
      value: value2 = (/* @__PURE__ */ new Date()).toISOString().slice(0, 19).replace("T", " "),
      ignoreBeforeDeleteHook = false
    } = options || {};
    if (!ignoreBeforeDeleteHook) {
      this.model.beforeDelete(this);
    }
    let { query, params } = this.updateTemplate.massiveUpdate(
      [column2],
      [value2],
      this.whereQuery,
      this.joinQuery
    );
    params = [...params, ...this.params];
    log(query, this.logs, params);
    const result = await this.pgClient.query(query, params);
    if (!result.rows) {
      return 0;
    }
    return result.rowCount || 0;
  }
  whereBuilder(cb) {
    const queryBuilder = new _PostgresQueryBuilder(
      this.model,
      this.table,
      this.pgClient,
      this.logs,
      true,
      this.sqlDataSource
    );
    cb(queryBuilder);
    let whereCondition = queryBuilder.whereQuery.trim();
    if (whereCondition.startsWith("AND")) {
      whereCondition = whereCondition.substring(4);
    } else if (whereCondition.startsWith("OR")) {
      whereCondition = whereCondition.substring(3);
    }
    whereCondition = "(" + whereCondition + ")";
    if (!this.whereQuery) {
      this.whereQuery = this.isNestedCondition ? whereCondition : `WHERE ${whereCondition}`;
    } else {
      this.whereQuery += ` AND ${whereCondition}`;
    }
    this.params.push(...queryBuilder.params);
    return this;
  }
  orWhereBuilder(cb) {
    const nestedBuilder = new _PostgresQueryBuilder(
      this.model,
      this.table,
      this.pgClient,
      this.logs,
      true,
      this.sqlDataSource
    );
    cb(nestedBuilder);
    let nestedCondition = nestedBuilder.whereQuery.trim();
    if (nestedCondition.startsWith("AND")) {
      nestedCondition = nestedCondition.substring(4);
    } else if (nestedCondition.startsWith("OR")) {
      nestedCondition = nestedCondition.substring(3);
    }
    nestedCondition = `(${nestedCondition})`;
    if (!this.whereQuery) {
      this.whereQuery = this.isNestedCondition ? nestedCondition : `WHERE ${nestedCondition}`;
      this.params.push(...nestedBuilder.params);
      return this;
    }
    this.whereQuery += ` OR ${nestedCondition}`;
    this.params.push(...nestedBuilder.params);
    return this;
  }
  andWhereBuilder(cb) {
    const nestedBuilder = new _PostgresQueryBuilder(
      this.model,
      this.table,
      this.pgClient,
      this.logs,
      true,
      this.sqlDataSource
    );
    cb(nestedBuilder);
    let nestedCondition = nestedBuilder.whereQuery.trim();
    if (nestedCondition.startsWith("AND")) {
      nestedCondition = nestedCondition.substring(4);
    } else if (nestedCondition.startsWith("OR")) {
      nestedCondition = nestedCondition.substring(3);
    }
    if (!this.whereQuery) {
      this.whereQuery = this.isNestedCondition ? nestedCondition : `WHERE ${nestedCondition}`;
      this.params.push(...nestedBuilder.params);
      return this;
    }
    this.whereQuery += ` AND ${nestedCondition}`;
    this.params.push(...nestedBuilder.params);
    return this;
  }
  async getCount(options = { ignoreHooks: false }) {
    if (options.ignoreHooks) {
      const { rows } = await this.pgClient.query(
        `SELECT COUNT(*) as total from ${this.table}`
      );
      return +rows[0].total;
    }
    this.select("COUNT(*) as total");
    const result = await this.one();
    return result ? +result.$additionalColumns["total"] : 0;
  }
  async getSum(column2, options = { ignoreHooks: false }) {
    if (options.ignoreHooks) {
      const { rows } = await this.pgClient.query(
        `SELECT SUM(${column2}) as total from ${this.table}`
      );
      return +rows[0].total || 0;
    }
    column2 = convertCase(column2, this.model.databaseCaseConvention);
    this.select(`SUM(${column2}) as total`);
    const result = await this.one();
    return result ? +result.$additionalColumns["total"] : 0;
  }
  async paginate(page, limit, options) {
    this.limitQuery = this.selectTemplate.limit(limit);
    this.offsetQuery = this.selectTemplate.offset((page - 1) * limit);
    const originalSelectQuery = this.selectQuery;
    this.select("COUNT(*) as total");
    const total = await this.many(options);
    this.selectQuery = originalSelectQuery;
    const models = await this.many(options);
    const paginationMetadata = getPaginationMetadata(
      page,
      limit,
      +total[0].$additionalColumns["total"]
    );
    let data = await parseDatabaseDataIntoModelResponse(models, this.model) || [];
    if (Array.isArray(data)) {
      data = data.filter((model) => model !== null);
    }
    return {
      paginationMetadata,
      data: Array.isArray(data) ? data : [data]
    };
  }
  joinRaw(query) {
    this.joinQuery += ` ${query} `;
    return this;
  }
  join(relationTable, primaryColumn, foreignColumn) {
    const join2 = JOIN_default(
      this.model,
      relationTable,
      primaryColumn,
      foreignColumn
    );
    this.joinQuery += join2.innerJoin();
    return this;
  }
  leftJoin(relationTable, primaryColumn, foreignColumn) {
    const join2 = JOIN_default(
      this.model,
      relationTable,
      primaryColumn,
      foreignColumn
    );
    this.joinQuery += join2.leftJoin();
    return this;
  }
  with(relation, relatedModel, relatedModelQueryBuilder, ignoreHooks) {
    if (!relatedModelQueryBuilder) {
      this.relations.push({
        relation
      });
      return this;
    }
    const queryBuilder = new _PostgresQueryBuilder(
      relatedModel,
      relatedModel?.table || "",
      this.pgClient,
      this.logs,
      false,
      this.sqlDataSource
    );
    relatedModelQueryBuilder(queryBuilder);
    if (!ignoreHooks?.beforeFetch) {
      relatedModel?.beforeFetch(queryBuilder);
    }
    this.relations.push({
      relation,
      selectedColumns: queryBuilder.modelSelectedColumns,
      whereQuery: this.whereTemplate.convertPlaceHolderToValue(
        queryBuilder.whereQuery
      ),
      params: queryBuilder.params,
      joinQuery: queryBuilder.joinQuery,
      groupByQuery: queryBuilder.groupByQuery,
      orderByQuery: queryBuilder.orderByQuery,
      limitQuery: queryBuilder.limitQuery,
      offsetQuery: queryBuilder.offsetQuery,
      havingQuery: queryBuilder.havingQuery,
      dynamicColumns: queryBuilder.dynamicColumns,
      ignoreAfterFetchHook: ignoreHooks?.afterFetch || false
    });
    return this;
  }
  addDynamicColumns(dynamicColumns) {
    this.dynamicColumns = dynamicColumns;
    return this;
  }
  groupBy(...columns) {
    this.groupByQuery = this.selectTemplate.groupBy(...columns);
    return this;
  }
  groupByRaw(query) {
    query.replace("GROUP BY", "");
    this.groupByQuery = ` GROUP BY ${query}`;
    return this;
  }
  orderBy(column2, order) {
    const casedColumn = convertCase(
      column2,
      this.model.databaseCaseConvention
    );
    if (this.orderByQuery) {
      this.orderByQuery += `, ${casedColumn} ${order}`;
      return this;
    }
    this.orderByQuery = ` ORDER BY ${casedColumn} ${order}`;
    return this;
  }
  orderByRaw(query) {
    if (this.orderByQuery) {
      this.orderByQuery += `, ${query}`;
      return this;
    }
    this.orderByQuery = ` ORDER BY ${query}`;
    return this;
  }
  limit(limit) {
    this.limitQuery = this.selectTemplate.limit(limit);
    return this;
  }
  offset(offset) {
    this.offsetQuery = this.selectTemplate.offset(offset);
    return this;
  }
  havingRaw(query) {
    query = query.replace("HAVING", "");
    if (this.havingQuery) {
      this.havingQuery += ` AND ${query}`;
      return this;
    }
    this.havingQuery = ` HAVING ${query}`;
    return this;
  }
  copy() {
    const queryBuilder = new _PostgresQueryBuilder(
      this.model,
      this.table,
      this.pgClient,
      this.logs,
      this.isNestedCondition,
      this.sqlDataSource
    );
    queryBuilder.selectQuery = this.selectQuery;
    queryBuilder.whereQuery = this.whereQuery;
    queryBuilder.groupByQuery = this.groupByQuery;
    queryBuilder.orderByQuery = this.orderByQuery;
    queryBuilder.limitQuery = this.limitQuery;
    queryBuilder.offsetQuery = this.offsetQuery;
    queryBuilder.params = [...this.params];
    return queryBuilder;
  }
};

// src/sql/postgres/postgres_model_manager.ts
var PostgresModelManager = class extends ModelManager {
  /**
   * Constructor for Postgres_model_manager class.
   *
   * @param {typeof Model} model - Model constructor.
   * @param {Pool} pgConnection - PostgreSQL connection pool.
   * @param {boolean} logs - Flag to enable or disable logging.
   */
  constructor(model, pgConnection, logs, sqlDataSource) {
    super(model, logs, sqlDataSource);
    this.pgConnection = pgConnection;
    this.sqlModelManagerUtils = new SqlModelManagerUtils(
      "postgres",
      pgConnection
    );
  }
  /**
   * Find method to retrieve multiple records from the database based on the input conditions.
   *
   * @param {FindType} input - Optional query parameters for filtering, ordering, and pagination.
   * @returns Promise resolving to an array of models.
   */
  async find(input) {
    if (!input) {
      return await this.query().many();
    }
    const query = this.query();
    if (input.select) {
      query.select(...input.select);
    }
    if (input.relations) {
      input.relations.forEach((relation) => {
        query.with(relation);
      });
    }
    if (input.where) {
      Object.entries(input.where).forEach(([key, value2]) => {
        query.where(key, value2);
      });
    }
    if (input.orderBy) {
      Object.entries(input.orderBy).forEach(([key, value2]) => {
        query.orderBy(key, value2);
      });
    }
    if (input.limit) {
      query.limit(input.limit);
    }
    if (input.offset) {
      query.offset(input.offset);
    }
    if (input.groupBy) {
      query.groupBy(...input.groupBy);
    }
    return await query.many({ ignoreHooks: input.ignoreHooks || [] });
  }
  /**
   * Find a single record from the database based on the input conditions.
   *
   * @param {FindOneType} input - query parameters for filtering and selecting a single record.
   * @returns Promise resolving to a single model or null if not found.
   */
  async findOne(input) {
    const results = await this.find({
      ...input,
      limit: 1
    });
    if (!results.length) {
      return null;
    }
    return results[0];
  }
  /**
   * Find a single record by its PK from the database.
   *
   * @param {string | number | boolean} value - PK value of the record to retrieve.
   * @returns Promise resolving to a single model or null if not found.
   */
  async findOneByPrimaryKey(value2) {
    if (!this.model.primaryKey) {
      throw new Error(
        "Model " + this.model.table + " has no primary key to be retrieved by"
      );
    }
    return await this.query().where(this.model.primaryKey, "=", value2).one();
  }
  /**
   * Save a new model instance to the database.
   *
   * @param {Model} model - Model instance to be saved.
   * @param {MysqlTransaction} trx - MysqlTransaction to be used on the save operation.
   * @returns Promise resolving to the saved model or null if saving fails.
   */
  async insert(model) {
    this.model.beforeInsert(model);
    const { query, params } = this.sqlModelManagerUtils.parseInsert(
      model,
      this.model,
      this.sqlDataSource.getDbType()
    );
    log(query, this.logs, params);
    const { rows } = await this.pgConnection.query(query, params);
    const insertedModel = rows[0];
    if (!insertedModel) {
      throw new Error(rows[0]);
    }
    const result = await parseDatabaseDataIntoModelResponse(
      [insertedModel],
      this.model
    );
    this.model.afterFetch([result]);
    return result;
  }
  /**
   * Create multiple model instances in the database.
   *
   * @param {Model} models - Model instance to be saved.
   * @param {Transaction} trx - MysqlTransaction to be used on the save operation.
   * @returns Promise resolving to an array of saved models or null if saving fails.
   */
  async insertMany(models) {
    models.forEach((model) => this.model.beforeInsert(model));
    const { query, params } = this.sqlModelManagerUtils.parseMassiveInsert(
      models,
      this.model,
      this.sqlDataSource.getDbType()
    );
    log(query, this.logs, params);
    const { rows } = await this.pgConnection.query(query, params);
    const insertedModel = rows;
    if (!insertedModel.length) {
      return [];
    }
    const insertModelPromise = insertedModel.map(
      async (model) => await parseDatabaseDataIntoModelResponse([model], this.model)
    );
    const results = await Promise.all(insertModelPromise);
    this.model.afterFetch(results);
    return results;
  }
  /**
   * Update an existing model instance in the database.
   * @param {Model} model - Model instance to be updated.
   * @param {Transaction} trx - Transaction to be used on the update operation.
   * @returns Promise resolving to the updated model or null if updating fails.
   */
  async updateRecord(model) {
    const { table, primaryKey } = this.model;
    if (!primaryKey) {
      throw new Error(
        "Model " + table + " has no primary key to be updated, try save"
      );
    }
    const { query, params } = this.sqlModelManagerUtils.parseUpdate(
      model,
      this.model,
      this.sqlDataSource.getDbType()
    );
    log(query, this.logs, params);
    await this.pgConnection.query(query, params);
    if (!primaryKey) {
      return null;
    }
    return await this.findOneByPrimaryKey(
      model[primaryKey]
    );
  }
  /**
   * @description Delete a record from the database from the given model.
   *
   * @param {Model} model - Model to delete.
   * @param {Transaction} trx - Transaction to be used on the delete operation.
   * @returns Promise resolving to the deleted model or null if deleting fails.
   */
  async deleteRecord(model) {
    if (!this.model.primaryKey) {
      throw new Error(
        "Model " + this.model.table + " has no primary key to be deleted from"
      );
    }
    const { query, params } = this.sqlModelManagerUtils.parseDelete(
      this.model.table,
      this.model.primaryKey,
      model[this.model.primaryKey]
    );
    log(query, this.logs, params);
    await this.pgConnection.query(query, params);
    return model;
  }
  /**
   * Create and return a new instance of the Mysql_query_builder for building more complex SQL queries.
   *
   * @returns {MysqlQueryBuilder<Model>} - Instance of Mysql_query_builder.
   */
  query() {
    return new PostgresQueryBuilder(
      this.model,
      this.model.table,
      this.pgConnection,
      this.logs,
      false,
      this.sqlDataSource
    );
  }
};

// src/sql/sqlite/sql_lite_model_manager.ts
init_cjs_shims();

// src/sql/sqlite/sql_lite_query_builder.ts
init_cjs_shims();
var SqlLiteQueryBuilder = class _SqlLiteQueryBuilder extends QueryBuilder {
  constructor(model, table, sqLiteConnection, logs, isNestedCondition = false, sqlDataSource) {
    super(model, table, logs, sqlDataSource);
    this.sqLiteConnection = sqLiteConnection;
    this.isNestedCondition = isNestedCondition;
    this.updateTemplate = UPDATE_default(sqlDataSource.getDbType(), this.model);
    this.deleteTemplate = DELETE_default(table, sqlDataSource.getDbType());
    this.sqliteModelManagerUtils = new SqlModelManagerUtils(
      "sqlite",
      this.sqLiteConnection
    );
  }
  async one(options = {}) {
    if (!options.ignoreHooks?.includes("beforeFetch")) {
      this.model.beforeFetch(this);
    }
    let query = "";
    if (this.joinQuery && !this.selectQuery) {
      this.selectQuery = this.selectTemplate.selectColumns(`${this.table}.*`);
    }
    query = this.selectQuery + this.joinQuery;
    if (this.whereQuery) {
      query += this.whereQuery;
    }
    query = this.whereTemplate.convertPlaceHolderToValue(query);
    this.limit(1);
    query += this.groupFooterQuery();
    query = query.trim();
    log(query, this.logs, this.params);
    const results = await this.promisifyQuery(query, this.params);
    if (!results.length) {
      return null;
    }
    const result = results[0];
    const modelInstance = getBaseModelInstance();
    await this.mergeRawPacketIntoModel(modelInstance, result, this.model);
    const relationModels = await this.sqliteModelManagerUtils.parseQueryBuilderRelations(
      [modelInstance],
      this.model,
      this.relations,
      "sqlite",
      this.logs
    );
    const model = await parseDatabaseDataIntoModelResponse(
      [modelInstance],
      this.model,
      relationModels,
      this.modelSelectedColumns
    );
    return !options.ignoreHooks?.includes("afterFetch") ? (await this.model.afterFetch([model]))[0] : model;
  }
  async oneOrFail(options) {
    const model = await this.one({
      ignoreHooks: options?.ignoreHooks
    });
    if (!model) {
      if (options?.customError) {
        throw options.customError;
      }
      throw new Error("ROW_NOT_FOUND");
    }
    return model;
  }
  async many(options = {}) {
    if (!options.ignoreHooks?.includes("beforeFetch")) {
      this.model.beforeFetch(this);
    }
    let query = "";
    if (this.joinQuery && !this.selectQuery) {
      this.selectQuery = this.selectTemplate.selectColumns(`${this.table}.*`);
    }
    query = this.selectQuery + this.joinQuery;
    if (this.whereQuery) {
      query += this.whereQuery;
    }
    query += this.groupFooterQuery();
    query = this.whereTemplate.convertPlaceHolderToValue(query);
    query = query.trim();
    log(query, this.logs, this.params);
    const results = await this.promisifyQuery(query, this.params);
    const modelPromises = results.map(async (result) => {
      const modelInstance = getBaseModelInstance();
      await this.mergeRawPacketIntoModel(modelInstance, result, this.model);
      return modelInstance;
    });
    const models = await Promise.all(modelPromises);
    const relationModels = await this.sqliteModelManagerUtils.parseQueryBuilderRelations(
      models,
      this.model,
      this.relations,
      "sqlite",
      this.logs
    );
    const serializedModels = await parseDatabaseDataIntoModelResponse(
      models,
      this.model,
      relationModels,
      this.modelSelectedColumns
    );
    if (!serializedModels) {
      return [];
    }
    if (!options.ignoreHooks?.includes("afterFetch")) {
      await this.model.afterFetch(
        Array.isArray(serializedModels) ? serializedModels : [serializedModels]
      );
    }
    return Array.isArray(serializedModels) ? serializedModels : [serializedModels];
  }
  async update(data, options) {
    const { ignoreBeforeUpdateHook } = options || {};
    if (!ignoreBeforeUpdateHook) {
      this.model.beforeUpdate(this);
    }
    const columns = Object.keys(data);
    const values = Object.values(data);
    this.whereQuery = this.whereTemplate.convertPlaceHolderToValue(
      this.whereQuery,
      values.length + 1
    );
    const { query, params } = this.updateTemplate.massiveUpdate(
      columns,
      values,
      this.whereQuery,
      this.joinQuery
    );
    params.push(...this.params);
    log(query, this.logs, params);
    return await new Promise((resolve, reject) => {
      this.sqLiteConnection.run(query, params, function(err) {
        if (err) {
          reject(new Error(err.message));
        } else {
          resolve(this.changes);
        }
      });
    });
  }
  async delete(options = {}) {
    const { ignoreBeforeDeleteHook } = options || {};
    if (!ignoreBeforeDeleteHook) {
      this.model.beforeDelete(this);
    }
    this.whereQuery = this.whereTemplate.convertPlaceHolderToValue(
      this.whereQuery
    );
    const query = this.deleteTemplate.massiveDelete(
      this.whereQuery,
      this.joinQuery
    );
    log(query, this.logs, this.params);
    return new Promise((resolve, reject) => {
      this.sqLiteConnection.run(query, this.params, function(err) {
        if (err) {
          reject(new Error(err.message));
        } else {
          resolve(this.changes);
        }
      });
    });
  }
  async softDelete(options) {
    const {
      column: column2 = "deletedAt",
      value: value2 = (/* @__PURE__ */ new Date()).toISOString().slice(0, 19).replace("T", " "),
      // TODO: check if this is the correct format
      ignoreBeforeDeleteHook = false
    } = options || {};
    if (!ignoreBeforeDeleteHook) {
      this.model.beforeDelete(this);
    }
    let { query, params } = this.updateTemplate.massiveUpdate(
      [column2],
      [value2],
      this.whereQuery,
      this.joinQuery
    );
    params = [...params, ...this.params];
    log(query, this.logs, params);
    return new Promise((resolve, reject) => {
      this.sqLiteConnection.run(query, params, function(err) {
        if (err) {
          reject(new Error(err.message));
        } else {
          resolve(this.changes);
        }
      });
    });
  }
  whereBuilder(cb) {
    const queryBuilder = new _SqlLiteQueryBuilder(
      this.model,
      this.table,
      this.sqLiteConnection,
      this.logs,
      true,
      this.sqlDataSource
    );
    cb(queryBuilder);
    let whereCondition = queryBuilder.whereQuery.trim();
    if (whereCondition.startsWith("AND")) {
      whereCondition = whereCondition.substring(4);
    } else if (whereCondition.startsWith("OR")) {
      whereCondition = whereCondition.substring(3);
    }
    whereCondition = "(" + whereCondition + ")";
    if (!this.whereQuery) {
      this.whereQuery = this.isNestedCondition ? whereCondition : `WHERE ${whereCondition}`;
    } else {
      this.whereQuery += ` AND ${whereCondition}`;
    }
    this.params.push(...queryBuilder.params);
    return this;
  }
  orWhereBuilder(cb) {
    const nestedBuilder = new _SqlLiteQueryBuilder(
      this.model,
      this.table,
      this.sqLiteConnection,
      this.logs,
      true,
      this.sqlDataSource
    );
    cb(nestedBuilder);
    let nestedCondition = nestedBuilder.whereQuery.trim();
    if (nestedCondition.startsWith("AND")) {
      nestedCondition = nestedCondition.substring(4);
    } else if (nestedCondition.startsWith("OR")) {
      nestedCondition = nestedCondition.substring(3);
    }
    nestedCondition = `(${nestedCondition})`;
    if (!this.whereQuery) {
      this.whereQuery = this.isNestedCondition ? nestedCondition : `WHERE ${nestedCondition}`;
      this.params.push(...nestedBuilder.params);
      return this;
    }
    this.whereQuery += ` OR ${nestedCondition}`;
    this.params.push(...nestedBuilder.params);
    return this;
  }
  andWhereBuilder(cb) {
    const nestedBuilder = new _SqlLiteQueryBuilder(
      this.model,
      this.table,
      this.sqLiteConnection,
      this.logs,
      true,
      this.sqlDataSource
    );
    cb(nestedBuilder);
    let nestedCondition = nestedBuilder.whereQuery.trim();
    if (nestedCondition.startsWith("AND")) {
      nestedCondition = nestedCondition.substring(4);
    } else if (nestedCondition.startsWith("OR")) {
      nestedCondition = nestedCondition.substring(3);
    }
    if (!this.whereQuery) {
      this.whereQuery = this.isNestedCondition ? nestedCondition : `WHERE ${nestedCondition}`;
      this.params.push(...nestedBuilder.params);
      return this;
    }
    this.whereQuery += ` AND ${nestedCondition}`;
    this.params.push(...nestedBuilder.params);
    return this;
  }
  async raw(query, params = []) {
    return await this.promisifyQuery(query, params);
  }
  async getCount(options = { ignoreHooks: false }) {
    if (options.ignoreHooks) {
      const result2 = await this.promisifyQuery(
        "SELECT COUNT(*) as total FROM " + this.table,
        []
      );
      return +result2[0].total;
    }
    this.select("COUNT(*) as total");
    const result = await this.one();
    return result ? +result.$additionalColumns.total : 0;
  }
  async getSum(column2, options = { ignoreHooks: false }) {
    if (!options.ignoreHooks) {
      const result2 = await this.promisifyQuery(
        `SELECT SUM("${column2}) as total FROM ` + this.table,
        []
      );
      return +result2[0].total || 0;
    }
    column2 = convertCase(column2, this.model.databaseCaseConvention);
    this.select(`SUM(${column2}) as total`);
    const result = await this.one();
    return result ? +result.$additionalColumns.total : 0;
  }
  async paginate(page, limit, options) {
    this.limitQuery = this.selectTemplate.limit(limit);
    this.offsetQuery = this.selectTemplate.offset((page - 1) * limit);
    const originalSelectQuery = this.selectQuery;
    this.select("COUNT(*) as total");
    const total = await this.many(options);
    this.selectQuery = originalSelectQuery;
    const models = await this.many(options);
    const paginationMetadata = getPaginationMetadata(
      page,
      limit,
      +total[0].$additionalColumns["total"]
    );
    let data = await parseDatabaseDataIntoModelResponse(models, this.model) || [];
    if (Array.isArray(data)) {
      data = data.filter((model) => model !== null);
    }
    return {
      paginationMetadata,
      data: Array.isArray(data) ? data : [data]
    };
  }
  select(...columns) {
    this.selectQuery = this.selectTemplate.selectColumns(
      ...columns
    );
    this.modelSelectedColumns = columns.map(
      (column2) => convertCase(column2, this.model.databaseCaseConvention)
    );
    return this;
  }
  distinct() {
    const distinct = this.selectTemplate.distinct;
    this.selectQuery = this.selectQuery.replace(
      /select/i,
      `SELECT ${distinct}`
    );
    return this;
  }
  distinctOn(...columns) {
    throw new Error("DISTINCT ON is only supported in postgres");
  }
  joinRaw(query) {
    this.joinQuery += ` ${query} `;
    return this;
  }
  join(relationTable, primaryColumn, foreignColumn) {
    const join2 = JOIN_default(
      this.model,
      relationTable,
      primaryColumn,
      foreignColumn
    );
    this.joinQuery += join2.innerJoin();
    return this;
  }
  leftJoin(relationTable, primaryColumn, foreignColumn) {
    const join2 = JOIN_default(
      this.model,
      relationTable,
      primaryColumn,
      foreignColumn
    );
    this.joinQuery += join2.leftJoin();
    return this;
  }
  with(relation, relatedModel, relatedModelQueryBuilder, ignoreHooks) {
    if (!relatedModelQueryBuilder) {
      this.relations.push({
        relation
      });
      return this;
    }
    const queryBuilder = new _SqlLiteQueryBuilder(
      relatedModel,
      relatedModel?.table || "",
      this.sqLiteConnection,
      this.logs,
      false,
      this.sqlDataSource
    );
    relatedModelQueryBuilder(queryBuilder);
    if (!ignoreHooks?.beforeFetch) {
      relatedModel?.beforeFetch(queryBuilder);
    }
    this.relations.push({
      relation,
      selectedColumns: queryBuilder.modelSelectedColumns,
      whereQuery: this.whereTemplate.convertPlaceHolderToValue(
        queryBuilder.whereQuery
      ),
      params: queryBuilder.params,
      joinQuery: queryBuilder.joinQuery,
      groupByQuery: queryBuilder.groupByQuery,
      orderByQuery: queryBuilder.orderByQuery,
      limitQuery: queryBuilder.limitQuery,
      offsetQuery: queryBuilder.offsetQuery,
      havingQuery: queryBuilder.havingQuery,
      dynamicColumns: queryBuilder.dynamicColumns,
      ignoreAfterFetchHook: ignoreHooks?.afterFetch || false
    });
    return this;
  }
  addDynamicColumns(dynamicColumns) {
    this.dynamicColumns = dynamicColumns;
    return this;
  }
  groupBy(...columns) {
    this.groupByQuery = this.selectTemplate.groupBy(...columns);
    return this;
  }
  groupByRaw(query) {
    query.replace("GROUP BY", "");
    this.groupByQuery = ` GROUP BY ${query}`;
    return this;
  }
  orderBy(column2, order) {
    const casedColumn = convertCase(
      column2,
      this.model.databaseCaseConvention
    );
    if (this.orderByQuery) {
      this.orderByQuery += `, ${casedColumn} ${order}`;
      return this;
    }
    this.orderByQuery = ` ORDER BY ${casedColumn} ${order}`;
    return this;
  }
  orderByRaw(query) {
    if (this.orderByQuery) {
      this.orderByQuery += `, ${query}`;
      return this;
    }
    this.orderByQuery = ` ORDER BY ${query}`;
    return this;
  }
  limit(limit) {
    this.limitQuery = this.selectTemplate.limit(limit);
    return this;
  }
  offset(offset) {
    this.offsetQuery = this.selectTemplate.offset(offset);
    return this;
  }
  havingRaw(query) {
    query = query.replace("HAVING", "");
    if (this.havingQuery) {
      this.havingQuery += ` AND ${query}`;
      return this;
    }
    this.havingQuery = ` HAVING ${query}`;
    return this;
  }
  copy() {
    const queryBuilder = new _SqlLiteQueryBuilder(
      this.model,
      this.table,
      this.sqLiteConnection,
      this.logs,
      this.isNestedCondition,
      this.sqlDataSource
    );
    queryBuilder.selectQuery = this.selectQuery;
    queryBuilder.whereQuery = this.whereQuery;
    queryBuilder.joinQuery = this.joinQuery;
    queryBuilder.groupByQuery = this.groupByQuery;
    queryBuilder.orderByQuery = this.orderByQuery;
    queryBuilder.limitQuery = this.limitQuery;
    queryBuilder.offsetQuery = this.offsetQuery;
    queryBuilder.params = [...this.params];
    queryBuilder.relations = [...this.relations];
    return queryBuilder;
  }
  promisifyQuery(query, params) {
    return new Promise((resolve, reject) => {
      this.sqLiteConnection.all(query, params, (err, result) => {
        if (err) {
          reject(err);
        }
        if (!result) {
          resolve([]);
        }
        if (!Array.isArray(result)) {
          resolve([result]);
        }
        resolve(result);
      });
    });
  }
};

// src/sql/sqlite/sql_lite_model_manager.ts
var SqliteModelManager = class extends ModelManager {
  /**
   * Constructor for SqLiteModelManager class.
   *
   * @param {typeof Model} model - Model constructor.
   * @param {Pool} sqLiteConnection - sqlite connection.
   * @param {boolean} logs - Flag to enable or disable logging.
   */
  constructor(model, sqLiteConnection, logs, sqlDataSource) {
    super(model, logs, sqlDataSource);
    this.sqLiteConnection = sqLiteConnection;
    this.sqlModelManagerUtils = new SqlModelManagerUtils(
      "sqlite",
      sqLiteConnection
    );
  }
  /**
   * Find method to retrieve multiple records from the database based on the input conditions.
   *
   * @param {FindType} input - Optional query parameters for filtering, ordering, and pagination.
   * @returns Promise resolving to an array of models.
   */
  async find(input) {
    if (!input) {
      return await this.query().many();
    }
    const query = this.query();
    if (input.select) {
      query.select(...input.select);
    }
    if (input.relations) {
      input.relations.forEach((relation) => {
        query.with(relation);
      });
    }
    if (input.where) {
      Object.entries(input.where).forEach(([key, value2]) => {
        query.where(key, value2);
      });
    }
    if (input.orderBy) {
      Object.entries(input.orderBy).forEach(([key, value2]) => {
        query.orderBy(key, value2);
      });
    }
    if (input.limit) {
      query.limit(input.limit);
    }
    if (input.offset) {
      query.offset(input.offset);
    }
    if (input.groupBy) {
      query.groupBy(...input.groupBy);
    }
    return await query.many({ ignoreHooks: input.ignoreHooks || [] });
  }
  /**
   * Find a single record from the database based on the input conditions.
   *
   * @param {FindOneType} input - query parameters for filtering and selecting a single record.
   * @returns Promise resolving to a single model or null if not found.
   */
  async findOne(input) {
    const results = await this.find({
      ...input,
      limit: 1
    });
    if (!results.length) {
      return null;
    }
    return results[0];
  }
  /**
   * Find a single record by its PK from the database.
   *
   * @param {string | number | boolean} value - PK of the record to retrieve, hooks will not have any effect, since it's a direct query for the PK.
   * @returns Promise resolving to a single model or null if not found.
   */
  async findOneByPrimaryKey(value2) {
    if (!this.model.primaryKey) {
      throw new Error(
        "Model " + this.model.table + " has no primary key to be retrieved by"
      );
    }
    return await this.query().where(this.model.primaryKey, value2).one();
  }
  /**
   * Save a new model instance to the database.
   *
   * @param {Model} model - Model instance to be saved.
   * @param {SqliteTransaction} trx - SqliteTransaction to be used on the save operation.
   * @returns Promise resolving to the saved model or null if saving fails.
   */
  async insert(model) {
    this.model.beforeInsert(model);
    const { query, params } = this.sqlModelManagerUtils.parseInsert(
      model,
      this.model,
      this.sqlDataSource.getDbType()
    );
    log(query, this.logs, params);
    return await this.promisifyQuery(query, params, {
      isCreate: true,
      models: model
    });
  }
  /**
   * Create multiple model instances in the database.
   *
   * @param {Model} model - Model instance to be saved.
   * @param {SqliteTransaction} trx - SqliteTransaction to be used on the save operation.
   * @returns Promise resolving to an array of saved models or null if saving fails.
   */
  async insertMany(models) {
    models.forEach((model) => {
      this.model.beforeInsert(model);
    });
    const { query, params } = this.sqlModelManagerUtils.parseMassiveInsert(
      models,
      this.model,
      this.sqlDataSource.getDbType()
    );
    log(query, this.logs, params);
    return await this.promisifyQuery(query, params, {
      isInsertMany: true,
      models
    });
  }
  /**
   * Update an existing model instance in the database.
   * @param {Model} model - Model instance to be updated.
   * @param {SqliteTransaction} trx - SqliteTransaction to be used on the update operation.
   * @returns Promise resolving to the updated model or null if updating fails.
   */
  async updateRecord(model) {
    if (!this.model.primaryKey) {
      throw new Error(
        "Model " + this.model.table + " has no primary key to be updated, try save"
      );
    }
    const updateQuery = this.sqlModelManagerUtils.parseUpdate(
      model,
      this.model,
      this.sqlDataSource.getDbType()
    );
    log(updateQuery.query, this.logs, updateQuery.params);
    await this.promisifyQuery(updateQuery.query, updateQuery.params);
    return await this.findOneByPrimaryKey(
      model[this.model.primaryKey]
    );
  }
  /**
   * @description Delete a record from the database from the given model.
   *
   * @param {Model} model - Model to delete.
   * @param trx - SqliteTransaction to be used on the delete operation.
   * @returns Promise resolving to the deleted model or null if deleting fails.
   */
  async deleteRecord(model) {
    if (!this.model.primaryKey) {
      throw new Error(
        "Model " + this.model.table + " has no primary key to be deleted from"
      );
    }
    const { query, params } = this.sqlModelManagerUtils.parseDelete(
      this.model.table,
      this.model.primaryKey,
      model[this.model.primaryKey]
    );
    log(query, this.logs, params);
    await this.promisifyQuery(query, params);
    return model;
  }
  /**
   * Create and return a new instance of the Mysql_query_builder for building more complex SQL queries.
   *
   * @returns {MysqlQueryBuilder<Model>} - Instance of Mysql_query_builder.
   */
  query() {
    return new SqlLiteQueryBuilder(
      this.model,
      this.model.table,
      this.sqLiteConnection,
      this.logs,
      false,
      this.sqlDataSource
    );
  }
  promisifyQuery(query, params, options = {
    isCreate: false,
    isInsertMany: false,
    models: []
  }) {
    const primaryKeyName = this.model.primaryKey;
    if (options.isCreate || options.isInsertMany) {
      if (options.isCreate) {
        const table2 = this.model.table;
        const sqLiteConnection2 = this.sqLiteConnection;
        return new Promise((resolve, reject) => {
          this.sqLiteConnection.run(
            query,
            params,
            function(err) {
              if (err) {
                return reject(err);
              }
              const currentModel = options.models;
              const lastID = currentModel[primaryKeyName] || this.lastID;
              const selectQuery = `SELECT * FROM ${table2} WHERE ${primaryKeyName} = ?`;
              sqLiteConnection2.get(
                selectQuery,
                [lastID],
                (err2, row) => {
                  if (err2) {
                    return reject(err2);
                  }
                  resolve(row);
                }
              );
            }
          );
        });
      }
      if (!Array.isArray(options.models)) {
        throw new Error(
          "Models should be an array when massive creating on sqlite"
        );
      }
      const models = options.models;
      const table = this.model.table;
      const finalResult = [];
      const sqLiteConnection = this.sqLiteConnection;
      return new Promise(async (resolve, reject) => {
        for (const model of models) {
          try {
            const { query: query2, params: params2 } = this.sqlModelManagerUtils.parseInsert(
              model,
              this.model,
              this.sqlDataSource.getDbType()
            );
            await new Promise((resolve2, reject2) => {
              this.sqLiteConnection.run(query2, params2, function(err) {
                if (err) {
                  return reject2(err);
                }
                const lastID = model[primaryKeyName] || this.lastID;
                const selectQuery = `SELECT * FROM ${table} WHERE ${primaryKeyName} = ?`;
                sqLiteConnection.get(
                  selectQuery,
                  [lastID],
                  (err2, row) => {
                    if (err2) {
                      return reject2(err2);
                    }
                    finalResult.push(row);
                    resolve2();
                  }
                );
              });
            });
          } catch (err) {
            return reject(err);
          }
        }
        resolve(finalResult);
      });
    }
    return new Promise((resolve, reject) => {
      this.sqLiteConnection.all(query, params, (err, rows) => {
        if (err) {
          return reject(err);
        }
        resolve(rows);
      });
    });
  }
};

// src/sql/transactions/transaction.ts
init_cjs_shims();
var Transaction = class {
  constructor(sqlDataSource, logs) {
    this.sqlDataSource = sqlDataSource;
    this.sqlConnection = this.sqlDataSource.getCurrentConnection();
    this.isActive = false;
    this.logs = logs || this.sqlDataSource.logs || false;
  }
  async startTransaction() {
    try {
      switch (this.sqlDataSource.getDbType()) {
        case "mysql":
        case "mariadb":
          log(BEGIN_TRANSACTION, this.logs);
          await this.sqlConnection.beginTransaction();
          break;
        case "postgres":
          log(BEGIN_TRANSACTION, this.logs);
          await this.sqlConnection.query(
            BEGIN_TRANSACTION
          );
          break;
        case "sqlite":
          log(BEGIN_TRANSACTION, this.logs);
          this.sqlConnection.run(
            BEGIN_TRANSACTION,
            (err) => {
              if (err) {
                throw new Error(err.message);
              }
            }
          );
          break;
        default:
          throw new Error("Invalid database type while beginning transaction");
      }
      this.isActive = true;
    } catch (error) {
      await this.releaseConnection();
    }
  }
  async commit() {
    try {
      switch (this.sqlDataSource.getDbType()) {
        case "mysql":
        case "mariadb":
          log(COMMIT_TRANSACTION, this.logs);
          await this.sqlConnection.commit();
          break;
        case "postgres":
          log(COMMIT_TRANSACTION, this.logs);
          await this.sqlConnection.query(
            COMMIT_TRANSACTION
          );
          break;
        case "sqlite":
          log(COMMIT_TRANSACTION, this.logs);
          this.sqlConnection.run(
            COMMIT_TRANSACTION,
            (err) => {
              if (err) {
                throw new Error(err.message);
              }
            }
          );
          break;
        default:
          throw new Error("Invalid database type while committing transaction");
      }
      this.isActive = false;
    } catch (error) {
      throw error;
    } finally {
      await this.releaseConnection();
    }
  }
  async rollback() {
    try {
      switch (this.sqlDataSource.getDbType()) {
        case "mysql":
        case "mariadb":
          log(ROLLBACK_TRANSACTION, this.logs);
          await this.sqlConnection.rollback();
          break;
        case "postgres":
          log(ROLLBACK_TRANSACTION, this.logs);
          await this.sqlConnection.query(
            ROLLBACK_TRANSACTION
          );
          break;
        case "sqlite":
          log(ROLLBACK_TRANSACTION, this.logs);
          this.sqlConnection.run(
            ROLLBACK_TRANSACTION,
            (err) => {
              if (err) {
                throw new Error(err.message);
              }
            }
          );
          break;
        default:
          throw new Error(
            "Invalid database type while rolling back transaction"
          );
      }
      this.isActive = false;
    } finally {
      await this.releaseConnection();
    }
  }
  async releaseConnection() {
    switch (this.sqlDataSource.getDbType()) {
      case "mysql":
      case "mariadb":
        await this.sqlConnection.end();
        break;
      case "postgres":
        await this.sqlConnection.end();
        break;
      case "sqlite":
        this.sqlConnection.close();
        break;
      default:
        throw new Error("Invalid database type while releasing connection");
    }
  }
};

// src/sql/sql_data_source.ts
var _SqlDataSource = class _SqlDataSource extends DataSource {
  constructor(input) {
    super(input);
    this.isConnected = false;
  }
  getDbType() {
    return this.type;
  }
  /**
   * @description Connects to the database establishing a connection. If no connection details are provided, the default values from the env will be taken instead
   * @description The User input connection details will always come first
   */
  static async connect(input, cb) {
    const sqlDataSource = new this(input);
    const driver = await DriverFactory.getDriver(sqlDataSource.type);
    switch (sqlDataSource.type) {
      case "mysql":
      case "mariadb":
        const mysqlDriver = driver.client;
        sqlDataSource.sqlConnection = await mysqlDriver.createConnection({
          host: sqlDataSource.host,
          port: sqlDataSource.port,
          user: sqlDataSource.username,
          password: sqlDataSource.password,
          database: sqlDataSource.database,
          ...input?.mysqlOptions
        });
        break;
      case "postgres":
        const pgDriver = driver.client;
        sqlDataSource.sqlConnection = new pgDriver.Client({
          host: sqlDataSource.host,
          port: sqlDataSource.port,
          user: sqlDataSource.username,
          password: sqlDataSource.password,
          database: sqlDataSource.database,
          ...input?.pgOptions
        });
        await sqlDataSource.sqlConnection.connect();
        break;
      case "sqlite":
        const sqlite3 = driver.client;
        sqlDataSource.sqlConnection = new sqlite3.Database(
          sqlDataSource.database,
          sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
          (err) => {
            if (err) {
              throw new Error(`Error while connecting to sqlite: ${err}`);
            }
          }
        );
        break;
      default:
        throw new Error(`Unsupported data source type: ${sqlDataSource.type}`);
    }
    sqlDataSource.isConnected = true;
    _SqlDataSource.instance = sqlDataSource;
    cb?.();
    return sqlDataSource;
  }
  static getInstance() {
    if (!_SqlDataSource.instance) {
      throw new Error("sql database connection not established");
    }
    return _SqlDataSource.instance;
  }
  /**
   * @description Executes a callback function with the provided connection details using the main connection established with SqlDataSource.connect() method
   * @description The callback automatically commits or rollbacks the transaction based on the result of the callback
   * @description NOTE: trx must always be passed to single methods that are part of the transaction
   */
  static async useTransaction(cb, driverSpecificOptions) {
    const trx = await this.getInstance().startTransaction(
      driverSpecificOptions
    );
    try {
      await cb(trx).then(async () => {
        if (!trx.isActive) {
          return;
        }
        await trx.commit();
      });
    } catch (error) {
      if (!trx.isActive) {
        return;
      }
      await trx.rollback();
      throw error;
    }
  }
  /**
   * @description Executes a callback function with the provided connection details
   * @description The callback automatically commits or rollbacks the transaction based on the result of the callback
   * @description NOTE: trx must always be passed to single methods that are part of the transaction
   */
  async useTransaction(cb, driverSpecificOptions) {
    const trx = await this.startTransaction(driverSpecificOptions);
    try {
      await cb(trx).then(async () => {
        if (!trx.isActive) {
          return;
        }
        await trx.commit();
      });
    } catch (error) {
      if (!trx.isActive) {
        return;
      }
      await trx.rollback();
      throw error;
    }
  }
  /**
   * @description Starts a transaction on the database and returns the transaction object
   * @description This creates a new connection to the database, you can customize the connection details using the driverSpecificOptions
   */
  async startTransaction(driverSpecificOptions) {
    const sqlDataSource = new _SqlDataSource({
      type: this.type,
      host: this.host,
      port: this.port,
      username: this.username,
      password: this.password,
      database: this.database,
      logs: this.logs,
      ...driverSpecificOptions
    });
    await sqlDataSource.connectDriver();
    sqlDataSource.isConnected = true;
    const mysqlTrx = new Transaction(sqlDataSource, this.logs);
    await mysqlTrx.startTransaction();
    return mysqlTrx;
  }
  /**
   * @description Alias for startTransaction {Promise<Transaction>} trx
   */
  async beginTransaction(driverSpecificOptions) {
    return this.startTransaction(driverSpecificOptions);
  }
  /**
   * @description Alias for startTransaction {Promise<Transaction>} trx
   */
  async transaction(driverSpecificOptions) {
    return this.startTransaction(driverSpecificOptions);
  }
  /**
   * @description Returns model manager for the provided model
   */
  getModelManager(model) {
    if (!this.isConnected) {
      throw new Error("sql database connection not established");
    }
    switch (this.type) {
      case "mysql":
      case "mariadb":
        return new MysqlModelManager(
          this.type,
          model,
          this.sqlConnection,
          this.logs,
          this
        );
      case "postgres":
        return new PostgresModelManager(
          model,
          this.sqlConnection,
          this.logs,
          this
        );
      case "sqlite":
        return new SqliteModelManager(
          model,
          this.sqlConnection,
          this.logs,
          this
        );
      default:
        throw new Error(`Unsupported data source type: ${this.type}`);
    }
  }
  /**
   * @description Executes a callback function with the provided connection details
   */
  static async useConnection(connectionDetails, cb) {
    const customSqlInstance = new _SqlDataSource(connectionDetails);
    await customSqlInstance.connectDriver({
      mysqlOptions: connectionDetails.mysqlOptions,
      pgOptions: connectionDetails.pgOptions
    });
    customSqlInstance.isConnected = true;
    try {
      await cb(customSqlInstance).then(async () => {
        if (!customSqlInstance.isConnected) {
          return;
        }
        await customSqlInstance.closeConnection();
      });
    } catch (error) {
      if (customSqlInstance.isConnected) {
        await customSqlInstance.closeConnection();
      }
      throw error;
    }
  }
  /**
   * @description Returns the current connection {Promise<SqlConnectionType>} sqlConnection
   */
  getCurrentConnection() {
    return this.sqlConnection;
  }
  /**
   * @description Returns separate raw sql connection
   */
  async getRawConnection(driverSpecificOptions) {
    switch (this.type) {
      case "mysql":
      case "mariadb":
        const mysqlDriver = (await DriverFactory.getDriver("mysql")).client;
        return await mysqlDriver.createConnection({
          host: this.host,
          port: this.port,
          user: this.username,
          password: this.password,
          database: this.database,
          ...driverSpecificOptions?.mysqlOptions
        });
      case "postgres":
        const pg = (await DriverFactory.getDriver("postgres")).client;
        const client = new pg.Client({
          host: this.host,
          port: this.port,
          user: this.username,
          password: this.password,
          database: this.database,
          ...driverSpecificOptions?.pgOptions
        });
        await client.connect();
        return client;
      case "sqlite":
        const sqlite3 = (await DriverFactory.getDriver("sqlite")).client;
        return new sqlite3.Database(
          this.database,
          sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
          (err) => {
            if (err) {
              throw new Error(`Error while connecting to sqlite: ${err}`);
            }
          }
        );
      default:
        throw new Error(`Unsupported data source type: ${this.type}`);
    }
  }
  /**
   * @description Closes the connection to the database
   */
  async closeConnection() {
    if (!this.isConnected) {
      logger_default.warn("Connection already closed", this);
      return;
    }
    logger_default.warn("Closing connection", this);
    switch (this.type) {
      case "mysql":
      case "mariadb":
        await this.sqlConnection.end();
        this.isConnected = false;
        _SqlDataSource.instance = null;
        break;
      case "postgres":
        await this.sqlConnection.end();
        this.isConnected = false;
        _SqlDataSource.instance = null;
        break;
      case "sqlite":
        await new Promise((resolve, reject) => {
          this.sqlConnection.close((err) => {
            if (err) {
              reject(err);
            }
            resolve();
          });
        });
        this.isConnected = false;
        _SqlDataSource.instance = null;
        break;
      default:
        throw new Error(`Unsupported data source type: ${this.type}`);
    }
  }
  /**
   * @description Closes the main connection to the database established with SqlDataSource.connect() method
   */
  static async closeConnection() {
    const sqlDataSource = _SqlDataSource.getInstance();
    if (!sqlDataSource.isConnected) {
      logger_default.warn("Connection already closed", sqlDataSource);
      return;
    }
    logger_default.warn("Closing connection", sqlDataSource);
    switch (sqlDataSource.type) {
      case "mysql":
      case "mariadb":
        await sqlDataSource.sqlConnection.end();
        sqlDataSource.isConnected = false;
        _SqlDataSource.instance = null;
        break;
      case "postgres":
        await sqlDataSource.sqlConnection.end();
        sqlDataSource.isConnected = false;
        _SqlDataSource.instance = null;
        break;
      case "sqlite":
        await new Promise((resolve, reject) => {
          sqlDataSource.sqlConnection.close(
            (err) => {
              if (err) {
                reject(err);
              }
              resolve();
            }
          );
        });
        sqlDataSource.isConnected = false;
        _SqlDataSource.instance = null;
        break;
      default:
        throw new Error(`Unsupported data source type: ${sqlDataSource.type}`);
    }
  }
  /**
   * @description Disconnects the connection to the database
   * @alias closeConnection
   */
  async disconnect() {
    return this.closeConnection();
  }
  /**
   * @description Disconnects the main connection to the database established with SqlDataSource.connect() method
   * @alias closeMainConnection
   */
  static async disconnect() {
    return _SqlDataSource.closeConnection();
  }
  /**
   * @description Executes a raw query on the database
   */
  async rawQuery(query, params = []) {
    if (!this.isConnected) {
      throw new Error("sql database connection not established");
    }
    log(query, this.logs, params);
    switch (this.type) {
      case "mysql":
      case "mariadb":
        const [mysqlRows] = await this.sqlConnection.execute(query, params);
        return mysqlRows;
      case "postgres":
        const { rows } = await this.sqlConnection.query(
          query,
          params
        );
        return rows;
      case "sqlite":
        return new Promise((resolve, reject) => {
          this.sqlConnection.all(
            query,
            params,
            (err, rows2) => {
              if (err) {
                reject(err);
              }
              resolve(rows2);
            }
          );
        });
      default:
        throw new Error(`Unsupported data source type: ${this.type}`);
    }
  }
  /**
   * @description Executes a raw query on the database with the base connection created with SqlDataSource.connect() method
   */
  static async rawQuery(query, params = []) {
    const sqlDataSource = _SqlDataSource.getInstance();
    if (!sqlDataSource || !sqlDataSource.isConnected) {
      throw new Error("sql database connection not established");
    }
    log(query, _SqlDataSource.getInstance()?.logs ?? false, params);
    switch (sqlDataSource.type) {
      case "mysql":
      case "mariadb":
        const [mysqlRows] = await sqlDataSource.sqlConnection.execute(query, params);
        return mysqlRows;
      case "postgres":
        const { rows } = await sqlDataSource.sqlConnection.query(query, params);
        return rows;
      case "sqlite":
        return new Promise((resolve, reject) => {
          sqlDataSource.sqlConnection.all(
            query,
            params,
            (err, rows2) => {
              if (err) {
                reject(err);
              }
              resolve(rows2);
            }
          );
        });
      default:
        throw new Error(`Unsupported data source type: ${sqlDataSource.type}`);
    }
  }
  async connectDriver(driverSpecificOptions) {
    switch (this.type) {
      case "mysql":
      case "mariadb":
        const mysql = (await DriverFactory.getDriver("mysql")).client;
        this.sqlConnection = await mysql.createConnection({
          host: this.host,
          port: this.port,
          user: this.username,
          password: this.password,
          database: this.database,
          ...driverSpecificOptions?.mysqlOptions
        });
        break;
      case "postgres":
        const pg = (await DriverFactory.getDriver("postgres")).client;
        this.sqlConnection = new pg.Client({
          host: this.host,
          port: this.port,
          user: this.username,
          password: this.password,
          database: this.database,
          ...driverSpecificOptions?.pgOptions
        });
        await this.sqlConnection.connect();
        break;
      case "sqlite":
        const sqlite3 = (await DriverFactory.getDriver("sqlite")).client;
        this.sqlConnection = new sqlite3.Database(
          this.database,
          sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
          (err) => {
            if (err) {
              throw new Error(`Error while connecting to sqlite: ${err}`);
            }
          }
        );
        break;
      default:
        throw new Error(`Unsupported data source type: ${this.type}`);
    }
  }
};
_SqlDataSource.instance = null;
var SqlDataSource = _SqlDataSource;

// src/hysteria_cli/migration_utils.ts
init_cjs_shims();
var import_fs2 = __toESM(require("fs"));
var import_path2 = __toESM(require("path"));
var import_dotenv3 = __toESM(require("dotenv"));
import_dotenv3.default.config();
async function getMigrationTable(sqlConnection) {
  switch (process.env.DB_TYPE) {
    case "mariadb":
    case "mysql":
      const mysqlConnection = sqlConnection;
      await mysqlConnection.query(
        migration_templates_default.migrationTableTemplateMysql()
      );
      const result = await mysqlConnection.query(
        migration_templates_default.selectAllFromMigrationsTemplate()
      );
      return result[0];
    case "postgres":
      const pgConnection = sqlConnection;
      await pgConnection.query(migration_templates_default.migrationTableTemplatePg());
      const pgResult = await pgConnection.query(
        migration_templates_default.selectAllFromMigrationsTemplate()
      );
      return pgResult.rows;
    case "sqlite":
      await promisifySqliteQuery(
        migration_templates_default.migrationTableTemplateSQLite(),
        [],
        sqlConnection
      );
      const resultSqlite = await promisifySqliteQuery(
        migration_templates_default.selectAllFromMigrationsTemplate(),
        [],
        sqlConnection
      ) || [];
      return Array.isArray(resultSqlite) ? resultSqlite : [resultSqlite];
    default:
      throw new Error("Unsupported database type");
  }
}
async function getMigrations() {
  const migrationNames = findMigrationNames();
  const migrations = [];
  for (const migrationName of migrationNames) {
    const migrationModule = await findMigrationModule(migrationName);
    const migration = new migrationModule();
    migration.migrationName = migrationName;
    migrations.push(migration);
  }
  return migrations;
}
async function loadMigrationModule(absolutePath) {
  const isJs = import_path2.default.extname(absolutePath) === ".js";
  if (isJs) {
    const migrationModule2 = await import(absolutePath);
    return migrationModule2.default;
  }
  const tsNode = require_dist();
  tsNode.register({
    transpileOnly: true
  });
  const migrationModule = require(absolutePath);
  return migrationModule.default;
}
async function findMigrationModule(migrationName, migrationModulePath = process.env.MIGRATION_PATH ? process.env.MIGRATION_PATH + "/" + migrationName : "database/migrations/" + migrationName) {
  const migrationPath = process.cwd() + "/" + migrationModulePath;
  const migrationModule = await loadMigrationModule(migrationPath);
  if (!migrationModule) {
    throw new Error(
      "migrations module not found for migration: " + migrationName
    );
  }
  return migrationModule;
}
function findMigrationNames() {
  const currentUserDirectory = process.cwd();
  const migrationPath = import_path2.default.resolve(
    process.env.MIGRATION_PATH || "database/migrations"
  );
  const fullPathToMigrationPath = import_path2.default.resolve(
    currentUserDirectory,
    migrationPath
  );
  try {
    const migrationFiles = import_fs2.default.readdirSync(fullPathToMigrationPath);
    if (migrationFiles.length > 0) {
      return migrationFiles;
    }
    throw new Error(
      "No database migration files found on path: " + fullPathToMigrationPath
    );
  } catch (error) {
    throw new Error(
      "No database migration files found on path: " + fullPathToMigrationPath
    );
  }
}
async function promisifySqliteQuery(query, params, sqLiteConnection) {
  return new Promise((resolve, reject) => {
    sqLiteConnection.get(query, params, (err, result) => {
      if (err) {
        reject(err);
      }
      resolve(result);
    });
  });
}

// src/hysteria_cli/postgres/run_migration.ts
import_dotenv4.default.config();
async function runMigrationsPg(runUntil) {
  const sql = await SqlDataSource.connect();
  const sqlConnection = sql.getCurrentConnection();
  try {
    log(BEGIN_TRANSACTION, true);
    await sqlConnection.query(BEGIN_TRANSACTION);
    const migrationTable = await getMigrationTable(sqlConnection);
    const migrations = await getMigrations();
    const pendingMigrations = migrations.filter(
      (migration) => !migrationTable.map((table) => table.name).includes(migration.migrationName)
    );
    if (pendingMigrations.length === 0) {
      logger_default.info("No pending migrations.");
      await sql.closeConnection();
      process.exit(0);
    }
    if (runUntil) {
      const runUntilIndex = pendingMigrations.findIndex(
        (migration) => migration.migrationName === runUntil
      );
      if (runUntilIndex === -1) {
        throw new Error(`Migration ${runUntil} not found.`);
      }
      const filteredMigrations = pendingMigrations.slice(0, runUntilIndex + 1);
      const migrationController2 = new MigrationController(
        sql,
        sqlConnection,
        "postgres"
      );
      await migrationController2.upMigrations(filteredMigrations);
      log(COMMIT_TRANSACTION, true);
      await sqlConnection.query(COMMIT_TRANSACTION);
      return;
    }
    const migrationController = new MigrationController(
      sql,
      sqlConnection,
      "postgres"
    );
    await migrationController.upMigrations(pendingMigrations);
    log(COMMIT_TRANSACTION, true);
    await sqlConnection.query(COMMIT_TRANSACTION);
  } catch (error) {
    log(ROLLBACK_TRANSACTION, true);
    await sqlConnection.query(ROLLBACK_TRANSACTION);
    throw error;
  } finally {
    await sql.closeConnection();
  }
}

// src/hysteria_cli/mysql/run_migration.ts
init_cjs_shims();
var import_dotenv5 = __toESM(require("dotenv"));
import_dotenv5.default.config();
async function runMigrationsSql(runUntil) {
  const sql = await SqlDataSource.connect();
  const sqlConnection = sql.getCurrentConnection();
  try {
    log(BEGIN_TRANSACTION, true);
    await sqlConnection.beginTransaction();
    const migrationTable = await getMigrationTable(
      sqlConnection
    );
    const migrations = await getMigrations();
    const pendingMigrations = migrations.filter(
      (migration) => !migrationTable.map((table) => table.name).includes(migration.migrationName)
    );
    if (pendingMigrations.length === 0) {
      logger_default.info("No pending migrations.");
      await sql.closeConnection();
      process.exit(0);
    }
    if (runUntil) {
      const runUntilIndex = pendingMigrations.findIndex(
        (migration) => migration.migrationName === runUntil
      );
      if (runUntilIndex === -1) {
        throw new Error(`Migration ${runUntil} not found.`);
      }
      const filteredMigrations = pendingMigrations.slice(0, runUntilIndex + 1);
      const migrationController2 = new MigrationController(
        sql,
        sqlConnection,
        "mysql"
      );
      await migrationController2.upMigrations(filteredMigrations);
      log(COMMIT_TRANSACTION, true);
      await sqlConnection.commit();
      return;
    }
    const migrationController = new MigrationController(
      sql,
      sqlConnection,
      "mysql"
    );
    await migrationController.upMigrations(pendingMigrations);
    log(COMMIT_TRANSACTION, true);
    await sqlConnection.commit();
  } catch (error) {
    log(ROLLBACK_TRANSACTION, true);
    await sqlConnection.rollback();
    throw error;
  } finally {
    await sql.closeConnection();
  }
}

// src/hysteria_cli/sqlite/run_migration.ts
init_cjs_shims();
var import_dotenv6 = __toESM(require("dotenv"));
import_dotenv6.default.config();
async function runMigrationsSQLite(runUntil) {
  const sql = await SqlDataSource.connect();
  const sqlConnection = sql.getCurrentConnection();
  try {
    const migrationTable = await getMigrationTable(sqlConnection) || [];
    const migrations = await getMigrations();
    const pendingMigrations = migrations.filter(
      (migration) => !migrationTable.map((table) => table.name).includes(migration.migrationName)
    );
    if (pendingMigrations.length === 0) {
      logger_default.info("No pending migrations.");
      await sql.closeConnection();
      process.exit(0);
    }
    if (runUntil) {
      const runUntilIndex = pendingMigrations.findIndex(
        (migration) => migration.migrationName === runUntil
      );
      if (runUntilIndex === -1) {
        throw new Error(`Migration ${runUntil} not found.`);
      }
      const filteredMigrations = pendingMigrations.slice(0, runUntilIndex + 1);
      const migrationController2 = new MigrationController(
        sql,
        sqlConnection,
        "sqlite"
      );
      await migrationController2.upMigrations(filteredMigrations);
    }
    const migrationController = new MigrationController(
      sql,
      sqlConnection,
      "sqlite"
    );
    await migrationController.upMigrations(pendingMigrations);
  } finally {
    await sql.closeConnection();
  }
}

// src/hysteria_cli/migration_run_connector.ts
import_dotenv7.default.config();
async function runMigrationsConnector(runUntil) {
  const databaseType = process.env.DB_TYPE;
  if (!databaseType) {
    throw new Error("Run migrations error: DB_TYPE env not set");
  }
  logger_default.info(`Running migrations for ${databaseType}`);
  switch (databaseType) {
    case "mariadb":
    case "mysql":
      await runMigrationsSql(runUntil);
      break;
    case "postgres":
      await runMigrationsPg(runUntil);
      break;
    case "sqlite":
      await runMigrationsSQLite(runUntil);
      break;
    default:
      throw new Error(
        "Invalid database type, must be mysql, postgres or sqlite, got: " + databaseType
      );
  }
  logger_default.info("Migrations ran successfully");
}

// src/hysteria_cli/migration_rollback_connector.ts
init_cjs_shims();
var import_dotenv11 = __toESM(require("dotenv"));

// src/hysteria_cli/mysql/rollback_migration.ts
init_cjs_shims();
var import_dotenv8 = __toESM(require("dotenv"));
import_dotenv8.default.config();
async function migrationRollBackSql(rollBackUntil) {
  const sql = await SqlDataSource.connect();
  const sqlConnection = sql.getCurrentConnection();
  try {
    log(BEGIN_TRANSACTION, true);
    await sqlConnection.beginTransaction();
    const migrationTable = await getMigrationTable(sqlConnection);
    const migrations = await getMigrations();
    const tableMigrations = migrationTable.map((migration) => migration.name);
    const pendingMigrations = migrations.filter(
      (migration) => tableMigrations.includes(migration.migrationName)
    );
    if (pendingMigrations.length === 0) {
      logger_default.info("No pending migrations.");
      await sql.closeConnection();
      process.exit(0);
    }
    if (rollBackUntil) {
      const rollBackUntilIndex = pendingMigrations.findIndex(
        (migration) => migration.migrationName === rollBackUntil
      );
      if (rollBackUntilIndex === -1) {
        throw new Error(`Migration ${rollBackUntil} not found.`);
      }
      const filteredMigrations = pendingMigrations.slice(rollBackUntilIndex);
      const migrationController2 = new MigrationController(
        sql,
        sqlConnection,
        "mysql"
      );
      await migrationController2.downMigrations(filteredMigrations);
      log(COMMIT_TRANSACTION, true);
      await sqlConnection.commit();
      return;
    }
    const migrationController = new MigrationController(
      sql,
      sqlConnection,
      "mysql"
    );
    await migrationController.downMigrations(pendingMigrations);
    log(COMMIT_TRANSACTION, true);
    await sqlConnection.commit();
  } catch (error) {
    log(ROLLBACK_TRANSACTION, true);
    await sqlConnection.rollback();
    throw error;
  } finally {
    await sql.closeConnection();
  }
}

// src/hysteria_cli/postgres/rollback_migration.ts
init_cjs_shims();
var import_dotenv9 = __toESM(require("dotenv"));
import_dotenv9.default.config();
async function migrationRollBackPg(rollBackUntil) {
  const sql = await SqlDataSource.connect();
  const sqlConnection = sql.getCurrentConnection();
  try {
    const migrationTable = await getMigrationTable(sqlConnection);
    const migrations = await getMigrations();
    const tableMigrations = migrationTable.map((migration) => migration.name);
    const pendingMigrations = migrations.filter(
      (migration) => tableMigrations.includes(migration.migrationName)
    );
    if (pendingMigrations.length === 0) {
      logger_default.info("No pending migrations.");
      await sql.closeConnection();
      process.exit(0);
    }
    if (rollBackUntil) {
      const rollBackUntilIndex = pendingMigrations.findIndex(
        (migration) => migration.migrationName === rollBackUntil
      );
      if (rollBackUntilIndex === -1) {
        throw new Error(`Migration ${rollBackUntil} not found.`);
      }
      const filteredMigrations = pendingMigrations.slice(rollBackUntilIndex);
      const migrationController2 = new MigrationController(
        sql,
        sqlConnection,
        "postgres"
      );
      log(BEGIN_TRANSACTION, true);
      await sqlConnection.query(BEGIN_TRANSACTION);
      await migrationController2.downMigrations(filteredMigrations);
      await sqlConnection.query(COMMIT_TRANSACTION);
      return;
    }
    const migrationController = new MigrationController(
      sql,
      sqlConnection,
      "postgres"
    );
    log(BEGIN_TRANSACTION, true);
    await sqlConnection.query(BEGIN_TRANSACTION);
    await migrationController.downMigrations(pendingMigrations);
    log(COMMIT_TRANSACTION, true);
    await sqlConnection.query(COMMIT_TRANSACTION);
  } catch (error) {
    log(ROLLBACK_TRANSACTION, true);
    await sqlConnection.query(ROLLBACK_TRANSACTION);
    throw error;
  } finally {
    await sql.closeConnection();
  }
}

// src/hysteria_cli/sqlite/rollback_migration.ts
init_cjs_shims();
var import_dotenv10 = __toESM(require("dotenv"));
import_dotenv10.default.config();
async function migrationRollBackSqlite(rollBackUntil) {
  const sql = await SqlDataSource.connect();
  const sqlConnection = sql.getCurrentConnection();
  try {
    const migrationTable = await getMigrationTable(sqlConnection) || [];
    const migrations = await getMigrations();
    const tableMigrations = migrationTable.map((migration) => migration.name);
    const pendingMigrations = migrations.filter(
      (migration) => tableMigrations.includes(migration.migrationName)
    );
    if (pendingMigrations.length === 0) {
      logger_default.info("No pending migrations.");
      await sql.closeConnection();
      process.exit(0);
    }
    if (rollBackUntil) {
      const rollBackUntilIndex = pendingMigrations.findIndex(
        (migration) => migration.migrationName === rollBackUntil
      );
      if (rollBackUntilIndex === -1) {
        throw new Error(`Migration ${rollBackUntil} not found.`);
      }
      const filteredMigrations = pendingMigrations.slice(rollBackUntilIndex);
      const migrationController2 = new MigrationController(
        sql,
        sqlConnection,
        "sqlite"
      );
      await migrationController2.downMigrations(filteredMigrations);
      return;
    }
    const migrationController = new MigrationController(
      sql,
      sqlConnection,
      "sqlite"
    );
    await migrationController.downMigrations(pendingMigrations);
  } finally {
    await sql.closeConnection();
  }
}

// src/hysteria_cli/migration_rollback_connector.ts
import_dotenv11.default.config();
async function rollbackMigrationConnector(rollBackUntil) {
  const databaseType = process.env.DB_TYPE;
  logger_default.info("Rolling back migrations for database type: " + databaseType);
  switch (databaseType) {
    case "mariadb":
    case "mysql":
      await migrationRollBackSql(rollBackUntil);
      break;
    case "postgres":
      await migrationRollBackPg(rollBackUntil);
      break;
    case "sqlite":
      await migrationRollBackSqlite(rollBackUntil);
      break;
    default:
      throw new Error(
        "Invalid database type, must be mysql or mysql, postgres, mariadb, sqlite, got: " + databaseType
      );
  }
}

// src/cli.ts
var program = new import_commander.Command();
program.command("create:migration <name>").description(
  "Create a new migration file, standard folder is database/migrations from the current directory you are now, you can change it in the env MIGRATION_PATH"
).option(
  "-j, --javascript",
  "Generate a javascript file instead of a default typescript one",
  false
).action((name, option) => {
  if (!name) {
    console.error("Error: migrations name is required.");
    process.exit(1);
  }
  migrationCreateConnector(name, option.javascript);
});
program.command("run:migrations [runUntil]").description(
  "Run pending migrations, if runUntil is provided, it will run all migrations until the provided migration name"
).action(async (runUntil) => {
  await runMigrationsConnector(runUntil);
});
program.command("rollback:migrations [rollbackUntil]").description(
  "Rollbacks every migration that has been run, if rollbackUntil is provided, it will rollback all migrations until the provided migration name"
).action(async (rollbackUntil) => {
  await rollbackMigrationConnector(rollbackUntil);
});
program.command("refresh:migrations").description(
  "Rollbacks every migration that has been run and then run the migrations"
).action(async () => {
  await rollbackMigrationConnector();
  await runMigrationsConnector();
});
program.parse(process.argv);
//# sourceMappingURL=cli.js.map