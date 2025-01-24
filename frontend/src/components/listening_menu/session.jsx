import {useState, useEffect, useRef} from 'react';
import {useLocation, useParams} from 'react-router-dom';
// import MyAudioPlayer from './player.jsx';
import MyNewAudioPlayer from './new_playback.jsx'

// import LyricsForm from "./lyricsform.jsx";
import LyricsformNew from "./lyricsform_new.jsx";
import {Button, Spin} from "antd";
import ScoreBar from './score_bar.jsx';

const Session = ({setError}) => {
    const location = useLocation();
    const {sessionId} = useParams(); // Получаем sessionId из URL
    const [sessionData, setSessionData] = useState(null);
    const [socket, setSocket] = useState(null); // Состояние для WebSocket
    const [points, setPoints] = useState({
        all_points: 0,
        valid_points: 0,
        revealed_points: 0
    });

    // Управление открытием слов
    const [isRevealMode, setIsRevealMode] = useState(false);
    const [highlightIncorrect, setHighlightIncorrect] = useState(false);
    const revealModeHandler = () => {
        setIsRevealMode(true);
        setHighlightIncorrect(true); // Включить подсветку слов которые незаполнены правильно
    };

    // Web-socket managment
    const socketRef = useRef(null);

    useEffect(() => {
        if (sessionId) {
            const fetchData = async () => {
                try {
                    const response = await fetch(`http://localhost:8000/sessions/${sessionId}`, {
                        method: 'GET',
                        credentials: 'include',
                    });
                    if (response.ok) {
                        const data = await response.json();
                        console.log('Полученные данные сессии:', data);
                        setSessionData(data);
                    } else {
                        console.error('Ошибка при получении данных сессии:', response.statusText);
                    }
                } catch (error) {
                    console.error('Ошибка при выполнении запроса:', error);
                }
            };
            fetchData();
        } else {
            console.log("нет sessionId")
        }
    }, [location.state, sessionId]);

    useEffect(() => {
        if (!socket) {
            const newSocket = new WebSocket(`ws://localhost:8000/sessions/${sessionId}`);
            setSocket(newSocket);
            socketRef.current = newSocket;

            // Обработка сообщений от WebSocket
            newSocket.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    console.log("Получено сообщение от WebSocket:", message);

                    // Обновляем данные очков, если они есть в сообщении
                    if (message.all_points !== undefined) {
                        setPoints((prev) => ({
                            ...prev,
                            all_points: message.all_points || prev.all_points,
                            valid_points: message.valid_points || prev.valid_points,
                            revealed_points: message.revealed_points || prev.revealed_points
                        }));
                    }
                } catch (err) {
                    console.error("Ошибка обработки сообщения WebSocket:", err);
                }
            };
        }

        return () => {
            if (socketRef.current) {
                socketRef.current.close();
                socketRef.current = null;
            }
        };
    }, [sessionId]);

    if (!sessionData) {
        return <Spin size="large"/>;
    }

    const {lyrics, album_cover_url, artist_name, song_title, mp3_url, lyrics_state} = sessionData;

    return (
        <div
            style={{
                display: "flex",
                flexDirection: 'column',
                alignItems: "center",
                position: 'relative',
                width: '100%'
            }}
        >
            <ScoreBar points={points}/>

            <MyNewAudioPlayer
                albumCover={album_cover_url}
                artist={artist_name}
                title={song_title}
                audioSrc={mp3_url}
                revealModeHandler={revealModeHandler}
            />

            <LyricsformNew
                style={{
                    marginTop: 30,
                    display: 'flex',
                }}
                lyrics={lyrics}
                socket={socket}
                lyricsState={lyrics_state}
                setIsRevealMode={setIsRevealMode}
                isRevealMode={isRevealMode}
                setHighlightIncorrect={setHighlightIncorrect}

            />

            {/* Очки в правой части экрана */}
            {/*<div*/}
            {/*    style={{*/}
            {/*        position: 'fixed',*/}
            {/*        top: 150,*/}
            {/*        right: 100,*/}
            {/*        textAlign: 'right',*/}
            {/*        fontSize: '22px',*/}
            {/*        color: 'gray'*/}
            {/*    }}*/}
            {/*>*/}
            {/*    <div style={{color: 'gray'}}>All Points: {points.all_points}</div>*/}
            {/*    <div style={{color: 'green'}}>Valid Points: {points.valid_points}</div>*/}
            {/*    <div style={{color: 'orange'}}>Revealed Points: {points.revealed_points}</div>*/}
            {/*</div>*/}
        </div>
    );
};

export default Session;
