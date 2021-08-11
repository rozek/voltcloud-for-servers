import * as https from 'https';
import { Buffer } from 'buffer';

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

function __generator(thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
}

//----------------------------------------------------------------------------//
/**** throwError - simplifies construction of named errors ****/
function throwError(Message) {
    var Match = /^([$a-zA-Z][$a-zA-Z0-9]*):\s*(\S.+)\s*$/.exec(Message);
    if (Match == null) {
        throw new Error(Message);
    }
    else {
        var namedError = new Error(Match[2]);
        namedError.name = Match[1];
        throw namedError;
    }
}
/**** ValueIsString ****/
function ValueIsString(Value) {
    return (typeof Value === 'string') || (Value instanceof String);
}
/**** ValueIs[Non]EmptyString ****/
var emptyStringPattern = /^\s*$/;
function ValueIsNonEmptyString(Value) {
    return ((typeof Value === 'string') || (Value instanceof String)) && !emptyStringPattern.test(Value.valueOf());
}
/**** ValueIsStringMatching ****/
function ValueIsStringMatching(Value, Pattern) {
    return ((typeof Value === 'string') || (Value instanceof String)) && Pattern.test(Value.valueOf());
}
/**** ValueIsPlainObject ****/
function ValueIsPlainObject(Value) {
    return ((Value != null) && (typeof Value === 'object') &&
        (Object.getPrototypeOf(Value) === Object.prototype));
}
/**** ValueIsEMailAddress ****/
var EMailAddressPattern = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;
// see https://stackoverflow.com/questions/201323/how-to-validate-an-email-address-using-a-regular-expression
function ValueIsEMailAddress(Value) {
    return ValueIsStringMatching(Value, EMailAddressPattern);
}
//------------------------------------------------------------------------------
//--                      Argument Validation Functions                       --
//------------------------------------------------------------------------------
var rejectNil = false;
var acceptNil = true;
/**** validatedArgument ****/
function validatedArgument(Description, Argument, ValueIsValid, NilIsAcceptable, Expectation) {
    if (Argument == null) {
        if (NilIsAcceptable) {
            return Argument;
        }
        else {
            throwError("MissingArgument: no " + escaped(Description) + " given");
        }
    }
    else {
        if (ValueIsValid(Argument)) {
            switch (true) {
                case Argument instanceof Boolean:
                case Argument instanceof Number:
                case Argument instanceof String:
                    return Argument.valueOf(); // unboxes any primitives
                default:
                    return Argument;
            }
        }
        else {
            throwError("InvalidArgument: the given " + escaped(Description) + " is no valid " + escaped(Expectation));
        }
    }
}
/**** ValidatorForClassifier ****/
function ValidatorForClassifier(Classifier, NilIsAcceptable, Expectation) {
    var Validator = function (Description, Argument) {
        return validatedArgument(Description, Argument, Classifier, NilIsAcceptable, Expectation);
    };
    var ClassifierName = Classifier.name;
    if ((ClassifierName != null) && /^ValueIs/.test(ClassifierName)) {
        var ValidatorName = ClassifierName.replace(// derive name from validator
        /^ValueIs/, NilIsAcceptable ? 'allow' : 'expect');
        return FunctionWithName(Validator, ValidatorName);
    }
    else {
        return Validator; // without any specific name
    }
}
/**** FunctionWithName (works with older JS engines as well) ****/
function FunctionWithName(originalFunction, desiredName) {
    if (originalFunction == null) {
        throwError('MissingArgument: no function given');
    }
    if (typeof originalFunction !== 'function') {
        throwError('InvalidArgument: the given 1st Argument is not a JavaScript function');
    }
    if (desiredName == null) {
        throwError('MissingArgument: no desired name given');
    }
    if ((typeof desiredName !== 'string') && !(desiredName instanceof String)) {
        throwError('InvalidArgument: the given desired name is not a string');
    }
    if (originalFunction.name === desiredName) {
        return originalFunction;
    }
    try {
        Object.defineProperty(originalFunction, 'name', { value: desiredName });
        if (originalFunction.name === desiredName) {
            return originalFunction;
        }
    }
    catch (signal) { /* ok - let's take the hard way */ }
    var renamed = new Function('originalFunction', 'return function ' + desiredName + ' () {' +
        'return originalFunction.apply(this,Array.prototype.slice.apply(arguments))' +
        '}');
    return renamed(originalFunction);
} // also works with older JavaScript engines
/**** expect[ed]Value ****/
function expectValue(Description, Argument) {
    if (Argument == null) {
        throwError("MissingArgument: no " + escaped(Description) + " given");
    }
    else {
        return Argument.valueOf();
    }
}
/**** allow/expect[ed]NonEmptyString ****/
var allowNonEmptyString = /*#__PURE__*/ ValidatorForClassifier(ValueIsNonEmptyString, acceptNil, 'non-empty literal string');
var expectNonEmptyString = /*#__PURE__*/ ValidatorForClassifier(ValueIsNonEmptyString, rejectNil, 'non-empty literal string');
var expectPlainObject = /*#__PURE__*/ ValidatorForClassifier(ValueIsPlainObject, rejectNil, '"plain" JavaScript object');
/**** allow/expect[ed]EMailAddress ****/
var allowEMailAddress = /*#__PURE__*/ ValidatorForClassifier(ValueIsEMailAddress, acceptNil, 'valid EMail address');
var expectEMailAddress = /*#__PURE__*/ ValidatorForClassifier(ValueIsEMailAddress, rejectNil, 'valid EMail address');
/**** escaped - escapes all control characters in a given string ****/
function escaped(Text) {
    var EscapeSequencePattern = /\\x[0-9a-zA-Z]{2}|\\u[0-9a-zA-Z]{4}|\\[0bfnrtv'"\\\/]?/g;
    var CtrlCharCodePattern = /[\x00-\x1f\x7f-\x9f]/g;
    return Text
        .replace(EscapeSequencePattern, function (Match) {
        return (Match === '\\' ? '\\\\' : Match);
    })
        .replace(CtrlCharCodePattern, function (Match) {
        switch (Match) {
            case '\0': return '\\0';
            case '\b': return '\\b';
            case '\f': return '\\f';
            case '\n': return '\\n';
            case '\r': return '\\r';
            case '\t': return '\\t';
            case '\v': return '\\v';
            default: {
                var HexCode = Match.charCodeAt(0).toString(16);
                return '\\x' + '00'.slice(HexCode.length) + HexCode;
            }
        }
    });
}
/**** quotable - makes a given string ready to be put in single/double quotes ****/
function quotable(Text, Quote) {
    if (Quote === void 0) { Quote = '"'; }
    var EscSeqOrSglQuotePattern = /\\x[0-9a-zA-Z]{2}|\\u[0-9a-zA-Z]{4}|\\[0bfnrtv'"\\\/]?|'/g;
    var EscSeqOrDblQuotePattern = /\\x[0-9a-zA-Z]{2}|\\u[0-9a-zA-Z]{4}|\\[0bfnrtv'"\\\/]?|"/g;
    var CtrlCharCodePattern = /[\x00-\x1f\x7f-\x9f]/g;
    return Text
        .replace(Quote === "'" ? EscSeqOrSglQuotePattern : EscSeqOrDblQuotePattern, function (Match) {
        switch (Match) {
            case "'": return "\\'";
            case '"': return '\\"';
            case '\\': return '\\\\';
            default: return Match;
        }
    })
        .replace(CtrlCharCodePattern, function (Match) {
        switch (Match) {
            case '\0': return '\\0';
            case '\b': return '\\b';
            case '\f': return '\\f';
            case '\n': return '\\n';
            case '\r': return '\\r';
            case '\t': return '\\t';
            case '\v': return '\\v';
            default: {
                var HexCode = Match.charCodeAt(0).toString(16);
                return '\\x' + '00'.slice(HexCode.length) + HexCode;
            }
        }
    });
}
/**** quoted ****/
function quoted(Text, Quote) {
    if (Quote === void 0) { Quote = '"'; }
    return Quote + quotable(Text, Quote) + Quote;
}

//----------------------------------------------------------------------------//
/**** VoltCloud-specific types and constants ****/
var ApplicationNamePattern = /^[0-9a-z][-0-9a-z]*$/; //see dashboard
var maxApplicationNameLength = 63; // see discussion forum
var maxEMailAddressLength = 255; // dto.
var maxNamePartLength = 255; // dto.
var maxStorageKeyLength = 255; // as mentioned in REST API docs
var maxStorageValueLength = 1048574; // see discussion forum
/**** internal constants and variables ****/
var Timeout = 30 * 1000; // request timeout given in ms
var DashboardURL = 'https://dashboard.voltcloud.io';
var DashboardId = 'RpYCMN';
var currentDeveloperId;
var currentDeveloperAddress;
var currentDeveloperPassword; // stored for token refresh
var currentAccessToken;
var currentApplicationId;
var currentApplicationURL;
var currentCustomerId;
var currentCustomerAddress;
/**** actOnBehalfOfDeveloper ****/
function actOnBehalfOfDeveloper(EMailAddress, Password) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    expectEMailAddress('VoltCloud developer email address', EMailAddress);
                    expectPassword('VoltCloud developer password', Password);
                    return [4 /*yield*/, loginDeveloper(EMailAddress, Password)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
/**** ApplicationRecords ****/
function ApplicationRecords() {
    return __awaiter(this, void 0, void 0, function () {
        var Response, Signal_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    assertDeveloperFocus();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, ResponseOf('private', 'GET', '{{dashboard_url}}/api/app')];
                case 2:
                    Response = _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    Signal_1 = _a.sent();
                    switch (Signal_1.HTTPStatus) {
                        // no knowledge about HTTP status Codes yet
                        default: throw Signal_1;
                    }
                case 4: return [2 /*return*/, Response || []];
            }
        });
    });
}
/**** focusOnApplication - async for for the sake of systematics only ****/
function focusOnApplication(ApplicationId) {
    return __awaiter(this, void 0, void 0, function () {
        var ApplicationRecordList, i, l, ApplicationRecord_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    expectNonEmptyString('VoltCloud application id', ApplicationId);
                    //  assertDeveloperFocus()               // will be done by "ApplicationRecords"
                    currentApplicationId = undefined;
                    currentApplicationURL = undefined;
                    return [4 /*yield*/, ApplicationRecords()];
                case 1:
                    ApplicationRecordList = _a.sent();
                    for (i = 0, l = ApplicationRecordList.length; i < l; i++) {
                        ApplicationRecord_1 = ApplicationRecordList[i];
                        if (ApplicationRecord_1.id === ApplicationId) {
                            currentApplicationId = ApplicationId;
                            currentApplicationURL = ApplicationRecord_1.url;
                            return [2 /*return*/];
                        }
                    }
                    throwError('NoSuchApplication: no application with id ' + quoted(ApplicationId) +
                        ' found for the currently focused developer');
                    return [2 /*return*/];
            }
        });
    });
}
/**** focusOnApplicationCalled ****/
function focusOnApplicationCalled(ApplicationName) {
    return __awaiter(this, void 0, void 0, function () {
        var ApplicationRecordList, i, l, ApplicationRecord_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    expectApplicationName('VoltCloud application name', ApplicationName);
                    //  assertDeveloperFocus()               // will be done by "ApplicationRecords"
                    currentApplicationId = undefined;
                    currentApplicationURL = undefined;
                    return [4 /*yield*/, ApplicationRecords()];
                case 1:
                    ApplicationRecordList = _a.sent();
                    for (i = 0, l = ApplicationRecordList.length; i < l; i++) {
                        ApplicationRecord_2 = ApplicationRecordList[i];
                        if (ApplicationRecord_2.subdomain === ApplicationName) {
                            currentApplicationId = ApplicationRecord_2.id;
                            currentApplicationURL = ApplicationRecord_2.url;
                            return [2 /*return*/];
                        }
                    }
                    throwError('NoSuchApplication: no application called ' + quoted(ApplicationName) +
                        ' found for the currently focused developer');
                    return [2 /*return*/];
            }
        });
    });
}
/**** focusOnNewApplication ****/
function focusOnNewApplication() {
    return __awaiter(this, void 0, void 0, function () {
        var Response, Signal_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    assertDeveloperFocus(); // will be done by "ApplicationRecords"
                    currentApplicationId = undefined;
                    currentApplicationURL = undefined;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, ResponseOf('private', 'POST', '{{dashboard_url}}/api/app', null, {})];
                case 2:
                    Response = _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    Signal_2 = _a.sent();
                    switch (Signal_2.HTTPStatus) {
                        // no knowledge about HTTP status Codes yet
                        default: throw Signal_2;
                    }
                case 4:
                    currentApplicationId = Response.id;
                    currentApplicationURL = Response.url;
                    return [2 /*return*/];
            }
        });
    });
}
/**** ApplicationRecord ****/
function ApplicationRecord() {
    return __awaiter(this, void 0, void 0, function () {
        var Response, Signal_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    assertDeveloperFocus();
                    assertApplicationFocus();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, ResponseOf('private', 'GET', '{{dashboard_url}}/api/app/{{application_id}}')];
                case 2:
                    Response = _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    Signal_3 = _a.sent();
                    switch (Signal_3.HTTPStatus) {
                        // no knowledge about HTTP status Codes yet
                        default: throw Signal_3;
                    }
                case 4: return [2 /*return*/, Response];
            }
        });
    });
}
/**** changeApplicationNameTo ****/
function changeApplicationNameTo(ApplicationName) {
    return __awaiter(this, void 0, void 0, function () {
        var Signal_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    expectApplicationName('VoltCloud application name', ApplicationName);
                    assertDeveloperFocus();
                    assertApplicationFocus();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, ResponseOf('private', 'PUT', '{{dashboard_url}}/api/app/{{application_id}}', null, {
                            subdomain: ApplicationName
                        })];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    Signal_4 = _a.sent();
                    switch (Signal_4.HTTPStatus) {
                        // no knowledge about HTTP status Codes yet
                        default: throw Signal_4;
                    }
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**** updateApplicationRecordBy ****/
function updateApplicationRecordBy(Settings) {
    return __awaiter(this, void 0, void 0, function () {
        var Signal_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    expectPlainObject('VoltCloud application settings', Settings);
                    assertDeveloperFocus();
                    assertApplicationFocus();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, ResponseOf('private', 'PUT', '{{dashboard_url}}/api/app/{{application_id}}', null, Settings)];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    Signal_5 = _a.sent();
                    switch (Signal_5.HTTPStatus) {
                        // no knowledge about HTTP status Codes yet
                        default: throw Signal_5;
                    }
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**** uploadToApplication ****/
function uploadToApplication(ZIPArchive) {
    return __awaiter(this, void 0, void 0, function () {
        var Signal_6;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    expectValue('ZIP archive', ZIPArchive);
                    if (!Buffer.isBuffer(ZIPArchive))
                        throwError('InvalidArgument: the given ZIP archive is no valid Node.js buffer');
                    assertDeveloperFocus();
                    assertApplicationFocus();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, ResponseOf('private', 'POST', '{{dashboard_url}}/api/app/{{application_id}}/version', {
                            application_id: currentApplicationId
                        }, ZIPArchive)];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    Signal_6 = _a.sent();
                    switch (Signal_6.HTTPStatus) {
                        // no knowledge about HTTP status Codes yet
                        default: throw Signal_6;
                    }
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**** deleteApplication ****/
function deleteApplication(ApplicationId) {
    return __awaiter(this, void 0, void 0, function () {
        var Signal_7;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    allowNonEmptyString('VoltCloud application id', ApplicationId);
                    assertDeveloperFocus();
                    if (ApplicationId == null) {
                        assertApplicationFocus();
                        ApplicationId = currentApplicationId;
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, ResponseOf('private', 'DELETE', '{{dashboard_url}}/api/app/{{application_id}}', {
                            application_id: ApplicationId
                        })];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    Signal_7 = _a.sent();
                    switch (Signal_7.HTTPStatus) {
                        // no knowledge about HTTP status Codes yet
                        default: throw Signal_7;
                    }
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**** ApplicationStorage ****/
function ApplicationStorage() {
    return __awaiter(this, void 0, void 0, function () {
        var Response, Signal_8;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    assertDeveloperFocus();
                    assertApplicationFocus();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, ResponseOf('private', 'GET', '{{dashboard_url}}/api/storage/{{application_id}}')];
                case 2:
                    Response = _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    Signal_8 = _a.sent();
                    switch (Signal_8.HTTPStatus) {
                        // no knowledge about HTTP status Codes yet
                        default: throw Signal_8;
                    }
                case 4: return [2 /*return*/, Response || {}];
            }
        });
    });
}
/**** ApplicationStorageEntry ****/
function ApplicationStorageEntry(StorageKey) {
    return __awaiter(this, void 0, void 0, function () {
        var Response, Signal_9;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    expectStorageKey('VoltCloud application storage key', StorageKey);
                    assertDeveloperFocus();
                    assertApplicationFocus();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, ResponseOf('private', 'GET', '{{dashboard_url}}/api/storage/{{application_id}}/key/{{application_storage_key}}', {
                            application_storage_key: StorageKey
                        })];
                case 2:
                    Response = _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    Signal_9 = _a.sent();
                    switch (Signal_9.HTTPStatus) {
                        // no knowledge about HTTP status Codes yet
                        case 404: return [2 /*return*/, undefined];
                        default: throw Signal_9;
                    }
                case 4: return [2 /*return*/, Response];
            }
        });
    });
}
/**** setApplicationStorageEntryTo ****/
function setApplicationStorageEntryTo(StorageKey, StorageValue) {
    return __awaiter(this, void 0, void 0, function () {
        var Signal_10;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    expectStorageKey('VoltCloud application storage key', StorageKey);
                    expectStorageValue('VoltCloud application storage value', StorageValue);
                    assertDeveloperFocus();
                    assertApplicationFocus();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, ResponseOf('private', 'PUT', '{{dashboard_url}}/api/storage/{{application_id}}/key/{{application_storage_key}}', {
                            application_storage_key: StorageKey
                        }, StorageValue)];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    Signal_10 = _a.sent();
                    switch (Signal_10.HTTPStatus) {
                        // no knowledge about HTTP status Codes yet
                        default: throw Signal_10;
                    }
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**** deleteApplicationStorageEntry ****/
function deleteApplicationStorageEntry(StorageKey) {
    return __awaiter(this, void 0, void 0, function () {
        var Signal_11;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    expectStorageKey('VoltCloud application storage key', StorageKey);
                    assertDeveloperFocus();
                    assertApplicationFocus();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, ResponseOf('private', 'DELETE', '{{dashboard_url}}/api/storage/{{application_id}}/key/{{application_storage_key}}', {
                            application_storage_key: StorageKey
                        })];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    Signal_11 = _a.sent();
                    switch (Signal_11.HTTPStatus) {
                        // no knowledge about HTTP status Codes yet
                        case 404: return [2 /*return*/];
                        default: throw Signal_11;
                    }
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**** clearApplicationStorage ****/
function clearApplicationStorage() {
    return __awaiter(this, void 0, void 0, function () {
        var Signal_12;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    assertDeveloperFocus();
                    assertApplicationFocus();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, ResponseOf('private', 'DELETE', '{{dashboard_url}}/api/storage/{{application_id}}')];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    Signal_12 = _a.sent();
                    switch (Signal_12.HTTPStatus) {
                        // no knowledge about HTTP status Codes yet
                        default: throw Signal_12;
                    }
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**** CustomerRecords ****/
function CustomerRecords() {
    return __awaiter(this, void 0, void 0, function () {
        var Response, Signal_13;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    assertDeveloperFocus();
                    assertApplicationFocus();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, ResponseOf('private', 'GET', '{{dashboard_url}}/api/app/{{application_id}}/users')];
                case 2:
                    Response = _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    Signal_13 = _a.sent();
                    switch (Signal_13.HTTPStatus) {
                        // no knowledge about HTTP status Codes yet
                        default: throw Signal_13;
                    }
                case 4: return [2 /*return*/, Response || []];
            }
        });
    });
}
/**** focusOnCustomer - async for for the sake of systematics only ****/
function focusOnCustomer(CustomerId) {
    return __awaiter(this, void 0, void 0, function () {
        var CustomerRecordList, i, l, CustomerRecord_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    expectNonEmptyString('VoltCloud customer id', CustomerId);
                    //  assertDeveloperFocus()                  // will be done by "CustomerRecords"
                    //  assertApplicationFocus()                                             // dto.
                    currentCustomerId = undefined;
                    currentCustomerAddress = undefined;
                    return [4 /*yield*/, CustomerRecords()];
                case 1:
                    CustomerRecordList = _a.sent();
                    for (i = 0, l = CustomerRecordList.length; i < l; i++) {
                        CustomerRecord_1 = CustomerRecordList[i];
                        if (CustomerRecord_1.id === CustomerId) {
                            currentCustomerId = CustomerId;
                            currentCustomerAddress = CustomerRecord_1.email;
                            return [2 /*return*/];
                        }
                    }
                    throwError('NoSuchCustomer: no customer with id ' + quoted(CustomerId) +
                        ' found for the currently focused application');
                    return [2 /*return*/];
            }
        });
    });
}
/**** focusOnCustomerWithAddress ****/
function focusOnCustomerWithAddress(CustomerAddress) {
    return __awaiter(this, void 0, void 0, function () {
        var CustomerRecordList, i, l, CustomerRecord_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    expectEMailAddress('VoltCloud customer email address', CustomerAddress);
                    //  assertDeveloperFocus()                  // will be done by "CustomerRecords"
                    //  assertApplicationFocus()                                             // dto.
                    currentCustomerId = undefined;
                    currentCustomerAddress = undefined;
                    return [4 /*yield*/, CustomerRecords()];
                case 1:
                    CustomerRecordList = _a.sent();
                    for (i = 0, l = CustomerRecordList.length; i < l; i++) {
                        CustomerRecord_2 = CustomerRecordList[i];
                        if (CustomerRecord_2.email === CustomerAddress) {
                            currentCustomerId = CustomerRecord_2.id;
                            currentCustomerAddress = CustomerAddress;
                            return [2 /*return*/];
                        }
                    }
                    throwError('NoSuchCustomer: no customer with email address ' + quoted(CustomerAddress) +
                        ' found for the currently focused application');
                    return [2 /*return*/];
            }
        });
    });
}
/**** focusOnNewCustomer ****/
function focusOnNewCustomer(EMailAddress, Password) {
    return __awaiter(this, void 0, void 0, function () {
        var Response, Signal_14;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    expectEMailAddress('VoltCloud customer email address', EMailAddress);
                    expectPassword('VoltCloud customer password', Password);
                    //  assertDeveloperFocus()                             // not really needed here
                    assertApplicationFocus();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, ResponseOf('public', 'POST', '{{application_url}}/api/auth/register', null, {
                            email: EMailAddress,
                            password: Password,
                            confirmation: Password,
                            scope: currentApplicationId
                        })];
                case 2:
                    Response = _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    Signal_14 = _a.sent();
                    switch (Signal_14.HTTPStatus) {
                        case 404: throwError('NoSuchApplication: the currently focused application could not be found');
                        case 409: throwError('UserExists: the given email address is already used');
                        case 422: throwError('BadPassword: the given password does not meet the VoltCloud requirements');
                        default: throw Signal_14;
                    }
                    return [3 /*break*/, 4];
                case 4:
                    if ((Response != null) && ValueIsString(Response.id)) {
                        currentCustomerId = Response.id;
                        currentCustomerAddress = EMailAddress;
                    }
                    else {
                        throwError('InternalError: could not analyze response for registration request');
                    }
                    return [2 /*return*/];
            }
        });
    });
}
/**** resendConfirmationEMailToCustomer ****/
function resendConfirmationEMailToCustomer(EMailAddress) {
    return __awaiter(this, void 0, void 0, function () {
        var Signal_15;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    allowEMailAddress('VoltCloud customer email address', EMailAddress);
                    //  assertDeveloperFocus()                             // not really needed here
                    assertApplicationFocus();
                    if (EMailAddress == null) {
                        assertCustomerFocus();
                        EMailAddress = currentCustomerAddress;
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, ResponseOf('public', 'POST', '{{application_url}}/api/auth/resend', null, {
                            email: EMailAddress,
                            scope: currentApplicationId
                        })];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    Signal_15 = _a.sent();
                    switch (Signal_15.HTTPStatus) {
                        case 402: throwError('NoSuchUser: the given user is unknown to the currently focused application');
                        case 404: throwError('NoSuchApplication: the currently focused application could not be found');
                        case 501: throwError('Unsupported: the currently focused application does not support customer confirmations');
                        default: throw Signal_15;
                    }
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**** confirmCustomerUsing ****/
function confirmCustomerUsing(Token) {
    return __awaiter(this, void 0, void 0, function () {
        var Signal_16;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    expectNonEmptyString('VoltCloud customer confirmation token', Token);
                    //  assertDeveloperFocus()                             // not really needed here
                    assertApplicationFocus();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, ResponseOf('public', 'POST', '{{application_url}}/api/auth/confirm', null, {
                            token: Token
                        })];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    Signal_16 = _a.sent();
                    switch (Signal_16.HTTPStatus) {
                        case 401: throwError('BadToken: the given token can not be recognized');
                        default: throw Signal_16;
                    }
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**** startPasswordResetForCustomer ****/
function startPasswordResetForCustomer(EMailAddress) {
    return __awaiter(this, void 0, void 0, function () {
        var Signal_17;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    allowEMailAddress('VoltCloud customer email address', EMailAddress);
                    //  assertDeveloperFocus()                             // not really needed here
                    assertApplicationFocus();
                    if (EMailAddress == null) {
                        assertCustomerFocus();
                        EMailAddress = currentCustomerAddress;
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, ResponseOf('public', 'POST', '{{application_url}}/api/auth/forgot', null, {
                            email: EMailAddress,
                            scope: currentApplicationId
                        })];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    Signal_17 = _a.sent();
                    switch (Signal_17.HTTPStatus) {
                        case 402: throwError('NoSuchUser: the given user is unknown to the currently focused application');
                        case 404: throwError('NoSuchApplication: the currently focused application could not be found');
                        case 501: throwError('Unsupported: the currently focused application does not support password resets');
                        default: throw Signal_17;
                    }
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**** resetCustomerPasswordUsing ****/
function resetCustomerPasswordUsing(Token, Password) {
    return __awaiter(this, void 0, void 0, function () {
        var Signal_18;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    expectNonEmptyString('VoltCloud password reset token', Token);
                    expectPassword('VoltCloud customer password', Password);
                    //  assertDeveloperFocus()                             // not really needed here
                    assertApplicationFocus();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, ResponseOf('public', 'POST', '{{application_url}}/api/auth/reset', null, {
                            token: Token,
                            password: Password,
                            confirmation: Password
                        })];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    Signal_18 = _a.sent();
                    switch (Signal_18.HTTPStatus) {
                        case 401: throwError('BadToken: the given token can not be recognized');
                        case 422: throwError('BadPassword: the given password does not meet the VoltCloud requirements');
                        default: throw Signal_18;
                    }
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**** CustomerRecord ****/
function CustomerRecord(CustomerId) {
    return __awaiter(this, void 0, void 0, function () {
        var CustomerRecordList, i, l, CustomerRecord_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    allowNonEmptyString('VoltCloud customer id', CustomerId);
                    assertDeveloperFocus();
                    assertApplicationFocus();
                    if (CustomerId == null) {
                        assertCustomerFocus();
                        CustomerId = currentCustomerId;
                    }
                    return [4 /*yield*/, CustomerRecords()];
                case 1:
                    CustomerRecordList = _a.sent();
                    for (i = 0, l = CustomerRecordList.length; i < l; i++) {
                        CustomerRecord_3 = CustomerRecordList[i];
                        if (CustomerRecord_3.id = CustomerId) {
                            return [2 /*return*/, CustomerRecord_3];
                        }
                    }
                    return [2 /*return*/, undefined
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
                    ];
            }
        });
    });
}
/**** deleteCustomer ****/
function deleteCustomer() {
    return __awaiter(this, void 0, void 0, function () {
        var Signal_19;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    assertDeveloperFocus();
                    assertApplicationFocus();
                    assertCustomerFocus();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, ResponseOf('private', 'DELETE', '{{dashboard_url}}/api/user/{{customer_id}}')];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    Signal_19 = _a.sent();
                    switch (Signal_19.HTTPStatus) {
                        // no knowledge about HTTP status Codes yet
                        default: throw Signal_19;
                    }
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**** CustomerStorage ****/
function CustomerStorage() {
    return __awaiter(this, void 0, void 0, function () {
        var Response, Signal_20;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    assertDeveloperFocus();
                    assertApplicationFocus();
                    assertCustomerFocus();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, ResponseOf('private', 'GET', '{{dashboard_url}}/api/storage/{{customer_id}}')];
                case 2:
                    Response = _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    Signal_20 = _a.sent();
                    switch (Signal_20.HTTPStatus) {
                        // no knowledge about HTTP status Codes yet
                        default: throw Signal_20;
                    }
                case 4: return [2 /*return*/, Response || {}];
            }
        });
    });
}
/**** CustomerStorageEntry ****/
function CustomerStorageEntry(StorageKey) {
    return __awaiter(this, void 0, void 0, function () {
        var Response, Signal_21;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    expectStorageKey('VoltCloud customer storage key', StorageKey);
                    assertDeveloperFocus();
                    assertApplicationFocus();
                    assertCustomerFocus();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, ResponseOf('private', 'GET', '{{dashboard_url}}/api/storage/{{customer_id}}/key/{{customer_storage_key}}', {
                            customer_storage_key: StorageKey
                        })];
                case 2:
                    Response = _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    Signal_21 = _a.sent();
                    switch (Signal_21.HTTPStatus) {
                        // no knowledge about HTTP status Codes yet
                        case 404: return [2 /*return*/, undefined];
                        default: throw Signal_21;
                    }
                case 4: return [2 /*return*/, Response];
            }
        });
    });
}
/**** setCustomerStorageEntryTo ****/
function setCustomerStorageEntryTo(StorageKey, StorageValue) {
    return __awaiter(this, void 0, void 0, function () {
        var Signal_22;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    expectStorageKey('VoltCloud customer storage key', StorageKey);
                    expectStorageValue('VoltCloud customer storage value', StorageValue);
                    assertDeveloperFocus();
                    assertApplicationFocus();
                    assertCustomerFocus();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, ResponseOf('private', 'PUT', '{{dashboard_url}}/api/storage/{{customer_id}}/key/{{customer_storage_key}}', {
                            customer_storage_key: StorageKey
                        }, StorageValue)];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    Signal_22 = _a.sent();
                    switch (Signal_22.HTTPStatus) {
                        // no knowledge about HTTP status Codes yet
                        default: throw Signal_22;
                    }
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**** deleteCustomerStorageEntry ****/
function deleteCustomerStorageEntry(StorageKey) {
    return __awaiter(this, void 0, void 0, function () {
        var Signal_23;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    expectStorageKey('VoltCloud customer storage key', StorageKey);
                    assertDeveloperFocus();
                    assertApplicationFocus();
                    assertCustomerFocus();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, ResponseOf('private', 'DELETE', '{{dashboard_url}}/api/storage/{{customer_id}}/key/{{customer_storage_key}}', {
                            customer_storage_key: StorageKey
                        })];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    Signal_23 = _a.sent();
                    switch (Signal_23.HTTPStatus) {
                        // no knowledge about HTTP status Codes yet
                        case 404: return [2 /*return*/];
                        default: throw Signal_23;
                    }
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**** clearCustomerStorage ****/
function clearCustomerStorage() {
    return __awaiter(this, void 0, void 0, function () {
        var Signal_24;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    assertDeveloperFocus();
                    assertApplicationFocus();
                    assertCustomerFocus();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, ResponseOf('private', 'DELETE', '{{dashboard_url}}/api/storage/{{customer_id}}')];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    Signal_24 = _a.sent();
                    switch (Signal_24.HTTPStatus) {
                        // no knowledge about HTTP status Codes yet
                        default: throw Signal_24;
                    }
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**** ValueIsPassword - a string following VoltCloud's password rules ****/
function ValueIsPassword(Value) {
    return (ValueIsString(Value) && (Value.length >= 8) &&
        /[0-9]/.test(Value) && (Value.toLowerCase() !== Value));
}
/**** allow/expect[ed]Password ****/
var allowPassword = ValidatorForClassifier(ValueIsPassword, acceptNil, 'valid VoltCloud password'), allowedPassword = allowPassword;
var expectPassword = ValidatorForClassifier(ValueIsPassword, rejectNil, 'valid VoltCloud password'), expectedPassword = expectPassword;
/**** ValueIsApplicationName - a string suitable as a VoltCloud application name ****/
function ValueIsApplicationName(Value) {
    return (ValueIsString(Value) &&
        (Value.length >= 1) && (Value.length <= maxApplicationNameLength) &&
        ApplicationNamePattern.test(Value));
}
/**** allow/expect[ed]ApplicationName ****/
var allowApplicationName = ValidatorForClassifier(ValueIsApplicationName, acceptNil, 'valid VoltCloud application name'), allowedApplicationName = allowApplicationName;
var expectApplicationName = ValidatorForClassifier(ValueIsApplicationName, rejectNil, 'valid VoltCloud application name'), expectedApplicationName = expectApplicationName;
/**** ValueIsStorageKey - a string suitable as a VoltCloud storage key ****/
function ValueIsStorageKey(Value) {
    return ValueIsNonEmptyString(Value) && (Value.length <= maxStorageKeyLength);
}
/**** allow/expect[ed]StorageKey ****/
var allowStorageKey = ValidatorForClassifier(ValueIsStorageKey, acceptNil, 'suitable VoltCloud storage key'), allowedStorageKey = allowStorageKey;
var expectStorageKey = ValidatorForClassifier(ValueIsStorageKey, rejectNil, 'suitable VoltCloud storage key'), expectedStorageKey = expectStorageKey;
/**** ValueIsStorageValue - a string suitable as a VoltCloud storage value ****/
function ValueIsStorageValue(Value) {
    return ValueIsNonEmptyString(Value) && (Value.length <= maxStorageValueLength);
}
/**** allow/expect[ed]StorageValue ****/
var allowStorageValue = ValidatorForClassifier(ValueIsStorageValue, acceptNil, 'suitable VoltCloud storage value'), allowedStorageValue = allowStorageValue;
var expectStorageValue = ValidatorForClassifier(ValueIsStorageValue, rejectNil, 'suitable VoltCloud storage value'), expectedStorageValue = expectStorageValue;
/**** assertApplicationFocus ****/
function assertApplicationFocus() {
    if (currentApplicationId == null)
        throwError('InvalidState: please focus on a specific VoltCloud application first');
}
/**** assertDeveloperFocus ****/
function assertDeveloperFocus() {
    if (currentDeveloperId == null)
        throwError('InvalidState: please focus on a specific VoltCloud developer first');
}
/**** assertCustomerFocus ****/
function assertCustomerFocus() {
    if (currentCustomerId == null)
        throwError('InvalidState: please focus on a specific VoltCloud application customer first');
}
/**** loginDeveloper ****/
function loginDeveloper(EMailAddress, Password) {
    return __awaiter(this, void 0, void 0, function () {
        var Response, Signal_25;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    currentDeveloperId = undefined; // avoid re-try after failure
                    currentDeveloperAddress = undefined; // dto.
                    currentDeveloperPassword = undefined; // dto.
                    currentAccessToken = undefined; // dto.
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, ResponseOf('public', 'POST', '{{dashboard_url}}/api/auth/login', null, {
                            grant_type: 'password',
                            username: EMailAddress,
                            password: Password,
                            scope: DashboardId
                        })];
                case 2:
                    Response = _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    Signal_25 = _a.sent();
                    switch (Signal_25.HTTPStatus) {
                        case 401: throwError('LoginFailed: developer could not be logged in');
                        case 402: throwError('NoSuchUser: the given developer is unknown');
                        default: throw Signal_25;
                    }
                    return [3 /*break*/, 4];
                case 4:
                    if ((Response != null) &&
                        (Response.token_type === 'bearer') && ValueIsString(Response.access_token) &&
                        ValueIsString(Response.user_id)) {
                        currentDeveloperId = Response.user_id;
                        currentDeveloperAddress = EMailAddress;
                        currentDeveloperPassword = Password;
                        currentAccessToken = Response.access_token;
                    }
                    else {
                        throwError('InternalError: could not analyze response for login request');
                    }
                    return [2 /*return*/];
            }
        });
    });
}
/**** ResponseOf - simplified version for applications ****/
function ResponseOf(Mode, Method, URL, Parameters, Data, firstAttempt) {
    if (firstAttempt === void 0) { firstAttempt = true; }
    return __awaiter(this, void 0, void 0, function () {
        var fullParameters, resolvedURL, RequestOptions, RequestBody, Boundary;
        return __generator(this, function (_a) {
            fullParameters = Object.assign({}, {
                dashboard_id: DashboardId,
                dashboard_url: DashboardURL,
                application_id: currentApplicationId,
                application_url: currentApplicationURL,
                customer_id: currentCustomerId,
            }, Parameters || {});
            resolvedURL = resolved(URL, fullParameters);
            if (Method === 'GET') {
                resolvedURL += ((resolvedURL.indexOf('?') < 0 ? '?' : '&') +
                    '_=' + Date.now());
            }
            RequestOptions = {
                method: Method,
                headers: {},
                timeout: Timeout
            };
            if (Mode === 'private') {
                // @ts-ignore we definitely want to index with a literal
                RequestOptions.headers['authorization'] = 'Bearer ' + currentAccessToken;
            }
            if (Data != null) {
                if (Buffer.isBuffer(Data)) {
                    Boundary = 'form-boundary';
                    RequestBody = Buffer.concat([
                        Buffer.from([
                            '--' + Boundary,
                            'Content-Disposition: form-data; name="file"; filename="index.zip"',
                            'Content-Type: application/zip'
                        ].join('\r\n') + '\r\n' + '\r\n', 'utf8'),
                        Data,
                        Buffer.from('\r\n' + '--' + Boundary + '--' + '\r\n', 'utf8')
                    ]);
                    // @ts-ignore we definitely want to index with a literal
                    RequestOptions.headers['content-type'] = 'multipart/form-data; boundary=' + Boundary;
                }
                else {
                    RequestBody = JSON.stringify(Data);
                    // @ts-ignore we definitely want to index with a literal
                    RequestOptions.headers['content-type'] = 'application/json';
                }
                // @ts-ignore we definitely want to index with a literal
                RequestOptions.headers['content-length'] = RequestBody.length;
            }
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    var Request = https.request(resolvedURL, RequestOptions, function (Response) {
                        Response.on('error', function (Error) {
                            reject(namedError('RequestFailed: VoltCloud request failed (error code = ' +
                                quoted(Error.code) + ')'));
                        });
                        var ResponseData = '';
                        Response.on('data', function (Chunk) { return ResponseData += Chunk; });
                        Response.on('end', function () {
                            var StatusCode = Response.statusCode;
                            var ContentType = Response.headers['content-type'] || '';
                            switch (true) {
                                case (StatusCode === 201): // often with content-type "text/plain"
                                case (StatusCode === 204):
                                    return resolve(undefined);
                                case (StatusCode >= 200) && (StatusCode < 300):
                                    switch (true) {
                                        case ContentType.startsWith('application/json'):
                                            return resolve(JSON.parse(ResponseData));
                                        default:
                                            return reject(namedError('RequestFailed: unexpected response content type ' +
                                                quoted(ContentType || '(missing)'), {
                                                ContentType: ContentType,
                                                HTTPResponse: ResponseData
                                            }));
                                    }
                                case (StatusCode === 401):
                                    if (firstAttempt) { // try to "refresh" the access token
                                        return loginDeveloper(currentDeveloperAddress, currentDeveloperPassword)
                                            .then(function () {
                                            ResponseOf(Mode, Method, URL, Parameters, Data, false)
                                                .then(function (Result) { return resolve(Result); })
                                                .catch(function (Signal) { return reject(Signal); });
                                        })
                                            .catch(function (Signal) { return reject(Signal); });
                                    }
                                    return reject(namedError('AuthorizationFailure: VoltCloud request could not be authorized'));
                                default:
                                    if (ContentType.startsWith('application/json')) {
                                        try { // if given, try to use a VoltCloud error message
                                            var ErrorDetails = JSON.parse(ResponseData);
                                            if (ValueIsNonEmptyString(ErrorDetails.type) &&
                                                ValueIsNonEmptyString(ErrorDetails.message)) {
                                                return reject(namedError(ErrorDetails.type + ': ' + ErrorDetails.message, {
                                                    HTTPStatus: StatusCode, HTTPResponse: ResponseData
                                                }));
                                            }
                                        }
                                        catch (Signal) { /* otherwise create a generic error message */ }
                                    }
                                    return reject(namedError('RequestFailed: VoltCloud request failed', {
                                        HTTPStatus: StatusCode, HTTPResponse: ResponseData
                                    }));
                            }
                        });
                    });
                    Request.on('aborted', function () {
                        reject(namedError('RequestAborted: VoltCloud request has been aborted'));
                    });
                    Request.on('timeout', function () {
                        reject(namedError('RequestTimedout: VoltCloud request timed out'));
                    });
                    Request.on('error', function (Error) {
                        reject(namedError('RequestFailed: VoltCloud request failed before actually sending ' +
                            'data (error code = ' + quoted(Error.code) + ')'));
                    });
                    if (RequestBody != null) {
                        Request.write(RequestBody);
                    }
                    console.log('  >>', Request.method, resolvedURL);
                    if (Request.getHeader('Content-Type') != null)
                        console.log('  >>', Request.getHeader('Content-Type'));
                    Request.end();
                })];
        });
    });
}
/**** resolved ****/
var PlaceholderPattern = /\{\{([a-z0-9_-]+)\}\}/gi;
function resolved(Text, VariableSet) {
    return Text.replace(PlaceholderPattern, function (_, VariableName) {
        if (VariableSet.hasOwnProperty(VariableName)) {
            return VariableSet[VariableName];
        }
        else {
            throwError('VariableNotFound: the given placeholder text refers to an ' +
                'undefined variable called ' + quoted(VariableName));
        }
    });
}
/**** namedError ****/
function namedError(Message, Details) {
    var Result;
    var Match = /^([$a-zA-Z][$a-zA-Z0-9]*):\s*(\S.+)\s*$/.exec(Message);
    if (Match == null) {
        Result = new Error(Message);
    }
    else {
        Result = new Error(Match[2]);
        Result.name = Match[1];
    }
    if (Details != null) {
        Object.assign(Result, Details); // not fool-proof!
    }
    return Result;
}

