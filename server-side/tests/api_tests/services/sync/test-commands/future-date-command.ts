import { BaseCommand } from "./base-command";

export class FutureDateCommand extends BaseCommand{
    setupSchemes(): Promise<any> {
        return Promise.resolve(undefined);
    }
    pushData(): Promise<any> {
        return Promise.resolve(undefined);
    }
    async syncData(): Promise<any> {
        let dateTime = new Date();
        dateTime.setFullYear(dateTime.getFullYear()+1)
        const t1 = performance.now()
        let auditLog = await this.syncTestService.callSyncPullAPI(dateTime.toISOString(),false)
        const t2 = performance.now()
        return {auditLog: auditLog, requesttime:t1-t2}
    }
    async test(data:{auditLog: any,requesttime: number}, expect: Chai.ExpectStatic): Promise<any> {
        // tests
        expect(data.auditLog).to.have.property('UpToDate').that.is.a('Boolean').and.is.equal(true)
        expect(data.requesttime).to.be.a('Number').and.to.be.lessThanOrEqual(5000)
    }
}