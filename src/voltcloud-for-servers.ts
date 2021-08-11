//----------------------------------------------------------------------------//
//       voltcloud-for-servers - a simple VoltCloud library for servers       //
//----------------------------------------------------------------------------//

  import {
    throwError, quoted,
    ValueIsString, ValueIsNonEmptyString, ValueIsTextline,
    expectValue,
    allowNonEmptyString, expectNonEmptyString, expectPlainObject,
    allowEMailAddress, expectEMailAddress, expectURL,
    ValidatorForClassifier, acceptNil, rejectNil
  } from 'javascript-interface-library'

  import * as https from 'https'
  import { Buffer } from 'buffer'

/**** VoltCloud-specific types and constants ****/

  export const ApplicationNamePattern   = /^[0-9a-z][-0-9a-z]*$/ //see dashboard
  export const maxApplicationNameLength = 63             // see discussion forum
  export const maxEMailAddressLength    = 255                            // dto.
  export const maxNamePartLength        = 255                            // dto.
  export const maxStorageKeyLength      = 255   // as mentioned in REST API docs
  export const maxStorageValueLength    = 1048574        // see discussion forum

  export type VC_ApplicationName = string    // mainly for illustrative purposes

  export type VC_ApplicationRecord = {
    id:string, owner:string, subdomain:string, disabled:boolean,
    url:string, canonical_domain?:string,
    confirmation_url?:string, reset_url?:string,
    last_upload?:string, nice_links:boolean,
    cors_type:string, cors_domain?:string,
    frame_type:string, frame_domain?:string,
  }

  export type VC_ApplicationUpdate = {
    subdomain?:string, disabled?:boolean,
    canonical_domain?:string,
    confirmation_url?:string, reset_url?:string,
    nice_links?:boolean,
    cors_type?:string, cors_domain?:string,
    frame_type?:string, frame_domain?:string,
  }

  export type VC_CustomerRecord = {
    id:string, email:VC_EMailAddress, first_name?:VC_NamePart, last_name?:VC_NamePart,
    confirmed:boolean, admin:boolean, meta?:any
  } // note: "meta" field is obsolete

  export type VC_CustomerUpdate = {
    email?:VC_EMailAddress,
    password?:{ old:VC_Password, new:VC_Password, confirmation:VC_Password },
    first_name?:VC_NamePart, last_name?:VC_NamePart
  }

  export type VC_EMailAddress = string       // mainly for illustrative purposes
  export type VC_Password     = string                                   // dto.
  export type VC_NamePart     = string                                   // dto.

  export type VC_StorageKey   = string       // mainly for illustrative purposes
  export type VC_StorageValue = string | undefined                       // dto.
  export type VC_StorageSet   = { [Key:string]:VC_StorageValue }

/**** internal constants and variables ****/

  const Timeout = 30 * 1000                       // request timeout given in ms

  const DashboardURL = 'https://dashboard.voltcloud.io'
  const DashboardId  = 'RpYCMN'

  let currentDeveloperId:       string | undefined
  let currentDeveloperAddress:  string | undefined
  let currentDeveloperPassword: string | undefined   // stored for token refresh
  let currentAccessToken:       string | undefined

  let currentApplicationId:  string | undefined
  let currentApplicationURL: string | undefined

  let currentCustomerId:      string | undefined
  let currentCustomerAddress: string | undefined

/**** actOnBehalfOfDeveloper ****/

  export async function actOnBehalfOfDeveloper (
    EMailAddress:string, Password:string
  ):Promise<void> {
    expectEMailAddress('VoltCloud developer email address',EMailAddress)
    expectPassword         ('VoltCloud developer password',Password)

    await loginDeveloper(EMailAddress,Password)
  }

/**** ApplicationRecords ****/

  export async function ApplicationRecords ():Promise<VC_ApplicationRecord[]> {
    assertDeveloperFocus()

    let Response
    try {
      Response = await ResponseOf(
        'private', 'GET', '{{dashboard_url}}/api/app'
      )
    } catch (Signal) {
      switch (Signal.HTTPStatus) {
// no knowledge about HTTP status Codes yet
        default: throw Signal
      }
    }

    return Response || []
  }

