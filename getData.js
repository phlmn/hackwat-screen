const cors = require('cors');
const express = require('express');
const fetch = require('node-fetch');

const app = express();
app.use(cors());

function getData() {
    return fetch('https://flipdot.org/wiki/HackWat?action=raw').then((res) => {
        return res.text();
    });
}

function getLine(lines, text) {
    let lineNo = null;

    lines.forEach((line, index) => {
        const start = line.indexOf(text);
        if (start !== -1) {
            lineNo = index;
        }
    });

    return lineNo;
}

function getTableRow(line) {
    line = line.trim();
    if (line.startsWith('||') && line.endsWith('||')) {
        // remove start and end
        line = line.substring(2, line.length - 2);
    } else {
        return null;
    }

    return line.split('||').map(header => header.trim());
}

function parseTable(lines, startLineNo) {
    let currentLineNo = startLineNo;
    const table = [];

    while (true) {
        const line = lines[currentLineNo];
        const row = getTableRow(line);

        if (!row) {
            break;
        }

        table.push(row);
        currentLineNo += 1;
    }

    return table;
}

function getRowNo(table, text) {
    let rowNo = null;

    table.forEach((row, index) => {
        if (row.some(col => col.indexOf(text) !== -1)) {
            rowNo = index;
        }
    });

    return rowNo;
}

function mapRowToTalk(row) {
    return {
        start: row[0],
        end: row[1],
        speaker: row[2],
        title: row[3],
        room: row[4],
        recorded: row[5],
    };
}

app.get('/', (req, res) => {
    getData().then((data) => {
        const lines = data.split('\n');

        const titleLineNo = getLine(lines, `2018-06-01 Freitag`);

        const table = parseTable(lines, titleLineNo);

        const day1Start = getRowNo(table, '2018-06-01');
        const day2Start = getRowNo(table, '2018-06-02');
        const day3Start = getRowNo(table, '2018-06-03');

        const day1Table = table.slice(2, day2Start);
        const day2Table = table.slice(day2Start + 2, day3Start);
        const day3Table = table.slice(day3Start + 2);

        res.send({
            talks: {
                '2018-06-01': day1Table.map(mapRowToTalk),
                '2018-06-02': day2Table.map(mapRowToTalk),
                '2018-06-03': day3Table.map(mapRowToTalk),
            }
        });
    });
});

app.listen(4444, () => {
    console.log('Listening…');
});

