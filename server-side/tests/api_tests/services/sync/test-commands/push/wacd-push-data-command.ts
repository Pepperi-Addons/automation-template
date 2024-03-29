import { ADALTableService } from "../../../resource_management/adal_table.service"
import { GlobalSyncService } from "../../services/global-sync-service"
import { PushDataCommand } from "./push-data-command"

export class WACDPushDataCommand extends PushDataCommand{

    async pushData(adalService: ADALTableService): Promise<any> {
         // create relation between DIMX and the created shchema
         await this.syncDimxService.createRelation(this.resourceManagerService, this.firstSchemaName)
         await this.syncDimxService.createRelation(this.resourceManagerService, this.secondSchemaName)
        // pushing data using sync push endpoint
        const data = this.syncAdalService.generateFieldsData(1, 1 ,this.numberOfRecords)
        const wacdDataToPush = [
            ...data.map((item) => {
                return {
                    "MapDataWrntyID": GlobalSyncService.hashCode(this.syncAdalService.addonUUID + this.firstSchemaName),
                    "SecondaryKey": item.Key,
                    "Values": JSON.stringify(item)
                }
            }),
            ...data.map((item) => {
                return {
                    "MapDataWrntyID": GlobalSyncService.hashCode(this.syncAdalService.addonUUID + this.secondSchemaName),
                    "SecondaryKey": item.Key,
                    "Values": JSON.stringify(item)
                }
            })]

        await this.syncService.push(wacdDataToPush, true)
        await GlobalSyncService.sleep(this.TIME_TO_SLEEP_FOR_NEBULA)
    }     
}