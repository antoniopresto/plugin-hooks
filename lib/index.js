/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	// The require scope
/******/ 	var __nccwpck_require__ = {};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__nccwpck_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__nccwpck_require__.o(definition, key) && !__nccwpck_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__nccwpck_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__nccwpck_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";/************************************************************************/
var __webpack_exports__ = {};
// ESM COMPAT FLAG
__nccwpck_require__.r(__webpack_exports__);

// EXPORTS
__nccwpck_require__.d(__webpack_exports__, {
  "parallel": () => (/* reexport */ parallel),
  "waterfall": () => (/* reexport */ waterfall)
});

;// CONCATENATED MODULE: ./parallelHook.ts
var parallel = function () {
    var listeners = [];
    var register = function (handler) {
        if (typeof handler !== 'function') {
            throw new Error("\"" + typeof handler + "\" is not a valid handler type");
        }
        listeners.push(handler);
    };
    var exec = function (param, context) {
        listeners.forEach(function (middleware) {
            middleware(param, context);
        });
    };
    return { register: register, exec: exec, listeners: listeners };
};

;// CONCATENATED MODULE: ./waterfallHook.ts
var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (undefined && undefined.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var waterfall = function () {
    var _this = this;
    var listeners = [];
    var register = function (middleware) {
        if (typeof middleware !== 'function') {
            throw new Error("\"" + typeof middleware + "\" is not a valid middleware type");
        }
        listeners.push(middleware);
    };
    var exec = function (initial, context) { return __awaiter(_this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            return [2 /*return*/, listeners.reduce(function (prev, next) { return __awaiter(_this, void 0, void 0, function () {
                    var middlewareResult, _a;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0:
                                _a = next;
                                return [4 /*yield*/, prev];
                            case 1: return [4 /*yield*/, _a.apply(void 0, [_b.sent(), context])];
                            case 2:
                                middlewareResult = _b.sent();
                                if (typeof middlewareResult === 'undefined')
                                    return [2 /*return*/, prev];
                                return [2 /*return*/, middlewareResult];
                        }
                    });
                }); }, Promise.resolve(initial))];
        });
    }); };
    return { register: register, exec: exec, listeners: listeners };
};

;// CONCATENATED MODULE: ./index.ts
// === Waterfall hooks ===
// returns an object with two functions `payload.exec` and` payload.register`
// the register function accepts as second parameter a middleware function that
// will be executed whenever the `payload.exec` function is executed
// if the callback returns something other than undefined, this value will be passed to the next registered middleware
// Parallel Hooks =====
// as waterfall hook, but all the callbacks provided by payload.register are executed in parallel
// and the return of each callback will be ignored by the next registered callback



module.exports = __webpack_exports__;
/******/ })()
;