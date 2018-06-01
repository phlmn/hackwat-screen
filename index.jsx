import classNames from 'classnames';
import format from 'date-fns/format';
import React from 'react';
import ReactDOM from 'react-dom';

class App extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            lines: [],
        };
    }

    componentDidMount() {
        this.printTodaysTalks();
    }

    printTodaysTalks = () => {
        fetch('http://phl.mn:4444/').then(res => res.json()).then((data) => {
            const today = format(new Date(), 'YYYY-MM-DD');

            this.writeLine('');
            this.writeLine('HEUTIGE TALKS');
            this.writeSeparator();
            data.talks[today].forEach(({ title, speaker, start, end, room }) => {
                this.writeLine(`'${title}' - ${speaker}`);
                this.writeLine(`${start} bis ${end} in Raum ${room}`);
                this.writeLine('');
            });
        });
    }

    writingFinished = () => {
        this.printTodaysTalks();
    }

    render() {
        return (
            <div>
                <AwesomeConsole text={this.state.lines} finished={this.writingFinished}/>
                <div className="crt"/>
                <div className="vignette"/>
            </div>
        );
    }

    writeLine(text) {
        this.setState(oldState => ({
            lines: [...oldState.lines, text],
        }));
    }

    writeSeparator() {
        this.writeLine('---------------------------------------------------');
    }
}

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

class AwesomeConsole extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            lines: [''],
            currentLine: 0,
            idle: true,
        };
    }

    componentDidMount() {
        // start typing
        setTimeout(() => this.type(), 100);
    }

    type(isRepeating = false, fixesTypo = false) {
        const { currentLine, lines } = this.state;

        let delay = 100 * ((Math.random() - 0.5) * 1.2 + 1.0);
        let nextRepeating = false;

        const wantedText = this.props.text[currentLine];
        const currentText = lines[currentLine];

        if (wantedText === undefined) {
            this.setState({
                idle: true,
            });
        } else if(wantedText !== currentText) {
            this.finishedNotified = true;

            this.setState({
                idle: false,
            });

            if (wantedText.substring(0, currentText.length) !== currentText) {
                // has typo
                if (getRandomInt(10) === 0) {
                    fixesTypo = true;
                }
            } else {
                fixesTypo = false;
            }

            let newLine;

            if (fixesTypo) {
                newLine = currentText.substr(0, currentText.length - 1);
            } else {
                let newChar = wantedText[currentText.length];

                if (newChar == undefined) {
                    // end of line and has type -> go fix it
                    fixesTypo = true;
                    newLine = currentText.substr(0, currentText.length - 1);
                } else {
                    if (!isRepeating && getRandomInt(50) === 0) {
                        // do typo
                        newChar = String.fromCharCode(newChar.charCodeAt(0) + 1);
                    }

                    if (wantedText[currentText.length + 1] === newChar && wantedText[currentText.length + 2] === newChar) {
                        if (currentText[currentText.length - 1] === newChar) {
                            delay = 30;
                            nextRepeating = true;
                        }
                        else {
                            delay = 500;
                            nextRepeating = true;
                        }
                    }

                    newLine = currentText + newChar;
                }
            }


            this.setState({
                lines: [...lines.slice(0, lines.length - 1), newLine],
            });

        } else if (this.props.text.length - 1 > currentLine) {
            this.finishedNotified = false;

            // new line
            this.setState({
                lines: [...lines, ''],
                currentLine: currentLine + 1,
            });
            delay = delay * 2;
        } else {
            // idle
            this.setState({
                idle: true,
            });

            if (!this.finishedNotified && this.props.finished) {
                this.finishedNotified = true;
                this.props.finished();
            }
        }

        setTimeout(() => this.type(nextRepeating, fixesTypo), delay);
    }

    render() {
        return (
            <div className="console-text">
                {this.state.lines.map((line, index) => (
                    <span key={index}>{line}{(index !== this.state.lines.length - 1) && <br />}</span>
                ))}
                <Cursor idle={this.state.idle}/>
            </div>
        );
    }
}

function Cursor({ idle }) {
    return (
        <span className={classNames('cursor', { idle })}>_</span>
    );
}


ReactDOM.render(<App />, document.getElementById('app'));
