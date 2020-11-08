const APPEARANCE = 'dark'

const lineWeight = 2
const targetLineWeight = .5
const targetLineColor = Color.green()
const accentColor1 = Color.yellow()
const accentColor2 = Color.lightGray()

const baseUrl = "http://192.168.178.65"
const user = "yourName"
const passwort = "yourPassword"
const months = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"]
const targetValues = [] // your target values in Wh for each month as array with length 12
const maxPower // your maximum power output in W
const widgetHeight = 338
const widgetWidth = 720
const graphLow = 280
const graphHeight = 160
const spaceBetweenPoints = 3.23

let drawContext = new DrawContext();
drawContext.size = new Size(widgetWidth, widgetHeight);
drawContext.opaque = false;

let widget = await createWidget()
widget.setPadding(0, 0, 0, 0)
widget.backgroundImage = (drawContext.getImage())
await widget.presentMedium()

Script.setWidget(widget)
Script.complete()

async function createWidget(items) {
    let req = new Request(getDayRequestUrl() + "&token=" + await getJWT())
    let json = await req.loadJSON()

    if (json.total == undefined) {
        const errorList = new ListWidget()
        errorList.addText('Keine Ergebnisse gefunden.')
        return errorList
    } else {
        const values = json.values
        const list = new ListWidget()
        const date = new Date()

        if (APPEARANCE === 'dark') {
            drawContext.setTextColor(Color.white())
        }
        else {
            drawContext.setTextColor(Color.black())
        }

        let gesKwh = Math.rount(json.total / 10) / 100
        let reachedTarget = Math.round((json.total / targetValues[date.getMonth()]) * 100)

        drawContext.setFont(Font.mediumSystemFont(26))
        drawContext.drawText('☀️ Froniview'.toUpperCase()
            + ' | '
            + date.getDate() + ". "
            + months[date.getMonth()] + " "
            + date.getFullYear()
            + ' | '
            + gesKwh + " kWh ≈ "
            + reachedTarget + " %"
            , new Point(25, 25))

        drawContext.setTextAlignedCenter()

        // Target Line
        let target = 1 - targetValues[date.getMonth()] / getHeighestTargetValue()

        let targetPoint1 = new Point(50 , graphLow - (graphHeight * target))
        let targetPoint2 = new Point(670 , graphLow - (graphHeight * target))

        drawLine(targetPoint1, targetPoint2, targetLineWeight, targetLineColor)

        for (let i = 0; i < json.values.length - 1; i++) {


            // Current production value
            let x1 = spaceBetweenPoints * i + 50
            let y1 = json.values[i].value / maxPower

            let x2 = spaceBetweenPoints * (i + 1) + 50
            let y2 = json.values[i + 1].value / maxPower

            let point1 = new Point(x1, graphLow - (graphHeight * y1))
            let point2 = new Point(x2, graphLow - (graphHeight * y2))

            drawLine(point1, point2, lineWeight, accentColor1)
        }

        return list;
    }
}

function getHeighestTargetValue() {
    let res = targetValues[0]

    targetValues.forEach(value => {
        if (value > res) {
            res = value
        }
    })

    return res
}

async function getJWT() {
    let req = new Request(baseUrl + "/user/login?mail=" + user + "&password=" + passwort)
    req.method = 'POST'
    let json = await req.loadJSON()

    return json.token
}

function getDayRequestUrl() {
    let date = new Date()
    let res = baseUrl + "/day?day=" + date.getDate() + "&month=" + (date.getMonth() + 1) + "&year=" + date.getFullYear()

    return res
}

function drawTextR(text, rect, color, font) {
    drawContext.setFont(font)
    drawContext.setTextColor(color)
    drawContext.drawTextInRect(new String(text).toString(), rect)
}

function drawLine(point1, point2, width, color) {
    const path = new Path()
    path.move(point1)
    path.addLine(point2)
    drawContext.addPath(path)
    drawContext.setStrokeColor(color)
    drawContext.setLineWidth(width)
    drawContext.strokePath()
}