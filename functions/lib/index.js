"use strict";
/**
 * Firebase Cloud Functions Entry Point
 * Sia Moon Property Management - Job Assignment Notifications
 */
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
exports.healthCheck = exports.cleanupExpiredNotifications = exports.onNotificationAcknowledged = exports.onJobAssigned = void 0;
const functions = __importStar(require("firebase-functions"));
// Import job notification functions
const jobNotifications_1 = require("./jobNotifications");
Object.defineProperty(exports, "onJobAssigned", { enumerable: true, get: function () { return jobNotifications_1.onJobAssigned; } });
Object.defineProperty(exports, "onNotificationAcknowledged", { enumerable: true, get: function () { return jobNotifications_1.onNotificationAcknowledged; } });
Object.defineProperty(exports, "cleanupExpiredNotifications", { enumerable: true, get: function () { return jobNotifications_1.cleanupExpiredNotifications; } });
// Health check function
exports.healthCheck = functions.https.onRequest((request, response) => {
    response.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        functions: [
            'onJobAssigned',
            'onNotificationAcknowledged',
            'cleanupExpiredNotifications'
        ]
    });
});
// Configure function settings
functions.logger.info('🚀 Sia Moon Job Notification Functions initialized');
//# sourceMappingURL=index.js.map