"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.select = exports.getSingleSelector = exports.getMultiSelector = exports.optimize = exports.common = void 0;
const select_1 = require("./select");
exports.common = __importStar(require("./common"));
var optimize_1 = require("./optimize");
Object.defineProperty(exports, "optimize", { enumerable: true, get: function () { return optimize_1.optimize; } });
var select_2 = require("./select");
Object.defineProperty(exports, "getMultiSelector", { enumerable: true, get: function () { return select_2.getMultiSelector; } });
Object.defineProperty(exports, "getSingleSelector", { enumerable: true, get: function () { return select_2.getSingleSelector; } });
exports.select = select_1.getQuerySelector;
// eslint-disable-next-line import/no-default-export
exports.default = select_1.getQuerySelector;
//# sourceMappingURL=index.js.map