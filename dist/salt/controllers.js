"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.linuxScan = void 0;
const linuxScan = async (_req, res) => {
    try {
        return res.status(200).json({
            status: 200,
            message: "Success",
            data: null,
        });
    }
    catch (error) {
        console.error("[salt:linuxScan]", error);
        return res.status(400).json({
            status: 400,
            message: "Error occured while adding notification",
            data: null,
        });
    }
};
exports.linuxScan = linuxScan;
//# sourceMappingURL=controllers.js.map