/**** focusOnApplication - async for for the sake of systematics only ****/

  export async function focusOnApplication (
    ApplicationId:string
  ):Promise<void> {
    expectNonEmptyString('VoltCloud application id',ApplicationId)

//  assertDeveloperFocus()               // will be done by "ApplicationRecords"

    currentApplicationId  = undefined
    currentApplicationURL = undefined

    let ApplicationRecordList = await ApplicationRecords()
    for (let i = 0, l = ApplicationRecordList.length; i < l; i++) {
      let ApplicationRecord = ApplicationRecordList[i]
      if (ApplicationRecord.id === ApplicationId) {
        currentApplicationId  = ApplicationId
        currentApplicationURL = ApplicationRecord.url
        return
      }
    }

    throwError(
      'NoSuchApplication: no application with id ' + quoted(ApplicationId) +
      ' found for the currently focused developer'
    )
  }

/**** focusOnApplicationCalled ****/

  export async function focusOnApplicationCalled (
    ApplicationName:VC_ApplicationName
  ):Promise<void> {
    expectApplicationName('VoltCloud application name',ApplicationName)

//  assertDeveloperFocus()               // will be done by "ApplicationRecords"

    currentApplicationId  = undefined
    currentApplicationURL = undefined

    let ApplicationRecordList = await ApplicationRecords()
    for (let i = 0, l = ApplicationRecordList.length; i < l; i++) {
      let ApplicationRecord = ApplicationRecordList[i]
      if (ApplicationRecord.subdomain === ApplicationName) {
        currentApplicationId  = ApplicationRecord.id
        currentApplicationURL = ApplicationRecord.url
        return
      }
    }

    throwError(
      'NoSuchApplication: no application called ' + quoted(ApplicationName) +
      ' found for the currently focused developer'
    )
  }

/**** focusOnNewApplication ****/

  export async function focusOnNewApplication ():Promise<void> {
    assertDeveloperFocus()               // will be done by "ApplicationRecords"

    currentApplicationId  = undefined
    currentApplicationURL = undefined

    let Response
    try {
      Response = await ResponseOf(
        'private', 'POST', '{{dashboard_url}}/api/app', null, {}
      )
    } catch (Signal) {
      switch (Signal.HTTPStatus) {
// no knowledge about HTTP status Codes yet
        default: throw Signal
      }
    }

    currentApplicationId  = Response.id
    currentApplicationURL = Response.url
  }

/**** ApplicationRecord ****/

  export async function ApplicationRecord ():Promise<VC_ApplicationRecord | undefined> {
    assertDeveloperFocus()
    assertApplicationFocus()

    let Response
    try {
      Response = await ResponseOf(
        'private', 'GET', '{{dashboard_url}}/api/app/{{application_id}}'
      )
    } catch (Signal) {
      switch (Signal.HTTPStatus) {
// no knowledge about HTTP status Codes yet
        default: throw Signal
      }
    }

    return Response
  }

/**** changeApplicationNameTo ****/

  export async function changeApplicationNameTo (
    ApplicationName:VC_ApplicationName
  ):Promise<void> {
    expectApplicationName('VoltCloud application name',ApplicationName)

    assertDeveloperFocus()
    assertApplicationFocus()

    try {
      await ResponseOf(
        'private', 'PUT', '{{dashboard_url}}/api/app/{{application_id}}', null, {
          subdomain:ApplicationName
        }
      )
    } catch (Signal) {
      switch (Signal.HTTPStatus) {
// no knowledge about HTTP status Codes yet
        default: throw Signal
      }
    }
  }

/**** updateApplicationRecordBy ****/

  export async function updateApplicationRecordBy (
    Settings:VC_ApplicationUpdate
  ):Promise<void> {
    expectPlainObject('VoltCloud application settings',Settings)

    assertDeveloperFocus()
    assertApplicationFocus()

    try {
      await ResponseOf(
        'private', 'PUT', '{{dashboard_url}}/api/app/{{application_id}}', null, Settings
      )
    } catch (Signal) {
      switch (Signal.HTTPStatus) {
// no knowledge about HTTP status Codes yet
        default: throw Signal
      }
    }
  }

/**** uploadToApplication ****/

  export async function uploadToApplication (
    ZIPArchive:Buffer
  ):Promise<void> {
    expectValue('ZIP archive',ZIPArchive)
    if (! Buffer.isBuffer(ZIPArchive)) throwError(
      'InvalidArgument: the given ZIP archive is no valid Node.js buffer'
    )

    assertDeveloperFocus()
    assertApplicationFocus()

    try {
      await ResponseOf(
        'private', 'POST', '{{dashboard_url}}/api/app/{{application_id}}/version', {
          application_id:currentApplicationId
        }, ZIPArchive
      )
    } catch (Signal) {
      switch (Signal.HTTPStatus) {
// no knowledge about HTTP status Codes yet
        default: throw Signal
      }
    }
  }

