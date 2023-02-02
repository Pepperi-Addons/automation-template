import { SyncService } from "../../services/sync-tests-service";
import { AnotherSyncTestCommand } from "../another-sync-test-command";
import { SchemaExistsCommand } from "../schema-exists-command";
import { TestCommand } from "../base-command";
import { FutureDateCommand } from "../future-date-command";
import { AuditLogService } from "../../services/audit-log-service";
import { SyncAdalService } from "../../services/sync-adal-service";
import { CleanupCommand } from "../cleanup-command";
import { CleanRebuild } from "../clean-rebuild-command";

export class CommandFactory {
    static createCommand(type: string, syncService: SyncService, auditLogService: AuditLogService, syncAdalService: SyncAdalService): TestCommand {
      switch (type) {
        case 'CleanRebuild':
            return new CleanRebuild(syncService,auditLogService,syncAdalService);
        case 'SchemaExistsTest':
          return new SchemaExistsCommand(syncService,auditLogService,syncAdalService);
        case 'FutureDateTest':
          return new FutureDateCommand(syncService,auditLogService,syncAdalService);
        case 'CleanupCommand':
          return new CleanupCommand(syncService,auditLogService,syncAdalService);
        default:
          throw new Error('Unknown command type');
      }
    }
  } 