"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClietntsIds = void 0;
function getClietntsIds(currentUserId, users) {
    return users.map(user => user.id).filter(id => id !== currentUserId);
}
exports.getClietntsIds = getClietntsIds;
//# sourceMappingURL=utils.js.map