/**** deleteApplication ****/

  export async function deleteApplication (
    ApplicationId:string
  ):Promise<void> {
    allowNonEmptyString('VoltCloud application id',ApplicationId)

    assertDeveloperFocus()

    if (ApplicationId == null) {
      assertApplicationFocus()
      ApplicationId = currentApplicationId as string
    }

    try {
      await ResponseOf(
        'private', 'DELETE', '{{dashboard_url}}/api/app/{{application_id}}', {
          application_id:ApplicationId
        }
      )
    } catch (Signal) {
      switch (Signal.HTTPStatus) {
// no knowledge about HTTP status Codes yet
        default: throw Signal
      }
    }
  }

/**** ApplicationStorage ****/

  export async function ApplicationStorage ():Promise<VC_StorageSet> {
    assertDeveloperFocus()
    assertApplicationFocus()

    let Response
    try {
      Response = await ResponseOf(
        'private', 'GET', '{{dashboard_url}}/api/storage/{{application_id}}'
      )
    } catch (Signal) {
      switch (Signal.HTTPStatus) {
// no knowledge about HTTP status Codes yet
        default: throw Signal
      }
    }

    return Response || {}
  }

/**** ApplicationStorageEntry ****/

  export async function ApplicationStorageEntry (
    StorageKey:VC_StorageKey
  ):Promise<VC_StorageValue | undefined> {
    expectStorageKey('VoltCloud application storage key',StorageKey)

    assertDeveloperFocus()
    assertApplicationFocus()

    let Response
    try {
      Response = await ResponseOf(
        'private', 'GET', '{{dashboard_url}}/api/storage/{{application_id}}/key/{{application_storage_key}}', {
          application_storage_key: StorageKey
        }
      )
    } catch (Signal) {
      switch (Signal.HTTPStatus) {
// no knowledge about HTTP status Codes yet
        case 404: return undefined
        default:  throw Signal
      }
    }

    return Response
  }

/**** setApplicationStorageEntryTo ****/

  export async function setApplicationStorageEntryTo (
    StorageKey:VC_StorageKey, StorageValue:VC_StorageValue
  ):Promise<void> {
    expectStorageKey    ('VoltCloud application storage key',StorageKey)
    expectStorageValue('VoltCloud application storage value',StorageValue)

    assertDeveloperFocus()
    assertApplicationFocus()

    try {
      await ResponseOf(
        'private', 'PUT', '{{dashboard_url}}/api/storage/{{application_id}}/key/{{application_storage_key}}', {
          application_storage_key: StorageKey
        }, StorageValue
      )
    } catch (Signal) {
      switch (Signal.HTTPStatus) {
// no knowledge about HTTP status Codes yet
        default: throw Signal
      }
    }
  }

/**** deleteApplicationStorageEntry ****/

  export async function deleteApplicationStorageEntry (
    StorageKey:VC_StorageKey
  ):Promise<void> {
    expectStorageKey('VoltCloud application storage key',StorageKey)

    assertDeveloperFocus()
    assertApplicationFocus()

    try {
      await ResponseOf(
        'private', 'DELETE', '{{dashboard_url}}/api/storage/{{application_id}}/key/{{application_storage_key}}', {
          application_storage_key: StorageKey
        }
      )
    } catch (Signal) {
      switch (Signal.HTTPStatus) {
// no knowledge about HTTP status Codes yet
        case 404: return
        default:  throw Signal
      }
    }
  }

/**** clearApplicationStorage ****/

  export async function clearApplicationStorage ():Promise<void> {
    assertDeveloperFocus()
    assertApplicationFocus()

    try {
      await ResponseOf(
        'private', 'DELETE', '{{dashboard_url}}/api/storage/{{application_id}}'
      )
    } catch (Signal) {
      switch (Signal.HTTPStatus) {
// no knowledge about HTTP status Codes yet
        default: throw Signal
      }
    }
  }

/**** CustomerRecords ****/

  export async function CustomerRecords ():Promise<VC_CustomerRecord[]> {
    assertDeveloperFocus()
    assertApplicationFocus()

    let Response
    try {
      Response = await ResponseOf(
        'private', 'GET', '{{dashboard_url}}/api/app/{{application_id}}/users'
      )
    } catch (Signal) {
      switch (Signal.HTTPStatus) {
// no knowledge about HTTP status Codes yet
        default: throw Signal
      }
    }

    return Response || []
  }

