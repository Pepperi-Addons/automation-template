export type SystemFilterType = 'None' | 'User' | 'Account';

export interface SystemFilter {
    Type: SystemFilterType,
    AccountUUID?: string
};

export interface GetResourcesRequiringSyncResponse {
    AddonUUID: string,
    Resource: string,
    Hidden: boolean,
    Type: string,
    SyndData: any
};

export interface GetResourcesRequiringSyncParameters {
    ModificationDateTime?: string,
    IncludeDeleted?: boolean,
    SystemFilter?: SystemFilter
};

export interface GetRecordsRequiringSyncResponse {
    Keys: string[],
    HiddenKeys: string[]
};

export interface GetRecordsRequiringSyncParameters {
    AddonUUID: string,
    Resource: string,
    IncludeDeleted: boolean,
    ModificationDateTime?: string,
    SystemFilter?: SystemFilter
};