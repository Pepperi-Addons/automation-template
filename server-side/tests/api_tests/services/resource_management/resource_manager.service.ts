import { AddonDataScheme, PapiClient, Relation } from "@pepperi-addons/papi-sdk";
import { RemovableResource } from "./removable_resource.service";
import Promise from 'bluebird';
import { ADALTableService } from "./adal_table.service";
import { RelationService } from "./relation.service";


export class ResourceManagerService {
    activeResources: RemovableResource[];

    constructor(public papiClient: PapiClient, private addonUUID: string) {
        this.papiClient = papiClient;
        this.addonUUID = addonUUID;
        this.activeResources = [];
    }


    async createAdalTable(schema: AddonDataScheme): Promise<ADALTableService> {

        const removableResource: RemovableResource = new ADALTableService(this.papiClient, this.addonUUID, schema);

        try {
            await removableResource.initResource();
        }
        catch (ex) {
            console.error(`createAdalTable: ${ex}`);
            throw new Error((ex as { message: string }).message);
        }

        return removableResource;
    }


    async createRelation(relation: Relation): Promise<RelationService> {

        const removableResource: RemovableResource = new RelationService(this.papiClient, relation);

        try {
            await removableResource.initResource();
        }
        catch (ex) {
            console.error(`createRelation: ${ex}`);
            throw new Error((ex as { message: string }).message);
        }

        return removableResource;
    }


    async cleanup(): Promise<any[]> {

        const PARALLEL_AMOUNT = 5;

        const results: any[] = await Promise.map(this.activeResources,
            async (removableResource: RemovableResource) => {
                return (await removableResource.removeResource())
            },
            { concurrency: PARALLEL_AMOUNT });

        this.activeResources = [];

        return results;
    }
}