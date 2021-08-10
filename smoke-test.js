#!/usr/bin/env node
//----------------------------------------------------------------------------//
//      voltcloud-for-servers SmokeTest for CLI (to be run with Node.js)      //
//----------------------------------------------------------------------------//

  import {
    actOnBehalfOfDeveloper, ApplicationRecords, CustomerRecords,
    focusOnApplication, focusOnApplicationCalled, focusOnNewApplication,
    ApplicationRecord, changeApplicationNameTo, updateApplicationRecordBy,
      uploadToApplication, deleteApplication,
    ApplicationStorage, ApplicationStorageEntry, setApplicationStorageEntryTo,
      deleteApplicationStorageEntry, clearApplicationStorage,
    focusOnCustomer, focusOnCustomerWithAddress, focusOnNewCustomer,
    resendConfirmationEMailToCustomer, confirmCustomerUsing,
    startPasswordResetForCustomer, resetCustomerPasswordUsing,
    deleteCustomer,
    CustomerStorage, CustomerStorageEntry, setCustomerStorageEntryTo,
    deleteCustomerStorageEntry, clearCustomerStorage
  } from './dist/voltcloud-for-servers.esm.js'

  import { expect } from 'chai'

/**** some constants ****/

  const ApplicationNamePrefix = 'vfs-smoke-test-'

/**** look for some environment variables ****/

  console.clear()

  const DeveloperAddress = process.env.developer_email_address
  if (DeveloperAddress == null) {
    console.error(
      'please, set environment variable "developer_email_address" to the ' +
      'email address of a VoltCloud application developer'
    )
    process.exit(1)
  }

  const DeveloperPassword = process.env.developer_password
  if (DeveloperPassword == null) {
    console.error(
      'please, set environment variable "developer_password" to the ' +
      'password of a VoltCloud application developer'
    )
    process.exit(2)
  }

  const CustomerAddress = process.env.customer_email_address
  if (CustomerAddress == null) {
    console.error(
      'please, set environment variable "customer_email_address" to the ' +
      'email address of a potential VoltCloud user (you should have access ' +
      'to that mail box)'
    )
    process.exit(3)
  }

  const CustomerPassword = process.env.customer_password
  if (CustomerPassword == null) {
    console.error(
      'please, set environment variable "customer_password" to the ' +
      'password of a potential VoltCloud user'
    )
    process.exit(4)
  }

  const CustomerConfirmationToken = process.env.customer_confirmation_token
  const CustomerResetToken        = process.env.customer_password_reset_token

  await actOnBehalfOfDeveloper(DeveloperAddress,DeveloperPassword)
  console.log('focusing on developer "' + DeveloperAddress + '"')

/**** delete any existing smoke test applications ****/

  console.log('deleting existing smoke test applications')

  let ApplicationRecordList = await ApplicationRecords()
  ApplicationRecordList.forEach(async (ApplicationRecord) => {
    if (ApplicationRecord.subdomain.startsWith(ApplicationNamePrefix)) {
      await deleteApplication(ApplicationRecord.id)
      return
    }

    if (ApplicationRecord.last_upload == null) {    // clean up application list
      await deleteApplication(ApplicationRecord.id)
      return
    }
  })

/**** create new smoke test applications ****/

  console.log('creating new application')

  await focusOnNewApplication()

  let ApplicationInfo = await ApplicationRecord()
  console.log('- new application is called "' + ApplicationInfo.subdomain + '"')

  let ApplicationName = ApplicationNamePrefix + Math.round(Math.random()*999999999999)
  await changeApplicationNameTo(ApplicationName)

  ApplicationInfo = await ApplicationRecord()
    expect(ApplicationInfo.subdomain).to.equal(ApplicationName)
  console.log('- application was renamed to "' + ApplicationInfo.subdomain + '"')

/**** try out "focusOnApplication" ****/

  let ApplicationId = ApplicationInfo.id
  await focusOnApplication(ApplicationId)

  ApplicationInfo = await ApplicationRecord()
  expect(ApplicationInfo.id).to.equal(ApplicationId)

/**** try out "focusOnApplicationCalled" ****/

  await focusOnApplicationCalled(ApplicationName)

  ApplicationInfo = await ApplicationRecord()
  expect(ApplicationInfo.id).to.equal(ApplicationId)

/**** define user confirmation and password reset URLs ****/

  await updateApplicationRecordBy({
    confirmation_url:'/#/confirm/{{token}}',
    reset_url:       '/#/reset/{{token}}'
  })

  ApplicationInfo = await ApplicationRecord()
  expect(ApplicationInfo.confirmation_url).to.equal('/#/confirm/{{token}}')
  expect(ApplicationInfo.reset_url)       .to.equal('/#/reset/{{token}}')

/**** try out "ApplicationStorage" ****/

  function KeysOf (Storage) {
    let KeyList = []
      for (let Key in Storage) {
        if (Storage.hasOwnProperty(Key)) { KeyList.push(Key) }
      }
    return KeyList
  }

  let AppStorage = await ApplicationStorage()
  expect(KeysOf(AppStorage).length).to.equal(0)

/**** retrieve a missing key ****/

  let StorageValue = await ApplicationStorageEntry('missing-key')
  expect(StorageValue).to.equal(undefined)

/**** try out "setApplicationStorageEntryTo" ****/

  await setApplicationStorageEntryTo('key-1','value-1')

  StorageValue = await ApplicationStorageEntry('key-1')
  expect(StorageValue).to.equal('value-1')

  AppStorage = await ApplicationStorage()
  expect(KeysOf(AppStorage)).to.have.all.members(['key-1'])

/**** try out "deleteApplicationStorageEntry" ****/

  await deleteApplicationStorageEntry('missing-key')

  AppStorage = await ApplicationStorage()
  expect(KeysOf(AppStorage)).to.have.all.members(['key-1'])

  await deleteApplicationStorageEntry('key-1')

  StorageValue = await ApplicationStorageEntry('key-1')
  expect(StorageValue).to.equal(undefined)

  AppStorage = await ApplicationStorage()
  expect(KeysOf(AppStorage).length).to.equal(0)

/**** try out "clearApplicationStorage" ****/

  await setApplicationStorageEntryTo('key-1','value-1')

  await clearApplicationStorage()

  AppStorage = await ApplicationStorage()
  expect(KeysOf(AppStorage).length).to.equal(0)

  await clearApplicationStorage()

/**** clean up after testing ****/

  await deleteApplication()

/**** exitWith ****/

  function exitWith (RequestName, Signal, ExitCode) {
    console.error('\n"registerCustomer" failed with')
      if (Signal.HTTPStatus   != null) { console.error('HTTP Status  ', Signal.HTTPStatus) }
      if (Signal.HTTPResponse != null) { console.error('HTTP Response', Signal.HTTPResponse) }
    console.error(Signal)

    process.exit(ExitCode || 99)
  }
