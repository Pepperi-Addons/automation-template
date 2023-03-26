import { BaseCommand } from "./base-command";

export class CleanupCommand extends BaseCommand{
    setupSchemes(): Promise<any> {
        return Promise.resolve(undefined);
    }
    pushData(): Promise<any> {
        return Promise.resolve(undefined);
    }
    processSyncResponse(syncRes: any): Promise<any> {
        return Promise.resolve(undefined)
    }
    sync(): Promise<any> {
        return Promise.resolve(undefined);
    }
    async test(syncRes: any,syncData:any,expect: Chai.ExpectStatic): Promise<any> {
        return await this.syncAdalService.cleanup();
    }
}