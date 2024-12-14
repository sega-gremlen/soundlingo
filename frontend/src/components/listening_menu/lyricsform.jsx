import React, {useState, useRef} from 'react';

const LyricsForm = ({lyrics, socket}) => {
    const lyricsData = Array.isArray(lyrics) ? lyrics : [];

    console.log(lyricsData)

    const [inputs, setInputs] = useState(
        lyricsData.map((section) => {
            const sectionTitle = Object.keys(section)[0]; // Получаем заголовок секции
            const sectionContent = section[sectionTitle]; // Получаем содержимое секции

            // Инициализация inputs
            return {
                [sectionTitle]: Object.keys(sectionContent).reduce((acc, lineIndex) => {
                    acc[lineIndex] = Object.keys(sectionContent[lineIndex]).reduce((lineAcc, wordIndex) => {
                        const wordData = sectionContent[lineIndex][wordIndex]; // Получаем данные слова
                        lineAcc[wordIndex] = {
                            value: wordData.filled ? wordData.value : '', // Заполняем значение, если filled == true
                            // value: wordData.value,
                            filled: wordData.filled // Устанавливаем состояние filled
                        };
                        return lineAcc;
                    }, {});
                    return acc;
                }, {})
            };
        })
    );


    // Функция для блокировки после правильно введенного слова
    const [editable, setEditable] = useState(
        lyricsData.map((section) => {
            const sectionTitle = Object.keys(section)[0];
            return Object.keys(section[sectionTitle]).map(lineIndex =>
                Object.keys(section[sectionTitle][lineIndex]).map(() => true)
            );
        })
    );

    const [showWords, setShowWords] = useState(false); // Текст скрыт по умолчанию

    const inputRefs = useRef([]);

    const toggleShowWords = () => {
        setShowWords(!showWords);
    };

    // Функция для изменения ячейки ввода при наборе симвлов
    const handleInputChange = (sectionIndex, lineIndex, wordIndex, value) => {
        const newInputs = [...inputs];
        newInputs[sectionIndex][Object.keys(newInputs[sectionIndex])[0]][lineIndex][wordIndex].value = value; // Обновляем значение в inputs
        setInputs(newInputs);

        const currentWordLength = cleanString(value).length;
        const originalWord = lyricsData[sectionIndex][Object.keys(lyricsData[sectionIndex])[0]][lineIndex][wordIndex].value;
        const originalWordLength = cleanString(originalWord).length;


        if (currentWordLength === originalWordLength) {
            const wordsInLine = Object.keys(lyricsData[sectionIndex][Object.keys(lyricsData[sectionIndex])[0]][lineIndex]);


            if (Number(wordIndex) === wordsInLine.length - 1) {
                const nextLineIndex = Number(lineIndex) + 1;

                if (lyricsData[sectionIndex][Object.keys(lyricsData[sectionIndex])[0]][nextLineIndex]) {
                    // Переход к первому слову следующей строки
                    const nextInputRef = inputRefs.current[`${sectionIndex}-${nextLineIndex}-0`];
                    if (nextInputRef) {
                        nextInputRef.focus();
                    }
                } else {
                    const nextSectionIndex = Number(sectionIndex) + 1;

                    if (lyricsData[nextSectionIndex]) {
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
        }

        // Проверка на совпадение и установка поля как не редактируемого
        if (cleanString(value).toLowerCase() === cleanString(originalWord).toLowerCase()) {
            const newEditable = [...editable];
            newEditable[sectionIndex][lineIndex][wordIndex] = false; // Сделать поле не редактируемым
            setEditable(newEditable);
            if (socket) {
                socket.send(JSON.stringify({
                    sectionIndex,
                    lineIndex,
                    wordIndex
                }));
            }
        }
    };

    // Функция для изменения ячейки ввода при наборе удалении символов
    const handleKeyDown = (sectionIndex, lineIndex, wordIndex, event) => {
        if (event.key === 'Backspace' && inputs[sectionIndex][Object.keys(inputs[sectionIndex])[0]][lineIndex][wordIndex].value.length === 0) {
            if (wordIndex > 0) {
                const prevInputRef = inputRefs.current[`${sectionIndex}-${lineIndex}-${wordIndex - 1}`];
                if (prevInputRef) {
                    prevInputRef.focus();
                }
            } else if (lineIndex > 0) {
                const prevLineWords = Object.keys(lyricsData[sectionIndex][Object.keys(lyricsData[sectionIndex])[0]][lineIndex - 1]);
                const lastWordIndexInPrevLine = prevLineWords.length - 1;
                const prevInputRef = inputRefs.current[`${sectionIndex}-${lineIndex - 1}-${lastWordIndexInPrevLine}`];
                if (prevInputRef) {
                    prevInputRef.focus();
                }
            } else if (sectionIndex > 0) {
                const prevSection = lyricsData[sectionIndex - 1];
                const prevSectionTitle = Object.keys(prevSection)[0];
                const prevSectionLines = Object.keys(prevSection[prevSectionTitle]);
                const lastLineIndexInPrevSection = prevSectionLines.length - 1;
                const lastWordIndexInPrevLine = Object.keys(prevSection[prevSectionTitle][lastLineIndexInPrevSection]).length - 1;
                const prevInputRef = inputRefs.current[`${sectionIndex - 1}-${lastLineIndexInPrevSection}-${lastWordIndexInPrevLine}`];
                if (prevInputRef) {
                    prevInputRef.focus();
                }
            }
        }
    };

    // Функция для блокировки пробела
    const preventSpaceAndHandleBackspace = (event, sectionIndex, lineIndex, wordIndex) => {
        if (event.key === ' ') {
            event.preventDefault(); // Игнорируем пробел
        }
        handleKeyDown(sectionIndex, lineIndex, wordIndex, event);
    };

    // Удаление символов для проверки правильности ввода
    const cleanString = (str) => {
        return str.replace(/[.,/#!$%^&*;:{}=\-_`~()'?"—]/g, "").trim();
    };


    return (
        <>
            <button
                style={{
                    margin: 20
                }}
                onClick={toggleShowWords}>
                {showWords ? 'Скрыть слова' : 'Показать слова'}
            </button>

            {inputs.map((section, sectionIndex) => {
                const sectionTitle = Object.keys(section)[0]; // Получаем заголовок секции
                const lines = section[sectionTitle]; // Получаем строки из состояния inputs

                return (
                    <div
                        key={`section-${sectionIndex}-${sectionTitle}`} // Добавляем sectionIndex для уникальности
                        style={{
                            marginBottom: '50px',
                            display: 'flex',
                            justifyContent: 'center',
                            flexDirection: 'column',
                            alignItems: 'center',
                        }}
                    >
                        <h3 style={{marginBottom: '4px'}}>{sectionTitle}</h3>
                        {Object.keys(lines).map((lineIndex) => {
                            const words = lines[lineIndex]; // Получаем слова из текущей строки

                            return (
                                <div key={`line-${sectionIndex}-${lineIndex}`} style={{display: 'flex'}}>
                                    <div style={{display: 'flex', marginBottom: '10px'}}>
                                        {Object.keys(words).map((wordIndex) => {
                                            const wordObj = words[wordIndex]; // Получаем объект слова
                                            const originalWord = lyricsData[sectionIndex][sectionTitle][lineIndex][wordIndex].value; // Получаем оригинальное слово для сравнения

                                            return (
                                                <div
                                                    key={`word-${sectionIndex}-${lineIndex}-${wordIndex}`} // Обновленный ключ для слова
                                                    style={{
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                    }}
                                                >
                                                    <input
                                                        ref={(el) => {
                                                            inputRefs.current[`${sectionIndex}-${lineIndex}-${wordIndex}`] = el;
                                                        }}
                                                        type="text"
                                                        maxLength={originalWord.length} // Устанавливаем длину поля ввода
                                                        value={wordObj.value} // Заполняем значение из inputs
                                                        onChange={(e) => handleInputChange(sectionIndex, lineIndex, wordIndex, e.target.value)}
                                                        onKeyDown={(e) => preventSpaceAndHandleBackspace(e, sectionIndex, lineIndex, wordIndex)}
                                                        style={{
                                                            width: `${originalWord.length + 2}ch`,
                                                            marginRight: '1px',
                                                            color: 'black',
                                                            backgroundColor: cleanString(wordObj.value).toLowerCase() === cleanString(originalWord).toLowerCase() ? 'rgba(142,255,142,0.43)' : 'rgba(255,175,175,0.16)',
                                                            outline: 'none',
                                                            textAlign: 'center',
                                                        }}
                                                        disabled={!editable[sectionIndex][lineIndex][wordIndex]} // Устанавливаем поле как не редактируемое
                                                    />
                                                    {showWords &&
                                                        <span>{originalWord}</span>} {/* Здесь можно использовать originalWord для отображения правильного слова */}
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
        </>
    );
};

export default LyricsForm;