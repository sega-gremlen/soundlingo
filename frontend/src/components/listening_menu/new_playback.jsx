import React, {useEffect, useRef, useState} from "react";
import WaveSurfer from "wavesurfer.js";

const formWaveSurferOptions = (ref) => ({
    container: ref,
    waveColor: "#eee",
    progressColor: "rgba(50,50,50,0.5)",
    cursorColor: "Black",
    barWidth: 3,
    barRadius: 1,
    responsive: true,
    height: 50,
    normalize: true,
    partialRender: true,
});

const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export default function MyNewAudioPlayer({title, artist, albumCover, audioSrc, revealModeHandler}) {
    const waveformRef = useRef(null);
    const wavesurfer = useRef(null);
    const [playing, setPlay] = useState(false);
    const [volume, setVolume] = useState(0.5);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    useEffect(() => {
        setPlay(false);

        const options = formWaveSurferOptions(waveformRef.current);
        wavesurfer.current = WaveSurfer.create(options);

        wavesurfer.current.load(audioSrc);

        wavesurfer.current.on("ready", () => {
            if (wavesurfer.current) {
                setDuration(wavesurfer.current.getDuration());
                wavesurfer.current.setVolume(volume);
            }
        });

        // Обновляем текущее время во время воспроизведения
        wavesurfer.current.on("audioprocess", () => {
            if (wavesurfer.current && wavesurfer.current.isPlaying()) {
                setCurrentTime(wavesurfer.current.getCurrentTime());
            }
        });

        // Обновляем текущее время при клике на waveform
        wavesurfer.current.on("click", () => {
            if (wavesurfer.current) {
                setCurrentTime(wavesurfer.current.getCurrentTime());
            }
        });

        // Используем setInterval для обновления времени при перемещении курсора
        const interval = setInterval(() => {
            if (wavesurfer.current && !wavesurfer.current.isPlaying()) {
                setCurrentTime(wavesurfer.current.getCurrentTime());
            }
        }, 100); // Обновляем каждые 100 мс

        return () => {
            wavesurfer.current.destroy();
            clearInterval(interval); // Очищаем интервал при размонтировании компонента
        };
    }, [audioSrc]);

    const handlePlayPause = () => {
        setPlay(!playing);
        wavesurfer.current.playPause();
    };

    const onVolumeChange = (e) => {
        const {target} = e;
        const newVolume = +target.value;

        if (newVolume) {
            setVolume(newVolume);
            wavesurfer.current.setVolume(newVolume || 1);
        }
    };

    return (
        <>
            {/* Таймлайн */}
            <div style={{
                width: "100%",
                position: 'sticky',
                top: 15,
                zIndex: 5,
                backgroundColor: '#fffaf7',
                margin: 0,
                padding: 0,
            }}>
                {/* Вейвформа */}
                <div
                    style={{
                        height: "50px"
                    }}
                    id="waveform"
                    ref={waveformRef}/>

                {/* Текущее время */}
                <div
                    style={{
                        zIndex: "6",
                        position: "absolute",
                        bottom: "4px",
                        left: "0",
                        backgroundColor: "black",
                        color: "white",
                        padding: "1px 2px",
                        fontSize: "12px",
                    }}
                >
                    {formatTime(currentTime)}
                </div>
                {/* Общее время */}
                <div
                    style={{
                        zIndex: "6",
                        position: "absolute",
                        bottom: "4px",
                        right: "0",
                        backgroundColor: "Black",
                        color: "white",
                        padding: "1px 2px",
                        fontSize: "12px",
                    }}
                >
                    {formatTime(duration)}
                </div>

                {/* Верх подчеркивание */}
                <div style={{
                    display: "flex",
                    borderBottom: "1px solid #ddd",
                    marginTop: "4px",
                    marginBottom: "4px",
                }}></div>
            </div>

            {/* Заглушка */}
            {/*<div*/}
            {/*    style={{*/}
            {/*        // marginTop: "4px",*/}
            {/*        width: "100%",*/}
            {/*        height: "10px",*/}
            {/*        bottom: "4px",*/}
            {/*        position: 'sticky',*/}
            {/*        top: 75,*/}
            {/*        zIndex: 6,*/}
            {/*        backgroundColor: "white",*/}
            {/*        display: "flex",*/}
            {/*        flexDirection: "column",*/}
            {/*        maxWidth: "50%",*/}
            {/*        margin: "0 auto",*/}
            {/*        boxSizing: "border-box",*/}
            {/*        minWidth: "550px"*/}
            {/*    }}>*/}
            {/*</div>*/}

            {/* Междулинье */}
            <div
                style={{
                    // marginTop: "4px",
                    position: 'sticky',
                    top: 74,
                    zIndex: 5,
                    backgroundColor: '#fffaf7',
                    display: "flex",
                    flexDirection: "column",
                    // maxWidth: "50%",
                    margin: "0 auto",
                    boxSizing: "border-box",
                    maxWidth: "800px",
                    minWidth: "300px",
                    width: "100%",
                    // margin: 0,
                    padding: 0,
                }}>

                <div style={{
                    display: "flex",
                    flex: 1,
                    justifyContent: "space-between",
                    flexDirection: "row",
                    position: "relative",
                }}>
                    <div style={{display: "flex", alignItems: "center", flexShrink: 0}}>
                        {/* Изображение */}
                        <img
                            style={{width: "80px", height: "80px", marginRight: "5px"}}
                            src={albumCover}
                            alt={title}
                        />
                        <div style={{alignItems: "center", justifyItems: "center"}}>
                            {/* Название трека */}
                            <h3 style={{fontSize: "18px", fontWeight: "bold"}}>{title}</h3>
                            {/* Имя артиста */}
                            <p style={{fontSize: "16px"}}>{artist}</p>
                        </div>
                    </div>

                    {/* Кнопка play */}
                    <div style={{
                        display: "flex",
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        transform: "translate(-50%, -50%)",
                    }}>
                        <button
                            style={{cursor: "pointer"}}
                            onClick={handlePlayPause}
                        >
                            {!playing ? (
                                <img
                                    src="/play.png"
                                    alt="Play"
                                    style={{width: "60px", height: "60px"}}
                                />
                            ) : (
                                <img
                                    src="/pause.png"
                                    alt="Pause"
                                    style={{width: "60px", height: "60px"}}
                                />
                            )}
                        </button>
                    </div>

                    {/* Кнопка magic */}
                    <div style={{
                        display: "flex",
                        position: "absolute",
                        left: "62%",
                        top: "50%",
                        transform: "translate(-50%, -50%)",
                    }}>
                        <button
                            onClick={revealModeHandler}
                            style={{cursor: "pointer"}}
                        >
                            <img
                                src="/magic.png"
                                alt="Pause"
                                style={{width: "54px", height: "54px"}}
                            />
                        </button>
                    </div>

                    <div style={{display: "flex", alignItems: "center"}}>
                        <img
                            src="https://cdn-icons-png.flaticon.com/512/727/727269.png"
                            alt="Volume"
                            style={{width: "24px", height: "24px", marginRight: "2px"}}
                        />
                        <input
                            color="black"
                            type="range"
                            id="volume"
                            name="volume"
                            min="0.01"
                            max="1"
                            step=".025"
                            onChange={onVolumeChange}
                            defaultValue={volume}
                            style={{height: "4px", cursor: "pointer"}}
                        />
                    </div>
                </div>

                {/* Низ подчеркивание */}
                <div style={{
                    display: "flex",
                    borderBottom: "1px solid #ddd",
                    width: "100%",
                    marginTop: "4px",
                    marginLeft: "auto",
                    marginRight: "auto",
                }}></div>
            </div>
        </>
    );
}