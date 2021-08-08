//----------------------------------------------------------------------------//
//       voltcloud-for-servers - a simple VoltCloud library for servers       //
//----------------------------------------------------------------------------//

  import {
    throwError, quoted,
    ValueIsString, ValueIsNonEmptyString,
    expectNonEmptyString, expectPlainObject,
    expectEMailAddress, expectURL,
    ValidatorForClassifier, acceptNil, rejectNil
  } from 'javascript-interface-library'

  const https = require('https')

/**** VoltCloud-specific types and constants ****/

  export const maxStorageKeyLength   = 255      // as mentioned in REST API docs
  export const maxStorageValueLength = 1048574           // see discussion forum

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
    id:string, email:string, first_name?:string, last_name?:string,
    confirmed:boolean, admin:boolean, meta?:any
  }

  export type VC_CustomerUpdate = {
    email?:string,
    password?:{ old:string, new:string, confirmation:string },
    first_name?:string, last_name?:string
  }

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

  }

/**** ApplicationRecords ****/

  export async function ApplicationRecords ():Promise<VC_ApplicationRecord[]> {
    assertDeveloperFocus()


  }

/**** focusOnApplication - async for for the sake of systematics only ****/

  export async function focusOnApplication (
    ApplicationId:string
  ):Promise<void> {
    expectNonEmptyString('VoltCloud application id',ApplicationId)
    currentApplicationId = ApplicationId
  } // no a-priori check of the given application id

/**** focusOnApplicationCalled ****/

  export async function focusOnApplicationCalled (
    ApplicationName:string
  ):Promise<void> {
    expectNonEmptyString('VoltCloud application name',ApplicationName)

//  assertDeveloperFocus()               // will be done by "ApplicationRecords"

    currentApplicationId = undefined

    let ApplicationRecordList = await ApplicationRecords()
    for (let i = 0, l = ApplicationRecordList.length; i < l; i++) {
      let ApplicationRecord = ApplicationRecordList[i]
      if (ApplicationRecord.subdomain === ApplicationName) {
        currentApplicationId = ApplicationRecord.id
        return
      }
    }

    throwError(
      'NoSuchApplication: no application called ' + quoted(ApplicationName) +
      ' found for the currently focused developer'
    )
  }

/**** focusOnNewApplicationCalled ****/

  export async function focusOnNewApplicationCalled (
    ApplicationName:string
  ):Promise<void> {
    expectNonEmptyString('VoltCloud application name',ApplicationName)

//  assertDeveloperFocus()               // will be done by "ApplicationRecords"

    currentApplicationId = undefined

    let ApplicationRecordList = await ApplicationRecords()
    for (let i = 0, l = ApplicationRecordList.length; i < l; i++) {
      let ApplicationRecord = ApplicationRecordList[i]
      if (ApplicationRecord.subdomain === ApplicationName) {
        throwError(
          'ApplicationExists: an application called ' + quoted(ApplicationName) +
          ' exists already for the currently focused developer'
        )
      }
    }


  }

/**** ApplicationRecord ****/

  export async function ApplicationRecord ():Promise<VC_ApplicationRecord> {
    assertDeveloperFocus()
    assertApplicationFocus()


  }

/**** updateApplicationRecordBy ****/

  export async function updateApplicationRecordBy (
    Settings:VC_ApplicationUpdate
  ):Promise<void> {

    assertDeveloperFocus()
    assertApplicationFocus()


  }

/**** uploadToApplication ****/

  export async function uploadToApplication (
    Archive:Blob
  ):Promise<void> {

    assertDeveloperFocus()
    assertApplicationFocus()


  }

/**** deleteApplication ****/

  export async function deleteApplication ():Promise<void> {
    assertDeveloperFocus()
    assertApplicationFocus()


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


        default: throw Signal
      }
    }

    return Response || {}
  }

/**** ApplicationStorageEntry ****/

  export async function ApplicationStorageEntry (
    StorageKey:VC_StorageKey
  ):Promise<VC_StorageValue> {
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


        default: throw Signal
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


  }

/**** deleteApplicationStorageEntry ****/

  export async function deleteApplicationStorageEntry (
    StorageKey:VC_StorageKey
  ):Promise<void> {
    expectStorageKey('VoltCloud application storage key',StorageKey)

    assertDeveloperFocus()
    assertApplicationFocus()

  }

/**** clearApplicationStorage ****/

  export async function clearApplicationStorage ():Promise<void> {
    assertDeveloperFocus()
    assertApplicationFocus()


  }

