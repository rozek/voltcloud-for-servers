//----------------------------------------------------------------------------//
//       voltcloud-for-servers - a simple VoltCloud library for servers       //
//----------------------------------------------------------------------------//

  import {
    throwError, quoted,
    ValueIsString, ValueIsNonEmptyString, ValueIsTextline, ValueIsArray,
    expectValue,
    allowNonEmptyString, expectNonEmptyString, expectPlainObject,
    allowEMailAddress, expectEMailAddress, expectURL,
    ValidatorForClassifier, acceptNil, rejectNil
  } from 'javascript-interface-library'

  import * as https from 'https'
  import { Buffer } from 'buffer'

/**** VoltCloud-specific types and constants ****/

  export const ApplicationIdPattern     = /^[a-zA-Z0-9]{6,}$/ // taken from a validation error message
  export const ApplicationNamePattern   = /^([a-z0-9]|[a-z0-9][-a-z0-9]*[a-z0-9])$/ // dto.
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

  let activeDeveloperId:       string | undefined
  let activeDeveloperAddress:  string | undefined
  let activeDeveloperPassword: string | undefined    // stored for token refresh

  let activeCustomerId:       string | undefined
  let activeCustomerAddress:  string | undefined
  let activeCustomerPassword: string | undefined     // stored for token refresh

  let activeAccessToken: string | undefined

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

/**** actOnBehalfOfCustomer ****/

  export async function actOnBehalfOfCustomer (
    EMailAddress:string, Password:string
  ):Promise<void> {
    expectEMailAddress('VoltCloud customer email address',EMailAddress)
    expectPassword         ('VoltCloud customer password',Password)

    await loginCustomer(EMailAddress,Password)
  }

/**** ApplicationRecords ****/

  export async function ApplicationRecords ():Promise<VC_ApplicationRecord[]> {
    assertDeveloperMandate()

    let Response = await ResponseOf(
      'private', 'GET', '{{dashboard_url}}/api/app'
    )
    return Response || []
  }

/**** focusOnApplication - async for for the sake of systematics only ****/

  export async function focusOnApplication (
    ApplicationIdOrURL:string
  ):Promise<void> {
    if (activeCustomerId == null) {
      expectNonEmptyString('VoltCloud application id',ApplicationIdOrURL)

      assertDeveloperMandate()

      currentApplicationId  = undefined
      currentApplicationURL = undefined

      let ApplicationRecordList = await ApplicationRecords()
      for (let i = 0, l = ApplicationRecordList.length; i < l; i++) {
        let ApplicationRecord = ApplicationRecordList[i]
        if (ApplicationRecord.id === ApplicationIdOrURL) {
          currentApplicationId  = ApplicationIdOrURL
          currentApplicationURL = ApplicationRecord.url
          return
        }
      }

      throwError(
        'NoSuchApplication: no application with id ' + quoted(ApplicationIdOrURL) +
        ' found for the currently focused developer'
      )
    } else {   // customers do not need a mandate for focusing on an application
      currentApplicationId  = undefined
      currentApplicationURL = ApplicationIdOrURL
    }
  }

/**** focusOnApplicationCalled ****/

  export async function focusOnApplicationCalled (
    ApplicationName:VC_ApplicationName
  ):Promise<void> {
    expectApplicationName('VoltCloud application name',ApplicationName)

//  assertDeveloperMandate()             // will be done by "ApplicationRecords"

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
    assertDeveloperMandate()

    currentApplicationId  = undefined
    currentApplicationURL = undefined

    let Response = await ResponseOf(
      'private', 'POST', '{{dashboard_url}}/api/app', null, {}
    )

    currentApplicationId  = Response.id
    currentApplicationURL = Response.url
  }

