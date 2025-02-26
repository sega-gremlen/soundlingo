import React from 'react';
import PropTypes from 'prop-types';

const ScoreBar = ({points}) => {
    const totalPoints = points.all_points;
    const totalValidRevealed = points.valid_points + points.revealed_points;

    const validPercentage = totalPoints > 0 ? (points.valid_points / totalPoints) * 100 : 0;
    const revealedPercentage = totalPoints > 0 ? (points.revealed_points / totalPoints) * 100 : 0;
    let remainingPercentage = 100 - validPercentage - revealedPercentage;

    // Убираем красную часть если сумма valid + revealed = all_points
    if (totalValidRevealed === totalPoints) {
        remainingPercentage = 0;
    }

    const renderText = (segmentWidth, value) => {
        const valueLength = value.toString().length;
        // Предполагаем, что каждый символ требует примерно 7% ширины сегмента
        const minWidthRequired = valueLength * 1;
        return segmentWidth >= minWidthRequired ? (
            <span>{value}</span>
        ) : null;
    };

    return (
        <div
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
                style={{
                    width: `${validPercentage}%`,
                    display: "flex",
                    alignItems: 'center',
                    justifyContent: "center",
                    backgroundColor: "rgb(131, 255, 131)"
                }}
            >
                {renderText(validPercentage, points.valid_points)}
            </div>
            <div
                style={{
                    width: `${revealedPercentage}%`,
                    display: "flex",
                    alignItems: 'center',
                    justifyContent: "center",
                    backgroundColor: "#ffe19a"
                }}
            >
                {renderText(revealedPercentage, points.revealed_points)}
            </div>
            {remainingPercentage > 0 && (
                <div
                    style={{
                        backgroundColor: "rgb(250, 151, 151)",
                        width: `${remainingPercentage}%`,
                        display: "flex",
                        alignItems: 'center',
                        justifyContent: "center",
                    }}
                >
                    {renderText(remainingPercentage, totalPoints - totalValidRevealed)}
                </div>
            )}
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