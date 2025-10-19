const EXPORT = false;
const DEBUG_BUILD = false;

const express = require('express')
const readline = require("readline");
const process = require("process");
const path = require("path");

const math = require('mathjs');
const fs = require('fs');

const app = express();
const port = 8080;

app.use(express.text({ type: '*/*' }));

const errorColor = "#FF5B5B";
const warnColor = "#FFFF00";

const functionColor = "#ffbB871";
const parenColor = "#C0C0C0";
const expressionColor = "#FF8080";
const assetColor = "#FF8080"
const varColor = "#B2B1FF";
const projectName = colorize("Hot Reload Expressions", functionColor);
const projectVersion = colorize("v0.0.3", expressionColor);

const exeDir = path.dirname(process.execPath);
var projectPath;
if (!EXPORT) {
    projectPath = "A:/Programming/Github/gml_corain_hot_reload/src/corain_hot_reload/"
}
else {
    const datafilesFolder = "datafiles";
    projectPath = exeDir.substring(0, exeDir.search(datafilesFolder));
}

// console.log("Project path exists: " + fs.existsSync(projectPath));
const objectsPath = projectPath + "objects\\";
const scriptsPath = projectPath + "scripts\\";

var trackedEventsMap = new Map();
var trackedObjects = [];
var trackedObjectEvents = new Map();
var trackedEventsContents = [];

const hot_reload_function_name = "hot_reload";

const ServerStatus = {
    pending: "pending",
    start: "start"
};

function logServerStatus(serverStatus) {
    const totalStr = colorize("Server " + serverStatus, serverStatus == ServerStatus.pending ? warnColor : "#00FF00") + colorize(" - " + projectName + " " + projectVersion, parenColor) + " - " + colorize("https://github.com/coraingamestudio/gml_corain_hot_reload_expression", varColor) + " - " + colorize("Corain Game Studio", errorColor);
    console.log(totalStr);
    console.log(colorize("=".repeat(131 + serverStatus.length), varColor));
}

function debugLog(message) {
    if (DEBUG_BUILD) {
        console.log(message);
    }
}

debugLog("Project path: " + projectPath);

function parseRequest(json_string) {
    var json = undefined;

    try {
        json = JSON.parse(json_string);
    }
    catch (e) {
        console.log("Invalid json was sent: " + json_string);
    }

    return json;
}

function lineOfCodeInfo(event_string) {
    const info = {
        lineNumber: 0,
        lineID: 0,
        objectName: "",
        eventName: "",
        codeContent: ""
    };

    var split = event_string.split(':')
    console.assert(split.length == 3, "Event string is malformed: " + event_string);

    info.lineNumber = parseInt(split[1]);
    info.lineID = parseInt(split[2]);
    split = split[0];

    [objectName, _event] = split.split(new RegExp("_(?=[A-Z])"));
    info.objectName = objectName;
    info.eventName = _event;
    var filename = objectsPath + objectName + "\\" + _event + ".gml";
    // debugLog(filename + " exists? " + fs.existsSync(filename));

    info.codeContent = fs.readFileSync(filename).toString();
    info.codeContent = info.codeContent.split("\r\n")[info.lineNumber - 1];
    return info;
}

function getTrackedEventKey(functionCall) {
    return functionCall;
}

function endIndexOfParen(codeContent, startIndex) {
    var parenCount = 1;
    var i = startIndex;
    for (; parenCount > 0; i += 1) {
        switch (codeContent.charAt(i)) {
            case "(": parenCount += 1; break;
            case ")": parenCount -= 1; break;
        }
    }
    return i;
}

