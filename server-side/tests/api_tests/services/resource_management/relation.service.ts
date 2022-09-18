import { PapiClient, Relation } from '@pepperi-addons/papi-sdk';
import { RemovableResource } from './removable_resource.service';

export class RelationService extends RemovableResource {

    constructor(public papiClient: PapiClient, private relation: Relation) {
        super(papiClient);
    }

    async initResource(): Promise<Relation> {
        try {
            return await this.papiClient.addons.data.relations.upsert(this.relation)
        }
        catch (ex) {
            console.error(`initResource - relation: ${ex}`);
            throw new Error((ex as { message: string }).message);
        }
    }

    async removeResource(): Promise<Relation> {
        try {
            return await this.papiClient.addons.data.relations.upsert({ ...this.relation, Hidden: true });
        }
        catch (ex) {
            console.error(`removeResource - relation: ${ex}`);
            throw new Error((ex as { message: string }).message);
        }
    }

    getRelation(): Relation {
        return this.relation;
    }


}