/**** ApplicationRecord ****/

  export async function ApplicationRecord ():Promise<VC_ApplicationRecord | undefined> {
    assertDeveloperMandate()
    assertApplicationFocus()

    let Response
    try {
      Response = await ResponseOf(
        'private', 'GET', '{{dashboard_url}}/api/app/{{application_id}}'
      )
    } catch (Signal) {
      switch (Signal.HTTPStatus) {
        case 404: switch (Signal.message) {
            case 'App not found.':
              throwError('NoSuchApplication: could not find the given application')
          }
          break
        case 422:
          if (Signal.message === 'Could not decode scope.') {
            throwError('InvalidArgument: invalid application id given')
          }
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

    assertDeveloperMandate()
    assertApplicationFocus()

    try {
      await ResponseOf(
        'private', 'PUT', '{{dashboard_url}}/api/app/{{application_id}}', null, {
          subdomain:ApplicationName
        }
      )
    } catch (Signal) {
      switch (Signal.HTTPStatus) {
        case 404: switch (Signal.message) {
            case 'Could not route your request.':
            case 'App not found.':
              throwError('NoSuchApplication: could not find the given application')
          }
          break
        case 409: throwError('ApplicationExists: an application with the given new name exists already')
        case 422: switch (Signal.message) {
            case 'Cannot change dashboard subdomain.':
              throwError('NoSuchApplication: could not find the given application')
            case 'Could not decode scope.':
              throwError('InvalidArgument: invalid application id given')
          }
        default: throw Signal
      }
    }
  }

/**** updateApplicationRecordBy ****/

  export async function updateApplicationRecordBy (
    Settings:VC_ApplicationUpdate
  ):Promise<void> {
    expectPlainObject('VoltCloud application settings',Settings)

    assertDeveloperMandate()
    assertApplicationFocus()

    try {
      await ResponseOf(
        'private', 'PUT', '{{dashboard_url}}/api/app/{{application_id}}', null, Settings
      )
    } catch (Signal) {
      switch (Signal.HTTPStatus) {
        case 404: switch (Signal.message) {
            case 'Could not route your request.':
            case 'App not found.':
              throwError('NoSuchApplication: could not find the given application')
          }
          break
        case 409: throwError('ApplicationExists: an application with the given new name exists already')
        case 422: switch (Signal.message) {
            case 'Cannot change dashboard subdomain.':
              throwError('NoSuchApplication: could not find the given application')
            case 'Could not decode scope.':
              throwError('InvalidArgument: invalid application id given')
          }
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

    assertDeveloperMandate()
    assertApplicationFocus()

    try {
      await ResponseOf(
        'private', 'POST', '{{dashboard_url}}/api/app/{{application_id}}/version', {
          application_id:currentApplicationId
        }, ZIPArchive
      )
    } catch (Signal) {
      switch (Signal.HTTPStatus) {
        case 404: switch (Signal.message) {
            case 'Could not route your request.':
            case 'App not found.':
              throwError('NoSuchApplication: could not find the given application')
          }
          break
        case 406: throwError('InternalError: ' + Signal.message)
        case 422: switch (Signal.message) {
            case 'Cannot change dashboard subdomain.':
              throwError('NoSuchApplication: could not find the given application')
            case 'Could not decode scope.':
              throwError('InvalidArgument: invalid application id given')
          }
        default: throw Signal
      }
    }
  }

/**** deleteApplication ****/

  export async function deleteApplication (
    ApplicationId:string
  ):Promise<void> {
    allowNonEmptyString('VoltCloud application id',ApplicationId)

    assertDeveloperMandate()

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
        case 403: // if you try to delete the dashboard
        case 404: switch (Signal.message) {
            case 'Could not route your request.':
            case 'App not found.':
              return
          }
          break
        case 409: throwError('ForbiddenOperation: ' + Signal.message)
        case 422: switch (Signal.message) {
            case 'Could not decode scope.':
              throwError('InvalidArgument: invalid application id given')
          }
        default: throw Signal
      }
    }
  }

/**** ApplicationStorage ****/

  export async function ApplicationStorage ():Promise<VC_StorageSet> {
    assertDeveloperOrCustomerMandate()
    assertApplicationFocus()

    let Response
    try {
      Response = await ResponseOf(
        'private', 'GET', '{{dashboard_url}}/api/storage/{{application_id}}'
      )
    } catch (Signal) {
      switch (Signal.HTTPStatus) {
        case 404: switch (Signal.message) {
            case 'Could not route your request.':
            case 'App not found.':
              throwError('NoSuchApplication: could not find the given application')
          }
          break
        case 422: switch (Signal.message) {
            case 'Could not decode scope.':
              throwError('InvalidArgument: invalid application id given')
          }
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

    assertDeveloperOrCustomerMandate()
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
        case 404: switch (Signal.message) {
            case 'Could not route your request.':
              throwError('NoSuchApplication: could not find the given application or storage key')
            case 'App not found.':
              throwError('NoSuchApplication: could not find the given application')
            case 'Key does not exist.':
              return undefined
          }
          break
        case 422: switch (Signal.message) {
            case 'Could not decode scope.':
              throwError('InvalidArgument: invalid application id given')
            case 'The length of the key parameter must be <=255.':
              throwError('InvalidArgument: the given storage key is too long')
          }
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

    assertDeveloperMandate()
    assertApplicationFocus()

    try {
      await ResponseOf(
        'private', 'PUT', '{{dashboard_url}}/api/storage/{{application_id}}/key/{{application_storage_key}}', {
          application_storage_key: StorageKey
        }, StorageValue
      )
    } catch (Signal) {
      switch (Signal.HTTPStatus) {
        case 404: switch (Signal.message) {
            case 'Could not route your request.':
            case 'App not found.':
              throwError('NoSuchApplication: could not find the given application')
          }
          break
        case 413: throwError('InvalidArgument: the given storage value is too long')
        case 422: switch (Signal.message) {
            case 'Could not decode scope.':
              throwError('InvalidArgument: invalid application id given')
            case 'The length of the key parameter must be <=255.':
              throwError('InvalidArgument: the given storage key is too long')
          }
        default: throw Signal
      }
    }
  }

/**** deleteApplicationStorageEntry ****/

  export async function deleteApplicationStorageEntry (
    StorageKey:VC_StorageKey
  ):Promise<void> {
    expectStorageKey('VoltCloud application storage key',StorageKey)

    assertDeveloperMandate()
    assertApplicationFocus()

    try {
      await ResponseOf(
        'private', 'DELETE', '{{dashboard_url}}/api/storage/{{application_id}}/key/{{application_storage_key}}', {
          application_storage_key: StorageKey
        }
      )
    } catch (Signal) {
      switch (Signal.HTTPStatus) {
        case 404: switch (Signal.message) {
            case 'Could not route your request.':
              throwError('NoSuchApplication: could not find the given application or storage key')
            case 'App not found.':
              throwError('NoSuchApplication: could not find the given application')
            case 'Key does not exist.':
              return
          }
          break
        case 422: switch (Signal.message) {
            case 'Could not decode scope.':
              throwError('InvalidArgument: invalid application id given')
            case 'The length of the key parameter must be <=255.':
              throwError('InvalidArgument: the given storage key is too long')
          }
        default: throw Signal
      }
    }
  }

/**** clearApplicationStorage ****/

  export async function clearApplicationStorage ():Promise<void> {
    assertDeveloperMandate()
    assertApplicationFocus()

    try {
      await ResponseOf(
        'private', 'DELETE', '{{dashboard_url}}/api/storage/{{application_id}}'
      )
    } catch (Signal) {
      switch (Signal.HTTPStatus) {
        case 404: switch (Signal.message) {
            case 'Could not route your request.':
            case 'App not found.':
              throwError('NoSuchApplication: could not find the given application')
          }
          break
        case 422: switch (Signal.message) {
            case 'Could not decode scope.':
              throwError('InvalidArgument: invalid application id given')
          }
        default: throw Signal
      }
    }
  }

/**** CustomerRecords ****/

  export async function CustomerRecords ():Promise<VC_CustomerRecord[]> {
    assertDeveloperMandate()
    assertApplicationFocus()

    let Response
    try {
      Response = await ResponseOf(
        'private', 'GET', '{{dashboard_url}}/api/app/{{application_id}}/users'
      )
    } catch (Signal) {
      switch (Signal.HTTPStatus) {
        case 404: switch (Signal.message) {
            case 'Could not route your request.':
            case 'App not found.':
              throwError('NoSuchApplication: could not find the given application')
          }
          break
        case 422: switch (Signal.message) {
            case 'Could not decode scope.':
              throwError('InvalidArgument: invalid application id given')
          }
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

    assertDeveloperMandate()
    assertApplicationFocus()

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
    EMailAddress:string
  ):Promise<void> {
    expectEMailAddress('VoltCloud customer email address',EMailAddress)

    assertDeveloperMandate()
    assertApplicationFocus()

    currentCustomerId      = undefined
    currentCustomerAddress = undefined

    let CustomerRecordList = await CustomerRecords()
    for (let i = 0, l = CustomerRecordList.length; i < l; i++) {
      let CustomerRecord = CustomerRecordList[i]
      if (CustomerRecord.email === EMailAddress) {
        currentCustomerId      = CustomerRecord.id
        currentCustomerAddress = EMailAddress
        return
      }
    }

    throwError(
      'NoSuchCustomer: no customer with email address ' + quoted(EMailAddress) +
      ' found for the currently focused application'
    )
  }

/**** focusOnNewCustomer ****/

  export async function focusOnNewCustomer (
    EMailAddress:string, Password:string
  ):Promise<void> {
    expectEMailAddress('VoltCloud customer email address',EMailAddress)
    expectPassword         ('VoltCloud customer password',Password)

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
        case 404: switch (Signal.message) {
            case 'Could not route your request.':
            case 'App not found.':
              throwError('NoSuchApplication: could not find the given application')
          }
          break
        case 422: switch (Signal.message) {
            case 'Could not decode scope.':
              throwError('InvalidArgument: invalid application id given')
          }
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
        case 422: switch (Signal.message) {
            case 'Could not decode scope.':
              throwError('InvalidArgument: invalid application id given')
          }
        default: throw Signal
      }
    }
  }

/**** confirmCustomerUsing ****/

  export async function confirmCustomerUsing (Token:string):Promise<void> {
    expectNonEmptyString('VoltCloud customer confirmation token',Token)

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
        case 422: switch (Signal.message) {
            case 'Could not decode scope.':
              throwError('InvalidArgument: invalid application id given')
          }
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
        default: throw Signal
      }
    }
  }

/**** CustomerRecord ****/

  export async function CustomerRecord (
    CustomerId?:string
  ):Promise<VC_CustomerRecord | undefined> {
    allowNonEmptyString('VoltCloud customer id',CustomerId)

    assertApplicationFocus()

    if (CustomerId == null) {
      assertCustomerFocus()
      CustomerId = currentCustomerId as string
    }

    let Response
      if (activeCustomerId == null) {
        assertDeveloperMandate()

      /**** custom implementation ****/

        let CustomerRecordList = await CustomerRecords()
        for (let i = 0, l = CustomerRecordList.length; i < l; i++) {
          let CustomerRecord = CustomerRecordList[i]
          if (CustomerRecord.id = CustomerId) {
            Response = CustomerRecord
            break
          }
        }
      } else {
        assertCustomerMandate()

        try {
          Response = await ResponseOf(
            'private', 'GET', '{{application_url}}/api/user/{{customer_id}}', {
              customer_id: CustomerId
            }
          )
        } catch (Signal) {
          switch (Signal.HTTPStatus) {
            case 422: switch (Signal.message) {
                case 'Could not decode scope.':
                  throwError('InvalidArgument: invalid customer id given')
              }
            default: throw Signal
          }
        }
      }

    if ((Response != null) && (Response.id === CustomerId)) {
//    currentCustomerId      = Response.id
      currentCustomerAddress = Response.email              // might have changed

      if (currentCustomerId === activeCustomerId) {
        activeCustomerAddress = Response.email             // might have changed
      }

      return Response
    } else {
      throwError('InternalError: could not analyze response for registration request')
    }
  }

/**** changeCustomerEMailAddressTo ****/

  export async function changeCustomerEMailAddressTo (
    EMailAddress:string
  ):Promise<void> {
    expectEMailAddress('VoltCloud customer email address',EMailAddress)

    assertCustomerMandate()
    assertApplicationFocus()
    assertCustomerFocus()

    let Response
    try {
      Response = await ResponseOf(
        'private', 'PUT', '{{application_url}}/api/user/{{customer_id}}', null, {
          email: EMailAddress
        }
      )
    } catch (Signal) {
      switch (Signal.HTTPStatus) {
        case 404: throwError('NoSuchUser: the given customer does not exist')
        case 409: throwError('UserExists: the given EMail address is already in use')
        case 422: switch (Signal.message) {
            case 'Could not decode scope.':
              throwError('InvalidArgument: invalid customer id given')
          }
        default: throw Signal
      }
    }

    if ((Response != null) && (Response.id === currentCustomerId)) {
//    currentCustomerId      = Response.id
      currentCustomerAddress = Response.email

      if (currentCustomerId === activeCustomerId) {
        activeCustomerAddress = Response.email             // might have changed
      }
    } else {
      throwError('InternalError: could not analyze response for registration request')
    }
  }

/**** changeCustomerPasswordTo ****/

  export async function changeCustomerPasswordTo (
    Password:string
  ):Promise<void> {
    expectPassword('VoltCloud customer password',Password)

    assertCustomerMandate()
    assertApplicationFocus()
    assertCustomerFocus()

    let Response
    try {
      Response = await ResponseOf(
        'private', 'PUT', '{{application_url}}/api/user/{{customer_id}}', null, {
          password: {
            old:          activeCustomerPassword,
            new:          Password,
            confirmation: Password
          }
        }
      )
    } catch (Signal) {
      switch (Signal.HTTPStatus) {
        case 403: throwError('ForbiddenOperation: wrong current password given')
        case 404: throwError('NoSuchUser: the given customer does not exist')
        case 422: switch (Signal.message) {
            case 'Could not decode scope.':
              throwError('InvalidArgument: invalid customer id given')
          }
        default: throw Signal
      }
    }

    if ((Response != null) && (Response.id === currentCustomerId)) {
      if (currentCustomerId === activeCustomerId) {
        activeCustomerPassword = Password
      }
    } else {
      throwError('InternalError: could not analyze response for registration request')
    }
  }

/**** updateCustomerRecordBy ****/

  export async function updateCustomerRecordBy (
    Settings:VC_CustomerUpdate
  ):Promise<void> {
    expectPlainObject('VoltCloud customer settings',Settings)

    assertCustomerMandate()
    assertApplicationFocus()
    assertCustomerFocus()

    let Response
    try {
      Response = await ResponseOf(
        'private', 'PUT', '{{application_url}}/api/user/{{customer_id}}', null, Settings
      )
    } catch (Signal) {
      switch (Signal.HTTPStatus) {
        case 403: throwError('ForbiddenOperation: wrong current password given')
        case 404: throwError('NoSuchUser: the given customer does not exist')
        case 409: throwError('UserExists: the given EMail address is already in use')
        case 422: switch (Signal.message) {
            case 'Could not decode scope.':
              throwError('InvalidArgument: invalid customer id given')
          }
        default: throw Signal
      }
    }

    if ((Response != null) && (Response.id === currentCustomerId)) {
//    currentCustomerId      = Response.id
      currentCustomerAddress = Response.email              // might have changed

      if (currentCustomerId === activeCustomerId) {
        activeCustomerAddress = Response.email             // might have changed

        if (Settings.password != null) {
          activeCustomerPassword = Settings.password.new
        }
      }
    } else {
      throwError('InternalError: could not analyze response for registration request')
    }
  }

/**** deleteCustomer ****/

  export async function deleteCustomer ():Promise<void> {
    assertDeveloperOrCustomerMandate()
    assertApplicationFocus()
    assertCustomerFocus()

    try {
      await ResponseOf(
        'private', 'DELETE', '{{dashboard_url}}/api/user/{{customer_id}}'
      )
    } catch (Signal) {
      switch (Signal.HTTPStatus) {
        case 404: switch (Signal.message) {
            case 'User not found.': return
          }
          break
        case 422: switch (Signal.message) {
            case 'Could not decode scope.':
              throwError('InvalidArgument: invalid user id given')
          }
        default: throw Signal
      }
    }
  }

/**** CustomerStorage ****/

  export async function CustomerStorage ():Promise<VC_StorageSet> {
    assertDeveloperOrCustomerMandate()
    assertApplicationFocus()
    assertCustomerFocus()

    let Response
    try {
      Response = await ResponseOf(
        'private', 'GET', '{{dashboard_url}}/api/storage/{{customer_id}}'
      )
    } catch (Signal) {
      switch (Signal.HTTPStatus) {
        case 404: switch (Signal.message) {
            case 'Could not route your request.':
            case 'User not found.':
              throwError('NoSuchCustomer: could not find the given customer')
          }
          break
        case 422: switch (Signal.message) {
            case 'Could not decode scope.':
              throwError('InvalidArgument: invalid customer id given')
          }
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

    assertDeveloperOrCustomerMandate()
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
        case 404: switch (Signal.message) {
            case 'Could not route your request.':
              throwError('NoSuchCustomer: could not find the given customer or storage key')
            case 'User not found.':
              throwError('NoSuchCustomer: could not find the given customer')
            case 'Key does not exist.':
              return undefined
          }
          break
        case 422: switch (Signal.message) {
            case 'Could not decode scope.':
              throwError('InvalidArgument: invalid customer id given')
            case 'The length of the key parameter must be <=255.':
              throwError('InvalidArgument: the given storage key is too long')
          }
        default: throw Signal
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

    assertDeveloperOrCustomerMandate()
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
        case 404: switch (Signal.message) {
            case 'Could not route your request.':
            case 'User not found.':
              throwError('NoSuchCustomer: could not find the given customer')
          }
          break
        case 413: throwError('InvalidArgument: the given storage value is too long')
        case 422: switch (Signal.message) {
            case 'Could not decode scope.':
              throwError('InvalidArgument: invalid customer id given')
            case 'The length of the key parameter must be <=255.':
              throwError('InvalidArgument: the given storage key is too long')
          }
        default: throw Signal
      }
    }
  }

/**** deleteCustomerStorageEntry ****/

  export async function deleteCustomerStorageEntry (
    StorageKey:VC_StorageKey
  ):Promise<void> {
    expectStorageKey('VoltCloud customer storage key',StorageKey)

    assertDeveloperOrCustomerMandate()
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
        case 404: switch (Signal.message) {
            case 'Could not route your request.':
            case 'User not found.':
              throwError('NoSuchCustomer: could not find the given customer')
          }
          break
        case 422: switch (Signal.message) {
            case 'Could not decode scope.':
              throwError('InvalidArgument: invalid customer id given')
            case 'The length of the key parameter must be <=255.':
              throwError('InvalidArgument: the given storage key is too long')
          }
        default: throw Signal
      }
    }
  }