/**** focusOnCustomer - async for for the sake of systematics only ****/

  export async function focusOnCustomer (
    CustomerId:string
  ):Promise<void> {
    expectNonEmptyString('VoltCloud customer id',CustomerId)

//  assertDeveloperFocus()                  // will be done by "CustomerRecords"
//  assertApplicationFocus()                                             // dto.

    currentCustomerId      = undefined
    currentCustomerAddress = undefined

    let CustomerRecordList = await CustomerRecords()
    for (let i = 0, l = CustomerRecordList.length; i < l; i++) {
      let CustomerRecord = CustomerRecordList[i]
      if (CustomerRecord.id === CustomerId) {
        currentCustomerId      = CustomerId
        currentCustomerAddress = CustomerRecord.email
        return
      }
    }

    throwError(
      'NoSuchCustomer: no customer with id ' + quoted(CustomerId) +
      ' found for the currently focused application'
    )
  }

/**** focusOnCustomerWithAddress ****/

  export async function focusOnCustomerWithAddress (
    CustomerAddress:string
  ):Promise<void> {
    expectEMailAddress('VoltCloud customer email address',CustomerAddress)

//  assertDeveloperFocus()                  // will be done by "CustomerRecords"
//  assertApplicationFocus()                                             // dto.

    currentCustomerId      = undefined
    currentCustomerAddress = undefined

    let CustomerRecordList = await CustomerRecords()
    for (let i = 0, l = CustomerRecordList.length; i < l; i++) {
      let CustomerRecord = CustomerRecordList[i]
      if (CustomerRecord.email === CustomerAddress) {
        currentCustomerId      = CustomerRecord.id
        currentCustomerAddress = CustomerAddress
        return
      }
    }

    throwError(
      'NoSuchCustomer: no customer with email address ' + quoted(CustomerAddress) +
      ' found for the currently focused application'
    )
  }

/**** focusOnNewCustomer ****/

  export async function focusOnNewCustomer (
    EMailAddress:string, Password:string
  ):Promise<void> {
    expectEMailAddress('VoltCloud customer email address',EMailAddress)
    expectPassword         ('VoltCloud customer password',Password)

//  assertDeveloperFocus()                             // not really needed here
    assertApplicationFocus()

    let Response
    try {
      Response = await ResponseOf(
        'public', 'POST', '{{application_url}}/api/auth/register', null, {
          email:        EMailAddress,
          password:     Password,
          confirmation: Password,
          scope:        currentApplicationId
        }
      )
    } catch (Signal) {
      switch (Signal.HTTPStatus) {
        case 404: throwError('NoSuchApplication: the currently focused application could not be found')
        case 409: throwError('UserExists: the given email address is already used')
        case 422: throwError('BadPassword: the given password does not meet the VoltCloud requirements')
        default: throw Signal
      }
    }

    if ((Response != null) && ValueIsString(Response.id)) {
      currentCustomerId      = Response.id
      currentCustomerAddress = EMailAddress
    } else {
      throwError('InternalError: could not analyze response for registration request')
    }
  }

/**** resendConfirmationEMailToCustomer ****/

  export async function resendConfirmationEMailToCustomer (
    EMailAddress?:string
  ):Promise<void> {
    allowEMailAddress('VoltCloud customer email address',EMailAddress)

//  assertDeveloperFocus()                             // not really needed here
    assertApplicationFocus()

    if (EMailAddress == null) {
      assertCustomerFocus()
      EMailAddress = currentCustomerAddress
    }

    try {
      await ResponseOf(
        'public', 'POST', '{{application_url}}/api/auth/resend', null, {
          email: EMailAddress,
          scope: currentApplicationId
        }
      )
    } catch (Signal) {
      switch (Signal.HTTPStatus) {
        case 402: throwError('NoSuchUser: the given user is unknown to the currently focused application')
        case 404: throwError('NoSuchApplication: the currently focused application could not be found')
        case 501: throwError('Unsupported: the currently focused application does not support customer confirmations')
        default: throw Signal
      }
    }
  }

/**** confirmCustomerUsing ****/

  export async function confirmCustomerUsing (Token:string):Promise<void> {
    expectNonEmptyString('VoltCloud customer confirmation token',Token)

//  assertDeveloperFocus()                             // not really needed here
    assertApplicationFocus()

    try {
      await ResponseOf(
        'public', 'POST', '{{application_url}}/api/auth/confirm', null, {
          token: Token
        }
      )
    } catch (Signal) {
      switch (Signal.HTTPStatus) {
        case 401: throwError('BadToken: the given token can not be recognized')
        default: throw Signal
      }
    }
  }

