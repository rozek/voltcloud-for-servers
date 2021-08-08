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

/**** exitWith ****/

  function exitWith (RequestName, Signal, ExitCode) {
    console.error('\n"registerCustomer" failed with')
      if (Signal.HTTPStatus   != null) { console.error('HTTP Status  ', Signal.HTTPStatus) }
      if (Signal.HTTPResponse != null) { console.error('HTTP Response', Signal.HTTPResponse) }
    console.error(Signal)

    process.exit(ExitCode || 99)
  }
