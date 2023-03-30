import { Client } from "@pepperi-addons/debug-server/dist";
import { PapiClient } from "@pepperi-addons/papi-sdk";
import { FilterObject, ProfileFilterObject } from "./types";

const FABULA_UUID = 'cebb251f-1c80-4d80-b62c-442e48e678e8';

export class FabulaService {

    constructor(private papiClient: PapiClient) {
    }

    public async getAllProfileFilters(): Promise<ProfileFilterObject[]> {
        const profileFilters = await this.papiClient.addons.api
            .uuid(FABULA_UUID)
            .file('api')
            .func('profile_filters')
            .get();
        return profileFilters as ProfileFilterObject[];
    }

    public async getAllFilters(): Promise<FilterObject[]> {
        const filters = await this.papiClient.addons.api.uuid(FABULA_UUID).file('api').func('filters').get();
        return filters as FilterObject[];
    }

    public async upsertProfileFilter(profileFilter: ProfileFilterObject): Promise<ProfileFilterObject> {
        try {
            const upsertedProfileFilter = await this.papiClient.addons.api.uuid(FABULA_UUID).file('api').func('profile_filters').post({}, profileFilter);
            return upsertedProfileFilter as ProfileFilterObject;
        } catch (error) {
            console.error(`Error in upsertProfileFilter: ${(error as Error).message}`);
            throw error;
        }
    }

    public async upsertFilter(filter: FilterObject): Promise<FilterObject> {
        try {
            const upsertedFilter = await this.papiClient.addons.api.uuid(FABULA_UUID).file('api').func('filters').post({}, filter);
            return upsertedFilter as FilterObject;
        } catch (error) {
            console.error(`Error in upsertFilter: ${(error as Error).message}`);
            throw error;
        }
    }

    public async deleteProfileFilter(profileFilter: ProfileFilterObject): Promise<ProfileFilterObject> {
        profileFilter.Hidden = true;
        const upsertedProfileFilter = await this.upsertProfileFilter(profileFilter);
        return upsertedProfileFilter as ProfileFilterObject;
    }
    
    public async deleteFilter(filter: FilterObject): Promise<FilterObject> {
        filter.Hidden = true;
        const upsertedFilter = await this.upsertFilter(filter);
        return upsertedFilter as FilterObject;
    }
    
}
