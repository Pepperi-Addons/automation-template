export type SystemFilterType = 'None' | 'User' | 'Account';

export interface PathDestination {
    Resource: string;
    Key: string;
}

export interface GetResourcesRequiringSyncParameters {
    ModificationDateTime?: string;
    IncludeDeleted?: boolean;
    PathData?: {
        PermissionSet: string;
        Destinations?: PathDestination[]; // Describe where to trim the paths.
        IncludedResources: string[]; // Resources that must be in the path
        ExcludedResources: string[]; // Resources that must not be in the path
    };
}

export interface GetResourcesRequiringSyncResponse {
    AddonUUID: string,
    Resource: string,
    Hidden: boolean,
    Type: string,
    SyndData: any
};

export interface GetRecordsRequiringSyncResponse {
    Keys: string[],
    HiddenKeys: string[]
};

export interface GetRecordsRequiringSyncParameters {
    AddonUUID: string,
    Resource: string,
    Token: string,
};