/**** startPasswordResetForCustomer ****/

  export async function startPasswordResetForCustomer (
    EMailAddress?:string
  ):Promise<void> {
    allowEMailAddress('VoltCloud customer email address',EMailAddress)

//  assertDeveloperFocus()                             // not really needed here
    assertApplicationFocus()

    if (EMailAddress == null) {
      assertCustomerFocus()
      EMailAddress = currentCustomerAddress
    }

    try {
      await ResponseOf(
        'public', 'POST', '{{application_url}}/api/auth/forgot', null, {
          email: EMailAddress,
          scope: currentApplicationId
        }
      )
    } catch (Signal) {
      switch (Signal.HTTPStatus) {
        case 402: throwError('NoSuchUser: the given user is unknown to the currently focused application')
        case 404: throwError('NoSuchApplication: the currently focused application could not be found')
        case 501: throwError('Unsupported: the currently focused application does not support password resets')
        default: throw Signal
      }
    }
  }

/**** resetCustomerPasswordUsing ****/

  export async function resetCustomerPasswordUsing (
    Token:string, Password:string
  ):Promise<void> {
    expectNonEmptyString('VoltCloud password reset token',Token)
    expectPassword         ('VoltCloud customer password',Password)

//  assertDeveloperFocus()                             // not really needed here
    assertApplicationFocus()

    try {
      await ResponseOf(
        'public', 'POST', '{{application_url}}/api/auth/reset', null, {
          token:        Token,
          password:     Password,
          confirmation: Password
        }
      )
    } catch (Signal) {
      switch (Signal.HTTPStatus) {
        case 401: throwError('BadToken: the given token can not be recognized')
        case 422: throwError('BadPassword: the given password does not meet the VoltCloud requirements')
        default: throw Signal
      }
    }
  }

/**** CustomerRecord ****/

  export async function CustomerRecord (
    CustomerId?:string
  ):Promise<VC_CustomerRecord | undefined> {
    allowNonEmptyString('VoltCloud customer id',CustomerId)

    assertDeveloperFocus()
    assertApplicationFocus()

    if (CustomerId == null) {
      assertCustomerFocus()
      CustomerId = currentCustomerId as string
    }

  /**** custom implementation ****/

    let CustomerRecordList = await CustomerRecords()
    for (let i = 0, l = CustomerRecordList.length; i < l; i++) {
      let CustomerRecord = CustomerRecordList[i]
      if (CustomerRecord.id = CustomerId) { return CustomerRecord }
    }

    return undefined

/*
    let Response
    try {
      Response = await ResponseOf(
        'private', 'GET', '{{application_url}}/api/user/{{customer_id}}',{
          customer_id:CustomerId
        }
      )
    } catch (Signal) {
      switch (Signal.HTTPStatus) {
// no knowledge about HTTP status Codes yet
        default: throw Signal
      }
    }

    return Response
*/
  }

/**** deleteCustomer ****/

  export async function deleteCustomer ():Promise<void> {
    assertDeveloperFocus()
    assertApplicationFocus()
    assertCustomerFocus()

    try {
      await ResponseOf(
        'private', 'DELETE', '{{dashboard_url}}/api/user/{{customer_id}}'
      )
    } catch (Signal) {
      switch (Signal.HTTPStatus) {
// no knowledge about HTTP status Codes yet
        default: throw Signal
      }
    }
  }

/**** CustomerStorage ****/

  export async function CustomerStorage ():Promise<VC_StorageSet> {
    assertDeveloperFocus()
    assertApplicationFocus()
    assertCustomerFocus()

    let Response
    try {
      Response = await ResponseOf(
        'private', 'GET', '{{dashboard_url}}/api/storage/{{customer_id}}'
      )
    } catch (Signal) {
      switch (Signal.HTTPStatus) {
// no knowledge about HTTP status Codes yet
        default: throw Signal
      }
    }

    return Response || {}
  }

/**** CustomerStorageEntry ****/

  export async function CustomerStorageEntry (
    StorageKey:VC_StorageKey
  ):Promise<VC_StorageValue | undefined> {
    expectStorageKey('VoltCloud customer storage key',StorageKey)

    assertDeveloperFocus()
    assertApplicationFocus()
    assertCustomerFocus()

    let Response
    try {
      Response = await ResponseOf(
        'private', 'GET', '{{dashboard_url}}/api/storage/{{customer_id}}/key/{{customer_storage_key}}', {
          customer_storage_key: StorageKey
        }
      )
    } catch (Signal) {
      switch (Signal.HTTPStatus) {
// no knowledge about HTTP status Codes yet
        case 404: return undefined
        default:  throw Signal
      }
    }

    return Response
  }

