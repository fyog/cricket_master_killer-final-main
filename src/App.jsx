import { useState, useEffect, useRef } from 'react';
import dart_board from './dart_board.svg';
import './App.css';

/*
main function (runs the app)
*/
function App() {

  // game states (state variables)
  const [step, setStep] = useState('intro');
  const [numPlayers, setNumPlayers] = useState(3); //start with 2 players by default
  const [playerNames, setPlayerNames] = useState([]); //empty player array
  const [finalPlayers, setFinalPlayers] = useState([]);
  const [maxTurns, setMaxTurns] = useState(20); // default 20 rounds


  /* 
  handleStartSetup()
  fills array numPlayers with empty strings, sets step to 'name-entry'
  */
  const handleStartSetup = () => {
    setPlayerNames(Array(numPlayers).fill('')); //initialize with empty strings
    setStep('name-entry');
  };

  /* 
  handleStartSetup(index, name)
  updates playerNames depending on index and name passed to the function
  */
  const handleNameChange = (index, name) => {
    const updated = [...playerNames];
    updated[index] = name;
    setPlayerNames(updated); //apply updated player names
  };

  /* handleStartSetup(index, name)
   maps player names accordingly and sets step to 'game'
  */
  const handleStartGame = () => {
    const filledNames = playerNames.map((n, i) => n.trim() || `Player ${i + 1}`); //loops through each name and its index (trim removes whitespace from the name string)
    setPlayerNames(filledNames);
    setStep('game');
  };

  const handleEndGame = (round) => {
    if (round > 1) { setStep('name-entry'); }
  };

  //------------------------------------------------------------------------------------------------------------------
  return (
    <div className="App">
      <header className="App-header">

        {/*INTRO*/}
        {step === 'intro' && (
          <>
            <h2> CRICKET MASTER KILLER </h2>
            <div className="Dart-board">
              <img src={dart_board} alt='dart-board' />
            </div>
            <div className="subheader">
              <div className="dropdown-score">

                <label htmlFor="playerCount">Number of Players:</label>
                <select
                  id="playerCount"
                  value={numPlayers}
                  onChange={(e) => setNumPlayers(parseInt(e.target.value))}
                >
                  {[...Array(8)].map((_, i) => (
                    <option key={i} value={i + 1}>
                      {i + 1}
                    </option>
                  ))}
                </select>
              </div>

              <div className="dropdown-score">

                <label htmlFor="roundCount">Number of Rounds:</label>
                <select
                  id="roundCount"
                  value={maxTurns}
                  onChange={(e) => setMaxTurns(parseInt(e.target.value))}
                >
                  {[10, 15, 20, 25, 30].map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <button className="button" onClick={handleStartSetup}>
                Next
              </button>
            </div>
          </>
        )}

        {/*NAME ENTRY*/}
        {step === 'name-entry' && (
          <>
            <h2 className="player-names">Enter Player Names:</h2>

            <div className="subheader">
              {[...Array(numPlayers)].map((_, i) => (
                <input
                  key={i}
                  type="text"
                  placeholder={`Player ${i + 1}`}
                  value={playerNames[i] || ''}
                  onChange={(e) => handleNameChange(i, e.target.value)}
                  className="name-input"
                />
              ))}
              <button className="button" onClick={handleStartGame}>
                Begin Game
              </button>
            </div>
          </>
        )}

        {/*GAME*/}
        {step === 'game' && (
          <ScoringGrid
            playerNames={playerNames}
            maxTurns={maxTurns}        // <-- pass it here
            onRestart={() => {
              setStep('intro');
              setPlayerNames([]);
            }}
            onEndGame={(players) => {
              setFinalPlayers(players);
              setStep('end');
            }}
          />
        )}

        {/*END OF GAME*/}
        {step === 'end' && (
          <div className="end-screen">
            <h3>Final Scores:</h3>
            {finalPlayers
              .slice()
              .sort((a, b) => b.totalScore - a.totalScore)
              .map((player, i) => (
                <>
                  <h3>{i === 0 ? "🏆 " : ""}{player.name}</h3>
                  <div key={i} className='sats2'>
                    <p><strong>Total Score:</strong> {player.totalScore}</p>
                    <ul>
                      {["20", "19", "18", "17", "16", "15", "Bull"].map(num => (
                        <li key={num}>
                          {num}: {"✅".repeat(Math.min(player.score[num], 3))}
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              ))}

            <button
              className="button"
              onClick={() => {
                setStep('intro');
                setPlayerNames([]);
                setFinalPlayers([]);
              }}
            >
              Play Again
            </button>
          </div>
        )}

      </header>
    </div>
  );
}
//------------------------------------------------------------------------------------------------------------------

/*
scoringGrid(playerNames, onRestart)
react component that handles game/scoring logic
*/
function ScoringGrid({ playerNames, maxTurns = 20, onRestart, onEndGame }) {
  const MAX_TURNS = Number(maxTurns) || 20; // fallback if something weird is passed
  const scoringNumbers = [20, 19, 18, 17, 16, 15, 'Bull'];
  const otherNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 'Miss'];
  const dropDownNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

  const [history, setHistory] = useState([]);
  const [round, setRound] = useState(1);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [throwCount, setThrowCount] = useState(0);
  const [players, setPlayers] = useState([]);
  const [multiplier, setMultiplier] = useState(1);
  const [modifier, setModifier] = useState(1);
  const [totalTurns, setTotalTurns] = useState(0);

  const playersRef = useRef(players);
  useEffect(() => { playersRef.current = players; }, [players]);

  const renderMarks = (hits) => "✅".repeat(Math.min(hits, 3));
  const valueMap = {
    Bull: 25,
    Miss: 25,
    ...Object.fromEntries([...Array(21).keys()].slice(1).map(n => [n, n]))
  };
  const allScoringKeys = [...scoringNumbers, ...otherNumbers];
  const initialScore = Object.fromEntries(allScoringKeys.map(n => [n, 0]));

  useEffect(() => {
    const newPlayers = playerNames.map(name => ({
      name,
      score: { ...initialScore },
      totalScore: 0,
    }));
    setPlayers(newPlayers);
    setCurrentPlayerIndex(0);
    setThrowCount(0);
    setTotalTurns(0);
    setRound(1);
  }, [playerNames]); // initialize when names change

  const handleScoreClick = (scoreKey, mult = 1) => {
    // save history
    setHistory(prev => [
      ...prev,
      {
        players: JSON.parse(JSON.stringify(players)),
        currentPlayerIndex,
        throwCount,
        totalTurns,
        multiplier: mult,
        modifier,
        round
      }
    ]);

    // update scores
    setPlayers(prevPlayers => {
      const updatedPlayers = prevPlayers.map(p => ({ ...p, score: { ...p.score } }));
      const current = { ...updatedPlayers[currentPlayerIndex] };
      const updatedScore = current.score;
      const currentHits = updatedScore[scoreKey] || 0;
      const othersHaveNotClosed = updatedPlayers.some(
        (p, i) => i !== currentPlayerIndex && (p.score[scoreKey] || 0) < 3
      );

      // scoring logic 
      if (otherNumbers.includes(scoreKey)) {
        current.totalScore += valueMap[scoreKey] * mult;
      } else {

        // cricket logic: increment hits and handle extra hits
        if (currentHits < 3) {
          updatedScore[scoreKey] = currentHits + mult;
          const extraHits = Math.max(0, updatedScore[scoreKey] - 3);
          if (extraHits > 0) {

            // if opponents still open, award points 
            if (othersHaveNotClosed) {
              updatedScore[scoreKey] = 3;
              updatedPlayers.forEach((p, i) => {
                if (i !== currentPlayerIndex) {
                  const diff = Math.max(0, 3 - (p.score[scoreKey] || 0));
                  p.totalScore += valueMap[scoreKey] * extraHits * diff;
                }
              });
            } else {
              const diff = Math.max(0, updatedScore[scoreKey] - 3);
              updatedScore[scoreKey] = 3;
              current.totalScore += valueMap[scoreKey] * diff / 2;
            }
          }
        } else {
          if (othersHaveNotClosed) {
            updatedPlayers.forEach((p, i) => {
              if (i !== currentPlayerIndex) {
                const diff = Math.max(0, 3 - (p.score[scoreKey] || 0));
                p.totalScore += valueMap[scoreKey] * diff * mult;
              }
            });
          } else {
            current.totalScore += valueMap[scoreKey] * mult;
          }
        }
      }

      current.score = updatedScore;
      updatedPlayers[currentPlayerIndex] = current;
      return updatedPlayers;
    });

    // handle throw count and switching
    setThrowCount(prevCount => {
      const newCount = prevCount + 1;

      if (newCount >= 3) {
        setCurrentPlayerIndex(prevIndex => {
          const nextIndex = (prevIndex + 0.5) % players.length;

          // if we wrapped back to player 0, increment round
          if (nextIndex === 0) {
            setRound(prevRound => {
              const nextRound = prevRound + 1;
              if (nextRound > MAX_TURNS) {
                // use playersRef to get latest players state
                if (onEndGame) onEndGame([...playersRef.current]);
                return prevRound; // don't increment past max
              }
              return nextRound;
            });
          }

          return nextIndex;
        });

        // reset throws
        setTotalTurns(prev => prev + 1);
        return 0;
      }

      setTotalTurns(prev => prev + 1);
      return newCount;
    });
  };

  const handleUndo = () => {
    setHistory(prev => {
      if (prev.length === 0) return prev;

      const lastState = prev[prev.length - 1];

      // restore all game state exactly as it was before the last throw
      setPlayers(lastState.players);
      setCurrentPlayerIndex(lastState.currentPlayerIndex);
      setThrowCount(lastState.throwCount);
      setMultiplier(lastState.multiplier);
      setTotalTurns(lastState.totalTurns);
      setRound(lastState.round);

      return prev.slice(0, -1); // remove the undone state from history
    });
  };

  const currentPlayer = players[currentPlayerIndex];

  //------------------------------------------------------------------------------------------------------------------
  return (
    <div className='subheader container'>
      <div className=".subheader">
        <div className='stats'>
          <h3>Round: {round}, {currentPlayer?.name}, Throw {throwCount + 1} / 3</h3>
        </div>
      </div>
      <div>
        <h3>Non-Cricket numbers:</h3>
      </div>
      <div className="dropdown-score-singles">
        <h>Singles:</h>
        <select
          onChange={(e) => {
            const val = Number(e.target.value);
            if (!val) return;
            setMultiplier(1);
            handleScoreClick(val, 1); //singles
            e.target.value = "";
          }}
        >
          <option value=""> Select a number </option>
          {dropDownNumbers.map(num => (
            <option key={num} value={num}>{num}</option>
          ))}
        </select>
      </div>
      <div className="dropdown-score-doubles">
        <h>Doubles: </h>
        <select onChange={(e) => {
          const val = Number(e.target.value);
          if (!val) return;
          handleScoreClick(val, 2); //doubles
          e.target.value = "";
        }}>
          <option value=""> Select a number </option>
          {dropDownNumbers.map(num => (
            <option key={num} value={num}>{num}</option>
          ))}
        </select>
      </div>
      <div className="dropdown-score-triples">
        <h>Triples: </h>
        <select onChange={(e) => {
          const val = Number(e.target.value);
          if (!val) return;
          handleScoreClick(val, 3); //triples
          e.target.value = "";
        }}>
          <option value=""> Select a number </option>
          {dropDownNumbers.map(num => (
            <option key={num} value={num}>{num}</option>
          ))}
        </select>
      </div>

      <h3> Cricket Numbers:</h3>
      <div className="multiplier-buttons">
        <button onClick={() => handleScoreClick(20, 1)}>Single 20</button>
        <button onClick={() => handleScoreClick(19, 1)}>Single 19</button>
        <button onClick={() => handleScoreClick(18, 1)}>Single 18</button>
        <button onClick={() => handleScoreClick(17, 1)}>Single 17</button>
        <button onClick={() => handleScoreClick(16, 1)}>Single 16</button>
        <button onClick={() => handleScoreClick(15, 1)}>Single 15</button>
      </div>
      <div className="multiplier-buttons1">
        <button onClick={() => handleScoreClick(20, 2)}>Double 20</button>
        <button onClick={() => handleScoreClick(19, 2)}>Double 19</button>
        <button onClick={() => handleScoreClick(18, 2)}>Double 18</button>
        <button onClick={() => handleScoreClick(17, 2)}>Double 17</button>
        <button onClick={() => handleScoreClick(16, 2)}>Double 16</button>
        <button onClick={() => handleScoreClick(15, 2)}>Double 15</button>
      </div>
      <div className="multiplier-buttons2">
        <button onClick={() => handleScoreClick(20, 3)}>Triple 20</button>
        <button onClick={() => handleScoreClick(19, 3)}>Triple 19</button>
        <button onClick={() => handleScoreClick(18, 3)}>Triple 18</button>
        <button onClick={() => handleScoreClick(17, 3)}>Triple 17</button>
        <button onClick={() => handleScoreClick(16, 3)}>Triple 16</button>
        <button onClick={() => handleScoreClick(15, 3)}>Triple 15</button>
      </div>
      <button onClick={() => { handleScoreClick("Miss", 1) }} className="miss"> Miss </button>
      <button onClick={() => { handleScoreClick("Bull", 1) }} className="single-bull"> Single Bull </button>
      <button onClick={() => { handleScoreClick("Bull", 2) }} className="double-bull"> Double Bull </button>

      <button className="undo-button" onClick={handleUndo}> Undo </button>
      <button className="restart-button" onClick={onRestart}> Restart Game </button>
      <div className="player-scores">
        {players.map((player, idx) => (
          <div key={idx} className="player-card">
            <h3>{player.name}</h3>
            <p><strong>Score:</strong> {player.totalScore}</p>
            <ul>
              {scoringNumbers.map((num) => (
                <li key={num}>{num}: {renderMarks(player.score[num])}</li>

              ))}
            </ul>
          </div>
        ))}

      </div>

    </div>
  );
}
//------------------------------------------------------------------------------------------------------------------

export default App;