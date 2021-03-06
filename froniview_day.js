// To Customize
const baseUrl = "http://yourUrl.com"
const user = "yourName"
const passwort = "yourPassword"
const months = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"]
const targetValues = [] // your target values in Wh for each month as array with length 12
const maxPower // your maximum power output in W

// Constants for the skript, DONT CHANGE!
const lineWeight = 2;
const targetLineWeight = .5
const targetLineColor = Color.green()
const currentLineColor = Color.yellow()
const summedLineColor = Color.orange()
const verticalLineColor = Color.gray()
const font = Font.mediumSystemFont(26)
const hourFont = Font.systemFont(20)
const widgetHeight = 338
const widgetWidth = 720
const graphLow = 280
const graphHeight = 160

let spaceBetweenPoints
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
    let req = new Request(getDayRequestUrl(false) + "&token=" + await getJWT())
    let json = await req.loadJSON()

    if (json.total == undefined) {
        const errorList = new ListWidget()
        errorList.addText('Keine Ergebnisse gefunden.')
        return errorList
    } else {
        const values = json.values
        const list = new ListWidget()
        const date = new Date()

        let gesKwh = Math.round(json.total / 10) / 100
        let reachedTarget = Math.round((json.total / targetValues[date.getMonth()]) * 100)

        drawContext.setFont(font)
        drawContext.setTextColor(Color.gray())
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
        let targetPoint1 = new Point(50, graphLow - (graphHeight * 0.5))
        let targetPoint2 = new Point(670, graphLow - (graphHeight * 0.5))

        drawLine(targetPoint1, targetPoint2, targetLineWeight, targetLineColor)

        spaceBetweenPoints = 620 / await getYesterdayValueNumber()

        for (let i = 0; i < json.values.length - 1; i++) {

            let timestamp = new Date(json.values[i].timestamp)
            
            if (timestamp.getMinutes() == 0) {
                drawHourLine(timestamp, i, json.values[i].value / maxPower)
            }

            // Summed line
            let summedX1 = spaceBetweenPoints * i + 50
            let summedY1 = json.values[i].sum_of_values / (targetValues[date.getMonth()] * 2)

            let summedX2 = spaceBetweenPoints * (i + 1) + 50
            let summedY2 = json.values[i + 1].sum_of_values / (targetValues[date.getMonth()] * 2)

            let summedPoint1 = new Point(summedX1, graphLow - (graphHeight * summedY1))
            let summedPoint2 = new Point(summedX2, graphLow - (graphHeight * summedY2))

            drawLine(summedPoint1, summedPoint2, lineWeight, summedLineColor)

            // Current production value
            let x1 = spaceBetweenPoints * i + 50
            let y1 = json.values[i].value / maxPower

            let x2 = spaceBetweenPoints * (i + 1) + 50
            let y2 = json.values[i + 1].value / maxPower

            let point1 = new Point(x1, graphLow - (graphHeight * y1))
            let point2 = new Point(x2, graphLow - (graphHeight * y2))

            drawLine(point1, point2, lineWeight, currentLineColor)
        }

        let heighestValue = getHeighestValue(json.values)
        drawContext.setFont(font)
        drawContext.setTextColor(Color.orange())
        drawContext.drawText(new String(
            Math.round(heighestValue[0] / 10) / 100 + " kW"
        ).toString(),
            new Point(
                spaceBetweenPoints * heighestValue[1] + 20,
                graphLow - (graphHeight * (heighestValue[0] / maxPower) + 30)))

        return list;
    }
}

function drawHourLine(timestamp, i, y) {
    let x = spaceBetweenPoints * i + 50

    let point1 = new Point(x, graphLow - (graphHeight * y))
    let point2 = new Point(x, graphLow)

    drawContext.setTextColor(verticalLineColor)
    drawContext.setFont(hourFont)
    drawContext.drawText(timestamp.getHours() + " h" , new Point(x - 15, graphLow + 10))
    
    drawLine(point1, point2, targetLineWeight, verticalLineColor)
}

function getHeighestValue(values) {
    let res = 0
    let pos = 0
    for (let i = 0; i < values.length; i++) {
        if (values[i].value > res) {
            res = values[i].value
            pos = i
        }
    }
    return [res, pos]
}

async function getJWT() {
    let req = new Request(baseUrl + "/user/login?mail=" + user + "&password=" + passwort)
    req.method = 'POST'
    let json = await req.loadJSON()

    return json.token
}

function getDayRequestUrl(yesterday) {
    let date = new Date()

    if (yesterday) {
        date.setDate(date.getDate() - 1)
    }

    let res = baseUrl + "/day?day=" + date.getDate() + "&month=" + (date.getMonth() + 1) + "&year=" + date.getFullYear()

    return res
}

async function getYesterdayValueNumber() {
    let req = new Request(getDayRequestUrl(true) + "&token=" + await getJWT())
    let json = await req.loadJSON()

    if (json.values == undefined) {
        return undefined
    } else {
        return json.values.length
    }
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