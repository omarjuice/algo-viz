"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const array_1 = __importDefault(require("./array"));
const sll_1 = __importDefault(require("./sll"));
const dll_1 = __importDefault(require("./dll"));
const btree_1 = __importDefault(require("./btree"));
const bst_1 = __importDefault(require("./bst"));
class Viz {
}
Viz.array = array_1.default;
Viz.SLL = sll_1.default;
Viz.DLL = dll_1.default;
Viz.BTree = btree_1.default;
Viz.BST = bst_1.default;
exports.default = Viz;
