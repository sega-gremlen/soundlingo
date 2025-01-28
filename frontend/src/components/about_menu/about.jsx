import React from 'react';
import {Card, Checkbox, List, Typography} from 'antd';

const { Title, Text } = Typography;

const About = () => {
    const tasks = [
        { id: 1, text: 'Сделать подсчет очков', completed: false },
        { id: 2, text: 'Сделать рандом на ники', completed: false },
        { id: 3, text: 'Сделать Leaderboard', completed: true },
        { id: 4, text: 'Проработать повторяющиеся сессии (диалоговое окно)', completed: false },
        { id: 5, text: 'Сделать домен', completed: false },
        { id: 6, text: 'Сделать about с roadmap и описанием проекта', completed: false },
        { id: 7, text: 'Проработать шрифт и цветовой дизайн', completed: false },
        { id: 8, text: 'Сделать другой плеер в виде полоски с частотами', completed: true, link: 'https://dev.to/jamland/audio-player-with-wavesurfer-js-react-1g3b' },
        { id: 9, text: 'Деплой!', completed: false },
    ];

    return (
        <Card
            title={
                <Title level={3} style={{ textAlign: 'center', marginBottom: 0 }}>
                    Roadmap
                </Title>
            }
            style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}
        >
            <List
                dataSource={tasks}
                renderItem={(task) => (
                    <List.Item>
                        <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                            <Checkbox checked={task.completed} style={{ marginRight: 16 }} />
                            <Text
                                style={{
                                    textDecoration: task.completed ? 'line-through' : 'none',
                                    color: task.completed ? '#888' : '#000',
                                    flex: 1,
                                }}
                            >
                                {task.text}
                            </Text>
                        </div>
                    </List.Item>
                )}
            />
        </Card>
    );
};

export default About;