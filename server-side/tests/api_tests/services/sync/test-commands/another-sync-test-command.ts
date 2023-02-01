import { ADALTableService } from "../../resource_management/adal_table.service"
import { BaseSyncCommand } from "./base-sync-command"

export class AnotherSyncTestCommand extends BaseSyncCommand {
    async pushData(adalService: ADALTableService): Promise<any> {
        
        const data = this.syncAdalService.generateFieldsData(2,4)
        await adalService.upsertRecord(data)
    }
    
  }