/**** CustomerRecords ****/

  export async function CustomerRecords ():Promise<VC_CustomerRecord[]> {
    assertDeveloperFocus()
    assertApplicationFocus()


  }

/**** focusOnCustomer - async for for the sake of systematics only ****/

  export async function focusOnCustomer (
    CustomerId:string
  ):Promise<void> {
    expectNonEmptyString('VoltCloud customer id',CustomerId)
    currentCustomerId = CustomerId
  } // no a-priori check of the given customer id

/**** focusOnCustomerWithAddress ****/

  export async function focusOnCustomerWithAddress (
    CustomerAddress:string
  ):Promise<void> {
    expectEMailAddress('VoltCloud customer email address',CustomerAddress)

    assertDeveloperFocus()
    assertApplicationFocus()


  }

/**** focusOnNewCustomer ****/

  export async function focusOnNewCustomer (
    EMailAddress:string, Password:string
  ):Promise<void> {
    expectEMailAddress('VoltCloud customer email address',EMailAddress)
    expectPassword         ('VoltCloud customer password',Password)

    assertDeveloperFocus()
    assertApplicationFocus()


  }

/**** resendConfirmationEMailToCustomer ****/

  export async function resendConfirmationEMailToCustomer (
    EMailAddress:string
  ):Promise<void> {
    expectEMailAddress('VoltCloud customer email address',EMailAddress)

    assertDeveloperFocus()
    assertApplicationFocus()


  }

/**** confirmCustomerUsing ****/

  export async function confirmCustomerUsing (Token:string):Promise<void> {
    expectNonEmptyString('VoltCloud customer confirmation token',Token)

    assertDeveloperFocus()
    assertApplicationFocus()


  }

/**** startPasswordResetForCustomer ****/

  export async function startPasswordResetForCustomer (
    EMailAddress:string
  ):Promise<void> {
    expectEMailAddress('VoltCloud customer email address',EMailAddress)

    assertDeveloperFocus()
    assertApplicationFocus()


  }

/**** resetCustomerPasswordUsing ****/

  export async function resetCustomerPasswordUsing (
    Token:string, Password:string
  ):Promise<void> {
    expectNonEmptyString('VoltCloud password reset token',Token)
    expectPassword         ('VoltCloud customer password',Password)

    assertDeveloperFocus()
    assertApplicationFocus()


  }

/**** deleteCustomer ****/

  export async function deleteCustomer ():Promise<void> {
    assertDeveloperFocus()
    assertApplicationFocus()
    assertCustomerFocus()


  }

/**** CustomerStorage ****/

  export async function CustomerStorage ():Promise<VC_StorageSet> {
    assertDeveloperFocus()
    assertApplicationFocus()
    assertCustomerFocus()


  }

/**** CustomerStorageEntry ****/

  export async function CustomerStorageEntry (
    StorageKey:VC_StorageKey
  ):Promise<VC_StorageValue> {
    expectStorageKey('VoltCloud customer storage key',StorageKey)

    assertDeveloperFocus()
    assertApplicationFocus()
    assertCustomerFocus()


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


  }

/**** deleteCustomerStorageEntry ****/

  export async function deleteCustomerStorageEntry (
    StorageKey:VC_StorageKey
  ):Promise<void> {
    expectStorageKey('VoltCloud customer storage key',StorageKey)

    assertDeveloperFocus()
    assertApplicationFocus()
    assertCustomerFocus()


  }

/**** clearCustomerStorage ****/

  export async function clearCustomerStorage ():Promise<void> {
    assertDeveloperFocus()
    assertApplicationFocus()
    assertCustomerFocus()


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
    if (currentAccessToken == null) throwError(
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
        'public', 'POST', '{{dashboard_url}}/api/auth/login', {
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
    let fullParameters = Object.assign({}, Parameters || {}, {
      dashboard_id:   DashboardId,
      dashboard_url:  DashboardURL,
      application_id: currentApplicationId,
      application_url:currentApplicationURL,
      customer_id:    currentCustomerId,
    })

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
        RequestOptions.headers['Authorization'] = 'Bearer ' + currentAccessToken
      }

      let RequestBody:string
      if (Data != null) {
        if (Data instanceof Blob) {
// <<<<
        } else {
          RequestBody = JSON.stringify(Data)
// @ts-ignore we definitely want to index with a literal
          RequestOptions.headers['Content-Type']   = 'application/json'
// @ts-ignore we definitely want to index with a literal
          RequestOptions.headers['Content-Length'] = RequestBody.length
        }
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
                  let ErrorDetails = JSON.parse(Request.responseText)
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

