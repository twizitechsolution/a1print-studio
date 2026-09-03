import { firebaseCloudDb } from '../config/firebase';

export interface OutboxJob {
  id: string;
  collectionName: 'products' | 'orders' | 'categories' | 'deleted_products' | 'store_settings';
  recordId: string;
  operation: 'create' | 'update' | 'soft_delete';
  payload: any;
  timestamp: string;
  retryCount: number;
  lastError?: string;
}

export interface AuditLogRecord {
  id: string;
  action: 'CREATE' | 'UPDATE' | 'SOFT_DELETE' | 'RESTORE' | 'SYNC_FLUSH';
  entityType: 'product' | 'order' | 'category' | 'setting';
  entityId: string;
  performedBy: string;
  timestamp: string;
  beforeState?: any;
  afterState?: any;
}

const OUTBOX_STORAGE_KEY = 'a1print_outbox_v1';
const AUDIT_LOG_KEY = 'a1print_audit_logs_v1';

// Read all pending jobs from persistent outbox queue
export function getStoredOutboxJobs(): OutboxJob[] {
  try {
    const raw = localStorage.getItem(OUTBOX_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
}

// Save outbox jobs to persistent storage
export function saveStoredOutboxJobs(jobs: OutboxJob[]) {
  try {
    localStorage.setItem(OUTBOX_STORAGE_KEY, JSON.stringify(jobs));
  } catch (e) {}
}

// Push a new write-ahead job onto the persistent outbox
export function enqueueOutboxJob(
  collectionName: OutboxJob['collectionName'],
  recordId: string,
  operation: OutboxJob['operation'],
  payload: any
): OutboxJob {
  const jobs = getStoredOutboxJobs();
  
  // Prepare payload with optimistic versioning & syncStatus
  const now = new Date().toISOString();
  const currentVersion = (payload && typeof payload.version === 'number') ? payload.version + 1 : 1;

  const enrichedPayload = {
    ...payload,
    id: recordId,
    updatedAt: now,
    version: currentVersion,
    syncStatus: 'pending',
    lastSyncedAt: payload.lastSyncedAt || null,
  };

  if (!enrichedPayload.createdAt) {
    enrichedPayload.createdAt = now;
  }

  // Remove duplicate pending jobs for the same record ID to keep queue lean & atomic
  const filtered = jobs.filter((j) => !(j.collectionName === collectionName && j.recordId === recordId));

  const job: OutboxJob = {
    id: `job-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    collectionName,
    recordId,
    operation,
    payload: enrichedPayload,
    timestamp: now,
    retryCount: 0,
  };

  filtered.push(job);
  saveStoredOutboxJobs(filtered);
  return job;
}

// Write Audit Log for full administrative accountability
export async function writeAuditLog(
  action: AuditLogRecord['action'],
  entityType: AuditLogRecord['entityType'],
  entityId: string,
  performedBy: string = 'Admin User',
  beforeState?: any,
  afterState?: any
) {
  const now = new Date().toISOString();
  const logItem: AuditLogRecord = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    action,
    entityType,
    entityId,
    performedBy,
    timestamp: now,
    beforeState: beforeState ? JSON.stringify(beforeState).substring(0, 500) : null,
    afterState: afterState ? JSON.stringify(afterState).substring(0, 500) : null,
  };

  // 1. Save to local audit log archive
  try {
    const raw = localStorage.getItem(AUDIT_LOG_KEY);
    const existing: AuditLogRecord[] = raw ? JSON.parse(raw) : [];
    existing.unshift(logItem);
    localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(existing.slice(0, 200)));
  } catch (e) {}

  // 2. Push asynchronously to Cloud Firestore audit_logs collection
  try {
    await firebaseCloudDb.setDocument('audit_logs', logItem.id, logItem);
  } catch (e) {}
}

// Flush all outbox jobs: MUST run BEFORE cloud pulling to guarantee local writes are never overwritten!
let isFlushingOutbox = false;

export async function flushOutboxQueue(): Promise<{ processed: number; failed: number }> {
  if (isFlushingOutbox) return { processed: 0, failed: 0 };
  isFlushingOutbox = true;

  const jobs = getStoredOutboxJobs();
  if (jobs.length === 0) {
    isFlushingOutbox = false;
    return { processed: 0, failed: 0 };
  }

  let processedCount = 0;
  let failedCount = 0;
  const remainingJobs: OutboxJob[] = [];

  for (const job of jobs) {
    try {
      const now = new Date().toISOString();
      const syncedPayload = {
        ...job.payload,
        syncStatus: 'synced',
        lastSyncedAt: now,
      };

      const success = await firebaseCloudDb.setDocument(job.collectionName, job.recordId, syncedPayload);
      if (success) {
        processedCount++;
        // Write audit log for flushed sync
        writeAuditLog('SYNC_FLUSH', job.collectionName === 'products' ? 'product' : 'order', job.recordId, 'Outbox Worker', null, syncedPayload);
      } else {
        failedCount++;
        remainingJobs.push({
          ...job,
          retryCount: job.retryCount + 1,
          lastError: 'Server response rejected write',
        });
      }
    } catch (err: any) {
      failedCount++;
      remainingJobs.push({
        ...job,
        retryCount: job.retryCount + 1,
        lastError: err.message || 'Network exception during outbox flush',
      });
    }
  }

  saveStoredOutboxJobs(remainingJobs);
  isFlushingOutbox = false;
  return { processed: processedCount, failed: failedCount };
}
