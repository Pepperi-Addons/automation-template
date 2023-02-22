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
        expect(syncData.ResourcesData).to.be.an('Array').that.is.not.empty
        let schemes = this.syncDataResult.getSchemesFromWACD()

        // getting scheme names according to WACD 
        const noneSchemaName = 'CPI_Data_'+this.syncAdalService.addonUUID+'_'+this.adalTableServices?.none.schemaName
        const userSchemaName = 'CPI_Data_'+this.syncAdalService.addonUUID+'_'+this.adalTableServices?.user.schemaName
        const accountSchemaName = 'CPI_Data_'+this.syncAdalService.addonUUID+'_'+this.adalTableServices?.account.schemaName

        // validating that all of the schemes exists
        expect(schemes).to.contain(noneSchemaName)
        expect(schemes).to.contain(userSchemaName)
        expect(schemes).to.contain(accountSchemaName)

        // getting data of each scheme
        const noneData = this.syncDataResult.getObjectsFromWACD(noneSchemaName)
        const userData = this.syncDataResult.getObjectsFromWACD(userSchemaName)
        const accountData = this.syncDataResult.getObjectsFromWACD(accountSchemaName)

        // validating that no account would return and that only one user will return
        expect(Object.keys(noneData)).to.have.a.lengthOf(2)
        expect(Object.keys(accountData)).to.have.a.lengthOf(0)
        expect(Object.keys(userData)).to.have.a.lengthOf(1)

        const currentUserUUID = this.systemFilterService.usersService.getCurrentUserUUID();
   
        // validating that the user is the current user uuid
       expect(JSON.parse(userData[0].Values).User_Field == currentUserUUID)
    }

}