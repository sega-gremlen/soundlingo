import React from 'react';
import PropTypes from 'prop-types';
import './score_bar.css'; // Подключаем CSS для стилей полоски

const ScoreBar = ({points}) => {
    const totalPoints = points.all_points;

    const validPercentage = totalPoints > 0 ? (points.valid_points / totalPoints) * 100 : 0;
    const revealedPercentage = totalPoints > 0 ? (points.revealed_points / totalPoints) * 100 : 0;
    const remainingPercentage = 100 - validPercentage - revealedPercentage;

    const renderText = (percentage, value) => {
        if (percentage > 1) {
            return <span
                className="segment-text">
                {value}</span>;
        }
        return null;
    };

    return (
        <div className="score-bar"
             style={{
                 display: "flex",
                 height: "15px",
                 width: "100%",
                 position: "sticky",
                 top: "0px",
                 zIndex: "5",
                 overflow: "hidden",
             }}>
            <div
                className="score-bar-segment valid"
                style={{
                    width: `${validPercentage}%`,
                    display: "flex",
                    alignItems: 'center',
                    justifyContent: "center",
                }}
            >
                {renderText(validPercentage, points.valid_points)}
            </div>
            <div
                className="score-bar-segment revealed"
                style={{
                    width: `${revealedPercentage}%`,
                    display: "flex",
                    alignItems: 'center',
                    justifyContent: "center",
                }}
            >
                {renderText(revealedPercentage, points.revealed_points)}
            </div>
            <div
                className="score-bar-segment remaining"
                style={{
                    width: `${remainingPercentage}%`,
                    display: "flex",
                    alignItems: 'center',
                    justifyContent: "center",
                }}
            >
                {renderText(remainingPercentage, totalPoints - points.valid_points - points.revealed_points)}
            </div>
        </div>
    );
};

ScoreBar.propTypes = {
    points: PropTypes.shape({
        all_points: PropTypes.number.isRequired,
        valid_points: PropTypes.number.isRequired,
        revealed_points: PropTypes.number.isRequired,
    }).isRequired,
};

export default ScoreBar;
