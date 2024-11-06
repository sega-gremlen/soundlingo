import {useEffect, useState} from 'react';
import {useLocation, useParams} from 'react-router-dom';
import MyAudioPlayer from './playback.jsx';
import LyricsForm from "./lyricsform.jsx";
import {Spin} from "antd";

const Session = ( { setError }) => {
    const location = useLocation();
    const {sessionId} = useParams(); // Получаем sessionId из URL
    const [sessionData, setSessionData] = useState(null);
    const [socket, setSocket] = useState(null); // Состояние для WebSocket


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
            console.log("нет сешн ид")
        }
    }, [location.state, sessionId]);

    console.log(1)


    useEffect(() => {
        // Создаем WebSocket подключение только если его еще нет и есть sessionId
        if (!socket) {
            const newSocket = new WebSocket(`ws://localhost:8000/sessions/${sessionId}`);
            setSocket(newSocket);
        }
    }, [socket, sessionId]);


    if (!sessionData) {
        return <Spin size="large"/>;
    }

    const {lyrics, image_url, artist_name, song_title} = sessionData;

    console.log(2)

    return (
        <div
            style={{
                display: "flex",
                flexDirection: 'column',
                alignItems: "center",
            }}
        >
            <MyAudioPlayer
                albumCover={image_url}
                artist={artist_name}
                title={song_title}
                audioSrc={`/songs/${artist_name} ${song_title}.mp3`}
            />
            <LyricsForm lyrics={lyrics} socket={socket}/>
        </div>
    );
};

export default Session;
