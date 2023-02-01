import { BaseCommand } from "./base-command";

export class CleanupCommand extends BaseCommand{
    setupSchemes(): Promise<any> {
        return Promise.resolve(undefined);
    }
    pushData(): Promise<any> {
        return Promise.resolve(undefined);
    }
    syncData(): Promise<any> {
        return Promise.resolve(undefined);
    }
    async test(data:{auditLog: any,requesttime: number}, expect: Chai.ExpectStatic): Promise<any> {
        console.log('Cleanup started')
        await this.syncAdalService.cleanup();
        console.log('Cleanup ended')
    }
}