function hexToRgb(hex) {
    const num = parseInt(hex.replace('#', ''), 16);
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function colorize(text, hex) {
    const [r, g, b] = hexToRgb(hex);
    return `\x1b[38;2;${r};${g};${b}m${text}\x1b[0m`;
}

function trackEvent(event, info) {
    const key = getTrackedEventKey(event);
    // debugLog("Tracking key: " + key);
    const eventIsBeingTracked = trackedEventsMap.has(key);
    if (!eventIsBeingTracked) {
        trackedEventsMap.set(key, info.codeContent);
        if (trackedObjects.indexOf(info.objectName) == -1) {
            trackedObjects.push(info.objectName);
        }

        if (!trackedObjectEvents.has(info.objectName)) {
            trackedObjectEvents.set(info.objectName, []);
        }

        const padAmount = 6;
        const index = getLineIDIndex(info.codeContent, info.lineID);
        const start = colorize(info.codeContent.substring(0, index), parenColor);
        const hot_reload_part = colorize(info.codeContent.substring(index, index + hot_reload_function_name.length), functionColor) + colorize("(", parenColor);
        const endIndex = endIndexOfParen(info.codeContent, index + hot_reload_function_name.length + 1);
        const expr = colorize(info.codeContent.substring(index + hot_reload_function_name.length + 1, endIndex - 1), expressionColor);
        const end = colorize(")", parenColor) + colorize(info.codeContent.substring(endIndex, info.codeContent.length), parenColor);
        var eventName = info.eventName.split("_");
        switch (eventName[0].toLowerCase()) {
            case "cleanup":
            case "create": {
                eventName = eventName[0];
            } break;
            case "step": {
                switch (eventName[1]) {
                    case "0": {
                        eventName = eventName[0];
                    } break;
                    case "1": {
                        eventName = "Begin_" + eventName[0];
                    } break;
                    case "2": {
                        eventName = "End_" + eventName[0];
                    } break;
                }
            } break;
            case "draw": {
                switch (eventName[1]) {
                    case "0": {
                        eventName = eventName[0];
                    } break;
                    case "64": {
                        eventName = eventName[0] + "_GUI";
                    } break;
                    case "72": {
                        eventName = eventName[0] + "_Begin";
                    } break;
                    case "73": {
                        eventName = eventName[0] + "_End";
                    } break;
                    case "76": {
                        eventName = "Pre_" + eventName[0];
                    } break;
                    case "77": {
                        eventName = "Post_" + eventName[0];
                    } break;
                }
            }
            default: {
                eventName = info.eventName;
            } break;
        }

        const codeContent = start + hot_reload_part + expr + end;
        const finalContent = colorize(info.objectName, assetColor) + ":" + colorize(eventName, functionColor) + ":" + colorize(info.lineNumber.toString(), expressionColor) + colorize(":", parenColor) + colorize((info.lineID + 1).toString(), expressionColor) + ((info) => { var spaces = ""; for (var i = 0; i < padAmount - info.lineNumber.toString().length; i += 1) { spaces += " " } return spaces })(info) + codeContent;

        trackedEventsContents.push(finalContent);
        trackedObjectEvents.get(info.objectName).push(finalContent);
    }
    else if (trackedEventsMap.get(key) != info.codeContent) {
        debugLog(trackedEventsMap.get(key) + " -> " + info.codeContent);
        trackedEventsMap.set(key, info.codeContent)
    }
    else {
        debugLog(info.codeContent);
    }
}

function nthIndex(str, pat, n) {
    var L = str.length, i = -1;
    while (n-- && i++ < L) {
        i = str.indexOf(pat, i);
        if (i < 0) break;
    }
    return i;
}

function getLineIDIndex(codeContent, lineID) {
    return nthIndex(codeContent, hot_reload_function_name, lineID + 1);
}

const CallerType = {
    function: {
        global: "global_function",
        member: "member_function",
        anon: "anon_function",
    },
    object: "object"
}

const typeMap = new Map();
typeMap.set(0, CallerType.function.global);
typeMap.set(1, CallerType.function.member);
typeMap.set(2, CallerType.function.anon);
typeMap.set(3, CallerType.object);

//Process
app.post('/', (req, res) => {
    var json = parseRequest(req.body);
    if (json == undefined) return;

    // console.log("Received: " + req.body);
    // return;
    var info = lineOfCodeInfo(json.function_call);

    trackEvent(json.function_call, info);

    var expression = Infinity;
    var startIndex = getLineIDIndex(info.codeContent, info.lineID) + hot_reload_function_name.length + 1;
    debugLog("LineID: " + info.lineID.toString() + ", Position: " + startIndex.toString() + ", Char: " + info.codeContent.charAt(startIndex));

    if (startIndex > hot_reload_function_name.length && info.codeContent.charAt(startIndex - 1) == "(") {

        const endIndex = endIndexOfParen(info.codeContent, startIndex);

        var expression_str = info.codeContent.substring(startIndex, endIndex - 1);
        debugLog(hot_reload_function_name + "(" + expression_str + ")");
        try {
            expression = math.evaluate(expression_str);
            debugLog(expression_str + " = " + expression.toString());
        }
        catch (e) {
            expression = Infinity;
            // console.log("Error evaluating " + expression_str);
        }
    }
    else {
        console.log(colorize("Parsing error: ", errorColor) + "it is recommended undoing the changes in the code or restarting the game");
    }

    res.send({ key: json.function_call, value: expression });
});

app.post('/tracked_files', (req, res) => {
    var json = parseRequest(req.body);
    if (json == undefined) {
        res.send(false);
        return;
    }

    debugLog("Tracked filed request: " + req.body);

    var info = lineOfCodeInfo(json.function_call);
    debugLog("Line of code info " + info.toString());
    debugLog("");

    const key = getTrackedEventKey(json.function_call);

    var lineWasChanged = (trackedEventsMap.has(key) && trackedEventsMap.get(key) != info.codeContent);
    lineWasChanged = true;
    res.send({ key: json.function_call, line_was_changed: lineWasChanged });
    debugLog("Was line of code changed?\nCurrent: " + (trackedEventsMap.has(key) ? trackedEventsMap.get(key) : info.codeContent) + "\nNew: " + info.codeContent + "\n\x1b[" + (lineWasChanged ? "32" : "31") + "mThe line of code " + (lineWasChanged ? "was" : "was not") + " changed\x1b[0m\n");

    trackEvent(json.function_call, info);
});

var serverWasInitialized = false;

function serverInit() {
    // rl.resume();
    console.clear();

    trackedObjectEvents.clear();
    trackedEventsMap.clear();
    trackedEventsContents = [];
    trackedObjects = [];

    logServerStatus(ServerStatus.start);
    serverWasInitialized = true;
    // console.log("Events tracked:");
    rl.prompt();
}

app.post("/continuous_connection", (req, res) => {
    if (!serverWasInitialized) {
        serverInit();
    }
})

app.post('/server_reset', (req, res) => {
    // readline.clearLine(process.stdout, 0);
    serverInit();
});

app.get('/', (req, res) => {
    // res.send('Hello World from Express!');
});

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

app.listen(port, () => {
    console.clear();
    logServerStatus(ServerStatus.pending);
    rl.prompt();
    // console.log(projectName + " server executed");
});

function logNumberOfTimesCalled(number) {
    console.log("The function is called " + colorize(number.toString(), expressionColor) + " time" + (number > 1 ? "s." : "."));
}

class Error {
    static log(string) {
        console.log(colorize(string, errorColor));
    }

    static invalidArg(arg) {
        Error.log(arg + " is not a valid argument");
    }

    static wrongArgNumber() {
        Error.log("Wrong number of arguments");
    }

    static commandNotRecognized() {
        Error.log("Command not recognized.");
    }
}

rl.on("line", (input) => {
    if (!serverWasInitialized) {
        Error.log("Can't execute any commands: server has not connected to a game.");
        rl.prompt();
        return;
    }

    const argv = input.split(" ");
    // console.log(argv);
    const argc = argv.length;

    switch (argv[0].toLowerCase()) {
        case "": break;
        case "quit": {
            console.log("Server exit.");
            process.exit(0);
        } break;
        case "calls": {
            switch (argc) {
                case 1: {
                    if (trackedEventsContents.length <= 0) {
                        console.log(colorize(hot_reload_function_name, functionColor) + colorize("() ", parenColor) + colorize("was never called", "#FFFFFF"));
                        break;
                    }

                    for (var i in trackedEventsContents) {
                        console.log(trackedEventsContents[i]);
                    }

                    logNumberOfTimesCalled(trackedEventsContents.length);
                } break;
                case 2: {
                    switch (argv[1].toLowerCase()) {
                        case "objects": {
                            var numberOfFunctionCalls = 0;
                            for (var i in trackedObjects) {
                                const events = trackedObjectEvents.get(trackedObjects[i]);
                                for (var j in events) {
                                    console.log(events[j]);
                                }

                                numberOfFunctionCalls += events.length;
                            }

                            logNumberOfTimesCalled(numberOfFunctionCalls);
                        } break;
                        default: {
                            if (trackedObjects.indexOf(argv[1]) == -1) {
                                Error.log(argv[1] + " is not being tracked or does not exist.");
                                break;
                            }

                            const events = trackedObjectEvents.get(argv[1]);
                            for (var i in events) {
                                console.log(events[i]);
                            }

                            logNumberOfTimesCalled(events.length);
                        } break;
                    }
                } break;
                default: {
                    Error.wrongArgNumber();
                } break;
            }
        } break;
        default: {
            Error.commandNotRecognized();
        } break;
    }

    rl.prompt();
});

rl.setPrompt("Server> ");
// rl.pause();
