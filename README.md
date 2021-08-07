# voltcloud-for-servers #

a simple VoltCloud library for servers

[VoltCloud.io](https://voltcloud.io) is a simple (and cheap) deployment server for web applications with integrated user management and key-value stores for both the application itself and any of its users.

`voltcloud-for-applications` is a simple client library for servers based on Node.js which need access to VoltCloud and its functions. It is the counterpart of [voltcloud-for-applications](https://github.com/rozek/voltcloud-for-applications) which provides a similar functionality (but now from the viewpoint of an application user - aka "customer") for Web-based applications.

**NPM users**: please consider the [Github README](https://github.com/rozek/voltcloud-for-servers/blob/main/README.md) for the latest description of this package (as updating the docs would otherwise always require a new NPM package version)

> Just a small note: if you like this module and plan to use it, consider "starring" this repository (you will find the "Star" button on the top right of this page), such that I know which of my repositories to take most care of.

## API Reference ##

### exported Constants ###

`voltcloud-for-servers` exports the following constants:

* **`const maxStorageKeyLength = 255`**<br>this value defines the maximum length of any *key* in a VoltCloud key-value store
* **`const maxStorageValueLength = 1048574`**<br>this value defines the maximum length of any *value* in a VoltCloud key-value store

### exported Types ###

TypeScript programmers may import the following types in order to benefit from static type checking (JavaScript programmers may simply skip this section):

* **`type VC_CustomerRecord = { id:string, email:string, first_name?:string, last_name?:string, confirmed:boolean, admin:boolean, meta?:any }`**<br>instances of this type are returned when the settings of an already registered user are requested
* **`type VC_CustomerUpdate = { email?:string, password?:{ old:string, new:string, confirmation:string }, first_name?:string, last_name?:string }`**<br>instances of this type are used when specific settings of an already registered user shall be changed
* **`type VC_StorageKey = string`**<br>VoltCloud storage keys are strings with a length of up to `maxStorageKeyLength` characters
* **`type VC_StorageValue = string | undefined`**<br>>VoltCloud storage values are strings with a length of up to `maxStorageValueLength` characters. While VoltCloud itself responds with an error when non-existing entries are read, `voltcloud-for-applications` returns `undefined` instead
* **`type VC_StorageSet = { [Key:string]:VC_StorageValue }`**<br>a VoltCLoud storage can be seen as an associative array with literal keys and values

### exported Functions ###


## Build Instructions ##

You may easily build this package yourself.

Just install [NPM](https://docs.npmjs.com/) according to the instructions for your platform and follow these steps:

1. either clone this repository using [git](https://git-scm.com/) or [download a ZIP archive](https://github.com/rozek/voltcloud-for-servers/archive/refs/heads/main.zip) with its contents to your disk and unpack it there 
2. open a shell and navigate to the root directory of this repository
3. run `npm install` in order to install the complete build environment
4. execute `npm run build` to create a new build

If you made some changes to the source code, you may also try

```
npm run agadoo
```

in order to check if the result is still tree-shakable.

You may also look into the author's [build-configuration-study](https://github.com/rozek/build-configuration-study) for a general description of his build environment.

## License ##

[MIT License](LICENSE.md)