/**** setCustomerStorageEntryTo ****/

  export async function setCustomerStorageEntryTo (
    StorageKey:VC_StorageKey, StorageValue:VC_StorageValue
  ):Promise<void> {
    expectStorageKey    ('VoltCloud customer storage key',StorageKey)
    expectStorageValue('VoltCloud customer storage value',StorageValue)

    assertDeveloperFocus()
    assertApplicationFocus()
    assertCustomerFocus()

    try {
      await ResponseOf(
        'private', 'PUT', '{{dashboard_url}}/api/storage/{{customer_id}}/key/{{customer_storage_key}}', {
          customer_storage_key: StorageKey
        }, StorageValue
      )
    } catch (Signal) {
      switch (Signal.HTTPStatus) {
// no knowledge about HTTP status Codes yet
        default: throw Signal
      }
    }
  }

/**** deleteCustomerStorageEntry ****/

  export async function deleteCustomerStorageEntry (
    StorageKey:VC_StorageKey
  ):Promise<void> {
    expectStorageKey('VoltCloud customer storage key',StorageKey)

    assertDeveloperFocus()
    assertApplicationFocus()
    assertCustomerFocus()

    try {
      await ResponseOf(
        'private', 'DELETE', '{{dashboard_url}}/api/storage/{{customer_id}}/key/{{customer_storage_key}}', {
          customer_storage_key: StorageKey
        }
      )
    } catch (Signal) {
      switch (Signal.HTTPStatus) {
// no knowledge about HTTP status Codes yet
        case 404: return
        default:  throw Signal
      }
    }
  }

/**** clearCustomerStorage ****/

  export async function clearCustomerStorage ():Promise<void> {
    assertDeveloperFocus()
    assertApplicationFocus()
    assertCustomerFocus()

    try {
      await ResponseOf(
        'private', 'DELETE', '{{dashboard_url}}/api/storage/{{customer_id}}'
      )
    } catch (Signal) {
      switch (Signal.HTTPStatus) {
// no knowledge about HTTP status Codes yet
        default: throw Signal
      }
    }
  }

/**** ValueIsPassword - a string following VoltCloud's password rules ****/

  export function ValueIsPassword (Value:any):boolean {
    return (
      ValueIsString(Value) && (Value.length >= 8) &&
      /[0-9]/.test(Value) && (Value.toLowerCase() !== Value)
    )
  }

/**** allow/expect[ed]Password ****/

  export const allowPassword = ValidatorForClassifier(
    ValueIsPassword, acceptNil, 'valid VoltCloud password'
  ), allowedPassword = allowPassword

  export const expectPassword = ValidatorForClassifier(
    ValueIsPassword, rejectNil, 'valid VoltCloud password'
  ), expectedPassword = expectPassword

/**** ValueIsApplicationName - a string suitable as a VoltCloud application name ****/

  export function ValueIsApplicationName (Value:any):boolean {
    return (
      ValueIsString(Value) &&
      (Value.length >= 1) && (Value.length <= maxApplicationNameLength) &&
      ApplicationNamePattern.test(Value)
    )
  }

/**** allow/expect[ed]ApplicationName ****/

  export const allowApplicationName = ValidatorForClassifier(
    ValueIsApplicationName, acceptNil, 'valid VoltCloud application name'
  ), allowedApplicationName = allowApplicationName

  export const expectApplicationName = ValidatorForClassifier(
    ValueIsApplicationName, rejectNil, 'valid VoltCloud application name'
  ), expectedApplicationName = expectApplicationName

/**** ValueIsStorageKey - a string suitable as a VoltCloud storage key ****/

  export function ValueIsStorageKey (Value:any):boolean {
    return ValueIsNonEmptyString(Value) && (Value.length <= maxStorageKeyLength)
  }

/**** allow/expect[ed]StorageKey ****/

  export const allowStorageKey = ValidatorForClassifier(
    ValueIsStorageKey, acceptNil, 'suitable VoltCloud storage key'
  ), allowedStorageKey = allowStorageKey

  export const expectStorageKey = ValidatorForClassifier(
    ValueIsStorageKey, rejectNil, 'suitable VoltCloud storage key'
  ), expectedStorageKey = expectStorageKey

