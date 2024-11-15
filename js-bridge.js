// Client
let client;
start();

function start() {
    client = new WebSocket("ws://localhost:8080");
    document.querySelector("h1").innerText = "Started";
    client.addEventListener("message", (e) => {
        let json = e.data;
        displayFormatted(`Packet received:\n${json}`);
        process(json);
    });
}

function process(data) {
    const packetData = JSON.parse(data);
    //console.log(`Reason: ${packetData.reason}, query: ${packetData.query}, action: ${packetData.action}`);
    switch (packetData.reason) {
        case "CSS": {
            styleChange(packetData.query, packetData.action);
            break;
        }
        case "HTML": {
            const action = packetData.action;
            displayFormatted(`action.at(0): ${action.at(0)}`);
            if (action.substring(0, 2) === "->") {
                createElement(packetData.query, packetData.action, packetData.response);
            } else if (action.substring(0, 1) === "-"
                || action.substring(0, 1) === "+"
                || action.substring(0, 1) === "/") {
                classChange(packetData.query, packetData.action);
            } else if (action.at(0) === "$") {
                query(packetData.query, packetData.action);
            } else if (action.at(0) === "@") {
                eventListener(packetData.query, packetData.action);
            } else {
                attrChange(packetData.query, packetData.action);
            }
            break;
        }
        default: { //for reasons: OTHER
            const action = packetData.action;
            switch (action) {
                case "remove": {
                    removeElement(packetData.query);
                    break;
                }
            }
        }
    }
}

function removeElement(query) {
    displayFormatted(`Removing ${query}`);
    document.querySelector(query).remove();
}

function styleChange(query, action) {
    const split = action.split("^");
    document.querySelector(query).style.setProperty(split[0], split[1]);
}

function attrChange(query, action) {
    const split = action.split("^");
    document.querySelector(query).setAttribute(split[0], split[1]);
}

function classChange(query, action) {
    const sign = action.at(0);
    const targetClass = action.substring(1);
    const element = document.querySelector(query);
    switch (sign) {
        case "+": {
            element.classList.add(targetClass);
            break;
        }
        case "-": {
            element.classList.remove(targetClass);
            break;
        }
        default: { // "/"
            element.classList.toggle(targetClass);
        }
    }
}

function createElement(query, action, response) {
    const parent = query !== "document" ? document.querySelector(query) : document.querySelector("body");
    const child = document.createElement("template");
    child.innerHTML = action.substring(2).trim();
    parent.appendChild(child.content.firstChild);
    if (response) {
        const elementData = new ElementData(parent.lastChild);
        send(new PacketData("ELEMENT_RETURN", JSON.stringify(elementData)));
    }
}

function query(query, action) {
    if (action.at(1) !== "$") {
        let requestedElement;
        if (query === "document") {
            requestedElement = document.querySelector(action.substring(1));
        } else {
            requestedElement = document.querySelector(query).querySelector(action.substring(1));
        }
        send(new PacketData("ELEMENT_RETURN", JSON.stringify(new ElementData(requestedElement))));
    } else {
        let elementArray;
        let querySelect = action.substring(2);
        console.log(`Requested a querySelectorAll for ${querySelect}`);
        if (query === "document") {
            elementArray = document.querySelectorAll(querySelect);
        } else {
            elementArray = document.querySelector(query).querySelectorAll(querySelect);
        }
        let elementJsons = [];
        elementArray.forEach(element => elementJsons.push(new ElementData(element)));
        console.log(`json array: ${elementJsons}`);
        send(new PacketData("ELEMENT_RETURN_MULTIPLE", JSON.stringify(elementJsons)));//to solve gson issue
    }
}

function eventListener(query, action) {
    displayFormatted("Called eventListener(action, query)");
    const splitArray = action.split("@");
    const event = splitArray[1];
    const callbackIdx = splitArray[2];
    displayFormatted(`Event: ${event}, callbackIdx: ${callbackIdx} for query: ${query}`);
    if (query === "document") {
        document.addEventListener(event, () => {
            send(new PacketData("LISTENER_RESPONSE", callbackIdx));
        });
    } else {
        const element = document.querySelector(query);
        console.log(`Element: ${element}`);
        element.addEventListener(event, () => {
            console.log(`idx: ${callbackIdx} called`);
            send(new PacketData("LISTENER_RESPONSE", callbackIdx));
        });
    }
}

function ElementData(element) {
    this.tag = element.tagName;
    console.log(element.tagName);
    let appendedCList = "";
    element.classList.forEach(className => {
        appendedCList += className;
        appendedCList += " ";
    });
    this.classList = appendedCList.trim();
    this.id = element.id;
}

function PacketData(reason, action) {
    this.reason = reason;
    this.action = action;
}

function send(packet) {
    const json = JSON.stringify(packet);
    displayFormatted(json);
    client.send(json);
}


// Output Formatter
function displayFormatted(msg) {
    const now = new Date();
    console.log(`[${now.getHours()} ${now.getMinutes()} ${now.getSeconds()}] - ${msg}`);
}