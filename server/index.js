const EXPORT = false;
const DEBUG_BUILD = false;

const express = require('express')
const process = require("process");
const path = require("path");

const math = require('mathjs');
const fs = require('fs');

const app = express();
const port = 8080;

const exeDir = path.dirname(process.execPath);
var projectPath;
if (!EXPORT) {
    projectPath = "A:/Programming/Github/gml_corain_hot_reload/src/corain_hot_reload/"
}
else {
    const datafilesFolder = "datafiles";
    projectPath = exeDir.substring(0, exeDir.search(datafilesFolder));
}

console.log("Project path: " + projectPath);
// console.log("Project path exists: " + fs.existsSync(projectPath));
const objectsPath = projectPath + "objects\\";

app.use(express.text({ type: '*/*' }));
// app.use(express.json());
//

var trackedEventsMap = new Map();

const hot_reload_function_name = "hot_reload";

function debugLog(message) {
    if (DEBUG_BUILD) {
        console.log(message);
    }
}

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
        const functionColor = "#ffbB871";
        const parenColor = "#C0C0C0";
        const expressionColor = "#FF8080";

        const index = getLineIDIndex(info.codeContent, info.lineID);
        const start = info.codeContent.substring(0, index);
        const hot_reload_part = colorize(info.codeContent.substring(index, index + hot_reload_function_name.length), functionColor) + colorize("(", parenColor);
        const endIndex = endIndexOfParen(info.codeContent, index + hot_reload_function_name.length + 1);
        const expr = colorize(info.codeContent.substring(index + hot_reload_function_name.length + 1, endIndex - 1), expressionColor);
        const end = colorize(")", parenColor) + info.codeContent.substring(endIndex, info.codeContent.length);
        const codeContent = start + hot_reload_part + expr + end;

        console.log("\t" + info.objectName + " " + info.eventName.substring(0, info.eventName.search("_")).toLowerCase() + " event at line " + info.lineNumber.toString() + ", position " + (info.lineID + 1).toString() + ":" + ((info) => { var spaces = ""; for (var i = 0; i < 6 - info.lineNumber.toString().length; i += 1) { spaces += " " } return spaces })(info) + codeContent);
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

app.post('/', (req, res) => {
    var json = parseRequest(req.body);
    if (json == undefined) return;

    debugLog("Received: " + req.body);
    var info = lineOfCodeInfo(json.function_call);

    trackEvent(json.function_call, info);

    var startIndex = getLineIDIndex(info.codeContent, info.lineID) + hot_reload_function_name.length + 1;
    debugLog("LineID: " + info.lineID.toString() + ", Position: " + startIndex.toString() + ", Char: " + info.codeContent.charAt(startIndex));

    const endIndex = endIndexOfParen(info.codeContent, startIndex);

    var expression_str = info.codeContent.substring(startIndex, endIndex - 1);
    debugLog(hot_reload_function_name + "(" + expression_str + ")");
    var expression;
    try {
        expression = math.evaluate(expression_str);
        debugLog(expression_str + " = " + expression.toString());
    }
    catch (e) {
        expression = undefined;
        console.log("Error evaluating " + expression_str);
    }

    res.send({ key: json.function_call, value: expression });
})

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

function serverInit() {
    console.log("Events tracked:");
}

app.post('/server_reset', (req, res) => {
    console.clear();
    trackedEventsMap.clear();
    console.log("\nServer start\n===============================");
    serverInit();
});

app.get('/', (req, res) => {
    // res.send('Hello World from Express!');
});

app.listen(port, () => {
    // console.log(`Listening at http://localhost:${port}`);
    debugLog("Server is listening");
});
