import {useState, useRef, useEffect} from 'react';
import {Button} from 'antd';


const LyricsFormNew = ({
                           lyrics,
                           socket,
                           lyricsState: localLyricsState,
                           setIsRevealMode,
                           isRevealMode,
                           setHighlightIncorrect,
                       }) => {


    const [showWords, setShowWords] = useState(false);
    // const [lyricsState, setLyricsState] = useState(localLyricsState);
    // const [isRevealMode, setIsRevealMode] = useState(false);
    const containerRef = useRef(null);


    // Для управления подсветкой в режиме "Открытие слова"
    // const [highlightIncorrect, setHighlightIncorrect] = useState(false);

    function useExitRevealMode(setIsRevealMode) {
        useEffect(() => {
            const handleKeyDown = (event) => {
                if (event.key === 'Escape') {
                    setIsRevealMode(false);
                }
            };

            document.addEventListener('keydown', handleKeyDown);

            return () => {
                document.removeEventListener('keydown', handleKeyDown);
            };
        }, [setIsRevealMode]);
    }

    useExitRevealMode(setIsRevealMode);

    // const [showWords, setShowWords] = useState(false); // Текст скрыт по умолчанию

    const inputRefs = useRef([]);

    // Проверка на то было ли раскрыто слово с помощью кнопки
    const [revealedWords, setRevealedWords] = useState({});

    const [lyricsState, setLyricsState] = useState(localLyricsState);


    // Функция для изменения ячейки ввода при наборе симвлов
    const handleInputChange = (lyricsWord, sectionIndex, lineIndex, wordIndex, value) => {
        // Обновляем значение
        const updatedLyricsState = {...lyricsState};
        updatedLyricsState[sectionIndex][lineIndex][wordIndex].value = value;
        setLyricsState(updatedLyricsState);
        const valid = false

        const currentWordLength = cleanString(value).length;
        // const originalWord = lyrics[sectionIndex][0][lineIndex][wordIndex];
        const originalWordLength = cleanString(lyricsWord).length;


        if (currentWordLength === originalWordLength) {
            const wordsInLine = Object.keys(updatedLyricsState[sectionIndex][lineIndex]);


            if (Number(wordIndex) === wordsInLine.length - 1) {
                const nextLineIndex = Number(lineIndex) + 1;

                if (updatedLyricsState[sectionIndex][nextLineIndex]) {
                    // Переход к первому слову следующей строки
                    const nextInputRef = inputRefs.current[`${sectionIndex}-${nextLineIndex}-0`];
                    if (nextInputRef) {
                        nextInputRef.focus();
                    }
                } else {
                    const nextSectionIndex = Number(sectionIndex) + 1;

                    if (updatedLyricsState[nextSectionIndex]) {
                        // Переход к первому слову первой строки следующей части
                        const nextInputRef = inputRefs.current[`${nextSectionIndex}-0-0`];
                        if (nextInputRef) {
                            nextInputRef.focus();
                        }
                    }
                }
            } else {
                // Переход к следующему слову
                const nextInputRef = inputRefs.current[`${sectionIndex}-${lineIndex}-${Number(wordIndex) + 1}`];
                if (nextInputRef) {
                    nextInputRef.focus();
                }
            }

            socket.send(JSON.stringify({
                sectionIndex,
                lineIndex,
                wordIndex,
                value,
                revealed: false,
                valid: cleanString(value).toLowerCase() === cleanString(lyricsWord).toLowerCase(),
                //cleanString(lyricsStateWord).toLowerCase() === cleanString(lyricsWord).toLowerCase()
            }));

        }
    };

    const handleKeyDown = (sectionIndex, lineIndex, wordIndex, event) => {
        if (event.key === ' ') {
            event.preventDefault();
        } else if (event.key === 'Backspace' && lyricsState[sectionIndex][lineIndex][wordIndex].value.length === 0) {
            if (wordIndex > 0) {
                const prevInputRef = inputRefs.current[`${sectionIndex}-${lineIndex}-${wordIndex - 1}`];
                if (prevInputRef) {
                    prevInputRef.focus();
                }
            } else if (lineIndex > 0) {
                const prevLineWords = Object.keys(lyricsState[sectionIndex][lineIndex - 1])
                const lastWordIndexInPrevLine = prevLineWords.length - 1;
                const prevInputRef = inputRefs.current[`${sectionIndex}-${lineIndex - 1}-${lastWordIndexInPrevLine}`];
                if (prevInputRef) {
                    prevInputRef.focus();
                }
            } else if (sectionIndex > 0) {
                const prevSectionLines = Object.keys(lyricsState[sectionIndex - 1]);
                const lastLineIndexInPrevSection = prevSectionLines.length - 1;
                const lastWordIndexInPrevLine = Object.keys(lyricsState[sectionIndex - 1][lastLineIndexInPrevSection]).length - 1;
                const prevInputRef = inputRefs.current[`${sectionIndex - 1}-${lastLineIndexInPrevSection}-${lastWordIndexInPrevLine}`];
                if (prevInputRef) {
                    prevInputRef.focus();
                }
            }
        } else if (event.key === 'Backspace' && lyricsState[sectionIndex][lineIndex][wordIndex].value.length === 1) {
            socket.send(JSON.stringify({
                sectionIndex,
                lineIndex,
                wordIndex,
                value: '',
                revealed: false,
                valid: false,
            }));
        }
    };

    // Удаление символов для проверки правильности ввода
    const cleanString = (str) => {
        return str.replace(/[.,/#!$%^&*;:{}=\-_`~()'?"—]/g, "").trim();
    };


    const toggleShowWords = () => {
        setShowWords(!showWords);
    };

    const handleRevealWord = (sectionIndex, lineIndex, wordIndex) => {
        const updatedLyricsState = {...lyricsState};
        const lyricsWord = lyrics[sectionIndex][Object.keys(lyrics[sectionIndex])[0]][lineIndex][wordIndex].value;

        // Обновляем lyricsState
        updatedLyricsState[sectionIndex][lineIndex][wordIndex].value = lyricsWord;
        setLyricsState(updatedLyricsState);

        // Устанавливаем слово как раскрытое
        setRevealedWords(prevState => ({
            ...prevState,
            [`${sectionIndex}-${lineIndex}-${wordIndex}`]: true,  // Отмечаем слово как раскрытое
        }));

        // Отправляем слово в бд
        socket.send(JSON.stringify({
            sectionIndex,
            lineIndex,
            wordIndex,
            value: lyricsWord,
            revealed: true,
            valid: true
        }));

        setHighlightIncorrect(false);
        setIsRevealMode(false);

    };

    // const revealModeHandler = () => {
    //     setIsRevealMode(true);
    //     setHighlightIncorrect(true); // Включить подсветку слов которые незаполнены правильно
    // };


    return (
        <div style={{}}>
            {/*<button*/}
            {/*    style={{*/}
            {/*        margin: 20,*/}
            {/*        flex: 'auto',*/}
            {/*    }}*/}
            {/*    onClick={toggleShowWords}>*/}
            {/*    {showWords ? 'Скрыть слова' : 'Показать слова'}*/}
            {/*</button>*/}

            {/*<Button*/}
            {/*    onClick={revealModeHandler}*/}
            {/*    style={{*/}
            {/*        flex: 'auto',*/}
            {/*        marginTop: 30,*/}
            {/*        position: 'sticky',*/}
            {/*        top: 220,*/}
            {/*        right: 0,*/}
            {/*        zIndex: 5,*/}
            {/*        transform: 'translateX(400%)'*/}
            {/*    }}*/}
            {/*>*/}
            {/*    Открыть слово*/}
            {/*</Button>*/}


            {Object.keys(lyricsState).map((lyricsStateSectionIndex) => {
                const lyricsStateLines = lyricsState[lyricsStateSectionIndex]
                const lyricsSectionData = Object.values(lyrics)[Number(lyricsStateSectionIndex)]
                const lyricsSectionTitle = Object.keys(lyricsSectionData)[0]
                // console.log(lyricsSectionTitle)
                return (
                    <div
                        key={`section-${lyricsStateSectionIndex}-${lyricsSectionTitle}`} // Добавляем sectionIndex для уникальности
                        style={{
                            marginBottom: '50px',
                            display: 'flex',
                            justifyContent: 'center',
                            flexDirection: 'column',
                            alignItems: 'center',
                        }}
                    >
                        <h3 style={{marginBottom: '4px'}}>{lyricsSectionTitle}</h3>
                        {Object.keys(lyricsStateLines).map((lyricsStateLineIndex) => {
                            const lyricsStateWords = lyricsStateLines[lyricsStateLineIndex]; // Получаем слова из текущей строки

                            return (
                                <div key={`line-${lyricsStateSectionIndex}-${lyricsStateLineIndex}`}
                                     style={{display: 'flex'}}>
                                    <div style={{display: 'flex', marginBottom: '10px'}}>
                                        {Object.keys(lyricsStateWords).map((lyricsStateWordIndex) => {
                                            // console.log(lyricsStateWord)
                                            const lyricsStateWord = lyricsStateWords[lyricsStateWordIndex].value; // Получаем объект слова
                                            const lyricsStateWordRevealedStatus = lyricsStateWords[lyricsStateWordIndex].revealed // Подсказано ли слово
                                            const lyricsWord = lyrics[lyricsStateSectionIndex][lyricsSectionTitle][lyricsStateLineIndex][lyricsStateWordIndex].value; // Получаем оригинальное слово для сравнения
                                            return (
                                                <div
                                                    key={`word-${lyricsStateSectionIndex}-${lyricsStateLineIndex}-${lyricsStateWordIndex}`} // Обновленный ключ для слова
                                                    style={{
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        position: 'relative',
                                                    }}
                                                >
                                                    <input
                                                        ref={(el) => {
                                                            inputRefs.current[`${lyricsStateSectionIndex}-${lyricsStateLineIndex}-${lyricsStateWordIndex}`] = el;
                                                        }}
                                                        type="text"
                                                        maxLength={lyricsWord.length} // Устанавливаем длину поля ввода
                                                        value={lyricsStateWord} // Заполняем значение из inputs
                                                        onChange={(e) => handleInputChange(lyricsWord, lyricsStateSectionIndex, lyricsStateLineIndex, lyricsStateWordIndex, e.target.value)}
                                                        onKeyDown={(e) => handleKeyDown(lyricsStateSectionIndex, lyricsStateLineIndex, lyricsStateWordIndex, e)}
                                                        style={{
                                                            width: `${lyricsWord.length + 2}ch`,
                                                            marginRight: '5px',
                                                            color: 'black',
                                                            backgroundColor: (revealedWords[`${lyricsStateSectionIndex}-${lyricsStateLineIndex}-${lyricsStateWordIndex}`] || lyricsStateWordRevealedStatus)
                                                                ? isRevealMode ? 'rgba(244,244,244,0.11)' : 'rgba(255,225,154,0.78)' // Оранжевый для раскрытых слов
                                                                : cleanString(lyricsStateWord).toLowerCase() === cleanString(lyricsWord).toLowerCase()
                                                                    ? isRevealMode ? 'rgba(244,244,244,0.11)' : 'rgba(131,255,131,0.68)' // Зелёный для правильно заполненных
                                                                    : isRevealMode
                                                                        ? 'rgba(255,125,125,0.68)' // Ярко-красный для неверных слов в режиме подсветки
                                                                        : 'rgba(255,153,153,0.32)', // Бледно-красный для неверных слов вне режима
                                                            outline: 'none',
                                                            textAlign: 'center',
                                                            // pointerEvents: highlightIncorrect && cleanString(lyricsStateWord).toLowerCase() !== cleanString(lyricsWord).toLowerCase() ? 'auto' : 'none',
                                                            cursor: isRevealMode ? 'pointer' : 'text',
                                                            zIndex: 4,
                                                        }}
                                                        disabled={cleanString(lyricsStateWord).toLowerCase() === cleanString(lyricsWord).toLowerCase()}
                                                        onClick={() => isRevealMode && handleRevealWord(lyricsStateSectionIndex, lyricsStateLineIndex, lyricsStateWordIndex)}
                                                    />
                                                    {showWords &&
                                                        <span>{lyricsWord}</span>} {/* Здесь можно использовать originalWord для отображения правильного слова */}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                );
            })}

            {isRevealMode && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        zIndex: 3,
                    }}
                    onClick={() => setIsRevealMode(false)}
                />
            )}

        </div>
    );
};
export default LyricsFormNew;
