import { ADALTableService } from "../../resource_management/adal_table.service"
import { SchemaExistsCommand } from "./schema-exists-command"

export class AnotherSyncTestCommand extends SchemaExistsCommand {
    async pushData(adalService: ADALTableService): Promise<any> {
        
        const data = this.syncAdalService.generateFieldsData(2,4)
        await adalService.upsertRecord(data)
    }
    
  }