/**** ValueIsStorageValue - a string suitable as a VoltCloud storage value ****/

  export function ValueIsStorageValue (Value:any):boolean {
    return ValueIsNonEmptyString(Value) && (Value.length <= maxStorageValueLength)
  }

/**** allow/expect[ed]StorageValue ****/

  export const allowStorageValue = ValidatorForClassifier(
    ValueIsStorageValue, acceptNil, 'suitable VoltCloud storage value'
  ), allowedStorageValue = allowStorageValue

  export const expectStorageValue = ValidatorForClassifier(
    ValueIsStorageValue, rejectNil, 'suitable VoltCloud storage value'
  ), expectedStorageValue = expectStorageValue

/**** assertApplicationFocus ****/

  function assertApplicationFocus ():void {
    if (currentApplicationId == null) throwError(
      'InvalidState: please focus on a specific VoltCloud application first'
    )
  }

/**** assertDeveloperFocus ****/

  function assertDeveloperFocus ():void {
    if (currentDeveloperId == null) throwError(
      'InvalidState: please focus on a specific VoltCloud developer first'
    )
  }

/**** assertCustomerFocus ****/

  function assertCustomerFocus ():void {
    if (currentCustomerId == null) throwError(
      'InvalidState: please focus on a specific VoltCloud application customer first'
    )
  }

/**** loginDeveloper ****/

  async function loginDeveloper (
    EMailAddress:string, Password:string
  ):Promise<void> {
    currentDeveloperId       = undefined           // avoid re-try after failure
    currentDeveloperAddress  = undefined                                 // dto.
    currentDeveloperPassword = undefined                                 // dto.
    currentAccessToken       = undefined                                 // dto.

    let Response
    try {
      Response = await ResponseOf(
        'public', 'POST', '{{dashboard_url}}/api/auth/login', null, {
          grant_type: 'password',
          username:   EMailAddress,
          password:   Password,
          scope:      DashboardId
        }
      )
    } catch (Signal) {
      switch (Signal.HTTPStatus) {
        case 401: throwError('LoginFailed: developer could not be logged in')
        case 402: throwError('NoSuchUser: the given developer is unknown')
        default: throw Signal
      }
    }

    if (
      (Response != null) &&
      (Response.token_type === 'bearer') && ValueIsString(Response.access_token) &&
      ValueIsString(Response.user_id)
    ) {
      currentDeveloperId       = Response.user_id
      currentDeveloperAddress  = EMailAddress
      currentDeveloperPassword = Password
      currentAccessToken       = Response.access_token
    } else {
      throwError('InternalError: could not analyze response for login request')
    }
  }

