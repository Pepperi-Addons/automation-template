import { SyncService } from "../../services/sync-tests-service";
import { AnotherSyncTestCommand } from "../another-sync-test-command";
import { SchemaExistsCommand } from "../schema-exists-command";
import { TestCommand } from "../base-command";
import { AuditLogService } from "../../services/audit-log-service";
import { SyncAdalService } from "../../services/sync-adal-service";
import { CleanupCommand } from "../cleanup-command";
import { CleanRebuild } from "../clean-rebuild-command";
import { Client } from "@pepperi-addons/debug-server/dist";

export class CommandFactory {
  // a map of command types to command classes
  private static commandMap = {
    CleanRebuild: CleanRebuild,
    SchemaExistsTest: SchemaExistsCommand,
    CleanupCommand: CleanupCommand,
  };

  static createCommand(type: string, syncAdalService: SyncAdalService, client: Client): TestCommand {
    const CommandClass = CommandFactory.commandMap[type];
    if (!CommandClass) {
      throw new Error('Unknown command type');
    }
    return new CommandClass(syncAdalService, client);
  }
}