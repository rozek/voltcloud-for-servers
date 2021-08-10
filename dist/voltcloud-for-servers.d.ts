/**** VoltCloud-specific types and constants ****/
export declare const ApplicationNamePattern: RegExp;
export declare const maxApplicationNameLength = 63;
export declare const maxStorageKeyLength = 255;
export declare const maxStorageValueLength = 1048574;
export declare type VC_ApplicationName = string;
export declare type VC_ApplicationRecord = {
    id: string;
    owner: string;
    subdomain: string;
    disabled: boolean;
    url: string;
    canonical_domain?: string;
    confirmation_url?: string;
    reset_url?: string;
    last_upload?: string;
    nice_links: boolean;
    cors_type: string;
    cors_domain?: string;
    frame_type: string;
    frame_domain?: string;
};
export declare type VC_ApplicationUpdate = {
    subdomain?: string;
    disabled?: boolean;
    canonical_domain?: string;
    confirmation_url?: string;
    reset_url?: string;
    nice_links?: boolean;
    cors_type?: string;
    cors_domain?: string;
    frame_type?: string;
    frame_domain?: string;
};
export declare type VC_CustomerRecord = {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    confirmed: boolean;
    admin: boolean;
    meta?: any;
};
export declare type VC_CustomerUpdate = {
    email?: string;
    password?: {
        old: string;
        new: string;
        confirmation: string;
    };
    first_name?: string;
    last_name?: string;
};
export declare type VC_StorageKey = string;
export declare type VC_StorageValue = string | undefined;
export declare type VC_StorageSet = {
    [Key: string]: VC_StorageValue;
};
/**** actOnBehalfOfDeveloper ****/
export declare function actOnBehalfOfDeveloper(EMailAddress: string, Password: string): Promise<void>;
/**** ApplicationRecords ****/
export declare function ApplicationRecords(): Promise<VC_ApplicationRecord[]>;
/**** focusOnApplication - async for for the sake of systematics only ****/
export declare function focusOnApplication(ApplicationId: string): Promise<void>;
/**** focusOnApplicationCalled ****/
export declare function focusOnApplicationCalled(ApplicationName: VC_ApplicationName): Promise<void>;
/**** focusOnNewApplication ****/
export declare function focusOnNewApplication(): Promise<void>;
/**** ApplicationRecord ****/
export declare function ApplicationRecord(): Promise<VC_ApplicationRecord>;
/**** changeApplicationNameTo ****/
export declare function changeApplicationNameTo(ApplicationName: VC_ApplicationName): Promise<void>;
/**** updateApplicationRecordBy ****/
export declare function updateApplicationRecordBy(Settings: VC_ApplicationUpdate): Promise<void>;
/**** uploadToApplication ****/
export declare function uploadToApplication(Archive: Blob): Promise<void>;
/**** deleteApplication ****/
export declare function deleteApplication(ApplicationId: string): Promise<void>;
/**** ApplicationStorage ****/
export declare function ApplicationStorage(): Promise<VC_StorageSet>;
/**** ApplicationStorageEntry ****/
export declare function ApplicationStorageEntry(StorageKey: VC_StorageKey): Promise<VC_StorageValue>;
/**** setApplicationStorageEntryTo ****/
export declare function setApplicationStorageEntryTo(StorageKey: VC_StorageKey, StorageValue: VC_StorageValue): Promise<void>;
/**** deleteApplicationStorageEntry ****/
export declare function deleteApplicationStorageEntry(StorageKey: VC_StorageKey): Promise<void>;
/**** clearApplicationStorage ****/
export declare function clearApplicationStorage(): Promise<void>;
/**** CustomerRecords ****/
export declare function CustomerRecords(): Promise<VC_CustomerRecord[]>;
/**** focusOnCustomer - async for for the sake of systematics only ****/
export declare function focusOnCustomer(CustomerId: string): Promise<void>;
/**** focusOnCustomerWithAddress ****/
export declare function focusOnCustomerWithAddress(CustomerAddress: string): Promise<void>;
/**** focusOnNewCustomer ****/
export declare function focusOnNewCustomer(EMailAddress: string, Password: string): Promise<void>;
/**** resendConfirmationEMailToCustomer ****/
export declare function resendConfirmationEMailToCustomer(EMailAddress?: string): Promise<void>;
/**** confirmCustomerUsing ****/
export declare function confirmCustomerUsing(Token: string): Promise<void>;
/**** startPasswordResetForCustomer ****/
export declare function startPasswordResetForCustomer(EMailAddress?: string): Promise<void>;
/**** resetCustomerPasswordUsing ****/
export declare function resetCustomerPasswordUsing(Token: string, Password: string): Promise<void>;
/**** deleteCustomer ****/
export declare function deleteCustomer(): Promise<void>;
/**** CustomerStorage ****/
export declare function CustomerStorage(): Promise<VC_StorageSet>;
/**** CustomerStorageEntry ****/
export declare function CustomerStorageEntry(StorageKey: VC_StorageKey): Promise<VC_StorageValue>;
/**** setCustomerStorageEntryTo ****/
export declare function setCustomerStorageEntryTo(StorageKey: VC_StorageKey, StorageValue: VC_StorageValue): Promise<void>;
/**** deleteCustomerStorageEntry ****/
export declare function deleteCustomerStorageEntry(StorageKey: VC_StorageKey): Promise<void>;
/**** clearCustomerStorage ****/
export declare function clearCustomerStorage(): Promise<void>;
/**** ValueIsPassword - a string following VoltCloud's password rules ****/
export declare function ValueIsPassword(Value: any): boolean;
/**** allow/expect[ed]Password ****/
export declare const allowPassword: Function, allowedPassword: Function;
export declare const expectPassword: Function, expectedPassword: Function;
/**** ValueIsApplicationName - a string suitable as a VoltCloud application name ****/
export declare function ValueIsApplicationName(Value: any): boolean;
/**** allow/expect[ed]ApplicationName ****/
export declare const allowApplicationName: Function, allowedApplicationName: Function;
export declare const expectApplicationName: Function, expectedApplicationName: Function;
/**** ValueIsStorageKey - a string suitable as a VoltCloud storage key ****/
export declare function ValueIsStorageKey(Value: any): boolean;
/**** allow/expect[ed]StorageKey ****/
export declare const allowStorageKey: Function, allowedStorageKey: Function;
export declare const expectStorageKey: Function, expectedStorageKey: Function;
/**** ValueIsStorageValue - a string suitable as a VoltCloud storage value ****/
export declare function ValueIsStorageValue(Value: any): boolean;
/**** allow/expect[ed]StorageValue ****/
export declare const allowStorageValue: Function, allowedStorageValue: Function;
export declare const expectStorageValue: Function, expectedStorageValue: Function;
