import { GlobalSyncService } from "../../services/global-sync-service";
import { PushDataCommand } from "./push-data-command";

export class PushDataTimeCommand extends PushDataCommand {
    numberOfRecords = 50;

    async test(syncRes: any, syncData:any, expect: Chai.ExpectStatic): Promise<any> {
        // average time of pushing 50 records is 3300 ms, validataing that push time is not more than 3500 ms
        expect(this.pushTime).to.be.a('Number').and.to.be.lessThanOrEqual(3500)
    }

}