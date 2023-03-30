import { AddonData } from "@pepperi-addons/papi-sdk";

export const EmployeeTypes = [1, 2, 3];
export type EmployeeType = (typeof EmployeeTypes)[number];

export interface FilterObject extends AddonData {
    Key: string;
    Name: string;
    Resource: string;
    Field: string;
    PreviousField?: string;
    PreviousFilter?: string;
}

export interface ProfileFilterObject extends AddonData {
    Key: string;
    EmployeeType: EmployeeType; // 1 = Admin, 2 = Rep, 3 = Buyer
    Resource: string; // The schema that the field points to
    Filter: string; // key of filter object
}