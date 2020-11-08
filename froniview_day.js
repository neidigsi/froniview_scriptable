const lineWeight = 2
const targetLineWeight = .5
const targetLineColor = Color.green()
const currentLineColor = Color.yellow()
const summedLineColor = Color.orange()

const baseUrl = "http://yourUrl.com"
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

        if (Device.isUsingDarkAppearance()) {
            drawContext.setTextColor(Color.white())
        }
        else {
            drawContext.setTextColor(Color.black())
        }

        let gesKwh = Math.round(json.total / 10) / 100
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
        let targetPoint1 = new Point(50 , graphLow - (graphHeight * 0.5))
        let targetPoint2 = new Point(670 , graphLow - (graphHeight * 0.5))

        drawLine(targetPoint1, targetPoint2, targetLineWeight, targetLineColor)

        for (let i = 0; i < json.values.length - 1; i++) {
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

        return list;
    }
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

function drawLine(point1, point2, width, color) {
    const path = new Path()
    path.move(point1)
    path.addLine(point2)
    drawContext.addPath(path)
    drawContext.setStrokeColor(color)
    drawContext.setLineWidth(width)
    drawContext.strokePath()
}