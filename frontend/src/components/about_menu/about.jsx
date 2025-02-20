import {Typography, Row, Col, InputNumber, List, Card, Spin, Divider, Button} from 'antd';
import React, {useState, Suspense, lazy} from 'react';
import {KoFiDialog, KoFiButton, KoFiWidget, KoFiPanel} from "react-kofi";
import "react-kofi/dist/styles.css";
import YooMoneyForm from "./youmoneyform.jsx";

const {Title} = Typography;

// Динамическая загрузка PayPal компонентов
const PayPalButtons = lazy(() =>
    import("@paypal/react-paypal-js").then(module => ({
        default: module.PayPalButtons
    }))
);

const PayPalScriptProvider = lazy(() =>
    import("@paypal/react-paypal-js").then(module => ({
        default: module.PayPalScriptProvider
    }))
);

const AboutPage = () => {
    const [donationAmount, setDonationAmount] = useState(10);
    const [paypalReady, setPaypalReady] = useState(false);

    const roadmapItems = [
        {text: 'Introduce a timed game mode', done: false},
        {text: 'Multilingual interface support', done: false},
        {text: 'Track search log with session status details (Track, Lyrics, mp3)', done: false},
        {text: 'Genre selection for random listening', done: false},
        {text: 'Implement dark mode', done: false},
        {text: 'Enable selection of non-music tracks for random listening', done: false},
        {text: 'Integrate AI for explaining words in the context of your track/text', done: false},
        {text: 'Allow uploading of personal audio files for listening practice', done: false},
        {text: 'Create a mobile application', done: false},
        {text: 'Improve and update the interface', done: false},
        {text: 'Enhance the rating system', done: false}
    ];


    return (
        <div style={{
            // padding: '20px',
            maxWidth: '1200px',
            margin: '0 auto'
        }}>

            {/* How To Play Section */}
            <Title level={1}>How To Play</Title>
            <p style={{whiteSpace: "pre-wrap", lineHeight: "1.6"}}>
                You can listen to a specific track or try your luck with a random track in
                the <strong>Listening</strong> tab:
            </p>

            <ul style={{paddingLeft: "20px"}}>
                <li>
                    To choose a specific track, simply enter the <strong>artist/group name</strong> and the <strong>track
                    title</strong>.
                    If all required elements are found (the track is available on <em>Spotify</em>, lyrics
                    on <em>Genius</em>,
                    and an mp3 file on <em>Yandex Music</em>), the session will start automatically.
                </li>
                <li>
                    You can also enter just the <strong>artist/group name</strong>, and a random track from that
                    artist/group will be selected.
                </li>
            </ul>

            <p style={{whiteSpace: "pre-wrap", lineHeight: "1.6"}}>
                For a <strong>completely random track</strong>, the system will take some time to find a song that meets
                all the above requirements.
            </p>

            <div style={{display: "flex", alignItems: "center", margin: "16px 0"}}>
                <img
                    src="/magic.png"
                    alt="Magic Wand"
                    style={{width: "54px", height: "54px", marginRight: "12px"}}
                />
                <p style={{margin: 0}}>
                    The magic wand can reveal a word if you're struggling to understand it. Just click on it, then
                    select the input field
                    with the unclear word. <strong>Words revealed by the magic wand give fewer points</strong> than
                    those you figure out on your own.
                </p>
            </div>

            <div style={{display: "flex", alignItems: "center", margin: "16px 0"}}>
                <img src="/progress_bar_example.png"/>
                <div style={{marginLeft: "16px"}}>
                    <p style={{whiteSpace: "pre-wrap", lineHeight: "1.6"}}>
                        The <strong>progress bar</strong> above the player shows:
                    </p>

                    <ul>
                        <li><span style={{color: "green"}}>Green</span> — words you discovered on your own.</li>
                        <li><span style={{color: "orange"}}>Yellow</span> — words revealed by the magic wand.</li>
                        <li><span style={{color: "red"}}>Red</span> — words still left to uncover.</li>
                    </ul>
                </div>
            </div>

            <p style={{whiteSpace: "pre-wrap", lineHeight: "1.6"}}>
                Currently, all sessions <strong>have no time limits</strong>, so you can return anytime to any session
                and continue uncovering words.
            </p>


            <Divider/>

            {/* Donation Section */}
            <Title level={1}>Donations</Title>

            <div style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
            }}>
                {/* KoFi */}
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    flexDirection: "column",
                }}>
                    <Title level={4}>Ko-fi</Title>
                    <KoFiDialog
                        color="black"
                        textColor="white"
                        id="soundlingo"
                        label="Support me on Ko-Fi"
                        padding={0}
                        width={400}
                        iframe={false}
                        buttonRadius="8px"
                    />
                </div>

                {/* ЮMoney */}
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    flexDirection: "column",
                }}>
                    <Title level={4}>ЮMoney</Title>
                    <YooMoneyForm/>
                </div>

                {/* Crypto */}
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    flexDirection: "column",
                }}>
                    <Title level={4}>Crypto</Title>
                    <div
                        style={{
                            width: "220px",
                        }}
                    >
                        <a href="https://nowpayments.io/donation?api_key=EMWNQJK-4734JTM-QZYM4WG-6JEF5GQ"
                           target="_blank" rel="noreferrer noopener">
                            <img src="https://nowpayments.io/images/embeds/donation-button-white.svg"
                                 alt="Cryptocurrency & Bitcoin donation button by NOWPayments"/>
                        </a>
                    </div>
                </div>


            </div>


            <Divider/>


            {/* Roadmap Section */}
            <Title level={1}>Things to do</Title>
            <List
                dataSource={roadmapItems}
                renderItem={item => (
                    <List.Item style={{borderBottom: 'none', justifyContent: 'flex-start'}}>
                        <span style={{marginRight: 8}}>•</span>
                        <span style={{textDecoration: item.done ? 'line-through' : 'none'}}>{item.text}</span>
                    </List.Item>
                )}
            />

        </div>
    )
        ;
};

export default AboutPage;