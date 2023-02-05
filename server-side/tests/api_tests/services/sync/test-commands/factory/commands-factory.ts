import { SchemaExistsCommand } from "../schema-exists-command";
import { TestCommand } from "../base-command";
import { FutureDateCommand } from "../future-date-command";
import { SyncAdalService } from "../../services/sync-adal-service";
import { CleanupCommand } from "../cleanup-command";
import { CleanRebuild } from "../clean-rebuild-command";
import { Client } from "@pepperi-addons/debug-server/dist";

export class CommandFactory {
  // a map of command types to command classes
  private static commandMap = {
    CleanRebuild: CleanRebuild,
    SchemaExistsTest: SchemaExistsCommand,
    FutureDateCommand: FutureDateCommand,
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