export { ApplicationNamePattern, ApplicationRecord, ApplicationRecords, ApplicationStorage, ApplicationStorageEntry, CustomerRecord, CustomerRecords, CustomerStorage, CustomerStorageEntry, ValueIsApplicationName, ValueIsPassword, ValueIsStorageKey, ValueIsStorageValue, actOnBehalfOfDeveloper, allowApplicationName, allowPassword, allowStorageKey, allowStorageValue, allowedApplicationName, allowedPassword, allowedStorageKey, allowedStorageValue, changeApplicationNameTo, clearApplicationStorage, clearCustomerStorage, confirmCustomerUsing, deleteApplication, deleteApplicationStorageEntry, deleteCustomer, deleteCustomerStorageEntry, expectApplicationName, expectPassword, expectStorageKey, expectStorageValue, expectedApplicationName, expectedPassword, expectedStorageKey, expectedStorageValue, focusOnApplication, focusOnApplicationCalled, focusOnCustomer, focusOnCustomerWithAddress, focusOnNewApplication, focusOnNewCustomer, maxApplicationNameLength, maxEMailAddressLength, maxNamePartLength, maxStorageKeyLength, maxStorageValueLength, resendConfirmationEMailToCustomer, resetCustomerPasswordUsing, setApplicationStorageEntryTo, setCustomerStorageEntryTo, startPasswordResetForCustomer, updateApplicationRecordBy, uploadToApplication };
//# sourceMappingURL=voltcloud-for-servers.esm.js.map
