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
    async syncData(): Promise<ObjectToTest> {
        let dateTime = new Date();
        dateTime.setFullYear(dateTime.getFullYear()+1)
        const t1 = performance.now()
        let auditLog = await this.syncService.pull({
            ModificationDateTime: dateTime.toISOString(),
        })
        const t2 = performance.now()
        return {syncResult: auditLog, syncTime:t2-t1}
    }
    async test(dataToTest:ObjectToTest, expect: Chai.ExpectStatic): Promise<any> {
        // tests
        expect(dataToTest.syncResult).to.have.property('UpToDate').that.is.a('Boolean').and.is.equal(true)
        expect(dataToTest.syncTime).to.be.a('Number').and.to.be.lessThanOrEqual(this.OPTIMAL_FUTURE_SYNC_TIME)
    }
}

interface ObjectToTest{
    syncResult: any,
    syncTime:number
}