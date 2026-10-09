export interface AuditEntry {
  id?: string;
  entityType: 'media' | 'service' | 'service_category' | 'booking_form_config' | string;
  entityId: string;
  action: string;
  actorAdmin?: string;
  timestamp?: string;
  summary?: any;
}

export async function recordAuditEvent(
  db: any,
  entry: {
    entityType: string;
    entityId: string;
    action: string;
    actorAdmin?: string;
    summary?: any;
  }
): Promise<void> {
  if (!db) return;
  try {
    const id = `audit-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const actor = entry.actorAdmin || 'admin';
    const summaryJson = entry.summary ? JSON.stringify(entry.summary) : null;

    await db
      .prepare(
        `INSERT INTO audit_log (id, entityType, entityId, action, actorAdmin, timestamp, summary)
         VALUES (?, ?, ?, ?, ?, datetime('now'), ?)`
      )
      .bind(id, entry.entityType, entry.entityId, entry.action, actor, summaryJson)
      .run();
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}
