import React, { useEffect, useState } from 'react';
import { Table } from 'antd';

// Стили для центрирования содержимого
const centeredCellStyle = {
    textAlign: 'center',
    verticalAlign: 'middle',
    height: '60px' // Фиксированная высота ячейки
};

function Leaderboard() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [columnWidths, setColumnWidths] = useState({
        position: 100,
        score: 150
    });

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const response = await fetch('http://localhost:8000/leaderboard');
                const result = await response.json();

                // Конвертируем объект в массив
                const tableData = Object.entries(result).map(
                    ([username, score], index) => ({
                        username,
                        score,
                        position: index + 1,
                        key: username,
                    })
                );

                // Рассчитываем максимальную ширину для колонок
                const maxPositionWidth = Math.max(...tableData.map(d => `${d.position}`.length)) * 20 + 30;
                const maxScoreWidth = Math.max(...tableData.map(d => `${d.score}`.length)) * 15 + 30;

                setColumnWidths({
                    position: maxPositionWidth,
                    score: maxScoreWidth
                });

                setData(tableData);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching leaderboard:', error);
                setLoading(false);
            }
        };

        fetchLeaderboard();
    }, []);

    const columns = [
        {
            title: '#',
            dataIndex: 'position',
            key: 'position',
            width: columnWidths.position,
            align: 'center',
            render: text => <div style={{
                ...centeredCellStyle,
                width: columnWidths.position,
                fontSize: '30px'
            }}>{text}</div>,
        },
        {
            title: 'Nickname',
            dataIndex: 'username',
            key: 'username',
            align: 'center',
            render: text => <div style={{
                ...centeredCellStyle,
                fontSize: '30px'
            }}>{text}</div>,
        },
        {
            title: 'Points',
            dataIndex: 'score',
            key: 'score',
            width: columnWidths.score,
            align: 'center',
            render: text => <div style={{
                ...centeredCellStyle,
                width: columnWidths.score,
                fontSize: '30px'
            }}>{text}</div>,
        },
    ];

    return (
        <div style={{
            width: '70%',
            height: '100%',
            position: 'relative',
            padding: "0px",
            margin: "0px"
        }}>
            <Table
                columns={columns}
                dataSource={data}
                loading={loading}
                pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    pageSizeOptions: ['10', '20', '50'],
                    showTotal: (total, range) => `${range[0]}-${range[1]} из ${total} игроков`,
                }}
                bordered
                scroll={{ y: 'calc(100vh - 180px)' }}
                style={{
                    height: '100%',
                    // overflow: 'auto',
                }}
                components={{
                    body: {
                        cell: (props) => <td {...props} style={{
                            ...props.style,
                            padding: '0',
                            borderBottom: '1px solid #f0f0f0'
                        }}/>
                    }
                }}
            />
        </div>
    );
}

export default Leaderboard;