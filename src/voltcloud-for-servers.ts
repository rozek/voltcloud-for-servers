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

  export VC_ApplicationRecord = {
    id:string, owner:string, subdomain:string, disabled:boolean,
    url:string, canonical_domain?:string,
    confirmation_url?:string, reset_url?:string,
    last_upload?:string, nice_links:boolean,
    cors_type:string, cors_domain?:string,
    frame_type:string, frame_domain?:string,
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

  let currentDeveloperAddress:  string | undefined
  let currentDeveloperPassword: string | undefined   // stored for token refresh
  let currentAccessToken:       string | undefined

  let currentApplicationId: string | undefined

  let currentCustomerAddress: string | undefined
  let currentCustomerId:      string | undefined

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
    if (currentDeveloperURL == null) throwError(
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
    currentDeveloperId = undefined                 // avoid re-try after failure
    currentAccessToken = undefined                                       // dto.

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
      application_url:currentApplicationURL,
      application_id: currentApplicationId,
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
        RequestOptions.headers['authorization'] = 'Bearer ' + currentAccessToken
      }

      let Body
      if (Data != null) {
        if (Data instanceof Blob) {
        } else {
          Body = JSON.stringify(Data)
          RequestOptions.headers['Content-Type']   = 'application/json'
          RequestOptions.headers['Content-Length'] = Buffer.byteLength(Body)
        }
      }


    return new Promise((resolve, reject) => {
      let Request = new XMLHttpRequest()
        Request.open(Method, resolvedURL, true)


        Request.timeout = Timeout
        Request.addEventListener('timeout', () => {
          reject(namedError('RequestTimedout: VoltCloud request timed out'))
        })

        Request.addEventListener('abort', () => {
          reject(namedError('RequestAborted: VoltCloud request has been aborted'))
        })

        Request.addEventListener('error', () => {
          if (                              // try to "refresh" the access token
            firstAttempt && (Request.status === 401) &&
            (currentCustomerAddress != null) && (currentCustomerPassword != null)
          ) {
            return loginCustomer(currentCustomerAddress,currentCustomerPassword)
            .then(() => {                    // try request again, but only once
              ResponseOf(Mode, Method, URL, Parameters, Data, false)
              .then ((Result) => resolve(Result))
              .catch((Signal) => reject(Signal))
            })
            .catch((Signal) => reject(Signal))
          }

          let ContentType = Request.getResponseHeader('content-type') || ''
          if (ContentType.startsWith('application/json')) {
            try {              // if given, try to use a VoltCloud error message
              let ErrorDetails = JSON.parse(Request.responseText)
              if (
                ValueIsNonEmptyString(ErrorDetails.type) &&
                ValueIsNonEmptyString(ErrorDetails.message)
              ) {
                return reject(namedError(
                  ErrorDetails.type + ': ' + ErrorDetails.message, {
                    HTTPStatus:Request.status, HTTPResponse:Request.responseText
                  }
                ))
              }
            } catch (Signal) { /* otherwise create a generic error message */ }
          }

          if (Request.status === 401) {
            return reject(namedError('AuthorizationFailure: VoltCloud request could not be authorized'))
          } else {
            return reject(namedError('RequestFailed: VoltCloud request failed', {
              HTTPStatus:Request.status, HTTPResponse:Request.responseText
            }))
          }
        })

        Request.addEventListener('load', () => {
          let ContentType = Request.getResponseHeader('content-type') || ''
          switch (true) {
            case (Request.responseText == null):
              return resolve(null)
            case ContentType.startsWith('application/json'):
              return resolve(JSON.parse(Request.responseText))
            default:
              return reject(namedError(
                'RequestFailed: unexpected response content type ' +
                quoted(ContentType || '(missing)'), {
                  ContentType, HTTPResponse:Request.responseText
                }
              ))
          }
        })
      Request.setRequestHeader('Content-Type','application/json')
      Request.send(Data == null ? null : JSON.stringify(Data))
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

