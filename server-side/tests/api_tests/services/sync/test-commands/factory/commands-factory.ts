import { SyncTestService } from "../../services/sync-tests-service";
import { AnotherSyncTestCommand } from "../another-sync-test-command";
import { BaseSyncCommand } from "../base-sync-command";
import { TestCommand } from "../base-command";
import { FutureDateCommand } from "../future-date-command";
import { AuditLogService } from "../../services/audit-log-service";
import { SyncAdalService } from "../../services/sync-adal-service";

export class CommandFactory {
    static createCommand(type: string, syncTestService: SyncTestService, auditLogService: AuditLogService, syncAdalService: SyncAdalService): TestCommand {
      switch (type) {
        case 'BaseSyncTest':
          return new BaseSyncCommand(syncTestService,auditLogService,syncAdalService);
        case 'FutureDateTest':
          return new FutureDateCommand(syncTestService,auditLogService,syncAdalService);
        default:
          throw new Error('Unknown command type');
      }
    }
  } 