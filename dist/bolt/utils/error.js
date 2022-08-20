"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorCodes = void 0;
var ErrorCodes;
(function (ErrorCodes) {
    ErrorCodes[ErrorCodes["BAD_REQUEST"] = 400] = "BAD_REQUEST";
    ErrorCodes[ErrorCodes["INTERNAL_SERVER_ERROR"] = 500] = "INTERNAL_SERVER_ERROR";
    ErrorCodes[ErrorCodes["UNAUTHORISED"] = 401] = "UNAUTHORISED";
    ErrorCodes[ErrorCodes["NOT_FOUND"] = 404] = "NOT_FOUND";
})(ErrorCodes = exports.ErrorCodes || (exports.ErrorCodes = {}));
class APIError extends Error {
    constructor(errorMessage, statusCode) {
        super(errorMessage);
        this.errorMessage = errorMessage;
        this.statusCode = statusCode;
        console.error(`[BOLT] message: ${errorMessage}, stack: ${this.stack || ""}`);
    }
}
exports.default = APIError;
//# sourceMappingURL=error.js.map