import { BaseCommand } from "./base-command";

export class CleanRebuild extends BaseCommand{
    setupSchemes(): Promise<any> {
        return Promise.resolve(undefined);
    }
    pushData(): Promise<any> {
        return Promise.resolve(undefined);
    }
    syncData(): Promise<any> {
        return Promise.resolve(undefined);
    }
    async test(expect: Chai.ExpectStatic): Promise<any> {
        return await this.syncService.nebulaCleanRebuild();
    }
}