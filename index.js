const DEBUG_BUILD = false;

const express = require('express')
const app = express();
const port = 8080;

const objectsPath = "A:/Programming/Github/gamemaker_tests/test/objects/"
console.log("Executable directory: " + __dirname);

app.use(express.text({ type: '*/*' }));
// app.use(express.json());
//

var tracked_events = new Map();

const hot_reload_function_name = "hot_reload";

const math = require('mathjs');
const fs = require('fs');

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
        objectName: "",
        eventName: "",
        codeContent: ""
    };

    var split = event_string.split(':')
    info.lineNumber = parseInt(split[1]);
    split = split[0];

    [objectName, _event] = split.split(new RegExp("_(?=[A-Z])"));
    info.objectName = objectName;
    info.eventName = _event;
    var filename = objectsPath + objectName + "/" + _event + ".gml";

    info.codeContent = fs.readFileSync(filename).toString();
    info.codeContent = info.codeContent.split("\r\n")[info.lineNumber - 1];
    return info;
}

function trackEvent(event, info) {
    const eventIsBeingTracked = tracked_events.has(event);
    if (!eventIsBeingTracked) {
        tracked_events.set(event, info.codeContent);
        console.log(event);
    }
    else if (tracked_events.get(event) != info.codeContent) {
        debugLog(tracked_events.get(event) + " -> " + info.codeContent);
        tracked_events.set(event, info.codeContent)
    }
    else {
        debugLog(info.codeContent);
    }

}

app.post('/', (req, res) => {
    var json = parseRequest(req.body);
    if (json == undefined) return;

    debugLog("Received: ", json);
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
    res.send(expression);
    return;
    // }

    // fs.readFile(filename, { encoding: 'utf-8' }, function(err, data) {
    //     if (!err) {
    //         var line = data.split('\n')[parseInt(lineNumber - 1)];
    //         console.log(line);
    //         var index = line.search(hot_reload_function_name) + hot_reload_function_name.length + 1;
    //
    //         var char = line.charAt(index);
    //         while (char != ')') {
    //             switch (char) {
    //                 case " ": {
    //                 } break;
    //                 default: {
    //                     console.log(char);
    //                 } break;
    //             }
    //             char = line.charAt(++index);
    //         }
    //     }
    //     else {
    //         console.log(err);
    //     }
    // });
    res.end();
})

app.post('/tracked_files', (req, res) => {
    var json = parseRequest(req.body);
    if (json == undefined) {
        res.send(false);
        return;
    }

    debugLog("Tracked filed request: ", json);

    var info = lineOfCodeInfo(json.function_call);
    debugLog("Line of code info", info);
    debugLog();

    var lineWasChanged = (tracked_events.has(json.function_call) && tracked_events.get(json.function_call) != info.codeContent);
    res.send(lineWasChanged);
    debugLog("Was line of code changed?\nCurrent: " + (tracked_events.has(json.function_call) ? tracked_events.get(json.function_call) : info.codeContent) + "\nNew: " + info.codeContent + "\nThe line of code " + (lineWasChanged ? "was" : "was not") + " changed\n");

    trackEvent(json.function_call, info.codeContent);
})

app.get('/', (req, res) => {
    // res.send('Hello World from Express!');
});

app.listen(port, () => {
    // console.log(`Listening at http://localhost:${port}`);
    console.log("Server is listening");
    console.log("Events tracked:");
});
