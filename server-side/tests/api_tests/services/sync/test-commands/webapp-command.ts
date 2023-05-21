import { SystemFilterUser } from "./system-filter-user-command";


export class WebappCommand extends SystemFilterUser {
    private automationAddonUUID = ''

    async sync(): Promise<any> {
        // start sync
        let dateTime = new Date();
        dateTime.setHours(dateTime.getHours()-1)
        let auditLog = await this.syncService.pull({
            ModificationDateTime:dateTime.toISOString()
        },false, true, true)
        return auditLog
    }

    async test(auditLog: any, syncData: any, expect: Chai.ExpectStatic): Promise<any> {
        expect(syncData.Resources.Data).to.be.an('Array').that.is.not.empty
        let schemes = this.syncDataResult.getSchemesFromWACD()

        // validating that all of the schemes exists
        expect(schemes).to.contain(this.adalTableServices?.none.schemaName)
        expect(schemes).to.contain(this.adalTableServices?.user.schemaName)
        expect(schemes).to.contain(this.adalTableServices?.account.schemaName)

        // getting data of each scheme
        const noneData = this.syncDataResult.getObjectsFromWACD(this.adalTableServices!.none.schemaName)
        const userData = this.syncDataResult.getObjectsFromWACD(this.adalTableServices!.user.schemaName)
        const accountData = this.syncDataResult.getObjectsFromWACD(this.adalTableServices!.account.schemaName)

        // validating that no account would return and that only one user will return
        expect(Object.keys(noneData)).to.have.a.lengthOf(2)
        expect(Object.keys(accountData)).to.have.a.lengthOf(0)
        expect(Object.keys(userData)).to.have.a.lengthOf(1)

        const currentUserUUID = this.systemFilterService.usersService.getCurrentUserUUID();
   
        // validating that the user is the current user uuid
       expect(JSON.parse(userData[0].Values).User_Field == currentUserUUID)
    }

}