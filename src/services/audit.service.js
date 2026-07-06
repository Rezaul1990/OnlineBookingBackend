import { AuditLog } from "../models/auditLog.model.js";

export const createAuditLog = async ({ req, actorId, action, module, targetType = "", targetId = null, oldValue = null, newValue = null }) => {
  await AuditLog.create({
    actorId,
    action,
    module,
    targetType,
    targetId,
    oldValue,
    newValue,
    ipAddress: req?.ip || "",
    userAgent: req?.get?.("user-agent") || ""
  });
};
