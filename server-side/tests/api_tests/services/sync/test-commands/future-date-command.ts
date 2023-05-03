import { BaseCommand } from "./base-command";

// Passing a future time to sync should not return data,
// the result shuold be sync is up to date and should return in no more than 5 Seconds
export class FutureDateCommand extends BaseCommand{
    private OPTIMAL_FUTURE_SYNC_TIME : number = 5000
    setupSchemes(): Promise<any> {
        return Promise.resolve(undefined);
    }
    pushData(): Promise<any> {
        return Promise.resolve(undefined);
    }
    async sync(): Promise<ObjectToTest> {
        let dateTime = new Date();
        dateTime.setFullYear(dateTime.getFullYear()+1)
        const t1 = performance.now()
        let auditLog = await this.syncService.pull({
            ModificationDateTime: dateTime.toISOString(),
        }, false, false, false)
        const t2 = performance.now()
        return {syncResult: auditLog, syncTime:t2-t1}
    }
    processSyncResponse(syncRes: any): Promise<any> {
        // in this test we do not validate sync data, only sync response
        return Promise.resolve(undefined)
    }
    async test(syncRes: ObjectToTest, syncData:any, expect: Chai.ExpectStatic): Promise<any> {
        // tests
        expect(syncRes.syncResult).to.have.property('UpToDate').that.is.a('Boolean').and.is.equal(true)
        expect(syncRes.syncTime).to.be.a('Number').and.to.be.lessThanOrEqual(this.OPTIMAL_FUTURE_SYNC_TIME)
    }
}

interface ObjectToTest{
    syncResult: any,
    syncTime:number
}