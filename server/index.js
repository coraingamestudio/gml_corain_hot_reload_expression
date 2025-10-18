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

function trackEvent(event, info) {
    const key = getTrackedEventKey(event);
    // debugLog("Tracking key: " + key);
    const eventIsBeingTracked = trackedEventsMap.has(key);
    if (!eventIsBeingTracked) {
        trackedEventsMap.set(key, info.codeContent);
        console.log("\t" + info.objectName + " " + info.eventName.substring(0, info.eventName.search("_")).toLowerCase() + " event at line " + info.lineNumber.toString() + ":" + ((info) => { var spaces = ""; for (var i = 0; i < 6 - info.lineNumber.toString().length; i += 1) { spaces += " " } return spaces })(info) + info.codeContent);
    }
    else if (trackedEventsMap.get(key) != info.codeContent) {
        debugLog(trackedEventsMap.get(key) + " -> " + info.codeContent);
        trackedEventsMap.set(key, info.codeContent)
    }
    else {
        debugLog(info.codeContent);
    }
}

app.post('/', (req, res) => {
    var json = parseRequest(req.body);
    if (json == undefined) return;

    debugLog("Received: " + req.body);
    var info = lineOfCodeInfo(json.function_call);

    trackEvent(json.function_call, info);

    var startIndex = info.codeContent.search(hot_reload_function_name) + hot_reload_function_name.length + 1;
    var parenCount = 1;
    var i = startIndex;
    for (; parenCount > 0; i += 1) {
        switch (info.codeContent.charAt(i)) {
            case "(": parenCount += 1; break;
            case ")": parenCount -= 1; break;
        }
    }
    var expression_str = info.codeContent.substring(startIndex, i - 1);
    var expression = undefined;
    try {
        expression = math.evaluate(expression_str)
    }
    catch (e) { }

    if (expression == undefined) {
        debugLog("Error evaluating " + expression_str);
    }
    else {
        debugLog(expression_str + " = " + expression.toString());
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
    trackedEventsMap.clear();
    console.log("\nServer start\n===============================");
    serverInit();
});

app.get('/', (req, res) => {
    // res.send('Hello World from Express!');
});

app.listen(port, () => {
    // console.log(`Listening at http://localhost:${port}`);
    console.log("Server is listening");
});