/**** clearCustomerStorage ****/

  export async function clearCustomerStorage ():Promise<void> {
    assertDeveloperOrCustomerMandate()
    assertApplicationFocus()
    assertCustomerFocus()

    try {
      await ResponseOf(
        'private', 'DELETE', '{{dashboard_url}}/api/storage/{{customer_id}}'
      )
    } catch (Signal) {
      switch (Signal.HTTPStatus) {
        case 404: switch (Signal.message) {
            case 'Could not route your request.':
            case 'User not found.':
              throwError('NoSuchCustomer: could not find the given customer')
          }
          break
        case 422: switch (Signal.message) {
            case 'Could not decode scope.':
              throwError('InvalidArgument: invalid customer id given')
          }
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

/**** assertDeveloperMandate ****/

  function assertDeveloperMandate ():void {
    if (activeDeveloperId == null) throwError(
      'InvalidState: please mandate a specific VoltCloud developer first'
    )
  }

/**** assertCustomerMandate ****/

  function assertCustomerMandate ():void {
    if (activeCustomerId == null) throwError(
      'InvalidState: please mandate a specific VoltCloud customer first'
    )
  }

/**** assertDeveloperOrCustomerMandate ****/

  function assertDeveloperOrCustomerMandate ():void {
    if ((activeDeveloperId == null) && (activeCustomerId == null)) throwError(
      'InvalidState: please mandate a specific VoltCloud developer or customer first'
    )
  }

/**** assertApplicationFocus ****/

  function assertApplicationFocus ():void {
    if (currentApplicationURL == null) throwError(
      'InvalidState: please focus on a specific VoltCloud application first'
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
    activeDeveloperId       = undefined            // avoid re-try after failure
    activeDeveloperAddress  = undefined                                  // dto.
    activeDeveloperPassword = undefined                                  // dto.

    activeCustomerId       = undefined                 // clear customer mandate
    activeCustomerAddress  = undefined                                   // dto.
    activeCustomerPassword = undefined                                   // dto.

    activeAccessToken = undefined

    currentCustomerId      = undefined                   // unfocus any customer
    currentCustomerAddress = undefined                                   // dto.

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
        default: throw Signal
      }
    }

    if (
      (Response != null) &&
      (Response.token_type === 'bearer') && ValueIsString(Response.access_token) &&
      ValueIsString(Response.user_id)
    ) {
      activeDeveloperId       = Response.user_id
      activeDeveloperAddress  = EMailAddress
      activeDeveloperPassword = Password

      activeAccessToken = Response.access_token
    } else {
      throwError('InternalError: could not analyze response for login request')
    }
  }

/**** loginCustomer ****/

  async function loginCustomer (
    EMailAddress:string, Password:string
  ):Promise<void> {
    activeCustomerId       = undefined             // avoid re-try after failure
    activeCustomerAddress  = undefined                                   // dto.
    activeCustomerPassword = undefined                                   // dto.

    activeDeveloperId       = undefined               // clear developer mandate
    activeDeveloperAddress  = undefined                                  // dto.
    activeDeveloperPassword = undefined                                  // dto.

    activeAccessToken = undefined

    currentCustomerId      = undefined                   // unfocus any customer
    currentCustomerAddress = undefined                                   // dto.

    let Response
    try {
      Response = await ResponseOf(
        'public', 'POST', '{{application_url}}/api/auth/login', null, {
          grant_type: 'password',
          username:   EMailAddress,
          password:   Password,
          scope:      currentApplicationId
        }
      )
    } catch (Signal) {
      switch (Signal.HTTPStatus) {
        case 401: throwError('LoginFailed: customer could not be logged in')
        default: throw Signal
      }
    }

    if (
      (Response != null) &&
      (Response.token_type === 'bearer') && ValueIsString(Response.access_token) &&
      ValueIsString(Response.user_id)
    ) {
      activeCustomerId       = Response.user_id
      activeCustomerAddress  = EMailAddress
      activeCustomerPassword = Password

      activeAccessToken = Response.access_token

      currentCustomerId      = undefined     // auto-focus the logged-incustomer
      currentCustomerAddress = undefined                                 // dto.
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
        RequestOptions.headers['authorization'] = 'Bearer ' + activeAccessToken
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
            case (StatusCode === 204):
              return resolve(undefined)
            case (StatusCode >= 200) && (StatusCode < 300):
              switch (true) {
                case ContentType.startsWith('application/json'):
                  return resolve(JSON.parse(ResponseData))
                case (StatusCode === 201): // often w/ content-type "text/plain"
                  return resolve(undefined)
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
                return (
                  activeCustomerId == null
                  ? loginDeveloper(activeDeveloperAddress as string, activeDeveloperPassword as string)
                  : loginCustomer (activeCustomerAddress  as string, activeCustomerPassword  as string)
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
                    if (
                      (StatusCode === 422) &&
                      (ErrorDetails.type === 'ValidationError') &&
                      (ErrorDetails.validations != null)
                    ) {
                      return reject(ValidationError(ErrorDetails))
                    } else {
                      return reject(namedError(
                        ErrorDetails.type + ': ' + ErrorDetails.message, {
                          HTTPStatus:StatusCode, HTTPResponse:ResponseData
                        }
                      ))
                    }
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

/**** ValidationError ****/

  function ValidationError (Details:any):Error {
    function named422Error (Message:string) {
      return namedError(Message,{ HTTPStatus:422 })
    }

    if (
      ValueIsArray(Details.validations.body) &&
      (Details.validations.body[0] != null)
    ) {
      let firstMessage = Details.validations.body[0].messages[0]
      switch (true) {
        case firstMessage.contains('email'):
          switch (Details.validations.body[0].property) {
            case 'request.body.username':
            case 'request.body.email': return named422Error('InvalidArgument: invalid EMail address given')
          }
          break
        case firstMessage.contains('^([a-z0-9]|[a-z0-9][-a-z0-9]*[a-z0-9])$'):
          switch (Details.validations.body[0].property) {
            case 'request.body.subdomain': return named422Error('InvalidArgument: invalid application name given')
          }
          break
        case firstMessage.contains('does not meet minimum length of 1'):
          switch (Details.validations.body[0].property) {
            case 'request.body.subdomain':        return named422Error('MissingArgument: no application name given')
            case 'request.body.confirmation_url': return named422Error('MissingArgument: no Customer Confirmation URL given')
            case 'request.body.reset_url':        return named422Error('MissingArgument: no Password Reset URL given')
          }
          break
        case firstMessage.contains('does not meet maximum length of 63'):
          switch (Details.validations.body[0].property) {
            case 'request.body.subdomain':        return named422Error('InvalidArgument: the given application name is too long')
            case 'request.body.confirmation_url': return named422Error('InvalidArgument: the given Customer Confirmation URL is too long')
            case 'request.body.reset_url':        return named422Error('InvalidArgument: the given Password Reset URL is too long')
          }
          break
        case firstMessage.contains('additionalProperty'):
          return named422Error('InvalidArgument: unsupported property given')
        case firstMessage.contains('does not match pattern "[a-zA-Z0-9]{6,}"'):
          return named422Error('InvalidArgument: invalid Application Id given')
      }
    }

    if (
      ValueIsArray(Details.validations.password) &&
      (Details.validations.password[0] != null)
    ) {
      return named422Error('InvalidArgument: ' + Details.validations.password[0])
    }

  /**** fallback ****/

    return namedError('InternalError: ' + Details.message, Details)
  }

