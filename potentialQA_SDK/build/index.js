"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
var general_service_1 = require("./server_side/general.service");
exports.GeneralService = general_service_1.GeneralService;
__export(require("./server_side/adal.service"));
var mapper_1 = require("./mapper");
exports.JsonMapper = mapper_1.JsonMapper;
var tester_1 = require("./tester");
exports.Tester = tester_1.Tester;
//# sourceMappingURL=index.js.map