/**** ResponseOf - simplified version for applications ****/

  async function ResponseOf (
    Mode:'public'|'private',
    Method:'GET'|'PUT'|'POST'|'DELETE', URL:string, Parameters?:any, Data?:any,
    firstAttempt:boolean = true
  ):Promise<any> {
    let fullParameters = Object.assign({}, {
      dashboard_id:   DashboardId,
      dashboard_url:  DashboardURL,
      application_id: currentApplicationId,
      application_url:currentApplicationURL,
      customer_id:    currentCustomerId,
    }, Parameters || {})

    let resolvedURL:string = resolved(URL,fullParameters)
    if (Method === 'GET') {
      resolvedURL += (
        (resolvedURL.indexOf('?') < 0 ? '?' : '&') +
        '_=' + Date.now()
      )
    }

    let RequestOptions = {
      method:  Method,
      headers: {},
      timeout: Timeout
    }
      if (Mode === 'private') {
// @ts-ignore we definitely want to index with a literal
        RequestOptions.headers['authorization'] = 'Bearer ' + currentAccessToken
      }

      let RequestBody:string|Buffer
      if (Data != null) {
        if (Buffer.isBuffer(Data)) {
          const Boundary = 'form-boundary'

          RequestBody = Buffer.concat([
            Buffer.from([
              '--' + Boundary,
              'Content-Disposition: form-data; name="file"; filename="index.zip"',
              'Content-Type: application/zip'
            ].join('\r\n') + '\r\n' + '\r\n', 'utf8'),
            Data,
            Buffer.from('\r\n' + '--' + Boundary + '--' + '\r\n', 'utf8')
          ])

// @ts-ignore we definitely want to index with a literal
          RequestOptions.headers['content-type'] = 'multipart/form-data; boundary=' + Boundary
        } else {
          RequestBody = JSON.stringify(Data)
// @ts-ignore we definitely want to index with a literal
          RequestOptions.headers['content-type']   = 'application/json'
        }

// @ts-ignore we definitely want to index with a literal
        RequestOptions.headers['content-length'] = RequestBody.length
      }
    return new Promise((resolve, reject) => {
      let Request = https.request(resolvedURL, RequestOptions, (Response:any) => {
        Response.on('error', (Error:any) => {
          reject(namedError(
            'RequestFailed: VoltCloud request failed (error code = ' +
            quoted(Error.code) + ')'
          ))
        })

        let ResponseData:string = ''
        Response.on('data', (Chunk:string) => ResponseData += Chunk)
        Response.on('end', () => {
          let StatusCode  = Response.statusCode
          let ContentType = Response.headers['content-type'] || ''
          switch (true) {
            case (StatusCode === 201):   // often with content-type "text/plain"
            case (StatusCode === 204):
              return resolve(undefined)
            case (StatusCode >= 200) && (StatusCode < 300):
              switch (true) {
                case ContentType.startsWith('application/json'):
                  return resolve(JSON.parse(ResponseData))
                default:
                  return reject(namedError(
                    'RequestFailed: unexpected response content type ' +
                    quoted(ContentType || '(missing)'), {
                      ContentType, HTTPResponse:ResponseData
                    }
                  ))
              }
            case (StatusCode === 401):
              if (firstAttempt) {         // try to "refresh" the access token
                return loginDeveloper(
                  currentDeveloperAddress as string,currentDeveloperPassword as string
                )
                .then(() => {                // try request again, but only once
                  ResponseOf(Mode, Method, URL, Parameters, Data, false)
                  .then ((Result) => resolve(Result))
                  .catch((Signal) => reject(Signal))
                })
                .catch((Signal) => reject(Signal))
              }
              return reject(namedError('AuthorizationFailure: VoltCloud request could not be authorized'))
            default:
              if (ContentType.startsWith('application/json')) {
                try {          // if given, try to use a VoltCloud error message
                  let ErrorDetails = JSON.parse(ResponseData)
                  if (
                    ValueIsNonEmptyString(ErrorDetails.type) &&
                    ValueIsNonEmptyString(ErrorDetails.message)
                  ) {
                    return reject(namedError(
                      ErrorDetails.type + ': ' + ErrorDetails.message, {
                        HTTPStatus:StatusCode, HTTPResponse:ResponseData
                      }
                    ))
                  }
                } catch (Signal) { /* otherwise create a generic error message */ }
              }

              return reject(namedError('RequestFailed: VoltCloud request failed', {
                HTTPStatus:StatusCode, HTTPResponse:ResponseData
              }))
          }
        })
      })
        Request.on('aborted', () => {
          reject(namedError('RequestAborted: VoltCloud request has been aborted'))
        })

        Request.on('timeout', () => {
          reject(namedError('RequestTimedout: VoltCloud request timed out'))
        })

        Request.on('error', (Error:any) => {
          reject(namedError(
            'RequestFailed: VoltCloud request failed before actually sending ' +
            'data (error code = ' + quoted(Error.code) + ')'
          ))
        })

        if (RequestBody != null) { Request.write(RequestBody) }
console.log('  >>',Request.method,resolvedURL)
if (Request.getHeader('Content-Type') != null) console.log('  >>',Request.getHeader('Content-Type'))
      Request.end()
    })
  }

/**** resolved ****/

  const PlaceholderPattern = /\{\{([a-z0-9_-]+)\}\}/gi

  function resolved (Text:string, VariableSet:any):string {
    return Text.replace(PlaceholderPattern, (_, VariableName) => {
      if (VariableSet.hasOwnProperty(VariableName)) {
        return VariableSet[VariableName]
      } else {
        throwError(
          'VariableNotFound: the given placeholder text refers to an ' +
          'undefined variable called ' + quoted(VariableName)
        )
      }
    })
  }

/**** namedError ****/

  function namedError (Message:string, Details?:any):Error {
    let Result
      let Match = /^([$a-zA-Z][$a-zA-Z0-9]*):\s*(\S.+)\s*$/.exec(Message)
      if (Match == null) {
        Result = new Error(Message)
      } else {
        Result = new Error(Match[2])
        Result.name = Match[1]
      }

      if (Details != null) {
        Object.assign(Result,Details)                         // not fool-proof!
      }
    return Result
  }

