import React, {useEffect, useState} from 'react';
import {Table, Pagination} from 'antd';

const Leaderboard = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const response = await fetch('http://localhost:8000/leaderboard');
                const result = await response.json();

                const tableData = Object.entries(result).map(
                    ([username, score], index) => ({
                        username,
                        score,
                        position: index + 1,
                        key: username,
                    })
                );

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
            align: 'center',
            render: text => <div style={{fontSize: '20px'}}>{text}</div>,
        },
        {
            title: 'Nickname',
            dataIndex: 'username',
            key: 'username',
            align: 'center',
            render: text => <div style={{fontSize: '20px'}}>{text}</div>,
        },
        {
            title: 'Points',
            dataIndex: 'score',
            key: 'score',
            align: 'center',
            render: text => <div style={{fontSize: '20px', fontWeight: 'bold'}}>{text}</div>,
        },
    ];

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            maxWidth: '800px',
            minWidth: '300px',
            width: '100%',
            margin: '0 auto',
            alignItems: 'center',
            height: "100%",
            position: "absolute",
            marginTop: "10px",
        }}>
            <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={data.length}
                onChange={setCurrentPage}
                style={{marginBottom: '10px', textAlign: 'center'}}
            />
            {/*<h1 style={{ marginBottom: '20px' }}>Leaderboard</h1>*/}
            <Table
                columns={columns}
                dataSource={data.slice((currentPage - 1) * pageSize, currentPage * pageSize)}
                loading={loading}
                pagination={false}
                bordered
                style={{
                    backgroundColor: '#f0f0f0',
                    borderRadius: '8px',
                    width: "100%"
            }}
                rowClassName={() => 'custom-row'}
            />

        </div>
    );
};

export default Leaderboard;