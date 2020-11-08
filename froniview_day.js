const APPEARANCE = 'dark';

const lineWeight = 2;
const vertLineWeight = .5;
const accentColor1 = new Color('#33cc33', 1);
const accentColor2 = Color.lightGray();

const baseUrl = "192.168.178.65"
const user = "yourName"
const passwort = "yourPassword"
const months = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
const widgetHeight = 338;
const widgetWidth = 720;
const graphLow = 280;
const graphHeight = 160;
const spaceBetweenDays = 1;

let drawContext = new DrawContext();
drawContext.size = new Size(widgetWidth, widgetHeight);
drawContext.opaque = false;

let widget = await createWidget();
widget.setPadding(0, 0, 0, 0);
widget.backgroundImage = (drawContext.getImage());
await widget.presentMedium();

Script.setWidget(widget);
Script.complete();

async function createWidget(items) {
    let req = new Request(getDayRequestUrl() + "&token=" + await getJWT());
    let json = await req.loadJSON();

    if (json.total == undefined) {
        const errorList = new ListWidget();
        errorList.addText('Keine Ergebnisse gefunden.');
        return errorList;
    } else {
        const values = json.values;
        const list = new ListWidget();
        const date = new Date();
        const minDate = ('0' + (date.getMonth() + 1)).slice(-2) + '-' + ('0' + date.getDate()).slice(-2) + '-' + date.getFullYear();

        if (APPEARANCE === 'dark') {
            drawContext.setTextColor(Color.white());
        }
        else {
            drawContext.setTextColor(Color.black());
        }
        drawContext.setFont(Font.mediumSystemFont(26));
        drawContext.drawText('☀️ Froniview'.toUpperCase()
            + ' | '
            + date.getDate() + ". "
            + months[date.getMonth()] + " "
            + date.getFullYear()
            , new Point(25, 25));

        drawContext.setTextAlignedCenter();


        for (let i = 0; i < json.values.length; i++) {

            // Vertical Line
            const point1 = new Point(spaceBetweenDays * i + 50, graphLow + values[i].value);
            const point2 = new Point(spaceBetweenDays * i + 50, graphLow);
            drawLine(point1, point2, vertLineWeight, accentColor2);

            let dayColor;

            if (dayOfWeek == 0 || dayOfWeek == 6) {
                dayColor = accentColor2;
            }
            else if (APPEARANCE === 'dark') {
                dayColor = Color.white();
            }
            else {
                dayColor = Color.black();
            }
        }

        return list;
    }
}

async function getJWT() {
    let req = new Request(baseUrl + "/user/login?mail=" + mail + "&password=" + passwort);
    req.method = 'POST';
    let json = await req.loadJSON();

    return json.token;
}

function getDayRequestUrl() {
    let date = new Date();
    let res = baseUrl + "/day?day=" + date.getDate() + "&month=" + (date.getMonth() + 1) + "&year=" + date.getFullYear();

    return res
}

function drawTextR(text, rect, color, font) {
    drawContext.setFont(font);
    drawContext.setTextColor(color);
    drawContext.drawTextInRect(new String(text).toString(), rect);
}

function drawLine(point1, point2, width, color) {
    const path = new Path();
    path.move(point1);
    path.addLine(point2);
    drawContext.addPath(path);
    drawContext.setStrokeColor(color);
    drawContext.setLineWidth(width);
    drawContext.strokePath();
}