import React from 'react';
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';
import '../../index.css'; // Include your CSS file

const MyAudioPlayer = ({ title, artist, albumCover, audioSrc }) => {
    const trackData = (
        <div className="space-y-2 overflow-hidden w-64"
             style={{
                 flexDirection: "column",
                 display: "flex",
                 position: "absolute"
             }}>
            <span className="inline-block"
                  style={{
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                  }}>
                {title}
            </span>
            <span
                style={{
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                }}>
                {artist}
            </span>
        </div>
    );

    return (
        <div style={{
            position: 'sticky',
            display: 'flex',
            boxShadow: '0 0 20px 5px rgba(0, 0, 0, 0.2)',
            minWidth: '900px',
            top: 90, // Делаем так, чтобы плеер оставался на верху
            zIndex: 5, // Увеличиваем z-index, чтобы плеер был поверх других элементов
            backgroundColor: '#fff3cd' // Добавляем фон для плеера
        }}>
            <img
                src={albumCover}
                alt={`${title} album cover`}
                style={{
                    width: '100px',
                    height: '100px'
                }}
            />
            <div className="player-info"></div>
            <AudioPlayer
                src={audioSrc}
                showSkipControls={false}
                showJumpControls={false}
                customAdditionalControls={[trackData]}
            />
        </div>
    );
};

export default MyAudioPlayer;
